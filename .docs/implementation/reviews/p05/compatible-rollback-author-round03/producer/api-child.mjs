/** Explicit bootstrap only; importing this module never opens DB/listener. */
import assert from 'node:assert/strict';
import {safeError} from './bound-profile.mjs';
import {verifyOwnIPC} from './ipc-policy.mjs';
import {readFileSync,existsSync,lstatSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {composition} from './factory.mjs';
import {ResourceLease} from './resource-lease.mjs';
import {actualImageMap,sha} from './image-modules.mjs';
import {protectedRequest} from './http-client.mjs';
import {seed,narrow,restore,preserved,replay,activePrivate,serialize} from './scenarios.mjs';
const producer=dirname(fileURLToPath(import.meta.url)),delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function boot(config){const ipcReceipt=verifyOwnIPC(config.phase);
 const binding=JSON.parse(readFileSync(join(producer,'BINDING.json'))),processNonce=randomBytes(16).toString('hex'),started=performance.now(),lease=new ResourceLease(config);let service,closed=false;const phase=config.phase,chronology=[],report={schema_version:1,status:'FAIL',phase,process_nonce:processNonce,namespace_pid:process.pid,ipc:ipcReceipt,image:binding.images[phase==='B2'?'B':'A'],chronology,pool_closed:false,synthetic_only:true,full_P05_PASS:false};
 const mark=event=>chronology.push({phase,event,native_elapsed_ms:performance.now()-started}),publicWrite=(name,value)=>lease.write('/evidence',name,JSON.stringify(value,null,2)+'\n'),privateWrite=(name,value)=>lease.write('/private',name,JSON.stringify(value)+'\n',{privateFile:true});
 async function command(name){const file='/private/command-'+phase+'-'+name+'.json',deadline=performance.now()+120000;while(performance.now()<deadline){lease.assert();if(existsSync(file)){assert(!lstatSync(file).isSymbolicLink());const c=JSON.parse(readFileSync(file));assert.equal(c.owner,config.owner);assert.equal(c.phase,phase);assert.equal(c.command,name);return;}await delay(50);}throw Error('SCRIPTED_PHASE_DEADLINE');}
 try{
  await lease.initial();report.actual_image=actualImageMap(binding,phase);const source=phase==='B2'?binding.prior_source_identity:binding.source_identity;config.version={service:'venus',version:'image-bound-synthetic-fixture',source_revision:source,image_digest:report.image,contract_revision:'P00-2'};report.version_source='PINNED_EXTERNAL_RECEIPT_AND_ACTUAL_IMAGE_MAP_NOT_PRODUCTION_METADATA';service=await composition(config,binding,lease);const{h,obs,effects}=service;report.adaptations=service.adaptations;report.generated_harness_sha256=service.generated_source_sha256;
  const previous=phase==='A1'?null:JSON.parse(readFileSync('/private/state-'+(phase==='B2'?'A1-final':'B2-final')+'.json'));
  const before=phase==='A1'?null:await obs.rawDatabase(h.pool),authorityBefore=phase==='A1'?null:obs.authorityMap(h.directory),keyBefore=sha(readFileSync(config.keyringFile));await service.migrate();if(before)report.migration_only=obs.assertRestored(before,await obs.rawDatabase(h.pool));mark('migration_observer');
  let untouched,baseline;if(previous){untouched=restore(phase==='B2'?previous.D:previous.E);baseline=phase==='B2'?previous.baseline.D:previous.baseline.E;report.live_before_boot=await obs.liveUntouched(h.pool,h.keys,untouched,h.time());mark('untouched_live');}
  report.boot=await h.topics.bootGate();assert.equal(report.boot.private_scopes_revoked,true);mark('bootGate_return');if(previous){report.raw_revoked=await obs.revokedUntouched(h.pool,h.keys,untouched,baseline);assert.deepEqual(obs.authorityMap(h.directory),authorityBefore);assert.equal(sha(readFileSync(config.keyringFile)),keyBefore);report.authority_before_after_boot_equal=true;mark('raw_revoked');}
  await h.legacy.reconcilePublicPairPolicy();await h.rooms.maintain();mark('maintenance');await h.listen();mark('listen');publicWrite('listener-'+phase+'.json',{phase,process_nonce:processNonce,status:'LISTENING',boot_before_listener:true,image:report.image});
  const v=await protectedRequest(config,'/api/v1/version');assert.equal(v.status,200);assert.equal(v.tls_verified,true);assert.deepEqual(JSON.parse(v.raw),config.version);report.version_DTO_bound=true;report.actual_TLS_CA_verified=true;
  const ui=Object.entries(report.actual_image.files).filter(([p])=>p.startsWith('apps/web/dist/'));report.served_UI=[];for(const[path,hash]of ui){const url=path==='apps/web/dist/index.html'?'/':path.slice('apps/web/dist'.length),r=await protectedRequest(config,url,{cap:4*1024**2});assert.equal(r.status,200);assert.equal(r.tls_verified,true);assert.equal(sha(r.raw),hash);report.served_UI.push({path,bytes:r.raw.length,sha256:hash});}assert(report.served_UI.some(x=>x.path.endsWith('.js'))&&report.served_UI.some(x=>x.path.endsWith('index.html')));
  if(phase==='A1'){
   const state=await seed(h,obs,config);report.seed={real_admissions:true,A_D_private_positive:true,...state.acl,synthetic_pins_sha256:sha(state.sourcePins)};privateWrite('state-A1-seed.json',state);publicWrite('seed-A1-ready.json',{status:'READY_FOR_RETAINED_BROWSER',phase});await command('NARROW');const narrowed=await narrow(h,obs,state);privateWrite('state-A1-final.json',narrowed);report.narrow={HTTP_narrow_close_leave:true,authority_advanced:true,D_live_before_switch:narrowed.liveD_before_switch};publicWrite('phase-A1-ready.json',{status:'READY_FOR_STOP',phase});
  }else{
   report.preserved=await preserved(h,obs,previous);report.replay=await replay(h,obs,effects,phase==='B2'?previous.D:previous.E,baseline);
   if(phase==='B2'){const E=await activePrivate(h);assert.equal(sha(h.source.map.pins),sha(previous.sourcePins));const next={...previous,E:serialize(E),baseline:{...previous.baseline,E:await obs.liveUntouched(h.pool,h.keys,E,h.time())}};privateWrite('state-B2-final.json',next);report.new_E={fresh_bilateral_private_positive:true,same_synthetic_pins:true,live_before_switch:next.baseline.E};publicWrite('phase-B2-ready.json',{status:'READY_FOR_BROWSER_AND_STOP',phase});}
   else{const E=restore(previous.E);const stop=await h.call(E.host,h.base(E)+`/${E.game}/stop`,'POST',{request_id:cryptoRandomUUID()});assert.equal(stop.status,200);const current=await h.call(previous.A.host,h.roomPath(previous.A));assert.equal(current.status,200);report.final_current={safe_exit:true,narrowed_policy_preserved:true,ordinary_room200:true};publicWrite('phase-A3-ready.json',{status:'READY_FOR_STOP',phase});}
  }
  await command('STOP');await service.close();closed=true;report.pool_closed=true;report.status='PHASE_COMPLETE';
 }catch(error){report.error=safeError(error,phase);report.status='FAIL';}
 finally{if(service&&!closed){try{await service.close();report.pool_closed=true;}catch{report.pool_closed=false;}}report.elapsed_ms=performance.now()-started;try{publicWrite('phase-'+phase+'-terminal.json',report);}catch(error){report.error??=safeError(error,phase);report.evidence_write_failed=true;report.status='FAIL';}console.log(JSON.stringify({phase,status:report.status,pool_closed:report.pool_closed,process_nonce:processNonce,error:report.error??null,evidence_write_failed:report.evidence_write_failed===true}));}
 return report;
}
function cryptoRandomUUID(){return globalThis.crypto.randomUUID();}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const arg=process.argv.find(x=>x.startsWith('--boot='));if(!arg)console.log(JSON.stringify({status:'NOT_RUN',DB_connections:0,listeners:0}));else{const r=await boot(JSON.parse(readFileSync(arg.slice(7))));process.exitCode=r.status==='PHASE_COMPLETE'?0:1;}}
