import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex'),pins=JSON.parse(readFileSync(join(out,'INPUT_PINS.json'))),checks=JSON.parse(readFileSync(join(out,'CHECKS.json')));
for(const [path,want]of Object.entries(pins)){const b=readFileSync(join(root,path));assert.equal(b.length,want.bytes,path);assert.equal(hash(b),want.sha256,path);}
const files={};for(const name of readdirSync(out).sort()){if(name==='INDEX.json')continue;const b=readFileSync(join(out,name));files[name]={bytes:b.length,sha256:hash(b)};}
const index={...checks,actual_acceptance:false,owned_writes:'COMPLETE_STOP',files};const bytes=JSON.stringify(index,null,2)+'\n';writeFileSync(join(out,'INDEX.json'),bytes);console.log(JSON.stringify({status:index.status,sha256:hash(bytes),children:Object.keys(files).length,final_inputs_rehashed:Object.keys(pins).length,owned_writes:'COMPLETE_STOP'}));
