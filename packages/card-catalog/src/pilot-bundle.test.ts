import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {FrozenPack,FrozenTopicMap,canonical,ownerProvisionalCapability,type OwnerProvisionalCapability} from '@venus/relationship-engine';
import {syntheticTopicFixtureCapability} from '../../relationship-engine/src/topic-map.js';
import {loadOwnerProvisionalPilot,ownerProvisionalPilot} from './pilot-bundle.js';
import registry from './owner-provisional-pilot.json' with {type:'json'};
import {loadReleaseTopicBundles} from './topic-bundles.js';
const sha=(raw:Uint8Array)=>createHash('sha256').update(raw).digest('hex');
const bytes=()=>Object.fromEntries(['map','taxonomy','semantic'].map(key=>[key,Buffer.from(registry.bytes[key as 'map'],'base64')])) as {map:Buffer;taxonomy:Buffer;semantic:Buffer};
describe('compiled owner-provisional exact470 admission, distinct from production approval',()=>{
 it('preserves real470 raw source bytes, draft metadata, digest and all map pins',()=>{
  const {pack,map}=ownerProvisionalPilot;
  expect(pack.cards).toHaveLength(470);expect(pack.synthetic||map.synthetic).toBe(false);
  expect(pack.approval_scope).toBe('OWNER_PROVISIONAL_LOCAL_PILOT');expect(map.approval_scope).toBe(pack.approval_scope);
  expect(pack.manifest.status).toBe('illustrative_draft_candidate');expect(pack.manifest.reviewed_cards).toBe(0);
  expect(pack.cards.every(c=>c.status==='draft')).toBe(true);
  expect(pack.digest).toBe(registry.grant.pack_digest);
  for(const key of ['map','taxonomy','semantic'] as const)expect(map.pins[`${key}_sha256`]).toBe(sha(bytes()[key]));
  for(const card of pack.cards){const raw=readFileSync(new URL(`../../../.docs/implementation/evidence/p04/review470-r4/candidate/cards/${card.id}.json`,import.meta.url));
   expect(sha(raw)).toBe(registry.grant.card_raw_sha256[card.id as keyof typeof registry.grant.card_raw_sha256]);expect(canonical(JSON.parse(raw.toString()))).toBe(canonical(card));}
  for(const[path,hash]of Object.entries(registry.grant.references))expect(sha(readFileSync(new URL('../../../'+path,import.meta.url)))).toBe(hash);
  expect(Object.isFrozen(pack.owner_provisional)&&Object.isFrozen(map)).toBe(true);
 });
 it('rejects the pilot through the ordinary reviewed pack loader',()=>{
  expect(()=>FrozenPack.load([...ownerProvisionalPilot.pack.cards],ownerProvisionalPilot.pack.manifest)).toThrow();
 });
 it('rejects pilot pack at both release topic registry and ordinary map production loader',()=>{
  const {pack}=ownerProvisionalPilot;
  expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[]},[pack])).toThrow();
  expect(()=>FrozenTopicMap.load(bytes(),pack,{approval_id:'not-authority',approval_status:'APPROVED',pack_digest:pack.digest,map_sha256:registry.grant.bytes_sha256.map,taxonomy_sha256:registry.grant.bytes_sha256.taxonomy,semantic_sha256:registry.grant.bytes_sha256.semantic})).toThrow();
 });
 for(const change of ['card','map','decision','grant','extra'])it('rejects arbitrary modified compiled input '+change,()=>{
  const input=structuredClone(registry) as typeof registry&{extra?:boolean};
  if(change==='card')input.cards[0]=Buffer.from('{}').toString('base64');
  if(change==='map')input.bytes.map=Buffer.from('{}').toString('base64');
  if(change==='decision')input.grant.references['.docs/implementation/user-decisions.v4.json']='0'.repeat(64);
  if(change==='grant')input.grant.production_approved=true;
  if(change==='extra')input.extra=true;
  expect(()=>loadOwnerProvisionalPilot(input)).toThrow('PILOT_REGISTRY_MISMATCH');
 });
 it('requires real capability identity, not a copied shape',()=>{
  const {pack}=ownerProvisionalPilot,pins=pack.owner_provisional!;
  const cap=ownerProvisionalCapability('local-pilot',pins);
  expect(()=>FrozenPack.ownerProvisional([...pack.cards],pack.manifest,{...cap} as OwnerProvisionalCapability)).toThrow('OWNER_PROVISIONAL_CAPABILITY_REQUIRED');
  expect(()=>FrozenTopicMap.ownerProvisional(bytes(),pack,{...cap} as OwnerProvisionalCapability)).toThrow();
 });
 it('requires authority exact pack and raw map hashes independently of registry checking',()=>{
  const {pack}=ownerProvisionalPilot,pins=pack.owner_provisional!;
  const wrong=ownerProvisionalCapability('local-pilot',{...pins,pack_digest:'sha256:'+'0'.repeat(64)});
  expect(()=>FrozenPack.ownerProvisional([...pack.cards],pack.manifest,wrong)).toThrow('OWNER_PROVISIONAL_PACK_MISMATCH');
  const cap=ownerProvisionalCapability('local-pilot',pins);
  expect(()=>FrozenTopicMap.ownerProvisional({...bytes(),map:Buffer.from('{}')},pack,cap)).toThrow('OWNER_PROVISIONAL_MAP_MISMATCH');
 });
 it('keeps synthetic test brands incompatible with the pilot overlay',()=>{
  const {pack}=ownerProvisionalPilot,draft=FrozenPack.load([...pack.cards],pack.manifest,true),cap=ownerProvisionalCapability('local-pilot',pack.owner_provisional!);
  expect(draft.approval_scope).toBe('SYNTHETIC_FIXTURE');
  expect(()=>FrozenTopicMap.ownerProvisional(bytes(),draft,cap)).toThrow();
  expect(()=>FrozenTopicMap.syntheticFixture(bytes(),pack,syntheticTopicFixtureCapability())).toThrow();
  const originalMap=FrozenTopicMap.syntheticFixture(bytes(),draft,syntheticTopicFixtureCapability());
  expect(canonical(originalMap.pins)).toBe(canonical(ownerProvisionalPilot.map.pins));
 });
});
