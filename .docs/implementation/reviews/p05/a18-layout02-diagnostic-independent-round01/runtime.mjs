import {captureProducer,runtimeDigest} from '../../../../../.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02/runner-policy.mjs';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02';
console.log(JSON.stringify({runtime_digest:runtimeDigest(captureProducer(root))}));
