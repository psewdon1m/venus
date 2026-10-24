/** One distinct actual server process. Never send private state or exception bodies to evidence. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {component} from './factory.mjs';
import {liveUntouched,revokedUntouched} from './observations.mjs';
import {fixtureFrom,phaseOne,phaseTwo,phaseThree} from './phases.mjs';
const start=performance.now(),report={schema_version:1,status:'FAIL',pid:process.pid,phase:null,checks:[],chronology:[],runtime_cleanup:'failed'};let runtime,step='construct';
const mark=(stage,extra={})=>report.chronology.push({stage,native_elapsed_ms:performance.now()-start,wall_utc:new Date().toISOString(),...extra});
try{
 runtime=await component(process.argv[2],process.argv[3]);const {h,config}=runtime;report.phase=config.phase;report.server_time_ms=h.time();report.clock_policy='EXPLICIT_FIXED_FORWARD_FIXTURE_NOT_NATURAL_TTL';step='migrate';await runtime.migrate();mark('migrations_completed');
 const state=existsSync(config.stateFile)?JSON.parse(readFileSync(config.stateFile,'utf8')):null;let beforeD,rawBootD;
 if(config.phase>1){assert(state?.D);step='untouched_D_live_before_boot';beforeD=await liveUntouched(h.pool,h.keys,fixtureFrom(state.D),h.time());mark('raw_D_live_before_boot',{remaining_positive:true});}
 step='bootGate';const boot=await h.topics.bootGate();assert.equal(boot.private_scopes_revoked,true);mark('actual_bootGate_returned',{boot});
 if(config.phase>1){step='raw_D_observer_before_other_reconcile_or_http';rawBootD=await revokedUntouched(h.pool,h.keys,fixtureFrom(state.D),state.baseline.D);mark('raw_D_revocation_observer_completed',{rawBootD});}
 step='legacy_reconcile';await h.legacy.reconcilePublicPairPolicy();mark('legacy_reconcile_completed');step='maintain';await h.rooms.maintain();mark('Rooms_maintain_completed');step='listen';await h.listen();mark('listener_opened');
 report.before_D=beforeD??null;report.raw_boot_D=rawBootD??null;report.production_catalog_reconcile='NOT_COMPOSED_SYNTHETIC_SOURCE';step='protected_http_phase'+config.phase;
 const result=config.phase===1?await phaseOne(h):config.phase===2?await phaseTwo(h,state,{boot,rawBootD,chronology:report.chronology}):await phaseThree(h,state,{boot,rawBootD,chronology:report.chronology});
 if(result.privateState)writeFileSync(config.stateFile,JSON.stringify(result.privateState),{mode:0o600});report.checks=result.checks;report.status='PASS';mark('protected_phase_completed');
}catch(error){report.failure={step,name:error.name,code:typeof error.code==='string'?error.code:null,frames:String(error.stack??'').split('\n').filter(line=>/^\s*at /.test(line)&&line.includes('file:///app/')).slice(0,12)};process.exitCode=1;}
finally{
 try{await runtime?.close();report.runtime_cleanup='completed';mark('app_pool_closed_authority_preserved');}catch(error){report.failure??={step:'close',name:error.name};report.status='FAIL';process.exitCode=1;}
 report.native_elapsed_ms=performance.now()-start;
 if(process.send&&process.connected)await new Promise(resolve=>process.send({type:'CHILD_COMPLETE',report},()=>resolve()));
 if(process.connected)process.disconnect();
}
