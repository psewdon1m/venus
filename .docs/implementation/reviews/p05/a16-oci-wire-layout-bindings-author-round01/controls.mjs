import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prepared=read(root+'/.artifacts/p05-a16-three-bindings-author01/PREPARED.json'),p=prepared.sources,d=prepared.destinations;
const freeze=read(root+'/.artifacts/p05-pilot-bundle-source-freeze13.json'),receipt=read(root+'/.artifacts/p05-pilot-bundle-image-binding13/receipt.json'),prod=read(root+'/.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json');
const rows=[];function check(name,operation){operation();rows.push({name,status:'PASS'});}
function mjs(dir){const out={};function walk(rel){for(const entry of fs.readdirSync(path.join(dir,rel),{withFileTypes:true})){const n=rel?rel+'/'+entry.name:entry.name;if(entry.isDirectory())walk(n);else if(n.endsWith('.mjs'))out[n]=sha(fs.readFileSync(path.join(dir,n)));}}walk('');return out;}
check('OCI20_all40_recursive_MJS_byte_exact19',()=>{assert.deepEqual(mjs(d.oci),mjs(p.oci));assert.equal(Object.keys(mjs(d.oci)).length,40);});
const b=read(d.oci+'/BINDING.json'),prior=read(p.oci+'/BINDING.json'),maps=read(d.oci+'/actual-image-maps.json'),oldmaps=read(p.oci+'/actual-image-maps.json');
check('OCI_B4_all_policies_resources_controls_unchanged',()=>{
 assert.deepEqual(maps.maps.B,oldmaps.maps.B);for(const field of ['prior_source_identity','private_policies','engine_compatibility','additional_import_closure','resource_profile','profile','previous_known_issues'])assert.deepEqual(b[field],prior[field]);
 assert.equal(b.images.B,prior.images.B);assert.deepEqual(b.per_image_compiled.B,prior.per_image_compiled.B);assert.deepEqual(b.per_image_additional.B,prior.per_image_additional.B);
});
check('OCI_A16_actual81_path_projection_and_no_extra_map',()=>{
 const union={...receipt.compiled_files,...receipt.migration_files,...receipt.web_dist_files,...receipt.pg_dependency_files};assert.deepEqual(maps.maps.A.files,union);assert.equal(Object.keys(union).length,81);assert.equal(Object.keys(maps.maps.B.files).length,78);assert.deepEqual(maps.images,b.images);assert.equal(sha(fs.readFileSync(d.oci+'/actual-image-maps.json')),b.expanded_actual_image_UI_migration_maps_sha256);
 for(const [name,h]of Object.entries({...b.per_image_compiled.A,...b.per_image_additional.A}))assert.equal(h,receipt.image_files_sha256[name]);
 assert.equal(Object.keys(b.per_image_compiled.A).length,64);assert.equal(Object.keys(b.per_image_additional.A).length,5);
});
check('A16_compiled_delta_exact_two_UI_SQL_PG_same',()=>{
 const old=read(root+'/.artifacts/p05-pilot-bundle-image-binding12/receipt.json');assert.deepEqual(Object.keys(receipt.compiled_files).filter(n=>receipt.compiled_files[n]!==old.compiled_files[n]).sort(),['apps/api/dist/private-topic-ledger.js','apps/api/dist/topic-games.js']);for(const field of ['web_dist_files','migration_files','pg_dependency_files'])assert.deepEqual(receipt[field],old[field]);
});
check('production_clean_Git_revision_separate_source_identity',()=>{assert.equal(prod.source_identity,freeze.identity);assert.equal(prod.build_metadata.source_revision,freeze.git_source_commit);assert.equal(prod.build_metadata.source_revision,'b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc');assert.notEqual(prod.build_metadata.source_revision,prod.source_identity);assert.equal(prod.base_test_image,receipt.image);});
check('wire07_five_runtime_MJS_and_descriptor_exact06',()=>{for(const name of ['integration.mjs','positive.mjs','public-wire-observer.mjs','ordinary-observation.mjs','runner.mjs','DESCRIPTOR.json'])assert.deepEqual(fs.readFileSync(d.wire+'/'+name),fs.readFileSync(p.wire+'/'+name));});
check('wire07_new_pending_tuple_all299_runtimepins',()=>{const ack=read(d.wire+'/ROOT-ACK.template.json');assert.equal(ack.status,'NOT_AUTHORIZED');assert.equal(ack.source_identity,freeze.identity);assert.equal(ack.image_id,receipt.image);assert.equal(ack.source_root,path.dirname(path.dirname(d.oci)));assert.deepEqual(ack.runtime_files,receipt.image_files_sha256);assert.equal(Object.keys(ack.runtime_files).length,299);for(const [n,h]of Object.entries(ack.producer_files))assert.equal(sha(fs.readFileSync(d.wire+'/'+n)),h);});
check('layout13_27_MJS_inverse_path_label_and_count_only',()=>{
 const old=mjs(p.layout),next=mjs(d.layout);assert.equal(Object.keys(next).length,27);assert.deepEqual(Object.keys(next),Object.keys(old));
 for(const name of Object.keys(old)){let data=fs.readFileSync(d.layout+'/'+name,'utf8');if(name==='run.mjs')data=data.replaceAll('p05-v2-layout-producer-resume13','p05-v2-layout-producer-resume12').replaceAll('FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED','FINAL_A15_BOUND_INDEPENDENT_REVIEW_REQUIRED').replaceAll('FINAL_A16_BINDING_REQUIRED','FINAL_A15_BINDING_REQUIRED');if(name==='runner-policy.mjs')data=data.replace('assert.equal(binding.included_files,1870)','assert.equal(binding.included_files,1869)');assert.equal(data,fs.readFileSync(p.layout+'/'+name,'utf8'),name);}
});
check('layout_all459_51roles_typography_policy_quotas_unchanged',()=>{for(const n of ['matrix.mjs','expected-cells.json','real-text-fixture.json','probe-policy.mjs','DESIGN.md'])assert.deepEqual(fs.readFileSync(d.layout+'/'+n),fs.readFileSync(p.layout+'/'+n));});
check('all_authority_false_no_active_ACK_copied',()=>{assert.equal(b.root_run_ack,false);const a=read(d.oci+'/ROOT_RUN_ACK_TEMPLATE.json');assert.equal(a.status,'NOT_AUTHORIZED');assert.equal(a.root_run_ack,false);assert.equal(a.source_identity,freeze.identity);assert.deepEqual(a.images,b.images);const l=read(d.layout+'/ROOT_RUN_ACK.json');assert.equal(l.root_run_ack,false);assert.equal(l.independent_review_path,null);assert.equal(l.source_identity,freeze.identity);assert.equal(l.image,receipt.image);assert.equal(read(d.layout+'/binding.json').included_files,1870);assert(!fs.readdirSync(d.wire).some(n=>/^ROOT-ACK\.run/.test(n)));});
check('OCI_included_map_exact1870_and_receipt_tuple',()=>{assert.deepEqual(read(d.oci+'/included-inputs.json'),freeze.files);assert.equal(Object.keys(freeze.files).length,1870);assert.equal(b.source_identity,freeze.identity);assert.equal(b.images.A,receipt.image);});
const proof=await import(pathToFileURL(d.oci+'/source-proof.mjs'));const actual=await proof.verifyIncluded();assert.equal(actual.identity,freeze.identity);rows.push({name:'actual_source13_readonly_inventory1870_exact',status:'PASS'});
console.log(JSON.stringify({status:'PASS_THIN_BINDING_COLD_ONLY_NOT_NATIVE',controls:rows.length,rows},null,2));
