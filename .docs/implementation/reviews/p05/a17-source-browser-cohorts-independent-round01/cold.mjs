import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const root='C:/.projects/venus';
const {validateAck}=await import(pathToFileURL(root+'/.artifacts/p05-ordinary-real470-probe06/outer.mjs'));
const {profiles,negativeProfiles}=await import(pathToFileURL(root+'/.artifacts/p05-ordinary-real470-probe06/probe.mjs'));
const descriptor=JSON.parse(readFileSync(root+'/.artifacts/p05-ordinary-real470-probe06/DESCRIPTOR.json'));
assert.equal(descriptor.matrix_sessions,42);assert.equal(descriptor.matrix_expected_completed_rounds,840);assert.equal(descriptor.matrix_negative_profiles,2);
assert.equal(descriptor.axes.rounds,20);assert.equal(descriptor.rate_schedule.positive_profile_deadline_ms,600000);assert.equal(descriptor.rate_schedule.retries,0);
const rows=[];let pendingTotal=0,negativeTotal=0;
for(const context of ['online','in_person'])for(const mode of ['truth_or_dare','yes_but']){
 const ack=JSON.parse(readFileSync(root+'/.artifacts/p05-cohorts06-a17-acks01/'+context+'-'+mode+'.pending.json'));
 let reads=0;assert.throws(()=>validateAck(ack,()=>{reads++;throw Error('UNEXPECTED_READ');}));assert.equal(reads,0);
 const clone=structuredClone(ack);clone.status='ROOT_RUN_ACK';
 const result=validateAck(clone);assert.equal(Object.keys(result.files).length,1871);
 assert.equal(ack.status,'NOT_AUTHORIZED');assert.equal(ack.maximum_concurrent_cohorts,2);assert.equal(ack.no_retry_or_reseed,true);
 const positive=profiles(ack.cohort),negative=negativeProfiles(ack.cohort);
 assert.equal(positive.length,7);assert.deepEqual(positive.map(x=>x.N),[2,3,4,5,6,7,8]);
 pendingTotal+=positive.length;negativeTotal+=negative.length;
 rows.push({cohort:ack.cohort,pending_denied_before_reads:true,status_only_memory_clone_validated:true,positive_profiles:positive.length,negative_profiles:negative.length});
}
assert.equal(pendingTotal,28);assert.equal(negativeTotal,2);
console.log(JSON.stringify({status:'PASS_COLD_PENDING_DENIAL_AND_MEMORY_CLONE_BINDINGS_NO_ALLOCATION',rows,pending_profiles:28,pending_rounds:560,carried_questions_profiles:14,carried_questions_rounds:280,total_original_profiles:42,total_original_rounds:840,separate_negatives:2,max_concurrent:2}));
