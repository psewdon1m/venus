/** Exact compiled owner-provisional tuple; never a draft/synthetic capability. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export async function loadPilot(){
 assert.equal(process.version,'v24.22.0');const binding=JSON.parse(fs.readFileSync(path.join(here,'binding.json')));
 for(const[name,hash]of Object.entries(binding.runtime_files))assert.equal(sha(fs.readFileSync(path.resolve(name))),hash,'Runtime pin '+name);
 for(const[name,hash]of Object.entries(binding.method_files))assert.equal(sha(fs.readFileSync(path.join(here,name))),hash,'Method pin '+name);
 const module=p=>import(pathToFileURL(path.resolve(p)).href);
 const [catalog,engine,planner,renderer]=await Promise.all([module('packages/card-catalog/dist/index.js'),module('packages/relationship-engine/dist/index.js'),module('packages/relationship-engine/dist/topic-planner.js'),module('apps/api/dist/topic-game-model.js')]);
 const {pack,map}=catalog.ownerProvisionalPilot;
 assert.equal(pack.synthetic||map.synthetic,false);assert.equal(pack.approval_scope,'OWNER_PROVISIONAL_LOCAL_PILOT');assert.equal(map.approval_scope,pack.approval_scope);
 assert.deepEqual(pack.owner_provisional,binding.owner_authority);assert.deepEqual(map.owner_provisional,pack.owner_provisional);
 assert.equal(pack.digest,binding.pack_digest);assert.deepEqual(map.pins,binding.map_pins);assert.equal(pack.cards.length,470);assert.equal(map.entries.length,470);assert.equal(map.families.length,393);assert.equal(map.excluded_card_ids.length,59);
 assert.equal(planner.TOPIC_ALGORITHM,'RE-1.P05-TOPIC-3');assert.equal(planner.TOPIC_PRIVATE_POLICY,'ROOM-TOPIC-2');assert.equal(planner.TOPIC_RANDOM_DOMAIN,'RE-1.P05-TOPIC-2');
 engine.FrozenTopicMap.assertVerified(map,pack);assert.equal(catalog.bundledPacks.length,0);assert.equal(catalog.bundledTopicSources.length,0);
 assert.throws(()=>engine.FrozenPack.load(pack.cards,pack.manifest));
 return {binding,pack,map,engine,planner,renderer};
}
