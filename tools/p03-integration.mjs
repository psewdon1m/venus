import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,existsSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {previousImage} from './p02-previous-image.mjs';
const directory=mkdtempSync(join(tmpdir(),'venus-p03-test-')),project='venus-p03-'+randomBytes(6).toString('hex');
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const env={...process.env,VENUS_P02_INTEGRATION:'1',VENUS_P03_INTEGRATION:'1',VENUS_DB_PASSWORD_FILE:join(directory,'db-password'),KEYRING_FILE:join(directory,'keyring.json'),DELETION_LEDGER_FILE:join(directory,'deletions.jsonl'),P02_CLOCK_FILE:join(directory,'clock'),P02_SOURCE_SHA:source,P03_SOURCE_SHA:source,P03_PROJECT:project};
env.P03_SOURCE_DIRTY=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()?'1':'0';
const args=['compose','--project-name',project,'--file','infra/venus/compose.integration.yml'];
const docker=more=>execFileSync('docker',[...args,...more],{env,encoding:'utf8',maxBuffer:8*1024*1024});
mkdirSync('.artifacts/p03',{recursive:true});
// A startup failure must not leave a previous successful test report masquerading as this run.
rmSync('.artifacts/p03/integration-report.json',{force:true});
let started=false,status=1,cleanup;
function cleanupDirectory() {
  if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.includes('venus-p03-test-')) throw new Error('Unsafe test cleanup target');
  rmSync(directory,{recursive:true,force:true});
}
console.log('P03 isolated Docker scope: '+project+'; only this project and its volumes will be removed.');
try {
  const previousSource=execFileSync('git',['rev-parse','p02-accepted-20261018^{commit}'],{encoding:'utf8'}).trim();
  env.P03_PREVIOUS_SOURCE=previousSource;
  env.P03_PREVIOUS_IMAGE=previousImage(directory,project+'-previous:local',previousSource);
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});
  writeFileSync(env.KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o444});
  writeFileSync(env.DELETION_LEDGER_FILE,'',{mode:0o600});writeFileSync(env.P02_CLOCK_FILE,String(Date.now()));
  started=true;docker(['up','-d','--wait','--wait-timeout','120']);
  env.P02_DB_CONTAINER=docker(['ps','-q','db']).trim();
  const inspected=JSON.parse(execFileSync('docker',['inspect',env.P02_DB_CONTAINER],{encoding:'utf8'}))[0],port=inspected.NetworkSettings.Ports['5432/tcp'][0];
  if(port.HostIp!=='127.0.0.1') throw new Error('Test PostgreSQL must be loopback-only');
  env.DB_HOST='127.0.0.1';env.DB_PORT=port.HostPort;env.DB_PASSWORD_FILE=env.VENUS_DB_PASSWORD_FILE;
  const result=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/p03/runtime.integration.test.mjs'],{env,stdio:'inherit'});
  status=result.status??1;
  if(status!==0&&existsSync('.artifacts/p03/integration-report.json')) copyFileSync('.artifacts/p03/integration-report.json',`.artifacts/p03/failed-integration-${project}.json`);
} finally {
  try {
    // The test retains a stopped rollback container for diagnostics. Also clean its exact
    // owned names if the child terminated before its own finally block could complete.
    const rollback=project+'-rollback',volume=rollback+'-ledger';
    if(spawnSync('docker',['container','inspect',rollback],{stdio:'pipe'}).status===0) execFileSync('docker',['rm','--force','--volumes',rollback],{stdio:'pipe'});
    if(spawnSync('docker',['volume','inspect',volume],{stdio:'pipe'}).status===0) execFileSync('docker',['volume','rm',volume],{stdio:'pipe'});
    if(started) docker(['down','--volumes','--remove-orphans','--timeout','10']);cleanup='completed';
  }
  catch(error) {cleanup='failed';status=1;console.error('P03 Docker cleanup failed: '+error.message);}
  cleanupDirectory();
  writeFileSync('.artifacts/p03/integration-runner.json',JSON.stringify({source_sha:source,source_dirty:env.P03_SOURCE_DIRTY==='1',command:'node tools/p03-integration.mjs',synthetic:true,status:status===0&&cleanup==='completed'?'PASS':'FAIL',isolated_project:project,cleanup,previous_source:env.P03_PREVIOUS_SOURCE,previous_image:env.P03_PREVIOUS_IMAGE},null,2));
}
process.exitCode=status;
