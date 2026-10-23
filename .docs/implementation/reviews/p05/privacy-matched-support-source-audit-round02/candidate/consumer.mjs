/** Matched current-session domain observations, not authentication or wire. */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {modelSession} from './matched-model.mjs';
export const count=7;
export const supportPlans=Object.freeze([
 {cell:3,seedRounds:100,targets:['semantic']},
 {cell:13,seedRounds:100,targets:['exclusion','semantic']},
 {cell:14,seedRounds:100,targets:['exclusion','semantic']},
 {cell:20,seedRounds:100,targets:['exclusion','semantic']},
 {cell:34,seedRounds:100,targets:['semantic']},
 {cell:2,seedRounds:20,targets:['exclusion'],topic:'absurd_fiction'},
 {cell:15,seedRounds:20,targets:['exclusion'],topic:'absurd_fiction'}
].map(row=>Object.freeze({...row,targets:Object.freeze(row.targets)})));
export function caseAt(ordinal){
 assert(Number.isSafeInteger(ordinal)&&ordinal>=0&&ordinal<count);const plan=supportPlans[ordinal],cell=plan.cell;
 return {section:'PRIVACY_SUPPORT_CONSTRUCTIVE_01',ordinal,fixture_id:'SUPPORT-C'+cell+'-SEEDR'+plan.seedRounds+'-CURRENT20-01',cell,size:2+Math.floor(cell/6),mode:['questions','truth_or_dare','yes_but'][Math.floor(cell/2)%3],context:['online','in_person'][cell%2],rounds:20,kind:'exchangeable',pairClass:'F',seed:`venus:P05:privacy:matched01:${cell}:R${plan.seedRounds}`,original_input_ordinal:2*cell+(plan.seedRounds===100?1:0),seed_literal_rounds:plan.seedRounds,target_comparisons:[...plan.targets],exclusion_topic:plan.topic??null};
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
 const topic=descriptor.exclusion_topic??topics[descriptor.cell%topics.length];assert(topics.includes(topic));
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
export function originalCoverage(){
 const raw=readFileSync(new URL('./ORIGINAL-COVERAGE.json',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),'bcbee530ee09c1b9f85d22b835fb61aa61ba6a97bad4dd3e21be426e2a9bbb0f');const value=JSON.parse(raw);
 assert.equal(value.status,'ORIGINAL84_NOT_COVERED_IMMUTABLE');assert.equal(value.cells.length,42);assert.deepEqual(value.cells.map(c=>c.cell),Array.from({length:42},(_,i)=>i));
 for(const kind of ['exclusion','semantic'])assert.deepEqual(value.cells.filter(c=>!c[kind+'_covered']).map(c=>c.cell),kind==='exclusion'?[2,13,14,15,20]:[3,13,14,20,34]);return value;
}
export function summarize(records,env){
 assert(env,'Bound native environment required for full raw replay');assert.equal(records.length,count);const baseline=originalCoverage(),support={exclusion:[],semantic:[]},retained=[],failures=[],targets=[];
 for(const [ordinal,row]of records.entries()){
  assert.deepEqual(row.descriptor,caseAt(ordinal));assert.deepEqual(row,measureMatched(env,caseAt(ordinal)),'canonical fresh20 native whole-session replay, never shortened R100 history');
  for(const kind of ['exclusion','semantic']){
   const expected=classifyPair(row.raw.base,row.raw[kind],{changed:kind==='exclusion'||row.raw.prior.history.private_history.length>0,effective:kind==='exclusion'?row.affected_eligible_private_card_ids.length>0:row.raw.prior.history.private_history.length>0});assert.deepEqual(row.comparisons[kind],expected);
   const targeted=row.descriptor.target_comparisons.includes(kind);retained.push({ordinal,cell:row.descriptor.cell,kind,targeted,...expected});if(expected.status.startsWith('FAIL'))failures.push({ordinal,kind,targeted,...expected});
   if(targeted){targets.push({ordinal,cell:row.descriptor.cell,kind,status:expected.status});if(expected.status==='PASS_MATCHED_DOMAIN_ONLY'&&row.raw.prior.status==='COMPLETE_DOMAIN_MODEL'&&row.raw.prior.requested_rounds===20&&row.raw.prior.completed_rounds===20&&[row.raw.base,row.raw[kind]].every(arm=>arm.requested_rounds===20&&arm.completed_rounds===20)){assert.equal(expected.classification,'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE');support[kind].push(row.descriptor.cell);}}
  }
 }
 assert.equal(targets.length,10);assert.equal(retained.length,14);for(const kind of ['exclusion','semantic'])assert.deepEqual(targets.filter(r=>r.kind===kind).map(r=>r.cell).sort((a,b)=>a-b),kind==='exclusion'?[2,13,14,15,20]:[3,13,14,20,34]);
 const combined=baseline.cells.map(c=>({...c,supplemental_exclusion:support.exclusion.includes(c.cell),supplemental_semantic:support.semantic.includes(c.cell)}));const uncovered=Object.fromEntries(['exclusion','semantic'].map(kind=>[kind,combined.filter(c=>!c[kind+'_covered']&&!c['supplemental_'+kind]).map(c=>c.cell)]));
 return {status:failures.length?'FAIL':Object.values(uncovered).some(v=>v.length)?'NOT_COVERED':'PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE',cases:count,comparisons:14,targeted_comparisons:10,untargeted_comparisons:4,targets,failures,out_of_support:retained.filter(r=>r.classification!=='COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE'),retained_comparisons:retained,original84_status:'NOT_COVERED_IMMUTABLE',original_covered_cells:{exclusion:37,semantic:37},source_refusal_branches:'SOURCE_BRANCH_ONLY_NEVER_FILL_COMMON_COVERAGE',combined_coverage:combined,uncovered_cells:uncovered,actual_wire:false,full_P05_PASS:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='describe')console.log(JSON.stringify({status:'PROPOSED_METHOD_NOT_AUTHORIZATION',cases:count,native_runs_per_case:4,comparisons:14,targeted_comparisons:10,actual_RUN:false}));
 else{
  assert.equal(args.length,3);assert.equal(args[0],'case');assert.match(args[1],/^\d+$/);assert.equal(args[2],'--owner-provisional-pilot');
  // Root supplies accepted method/exact ordinal/source/image via EXISTING
  // bounded worker/ACK; this capability token is not itself run authorization.
  try{const {loadEnvironment}=await import('../p05-pilot-corpus-ranges02/m3/adapter.mjs');const env=await loadEnvironment();console.log(JSON.stringify(measureMatched(env,caseAt(Number(args[1])))));}
  catch(error){console.log(JSON.stringify({status:'FAIL_NO_RETRY_NO_OTHER_ARMS_RUN',code:'MATCHED_METHOD_OR_INPUT_FAILURE',matched_prefix:error.matched_prefix??null}));process.exitCode=1;}
 }
}
