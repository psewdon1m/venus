import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const o="C:/.projects/venus/.docs/implementation/reviews/p05/compatible-rollback-author-round08/producer",n="C:/.projects/venus/.docs/implementation/reviews/p05/normal-production-continuity-author-round02/producer",read=p=>JSON.parse(readFileSync(p));
const {validateAuthority}=await import(pathToFileURL(o+'/contract.mjs'));
const {validateAck}=await import(pathToFileURL(n+'/outer.mjs'));
const b=read(o+'/BINDING.json'),a={...read(o+'/ROOT_RUN_ACK_TEMPLATE.json'),status:'AUTHORIZED',root_run_ack:true,producer_index_sha256:'a'.repeat(64),independent_review_index_sha256:'b'.repeat(64),application_source_review_index_sha256:'c'.repeat(64)};assert.equal(validateAuthority(b,a,'a'.repeat(64)),true);
let count=1;
for(const f of [x=>x.images.A='sha256:3d051bb900ce56b7872912d974a233f22b2c7230d4a1712772a74922564bcf26',x=>x.images.B='sha256:a3358cbcc2650f00e20585c7e6d317ddf435c7384cbe0217689f0356c6f943ff',x=>x.source_identity='fc1bfa0b3dd938ae4f9f0c99fd708032aedcf088b3ef54f14ed55be685a7004e',x=>x.root_run_ack=false,x=>x.total_cap_bytes++,x=>x.whole_ms++,x=>x.expanded_image_map_sha256='0'.repeat(64)]){let x=structuredClone(a);f(x);assert.throws(()=>validateAuthority(b,x,'a'.repeat(64)));count++;}
const normal=read(n+'/ROOT-ACK.template.json');assert.throws(()=>validateAck(normal));count++;
normal.status='ROOT_RUN_ACK';normal.method_review_path=n+'/DESCRIPTOR.json';const {createHash}=await import('node:crypto');normal.method_review_sha256=createHash('sha256').update(readFileSync(normal.method_review_path)).digest('hex');validateAck(normal);count++;
for(const f of [x=>x.A.image_id=b.images.A,x=>x.B.image_id=b.images.B,x=>x.A.runtime_files['build-metadata.json']='0'.repeat(64),x=>x.A.source_identity=b.prior_source_identity]){let x=structuredClone(normal);f(x);assert.throws(()=>validateAck(x));count++;}
console.log(JSON.stringify({status:'PASS_BINDING_MODEL_ONLY_NO_ACK_OR_DOCKER',checks:count}));
