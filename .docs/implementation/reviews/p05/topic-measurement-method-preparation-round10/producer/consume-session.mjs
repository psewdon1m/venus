import {MemorySession} from './memory-session.mjs';
import {runLifecycle} from './lifecycle.mjs';
import {observations} from './observations.mjs';
import {sessionDiagnostics} from './diagnostics.mjs';
import {invariantAudit} from './invariants.mjs';
export async function consumeSession(f,descriptor,{onPublic=()=>{},onPrivate=()=>{},shouldStop=()=>false,onRound=()=>{}}={}){
 const session=new MemorySession(f,descriptor),diag=sessionDiagnostics(session),invariants=invariantAudit(session),recorder=observations(session,{onPublic,onClock:clock=>onPublic({event_kind:'CLOCK_TICK',clock})});let summary;
 try{await session.initialize();summary=await runLifecycle(session,{observe:recorder.observe,privateRecord:onPrivate,roundCheck:async(...args)=>{await diag.check(...args);await invariants.plan(...args);},shouldStop,onRound});}
 catch(error){if(error.code==='TOPIC_SAFE_POOL_EXHAUSTED')summary={status:'SAFE_REFUSAL',requested_rounds:descriptor.rounds,completed_rounds:[...session.rounds.values()].filter(r=>['completed','skipped','stopped'].includes(r.state)).length,unavailable_branches:0,refusal:{reason:error.code},history:session.history};else throw error;}
 const features=recorder.finish(summary);return{descriptor,summary:{...summary,history:undefined},diagnostics:diag.finish(),invariants:invariants.finish(),features,history:session.history};
}
