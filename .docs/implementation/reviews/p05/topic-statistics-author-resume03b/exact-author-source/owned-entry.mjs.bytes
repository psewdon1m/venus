/** Inert pre-job gate: no worker imports/child creation before private handshake. */
import assert from 'node:assert/strict';
import {isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const [owner,target,argument]=process.argv.slice(2);assert(/^[a-f0-9]{32}$/.test(owner));assert(isAbsolute(target)&&target.endsWith('.mjs'));let bytes='';
await new Promise((done,reject)=>{process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{bytes+=chunk;if(bytes.length>128)return reject(Error('OWNER_GATE_OVERFLOW'));if(bytes.includes('\n')){if(bytes!=='READY:'+owner+'\n')return reject(Error('OWNER_GATE_REJECTED'));process.stdin.destroy();done();}});process.stdin.on('end',()=>{if(bytes!=='READY:'+owner+'\n')reject(Error('OWNER_GATE_CLOSED'));});process.stdin.on('error',reject);});
const module=await import(pathToFileURL(target).href);assert.equal(typeof module.main,'function');await module.main([argument]);
