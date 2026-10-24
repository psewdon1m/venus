import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
for(const [path,want]of Object.entries(JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))))){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'SCOPE_OBLIGATIONS_CONFIRMED_NOT_STAGE_ACCEPTANCE',profile:'standalone-local-pilot-v2',full_original_sections:'MANDATORY_ACCEPTED_PROOF_PATH_ALLOW_EXACT_ACCEPTED_PARTIAL_CARRY',original_total:1364448,matched84:'ACCEPTED_COMPACT_METHOD_FOR_MANDATORY_SEMANTIC_EXCLUSION_GAP_NOT_ORIGINAL_LITERAL_NUMERIC_NORM',P03_whole_outcomes_to_current_V2:'NOT_ACCEPTED_BLANKET_CARRY',unadopted_220M_extra84k_auto84x3:'NOT_MANDATORY',native_runs:0,norms_or_APP_or_tests_or_producer_or_ACK_edits:false,owned_writes:'COMPLETE_STOP',files};const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs:'PASS',owned_writes:'COMPLETE_STOP'}));
