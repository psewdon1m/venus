import assert from 'node:assert/strict';
import {caseAt,classifyPair} from '../p05-privacy-matched01/consumer.mjs';
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log(`PASS ${name}`);};
const native=()=>({status:'COMPLETE_DOMAIN_MODEL',counts:{private_playable:1,private_safe_empty:0},refusal:null,raw_rounds:[{round_id:'r1',round_index:1,stage:1,interaction:'pair_private',card:'SECRET-A',actors:['a','b'],primary_member_id:'a'},{round_id:'r2',round_index:2,stage:1,interaction:'pair_public',card:'PUBLIC',actors:['b','c'],primary_member_id:'b'}],public_frames:[{modeled_tick:4,payload:{game_rev:7,round:{round_id:'r1',interaction:'pair_private',card:null}}}]});
const compare=(b,v,options={changed:true,effective:true})=>classifyPair(b,v,options);
check('84 unique descriptors; all 42 cells have R20 and R100',()=>{const rows=Array.from({length:84},(_,i)=>caseAt(i));assert.equal(new Set(rows.map(r=>r.seed)).size,84);assert.equal(new Set(rows.map(r=>`${r.size}/${r.mode}/${r.context}`)).size,42);for(let i=0;i<42;i++)assert.deepEqual(rows.filter(r=>r.cell===i).map(r=>r.rounds),[20,100]);});
check('ordinal boundaries fail closed',()=>{for(const i of [-1,84,1.5,NaN])assert.throws(()=>caseAt(i));});
check('same full common public trace passes DOMAIN ONLY',()=>assert.equal(compare(native(),native()).status,'PASS_MATCHED_DOMAIN_ONLY'));
check('hidden card/actors omitted from public selector comparison',()=>{const v=native();Object.assign(v.raw_rounds[0],{card:'SECRET-B',actors:['x','y'],primary_member_id:'y'});assert.equal(compare(native(),v).status,'PASS_MATCHED_DOMAIN_ONLY');});
for(const [name,mutate] of [
 ['public card',v=>v.raw_rounds[1].card='OTHER'],
 ['public actors',v=>v.raw_rounds[1].actors=['a','c']],
 ['public primary',v=>v.raw_rounds[1].primary_member_id='c'],
 ['round identity',v=>v.raw_rounds[0].round_id='other'],
 ['stage',v=>v.raw_rounds[0].stage=2],
])check(`${name} mismatch fails regardless trace`,()=>{const v=native();mutate(v);assert.equal(compare(native(),v).status,'FAIL_SELECTOR_PUBLIC_SEQUENCE');});
for(const [name,mutate] of [
 ['controlled tick',v=>v.public_frames[0].modeled_tick++],
 ['public revision',v=>v.public_frames[0].payload.game_rev++],
 ['extra frame',v=>v.public_frames.push(structuredClone(v.public_frames[0]))],
])check(`${name} mismatch on full common fails`,()=>{const v=native();mutate(v);assert.equal(compare(native(),v).status,'FAIL_COMMON_SUPPORT_PUBLIC_TRACE');});
check('no hidden change never PASS',()=>assert.equal(compare(native(),native(),{changed:false,effective:true}).status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS'));
check('ineffective hidden change never PASS',()=>assert.equal(compare(native(),native(),{changed:true,effective:false}).status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS'));
check('safe empty never PASS',()=>{const v=native();v.counts.private_safe_empty=1;assert.equal(compare(native(),v).status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');});
check('no positive private never PASS',()=>{const v=native();v.counts.private_playable=0;assert.equal(compare(native(),v).status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');});
check('refused mismatched selector still FAIL',()=>{const v=native();v.status='SAFE_REFUSAL';v.refusal={code:'TOPIC_SAFE_POOL_EXHAUSTED'};v.raw_rounds[1].card='OTHER';assert.equal(compare(native(),v).status,'FAIL_SELECTOR_PUBLIC_SEQUENCE');});
check('refused same selector with changed trace retained as NOT PRIVACY PASS',()=>{const v=native();v.status='SAFE_REFUSAL';v.refusal={code:'TOPIC_SAFE_POOL_EXHAUSTED'};v.public_frames[0].modeled_tick++;const r=compare(native(),v);assert.equal(r.status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');assert.equal(r.public_trace_equal,false);assert.deepEqual(r.retained_refusals[1],v.refusal);});
console.log(JSON.stringify({status:'PASS_FINITE_FAKE_SENSITIVITY_ONLY',passed,actual_transport:false,real470_runs:0}));
