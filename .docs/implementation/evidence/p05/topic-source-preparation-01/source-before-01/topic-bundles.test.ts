import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {FrozenPack,canonical,digest,policyDigest,type Card,type TrustedTopicPins} from '@venus/relationship-engine';
import {syntheticCards,syntheticManifest} from '../../../tests/p03/fixtures.mjs';
import {bundledTopicSources,loadReleaseTopicBundles} from './topic-bundles.js';
import {bundledPacks} from './bundles.js';

const sha=(raw:string)=>createHash('sha256').update(raw).digest('hex');
function fixture(revision='1') {
 // Reviewed-FORMAT machine trust boundary objects, never actual human approval.
 // No fixture data is written to approved-bundles or approved-topic-bundles.
 const cards=(syntheticCards() as Card[]).filter(c=>['Q-0001','Q-0104','TD-0001','YB-0001'].includes(c.id))
  .map(c=>({...c,status:'reviewed' as const,authoring:{...c.authoring,reviewed_by:'MACHINE-BOUNDARY-NOT-HUMAN',reviewed_at:'2026-10-19T00:00:00Z',rights_status:'original_verified' as const}}));
 const manifest=syntheticManifest(cards,digest,policyDigest);manifest.status='reviewed_release_candidate';manifest.reviewed_cards=cards.length;
 const {canonical_payload_sha256:_old,...payload}=manifest;manifest.canonical_payload_sha256=digest(payload);
 const pack=FrozenPack.load(cards,manifest),approved={classification_status:'APPROVED',approved:true,runtime_eligible:true,owner_review_status:'APPROVED'};
 const taxonomy={schema:'venus.topic-map.v1',taxonomy_revision:'MACHINE-TAX-'+revision,...approved,topics:[{topic_id:'creative',labels:{ru:'Тест',en:'Test',tr:'Test'}}]};
 const semantic={schema:'venus.topic-map.v1',semantic_revision:'MACHINE-SEM-'+revision,...approved,families:pack.cards.map(c=>({semantic_family_id:'SINGLE-'+c.id,
  classification:'IDENTITY_ONLY',mixed_visibility:false,repertoire:'eligible',members:[{card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}]}))};
 const map={schema:'venus.topic-map.v1',map_revision:'MACHINE-MAP-'+revision,...approved,pack_digest:pack.digest,taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),
  entries:pack.cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,topic_ids:['creative'],semantic_family_ids:['SINGLE-'+c.id],
   locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale as 'en']).map(([field,value])=>[field,sha(value!)]))]))}))};
 const raw={map:JSON.stringify(map),taxonomy:JSON.stringify(taxonomy),semantic:JSON.stringify(semantic)};
 const trusted:TrustedTopicPins={approval_id:'MACHINE-BOUNDARY-ONLY-'+revision,approval_status:'APPROVED',pack_digest:pack.digest,map_sha256:sha(raw.map),taxonomy_sha256:sha(raw.taxonomy),semantic_sha256:sha(raw.semantic)};
 const entry={trusted,bytes:Object.fromEntries(Object.entries(raw).map(([key,text])=>[key,Buffer.from(text).toString('base64')])),active:true};
 return {pack,entry,raw,map,taxonomy,semantic};
}
describe('release-only approved topic bundles, no production content activation',()=>{
 it('keeps both real release registries empty and frozen',()=>{expect(bundledPacks).toHaveLength(0);expect(bundledTopicSources).toHaveLength(0);expect(Object.isFrozen(bundledTopicSources)).toBe(true);});
 it('binds raw bytes/full cards and preserves inactive historical pins for one reviewed pack',()=>{
  const old=fixture('OLD'),current=fixture('CURRENT');expect(current.pack.digest).toBe(old.pack.digest);
  const input={schema_version:1,approved:[{...old.entry,active:false},current.entry]},before=canonical(input);
  const result=loadReleaseTopicBundles(input,[old.pack]);expect(result).toHaveLength(2);expect(result[0]!.active).toBe(false);
  expect(result[0]!.map.pins.map_revision).toBe('MACHINE-MAP-OLD');expect(result[1]!.map.pins.map_revision).toBe('MACHINE-MAP-CURRENT');
  expect(result.every(v=>!v.pack.synthetic&&!v.map.synthetic)).toBe(true);expect(Object.isFrozen(result)).toBe(true);expect(Object.isFrozen(result[0])).toBe(true);
  expect(canonical(input)).toBe(before);
 });
 it('permits zero active maps without choosing a historical fallback',()=>{const f=fixture();expect(loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,active:false}]},[f.pack])[0]!.active).toBe(false);});
 it('rejects two active maps and duplicate exact historical pin tuples',()=>{
  const a=fixture('A'),b=fixture('B');expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[a.entry,b.entry]},[a.pack])).toThrow('ACTIVE_AMBIGUOUS');
  expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...a.entry,active:false},{...a.entry,active:false}]},[a.pack])).toThrow('BUNDLE_DUPLICATE');
 });
 it('does not authorize a matching map merely because it carries reviewed-format flags',()=>{const f=fixture();expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[f.entry]},[])).toThrow('PACK_UNAVAILABLE');});
 it('rejects synthetic packs even if their digest and map hashes are caller-supplied',()=>{
  const cards=syntheticCards().slice(0,2),pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
  expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[]},[pack])).toThrow('PACK_REGISTRY_INVALID');
 });
 it('rejects duplicate authorized pack digests',()=>{const f=fixture();expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[f.entry]},[f.pack,f.pack])).toThrow('PACK_REGISTRY_INVALID');});
 for(const patch of [{schema_version:2},{extra:'https://example.invalid'},{approved:'[]'},{approved:Array(129).fill(null)}])it('rejects malformed or oversized release registry '+Object.keys(patch).join(),()=>{expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[],...patch},[])).toThrow('REGISTRY_INVALID');});
 it('requires exact entry fields and an explicit active boolean',()=>{
  const f=fixture();for(const entry of [{trusted:f.entry.trusted,bytes:f.entry.bytes},{...f.entry,active:1},{...f.entry,url:'https://example.invalid'},{...f.entry,bytes:{...f.entry.bytes,external_path:'/tmp/map'}}]){
   expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[entry]},[f.pack])).toThrow('REGISTRY_INVALID');
  }
 });
 it('rejects noncanonical base64, external paths and changed raw JSON bytes',()=>{
  const f=fixture();for(const map of ['',f.entry.bytes.map+'\n','/tmp/map','https://example.invalid/map',Buffer.from(f.raw.map+' ').toString('base64')]){
   expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,bytes:{...f.entry.bytes,map}}]},[f.pack])).toThrow();
  }
 });
 it('does not convert unapproved/HOLD documents even with correct newly supplied raw hashes',()=>{
  const f=fixture(),map=JSON.stringify({...f.map,owner_review_status:'HOLD'});
  expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,trusted:{...f.entry.trusted,map_sha256:sha(map)},bytes:{...f.entry.bytes,map:Buffer.from(map).toString('base64')}}]},[f.pack])).toThrow('NOT_APPROVED');
 });
 it('rejects changed trust hashes, unknown trust fields and wrong pack digest',()=>{
  const f=fixture();for(const trusted of [{...f.entry.trusted,map_sha256:'0'.repeat(64)},{...f.entry.trusted,allowSynthetic:true},{...f.entry.trusted,pack_digest:'sha256:'+'f'.repeat(64)}]){
   expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,trusted}]},[f.pack])).toThrow();
  }
 });
});
