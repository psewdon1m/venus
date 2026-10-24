import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
for(const [path,want]of Object.entries(JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))))){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'PASS_PLAN_HISTORICAL_EXPORTS_ONLY',scope:'EXACT9_METADATA_PLAN_AND_SAVED_SAFE_FAIL_UNKNOWN_PRESERVATION_NOT_DELETE_APPROVAL',plan_sha256:'ad18a3b9921c620d83229b24e8774543bd48e8c219216b58b3060a79e9c3a01e',parent_plan_sha256:'5bb9cf550c5a0110a803c292b19644b0c0be41910f2e3fbe72642832e19e27bf',author_index_sha256:'0c76f9d9a2f44af8fe59a7c005cdc5f286e46bc59d18a3c9d2477859332520ad',projects:9,metadata_objects:63,historical_SAFE_claim_preservation:'SUFFICIENT_FOR_DOCUMENTED_FAIL_UNKNOWN_ONLY',full_archive_or_private_export_completeness:false,cleanup_authorization_status:'NOT_AUTHORIZED',cleanup_execution_authority:false,current_OCI23_actual_export_gate_issued:false,Docker_queries:0,mutations:0,owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs:'PASS',cleanup_authority:false,owned_writes:'COMPLETE_STOP'}));
