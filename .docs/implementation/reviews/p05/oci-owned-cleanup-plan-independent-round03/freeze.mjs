import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex'),pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))),checks=JSON.parse(readFileSync(join(out,'CHECKS.json')));
for(const [path,want]of Object.entries(pins)){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={status:'PASS_PLAN_HISTORICAL_EXPORTS_ONLY',plan_sha256:checks.plan_sha256,author_INDEX_sha256:'f708aa4a156eccb985f41179a4b56b6a0ee423b5c589c1f05003baed96814bd4',prior_plan02_review_sha256:'c260cef6ae31ac4e2e02f9aeb9bdc359584ead0f426588854e9d661dbce6d07d',OCI23_diagnosis_sha256:'2cc91004f4ce30985efe27c18de76b57f12fe377db2947f5723a827e0b9b6253',projects:10,metadata_objects:70,saved_readonly_commands_checked:100,current_Docker_queries:0,native_operations:0,cleanup_authority:'NOT_AUTHORIZED_HOLD',full_forensic_or_private_backup:false,all_future_prerequisites_still_required:true,owned_writes:'COMPLETE_STOP',files};const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs_rehashed:Object.keys(pins).length,cleanup_authority:index.cleanup_authority,owned_writes:'COMPLETE_STOP'}));
