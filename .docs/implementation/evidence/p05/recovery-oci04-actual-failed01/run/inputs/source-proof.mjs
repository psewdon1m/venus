/** Inert shared proof functions; never imports the CLI entrypoint. */
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout,clearTimeout} from 'node:timers';
const directory=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function producerMap(root=directory){const result={};function walk(p,rel=''){const s=lstatSync(p);assert(!s.isSymbolicLink());assert(s.isDirectory()||s.isFile());if(s.isDirectory()){if(rel)result[rel]={type:'directory'};for(const n of readdirSync(p).sort())walk(join(p,n),rel?rel+'/'+n:n);}else if(rel!=='INDEX.json')result[rel]={type:'regular_file',bytes:s.size,sha256:sha(readFileSync(p))};}walk(root);return result;}
export async function verifyIncluded(){const root=resolve(directory,'../..'),wanted=JSON.parse(readFileSync(join(directory,'included-inputs.json')));const actual=await new Promise((done,reject)=>{const child=spawn(join(root,'.venv/Scripts/python.exe'),['-B','-c','import sys,json;sys.path.insert(0,"tools");from stage_inventory import inventory,identity;f=inventory();print(json.dumps({"identity":identity(f),"files":f}))'],{cwd:root,windowsHide:true}),chunks=[];let count=0;const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('READONLY_SOURCE_INVENTORY_TIMEOUT'));},30000);child.stdout.on('data',b=>{count+=b.length;if(count>2*1024**2){child.kill('SIGKILL');reject(Error('SOURCE_INVENTORY_CAPTURE_CAP'));}else chunks.push(b);});child.stderr.resume();child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);try{assert.equal(code,0);done(JSON.parse(Buffer.concat(chunks)));}catch(e){reject(e);}});});assert.deepEqual(actual,wanted,'INCLUDED_SOURCE_MAP_CHANGED');return actual;}
