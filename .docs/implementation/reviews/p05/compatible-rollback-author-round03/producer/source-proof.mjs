/** Shared inert proof helpers: no driver imports, no top-level await cycle. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),root=dirname(fileURLToPath(import.meta.url)),workspace=resolve(root,'../..');
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function producerMap(){const files={};function visit(relative){const p=join(root,relative),s=lstatSync(p);assert(!s.isSymbolicLink());if(s.isDirectory()){for(const n of readdirSync(p).sort())visit(relative?relative+'/'+n:n);}else{assert(s.isFile());if(relative==='INDEX.json')return;const b=readFileSync(p);files[relative]={type:'regular_file',bytes:b.length,sha256:sha(b)};}}visit('');return files;}
export async function verifyIncluded(){const binding=JSON.parse(readFileSync(join(root,'BINDING.json'))),frozen=JSON.parse(readFileSync(join(root,'included-inputs.json'))),{stdout}=await exec(join(workspace,'.venv/Scripts/python.exe'),['-B','-c','import sys,json;sys.path.insert(0,"tools");from stage_inventory import inventory,identity;f=inventory();print(json.dumps({"files":f,"identity":identity(f)}))'],{cwd:workspace,timeout:15000,maxBuffer:4*1024**2,windowsHide:true,encoding:'utf8'}),actual=JSON.parse(stdout);assert.equal(actual.identity,binding.source_identity);assert.equal(Object.keys(actual.files).length,binding.included_files);assert.deepEqual(actual.files,frozen);return actual;}
