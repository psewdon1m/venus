/** Host control only; browser, API, fixture and database all execute inside isolated Docker. */
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,openSync,closeSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {selection,validateBrowserReport,validateSelfActionsReport} from '../tests/p05/report-contract.mjs';
const probe=process.argv.includes('--probe'),allowDirty=process.argv.includes('--allow-dirty');
const chat=process.argv.includes('--chat');
const catalog=process.argv.includes('--catalog');
const selfActions=process.argv.includes('--self-actions');
const music=process.argv.includes('--music');
const cinema=process.argv.includes('--cinema'),calls=process.argv.includes('--calls'),mediaSuite=cinema||calls;
if([probe,chat,catalog,selfActions,music,cinema,calls].filter(Boolean).length>1)throw new Error('Choose one test mode');
const selected=selection(process.argv,process.env),engine=selected.engine,selectedCase=selected.selectedCase;
if(selfActions&&process.argv.some(arg=>arg.startsWith('--engine=')||arg.startsWith('--case=')))throw new Error('Self-actions suite does not accept browser selectors');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const inventory=()=>JSON.parse(execFileSync(process.env.PYTHON??'python',['-B','-c',"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;x=inventory();print(json.dumps({'files':x,'source_identity_sha256':identity(x)},sort_keys=True))"],{encoding:'utf8',maxBuffer:8*1024*1024}));
const source=git('rev-parse','HEAD'),dirty=git('status','--porcelain')!=='';
if(dirty&&!allowDirty)throw new Error('Clean source required; --allow-dirty is explicitly preflight only');
const inputs=inventory(),project='venus-p05-'+randomBytes(6).toString('hex'),directory=mkdtempSync(join(tmpdir(),'venus-p05-owned-'));
const output=resolve('.artifacts/p05/'+project);mkdirSync(output,{recursive:true});
console.log(JSON.stringify({phase:'starting',output,probe_only:probe,chat_only:chat,catalog_only:catalog,self_actions_only:selfActions,selected_engine:engine??'all',selected_case:selectedCase??null}));
const env={...selected.env,VENUS_P05_DB_PASSWORD_FILE:join(directory,'db-password'),VENUS_P05_ARTIFACT_DIRECTORY:output,VENUS_MEDIA_BROWSER_CPUS:calls?'12':'8'};
writeFileSync(env.VENUS_P05_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});
writeFileSync(join(output,'inputs-before.json'),JSON.stringify({source_sha:source,source_dirty:dirty,...inputs},null,2));
let status='FAIL',cleanup,image,bodyError;
function cleanupDirectory(){if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.startsWith(join(tmpdir(),'venus-p05-owned-')))throw new Error('Unsafe owned temporary path');rmSync(directory,{recursive:true,force:true});}
function command(args,log,timeout=1200000){const path=join(output,log),fd=openSync(path,'w');let result;try{result=spawnSync('docker',args,{env,timeout,stdio:['ignore',fd,fd]});}finally{closeSync(fd);}if(result.error||result.status!==0)throw new Error('Docker command failed, exit '+result.status+'; '+log+(result.error?'; '+result.error.code:''));return readFileSync(path,'utf8');}
function removeOwnedContainer(role){
  const name=project+'-'+role,inspect=spawnSync('docker',['container','inspect',name],{encoding:'utf8',timeout:30000});
  if(inspect.status===0){const rows=JSON.parse(inspect.stdout);if(rows.length!==1||rows[0].Name!=='/'+name||rows[0].Config?.Labels?.['venus.p05.project']!==project||rows[0].Config?.Labels?.['venus.p05.role']!==role)throw new Error('Owned '+role+' container identity unconfirmed');command(['container','rm','--force',name],role+'-cleanup.txt',30000);}
  else if(!/No such (object|container)/i.test((inspect.stderr??'')+(inspect.stdout??'')))throw new Error('Owned browser cleanup state unconfirmed');
}
const compose=extra=>['compose','--project-name',project,'--file','infra/venus/compose.p05-tests.yml',...(mediaSuite?['--file','infra/venus/compose.p09-tests.yml']:[]),...extra];
/** Fixed fault controls only, scoped to this Compose media namespace. No shell. */
async function cinemaCommand(args){
 const media=command(compose(['ps','--quiet','media']),'media-id.txt').trim();if(!/^[a-f0-9]{64}$/.test(media))throw Error('Owned media missing');
 const owned=JSON.parse(command(['inspect',media],'media-inspect.txt'))[0];if(owned.Config?.Labels?.['com.docker.compose.project']!==project||owned.Config?.Labels?.['com.docker.compose.service']!=='media')throw Error('Media namespace ownership missing');
 const fd=openSync(join(output,calls?'calls-tests.txt':'cinema-tests.txt'),'w'),child=spawn('docker',args,{env,stdio:['ignore',fd,fd]});let last='',busy=false;
 const requestFile=join(output,'network-request.json'),ack=join(output,'network-ack.json');
 const controls={netem:[['tc','qdisc','replace','dev','eth0','root','handle','1:','prio','bands','2','priomap',...Array(16).fill('0')],['tc','qdisc','replace','dev','eth0','parent','1:2','handle','20:','netem','delay','50ms','10ms','loss','0.5%','rate','4mbit'],...['7881','7882'].map(port=>['tc','filter','replace','dev','eth0','parent','1:','protocol','ip','prio',port,'u32','match','ip','sport',port,'0xffff','flowid','1:2'])],udp_off:[['iptables','-I','INPUT','-p','udp','--dport','7882','-j','DROP']],admin_off:[['iptables','-I','OUTPUT','-d','127.0.0.1','-p','tcp','--dport','7880','-j','REJECT']],db_snapshot:[],db_restore:[],clear:[['iptables','-D','OUTPUT','-d','127.0.0.1','-p','tcp','--dport','7880','-j','REJECT'],['tc','qdisc','del','dev','eth0','root'],['iptables','-D','INPUT','-p','udp','--dport','7882','-j','DROP']]};
 const timer=setInterval(()=>{if(busy||!existsSync(requestFile))return;busy=true;try{const r=JSON.parse(readFileSync(requestFile));if(typeof r.id!=='string'||!/^[a-f0-9-]{36}$/.test(r.id)||r.id===last||!Object.hasOwn(controls,r.action))return;last=r.id;let status='PASS';if(r.action.startsWith('db_')){const db=command(compose(['ps','--quiet','db']),'p09-db-id.txt').trim();if(!/^[a-f0-9]{64}$/.test(db))throw Error('Owned PG missing');if(r.action==='db_snapshot')command(['exec',db,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl','--file=/tmp/p09-live.dump'],'p09-live-dump.txt');else command(['exec',db,'pg_restore','-U','venus','-d','venus','--clean','--if-exists','--single-transaction','--exit-on-error','--no-owner','--no-acl','/tmp/p09-live.dump'],'p09-old-live-restore.txt');}for(const operation of controls[r.action]){const run=spawnSync('docker',['exec','--user','0',media,...operation],{timeout:5000,encoding:'utf8'});if((run.status!==0||run.error)&&r.action!=='clear')status='FAIL';}writeFileSync(ack,JSON.stringify({id:r.id,action:r.action,status}));}catch{/* Partial owned fixture write is retried. */}finally{busy=false;}},100);
 const deadline=setTimeout(()=>child.kill('SIGKILL'),360000);
 try{const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});if(code!==0)throw Error((calls?'P11':'P09')+' Docker test exit '+code+'; '+(calls?'calls-tests.txt':'cinema-tests.txt'));}finally{clearInterval(timer);clearTimeout(deadline);closeSync(fd);}
}
function musicBackupRestore(){
  const db=command(compose(['ps','--quiet','db']),'music-db-id.txt').trim();if(!/^[a-f0-9]{64}$/.test(db))throw Error('Owned database ID missing');
  const sql="SELECT coalesce(json_agg(t ORDER BY room_id)::text,'[]') FROM room_music_state t;",query=(database,log)=>command(['exec',db,'psql','-X','-U','venus','-d',database,'-At','-v','ON_ERROR_STOP=1','-c',sql],log).trim();
  const before=query('venus','music-backup-before.txt');if(JSON.parse(before).length===0)throw Error('Music backup fixture empty');
  command(['exec',db,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl','--file=/tmp/p08-music.dump'],'music-backup-dump.txt');
  command(['exec',db,'createdb','-U','venus','venus_p08_restore'],'music-restore-create.txt');
  command(['exec',db,'pg_restore','-U','venus','-d','venus_p08_restore','--single-transaction','--exit-on-error','--no-owner','--no-acl','/tmp/p08-music.dump'],'music-restore.txt');
  const after=query('venus_p08_restore','music-backup-after.txt');if(after!==before)throw Error('Restored Music data differ');
  command(['exec',db,'dropdb','-U','venus','venus_p08_restore'],'music-restore-drop.txt');
  writeFileSync(join(output,'music-backup-restore.json'),JSON.stringify({status:'PASS',transport:'real PostgreSQL16 custom dump/restore inside owned Docker',rows:JSON.parse(before).length,before_sha256:createHash('sha256').update(before).digest('hex'),after_sha256:createHash('sha256').update(after).digest('hex'),external_audio_files_in_backup:false},null,2));
}
try{
  command(['build',...(mediaSuite&&process.env.VENUS_P09_BROWSER_BASE?['--build-arg','VENUS_BROWSER_BASE='+process.env.VENUS_P09_BROWSER_BASE]:[]),'--platform','linux/amd64','--target',probe?'dependencies':'runtime','-f','infra/venus/Dockerfile.p05-tests','-t',project+':local','.'],'build.txt');
  image=command(['image','inspect',project+':local','--format','{{.Id}}'],'image-id.txt').trim();if(!/^sha256:[a-f0-9]{64}$/.test(image))throw new Error('Exact image ID missing');env.VENUS_P05_IMAGE=image;if(mediaSuite)command(['run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--entrypoint','node',image,'tools/media-inventory.mjs'],'media-binary-and-fixture-os.json');
  if(probe)command(['run','--rm','--name',project+'-probe','--label','venus.p05.project='+project,'--label','venus.p05.role=probe','--init','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--network','none','--shm-size','1g','--tmpfs','/tmp:size=1g,mode=1777,exec','--tmpfs','/home/node:size=64m,uid=1000,gid=1000',image],'browser-probe.txt');
  else{if(mediaSuite)command(compose(['up','--detach','media']),'media-start.txt');command(compose(['up','--detach','--wait','--wait-timeout','120','db']),'database-start.txt');const suite=chat?'tests/p05-chat/integration.mjs':catalog?'tests/p05-catalog/integration.mjs':selfActions?'tests/p05-self-actions/integration.mjs':music?'tests/p08/integration.mjs':calls?'tests/p11/integration.mjs':cinema?'tests/p09/integration.mjs':null;const args=compose(['run',...(mediaSuite?['--use-aliases']:[]),'--rm','--name',project+'-browser','--label','venus.p05.project='+project,'--label','venus.p05.role=browser','browser',...(suite?['node','--test','--test-concurrency=1',...(mediaSuite?['tests/p06/operator.test.mjs','tests/p09/authority.test.mjs','tests/p09/operator.test.mjs']:[]),suite]:[])]);if(mediaSuite)await cinemaCommand(args);else command(args,chat?'chat-tests.txt':catalog?'catalog-tests.txt':selfActions?'self-actions-tests.txt':music?'music-tests.txt':'browser-tests.txt');if(!suite){const browserReport=JSON.parse(readFileSync(join(output,'browser-report.json'),'utf8'));validateBrowserReport(browserReport,selected);}if(music){const m=JSON.parse(readFileSync(join(output,'p08-report.json'),'utf8'));if(m.status!=='PASS'||m.runtime_cleanup!=='completed'||m.selected_engine!==engine||m.records.length<(engine==='all'?10:engine==='chromium'?8:1)||!m.records.every(row=>row.status==='PASS'))throw Error('P08 targeted evidence missing');}if(mediaSuite){const m=JSON.parse(readFileSync(join(output,calls?'p11-report.json':'p09-report.json'),'utf8'));if(m.status!=='PASS'||m.runtime_cleanup!=='completed'||!m.records.length||!m.records.every(row=>row.status==='PASS'))throw Error((calls?'P11':'P09')+' evidence missing');}if(selfActions)validateSelfActionsReport(JSON.parse(readFileSync(join(output,'self-actions-report.json'),'utf8')));}
  if(music)musicBackupRestore();
  status='PASS';
}catch(error){bodyError=error;}
finally{
  try{
    if(image){removeOwnedContainer(probe?'probe':'browser');if(!probe)command(compose(['down','--volumes','--remove-orphans','--timeout','10']),'cleanup.txt',120000);}
    cleanupDirectory();cleanup='completed';
  }catch(error){status='FAIL';cleanup='failed';bodyError??=error;}
  const after=inventory(),sameSource=source===git('rev-parse','HEAD')&&after.source_identity_sha256===inputs.source_identity_sha256&&dirty===(git('status','--porcelain')!=='');
  if(!sameSource||bodyError)status='FAIL';
  writeFileSync(join(output,'inputs-after.json'),JSON.stringify(after,null,2));
  writeFileSync(join(output,'runner.json'),JSON.stringify({source_sha:source,source_dirty:dirty,preflight_only:dirty,source_identity_sha256:inputs.source_identity_sha256,source_identity_after:after.source_identity_sha256,source_unchanged:sameSource,isolated_project:project,image,probe_only:probe,chat_only:chat,catalog_only:catalog,self_actions_only:selfActions,selected_engine:engine,selected_case:selectedCase,music_only:music,cinema_only:cinema,calls_only:calls,full_browser_matrix:!probe&&!chat&&!catalog&&!selfActions&&!music&&!cinema&&!calls&&engine==='all'&&!selectedCase,synthetic_fixture_only:true,cleanup,status,error:bodyError?.message??null},null,2));
  console.log(JSON.stringify({output,status,cleanup,preflight_only:dirty,probe_only:probe}));
}
process.exitCode=status==='PASS'?0:1;
