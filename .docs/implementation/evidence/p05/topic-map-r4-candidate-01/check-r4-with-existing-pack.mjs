/** Existing pack/schema/manifest validator only; drafts remain synthetic and never registered. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {manifestFor} from '../../../../../packages/card-catalog/dist/index.js';
import {FrozenPack,digest} from '../../../../../packages/relationship-engine/dist/index.js';
const dir=fileURLToPath(new URL('.',import.meta.url));
const index=JSON.parse(fs.readFileSync('.docs/implementation/evidence/p04/review470-r4/source-index470.json'));
const cards=index.cards.map(r=>JSON.parse(fs.readFileSync(r.path)));
const manifest=manifestFor(cards,1,false),pack=FrozenPack.load(cards,manifest,true);
assert.equal(pack.cards.length,470);assert.equal(pack.synthetic,true);
assert.equal(pack.digest,'sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4');
const bindings=JSON.parse(fs.readFileSync(dir+'source-bindings.json'));
assert.deepEqual(manifest,{...bindings.pack_manifest_payload,canonical_payload_sha256:digest(bindings.pack_manifest_payload)});
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
console.log(JSON.stringify({status:'EXISTING_FROZENPACK_DRAFT_SCHEMA_VALIDATION_PASS',cards:470,synthetic:true,approved:false,runtime_activation:false,pack_digest:pack.digest,catalog_digest:index.catalog_digest,compiled_inputs:Object.fromEntries(['packages/card-catalog/dist/catalog.js','packages/relationship-engine/dist/pack.js','packages/relationship-engine/dist/policy-identity.js'].map(p=>[p,sha(p)])),meaning:'AJV/pack structural checks only; no human approval, semantic distinctness, selector, C2 or current-source stage claim'},null,2));
