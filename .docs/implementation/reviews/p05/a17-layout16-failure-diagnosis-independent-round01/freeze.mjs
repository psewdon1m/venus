import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json')));
for(const [path,want]of Object.entries(pins)){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const checks=JSON.parse(readFileSync(join(out,'CHECKS.json'))),files={};
for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:checks.status,source_identity:checks.source_identity,source_count:checks.source_count,image:checks.image,ACK_sha256:checks.ACK_sha256,method_review_sha256:checks.method_review_sha256,producer_runtime_digest:checks.producer_runtime_digest,actual_counts:checks.counts,root_exit_code:1,cleanup:checks.cleanup,typed_scope:checks.typed_scope,method_gap:'IMMEDIATE_SINGLE_GEOMETRY_SAMPLE_WITHOUT_SCROLL_SETTLEMENT',actual_scroll_mechanism:'UNKNOWN_NOT_RECORDED',APP_defect_established:false,acceptance:false,native_operations:0,owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,inputs_rehashed:Object.keys(pins).length,final_inputs:'PASS',owned_writes:'COMPLETE_STOP'}));
