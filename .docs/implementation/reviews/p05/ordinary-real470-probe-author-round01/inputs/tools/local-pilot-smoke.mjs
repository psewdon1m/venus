/** Actual production-image Docker smoke for the explicit mock/18+ local profile. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import https from 'node:https';
import net from 'node:net';
import assert from 'node:assert/strict';
const project='venus-pilot-'+randomBytes(6).toString('hex'),directory=mkdtempSync(join(tmpdir(),'venus-pilot-'));
const output=resolve('.artifacts/local-pilot',project);mkdirSync(output,{recursive:true});
const env={...process.env,VENUS_HTTP_PORT:'0',VENUS_DB_PASSWORD_FILE:join(directory,'db-password'),VENUS_KEYRING_FILE:join(directory,'keyring.json'),VENUS_DEPLOYMENT_PROFILE:'closed'};
const report={schema_version:1,scope:'LOCAL_DOCKER_MOCK_ENTRY_ONLY_NOT_P05',source_sha:'',source_dirty:true,status:'FAIL',checks:[],cleanup:'NOT_RUN'};
const args=['compose','--project-name',project,'--file','infra/venus/compose.yml','--file','infra/venus/compose.local-pilot.yml'];
function run(command,more,options={}) {
  const {evidenceFile,...spawnOptions}=options;
  const result=spawnSync(command,more,{encoding:'utf8',env,maxBuffer:32*1024*1024,timeout:600000,...spawnOptions});
  if(evidenceFile) writeFileSync(join(output,evidenceFile),(result.stdout||'')+(result.stderr||''));
  if(result.error||result.status!==0) {
    report.command_failures=(report.command_failures||0)+1;
    writeFileSync(join(output,`command-failure-${report.command_failures}.json`),JSON.stringify({command,operation:more[0],exit_code:result.status,signal:result.signal,error_code:result.error?.code||null,stdout:result.stdout||'',stderr:result.stderr||''},null,2)+'\n');
  }
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`${command} ${more[0]} failed: ${(result.stderr||result.stdout).slice(-3000)}`);
  return result.stdout;
}
const docker=more=>run('docker',[...args,...more]);
const mark=id=>{report.checks.push({id,status:'PASS'});console.log('PASS:',id);};
function inputs(name) {
  const raw=run('python',['-B','-c',"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;files=inventory();print(json.dumps({'files':files,'source_identity_sha256':identity(files)}))"]);
  writeFileSync(join(output,name),raw);return JSON.parse(raw).source_identity_sha256;
}
const ca=readFileSync('tests/fixtures/p02-test-cert.pem');let origin='',started=false,failure;
function cleanupDirectory() {
  if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.startsWith(join(tmpdir(),'venus-pilot-'))) throw new Error('Unsafe owned cleanup target');
  rmSync(directory,{recursive:true,force:true});
}
function request(path,options={}) {
  return new Promise((resolve,reject)=>{
    const data=options.body===undefined?null:JSON.stringify(options.body);
    const req=https.request(origin+path,{ca,agent:false,method:options.method??'GET',headers:{origin,...options.headers,...(data?{'content-type':'application/json','content-length':Buffer.byteLength(data)}:{})},timeout:10000},response=>{
      let text='';response.on('data',chunk=>{text+=chunk;});response.on('end',()=>{let body;try {body=JSON.parse(text);}catch{ /* Proxy startup failures may have no JSON body. */ }resolve({status:response.statusCode,headers:response.headers,body,text});});
    });req.on('timeout',()=>req.destroy(new Error('HTTP_TIMEOUT')));req.on('error',reject);req.end(data);
  });
}
async function client() {
  const policy=await request('/api/v1/entry-policy');assert.equal(policy.status,200);
  const cookie=policy.headers['set-cookie'].map(value=>value.split(';')[0]).join('; ');
  const headers={cookie,'x-csrf-token':policy.body.csrf_token};
  return {policy:policy.body,create:body=>request('/api/v1/rooms',{method:'POST',headers,body})};
}
try {
  report.source_sha=run('git',['rev-parse','HEAD']).trim();report.source_dirty=Boolean(run('git',['status','--porcelain']).trim());
  if(report.source_dirty&&!process.argv.includes('--allow-dirty')) throw new Error('Clean source required; --allow-dirty is preflight only');
  report.source_identity_before=inputs('source-inputs-before.json');
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));env.VENUS_PILOT_HTTPS_PORT=String(listener.address().port);await new Promise(r=>listener.close(r));origin='https://127.0.0.1:'+env.VENUS_PILOT_HTTPS_PORT;
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});
  writeFileSync(env.VENUS_KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o444});
  const image=project+':local';run('docker',['build','-f','infra/venus/Dockerfile','--build-arg','SOURCE_REVISION='+report.source_sha,'-t',image,'.'],{evidenceFile:'build.txt'});
  env.VENUS_IMAGE=JSON.parse(run('docker',['image','inspect',image]))[0].Id;report.image_id=env.VENUS_IMAGE;
  started=true;docker(['up','-d','--wait','--wait-timeout','120']);
  const closed=await client();assert.equal(closed.policy.available,false);assert.equal(closed.policy.offer,null);mark('PILOT-CLOSED-DEFAULT');
  env.VENUS_DEPLOYMENT_PROFILE='local-pilot';docker(['up','-d','--wait','--wait-timeout','120']);
  const host=await client(),offer=host.policy.offer;assert.equal(host.policy.available,true);assert.equal(offer.synthetic,true);assert.equal(offer.version,'local-pilot-mock-1');assert.deepEqual(Object.keys(offer.text),['ru','en','tr']);mark('PILOT-MOCK-NOTICE-RU-EN-TR');
  const acceptance={offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true};
  const create=patch=>({name:'Local pilot',locale:'ru',meeting_context:'online',idempotency_key:randomUUID(),entry_acceptance:{...acceptance,...patch}});
  for(const [id,patch] of [['PILOT-18-REFUSAL',{adult18:false}],['PILOT-MOCK-REFUSAL',{accept_offer:false}],['PILOT-STALE-ACCEPTANCE',{offer_version:'local-pilot-mock-stale'}]]) {
    const denied=await host.create(create(patch));assert.ok([400,403].includes(denied.status));assert.ok(['INVALID_REQUEST','ENTRY_ACCEPTANCE_REQUIRED'].includes(denied.body.code));mark(id);
  }
  const created=await host.create(create({}));assert.equal(created.status,201);assert.ok(created.body.room_id);const room=created.body.room_id;
  const session=created.headers['set-cookie'].find(value=>value.startsWith('venus_room_session='));assert.match(session,/Secure/);assert.match(session,/HttpOnly/);const cookie=session.split(';')[0];mark('PILOT-EXPLICIT-18-CREATES-ROOM');
  docker(['restart','app']);
  let restored;for(let i=0;i<40;i++) {try {restored=await request('/api/v1/rooms/'+room,{headers:{cookie}});if(restored.status===200) break;}catch{ /* Wait for this owned app restart. */ }await new Promise(r=>setTimeout(r,500));}
  assert.equal(restored?.status,200);assert.equal(restored.body.room_id,room);mark('PILOT-RESTART-PERSISTS-ROOM');
  env.VENUS_DEPLOYMENT_PROFILE='closed';docker(['up','-d','--wait','--wait-timeout','120']);assert.equal((await client()).policy.available,false);mark('PILOT-CLOSE-ADMISSION-ROLLBACK');
  const app=JSON.parse(run('docker',['inspect',docker(['ps','-q','app']).trim()]))[0];assert.equal(app.HostConfig.ReadonlyRootfs,true);assert.equal(app.Config.User,'1000:1000');assert.equal(app.Mounts.some(m=>m.Destination.includes('docker.sock')),false);mark('PILOT-API-NO-DOCKER-SOCKET');
  report.source_identity_after=inputs('source-inputs-after.json');report.source_sha_after=run('git',['rev-parse','HEAD']).trim();report.source_dirty_after=Boolean(run('git',['status','--porcelain']).trim());
  report.source_unchanged=report.source_identity_before===report.source_identity_after&&report.source_sha===report.source_sha_after;
  if(!process.argv.includes('--allow-dirty')) {assert.equal(report.source_dirty_after,false);assert.equal(report.source_unchanged,true);}
  report.status='PASS';
} catch(error) {failure=error;} finally {
  const cleanupFailures=[];
  if(started) {
    try {writeFileSync(join(output,'app-logs.txt'),docker(['logs','--no-color','app']));}catch {cleanupFailures.push('logs');}
    try {docker(['down','--volumes','--remove-orphans','--timeout','10']);}catch {cleanupFailures.push('docker-down');}
  }
  try {cleanupDirectory();}catch {cleanupFailures.push('owned-directory');}
  report.cleanup=cleanupFailures.length?'FAILED':'completed';report.cleanup_errors=cleanupFailures;
  if(failure||cleanupFailures.length) {report.status='FAIL';report.failure_code=failure?'SMOKE_FAILED':'CLEANUP_FAILED';}
  writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Evidence:',output);
}
if(failure) throw failure;
if(report.cleanup!=='completed') throw new Error('Owned cleanup failed');
