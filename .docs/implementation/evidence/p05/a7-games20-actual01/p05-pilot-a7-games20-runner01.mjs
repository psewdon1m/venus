import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,openSync,closeSync,unlinkSync,rmdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
const root=process.cwd(),id=randomBytes(6).toString('hex'),project='venus-topic-games-'+id,out=resolve('.artifacts/p05',project);
mkdirSync(out,{recursive:true});
const secretDirectory=mkdtempSync(join(tmpdir(),'venus-topics-secret-')),secret=join(secretDirectory,'password');writeFileSync(secret,randomBytes(32).toString('hex'));
const json=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n');
function command(exe,args,log,allow=false){
 const fd=log?openSync(join(out,log),'a'):null;let r;
 try{r=spawnSync(exe,args,{cwd:root,stdio:log?['ignore',fd,fd]:'pipe',encoding:'utf8',timeout:1200000,maxBuffer:16*1024*1024});}finally{if(fd!==null)closeSync(fd);}
 if(!allow&&r.status!==0)throw new Error(exe+' exit '+r.status+' '+(r.error?.code??''));return r;
}
function inventory(){return JSON.parse(command('C:/.projects/venus/.venv/Scripts/python.exe',['-B','-c','import sys,json;sys.path.insert(0,"tools");from stage_inventory import inventory,identity;f=inventory();print(json.dumps({"files":f,"identity":identity(f)}))']).stdout);}
function resources(){return Object.fromEntries([['containers',['ps','-aq']],['networks',['network','ls','-q']],['volumes',['volume','ls','-q']]].map(([name,args])=>[name,command('docker',[...args,'--filter','label=com.docker.compose.project='+project]).stdout.trim().split(/\s+/).filter(Boolean)]));}
let before,image,status='FAIL',cleanup='not_started',error=null,started=false;
const config=join(out,'compose.json'),compose=['compose','-p',project,'-f',config];
try{
 const existing=resources();if(Object.values(existing).some(a=>a.length))throw new Error('Existing project collision');
 before=inventory();json('inputs-before.json',before);console.log('START '+project+' source '+before.identity);
 if(before.identity!=='b2100207d12e90615fb0a62f4b5e410d9a4c8c20fc2db2bc1eae4bc409dca5b6')throw Error('Unexpected materialized A7 source');writeFileSync(join(out,'image-id.txt'),'sha256:9f5a417c8333b4e6340a07d2dc06c2df0a65e2cd8665e47548d5dda187f52937');
 image=readFileSync(join(out,'image-id.txt'),'utf8').trim();if(!/^sha256:[a-f0-9]{64}$/.test(image))throw new Error('Invalid image');
 json('image-inspect.json',JSON.parse(command('docker',['image','inspect',image]).stdout));
 json('compose.json',{services:{db:{image:'postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8',environment:{POSTGRES_DB:'venus',POSTGRES_USER:'venus',POSTGRES_PASSWORD_FILE:'/run/secrets/db_password'},secrets:['db_password'],volumes:['postgres-data:/var/lib/postgresql/data'],networks:['isolated'],mem_limit:'512m',cpus:1,healthcheck:{test:['CMD-SHELL','pg_isready -U venus -d venus'],interval:'1s',timeout:'2s',retries:60}},api:{image,user:'1000:1000',read_only:true,cap_drop:['ALL'],security_opt:['no-new-privileges:true'],mem_limit:'768m',cpus:1,pids_limit:96,tmpfs:['/tmp:size=128m,mode=1777','/home/node:size=32m,uid=1000,gid=1000'],environment:{DB_HOST:'db',DB_PASSWORD_FILE:'/run/secrets/db_password',VENUS_P05_ISOLATED_FIXTURE:'1',P05_ARTIFACT_DIRECTORY:'/artifacts'},secrets:['db_password'],volumes:[{type:'bind',source:out,target:'/artifacts'}],networks:['isolated'],command:['node','tests/p05-topic-games/integration.mjs']}},secrets:{db_password:{file:secret}},volumes:{'postgres-data':{}},networks:{isolated:{internal:true}}});
 started=true;command('docker',[...compose,'up','-d','--wait','db'],'database-start.txt');console.log('DATABASE_READY '+project+' image '+image);
 const db=resources();json('running-db.json',JSON.parse(command('docker',['inspect',...db.containers]).stdout));
 command('docker',[...compose,'run','--rm','--no-deps','api'],'tests.txt');
 const report=JSON.parse(readFileSync(join(out,'topic-games-report.json'),'utf8'));if(report.schema_version!==1||report.suite!=='P05_TOPIC_GAMES'||report.status!=='PASS'||new Set(report.checks.map(c=>c.id)).size!==20||report.checks.length!==20||report.checks.some(c=>c.status!=='PASS'))throw new Error('Report gate failed');
 const after=inventory();json('inputs-after.json',after);if(after.identity!==before.identity||JSON.stringify(after.files)!==JSON.stringify(before.files))throw new Error('Included source changed');
 status='PASS';
}catch(e){error=e.message;process.exitCode=1;console.log('FAIL '+error);}
finally{
 try{
  if(started){const owned=resources();for(const [kind,ids] of Object.entries(owned)){if(!ids.length)continue;const args=kind==='containers'?['inspect']:kind==='networks'?['network','inspect']:['volume','inspect'];const detail=JSON.parse(command('docker',[...args,...ids]).stdout);for(const resource of detail){if((resource.Config?.Labels??resource.Labels)?.['com.docker.compose.project']!==project)throw new Error('Ownership mismatch');}json('cleanup-'+kind+'-inspect.json',detail);}
   command('docker',[...compose,'down','--volumes','--remove-orphans'],'cleanup.txt');}
  const remaining=resources();json('resources-after-cleanup.json',remaining);if(Object.values(remaining).some(a=>a.length))throw new Error('Owned resources remain');cleanup='completed';
 }catch(e){cleanup='failed';error=(error??'')+' cleanup:'+e.message;process.exitCode=1;}
 unlinkSync(secret);rmdirSync(secretDirectory);
 json('runner.json',{schema_version:1,status,project,source_identity:before?.identity,image,cleanup,error,scope:'DIRTY_SYNTHETIC_TOPIC_GAMES_CORE_DIAGNOSTIC',full_stage_acceptance:false});
 console.log('TERMINAL '+JSON.stringify({status,cleanup,out,error}));
}
