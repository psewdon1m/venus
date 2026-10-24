import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAuthority} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-compatible-rollback-producer28/contract.mjs';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-compatible-rollback-producer28/';
const read=n=>JSON.parse(readFileSync(root+n,'utf8')),binding=read('BINDING.json'),pending=read('ROOT_RUN_ACK_TEMPLATE.json'),index='3618665392fb08884cdfa39438d5429020c9c9ab8225cd7e6593bb7ab3dd1230';
const valid={...pending,status:'AUTHORIZED',root_run_ack:true,producer_index_sha256:index,independent_review_index_sha256:'a'.repeat(64),application_source_review_index_sha256:'b'.repeat(64),application_source_review_source:binding.source_identity};
assert.equal(validateAuthority(binding,valid,index),true);
for(const mutate of [a=>a.source_identity='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',a=>a.images={...a.images,A:'sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2'},a=>a.resource_profile='QRB_BOUND_ONLY_1',a=>a.root_run_ack=false]){const a=structuredClone(valid);mutate(a);assert.throws(()=>validateAuthority(binding,a,index));}
console.log(JSON.stringify({status:'PASS_IN_MEMORY_ONLY_NO_AUTHORIZED_FILE',positive:1,negatives:4,Docker:0}));
