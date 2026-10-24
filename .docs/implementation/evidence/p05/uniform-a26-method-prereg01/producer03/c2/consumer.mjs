/** Owner-provisional pilot model, one declared cell; not actual transport. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadPilot} from '../pilot-loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(p));
export const axes=Object.freeze({sizes:[2,3,4,5,6,7,8],modes:['questions','truth_or_dare','yes_but'],contexts:['online','in_person'],comforts:[0,1,2,3,4],classes:['X','J','F','G','M','S','R'],stages:[1,2,3,4],capabilities:['ON','OFF'],regimes:['all_allow','narrow','asymmetric_union','all_excluded']});
export function* cells(kind){
 assert(['static','trajectory','canary'].includes(kind),'unknown cell kind');
 for(const cap of axes.capabilities)for(const regime of axes.regimes)for(const size of axes.sizes)for(const mode of axes.modes)for(const context of axes.contexts){
  const base={cap,regime,size,mode,context};
  if(kind==='static')for(const comfort of axes.comforts)for(const pairClass of axes.classes)for(const stage of axes.stages)yield {...base,comfort,pairClass,stage,rounds:20};
  if(kind==='trajectory'){
   for(let rounds=1;rounds<=100;rounds++)yield {...base,comfort:0,pairClass:'F',rounds,profile:'neutral_C0_F'};
   for(const comfort of [1,4])for(const pairClass of ['F','G','M','S','R'])yield {...base,comfort,pairClass,rounds:100,profile:'private_R100'};
   if(mode==='yes_but')yield {...base,comfort:0,pairClass:'X',rounds:20,profile:'all_X'};
  }
  if(kind==='canary')yield {...base,comfort:1,pairClass:'F',rounds:20,profile:'cross_session_mode_and_targeted'};
 }
}
export function cellAt(kind,index){
 assert(Number.isSafeInteger(index)&&index>=0,'nonnegative integer cell required');
 let current=0;for(const cell of cells(kind)){if(current++===index)return cell;}
 assert.fail('cell index outside declared axes');
}
export function safetyState(snapshot,topicIds,regime,revision=1){
 assert(axes.regimes.includes(regime),'unknown safety regime');
 assert(topicIds.includes('creative_expression')&&topicIds.includes('music_sound'),'bound taxonomy required');
 return {room_id:snapshot.baseline.room_id,revision,members:snapshot.baseline.players.map((p,index)=>({member_id:p.id,revision,
  allow_topic_ids:regime==='narrow'?['creative_expression']:[...topicIds],
  excluded_topic_ids:regime==='all_excluded'?[...topicIds]:regime==='asymmetric_union'?[index%2?'creative_expression':'music_sound']:[]}))};
}
export function fullUnionAllowed(card,map,state,actors){
 const subjects=map.entry(card.id).topic_ids;
 return actors.every(id=>{const member=state.members.find(m=>m.member_id===id);return member&&subjects.every(t=>member.allow_topic_ids.includes(t)&&!member.excluded_topic_ids.includes(t));});
}
const actorsFor=(card,snapshot)=>card.interaction==='group'?[[]]:card.interaction==='solo'?snapshot.players.map(p=>[p.id]):snapshot.players.flatMap(a=>snapshot.players.filter(b=>a.id!==b.id).map(b=>[a.id,b.id]));
export function staticCell(cell,env){
 const {pack,map,eligible}=env,snapshot=env.snapshot(cell),state=safetyState(snapshot,map.topics.map(t=>t.topic_id),cell.regime);
 const candidates=pack.cards.filter(c=>c.mode===cell.mode&&map.allowed(c)&&actorsFor(c,snapshot.baseline).some(a=>eligible(c,snapshot.baseline,a,cell.stage)&&(c.interaction!=='pair_private'||fullUnionAllowed(c,map,state,a))));
 const privateRows=candidates.filter(c=>c.interaction==='pair_private'&&c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away);
 if(cell.stage<3||cell.comfort===0||['X','J'].includes(cell.pairClass)||cell.cap==='OFF')assert.equal(candidates.filter(c=>c.interaction==='pair_private').length,0,'forbidden private candidate');
 const neutral=candidates.filter(c=>c.interaction!=='pair_private');
 const count=rows=>({card_ids:rows.length,semantic_family_union:new Set(rows.flatMap(c=>map.entry(c.id).semantic_family_ids)).size,
  one_family_per_card:rows.every(c=>map.entry(c.id).semantic_family_ids.length===1),operation_slots_if_single_family:rows.every(c=>map.entry(c.id).semantic_family_ids.length===1)?new Set(rows.map(c=>map.entry(c.id).semantic_family_ids[0])).size:null});
 const classification=cell.stage<3?'RULE_EXCLUDED_STAGE':cell.comfort===0?'RULE_EXCLUDED_COMFORT':['X','J'].includes(cell.pairClass)?'RULE_EXCLUDED_CLASS':cell.cap==='OFF'?'CAPABILITY_UNAVAILABLE':privateRows.length<25?'CONTENT_GAP':'NECESSARY_CARD_COUNT_SATISFIED_NOT_PATH_PROOF';
 return {cell,status:'STATIC_ONLY_NOT_C2_PATH_PASS',all_eligible:count(candidates),neutral:count(neutral),private_baseline:count(privateRows),private_classification:classification,required_private_card_ids:25,required_neutral_rounds:20,history_applied:false,planner_run:false,candidate_identities:candidates.map(c=>({card_id:c.id,revision:c.revision,interaction:c.interaction,semantic_family_ids:[...map.entry(c.id).semantic_family_ids]})),neutral_card_ids:neutral.map(c=>c.id),private_baseline_card_ids:privateRows.map(c=>c.id)};
}
export function runPreflight(cell,env,prior={public_history:[],private_history:[]},sessionId){
 const snapshot=env.snapshot(cell,sessionId),state=safetyState(snapshot,env.map.topics.map(t=>t.topic_id),cell.regime);
 try{
  const result=env.preflightTopics(snapshot,env.pack,env.map,state,prior);
  assert.notEqual(cell.profile,'all_X','yes_but all-X must refuse');
  assert.equal(result.simulation_only,true);assert.equal(result.history.provenance,'SIMULATION_ONLY');
  assert.equal(result.planned_rounds,cell.rounds);assert.equal(result.history.rounds.length,cell.rounds);
  for(const name of ['private_opportunities','private_playable','private_safe_empty'])assert(Number.isSafeInteger(result[name])&&result[name]>=0,'nonnegative safe integer '+name);
  const privateRounds=result.history.rounds.filter(r=>r.interaction==='pair_private');
  assert(privateRounds.every(r=>r.card===null||r.card&&typeof r.card==='object'&&!Array.isArray(r.card)&&typeof r.card.card_id==='string'),'explicit null or card reference');
  assert.equal(privateRounds.length,result.private_opportunities);assert(privateRounds.length<=Math.ceil(.25*cell.rounds));
  assert(privateRounds.every(r=>r.stage>=3));
  assert.equal(result.private_playable,privateRounds.filter(r=>r.card!==null).length,'playable count equals actual non-null private cards');
  assert.equal(result.private_safe_empty,privateRounds.filter(r=>r.card===null).length,'safe-empty count equals actual null private cards');
  assert.equal(result.private_playable+result.private_safe_empty,privateRounds.length);
  if(cell.cap==='OFF')assert.equal(privateRounds.length,0);
  const publicFamilies=new Set(result.history.public_history.flatMap(r=>env.map.entry(r.card_id).semantic_family_ids));
  for(const round of privateRounds)if(round.card){assert(fullUnionAllowed(env.pack.card(round.card.card_id),env.map,state,round.actors));assert(env.map.entry(round.card.card_id).semantic_family_ids.every(f=>!publicFamilies.has(f)),'public semantic history constrains private');}
  const check=(rows,privateOnly)=>{const seen=new Map();for(const row of rows){const key=privateOnly?[...row.actors].sort().join(':'):'public',families=env.map.entry(row.card_id).semantic_family_ids,used=seen.get(key)??new Set();assert(families.every(f=>!used.has(f)),'semantic repeat');families.forEach(f=>used.add(f));seen.set(key,used);}};
  check(result.history.public_history,false);check(result.history.private_history,true);
  return {status:result.private_safe_empty?'PLANNED_WITH_PRIVATE_SAFE_EMPTY':'PLANNED_SIMULATION_ONLY',cell,requested_rounds:cell.rounds,planned_rounds:result.planned_rounds,private_opportunities:result.private_opportunities,private_playable:result.private_playable,private_safe_empty:result.private_safe_empty,prefix_available:true,history:result.history,simulation_only:true,actual_transport:false};
 }catch(error){
  if(error?.code!=='TOPIC_SAFE_POOL_EXHAUSTED')throw error;
  return {status:'SAFE_REFUSAL',cell,error_code:error.code,requested_rounds:cell.rounds,planned_rounds:null,prefix_available:false,history:null,private_opportunities:null,private_playable:null,private_safe_empty:null,reason:'Existing preflightTopics throws without exposed prefix. No alternate-R/seed reconstruction.',simulation_only:true,actual_transport:false};
 }
}
const privateSignature=round=>({round_id:round.round_id,actors:round.actors,primary_member_id:round.primary_member_id,stage:round.stage,round_index:round.round_index,baseline_private_max_intensity:round.baseline_private_max_intensity,requires_action_consent:round.requires_action_consent});
export function canaryCell(cell,env){
 const first=runPreflight(cell,env),out={cell,first,status:'CANARY_PARTIAL_NOT_FULL_C2'};
 if(!first.history)return {...out,cross_session_mode:'PRECONDITION_NOT_ESTABLISHED_FIRST_REFUSAL',targeted_change:'PRECONDITION_NOT_ESTABLISHED_FIRST_REFUSAL'};
 const nextMode=axes.modes[(axes.modes.indexOf(cell.mode)+1)%axes.modes.length],prior={public_history:first.history.public_history,private_history:first.history.private_history};
 out.cross_session_mode=runPreflight({...cell,mode:nextMode},env,prior,'33333333-3333-4333-8333-333333333333');
 const publicShape=result=>result.history?.rounds.map(r=>r.interaction==='pair_private'?{round_id:r.round_id,round_index:r.round_index,stage:r.stage,private_opportunity:true}:{round_id:r.round_id,round_index:r.round_index,stage:r.stage,interaction:r.interaction,actors:r.actors,primary_member_id:r.primary_member_id,card:r.card});
 const allCell={...cell,regime:'all_allow'},session='44444444-4444-4444-8444-444444444444';
 const e0=runPreflight(allCell,env,{public_history:[],private_history:[]},session);
 const e1=runPreflight({...allCell,regime:'asymmetric_union'},env,{public_history:[],private_history:[]},session);
 const e2=runPreflight(allCell,env,{public_history:[],private_history:first.history.private_history},session);
 if(e0.history&&e1.history&&e2.history&&first.history.private_history.length){assert.deepEqual(publicShape(e0),publicShape(e1));assert.deepEqual(publicShape(e0),publicShape(e2));out.public_planner_independence='MATCHED_DECLARED_SIMULATIONS_EQUAL_NOT_WIRE_OR_INFERABILITY_PROOF';}
 else out.public_planner_independence='PRECONDITION_NOT_ESTABLISHED_REFUSAL_OR_NO_PRIOR_PRIVATE';
 const round=first.history.rounds.at(-1);
 if(round.interaction!=='pair_private')return {...out,targeted_change:'PRECONDITION_NOT_ESTABLISHED_LAST_ROUND_NOT_PRIVATE_NO_RETRY'};
 const snapshot=env.snapshot(cell),state=safetyState(snapshot,env.map.topics.map(t=>t.topic_id),cell.regime),last=round.attempts.at(-1);
 const request={operation_revision:env.targetVersion,expected_history_revision:first.history.revision,round_id:round.round_id,offer_epoch:last.offer_epoch+1,candidate_counter:last.candidate_counter+1,target_topic_ids:['creative_expression']};
 const changed=env.replaceForTopics(snapshot,first.history,env.pack,env.map,state,request);
 assert.equal(changed.history.provenance,'SIMULATION_ONLY');assert.deepEqual(privateSignature(changed.round),privateSignature(round));
 assert.deepEqual(changed.history.rounds.slice(0,-1),first.history.rounds.slice(0,-1));assert.deepEqual(changed.history.public_history,first.history.public_history);
 assert.equal(changed.round.attempts.length,round.attempts.length+1);
 if(changed.round.card){const card=env.pack.card(changed.round.card.card_id);assert(env.map.entry(card.id).topic_ids.includes('creative_expression'));assert(fullUnionAllowed(card,env.map,state,round.actors));assert(!first.history.private_history.filter(r=>[...r.actors].sort().join(':')===[...round.actors].sort().join(':')).some(r=>env.map.entry(r.card_id).semantic_family_ids.some(f=>env.map.entry(card.id).semantic_family_ids.includes(f))));}
 const excluded={...state,revision:2,members:state.members.map(m=>({...m,revision:2,excluded_topic_ids:[...new Set([...m.excluded_topic_ids,'creative_expression'])]}))};
 const rejected=env.replaceForTopics(snapshot,changed.history,env.pack,env.map,excluded,{...request,expected_history_revision:changed.history.revision,offer_epoch:request.offer_epoch+1,candidate_counter:request.candidate_counter+1});
 assert.equal(rejected.round.card,null);assert.deepEqual(privateSignature(rejected.round),privateSignature(round));
 assert.deepEqual(rejected.history.rounds.slice(0,-1),changed.history.rounds.slice(0,-1));assert.deepEqual(rejected.history.public_history,changed.history.public_history);
 assert.equal(rejected.history.provenance,'SIMULATION_ONLY');
 out.targeted_change={status:changed.round.card?'TARGET_FOUND_FULL_UNION_CHECKED':'TARGET_SAFE_EMPTY_NOT_POSITIVE_COVERAGE',then_excluded_target:'SAFE_EMPTY',same_actors_stage_budget:true,history:rejected.history};
 return out;
}
export function assertExecutionRequest(args){assert.equal(args.length,3,'command, index and explicit reviewed-draft acknowledgement required');assert(['static','trajectory','canary'].includes(args[0]));assert(/^\d+$/.test(args[1]),'decimal ordinal required');assert.equal(args[2],'--owner-provisional-pilot','independent data/method review and root exactpins prerequisite');}
export async function loadBound(){
 const base=await loadPilot(),{pack,map,engine,planner}=base,catalog=await import(pathToFileURL(path.resolve('packages/card-catalog/dist/coverage.js')).href);
 const snapshot=(cell,sessionId)=>{const baseline=catalog.coverageSnapshot(pack,cell.size,cell.mode,cell.context,cell.comfort,cell.pairClass,cell.rounds,cell.cap==='ON'?['private_text_chat']:[]);return planner.immutableTopicSnapshot({schema:2,engine_revision:planner.TOPIC_ALGORITHM,private_policy_revision:planner.TOPIC_PRIVATE_POLICY,recovery_policy_revision:planner.TOPIC_RECOVERY_POLICY,baseline:sessionId?{...baseline,session_id:sessionId}:baseline,pins_digest:engine.digest(map.pins)},pack,map);};
 return {...base,snapshot,eligible:engine.eligible,preflightTopics:planner.preflightTopics,replaceForTopics:planner.replaceTopicCandidateForTopics,targetVersion:planner.TOPIC_TARGETED_REPLACEMENT_VERSION};
}
export async function main(args){
 if(args[0]==='describe'){assert.equal(args.length,1);return read(path.join(here,'descriptor.json'));}
 if(args[0]==='check-binding'){assert.equal(args.length,1);const env=await loadBound();return {status:'BINDING_ONLY_NO_C2_RUN',pack_digest:env.pack.digest,map_pins:env.map.pins,cards:470};}
 assertExecutionRequest(args);const cell=cellAt(args[0],Number(args[1])),env=await loadBound();
 const result=args[0]==='static'?staticCell(cell,env):args[0]==='trajectory'?runPreflight(cell,env):canaryCell(cell,env);
 return {classification:'OWNER_PROVISIONAL_LOCAL_PILOT_MODEL',production_approved:false,runtime_delivery:false,owner_review_status:'OWNER_PROVISIONAL_U019_LOCAL_PILOT',professional_review_claim:false,full_C2_PASS:false,full_P05_PASS:false,cell_index:Number(args[1]),kind:args[0],pack_digest:env.pack.digest,map_pins:env.map.pins,result};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await main(process.argv.slice(2)),null,2));}catch(error){console.error(JSON.stringify({status:'FAIL',code:typeof error?.code==='string'?error.code:'CONSUMER_ERROR',raw_error_omitted:true}));process.exitCode=1;}
}
