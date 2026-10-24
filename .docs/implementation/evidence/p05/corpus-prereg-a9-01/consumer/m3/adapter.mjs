import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadPilot} from '../pilot-loader.mjs';
import {caseAt,design} from './descriptor.mjs';
import {profileFactory} from './profile.mjs';
import {modelSession} from './model.mjs';
import {pairedRatioCI,aucCI,trainLDA,deterministicDecoders} from './math.mjs';
import {stageTable} from './diagnostics.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=bytes=>createHash('sha256').update(bytes).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
export function bindEnvironment(base,engine,planner,renderer,relationshipPolicy){
 const profile=profileFactory({pack:base.pack,engine});
 return {...base,engine,planner,renderer,relationshipPolicy,makeSnapshot:d=>planner.immutableTopicSnapshot({schema:2,engine_revision:planner.TOPIC_ALGORITHM,private_policy_revision:planner.TOPIC_PRIVATE_POLICY,recovery_policy_revision:planner.TOPIC_RECOVERY_POLICY,baseline:profile(d.seed,d.size,d.mode,d.context,d.rounds,d.kind,d.pairClass),pins_digest:engine.digest(base.map.pins)},base.pack,base.map)};
}
export async function loadEnvironment(){
 const base=await loadPilot();return bindEnvironment(base,base.engine,base.planner,base.renderer,read(path.join(here,'../relationship-policy.v1.json')));
}
export function gfCase(env,descriptor){
 assert.equal(descriptor.section,'gf');assert.equal(descriptor.rounds,20);const target=pair=>[...pair].sort().join(':');
 const hit=pairClass=>{const snapshot=env.makeSnapshot({...descriptor,pairClass}),s=snapshot.baseline,state={room_id:s.room_id,revision:1,members:s.players.map(p=>({member_id:p.id,revision:1,allow_topic_ids:env.map.topics.map(t=>t.topic_id),excluded_topic_ids:[]}))},history=env.planner.createTopicHistory(snapshot,env.pack,env.map),first=env.planner.selectNextTopicRound(snapshot,history,env.pack,env.map,state).round;
  assert.equal(first.stage,1);assert.notEqual(first.interaction,'pair_private');return {target_selected:first.interaction==='pair_public'&&target(first.actors)===target(s.players.slice(0,2).map(p=>p.id)),first_round:first};};
 const g=hit('G'),f=hit('F');return {descriptor,model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',g:g.target_selected,f:f.target_selected,raw:{g:g.first_round,f:f.first_round},actual_transport:false};
}
export function invariantsSection(records){
 const stages=stageTable(),byStage=new Map(stages.map(r=>[[r.size,r.mode,r.context,r.stage].join('/'),r])),invariants=new Map(),refusals=[];let ordinal=0,totalSelected=0,totalCompleted=0;
 const merge=(target,source)=>{for(const [key,value]of Object.entries(source)){if(typeof value==='number'){assert(Number.isSafeInteger(value)&&value>=0);target[key]=(target[key]??0)+value;}else if(value&&typeof value==='object'){target[key]??={};merge(target[key],value);}}};
 for(const r of records){assert.deepEqual(r.descriptor,caseAt('invariants',ordinal++));assert(['COMPLETE_DOMAIN_MODEL','SAFE_REFUSAL'].includes(r.status));assert(Number.isSafeInteger(r.selected_rounds)&&Number.isSafeInteger(r.completed_rounds)&&r.completed_rounds>=0&&r.completed_rounds<=r.selected_rounds&&r.selected_rounds<=r.requested_rounds);assert.equal(r.raw_rounds.length,r.selected_rounds);assert.equal(r.counts.current_session_exact_ID_repeats,0);assert(r.counts.Kprivate<=Math.ceil(.25*r.requested_rounds));
  if(r.status==='COMPLETE_DOMAIN_MODEL')assert.equal(r.completed_rounds,r.requested_rounds);else{assert.equal(r.refusal.reason,'TOPIC_SAFE_POOL_EXHAUSTED');assert.equal(r.refusal.completed_prefix,r.completed_rounds);refusals.push({seed:r.descriptor.seed,...r.refusal});}
  assert.deepEqual(r.invariants.map(i=>i.id),Array.from({length:15},(_,i)=>'I'+String(i+1).padStart(2,'0')));
  for(const row of r.invariants){assert(Number.isSafeInteger(row.checks)&&row.checks>=0&&row.violations===0);const old=invariants.get(row.id)??{...row,checks:0,violations:0};old.checks+=row.checks;invariants.set(row.id,old);}
  for(const [stage,row]of Object.entries(r.counts.stages)){assert.equal(row.rounds,r.raw_rounds.filter(p=>p.stage===Number(stage)).length);assert.equal(Object.values(row.interactions).reduce((a,b)=>a+b,0),row.rounds);assert.equal(Object.values(row.min_comfort_histogram).reduce((a,b)=>a+b,0)+row.private_safe_empty,row.rounds);assert.equal(row.anti_repeat.violations,0);if(Number(stage)<3)assert.equal(row.private_opportunities,0);merge(byStage.get([r.descriptor.size,r.descriptor.mode,r.descriptor.context,stage].join('/')),row);}
  totalSelected+=r.selected_rounds;totalCompleted+=r.completed_rounds;
 }
 assert.equal(ordinal,70000,'exact70koriginalsessions');assert.equal(stages.reduce((n,r)=>n+r.rounds,0),totalSelected);
 return {status:'PASS_DOMAIN_INVARIANTS_ONLY_NOT_ACTUAL_AUTH_OR_STAGE',sessions:ordinal,selected_rounds:totalSelected,completed_rounds:totalCompleted,retained_refusals:refusals,invariants:[...invariants.values()],stage_rows:stages,actual_auth_close:'REQUIRED_SEPARATE_EVIDENCE',actual_wire_parity:'PENDING'};
}
export function fairnessCell(records){
 assert.equal(records.length,2000,'exact2000percell');const first=records[0].descriptor,seen=new Set(),invitations=Array(first.size).fill(0);let K=0,maxShare=0,zero=0,refusals=0,lateEligible=0,lateSelected=0,legacyRepeats=0;
 for(const record of records){const d=record.descriptor;assert.equal(d.section,'fairness');assert.equal(d.size,first.size);assert.equal(d.mode,first.mode);assert.equal(d.context,first.context);assert.deepEqual(d,caseAt('fairness',d.ordinal));assert(!seen.has(d.index));seen.add(d.index);refusals+=Number(record.status!=='COMPLETE_DOMAIN_MODEL');legacyRepeats+=record.counts.legacy_global_ID_repeats;
  assert.equal(record.requested_rounds,d.rounds);assert(Number.isSafeInteger(record.selected_rounds)&&Number.isSafeInteger(record.completed_rounds)&&record.completed_rounds>=0&&record.completed_rounds<=record.selected_rounds&&record.selected_rounds<=d.rounds);if(record.status==='COMPLETE_DOMAIN_MODEL')assert.equal(record.completed_rounds,d.rounds);
  const c=record.counts;assert.equal(c.D,2*c.K);assert.equal(c.invitations.reduce((a,b)=>a+b,0),c.D);K+=c.K;if(c.D)maxShare=Math.max(maxShare,...c.invitations.map(n=>n/c.D));else zero++;c.invitations.forEach((n,i)=>invitations[i]+=n);
  assert([c.K,c.D,c.Kprivate,c.private_playable,c.private_safe_empty,...c.invitations].every(n=>Number.isSafeInteger(n)&&n>=0));assert.equal(c.invitations.length,d.size);assert.equal(c.private_playable+c.private_safe_empty,c.Kprivate);
  assert.equal(record.raw_rounds.length,record.selected_rounds);const pairs=record.raw_rounds.filter(r=>r.interaction.startsWith('pair_')),privates=pairs.filter(r=>r.interaction==='pair_private');assert.equal(c.K,pairs.length);assert.equal(c.Kprivate,privates.length);assert.equal(c.private_playable,privates.filter(r=>r.card!==null).length);assert(c.Kprivate<=Math.ceil(.25*d.rounds));
  assert(privates.every(r=>r.stage>=3));const ids=record.raw_rounds.flatMap(r=>r.card?[r.card.card_id]:[]);assert.equal(c.current_session_exact_ID_repeats,ids.length-new Set(ids).size);assert.equal(c.current_session_exact_ID_repeats,0);
  for(const [stage,row]of Object.entries(c.stages))if(Number(stage)>=3){assert(Number.isSafeInteger(row.private_eligible_after_cap)&&row.private_eligible_after_cap>=0&&row.private_eligible_after_cap<=row.rounds);lateEligible+=row.private_eligible_after_cap;lateSelected+=row.private_playable;}
 }
 const D=2*K,shares=invitations.map(n=>D?n/D:null),gap=D?Math.max(...shares)-Math.min(...shares):null;
 return {status:!refusals&&D&&maxShare<=.5&&gap<=.02&&lateEligible>0&&lateSelected>0?'PASS_PURE_DOMAIN_FAIRNESS_CELL_NOT_STAGE':'NOT_ACCEPTED',K,D,invitations,individual_shares:shares,aggregate_gap:gap,max_individual_session_share:maxShare,zero_pair_sessions:zero,retained_refusals:refusals,late_eligible:lateEligible,late_playable_selected:lateSelected,legacy_global_ID_repeats:legacyRepeats,legacy_zero_compatibility_requires_disposition:legacyRepeats>0,actual_transport:false};
}
export function evaluateInference(records,names,{pooled=false}={}){
 const perClassTrain=pooled?4200:100,perClassHoldout=pooled?16800:400;assert.equal(records.length,2*(perClassTrain+perClassHoldout));
 const training=[[],[]],holdout=[[],[]],seen=new Set(),first=records[0].descriptor;let refusals=0;
 for(const r of records){const d=r.descriptor;assert.deepEqual(d,caseAt('inference',d.ordinal));assert.equal(d.comparison,first.comparison);if(!pooled)for(const k of ['size','mode','context'])assert.equal(d[k],first[k]);assert(!seen.has(d.ordinal));seen.add(d.ordinal);assert.deepEqual(r.features.names,names);const vector=r.features.features;assert.equal(vector.length,names.length);assert(vector.every(Number.isFinite));refusals+=Number(r.status!=='COMPLETE_DOMAIN_MODEL');(d.split==='train'?training:holdout)[d.comparison.indexOf(d.pairClass)].push(vector);}
 assert(training.every(v=>v.length===perClassTrain));assert(holdout.every(v=>v.length===perClassHoldout));
 const classifier=trainLDA(...training),scores=holdout.map(rows=>rows.map(classifier.score)),metric=aucCI(...scores),decoders=deterministicDecoders(training,holdout,names);
 return {status:!refusals&&metric.status==='PASS'&&!decoders.length?'PASS_DOMAIN_MODEL_LDA_ONLY_NOT_WIRE_OR_STAGE':'NOT_ACCEPTED',feature_dictionary_sha256:sha(JSON.stringify(names)),metric,heldout_scores:scores,weights:Array.from(classifier.weights),coefficient_sha256:sha(Buffer.from(classifier.weights.buffer)),intercept:classifier.intercept,structural_deterministic_decoders:decoders,refusals_retained:refusals,pooling:pooled?'SEPARATELY_TRAINED_POOLED_RAW_ROWS_NOT_CELL_SCORES':'PER_CELL',actual_wire_parity:'PENDING'};
}
export function reduceGf(records){const counters={both:0,g_only:0,f_only:0,neither:0},target=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'].join(':');let index=0;for(const r of records){assert.deepEqual(r.descriptor,caseAt('gf',index++));for(const side of ['g','f']){assert.equal(typeof r[side],'boolean');const first=r.raw[side];assert.equal(first.stage,1);assert.notEqual(first.interaction,'pair_private');assert.equal(r[side],first.interaction==='pair_public'&&[...first.actors].sort().join(':')===target);}counters[r.g?(r.f?'both':'g_only'):(r.f?'f_only':'neither')]++;}assert.equal(index,1000000,'exact1Mpairedrows');return pairedRatioCI(counters);}
export function safeCode(error){const codes=['ERR_ASSERTION','ENOENT','EACCES','TOPIC_SAFE_POOL_EXHAUSTED','TOPIC_STALE','TOPIC_SNAPSHOT_VERSION_UNSUPPORTED'];return codes.includes(error?.code)?error.code:'MODEL_OR_INPUT_FAILURE';}
export async function main(args){
 if(args[0]==='describe'){assert.equal(args.length,1);return {...design,revision:'P05-V2-M3-OWNER-PILOT-REBIND-01',original_method_revision:design.revision,authority_scope:'OWNER_PROVISIONAL_LOCAL_PILOT',full_M3_worker:'DEFERRED_UNTIL_C2_CAPACITY_ACCEPTED',actual_corpus_runs:0};}
 if(args[0]==='check-binding'){assert.equal(args.length,1);const env=await loadEnvironment();return {status:'BOUND_ONLY_NO_CORPUS_RUN',cards:env.pack.cards.length,map_pins:env.map.pins,production_serializer:'topicGameView',model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH'};}
 assert.equal(args.length,4,'case section ordinal --owner-provisional-pilot');assert.equal(args[0],'case');assert(/^\d+$/.test(args[2]));assert.equal(args[3],'--owner-provisional-pilot','external method review/root authorization prerequisite');const descriptor=caseAt(args[1],Number(args[2])),env=await loadEnvironment();
 if(descriptor.section==='gf')return {status:'ONE_DECLARED_CASE_NOT_SECTION_PASS',production_approved:false,owner_provisional:true,runtime_delivery:false,full_P05_PASS:false,result:gfCase(env,descriptor)};
 const publicFrames=[];let result;try{result=modelSession(env,descriptor,{onFrame:frame=>publicFrames.push(frame)});}catch(error){if(error.domain_prefix)error.domain_prefix.public_frames=publicFrames;throw error;}
 return {status:'ONE_DECLARED_CASE_NOT_SECTION_PASS',production_approved:false,owner_provisional:true,runtime_delivery:false,full_P05_PASS:false,result,public_frames:publicFrames};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await main(process.argv.slice(2)),null,2));}catch(error){console.error(JSON.stringify({status:'FAIL_NO_RETRY',code:safeCode(error),raw_error_omitted:true,...(error.domain_prefix?{domain_prefix:error.domain_prefix}:{})}));process.exitCode=1;}
}
