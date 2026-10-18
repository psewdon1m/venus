import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {previousImage} from './p02-previous-image.mjs';
const root=process.cwd(),directory=mkdtempSync(join(tmpdir(),'venus-p02-test-')),project='venus-p02-'+randomBytes(6).toString('hex');
const env={...process.env,VENUS_P02_INTEGRATION:'1',PLAYWRIGHT_BROWSERS_PATH:resolve('.artifacts/playwright-browsers'),PLAYWRIGHT_SKIP_BROWSER_GC:'1',VENUS_DB_PASSWORD_FILE:join(directory,'db-password'),KEYRING_FILE:join(directory,'keyring.json'),DELETION_LEDGER_FILE:join(directory,'deletions.jsonl'),P02_CLOCK_FILE:join(directory,'clock'),P02_SOURCE_SHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
const args=['compose','--project-name',project,'--file','infra/venus/compose.integration.yml'];
env.P02_SOURCE_DIRTY=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()?'1':'0';
const docker=more=>execFileSync('docker',[...args,...more],{env,encoding:'utf8',maxBuffer:8*1024*1024});
mkdirSync('.artifacts/p02',{recursive:true});
let started=false,status=1;
function cleanupDirectory() {
  if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.includes('venus-p02-test-')) throw new Error('Unsafe test cleanup target');
  rmSync(directory,{recursive:true,force:true});
}
try {
  env.P02_PREVIOUS_IMAGE=previousImage(directory,project+'-previous:local');
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});
  writeFileSync(env.KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o600});
  writeFileSync(env.DELETION_LEDGER_FILE,'',{mode:0o600});writeFileSync(env.P02_CLOCK_FILE,String(Date.now()));
  started=true;docker(['up','-d','--wait','--wait-timeout','120']);
  env.P02_DB_CONTAINER=docker(['ps','-q','db']).trim();
  const inspected=JSON.parse(execFileSync('docker',['inspect',env.P02_DB_CONTAINER],{encoding:'utf8'}))[0];
  const port=inspected.NetworkSettings.Ports['5432/tcp'][0];if(port.HostIp!=='127.0.0.1') throw new Error('Test PostgreSQL must be loopback-only');
  env.DB_HOST='127.0.0.1';env.DB_PORT=port.HostPort;env.DB_PASSWORD_FILE=env.VENUS_DB_PASSWORD_FILE;
  const result=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','apps/api/src/p02.integration.test.ts'],{env,stdio:'inherit'});status=result.status??1;
} finally {
  if(started) docker(['down','--volumes','--remove-orphans','--timeout','10']);
  cleanupDirectory();
  writeFileSync('.artifacts/p02/runner.json',JSON.stringify({source_sha:env.P02_SOURCE_SHA,command:'npm run test:p02',status:status===0?'PASS':'FAIL',isolated_project:project,cleanup:'completed',workspace:root},null,2));
}
process.exitCode=status;
