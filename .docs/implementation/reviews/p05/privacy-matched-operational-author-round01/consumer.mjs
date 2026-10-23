/** Matched current-session domain observations, not authentication or wire. */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {modelSession} from './matched-model.mjs';
export const count=84;
export function caseAt(ordinal){
 assert(Number.isSafeInteger(ordinal)&&ordinal>=0&&ordinal<count);
 const cell=Math.floor(ordinal/2),rounds=ordinal%2?100:20;
 return {section:'PRIVACY_MATCHED_STRUCTURAL_CANDIDATE_01',ordinal,cell,size:2+Math.floor(cell/6),mode:['questions','truth_or_dare','yes_but'][Math.floor(cell/2)%3],context:['online','in_person'][cell%2],rounds,kind:'exchangeable',pairClass:'F',seed:`venus:P05:privacy:matched01:${cell}:R${rounds}`};
}
export function classifyPair(base,variant,{changed,effective}){
 const sequence=r=>r.raw_rounds.map(x=>({round_id:x.round_id,round_index:x.round_index,stage:x.stage,kind:x.interaction==='pair_private'?'generic':x.interaction,...(x.interaction==='pair_private'?{}:{card:x.card,actors:x.actors,primary_member_id:x.primary_member_id})}));
 const sequence_equal=isDeepStrictEqual(sequence(base),sequence(variant));
 const payloads=r=>r.public_frames.map(x=>({modeled_tick:x.modeled_tick,payload:x.payload}));
 const public_trace_equal=isDeepStrictEqual(payloads(base),payloads(variant));
 const positive_private=base.counts.private_playable>0&&variant.counts.private_playable>0;
 const full_common=changed&&effective&&positive_private&&base.status==='COMPLETE_DOMAIN_MODEL'&&variant.status==='COMPLETE_DOMAIN_MODEL'&&base.counts.private_safe_empty===0&&variant.counts.private_safe_empty===0;
 return {changed,effective,positive_private,classification:!changed?'NO_HIDDEN_CHANGE':!effective?'OUT_OF_SUPPORT_NO_EFFECTIVE_HIDDEN_INPUT':!positive_private?'OUT_OF_SUPPORT_NO_POSITIVE_PRIVATE':full_common?'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE':'OUT_OF_SUPPORT_REFUSAL_OR_SAFE_EMPTY',sequence_equal,public_trace_equal,base_status:base.status,variant_status:variant.status,retained_refusals:[base.refusal,variant.refusal],base_safe_empty:base.counts.private_safe_empty,variant_safe_empty:variant.counts.private_safe_empty,
  status:!sequence_equal?'FAIL_SELECTOR_PUBLIC_SEQUENCE':full_common&&!public_trace_equal?'FAIL_COMMON_SUPPORT_PUBLIC_TRACE':full_common?'PASS_MATCHED_DOMAIN_ONLY':'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS'};
}
export function measureMatched(env,descriptor,{run=modelSession}={}){
 assert.deepEqual(descriptor,caseAt(descriptor.ordinal));
 const {engine:e,planner:p,pack,map}=env,topics=map.topics.map(t=>t.topic_id).sort();assert(topics.length>0);
 const snapshot=env.makeSnapshot(descriptor),publicIdentity=e.digest(snapshot);
 const completedArms=[];
 const capture=(environment,d,options={})=>{const frames=[];try{const result=run(environment,d,{...options,onFrame:f=>frames.push(f)});const retained={...result,public_frames:frames};completedArms.push(retained);return retained;}catch(error){error.matched_prefix={descriptor,completed_arms:completedArms,failed_arm_ordinal:completedArms.length,public_frames:frames,domain_prefix:error.domain_prefix??null};throw error;}};
 // A complete native prior session: keep BOTH entire streams, never truncate or
 // relabel a preflight history. Counterfactual arms share the public stream.
 const priorDescriptor={...descriptor,seed:descriptor.seed+':prior',rounds:20};
 const priorEnv={...env,makeSnapshot:d=>{const native=env.makeSnapshot(d);return p.immutableTopicSnapshot({...native,baseline:e.immutableSnapshot({...native.baseline,session_id:'33333333-3333-4333-8333-333333333333'},pack)},pack,map);}};
 const prior=capture(priorEnv,priorDescriptor),priorPublic=prior.history.public_history,priorPrivate=prior.history.private_history;
 const commonPrior={public_history:priorPublic,private_history:[]};
 const safety={room_id:snapshot.baseline.room_id,revision:1,members:snapshot.baseline.players.map(player=>({member_id:player.id,revision:1,allow_topic_ids:topics,excluded_topic_ids:[]}))};
 const topic=topics[descriptor.cell%topics.length];
 // Native supported preference form: exclusion also removes it from allow;
 // conversation creation rejects overlapping allow/exclude arrays.
 const excluded={...safety,members:safety.members.map((m,i)=>({...m,allow_topic_ids:i===0?m.allow_topic_ids.filter(t=>t!==topic):m.allow_topic_ids,excluded_topic_ids:i===0?[topic]:[]}))};
 const base=capture(env,descriptor,{initialSafety:safety,prior:commonPrior});
 const exclusion=capture(env,descriptor,{initialSafety:excluded,prior:commonPrior});
 const semantic=capture(env,descriptor,{initialSafety:safety,prior:{public_history:priorPublic,private_history:priorPrivate}});
 assert.equal(e.digest(env.makeSnapshot(descriptor)),publicIdentity,'same native public snapshot');
 const affected=pack.cards.filter(card=>card.mode===descriptor.mode&&card.interaction==='pair_private'&&map.allowed(card)&&map.entry(card.id).topic_ids.includes(topic)&&snapshot.baseline.players.some(a=>snapshot.baseline.players.some(b=>a.id!==b.id&&e.eligible(card,snapshot.baseline,[a.id,b.id],4)))).map(c=>c.id);
 return {descriptor,model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',actual_transport:false,approved_method:false,public_snapshot_sha256:publicIdentity,target_exclusion_topic:topic,excluded_member_ordinal:0,affected_eligible_private_card_ids:affected,prior_status:prior.status,prior_private_family_ids:[...new Set(priorPrivate.flatMap(row=>map.entry(row.card_id).semantic_family_ids))].sort(),
  comparisons:{exclusion:classifyPair(base,exclusion,{changed:true,effective:affected.length>0}),semantic:classifyPair(base,semantic,{changed:priorPrivate.length>0,effective:priorPrivate.length>0})},
  raw:{prior,base,exclusion,semantic},missing_oracles:['Independent before-results structural theorem and method acceptance','Final source/image equivalence and existing bounded rootACK before execution','Actual HTTP/WS final delivery, observation scheduling, timing and coalescing parity'],full_P05_PASS:false};
}
export function summarize(records,env){
 assert(env,'Bound native environment required for full raw replay');
 assert.equal(records.length,count);const support={exclusion:[],semantic:[]},out=[],failures=[];
 for(const [ordinal,row]of records.entries()){
  assert.deepEqual(row.descriptor,caseAt(ordinal));
  assert.deepEqual(row,measureMatched(env,caseAt(ordinal)),'canonical native descriptor/raw/input/outcome replay');
  for(const kind of ['exclusion','semantic']){const r=row.comparisons[kind];
   // Recompute from retained raw, never trust a projected status/count alone.
   const expected=classifyPair(row.raw.base,row.raw[kind],{changed:kind==='exclusion'||row.raw.prior.history.private_history.length>0,effective:kind==='exclusion'?row.affected_eligible_private_card_ids.length>0:row.raw.prior.history.private_history.length>0});assert.deepEqual(r,expected);
   if(r.status.startsWith('FAIL'))failures.push({ordinal,kind,...r});
   if(r.classification==='COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE')support[kind].push(row.descriptor.cell);else out.push({ordinal,kind,...r});
  }
 }
 const uncovered=Object.fromEntries(Object.entries(support).map(([kind,cells])=>[kind,Array.from({length:42},(_,i)=>i).filter(i=>!cells.includes(i))]));
 return {status:failures.length?'FAIL':Object.values(uncovered).some(x=>x.length)?'NOT_COVERED':'PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE',cases:count,comparisons:count*2,failures,out_of_support:out,uncovered_cells:uncovered,actual_wire:false,full_P05_PASS:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='describe')console.log(JSON.stringify({status:'PROPOSED_METHOD_NOT_AUTHORIZATION',cases:count,native_runs_per_case:4,comparisons:168,actual_RUN:false}));
 else{
  assert.equal(args.length,3);assert.equal(args[0],'case');assert.match(args[1],/^\d+$/);assert.equal(args[2],'--owner-provisional-pilot');
  // Root supplies accepted method/exact ordinal/source/image via EXISTING
  // bounded worker/ACK; this capability token is not itself run authorization.
  try{const {loadEnvironment}=await import('../p05-pilot-corpus-ranges02/m3/adapter.mjs');const env=await loadEnvironment();console.log(JSON.stringify(measureMatched(env,caseAt(Number(args[1])))));}
  catch(error){console.log(JSON.stringify({status:'FAIL_NO_RETRY_NO_OTHER_ARMS_RUN',code:'MATCHED_METHOD_OR_INPUT_FAILURE',matched_prefix:error.matched_prefix??null}));process.exitCode=1;}
 }
}
