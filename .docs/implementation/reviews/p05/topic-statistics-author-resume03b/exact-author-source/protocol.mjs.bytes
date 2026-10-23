import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {descriptors,counts,sizes,modes,contexts,caps} from '../p05-topic-measurements/workload.mjs';
export {descriptors,sizes,modes,contexts,caps};
export const expectedCounts={C2_eligibility:counts.C2_eligibility_rows,C2_neutral:counts.C2_neutral_sessions,C2_negative:counts.C2_negative_YB_all_X,C2_private:counts.C2_private_sessions,invariants:counts.invariants,fairness:counts.fairness,gf:counts.gf,social:counts.social,exclusion:counts.exclusion};
export const sha=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
export const profile=d=>[d.capability,d.regime,d.prior??''].join('/');
export const cell=d=>[d.size,d.mode,d.context,profile(d)].join('/');
export const group=d=>[profile(d),d.comparison].join('/');
export const stratum=d=>[group(d),d.size,d.mode,d.context].join('/');
export const classIndex=d=>d.section==='exclusion'?d.comparison.match(/E\d/g).indexOf(d.exclusionClass):[...d.comparison].indexOf(d.class_profile);
export function orderedCoverage(section){
 const iterator=descriptors(section);let completed=0;
 return{add(d){const next=iterator.next();assert(!next.done,'EXTRA_DESCRIPTOR');assert.deepEqual(d,next.value,'DESCRIPTOR_ORDER_SEED_OR_AXIS_MISMATCH');completed++;},finish(){const tail=iterator.next();return{status:tail.done&&completed===expectedCounts[section]?'COMPLETE':'INCOMPLETE',completed,expected:expectedCounts[section],next_unprocessed:tail.done?null:tail.value};}};
}
export const featureHash='2eba539a5104c8102606b8880f5d0113448a8d8fba11f1838cca16d50ad88bdd';
export function featureRecord(d,result){
 const f=result.features;assert.equal(sha(f.names),featureHash,'FEATURE_DICTIONARY_CHANGED');assert.equal(f.features.length,1075);assert(f.features.every(Number.isFinite));
 return{schema:1,descriptor:d,feature_dictionary_sha256:featureHash,dimension:1075,sparse:f.features.flatMap((x,i)=>x===0?[]:[[i,x]]),summary:result.summary,actual_WS_frames:f.actual_WS_frames,model:f.model};
}
export function dense(row){
 assert.equal(row.feature_dictionary_sha256,featureHash);assert.equal(row.dimension,1075);const result=Array(1075).fill(0);let previous=-1;
 for(const [i,x] of row.sparse){assert(Number.isInteger(i)&&i>previous&&i<1075&&Number.isFinite(x)&&x!==0,'BAD_SPARSE_FEATURE');result[i]=x;previous=i;}return result;
}
