/** Existing reducers; only async function/for-await adaptation for bounded raw replay. */
import assert from 'node:assert/strict';
import {caseAt} from './m3/descriptor.mjs';
import {stageTable} from './m3/diagnostics.mjs';
import {pairedRatioCI} from './m3/math.mjs';
export async function invariantsSection(records){
 const stages=stageTable(),byStage=new Map(stages.map(r=>[[r.size,r.mode,r.context,r.stage].join('/'),r])),invariants=new Map(),refusals=[];let ordinal=0,totalSelected=0,totalCompleted=0;
 const merge=(target,source)=>{for(const [key,value]of Object.entries(source)){if(typeof value==='number'){assert(Number.isSafeInteger(value)&&value>=0);target[key]=(target[key]??0)+value;}else if(value&&typeof value==='object'){target[key]??={};merge(target[key],value);}}};
 for await(const r of records){assert.deepEqual(r.descriptor,caseAt('invariants',ordinal++));assert(['COMPLETE_DOMAIN_MODEL','SAFE_REFUSAL'].includes(r.status));assert(Number.isSafeInteger(r.selected_rounds)&&Number.isSafeInteger(r.completed_rounds)&&r.completed_rounds>=0&&r.completed_rounds<=r.selected_rounds&&r.selected_rounds<=r.requested_rounds);assert.equal(r.raw_rounds.length,r.selected_rounds);assert.equal(r.counts.current_session_exact_ID_repeats,0);assert(r.counts.Kprivate<=Math.ceil(.25*r.requested_rounds));
  if(r.status==='COMPLETE_DOMAIN_MODEL')assert.equal(r.completed_rounds,r.requested_rounds);else{assert.equal(r.refusal.reason,'TOPIC_SAFE_POOL_EXHAUSTED');assert.equal(r.refusal.completed_prefix,r.completed_rounds);refusals.push({seed:r.descriptor.seed,...r.refusal});}
  assert.deepEqual(r.invariants.map(i=>i.id),Array.from({length:15},(_,i)=>'I'+String(i+1).padStart(2,'0')));
  for(const row of r.invariants){assert(Number.isSafeInteger(row.checks)&&row.checks>=0&&row.violations===0);const old=invariants.get(row.id)??{...row,checks:0,violations:0};old.checks+=row.checks;invariants.set(row.id,old);}
  for(const [stage,row]of Object.entries(r.counts.stages)){assert.equal(row.rounds,r.raw_rounds.filter(p=>p.stage===Number(stage)).length);assert.equal(Object.values(row.interactions).reduce((a,b)=>a+b,0),row.rounds);assert.equal(Object.values(row.min_comfort_histogram).reduce((a,b)=>a+b,0)+row.private_safe_empty,row.rounds);assert.equal(row.anti_repeat.violations,0);if(Number(stage)<3)assert.equal(row.private_opportunities,0);merge(byStage.get([r.descriptor.size,r.descriptor.mode,r.descriptor.context,stage].join('/')),row);}
  totalSelected+=r.selected_rounds;totalCompleted+=r.completed_rounds;
 }
 assert.equal(ordinal,70000,'exact70koriginalsessions');assert.equal(stages.reduce((n,r)=>n+r.rounds,0),totalSelected);
 return {status:'PASS_DOMAIN_INVARIANTS_ONLY_NOT_ACTUAL_AUTH_OR_STAGE',sessions:ordinal,selected_rounds:totalSelected,completed_rounds:totalCompleted,retained_refusals:refusals,invariants:[...invariants.values()],stage_rows:stages,actual_auth_close:'REQUIRED_SEPARATE_EVIDENCE',actual_wire_parity:'PENDING'};
}
export async function reduceGf(records){const counters={both:0,g_only:0,f_only:0,neither:0},target=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'].join(':');let index=0;for await(const r of records){assert.deepEqual(r.descriptor,caseAt('gf',index++));for(const side of ['g','f']){assert.equal(typeof r[side],'boolean');const first=r.raw[side];assert.equal(first.stage,1);assert.notEqual(first.interaction,'pair_private');assert.equal(r[side],first.interaction==='pair_public'&&[...first.actors].sort().join(':')===target);}counters[r.g?(r.f?'both':'g_only'):(r.f?'f_only':'neither')]++;}assert.equal(index,1000000,'exact1Mpairedrows');return pairedRatioCI(counters);}
