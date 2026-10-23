/** One bounded existing-compose ordinary server probe; no new supervisor. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync} from 'node:fs';
import {resolve,dirname,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function validateAck(ack,read=readFileSync){
 assert.equal(ack.schema_version,1);assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'ORDINARY470_N4_DIAGNOSTIC_04');
 for(const key of ['source_identity','source_freeze_sha256','method_review_sha256'])assert.match(ack[key],/^[a-f0-9]{64}$/);
 assert(ack.image_entrypoint===null||JSON.stringify(ack.image_entrypoint)==='["docker-entrypoint.sh"]');assert.match(ack.image_id,/^sha256:[a-f0-9]{64}$/);assert.match(ack.pack_digest,/^sha256:[a-f0-9]{64}$/);
 assert(isAbsolute(ack.source_root)&&isAbsolute(ack.source_freeze_path)&&isAbsolute(ack.method_review_path));
 assert.equal(sha(read(ack.source_freeze_path)),ack.source_freeze_sha256);assert.equal(sha(read(ack.method_review_path)),ack.method_review_sha256);
 const source=JSON.parse(read(ack.source_freeze_path,'utf8'));assert.equal(source.identity,ack.source_identity);assert(source.files&&Object.keys(source.files).length>=1800);
 assert.equal(sha(read(ack.image_receipt_path)),ack.image_receipt_sha256);const imageReceipt=JSON.parse(read(ack.image_receipt_path,'utf8'));
 assert.equal(imageReceipt.image,ack.image_id);assert.equal(imageReceipt.source_identity,ack.source_identity);
 const imageFiles={...imageReceipt.image_files_sha256,'build-metadata.json':imageReceipt.build_metadata_sha256};assert.deepEqual(ack.runtime_files,imageFiles);
 for(const[name,pin]of Object.entries(source.files)){const path=resolve(ack.source_root,name),rel=relative(ack.source_root,path);assert(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel));assert.equal(sha(read(path)),typeof pin==='string'?pin:pin.sha256);}
 for(const name of ['probe.mjs','outer.mjs','DESCRIPTOR.json'])assert.equal(sha(read(join(here,name))),ack.method_files[name]);
 const required=['build-metadata.json','apps/api/dist/server.js','apps/api/dist/topic-game-source.js','apps/api/dist/topic-runtime.js','apps/api/dist/topic-games.js','packages/relationship-engine/dist/pack.js','packages/relationship-engine/dist/topic-map.js','packages/card-catalog/dist/pilot-bundle.js','packages/card-catalog/dist/owner-provisional-pilot.json'];
 assert(ack.runtime_files&&required.every(p=>/^[a-f0-9]{64}$/.test(ack.runtime_files[p])));assert(ack.map_pins&&ack.owner_authority&&ack.source_revision);
 return source;
}
export function ownedContainer(value,project){
 assert.equal(value.Config.Labels['com.docker.compose.project'],project);assert(['app','db'].includes(value.Config.Labels['com.docker.compose.service']));
 return value;
}
export function diagnosticEvents(raw){
 const events=[],uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
 for(const line of raw.split('\n')){if(line.length>32768)continue;let x;try{x=JSON.parse(line);}catch{continue;}
  if(x?.event!=='request_failed'||!uuid.test(x.request_id??'')||!['TypeError','RangeError','ReferenceError','SyntaxError','URIError','EvalError','AggregateError','Error','UNKNOWN'].includes(x.error_kind)||!['40P01','40001','57014','25P02','23505','08006','QUERY_TIMEOUT','UNKNOWN'].includes(x.failure_code))continue;
  const row={event:'request_failed',request_id:x.request_id,error_kind:x.error_kind,failure_code:x.failure_code};
  if(['app','rooms','security','catalog','database','games','games-model','room-routes','room-games','room-private-protocol','topic-games','topic-game-model','topic-game-source','topic-runtime','topic-game-routes','private-topic-preferences','private-topic-ledger','topic-room-registry','topic-room-lifecycle','http-delivery'].includes(x.source_module)&&Number.isSafeInteger(x.source_line)&&x.source_line>=1&&x.source_line<=1000000&&Number.isSafeInteger(x.source_column)&&x.source_column>=1&&x.source_column<=100000)Object.assign(row,{source_module:x.source_module,source_line:x.source_line,source_column:x.source_column});
  events.push(row);assert(events.length<=64,'DIAGNOSTIC_EVENT_CAP');
 }return events;
}
async function main(){
 const ackPath=resolve(process.argv[2]??join(here,'ROOT-ACK.template.json')),ack=JSON.parse(readFileSync(ackPath,'utf8'));validateAck(ack);
 assert.equal(lstatSync(ack.source_root).isSymbolicLink(),false);
 const project='venus-pilot470-'+randomBytes(6).toString('hex'),secretDir=mkdtempSync(join(tmpdir(),'venus-pilot470-')),output=resolve(here,'runs',project);mkdirSync(output,{recursive:true});
 const env={...process.env,VENUS_IMAGE:ack.image_id,VENUS_HTTP_PORT:'0',VENUS_ORIGIN:'https://127.0.0.1',VENUS_DEPLOYMENT_PROFILE:'local-pilot',VENUS_PRIVATE_TOPICS:'true',VENUS_PRIVATE_TEXT_CHAT:'true',CATALOG_REVOCATION_LEDGER_FILE:'/var/lib/venus/revocations.jsonl',VENUS_DB_PASSWORD_FILE:join(secretDir,'db-password'),VENUS_KEYRING_FILE:join(secretDir,'keyring.json')};
 const report={schema_version:1,purpose:ack.purpose,status:'FAIL',source_identity:ack.source_identity,image_id:ack.image_id,root_ack_sha256:sha(readFileSync(ackPath)),project,probe_exit:null,cleanup:'NOT_RUN',container_ownership_verified:false,API_only:true,actual_browser:false};
 const override=join(output,'compose.probe.json');writeFileSync(override,JSON.stringify({services:{app:{volumes:[{type:'bind',source:here,target:'/run/probe',read_only:true},{type:'bind',source:ackPath,target:'/run/pilot470-root-ack.json',read_only:true}]}}},null,2)+'\n');
 const args=['compose','--project-name',project,'--file',join(ack.source_root,'infra/venus/compose.yml'),'--file',override];
 let allocated=false,failure=null,appId=null;
 function run(more,{status=0,timeout=180000}={}){const result=spawnSync('docker',more,{encoding:'utf8',env,cwd:ack.source_root,timeout,maxBuffer:16*1024*1024});
  if(result.error||status!==null&&result.status!==status)throw Object.assign(Error('DOCKER_COMMAND_FAILED'),{safe:{operation:more[0],exit_code:result.status,error_code:result.error?.code??null}});return result;}
 const docker=(more,opts)=>run([...args,...more],opts);
 function inspectOwned(){const ids=docker(['ps','--all','--quiet']).stdout.trim().split(/\s+/).filter(Boolean);assert(ids.length<=2);const values=ids.length?JSON.parse(run(['inspect',...ids]).stdout):[];for(const value of values)ownedContainer(value,project);return values;}
 try{
  const image=JSON.parse(run(['image','inspect',ack.image_id]).stdout)[0];assert.equal(image.Id,ack.image_id);assert.deepEqual(image.Config.Cmd,['node','apps/api/dist/server.js']);assert.deepEqual(image.Config.Entrypoint,ack.image_entrypoint);assert.equal(image.Config.WorkingDir,'/app');assert.equal(image.Config.User,'1000:1000');assert.equal(image.Config.Labels['org.opencontainers.image.revision'],ack.source_revision);
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});writeFileSync(env.VENUS_KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o444});
  allocated=true;
  // Ordinary operator file provisioning before startup; no DB/source/approval hook.
  docker(['run','--rm','--no-deps','--entrypoint','node','app','--input-type=module','-e',"import {RevocationLedger} from '/app/packages/card-catalog/dist/index.js'; RevocationLedger.provision('/var/lib/venus/revocations.jsonl');"]);
  docker(['up','-d','--wait','--wait-timeout','120'],{timeout:180000});
  const owned=inspectOwned();assert.equal(owned.length,2);report.container_ownership_verified=true;
  for(const item of owned){assert.equal(item.HostConfig.Privileged,false);assert.equal(item.Mounts.some(m=>m.Destination.includes('docker.sock')),false);}
  const app=owned.find(v=>v.Config.Labels['com.docker.compose.service']==='app');appId=app.Id;assert.equal(app.Image,ack.image_id);assert.equal(app.HostConfig.ReadonlyRootfs,true);assert.deepEqual(app.Config.Cmd,['node','apps/api/dist/server.js']);
  assert.deepEqual(app.Config.Entrypoint,ack.image_entrypoint);assert.equal(app.Config.WorkingDir,'/app');assert.equal(app.Config.User,'1000:1000');
  for(const value of ['VENUS_DEPLOYMENT_PROFILE=local-pilot','VENUS_PRIVATE_TOPICS=true','VENUS_PRIVATE_TEXT_CHAT=true','APP_ORIGIN=https://127.0.0.1'])assert(app.Config.Env.includes(value));assert(!app.Config.Env.some(v=>v.startsWith('NODE_OPTIONS=')));
  const allowedMounts=new Set(['/var/lib/venus','/run/secrets/db_password','/run/secrets/keyring','/run/probe','/run/pilot470-root-ack.json']);assert(app.Mounts.every(m=>allowedMounts.has(m.Destination)));assert(app.Mounts.filter(m=>m.Destination.startsWith('/run/')).every(m=>!m.RW));
  const result=docker(['exec','-T','app','node','/run/probe/probe.mjs'],{status:null,timeout:1000000});report.probe_exit=result.status;
  // stdout only has fixed status/count objects; raw API bodies/cookies never print.
  writeFileSync(join(output,'probe-stdout.txt'),result.stdout);writeFileSync(join(output,'probe-stderr.txt'),result.stderr);
  const raw=docker(['exec','-T','app','cat','/tmp/pilot470-report.json']).stdout;assert(Buffer.byteLength(raw)<2*1024*1024);const probe=JSON.parse(raw);writeFileSync(join(output,'probe-report.json'),raw);
  assert.equal(result.status,0);assert.equal(probe.status,'PASS');assert.equal(probe.completed_rounds,20);assert.equal(probe.profiles.length,1);assert(probe.profiles.every(p=>p.status==='PASS'));assert.equal(probe.negative_profiles.length,0);assert(probe.negative_profiles.every(p=>p.status==='PASS'));assert.equal(probe.rooms_created,1);assert.equal(probe.rooms_closed,1);assert.equal(probe.client_cleanup,'COMPLETE');
  validateAck(ack);report.status='PASS';
 }catch(error){failure=error;report.failure=error.safe??{name:error.name,code:'ORDINARY_PROBE_FAILED'};
 }finally{
  const cleanup=[];
  // Preserve only allowlisted events before teardown even if exec/report fails.
  if(appId){try{const rows=inspectOwned();assert(rows.some(row=>row.Id===appId));const logs=run(['logs','--tail','1000',appId]);const safe=diagnosticEvents(logs.stdout+'\n'+logs.stderr);writeFileSync(join(output,'server-diagnostics.json'),JSON.stringify(safe,null,2)+'\n');report.sanitized_diagnostics=safe.length;report.diagnostic_capture='PASS';}catch{report.diagnostic_capture='FAIL';report.status='FAIL';}}
  if(allocated){try{inspectOwned();docker(['down','--volumes','--remove-orphans','--timeout','10']);const remaining=run(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project]).stdout.trim();assert.equal(remaining,'');assert.equal(run(['volume','ls','--quiet','--filter','label=com.docker.compose.project='+project]).stdout.trim(),'');assert.equal(run(['network','ls','--quiet','--filter','label=com.docker.compose.project='+project]).stdout.trim(),'');}catch{cleanup.push('OWNED_COMPOSE_CLEANUP_FAILED');}}
  try{const path=resolve(secretDir);assert.equal(dirname(path),resolve(tmpdir()));assert(path.startsWith(join(tmpdir(),'venus-pilot470-')));rmSync(path,{recursive:true,force:true});}catch{cleanup.push('OWNED_SECRET_DIRECTORY_CLEANUP_FAILED');}
  report.cleanup=cleanup.length?'FAIL':'PASS';report.cleanup_errors=cleanup;if(cleanup.length)report.status='FAIL';writeFileSync(join(output,'outer-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,project,output}));
 }
 if(failure||report.status!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))await main();
