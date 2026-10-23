import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json')));
for(const [p,want]of Object.entries(pins)){const b=readFileSync(join(root,p));assert.equal(b.length,want.bytes,p);assert.equal(hash(b),want.sha256,p);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'PASS_METHOD_ONLY',scope:'A17_OCI22_LITERAL_BINDING_COLD_GATE_NOT_NATIVE_NOT_STAGE',source_identity:'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',included_files:1871,producer_index_sha256:'4eb65767cada3f8a3ee10533535c67a56ac9cc45431e7d72c2bc385efd97cec2',author_index_sha256:'18e7cbbe540352d06d6549757b1ad2e65163a3544fd95317c1d4292a096a2c9b',parent_method_review_sha256:'12be809d9b1092b7903b5b65812872106bc8baafeda87c9071c1d5b3e9eb6ff4',root_run_ack:false,native_runs:0,application_source_whole_PASS:false,stage_acceptance:false,owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs:'PASS',owned_writes:'COMPLETE_STOP'}));
