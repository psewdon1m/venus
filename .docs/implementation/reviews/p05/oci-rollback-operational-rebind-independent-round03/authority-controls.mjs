import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const folder=resolve('.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume03'),out=resolve('.docs/implementation/reviews/p05/oci-rollback-operational-rebind-independent-round03');
const {validateRunAuthority,validateFinalGuardReceipt,controlIds}=await import(pathToFileURL(join(folder,'contract.mjs')));
const {producerMap,verifyIncluded}=await import(pathToFileURL(join(folder,'driver.mjs')));
const sha=b=>createHash('sha256').update(b).digest('hex'),index=readFileSync(join(folder,'INDEX.json')),binding=JSON.parse(readFileSync(join(folder,'BINDING.json'))),projection=JSON.parse(readFileSync(join(folder,'ROOT_ACTIVATION_PROJECTION.json'))),template=JSON.parse(readFileSync(join(folder,'ROOT_RUN_ACK.json')));
const activated=structuredClone(binding);for(const[k,v]of Object.entries(projection.binding_changes_only_after_root_and_non_author_review))activated[k]=v.after;
const ack={...structuredClone(template),status:'AUTHORIZED',root_run_ack:true,producer_index_sha256:sha(index)};
const cases=[];function check(name,body){body();cases.push({name,status:'PASS'});}
check('14 exact controls remain required',()=>{assert.deepEqual(binding.mandatory_controls.map(x=>x.id),controlIds);assert(binding.mandatory_controls.every(x=>x.required));});
check('current author draft and unauthorized template refuse',()=>assert.throws(()=>validateRunAuthority(binding,template,sha(index))));
check('status-only external ACK cannot activate pending producer',()=>assert.throws(()=>validateRunAuthority(binding,ack,sha(index))));
check('projected binding cannot activate unauthorized template',()=>assert.throws(()=>validateRunAuthority(activated,template,sha(index))));
check('explicit two-field projection plus matching fresh ACK passes pure authority',()=>assert.equal(validateRunAuthority(activated,ack,sha(index)),true));
for(const[name,change]of [
 ['status',a=>a.status='NOT_AUTHORIZED'],['root bool',a=>a.root_run_ack=false],['stale final INDEX',a=>a.producer_index_sha256='0'.repeat(64)],['attempts2',a=>a.attempts=2],['statistics flag',a=>a.statistics_RUN=true],['guard pin',a=>a.resource_guard_sha256='0'.repeat(64)],['expanded map pin',a=>a.expanded_image_map_sha256='0'.repeat(64)],['missing expanded pin',a=>delete a.expanded_image_map_sha256]
])check('reject mutated ACK '+name,()=>{const a=structuredClone(ack);change(a);assert.throws(()=>validateRunAuthority(activated,a,sha(index)));});
for(const[name,change]of [['pending bind',b=>b.status=binding.status],['bind rootbool',b=>b.root_run_ack=false],['guard notready',b=>b.resource_guard.status='NOT_READY'],['guard pinmalformed',b=>b.resource_guard.sha256='invalid']])check('reject mutated binding '+name,()=>{const b=structuredClone(activated);change(b);assert.throws(()=>validateRunAuthority(b,ack,sha(index)));});
const report={owner:'a'.repeat(32)},receipt={owner:report.owner,status:'PASS_OWNED_RESOURCE_GUARD_FINAL',external_native_probe_cleanup:'completed',failure:null,elapsed_ms:899999};
check('final independent stop receipt accepted',()=>assert.equal(validateFinalGuardReceipt(receipt,report),true));
for(const[name,change]of [['active snapshot',r=>r.status='PASS_OWNED_RESOURCE_GUARD'],['wrong owner',r=>r.owner='b'.repeat(32)],['cleanup pending',r=>r.external_native_probe_cleanup='pending'],['fault latched',r=>r.failure='IO'],['unpersisted',r=>r.receipt_persisted=false],['deadline exceeded',r=>r.elapsed_ms=900001]])check('reject incomplete guard '+name,()=>{const r=structuredClone(receipt);change(r);assert.throws(()=>validateFinalGuardReceipt(r,report));});
check('live producer map equals frozen INDEX',()=>assert.deepEqual(producerMap(folder),JSON.parse(index).source_map));
const actual=await verifyIncluded();check('exact driver readonly source verification succeeds',()=>{assert.equal(actual.identity,binding.source_identity);assert.equal(Object.keys(actual.files).length,1813);});
assert.equal(sha(readFileSync(join(folder,'INDEX.json'))),sha(index));
writeFileSync(join(out,'authority-controls.json'),JSON.stringify({status:'PASS_PURE_AUTHORITY_AND_READONLY_SOURCE_ONLY',controls:cases.length,cases,projection_qualification:'No activation or refreeze performed. Positive pure check uses current index as a synthetic digest; actual root must refreeze and ACK resulting new INDEX.',actual_Docker_calls:0,producer_writes:0},null,2)+'\n');console.log(JSON.stringify({status:'PASS_PURE_AUTHORITY_AND_READONLY_SOURCE_ONLY',controls:cases.length,actual_Docker_calls:0}));
