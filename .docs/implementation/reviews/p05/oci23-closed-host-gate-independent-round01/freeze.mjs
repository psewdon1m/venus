import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
for(const [path,want]of Object.entries(JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))))){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'PASS_METHOD_ONLY',scope:'OCI23_CLOSED_HOST_GATE_PROSPECTIVE_METHOD_NOT_NATIVE_NOT_STAGE',source_identity:'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',included_files:1871,images:{A:'sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2',B:'sha256:62602920f998e1e971d3f8f9dd55c706217e4e00a50bcee2d056cbf6d94c8903'},producer_index_sha256:'cbfa748222c1899eeaf5952fff475826d5c11b9ba62899661c7daa7b2ca3a45e',producer23_index_sha256:'cbfa748222c1899eeaf5952fff475826d5c11b9ba62899661c7daa7b2ca3a45e',author_index_sha256:'5bb7b4a93d028505bcd8613b02b111cb2c13fcde2709f9b260869053136c546c',parent_producer22_index_sha256:'4eb65767cada3f8a3ee10533535c67a56ac9cc45431e7d72c2bc385efd97cec2',actual22_diagnosis_index_sha256:'5dcf6ca4ab7d371df84ae1e12e12c1e2ce84915aa546df89938dedc20d3bf938',root_run_ack:false,native_runs:0,stage_acceptance:false,actual22_later_hold_entry_or_resource_cause:'UNKNOWN',owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs:'PASS',owned_writes:'COMPLETE_STOP'}));
