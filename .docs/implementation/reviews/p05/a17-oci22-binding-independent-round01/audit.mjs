import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url));
const author=join(root,'.docs/implementation/reviews/p05/a17-oci22-binding-author-round01');
const old=join(root,'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21');
const current=join(root,'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22');
const materialized=join(root,'.artifacts/p05-pilot-bundle-source14'),pins={};
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
function pin(p){const b=readFileSync(p),v={bytes:b.length,sha256:hash(b)};pins[relative(root,p).replaceAll('\\','/')]=v;return v;}
function exact(p,want){assert.deepEqual(pin(p),want,p);}
function canonical(value){if(value&&typeof value==='object'&&!Array.isArray(value))return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)]));return Array.isArray(value)?value.map(canonical):value;}
function same(a,b,label){assert.deepEqual(canonical(a),canonical(b),label);}
assert.equal(pin(join(author,'INDEX.json')).sha256,'18e7cbbe540352d06d6549757b1ad2e65163a3544fd95317c1d4292a096a2c9b');
const ai=read(join(author,'INDEX.json'));assert.equal(Object.keys(ai.files).length,14);for(const [name,want] of Object.entries(ai.files))exact(join(author,name),want);
for(const [name,want] of Object.entries(read(join(author,'INPUT_PINS.json'))))exact(join(root,name),want);
const parentReview=join(root,'.docs/implementation/reviews/p05/oci21-diagnostic-independent-round01/INDEX.json');
assert.equal(pin(parentReview).sha256,'12be809d9b1092b7903b5b65812872106bc8baafeda87c9071c1d5b3e9eb6ff4');assert.equal(read(parentReview).status,'PASS_METHOD_ONLY');
assert.equal(pin(join(old,'INDEX.json')).sha256,'7045afa7d30ea2e1f94eb6c0efcaa54cb83b00cc65f05a636a726ca645487596');
assert.equal(pin(join(current,'INDEX.json')).sha256,'4eb65767cada3f8a3ee10533535c67a56ac9cc45431e7d72c2bc385efd97cec2');
function map(dir){const result={};function visit(rel){const path=join(dir,rel),s=lstatSync(path);assert(!s.isSymbolicLink(),rel);if(s.isDirectory()){for(const n of readdirSync(path).sort())visit(rel?rel+'/'+n:n);}else{assert(s.isFile(),rel);if(rel==='INDEX.json')return;const p=pin(path);result[rel]={type:'regular_file',...p};}}visit('');return result;}
const pm=map(old),cm=map(current);same(cm,read(join(current,'INDEX.json')).files,'producer22 all children');same(pm,read(join(old,'INDEX.json')).files,'producer21 all children');assert.equal(Object.keys(cm).length,371);
const oldNames=Object.keys(pm),newNames=Object.keys(cm),changed=newNames.filter(n=>pm[n]&&(cm[n].sha256!==pm[n].sha256||cm[n].bytes!==pm[n].bytes)).sort(),added=newNames.filter(n=>!pm[n]),removed=oldNames.filter(n=>!cm[n]);
same(changed,['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','actual-image-maps.json','included-inputs.json'].sort(),'metadata-only binding');same(added,['OPERATIONAL_REVISION22.json']);same(removed,[]);
const runtime=newNames.filter(n=>n.endsWith('.mjs'));assert.equal(runtime.length,40);for(const name of runtime){same(cm[name],pm[name],name);assert.equal(cm[name].sha256,read(join(author,'RUNTIME-PINS.json'))[name]);}
const freeze=read(join(root,'.artifacts/p05-pilot-bundle-source-freeze14.json')),b=read(join(current,'BINDING.json')),ack=read(join(current,'ROOT_RUN_ACK_TEMPLATE.json')),maps=read(join(current,'actual-image-maps.json')),oldb=read(join(old,'BINDING.json')),oldmaps=read(join(old,'actual-image-maps.json'));
const r=read(join(root,'.artifacts/p05-pilot-bundle-image-binding14/receipt.json')),p=read(join(root,'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json')),oldr=read(join(root,'.artifacts/p05-pilot-bundle-image-binding13/receipt.json')),oldp=read(join(root,'.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json'));
pin(join(root,'.artifacts/p05-pilot-bundle-image-binding13/receipt.json'));pin(join(root,'.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json'));
const source='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',git='3abad03309ebd19f04fc0b61532627a5188d855c',image='sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2';
for(const value of [freeze.identity,b.source_identity,r.source_identity,p.source_identity,ack.source_identity,ack.application_source_review_source])assert.equal(value,source);
for(const value of [freeze.included_files,b.included_files,r.included_files,p.included_files,Object.keys(freeze.files).length])assert.equal(value,1871);
same(read(join(current,'included-inputs.json')),freeze.files);
for(const [name,expected] of Object.entries(freeze.files)){const path=join(materialized,name);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());assert.equal(pin(path).sha256,expected,name);}
assert.equal(freeze.git_source_commit,git);assert.equal(p.source_git_commit,git);assert.equal(p.build_metadata.source_revision,git);assert.equal(p.image,'sha256:40d92552d7ee12eacb4d945c4f7920efc4b31dee7a4a712d2e0d93ff54935bdd');assert.equal(p.base_test_image,image);assert.equal(r.image,image);
same(b.images,maps.images);same(b.images,ack.images);assert.equal(b.images.A,image);assert.equal(b.images.B,'sha256:62602920f998e1e971d3f8f9dd55c706217e4e00a50bcee2d056cbf6d94c8903');
for(const field of ['per_image_compiled','per_image_additional'])same(b[field].B,oldb[field].B);
same(maps.maps.B,oldmaps.maps.B);same(b.private_policies,oldb.private_policies);assert.equal(b.previous_candidate_approved_known_good,false);
same({...b.per_image_compiled.A,...b.per_image_additional.A},r.compiled_files);assert.equal(Object.keys(b.per_image_compiled.A).length,64);assert.equal(Object.keys(b.per_image_additional.A).length,5);
same(maps.maps.A.files,{...r.compiled_files,...r.migration_files,...r.web_dist_files,...r.pg_dependency_files});assert.equal(Object.keys(maps.maps.A.files).length,81);assert.equal(Object.keys(maps.maps.B.files).length,78);
for(const field of ['compiled_files','migration_files','pg_dependency_files']){same(r[field],oldr[field]);same(p[field],oldp[field]);for(const [name,h]of Object.entries(p[field]))assert.equal(r[field][name],h);}
assert.equal(Object.keys(p.compiled_files).length,67);
assert.equal(Object.keys(r.compiled_files).length,69);assert.equal(Object.keys(r.migration_files).length,7);assert.equal(Object.keys(r.pg_dependency_files).length,2);assert.equal(Object.keys(r.web_dist_files).length,3);same(r.web_dist_files,p.web_dist_files);assert.notDeepEqual(r.web_dist_files,oldr.web_dist_files);
const js=map=>Object.entries(map).filter(([n])=>n.endsWith('.js'));assert.equal(js(r.web_dist_files).length,1);assert.equal(js(r.web_dist_files)[0][1],'18645659151dc2d9c1d5e2ae0b5e13b65b0f90f8864a5f5ec75e8c00cef1bf32');assert.equal(js(oldr.web_dist_files)[0][1],js(r.web_dist_files)[0][1]);assert.notEqual(js(oldr.web_dist_files)[0][0],js(r.web_dist_files)[0][0]);
for(const [name,h] of Object.entries(r.web_dist_files).filter(([n])=>!n.endsWith('.js')))assert(!Object.entries(oldr.web_dist_files).some(([oldname,oldhash])=>oldname===name&&oldhash===h));
assert.equal(b.expanded_actual_image_UI_migration_maps_sha256,cm['actual-image-maps.json'].sha256);assert.equal(ack.expanded_image_map_sha256,cm['actual-image-maps.json'].sha256);
assert.equal(b.root_run_ack,false);assert.equal(ack.root_run_ack,false);assert.equal(ack.status,'NOT_AUTHORIZED');for(const field of ['producer_index_sha256','independent_review_index','independent_review_index_sha256','application_source_review_index','application_source_review_index_sha256'])assert.equal(ack[field],null);
const op=read(join(current,'OPERATIONAL_REVISION22.json'));assert.equal(op.source_identity,source);assert.equal(op.root_run_ack,false);assert.equal(op.native_runs,0);assert.equal(op.parent_method_review_sha256,pin(parentReview).sha256);assert.equal(op.parent_producer_index_sha256,pin(join(old,'INDEX.json')).sha256);same(op.images,b.images);
for(const [pathField,hashField] of [['source_freeze_path','source_freeze_sha256'],['test_receipt_path','test_receipt_sha256'],['production_receipt_path','production_receipt_sha256']])assert.equal(pin(op[pathField]).sha256,op[hashField]);
writeFileSync(join(out,'INPUT_PINS.json'),JSON.stringify(pins,null,2)+'\n');
const result={status:'PASS_COLD_BINDING_ONLY',author_children:14,producer22_children:371,all40MJS_byte_exact21:true,changed,added,removed,materialized_source_files:1871,source_identity:source,git_source_commit:git,A_critical:81,B_critical:78,A_backend69_SQL7_PG2_exactA16:true,B4_maps_policies_unchanged:true,JS_content_unchanged_new_filename_CSS_HTML_changed:true,root_run_ack:false,native_runs:0};
writeFileSync(join(out,'CHECKS.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
