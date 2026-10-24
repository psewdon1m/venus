import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex'),pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))),checks=JSON.parse(readFileSync(join(out,'CHECKS.json')));
for(const [path,want]of Object.entries(pins)){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'PASS_PLAN_HISTORICAL_EXPORTS_ONLY',plan_sha256:checks.plan_sha256,author_INDEX_sha256:'887f57ff450f3a170a01ed02fc91b6fdde84c909db5fb3867d5f8c8608346122',prior_plan03_review_sha256:'99c9b9dac648a626a9337c653bf13bcb2613e34ff48c9b9a8c2f00ac44f25031',OCI24_diagnosis_sha256:'83b25627118cdcc538316f731fe78834f2f80d3e95bb13cb21bec9780ede0ba5',projects:11,metadata_objects:77,saved_readonly_commands_checked:110,current_Docker_queries:0,native_operations:0,cleanup_authority:'NOT_AUTHORIZED_HOLD',full_forensic_or_private_backup:false,all_future_prerequisites_still_required:true,owned_writes:'COMPLETE_STOP',files};const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs_rehashed:Object.keys(pins).length,cleanup_authority:index.cleanup_authority,owned_writes:'COMPLETE_STOP'}));
