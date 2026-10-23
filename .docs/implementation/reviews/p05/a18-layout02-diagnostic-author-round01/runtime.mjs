import {captureProducer,runtimeDigest} from '../../../../../.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02/runner-policy.mjs';
const producer='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02',inventory=captureProducer(producer);
console.log(JSON.stringify({runtime_digest:runtimeDigest(inventory),runtime_pins:Object.fromEntries(Object.entries(inventory).filter(([n])=>n.endsWith('.mjs')||n==='binding.json'||n==='DESIGN.md'))}));
