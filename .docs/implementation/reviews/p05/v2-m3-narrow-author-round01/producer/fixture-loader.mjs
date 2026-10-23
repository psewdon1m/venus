/** Source-bound C2 load/hash/fixture core; no unused C2 snapshot/catalog imports. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
export async function loadBound(){
 const binding=read(path.join(here,'data-binding.json'));
 assert.equal(process.version,binding.node_expected,'Node runtime version');
 for(const record of binding.files){const bytes=fs.readFileSync(record.path);assert.equal(bytes.length,record.bytes,record.path+' size');assert.equal(sha(bytes),record.sha256,record.path+' sha');}
 const reviewed=read(path.join(path.dirname(binding.independent_data_review.path),'HANDOFF.json'));
 assert.equal(reviewed.status,'PASS_TARGETED_DATA03_DRAFT_ONLY');assert.equal(reviewed.candidate_index_sha256,binding.candidate_index.sha256);assert.deepEqual(reviewed.open_findings,[]);
 const candidate=read(binding.candidate_index.path);for(const r of candidate.files){const bytes=fs.readFileSync(path.join(path.dirname(binding.candidate_index.path),r.path));assert.equal(bytes.length,r.bytes);assert.equal(sha(bytes),r.sha256);}
 const index=read(binding.source_index),cards=index.cards.map(r=>{const bytes=fs.readFileSync(r.path);assert.equal(sha(bytes),r.raw_sha256,r.id+' raw');return JSON.parse(bytes);});
 const apiRequire=createRequire(path.resolve('apps/api/dist/topic-game-model.js')),packRequire=createRequire(path.resolve('packages/relationship-engine/dist/pack.js'));
 assert.equal(fs.realpathSync(apiRequire.resolve('@venus/relationship-engine')),fs.realpathSync('packages/relationship-engine/dist/index.js'),'workspace package resolution');
 assert.equal(fs.realpathSync(packRequire.resolve('ajv/dist/2020.js')),fs.realpathSync(binding.ajv_resolution),'Ajv resolution');
 const module=p=>import(pathToFileURL(path.resolve(p)).href);
 const [engine,topics]=await Promise.all([module('packages/relationship-engine/dist/index.js'),module('packages/relationship-engine/dist/topic-map.js')]);
 const projection=path.dirname(binding.export.path),manifest=read(path.join(projection,'pack-manifest.json')),pack=engine.FrozenPack.load(cards,manifest,true);
 assert.equal(pack.digest,binding.pack_digest);assert.equal(pack.cards.length,470);assert.equal(pack.synthetic,true);
 const map=topics.FrozenTopicMap.syntheticFixture(Object.fromEntries(['map','taxonomy','semantic'].map(k=>[k,fs.readFileSync(path.join(projection,k+'.json'))])),pack,topics.syntheticTopicFixtureCapability());
 assert.deepEqual(map.pins,read(binding.export.path).loader_pins);assert.equal(map.entries.length,470);assert.equal(map.families.length,393);assert.equal(map.excluded_card_ids.length,59);
 return {binding,pack,map};
}
