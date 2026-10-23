import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume15';
const p=await import(pathToFileURL(root+'/x11.mjs'));
const policy=await import(pathToFileURL(root+'/runner-policy.mjs'));
const nonce='Venus layout 12345678-1234-4123-8123-123456789abc';
const good=nonce+' \u2014 Nightly';let passed=0;
// Reject non-string native results, normalized/case-folded titles and trailing private data.
for(const v of [null,undefined,1,{},good+'\n',good+' extra',good.toUpperCase(),good.normalize('NFKC')+'\u200b'])assert.equal(p.ownWindowTitle(nonce,'firefox',v),false);
passed++;
// Engine dispatch cannot grant a measured Firefox title to any other engine.
for(const engine of ['webkit','chromium','unknown','Firefox','__proto__'])assert.equal(p.ownWindowTitle(nonce,engine,good),false);
assert.equal(p.ownWindowTitle(nonce,'firefox',good),true);assert.equal(p.ownWindowTitle(nonce,'firefox',nonce),true);passed++;
// No regex meaning can be inserted into the generated synthetic nonce.
for(const n of [nonce+'x',nonce.replace('12345678','........'),nonce.replace('Venus','venus')]){
 assert.throws(()=>p.windowTitlePattern(n,'firefox'));assert.throws(()=>p.ownWindowTitle(n,'firefox',good));
}passed++;
const capture=policy.captureProducer(root),expected=JSON.parse(readFileSync('C:/.projects/venus/.docs/implementation/reviews/p05/layout15-firefox-suffix-author-round01/PRODUCER-PINS.json'));
assert.deepEqual(capture,expected.files);
assert.equal(policy.runtimeDigest(capture),'3d3ad6ca89ec9a20451fa5ea628d1c96cc770a73680b55fb5b6e0e5237b9a090');
console.log(JSON.stringify({status:'PASS_THREE_INDEPENDENT_NEGATIVES_AND_RUNTIME_PINS',controls:passed,runtime:policy.runtimeDigest(capture)}));
