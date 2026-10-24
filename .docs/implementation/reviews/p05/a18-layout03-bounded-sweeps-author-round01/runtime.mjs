import {captureProducer,runtimeDigest} from '../../../../../.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-03/runner-policy.mjs';
const path='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-03',inventory=captureProducer(path);
console.log(JSON.stringify({producer_runtime_digest:runtimeDigest(inventory),runtime_pins:Object.fromEntries(Object.entries(inventory).filter(([n])=>n.endsWith('.mjs')||n==='binding.json'||n==='DESIGN.md'))}));
