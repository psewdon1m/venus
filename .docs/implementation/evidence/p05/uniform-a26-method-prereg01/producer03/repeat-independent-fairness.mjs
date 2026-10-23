/** Finite inert replay counterexample. No selector, real470 data or corpus RUN. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {caseAt} from '../p05-pilot-corpus-ranges03/m3/descriptor.mjs';
import {counts} from '../p05-pilot-corpus-ranges03/range-plan.mjs';
import {reduceM3,verifyModelRaw,assertBoundDescriptor} from '../p05-pilot-corpus-ranges03/range-reduce.mjs';
import {fairnessCell} from '../p05-pilot-corpus-ranges03/m3/adapter.mjs';
import {accumulator} from '../p05-pilot-corpus-ranges03/m3/features.mjs';
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'],players=ids.map(id=>({id})),cards=Array.from({length:19},(_,i)=>({id:'Q-FAKE-'+i,interaction:'group'})),pack={cards};
const raw=cards.map((c,i)=>({round_index:i+1,stage:i<10?1:3,interaction:'group',actors:[],card:{card_id:c.id}}));raw.push({round_index:20,stage:3,interaction:'pair_private',actors:ids,card:{card_id:'PRIVATE-FAKE'}});
const p=accumulator(pack,players);raw.forEach(r=>p.selected(r));const features=p.finish(20),env={pack,makeSnapshot:()=>({baseline:{players}})};
function result(index){return{descriptor:caseAt('fairness',index),model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',actual_transport:false,status:'COMPLETE_DOMAIN_MODEL',requested_rounds:20,selected_rounds:20,completed_rounds:20,raw_rounds:raw,public_frames:[],history:{rounds:raw,provenance:'RUNTIME'},features,counts:{K:1,D:2,Kprivate:1,private_playable:1,private_safe_empty:0,invitations:[1,1],legacy_global_ID_repeats:0,current_session_exact_ID_repeats:0,stages:{3:{rounds:11,private_eligible_after_cap:1,private_playable:1}}}};}
const one=result(0);assert.doesNotThrow(()=>verifyModelRaw(one,env));assert.notDeepEqual(one.descriptor,caseAt('fairness',2000));
// Execute the exact exported reducer function with an inert raw-record iterator.
// Cardinality84000 and all production math/verifier functions are unchanged.
const exact=reduceM3.toString(),recordSource=function*(){for(let ordinal=0;ordinal<84000;ordinal++)yield{section:'m3-fairness',ordinal,result:result(ordinal%2000)};};
const reducer=vm.runInNewContext('('+exact+')',{assert,records:recordSource,counts,verifyModelRaw,fairnessCell,assertBoundDescriptor});
await assert.rejects(reducer('m3-fairness',{},env),error=>error.code==='ERR_ASSERTION'&&error.message.includes('DESCRIPTOR_OUTER_ORDINAL_MISMATCH'));
console.log(JSON.stringify({status:'PASS_INDEPENDENT_COUNTEREXAMPLE_NOW_REJECTED',finding:'P05-RANGE-REPLAY-001',same_original_counts:84000,actual470_cases:0,selectors_executed:0}));
