import assert from 'node:assert/strict';
const canonical=value=>JSON.stringify(value,(_k,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const rows=(raw,name)=>(raw.privateRows[name]??[]).map(text=>JSON.parse(text));
function admissionEffect(before,after,expectedScope,window){
 const key='public.admission_limits',a=rows(before,key),b=rows(after,key);assert.equal(b.length,a.length);const old=a.find(v=>v.scope_hash===expectedScope),next=b.find(v=>v.scope_hash===expectedScope);assert(old&&next);assert.equal(Number(old.window_start),window);assert.equal(Number(next.window_start),window);assert.equal(next.requests,old.requests+1);assert.equal(canonical({...next,requests:old.requests}),canonical(old));
 assert.equal(canonical(a.filter(v=>v.scope_hash!==expectedScope)),canonical(b.filter(v=>v.scope_hash!==expectedScope)),'Only the exact current member accounting row may change');
 return {table:key,expected_member_scope_only:true,same_window:true,request_counter_increment:1};
}
const raw=(own,foreign)=>({privateRows:{'public.admission_limits':[{scope_hash:'syntheticD',window_start:16,requests:own},{scope_hash:'syntheticA',window_start:16,requests:foreign}].map(v=>JSON.stringify(v))}});
assert.equal(admissionEffect(raw(10,20),raw(11,20),'syntheticD',16).request_counter_increment,1);
assert.throws(()=>admissionEffect(raw(10,20),raw(11,21),'syntheticD',16),/Only the exact current member accounting row may change/);
console.log(JSON.stringify({status:'PASS_PINNED_ADMISSION_EFFECT_CONCURRENCY_COUNTEREXAMPLE',checks:2,actual_foreign_request_identity_proven:false,native_allocation:false}));
