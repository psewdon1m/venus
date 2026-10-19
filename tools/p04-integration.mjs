import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
// Compile the actual checkout before importing ignored dist files in the child.
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b','--force'],{stdio:'inherit'});
const inventory=()=>JSON.parse(execFileSync(process.env.PYTHON??'python',['-B','-c',"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;files=inventory();print(json.dumps({'files':files,'source_identity_sha256':identity(files)},sort_keys=True))"],{encoding:'utf8',maxBuffer:4*1024*1024}));
const inputs=inventory(),sourceDirty=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0;
const directory=mkdtempSync(join(tmpdir(),'venus-p04-test-')),project='venus-p04-'+randomBytes(6).toString('hex');
const env={...process.env,VENUS_P04_INTEGRATION:'1',VENUS_P02_INTEGRATION:'1',VENUS_DB_PASSWORD_FILE:join(directory,'db-password'),KEYRING_FILE:join(directory,'keyring.json'),DELETION_LEDGER_FILE:join(directory,'deletions.jsonl'),P02_CLOCK_FILE:join(directory,'clock'),P04_LEDGER_FILE:join(directory,'catalog-revocations.jsonl'),P04_PAUSE_FILE:join(directory,'pause'),P04_TEST_DIRECTORY:directory,P04_SOURCE_SHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),P04_PROJECT:project};
const args=['compose','--project-name',project,'--file','infra/venus/compose.integration.yml'];
env.P04_HTTP_PAUSE_FILE=join(directory,'http-pause');
const docker=more=>execFileSync('docker',[...args,...more],{env,encoding:'utf8'});
mkdirSync('.artifacts/p04',{recursive:true});let started=false,status=1,cleanup;
const catalogDirectory='.artifacts/p04/catalog-'+project;
writeFileSync('.artifacts/p04/source-inputs.json',JSON.stringify({...inputs,source_sha:env.P04_SOURCE_SHA,source_dirty:sourceDirty},null,2));
function cleanupDirectory() {
  if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.includes('venus-p04-test-')) throw new Error('Unsafe owned cleanup path');
  rmSync(directory,{recursive:true,force:true});
}
try {
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});
  writeFileSync(env.KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o444});
  writeFileSync(env.DELETION_LEDGER_FILE,'');writeFileSync(env.P04_LEDGER_FILE,'');writeFileSync(env.P04_PAUSE_FILE,'go');writeFileSync(env.P04_HTTP_PAUSE_FILE,'go');writeFileSync(env.P02_CLOCK_FILE,String(Date.now()));
  console.log('P04 isolated owned Docker scope: '+project);started=true;docker(['up','-d','--wait','--wait-timeout','120']);
  const id=docker(['ps','-q','db']).trim(),inspected=JSON.parse(execFileSync('docker',['inspect',id],{encoding:'utf8'}))[0],port=inspected.NetworkSettings.Ports['5432/tcp'][0];
  env.P04_DB_CONTAINER=id;
  if(port.HostIp!=='127.0.0.1') throw new Error('Expected loopback PostgreSQL');
  env.DB_HOST='127.0.0.1';env.DB_PORT=port.HostPort;env.DB_PASSWORD_FILE=env.VENUS_DB_PASSWORD_FILE;
  status=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/p04/runtime.integration.test.mjs'],{env,stdio:'inherit'}).status??1;
  if(status===0) status=spawnSync(process.execPath,['tools/card-catalog.mjs','draft-check','.docs/content/p04/cards',catalogDirectory],{env,stdio:'inherit'}).status??1;
} finally {
  try {if(started) docker(['down','--volumes','--remove-orphans','--timeout','10']);cleanup='completed';}
  catch(error) {status=1;cleanup='failed';console.error(error.message);}
  cleanupDirectory();
  const finalIdentity=inventory().source_identity_sha256,unchanged=finalIdentity===inputs.source_identity_sha256;if(!unchanged) status=1;
  writeFileSync('.artifacts/p04/runtime-runner.json',JSON.stringify({source_sha:env.P04_SOURCE_SHA,source_identity_sha256:inputs.source_identity_sha256,source_identity_after:finalIdentity,source_unchanged:unchanged,source_dirty:sourceDirty,forced_runtime_build:true,catalog_directory:catalogDirectory,full_draft_check_command:'node tools/card-catalog.mjs draft-check .docs/content/p04/cards '+catalogDirectory,isolated_project:project,synthetic:true,cleanup,status:status===0&&cleanup==='completed'?'PASS':'FAIL'},null,2));
}
process.exitCode=status;
