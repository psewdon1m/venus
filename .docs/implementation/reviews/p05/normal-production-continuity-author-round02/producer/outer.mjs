/** Thin existing-compose app-only A6→B4 OFF→ON continuity. No fixture server. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync,statSync} from 'node:fs';
import {resolve,dirname,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const here=dirname(fileURLToPath(import.meta.url));
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateAck(ack,read=readFileSync){
 assert.equal(ack.schema_version,1);assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'NORMAL470_PERSISTENT_A6_B4_01');
 assert(isAbsolute(ack.method_review_path));assert.match(ack.method_review_sha256,/^[a-f0-9]{64}$/);assert.equal(sha(read(ack.method_review_path)),ack.method_review_sha256);
 for(const k of ['A','B']){const b=ack[k];assert(isAbsolute(b.source_root)&&isAbsolute(b.source_freeze_path)&&isAbsolute(b.image_receipt_path));
  assert.match(b.image_id,/^sha256:[a-f0-9]{64}$/);assert.match(b.source_identity,/^[a-f0-9]{64}$/);
  assert.equal(sha(read(b.source_freeze_path)),b.source_freeze_sha256);const freeze=JSON.parse(read(b.source_freeze_path,'utf8'));assert.equal(freeze.identity,b.source_identity);assert.equal(Object.keys(freeze.files).length,b.included_files);
  assert.equal(sha(read(b.image_receipt_path)),b.image_receipt_sha256);const receipt=JSON.parse(read(b.image_receipt_path,'utf8'));assert.equal(receipt.source_identity,b.source_identity);assert.equal(receipt.image,b.image_id);assert.deepEqual(b.runtime_files,{...receipt.image_files_sha256,'build-metadata.json':receipt.build_metadata_sha256});
  for(const [name,pin]of Object.entries(freeze.files)){const p=resolve(b.source_root,name),rel=relative(b.source_root,p);assert(rel&&rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel));assert.equal(sha(read(p)),typeof pin==='string'?pin:pin.sha256);}
 }
 for(const n of ['probe.mjs','outer.mjs','DESCRIPTOR.json'])assert.equal(sha(read(join(here,n))),ack.method_files[n]);
 assert.equal(sha(read(join(ack.A.source_root,'infra/venus/compose.yml'))),sha(read(join(ack.B.source_root,'infra/venus/compose.yml'))));
 // Same real470 authority/engine/schema across both normal images, not whole-image identity.
 for(const name of ['packages/card-catalog/dist/owner-provisional-pilot.json','packages/card-catalog/dist/pilot-bundle.js','packages/relationship-engine/dist/topic-planner.js','packages/relationship-engine/dist/topic-map.js',...Object.keys(ack.A.runtime_files).filter(p=>p.endsWith('.sql'))]){assert.match(ack.A.runtime_files[name],/^[a-f0-9]{64}$/);assert.equal(ack.A.runtime_files[name],ack.B.runtime_files[name]);}
 assert.match(ack.pack_digest,/^sha256:[a-f0-9]{64}$/);assert(ack.map_pins);return ack;
}
export function ownedContainer(v,project){assert.equal(v.Config.Labels['com.docker.compose.project'],project);assert(['app','db'].includes(v.Config.Labels['com.docker.compose.service']));return v;}
async function main(){
 const ackPath=resolve(process.argv[2]??join(here,'ROOT-ACK.template.json')),ack=JSON.parse(readFileSync(ackPath,'utf8'));validateAck(ack);
 const descriptor=JSON.parse(readFileSync(join(here,'DESCRIPTOR.json'),'utf8')),began=performance.now(),deadline=began+descriptor.whole_deadline_ms;
 assert.equal(lstatSync(ack.A.source_root).isSymbolicLink(),false);assert.equal(lstatSync(ack.B.source_root).isSymbolicLink(),false);
 const project='venus-normalcompat-'+randomBytes(6).toString('hex'),secretDir=mkdtempSync(join(tmpdir(),'venus-normalcompat-')),output=join(here,'runs',project);mkdirSync(output,{recursive:true});const clientDir=join(secretDir,'client');mkdirSync(clientDir,{mode:0o700});
 const env={...process.env,VENUS_IMAGE:ack.A.image_id,VENUS_HTTP_PORT:'0',VENUS_ORIGIN:'https://127.0.0.1',VENUS_DEPLOYMENT_PROFILE:'local-pilot',VENUS_PRIVATE_TOPICS:'true',VENUS_PRIVATE_TEXT_CHAT:'true',CATALOG_REVOCATION_LEDGER_FILE:'/var/lib/venus/revocations.jsonl',VENUS_DB_PASSWORD_FILE:join(secretDir,'db-password'),VENUS_KEYRING_FILE:join(secretDir,'keyring.json')};
 const report={schema_version:1,purpose:ack.purpose,status:'FAIL',project,root_ack_sha256:sha(readFileSync(ackPath)),phases:[],cleanup:'NOT_RUN',private_grant_claim:false};
 const override=join(output,'compose.probe.json');writeFileSync(override,JSON.stringify({services:{app:{volumes:[{type:'bind',source:here,target:'/run/probe',read_only:true},{type:'bind',source:ackPath,target:'/run/pilot470-root-ack.json',read_only:true},{type:'bind',source:clientDir,target:'/run/continuity-private'}]}}},null,2)+'\n');
 const args=['compose','--project-name',project,'--file',join(ack.A.source_root,'infra/venus/compose.yml'),'--file',override];let allocated=false,failed=null,dbId=null,volumeIdentity=null;
 function run(more,{status=0,timeout=30000,cleanup=false}={}){if(!cleanup)assert(performance.now()<deadline,'WHOLE_DEADLINE');const result=spawnSync('docker',more,{cwd:ack.A.source_root,env,encoding:'utf8',timeout:cleanup?timeout:Math.max(1,Math.min(timeout,deadline-performance.now())),maxBuffer:descriptor.caps.outer_output_bytes});
  if(result.error||status!==null&&result.status!==status)throw Object.assign(Error('DOCKER_COMMAND_FAILED'),{safe:{operation:more[0],exit_code:result.status,error_code:result.error?.code??null}});return result;}
 const docker=(more,opts)=>run([...args,...more],opts);
 function owned(cleanup=false){const ids=docker(['ps','--all','--quiet'],{cleanup}).stdout.trim().split(/\s+/).filter(Boolean);assert(ids.length<=2);const rows=ids.length?JSON.parse(run(['inspect',...ids],{cleanup}).stdout):[];for(const v of rows)ownedContainer(v,project);return rows;}
 function inspectPhase(binding,flag){const rows=owned();assert.equal(rows.length,2);const app=rows.find(v=>v.Config.Labels['com.docker.compose.service']==='app'),db=rows.find(v=>v.Config.Labels['com.docker.compose.service']==='db');assert.equal(app.Image,binding.image_id);assert.equal(app.HostConfig.ReadonlyRootfs,true);assert.equal(app.HostConfig.Privileged,false);assert.deepEqual(app.Config.Cmd,['node','apps/api/dist/server.js']);assert.deepEqual(app.Config.Entrypoint,['docker-entrypoint.sh']);assert.equal(app.Config.User,'1000:1000');assert.equal(app.Config.WorkingDir,'/app');assert(app.Config.Env.includes('VENUS_PRIVATE_TOPICS='+flag));assert(app.Config.Env.includes('VENUS_DEPLOYMENT_PROFILE=local-pilot'));assert(!app.Config.Env.some(x=>x.startsWith('NODE_OPTIONS=')));
  const allowed=new Set(['/var/lib/venus','/run/secrets/db_password','/run/secrets/keyring','/run/probe','/run/pilot470-root-ack.json','/run/continuity-private']);assert(app.Mounts.every(m=>allowed.has(m.Destination)));assert(app.Mounts.filter(m=>m.Destination.startsWith('/run/')&&m.Destination!=='/run/continuity-private').every(m=>!m.RW));assert.equal(app.Mounts.find(m=>m.Destination==='/run/continuity-private').RW,true);
  const volumes=rows.flatMap(v=>v.Mounts.filter(m=>m.Type==='volume').map(m=>({service:v.Config.Labels['com.docker.compose.service'],name:m.Name,destination:m.Destination}))).sort((a,b)=>a.name.localeCompare(b.name));assert.equal(volumes.length,2);
  if(dbId){assert.equal(db.Id,dbId);assert.deepEqual(volumes,volumeIdentity);}else{dbId=db.Id;volumeIdentity=volumes;}
  return {db_id:db.Id,app_id:app.Id,image_id:app.Image,volumes};}
 function phase(name,binding,flag){env.VENUS_IMAGE=binding.image_id;env.VENUS_PRIVATE_TOPICS=flag;if(name!=='a-on'){owned();docker(['stop','--timeout','10','app'],{timeout:30000});docker(['up','-d','--no-deps','--force-recreate','--wait','--wait-timeout','90','app'],{timeout:120000});}const actual=inspectPhase(binding,flag);
  const result=docker(['exec','-T','app','node','/run/probe/probe.mjs',name],{status:null,timeout:descriptor.phase_deadline_ms+10000});writeFileSync(join(output,name+'-stdout.txt'),result.stdout);writeFileSync(join(output,name+'-stderr.txt'),result.stderr);
  const reportPath=join(clientDir,'report-'+name+'.json');assert(statSync(reportPath).size<=descriptor.caps.phase_report_bytes);const raw=readFileSync(reportPath,'utf8'),record=JSON.parse(raw);writeFileSync(join(output,name+'-report.json'),raw);report.phases.push({phase:name,exit_code:result.status,status:record.status,...actual});assert.equal(result.status,0);assert.equal(record.status,'PASS');}
 try{
  for(const b of [ack.A,ack.B]){const image=JSON.parse(run(['image','inspect',b.image_id]).stdout)[0];assert.equal(image.Id,b.image_id);assert.deepEqual(image.Config.Cmd,['node','apps/api/dist/server.js']);assert.deepEqual(image.Config.Entrypoint,['docker-entrypoint.sh']);assert.equal(image.Config.Labels['org.opencontainers.image.revision'],b.source_identity);}
  writeFileSync(env.VENUS_DB_PASSWORD_FILE,randomBytes(32).toString('hex'),{mode:0o444});writeFileSync(env.VENUS_KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o444});allocated=true;
  docker(['run','--rm','--no-deps','--entrypoint','node','app','--input-type=module','-e',"import {RevocationLedger} from '/app/packages/card-catalog/dist/index.js';RevocationLedger.provision('/var/lib/venus/revocations.jsonl');"]);
  docker(['up','-d','--wait','--wait-timeout','120'],{timeout:150000});phase('a-on',ack.A,'true');phase('b-off',ack.B,'false');phase('b-on',ack.B,'true');validateAck(ack);report.status='PASS';
 }catch(error){failed=error;report.error=error.safe??{name:error.name,code:'NORMAL_CONTINUITY_FAILED'};}
 finally{const errors=[];if(allocated)try{owned(true);docker(['down','--volumes','--remove-orphans','--timeout','10'],{cleanup:true,timeout:60000});for(const [kind,sub]of [['ps',['--all']],['volume',[]],['network',[]]]){const result=kind==='ps'?run(['ps','--all','--quiet','--filter','label=com.docker.compose.project='+project],{cleanup:true}):run([kind,'ls','--quiet',...sub,'--filter','label=com.docker.compose.project='+project],{cleanup:true});assert.equal(result.stdout.trim(),'');}}catch{errors.push('OWNED_COMPOSE_CLEANUP_FAILED');}
  try{const path=resolve(secretDir);assert.equal(dirname(path),resolve(tmpdir()));assert(path.startsWith(join(tmpdir(),'venus-normalcompat-')));rmSync(path,{recursive:true,force:true});}catch{errors.push('OWNED_CLIENT_SECRET_CLEANUP_FAILED');}
  report.cleanup=errors.length?'FAIL':'PASS';report.cleanup_errors=errors;report.elapsed_ms=Math.round(performance.now()-began);if(errors.length)report.status='FAIL';writeFileSync(join(output,'outer-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,project,output}));}
 if(failed||report.status!=='PASS')process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))await main();
