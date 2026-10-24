import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const dir='C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume20',policy=await import(pathToFileURL(dir+'/runner-policy.mjs')),binding=JSON.parse(readFileSync(dir+'/binding.json','utf8'));
const inventory=policy.captureProducer(dir),digest=policy.runtimeDigest(inventory);delete inventory['INDEX.json'];
writeFileSync(dir+'/INDEX.json',JSON.stringify({files:inventory,status:'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE',source_identity:binding.source_identity,producer_runtime_digest:digest,root_ACK:false},null,2)+'\n');
const after=policy.captureProducer(dir);if(policy.runtimeDigest(after)!==digest)throw Error('RUNTIME_DRIFT');
console.log(JSON.stringify({status:'AUTHOR_FROZEN_PENDING_NONAUTHOR_REVIEW',producer_runtime_digest:digest,source_identity:binding.source_identity,image:binding.image,root_run_ack:false,native_runs:0}));
