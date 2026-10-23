/** Cold host entrypoint. No Docker/imported worker until exact authority+guard readiness. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateRunAuthority} from './contract.mjs';
import {producerMap,verifyIncluded} from './source-proof.mjs';
const directory=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export {producerMap,verifyIncluded} from './source-proof.mjs';
export async function run(ackFile){const binding=JSON.parse(readFileSync(join(directory,'BINDING.json'))),ack=JSON.parse(readFileSync(ackFile)),rawIndex=readFileSync(join(directory,'INDEX.json'));validateRunAuthority(binding,ack,sha(rawIndex));const expected=JSON.parse(rawIndex);assert.deepEqual(producerMap(),expected.source_map,'PRODUCER_CHANGED_OR_EXTRA_INPUT');await verifyIncluded();assert.equal(binding.resource_guard.status,'INDEPENDENTLY_REVIEWED_READY');assert(/^[A-Za-z0-9._-]+\.mjs$/.test(binding.resource_guard.module));const guardPath=join(directory,binding.resource_guard.module);assert.equal(sha(readFileSync(guardPath)),binding.resource_guard.sha256);const external=await import(pathToFileURL(guardPath).href);assert.equal(external.api_version,'P05_OCI_EXTERNAL_RESOURCE_GUARD_1');assert.equal(typeof external.startOCIResourceGuard,'function');const{executePlan}=await import('./host-runner.mjs');return executePlan(binding,ack,external,expected.source_map);}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const ack=process.argv.find(a=>a.startsWith('--run-with-ack='));if(!ack)console.log(JSON.stringify({status:'NOT_RUN',root_ack_required:true,resource_guard:'NOT_READY_UNLESS_FROZEN_IN_BINDING',Docker_calls:0,producer_only:true}));else try{await run(ack.slice(15));}catch(e){console.log(JSON.stringify({status:'NOT_ACCEPTED_BEFORE_OR_DURING_AUTHORIZED_PLAN',error_name:e.name,source_mutations:false}));process.exitCode=1;}}
