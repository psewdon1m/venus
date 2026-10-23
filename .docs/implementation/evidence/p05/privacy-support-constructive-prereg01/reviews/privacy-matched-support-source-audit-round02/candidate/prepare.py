from pathlib import Path
import json,hashlib,shutil
r=Path('C:/.projects/venus');w=r/'.artifacts/p05-privacy-support-constructive01';p=r/'.artifacts/p05-privacy-matched-operational01';sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda f:json.loads(f.read_bytes())
def put(n,v):(w/n).write_text(json.dumps(v,indent=2)+'\n')
review=r/'.docs/implementation/reviews/p05/privacy-matched-support-design-independent-round01/INDEX.json';assert sha(review.read_bytes())=='446725401d1236dd02b04b3879177c91d8d31c44dc36098ea7aff4d0388bf15c'
for n in ['matched-model.mjs']:shutil.copyfile(p/n,w/n)
original=read(r/'.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/CELL-COVERAGE.json');baseline={'status':'ORIGINAL84_NOT_COVERED_IMMUTABLE','independent_index_sha256':'b87c4c5d18ba827144205ba2737b76c5a84fed4039697f77a0f25c9bbd539f56','source_coverage_sha256':sha((r/'.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/CELL-COVERAGE.json').read_bytes()),'cells':[{k:c[k]for k in ['cell','size','mode','context','exclusion_covered','semantic_covered']}for c in original['cells']]};put('ORIGINAL-COVERAGE.json',baseline)
s=(p/'consumer.mjs').read_text();s=s.replace("import {isDeepStrictEqual} from 'node:util';","import {isDeepStrictEqual} from 'node:util';\nimport {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';")
a=s.index('export const count=84;');b=s.index('export function classifyPair',a)
s=s[:a]+'''export const count=7;
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
''' +s[b:]
needle='const topic=topics[descriptor.cell%topics.length];';assert s.count(needle)==1;s=s.replace(needle,"const topic=descriptor.exclusion_topic??topics[descriptor.cell%topics.length];assert(topics.includes(topic));")
a=s.index('export function summarize(');b=s.index('if(process.argv[1]',a)
s=s[:a]+'''export function originalCoverage(){
 const raw=readFileSync(new URL('./ORIGINAL-COVERAGE.json',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),'BASELINE_HASH');const value=JSON.parse(raw);
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
   if(targeted){targets.push({ordinal,cell:row.descriptor.cell,kind,status:expected.status});if(expected.status==='PASS_MATCHED_DOMAIN_ONLY'){assert.equal(expected.classification,'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE');support[kind].push(row.descriptor.cell);}}
  }
 }
 assert.equal(targets.length,10);assert.equal(retained.length,14);for(const kind of ['exclusion','semantic'])assert.deepEqual(targets.filter(r=>r.kind===kind).map(r=>r.cell).sort((a,b)=>a-b),kind==='exclusion'?[2,13,14,15,20]:[3,13,14,20,34]);
 const combined=baseline.cells.map(c=>({...c,supplemental_exclusion:support.exclusion.includes(c.cell),supplemental_semantic:support.semantic.includes(c.cell)}));const uncovered=Object.fromEntries(['exclusion','semantic'].map(kind=>[kind,combined.filter(c=>!c[kind+'_covered']&&!c['supplemental_'+kind]).map(c=>c.cell)]));
 return {status:failures.length?'FAIL':Object.values(uncovered).some(v=>v.length)?'NOT_COVERED':'PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE',cases:count,comparisons:14,targeted_comparisons:10,untargeted_comparisons:4,targets,failures,out_of_support:retained.filter(r=>r.classification!=='COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE'),retained_comparisons:retained,original84_status:'NOT_COVERED_IMMUTABLE',original_covered_cells:{exclusion:37,semantic:37},source_refusal_branches:'SOURCE_BRANCH_ONLY_NEVER_FILL_COMMON_COVERAGE',combined_coverage:combined,uncovered_cells:uncovered,actual_wire:false,full_P05_PASS:false};
}
''' .replace('BASELINE_HASH',sha((w/'ORIGINAL-COVERAGE.json').read_bytes()))+s[b:]
s=s.replace("if(expected.status==='PASS_MATCHED_DOMAIN_ONLY'){","if(expected.status==='PASS_MATCHED_DOMAIN_ONLY'&&row.raw.prior.status==='COMPLETE_DOMAIN_MODEL'&&row.raw.prior.requested_rounds===20&&row.raw.prior.completed_rounds===20&&[row.raw.base,row.raw[kind]].every(arm=>arm.requested_rounds===20&&arm.completed_rounds===20)){").replace('native_runs_per_case:4,comparisons:168','native_runs_per_case:4,comparisons:14,targeted_comparisons:10')
(w/'consumer.mjs').write_bytes(s.encode())
worker=(p/'matched-worker.mjs').read_text().replace('Fixed84 accepted matched observations','Fixed7 prospective constructive native observations').replace('PILOT_PRIVACY_MATCHED_01','PILOT_PRIVACY_SUPPORT_CONSTRUCTIVE_01').replace('^PASS_PROSPECTIVE_MATCHED_DOMAIN_METHOD_ONLY','^PASS_PROSPECTIVE_PRIVACY_SUPPORT_CONSTRUCTIVE_METHOD_ONLY').replace('count:84,end:84','count:7,end:7').replace("section:'privacy-matched'","section:'privacy-support-constructive'").replace("row.section,'privacy-matched'","row.section,'privacy-support-constructive'").replace("group:'privacy-matched'","group:'privacy-support-constructive'").replace('all84 exact native triplets','all7 exact fresh20 native quadruplets')
(w/'matched-worker.mjs').write_bytes(worker.encode())
host=(r/'.artifacts/p05-privacy-matched-host01.mjs').read_text().replace("from './p05-fixedrange-host03.mjs'","from '../p05-fixedrange-host03.mjs'").replace("new URL('./p05-fixedrange-host03.mjs'","new URL('../p05-fixedrange-host03.mjs'").replace('PILOT_PRIVACY_MATCHED_01','PILOT_PRIVACY_SUPPORT_CONSTRUCTIVE_01').replace('^PASS_PROSPECTIVE_MATCHED_DOMAIN_METHOD_ONLY','^PASS_PROSPECTIVE_PRIVACY_SUPPORT_CONSTRUCTIVE_METHOD_ONLY').replace('prereg.cases,84','prereg.cases,7').replace('count:84,end:84','count:7,end:7').replace("section:'privacy-matched'","section:'privacy-support-constructive'").replace('venus-matched-','venus-support-').replace('p05-privacy-matched-runs01/','p05-privacy-support-constructive-runs01/')
(w/'host.mjs').write_bytes(host.encode())
binding=read(p/'binding.json');binding['status']='AUTHOR_CONSTRUCTIVE_SUPPORT_CANDIDATE_NOT_RUN';binding['scope']='A9_NATIVE_DOMAIN_WHOLE_CURRENT20_SUPPORT_NOT_ACTUAL_AUTH_WIRE_OR_A18_APPLICATION';binding['parent_accepted_matched_method_review_sha256']=binding.pop('method_review_sha256');binding['method_review_required']='NEW_PASS_PROSPECTIVE_PRIVACY_SUPPORT_CONSTRUCTIVE_METHOD_ONLY';binding['support_design01_finding_sha256']=sha(review.read_bytes());binding['support_plans_count']=7;binding['support_targeted_comparisons']=10;binding['original84_status']='NOT_COVERED_IMMUTABLE';binding['original_coverage_sha256']=sha((w/'ORIGINAL-COVERAGE.json').read_bytes());put('binding.json',binding)
plans=[{'ordinal':i,'cell':cell,'requested_current_rounds':20,'literal_seed':f'venus:P05:privacy:matched01:{cell}:R{seedR}','prior_rounds':20,'prior_seed':f'venus:P05:privacy:matched01:{cell}:R{seedR}:prior','prior_session_id':'33333333-3333-4333-8333-333333333333','target_comparisons':targets,'exclusion_topic':topic}for i,(cell,seedR,targets,topic)in enumerate([(3,100,['semantic'],None),(13,100,['exclusion','semantic'],None),(14,100,['exclusion','semantic'],None),(20,100,['exclusion','semantic'],None),(34,100,['semantic'],None),(2,20,['exclusion'],'absurd_fiction'),(15,20,['exclusion'],'absurd_fiction')])]
put('PREREG.json',{'revision':'P05-PRIVACY-SUPPORT-CONSTRUCTIVE-01','status':'AUTHOR_PENDING_INDEPENDENT_METHOD_CLEAN_WITNESS_ROOT_ACK_NOT_RUN','cases':7,'comparisons_retained':14,'targeted_comparisons':10,'native_arms':28,'native_full_replay_arms':28,'plans':plans,'original84':'IMMUTABLE_NOT_COVERED_NO_RECLASSIFICATION','R100_refusal_prefixes':'SOURCE_BRANCH_ONLY_NO_COMMON_COVERAGE','strict_full_common_guard':'UNCHANGED_COMPLETE_DOMAIN_MODEL_BOTH_CHANGED_EFFECTIVE_POSITIVE_BOTH_ZERO_EMPTY_EXACT_SEQUENCE_AND_PUBLIC_TRACE','combined_coverage_required_per_type':42,'original7counts_thresholds':'UNCHANGED','worker_ms':3600000,'host_attach_ms':3605000,'resources':'UNCHANGED_EXISTING_HOST03_1CPU1536MiB64PID_NONET_READONLY_NONROOT_16MiB_TMP_32GiB_RESERVE_200MiB_PAYLOAD','execution_authority':False,'clean_prereg_witness':'ROOT_MUST_PIN_NEW_DOCS_ONLY_MANAGED_WORKTREE_COMMIT_BEFORE_RUN; old8438 witness unchanged','model_boundary':'DOMAIN_MODEL_NOT_ACTUAL_AUTH_WIRE; A9 source/image with accepted A18 pure correspondence'})
print('PREPARED_NO_NATIVE_OR_REPLAY')
