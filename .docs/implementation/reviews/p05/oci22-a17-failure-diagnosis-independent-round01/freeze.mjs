import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
for(const [path,want]of Object.entries(JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))))){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'FAIL_RETAINED_READONLY_DIAGNOSIS_COMPLETE',scope:'OCI22_A17_ACTUAL_FAILURE_DIAGNOSIS_NOT_ACCEPTANCE_NOT_REMEDY',source_identity:'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',project:'venus-p05-oci-42ca11845db2',owner:'7fac6dd9ae2188b866519184b2f79431',root_ACK_sha256:'d27856f25cc53486b74641079c27c950ae7a34a984a54efcee139374bf053ef5',producer_index_sha256:'4eb65767cada3f8a3ee10533535c67a56ac9cc45431e7d72c2bc385efd97cec2',host_close_resolved:true,observer_completion_or_HOLD_DRAIN_reached:'UNKNOWN',resource_cause:'UNKNOWN',closed_gate_lifecycle_counterexample:'PASS_COLD_ONLY_NOT_ACTUAL_CAUSE',native_operations:0,cleanup_performed:false,owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs:'PASS',owned_writes:'COMPLETE_STOP'}));
