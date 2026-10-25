/** Host control only; browser, API, fixture and database all execute inside isolated Docker. */
import {spawnSync,execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,openSync,closeSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {selection,validateBrowserReport,validateSelfActionsReport} from '../tests/p05/report-contract.mjs';
const probe=process.argv.includes('--probe'),allowDirty=process.argv.includes('--allow-dirty');
const chat=process.argv.includes('--chat');
const catalog=process.argv.includes('--catalog');
const selfActions=process.argv.includes('--self-actions');
const music=process.argv.includes('--music');
if([probe,chat,catalog,selfActions,music].filter(Boolean).length>1)throw new Error('Choose one test mode');
const selected=selection(process.argv,process.env),engine=selected.engine,selectedCase=selected.selectedCase;
if(selfActions&&process.argv.some(arg=>arg.startsWith('--engine=')||arg.startsWith('--case=')))throw new Error('Self-actions suite does not accept browser selectors');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const inventory=()=>JSON.parse(execFileSync(process.env.PYTHON??'python',['-B','-c',"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;x=inventory();print(json.dumps({'files':x,'source_identity_sha256':identity(x)},sort_keys=True))"],{encoding:'utf8',maxBuffer:8*1024*1024}));
const source=git('rev-parse','HEAD'),dirty=git('status','--porcelain')!=='';
if(dirty&&!allowDirty)throw new Error('Clean source required; --allow-dirty is explicitly preflight only');
const inputs=inventory(),project='venus-p05-'+randomBytes(6).toString('hex'),directory=mkdtempSync(join(tmpdir(),'venus-p05-owned-'));
const output=resolve('.artifacts/p05/'+project);mkdirSync(output,{recursive:true});
console.log(JSON.stringify({phase:'starting',output,probe_only:probe,chat_only:chat,catalog_only:catalog,self_actions_only:selfActions,selected_engine:engine??'all',selected_case:selectedCase??null}));
const env={...selected.env,VENUS_P05_DB_PASSWORD_FILE:join(directory,'db-password'),VENUS_P05_ARTIFACT_DIRECTORY:output};
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
const compose=extra=>['compose','--project-name',project,'--file','infra/venus/compose.p05-tests.yml',...extra];
try{
  command(['build','--platform','linux/amd64','--target',probe?'dependencies':'runtime','-f','infra/venus/Dockerfile.p05-tests','-t',project+':local','.'],'build.txt');
  image=command(['image','inspect',project+':local','--format','{{.Id}}'],'image-id.txt').trim();if(!/^sha256:[a-f0-9]{64}$/.test(image))throw new Error('Exact image ID missing');env.VENUS_P05_IMAGE=image;
  if(probe)command(['run','--rm','--name',project+'-probe','--label','venus.p05.project='+project,'--label','venus.p05.role=probe','--init','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--network','none','--shm-size','1g','--tmpfs','/tmp:size=1g,mode=1777,exec','--tmpfs','/home/node:size=64m,uid=1000,gid=1000',image],'browser-probe.txt');
  else{command(compose(['up','--detach','--wait','--wait-timeout','120','db']),'database-start.txt');const suite=chat?'tests/p05-chat/integration.mjs':catalog?'tests/p05-catalog/integration.mjs':selfActions?'tests/p05-self-actions/integration.mjs':music?'tests/p08/integration.mjs':null;command(compose(['run','--rm','--name',project+'-browser','--label','venus.p05.project='+project,'--label','venus.p05.role=browser','browser',...(suite?['node','--test',suite]:[])]),chat?'chat-tests.txt':catalog?'catalog-tests.txt':selfActions?'self-actions-tests.txt':music?'music-tests.txt':'browser-tests.txt');if(!suite){const browserReport=JSON.parse(readFileSync(join(output,'browser-report.json'),'utf8'));validateBrowserReport(browserReport,selected);}if(music){const m=JSON.parse(readFileSync(join(output,'p08-report.json'),'utf8'));if(m.status!=='PASS'||m.runtime_cleanup!=='completed'||m.records.length<8||!m.records.every(row=>row.status==='PASS'))throw Error('P08 targeted evidence missing');}if(selfActions)validateSelfActionsReport(JSON.parse(readFileSync(join(output,'self-actions-report.json'),'utf8')));}
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
  writeFileSync(join(output,'runner.json'),JSON.stringify({source_sha:source,source_dirty:dirty,preflight_only:dirty,source_identity_sha256:inputs.source_identity_sha256,source_identity_after:after.source_identity_sha256,source_unchanged:sameSource,isolated_project:project,image,probe_only:probe,chat_only:chat,catalog_only:catalog,self_actions_only:selfActions,selected_engine:engine,selected_case:selectedCase,music_only:music,full_browser_matrix:!probe&&!chat&&!catalog&&!selfActions&&!music&&engine==='all'&&!selectedCase,synthetic_fixture_only:true,cleanup,status,error:bodyError?.message??null},null,2));
  console.log(JSON.stringify({output,status,cleanup,preflight_only:dirty,probe_only:probe}));
}
process.exitCode=status==='PASS'?0:1;
