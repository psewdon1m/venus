/** Full-section replay, bounded by a segment/cell (pooled LDA: one comparison). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {counts} from './range-plan.mjs';
import {regular,loadInputs,records} from './replay-input.mjs';
import {loadBound,cells} from './c2/consumer.mjs';
import {loadEnvironment,fairnessCell,evaluateInference} from './m3/adapter.mjs';
import {invariantsSection,reduceGf} from './stream-reducers.mjs';
import {accumulator} from './m3/features.mjs';
import {caseAt} from './m3/descriptor.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyModelRaw(result,env){
 assert.deepEqual(result.descriptor,caseAt(result.descriptor.section,result.descriptor.ordinal));return verifyModelFeatures(result,env);
}
export function verifyModelFeatures(result,env){
 assert.equal(result.actual_transport,false);assert.equal(result.model,'DOMAIN_MODEL_NOT_ACTUAL_AUTH');
 const snapshot=env.makeSnapshot(result.descriptor),projection=accumulator(env.pack,snapshot.baseline.players);
 assert.equal(result.raw_rounds.length,result.selected_rounds);assert.equal(result.history.rounds.length,result.selected_rounds);assert.equal(result.history.provenance,'RUNTIME');
 for(const round of result.raw_rounds)projection.selected(round);
 for(const frame of result.public_frames)projection.add(frame);
 assert.deepEqual(projection.finish(result.completed_rounds),result.features,'RAW_PUBLIC_FEATURE_REPLAY_PARITY');
 return result;
}
export function compactInference(result,names){assert.deepEqual(result.features.names,names);return {descriptor:result.descriptor,status:result.status,features:{names,features:result.features.features}};}
export function assertBoundDescriptor(section,row){assert.equal(row.section,section);assert.deepEqual(row.result.descriptor,caseAt(section.slice(3),row.ordinal),'DESCRIPTOR_OUTER_ORDINAL_MISMATCH');}
export function validatePreflightRaw(result,cell){
 assert.deepEqual(result.cell,cell);assert.equal(result.actual_transport,false);assert.equal(result.simulation_only,true);
 if(result.status==='SAFE_REFUSAL'){assert.equal(result.error_code,'TOPIC_SAFE_POOL_EXHAUSTED');assert.equal(result.prefix_available,false);assert.equal(result.history,null);assert.equal(result.planned_rounds,null);return;}
 assert(['PLANNED_SIMULATION_ONLY','PLANNED_WITH_PRIVATE_SAFE_EMPTY'].includes(result.status));assert.equal(result.history.provenance,'SIMULATION_ONLY');assert.equal(result.planned_rounds,cell.rounds);assert.equal(result.history.rounds.length,cell.rounds);
 const privateRounds=result.history.rounds.filter(r=>r.interaction==='pair_private');for(const key of ['private_opportunities','private_playable','private_safe_empty'])assert(Number.isSafeInteger(result[key])&&result[key]>=0);
 assert.equal(result.private_opportunities,privateRounds.length);assert.equal(result.private_playable,privateRounds.filter(r=>r.card!==null).length);assert.equal(result.private_safe_empty,privateRounds.filter(r=>r.card===null).length);assert.equal(result.private_playable+result.private_safe_empty,result.private_opportunities);assert(privateRounds.length<=Math.ceil(.25*cell.rounds));if(cell.cap==='OFF')assert.equal(privateRounds.length,0);
}
export function reduceC2(section,rows,env){
 const expected=cells(section.slice(3)),summary={section,cases:0,refusals:[],mandatory_baseline_failures:[],canary_dispositions:[],status:'FULL_FIXED_C2_EXECUTION_VALIDATED_NOT_STAGE',full_P05_PASS:false};
 for(const row of rows){const next=expected.next();assert(!next.done);assert.equal(row.ordinal,summary.cases);const cell=next.value,r=row.result;assert.deepEqual(r.cell,cell);summary.cases++;
  if(section==='c2-static'){
   const ids=r.candidate_identities.map(c=>c.card_id);assert.equal(new Set(ids).size,ids.length);assert.equal(r.all_eligible.card_ids,ids.length);
   for(const c of r.candidate_identities){const card=env.pack.card(c.card_id);assert.equal(card.revision,c.revision);assert.equal(card.interaction,c.interaction);assert.deepEqual(env.map.entry(c.card_id).semantic_family_ids,c.semantic_family_ids);}
   assert.deepEqual(r.neutral_card_ids,r.candidate_identities.filter(c=>c.interaction!=='pair_private').map(c=>c.card_id));assert.equal(r.neutral.card_ids,r.neutral_card_ids.length);assert.equal(r.private_baseline.card_ids,r.private_baseline_card_ids.length);
   if(cell.cap==='ON'&&cell.regime==='all_allow'&&cell.stage===3&&cell.comfort===1&&cell.pairClass==='F'&&r.private_baseline.card_ids<25)summary.mandatory_baseline_failures.push({ordinal:row.ordinal,required_private:25,actual:r.private_baseline.card_ids});
  }else if(section==='c2-trajectory'){
   validatePreflightRaw(r,cell);if(r.status==='SAFE_REFUSAL'){summary.refusals.push({ordinal:row.ordinal,cell,error_code:r.error_code,prefix_available:false});if(cell.profile==='neutral_C0_F'&&cell.rounds===20)summary.mandatory_baseline_failures.push({ordinal:row.ordinal,required_neutral:20});}
   if(cell.profile==='all_X')assert.equal(r.status,'SAFE_REFUSAL');
  }else{
   validatePreflightRaw(r.first,cell);summary.canary_dispositions.push({ordinal:row.ordinal,cell,cross_session_mode:typeof r.cross_session_mode==='string'?r.cross_session_mode:r.cross_session_mode.status,targeted_change:r.targeted_change?.status??r.targeted_change,public_planner_independence:r.public_planner_independence??'PRECONDITION_NOT_ESTABLISHED'});
  }
 }
 assert(expected.next().done);assert.equal(summary.cases,counts[section]);if(summary.mandatory_baseline_failures.length)summary.status='MANDATORY_BASELINE_NOT_ACCEPTED';
 summary.original_mode_counts=Object.fromEntries(['questions','truth_or_dare','yes_but'].map(mode=>[mode,env.pack.cards.filter(c=>c.mode===mode).length]));if(Object.values(summary.original_mode_counts).some(n=>n<100))summary.status='MANDATORY_BASELINE_NOT_ACCEPTED';
 summary.acceptance_boundary='Typed safe preStart refusals retained; R100 completion is not imposed. Canary preconditions/dispositions remain visible and require coverage review; full C2/stage PASS is not synthesized.';return summary;
}
export async function reduceM3(section,manifest,env){
 function* validated(){let ordinal=0;for(const row of records(manifest)){assert.equal(row.ordinal,ordinal++);assertBoundDescriptor(section,row);if(section==='m3-gf')yield row.result;else yield verifyModelRaw(row.result,env);}assert.equal(ordinal,counts[section]);}
 if(section==='m3-invariants')return invariantsSection(validated());
 if(section==='m3-gf')return reduceGf(validated());
 if(section==='m3-fairness'){
  const cells=[];let group=[];for(const r of validated()){group.push({descriptor:r.descriptor,status:r.status,requested_rounds:r.requested_rounds,selected_rounds:r.selected_rounds,completed_rounds:r.completed_rounds,counts:r.counts,raw_rounds:r.raw_rounds});if(group.length===2000){cells.push({cell:group[0].descriptor,result:fairnessCell(group)});group=[];}}
  assert.equal(group.length,0);assert.equal(cells.length,42);return {status:cells.every(c=>c.result.status==='PASS_PURE_DOMAIN_FAIRNESS_CELL_NOT_STAGE')?'PASS_PURE_FAIRNESS_ONLY_NOT_STAGE':'NOT_ACCEPTED',cells};
 }
 const names=JSON.parse(fs.readFileSync(path.join(here,'m3/feature-dictionary.json'))).names,cells=[];let group=[];
 for(const r of validated()){group.push(compactInference(r,names));if(group.length===1000){cells.push({cell:group[0].descriptor,result:evaluateInference(group,names)});group=[];}}
 assert.equal(group.length,0);assert.equal(cells.length,126);const pooled=[];
 for(const [index,comparison]of ['FG','FM','GM'].entries()){
  const start=index*42000,end=start+42000,inputs=manifest.inputs.filter(r=>r.range.start<end&&r.range.end>start),rows=[];
  // Each input is reverified in full. Only this comparison's raw feature vectors
  // remain resident; a new pooled model is trained, never pooled cell scores.
  for(const row of records({...manifest,inputs})){assertBoundDescriptor(section,row);if(row.ordinal>=start&&row.ordinal<end){assert.equal(row.result.descriptor.comparison,comparison);rows.push(compactInference(row.result,names));}}
  pooled.push({comparison,result:evaluateInference(rows,names,{pooled:true})});
 }
 return {status:[...cells,...pooled].every(c=>c.result.status==='PASS_DOMAIN_MODEL_LDA_ONLY_NOT_WIRE_OR_STAGE')?'PASS_DOMAIN_INFERENCE_ONLY_NOT_WIRE_OR_STAGE':'NOT_ACCEPTED',cells,pooled};
}
export async function main(args){
 assert.equal(args.length,3);const [section,inputFile,output]=args;assert(Object.hasOwn(counts,section));const bindingRaw=fs.readFileSync(path.join(here,'binding.json')),preregRaw=fs.readFileSync(path.join(here,'RANGE-PREREG.json')),inputRaw=regular(path.resolve(inputFile),32*1024**2),manifest=loadInputs(JSON.parse(inputRaw),bindingRaw,preregRaw);assert.equal(manifest.section,section);
 const env=section.startsWith('c2-')?await loadBound():await loadEnvironment(),result=section.startsWith('c2-')?reduceC2(section,records(manifest),env):await reduceM3(section,manifest,env);
 const report={schema:1,section,source_identity:env.binding.source_identity,image:env.binding.image,binding_sha256:sha(bindingRaw),prereg_sha256:sha(preregRaw),input_manifest_sha256:sha(inputRaw),result,actual_auth:false,actual_wire_parity:'REQUIRED_SEPARATE_GATE',full_P05_PASS:false};
 const raw=Buffer.from(JSON.stringify(report,null,2)+'\n');assert(raw.length<64*1024**2);const fd=fs.openSync(path.resolve(output),'wx',0o600);try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}console.log(JSON.stringify({status:result.status,section,output_sha256:sha(raw),full_P05_PASS:false}));if(['NOT_ACCEPTED','MANDATORY_BASELINE_NOT_ACCEPTED','FAIL'].includes(result.status))process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main(process.argv.slice(2));
