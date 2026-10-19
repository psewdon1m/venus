/** Run the complete quality suite in an isolated local Linux Docker container. */
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomBytes} from 'node:crypto';
const name='venus-quality-'+randomBytes(6).toString('hex'),volume=name+'-workspace',output=resolve('.artifacts/docker-quality',name);
mkdirSync(output,{recursive:true});
function command(binary,args) {return spawnSync(binary,args,{encoding:'utf8',maxBuffer:64*1024*1024,timeout:1200000});}
function checked(binary,args) {const r=command(binary,args);if(r.error) throw r.error;if(r.status!==0) throw new Error(`${binary} ${args[0]} failed: ${(r.stderr||r.stdout).slice(-2000)}`);return r.stdout;}
const report={schema_version:1,scope:'LOCAL_DOCKER_FULL_QUALITY_NOT_STAGE_ACCEPTANCE',status:'FAIL',cleanup:'NOT_RUN',container:name,volume};
let ownedVolume=false,attemptedContainer=false,failure;
try {
  report.source_sha=checked('git',['rev-parse','HEAD']).trim();report.source_dirty=Boolean(checked('git',['status','--porcelain']).trim());
  if(report.source_dirty&&!process.argv.includes('--allow-dirty')) throw new Error('Clean source required');
  const git=checked('git',['rev-parse','--absolute-git-dir']).trim();
  const build=command('docker',['build','--platform','linux/amd64','-f','infra/venus/Dockerfile.checks','-t',name+':local','.']);
  writeFileSync(join(output,'build.txt'),(build.stdout||'')+(build.stderr||''));if(build.error) throw build.error;if(build.status!==0) throw new Error('Quality image build failed');
  report.image_id=JSON.parse(checked('docker',['image','inspect',name+':local']))[0].Id;
  checked('docker',['volume','create',volume]);ownedVolume=true;
  attemptedContainer=true;
  const run=command('docker',['run','--rm','--name',name,'--platform','linux/amd64','--network','none','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','2g','--cpus','2',
    '--tmpfs','/tmp:rw,exec,size=512m,mode=1777','--tmpfs','/home/node:rw,size=64m,uid=1000,gid=1000,mode=700','--mount',`type=volume,source=${volume},target=/workspace`,
    '--mount',`type=bind,source=${git},target=/repo-git,readonly`,'-e','GIT_DIR=/repo-git','-e','GIT_WORK_TREE=/workspace','-e','GIT_OPTIONAL_LOCKS=0','-e','GIT_CONFIG_COUNT=1','-e','GIT_CONFIG_KEY_0=safe.directory','-e','GIT_CONFIG_VALUE_0=/workspace','-e','PYTHONUTF8=1',report.image_id]);
  writeFileSync(join(output,'quality.txt'),(run.stdout||'')+(run.stderr||''));report.actual_exit_code=run.status;
  console.log(((run.stdout||'')+(run.stderr||'')).slice(-7000));
  if(run.error) throw run.error;
  const paths=['.artifacts/negative-gates.json','.artifacts/docker-quality/inputs-before.json','.artifacts/docker-quality/inputs-after.json','.artifacts/docker-quality/run.json',
    ...['run.json','schema.json','content-history-tests.json','full-check/analysis.json','full-check/manifest.json','full-check/input-index.json','full-check/coverage.json','full-check/coverage-private-chat.json','command-1.txt','command-2.txt','command-3.txt'].map(path=>'.artifacts/catalog-r2-check/'+path)];
  const script="const fs=require('node:fs');const paths=JSON.parse(process.argv[1]);const out={};for(const p of paths)if(fs.existsSync(p))out[p]=fs.readFileSync(p).toString('base64');process.stdout.write(JSON.stringify(out));";
  const captured=JSON.parse(checked('docker',['run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--user','1000:1000','--mount',`type=volume,source=${volume},target=/workspace,readonly`,'--entrypoint','node',report.image_id,'-e',script,JSON.stringify(paths)]));
  if(Object.keys(captured).some(path=>!paths.includes(path))) throw new Error('Unexpected captured path');
  for(const path of paths) if(captured[path]) writeFileSync(join(output,path.replaceAll('/','-')),Buffer.from(captured[path],'base64'));
  if(run.status!==0) throw new Error('Docker quality failed');
  if(paths.some(path=>!captured[path])) throw new Error('Quality receipt incomplete');
  const actual=JSON.parse(Buffer.from(captured[paths[3]],'base64'));
  if(actual.status!=='PASS'||actual.source_sha!==report.source_sha) throw new Error('Quality receipt stale/failing');
  report.source_identity_sha256=actual.source_identity_before;
  report.source_sha_after=checked('git',['rev-parse','HEAD']).trim();report.source_dirty_after=Boolean(checked('git',['status','--porcelain']).trim());
  if(!process.argv.includes('--allow-dirty')&&(report.source_sha_after!==report.source_sha||report.source_dirty_after)) throw new Error('Source changed during Docker quality');
  report.status='PASS';
} catch(error) {failure=error;} finally {
  const errors=[];
  try {
    if(attemptedContainer) {
      const container=command('docker',['inspect',name]);
      if(container.status===0) {const removal=command('docker',['rm','-f',name]);if(removal.status!==0) errors.push('owned-container');}
      else if(!/No such object|No such container/i.test(container.stderr)) errors.push('container-state-unconfirmed');
    }
  } catch {errors.push('owned-container');}
  try {if(ownedVolume&&command('docker',['volume','rm',volume]).status!==0) errors.push('owned-volume');}catch {errors.push('owned-volume');}
  report.cleanup=errors.length?'FAILED':'completed';report.cleanup_errors=errors;
  if(failure||errors.length) report.status='FAIL';
  writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Evidence:',output);
}
if(failure) throw failure;
if(report.cleanup!=='completed') throw new Error('Docker quality cleanup failed');
