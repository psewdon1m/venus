/** Disposable Docker/PostgreSQL integration. No deployment, registry push or host changes. */
import {spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {randomBytes, createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const directory = mkdtempSync(join(tmpdir(),'venus-p01-container-'));
const project = 'venus-p01-'+randomBytes(5).toString('hex');
const output = resolve('.artifacts/container');mkdirSync(output,{recursive:true});
const secret = randomBytes(32).toString('hex');
const canary = randomBytes(32).toString('hex');
const keyMaterial=randomBytes(32).toString('base64');
const env = {...process.env, VENUS_DB_PASSWORD_FILE:join(directory,'db-password'),VENUS_KEYRING_FILE:join(directory,'keyring.json'),VENUS_HTTP_PORT:'0'};
const revision = run('git',['rev-parse','HEAD']).trim();
const dirty = Boolean(run('git',['status','--porcelain']).trim());
if (dirty && !process.argv.includes('--allow-dirty')) throw new Error('Container evidence requires a clean source commit');
const report = {source_sha:revision,source_dirty:dirty,status:'FAIL',checks:[],image_id:null};
const composeArgs=['compose','--project-name',project,'--file','infra/venus/compose.yml'];
function run(command,args,options={}) {
  const r=spawnSync(command,args,{encoding:'utf8',env:options.env ?? process.env,maxBuffer:32*1024*1024,timeout:options.timeout ?? 600000});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${command} ${args[0]} failed (${r.status}): ${(r.stderr||r.stdout).slice(-5000)}`);
  return r.stdout;
}
function compose(args) {return run('docker',[...composeArgs,...args],{env});}
function record(id) {report.checks.push({id,status:'PASS'});console.log(`PASS: ${id}`);}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function request(base,path,expected,body) {
  const response=await fetch(base+path,{signal:AbortSignal.timeout(4000)});
  assert.equal(response.status,expected,path);
  const data=await response.json();if(body) assert.deepEqual(data,body);return data;
}
async function ready(base) {
  for(let i=0;i<60;i++) {
    try {if((await fetch(base+'/health/ready',{signal:AbortSignal.timeout(2000)})).ok) return;} catch { /* Wait only for this isolated app. */ }
    await delay(1000);
  }
  throw new Error('Readiness timeout');
}
function inspectTarSecrets(buffer) {
  for(let offset=0;offset+512<=buffer.length;) {
    const header=buffer.subarray(offset,offset+512);
    if(header.every(b=>b===0)) break;
    const size=parseInt(header.subarray(124,136).toString().replace(/\0/g,'').trim()||'0',8);
    if(!Number.isSafeInteger(size)||size<0||offset+512+size>buffer.length) throw new Error('Invalid image tar');
    const payload=buffer.subarray(offset+512,offset+512+size);
    const content=payload[0]===0x1f&&payload[1]===0x8b?gunzipSync(payload):payload;
    assert.ok(!content.includes(Buffer.from(secret))&&!content.includes(Buffer.from(canary))&&!content.includes(Buffer.from(keyMaterial)),'Secret/canary/key in image layer');
    offset+=512+Math.ceil(size/512)*512;
  }
}
const canaryFile=resolve('.env.p01-build-canary');
if(existsSync(canaryFile)) throw new Error('Canary path already exists');
let started=false;
let cleanupError;
try {
  // The private 0700 parent protects the host file; the bind is readable by UID1000.
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,secret,{mode:0o444});
  writeFileSync(env.VENUS_KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:keyMaterial}}),{mode:0o444});
  writeFileSync(canaryFile,`PRIVATE_CANARY=${canary}\n`);
  console.log('Building pinned OCI image…');
  const build=run('docker',['build','--file','infra/venus/Dockerfile','--build-arg',`SOURCE_REVISION=${revision}`,'--tag',project,'.']);
  writeFileSync(join(output,'build-output.txt'),build);
  const image=JSON.parse(run('docker',['image','inspect',project]))[0];
  env.VENUS_IMAGE=image.Id;report.image_id=image.Id;
  assert.equal(image.Config.User,'1000:1000');
  assert.equal(image.Config.Labels['org.opencontainers.image.revision'],revision);
  assert.equal(image.Config.Labels['org.opencontainers.image.version'],'0.0.0');
  const archive=join(directory,'image.tar');run('docker',['image','save','--output',archive,project]);
  inspectTarSecrets(readFileSync(archive));record('nonroot-image-labels-and-layer-secret-scan');
  const config=JSON.parse(compose(['config','--format','json']));
  assert.equal(config.services.app.ports.length,1);assert.equal(config.services.app.ports[0].host_ip,'127.0.0.1');
  assert.ok(!config.services.db.ports?.length);assert.equal(config.networks.backend.internal,true);
  assert.ok(!JSON.stringify(config).includes(secret));
  // Persist sanitized rendered config; machine-specific secret path is not evidence content.
  config.secrets.db_password.file='<external-secret-file>';
  config.secrets.keyring.file='<external-keyring-file>';
  writeFileSync(join(output,'compose-rendered.json'),JSON.stringify(config,null,2));record('loopback-only-app-private-postgres');
  started=true;compose(['up','-d','--wait','--wait-timeout','120']);
  const appId=compose(['ps','-q','app']).trim();
  const actual=JSON.parse(run('docker',['inspect',appId]))[0];
  report.runtime={image:actual.Image,user:actual.Config.User,privileged:actual.HostConfig.Privileged,
    readonly_rootfs:actual.HostConfig.ReadonlyRootfs,cap_drop:actual.HostConfig.CapDrop,security_opt:actual.HostConfig.SecurityOpt,
    mounts:actual.Mounts.map(m=>({destination:m.Destination,rw:m.RW})),
    source_revision:image.Config.Labels['org.opencontainers.image.revision'],version:image.Config.Labels['org.opencontainers.image.version']};
  assert.equal(actual.Image,image.Id);assert.equal(actual.Config.User,'1000:1000');
  assert.equal(actual.HostConfig.Privileged,false);assert.equal(actual.HostConfig.ReadonlyRootfs,true);
  assert.deepEqual(actual.HostConfig.CapDrop,['ALL']);
  assert.ok(actual.HostConfig.SecurityOpt.includes('no-new-privileges:true'));
  assert.equal(actual.Mounts.length,3);
  assert.ok(actual.Mounts.every(m=>(['/run/secrets/db_password','/run/secrets/keyring'].includes(m.Destination)&&!m.RW)||(m.Destination==='/var/lib/venus'&&m.Type==='volume'&&m.RW)));
  assert.equal(run('docker',['exec',appId,'id','-u']).trim(),'1000');record('runtime-isolation-no-socket');
  const port=actual.NetworkSettings.Ports['4300/tcp'][0];assert.equal(port.HostIp,'127.0.0.1');
  const base=`http://127.0.0.1:${port.HostPort}`;
  await ready(base);
  const version=await request(base,'/api/v1/version',200);
  report.version=version;
  assert.deepEqual(version,{service:'venus',version:'0.0.0',source_revision:revision,image_digest:image.Id,contract_revision:'P00-2'});
  await request(base,'/health/live',200,{status:'alive'});
  await request(base,'/health/ready',200,{status:'ready',database:'ready',schema_generation:1});
  const web=await fetch(base);assert.equal(web.status,200);assert.match(await web.text(),/<title>Venus<\/title>/);
  await request(base,'/api/v1/rooms',404);record('version-contract-web-and-ready-postgres');
  const malformed=await fetch(base+'/%MALFORMED_PRIVATE_CANARY');
  assert.equal(malformed.status,400);assert.equal(malformed.headers.get('cache-control'),'no-store');
  const badUrl=await malformed.json();assert.equal(badUrl.code,'INVALID_REQUEST');assert.match(badUrl.request_id,/^[a-f0-9-]{36}$/);
  assert.ok(!JSON.stringify(badUrl).includes('PRIVATE_CANARY'));
  compose(['stop','db']);
  await request(base,'/health/ready',503,{status:'unavailable',database:'unavailable',schema_generation:1});
  await request(base,'/health/live',200,{status:'alive'});record('database-outage-is-not-ready-process-alive');
  compose(['start','db']);await ready(base);record('database-recovery-without-app-restart');
  const policyResponse=await fetch(base+'/api/v1/entry-policy');const policy=await policyResponse.json();
  assert.equal(policy.available,false);assert.equal(policy.offer,null);
  const admissionCookie=policyResponse.headers.getSetCookie()[0].split(';')[0];
  const blocked=await fetch(base+'/api/v1/rooms',{method:'POST',headers:{origin:'https://venus.local.invalid',cookie:admissionCookie,'x-csrf-token':policy.csrf_token,'content-type':'application/json'},body:JSON.stringify({name:'synthetic',locale:'en',meeting_context:'online',idempotency_key:'11111111-1111-4111-8111-111111111111',entry_acceptance:{offer_version:'unapproved',offer_digest:'sha256:'+'a'.repeat(64),accept_offer:true,adult18:true}})});
  assert.equal(blocked.status,503);assert.equal((await blocked.json()).code,'ENTRY_POLICY_UNAVAILABLE');record('public-entry-fails-closed-without-approved-offer');
  const probe='PRIVACY_CANARY_'+randomBytes(12).toString('hex');
  await fetch(base+'/api/v1/rooms/'+probe+'?invite='+probe,{method:'POST',headers:{authorization:'Bearer '+probe,cookie:'session='+probe,'content-type':'application/json'},body:JSON.stringify({name:probe})});
  const logs=compose(['logs','--no-color','app']);
  assert.ok(!logs.includes(secret)&&!logs.includes(canary)&&!logs.includes(probe)&&!logs.includes(keyMaterial));
  writeFileSync(join(output,'app-logs.txt'),logs);record('structured-logs-do-not-expose-payloads-or-secrets');
  report.rendered_compose_sha256=createHash('sha256').update(readFileSync(join(output,'compose-rendered.json'))).digest('hex');
  report.logs_sha256=createHash('sha256').update(readFileSync(join(output,'app-logs.txt'))).digest('hex');
  const malformedKey=join(directory,'bad-keyring.json');writeFileSync(malformedKey,'{"current":"'+canary,{mode:0o444});
  const bad=spawnSync('docker',['run','--rm','--network','none','--mount',`type=bind,src=${env.VENUS_DB_PASSWORD_FILE},dst=/run/secrets/db_password,readonly`,'--mount',`type=bind,src=${malformedKey},dst=/run/secrets/keyring,readonly`,'-e','DB_PASSWORD_FILE=/run/secrets/db_password','-e','KEYRING_FILE=/run/secrets/keyring','-e','DELETION_LEDGER_FILE=/var/lib/venus/deletions.jsonl','-e','APP_ORIGIN=https://venus.local.invalid',image.Id],{encoding:'utf8',timeout:30000});
  assert.equal(bad.status,1);const failure=(bad.stdout??'')+(bad.stderr??'');assert.ok(!failure.includes(canary)&&!failure.includes(secret)&&!failure.includes(keyMaterial));assert.match(failure,/STARTUP_UNAVAILABLE/);record('malformed-secret-startup-is-sanitized');
  report.status='PASS';
} finally {
  if(started) {try {compose(['down','--volumes','--remove-orphans','--timeout','10']);} catch(error) {cleanupError=error;report.status='FAIL';}}
  if(existsSync(canaryFile)) rmSync(canaryFile);
  rmSync(directory,{recursive:true,force:true});
  report.compose_sha256=createHash('sha256').update(readFileSync('infra/venus/compose.yml')).digest('hex');
  writeFileSync(join(output,'health-report.json'),JSON.stringify(report,null,2));
}
if(cleanupError) throw cleanupError;
console.log(`PASS: container smoke ${report.image_id}`);
