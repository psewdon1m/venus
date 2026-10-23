import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json')));
for(const [path,want] of Object.entries(pins)){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};
for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const bytes=readFileSync(join(out,name));files[name]={bytes:bytes.length,sha256:hash(bytes)};}
const index={status:'PASS_METHOD_ONLY',scope:'PROSPECTIVE_OCI21_DIAGNOSTIC_METHOD_NOT_ACTUAL_NOT_STAGE',author_index_sha256:'fd1308756dc711389ef419be80af46558f807fbccc5ec0dc75fc76921ae566ce',producer21_index_sha256:'7045afa7d30ea2e1f94eb6c0efcaa54cb83b00cc65f05a636a726ca645487596',inverse_source_qualification:'LF-normalized source exact OCI20; literal browser EOL bytes differ CRLF to LF',root_run_ack:false,native_runs:0,stage_acceptance:false,prospective_A17_binding_required:true,owned_writes:'COMPLETE_STOP',files};
const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);
console.log(JSON.stringify({status:index.status,index_sha256:hash(bytes),children:Object.keys(files).length,final_input_recheck:'PASS',owned_writes:'COMPLETE_STOP'}));
