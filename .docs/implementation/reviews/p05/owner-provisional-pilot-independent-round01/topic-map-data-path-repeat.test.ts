import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {syntheticCards, syntheticManifest} from "C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/tests/p03/fixtures.mjs";
import {digest, FrozenPack} from "C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/packages/relationship-engine/src/pack.ts";
import {policyDigest} from "C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/packages/relationship-engine/src/policy-identity.ts";
import {type Card} from "C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/packages/relationship-engine/src/types.ts";
import {FrozenTopicMap, TOPIC_MAP_VERSION, syntheticTopicFixtureCapability,
  type RuntimeSemanticPolicy, type RuntimeTopicMap, type RuntimeTopicTaxonomy, type TopicMapBytes, type TrustedTopicPins} from "C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/packages/relationship-engine/src/topic-map.ts";

const cards = (syntheticCards() as Card[]).filter(c=>Number(c.id.split('-')[1])<=4||Number(c.id.split('-')[1])===104);
const pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
const sha=(raw:Uint8Array|string)=>createHash('sha256').update(raw).digest('hex');
const capability=syntheticTopicFixtureCapability();
function docs(local=pack,approved=false):{map:RuntimeTopicMap;taxonomy:RuntimeTopicTaxonomy;semantic:RuntimeSemanticPolicy} {
  const approval=approved?{classification_status:'APPROVED' as const,approved:true,runtime_eligible:true,owner_review_status:'APPROVED' as const}
    :{classification_status:'SYNTHETIC_MACHINE_FIXTURE' as const,approved:false,runtime_eligible:false,owner_review_status:'SYNTHETIC_ONLY' as const};
  const taxonomy:RuntimeTopicTaxonomy={schema:TOPIC_MAP_VERSION,taxonomy_revision:'TEST-TAXONOMY-1',...approval,
    topics:[{topic_id:'creative',labels:{ru:'Творчество',en:'Creative',tr:'Yaratıcılık'}},{topic_id:'music',labels:{ru:'Музыка',en:'Music',tr:'Müzik'}}]};
  const entries=local.cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,
    topic_ids:['creative','music'],semantic_family_ids:['SINGLE-'+c.id],
    locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale as 'en']).map(([field,text])=>[field,sha(text)]))]))}));
  const semantic:RuntimeSemanticPolicy={schema:TOPIC_MAP_VERSION,semantic_revision:'TEST-SEMANTIC-1',...approval,
    families:local.cards.map(c=>({semantic_family_id:'SINGLE-'+c.id,classification:'IDENTITY_ONLY' as const,mixed_visibility:false,repertoire:'eligible' as const,
      members:[{card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}]}))};
  const map:RuntimeTopicMap={schema:TOPIC_MAP_VERSION,map_revision:'TEST-MAP-1',...approval,pack_digest:local.digest,
    taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),entries:entries as RuntimeTopicMap['entries']};
  return {map,taxonomy,semantic};
}
function bytes(d=docs()):TopicMapBytes {return {map:Buffer.from(JSON.stringify(d.map)),taxonomy:Buffer.from(JSON.stringify(d.taxonomy)),semantic:Buffer.from(JSON.stringify(d.semantic))};}
function load(d=docs()){return FrozenTopicMap.syntheticFixture(bytes(d),pack,capability);}
function mutate(operation:(d:ReturnType<typeof docs>)=>void){const d=structuredClone(docs());operation(d);return d;}
const asMutable=<T>(v:T)=>v as unknown as Record<string,unknown>;
describe('explicit versioned topic-map loader, no runtime activation',()=>{
  it('binds every exact card, all localized sides and immutable pins',()=>{
    const input=docs(),before=digest(input),map=load(input);
    expect(map.entries).toHaveLength(pack.cards.length);expect(map.synthetic).toBe(true);expect(digest(input)).toBe(before);
    expect(map.pins.taxonomy_digest).toBe(digest(input.taxonomy));expect(Object.isFrozen(map.entry('TD-0001').locale_field_sha256.tr)).toBe(true);
    expect(()=>asMutable(map.pins).map_revision='changed').toThrow();
    expect(map.allowed({...pack.card('Q-0001'),revision:99})).toBe(false);
    expect(map.allowed({...pack.card('Q-0001'),id:'Q-9999'})).toBe(false);
  });
  it('requires the separately issued synthetic capability and a synthetic pack',()=>{
    expect(()=>FrozenTopicMap.syntheticFixture(bytes(),pack,{scope:'SYNTHETIC_TOPIC_FIXTURE_ONLY'})).toThrow('FIXTURE_ONLY');
    const trusted={approval_id:'fixture-not-registry',approval_status:'APPROVED',pack_digest:pack.digest,map_sha256:sha(bytes().map),taxonomy_sha256:sha(bytes().taxonomy),semantic_sha256:sha(bytes().semantic)} as TrustedTopicPins;
    expect(()=>FrozenTopicMap.load(bytes(),pack,trusted)).toThrow('NOT_APPROVED');
  });
  it('rejects actual candidate02 HOLD even through explicit fixture entry',()=>{
    const base='C:/.projects/venus/.docs/implementation/evidence/p05/topic-map-candidate-02/';
    const b={map:readFileSync(base+'private-topic-map.candidate.v1.json'),taxonomy:readFileSync(base+'taxonomy.candidate.v1.json'),semantic:readFileSync(base+'semantic-families.candidate.v1.json')};
    const before=sha(b.map);expect(()=>FrozenTopicMap.syntheticFixture(b,pack,capability)).toThrow('NOT_APPROVED');expect(sha(b.map)).toBe(before);
  });
  it('checks actual raw trusted pins and separately approved full documents',()=>{
    // Machine-made reviewed objects exercise the caller-trusted registry boundary;
    // this test is not a claim that a human approved these fixture cards.
    const reviewed=structuredClone(cards);for(const c of reviewed){c.status='reviewed';c.authoring.reviewed_by='SYNTHETIC-REVIEWER';c.authoring.reviewed_at='2026-10-19T00:00:00Z';c.authoring.rights_status='original_verified';}
    const manifest=syntheticManifest(reviewed,digest,policyDigest);manifest.status='reviewed_release_candidate';manifest.reviewed_cards=reviewed.length;
    const {canonical_payload_sha256:oldDigest,...payload}=manifest;expect(oldDigest).toBeTruthy();manifest.canonical_payload_sha256=digest(payload);
    const rp=FrozenPack.load(reviewed,manifest),d=docs(rp,true),b=bytes(d);
    const trusted:TrustedTopicPins={approval_id:'MACHINE-BOUNDARY-TEST',approval_status:'APPROVED',pack_digest:rp.digest,
      map_sha256:sha(b.map),taxonomy_sha256:sha(b.taxonomy),semantic_sha256:sha(b.semantic)};
    expect(FrozenTopicMap.load(b,rp,trusted).synthetic).toBe(false);
    expect(()=>FrozenTopicMap.load({...b,map:Buffer.concat([b.map,Buffer.from(' ')])},rp,trusted)).toThrow('HASH');
    const denied=structuredClone(d);denied.map.owner_review_status='SYNTHETIC_ONLY';const db=bytes(denied);
    expect(()=>FrozenTopicMap.load(db,rp,{...trusted,map_sha256:sha(db.map)})).toThrow('NOT_APPROVED');
    expect(()=>FrozenTopicMap.syntheticFixture(b,rp,capability)).toThrow('FIXTURE_ONLY');
  });
  it.each([
    ['missing row',(d:ReturnType<typeof docs>)=>asMutable(d.map).entries=d.map.entries.slice(1)],
    ['duplicate row',(d:ReturnType<typeof docs>)=>asMutable(d.map).entries=[d.map.entries[0],...d.map.entries.slice(1,-1),d.map.entries[0]]],
    ['revision',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).card_revision=99],
    ['hash',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).card_sha256='0'.repeat(64)],
    ['mode',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).mode='yes_but'],
    ['unknown topic',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).topic_ids=['unknown']],
    ['empty topics',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).topic_ids=[]],
    ['duplicate topics',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).topic_ids=['creative','creative']],
    ['unknown family',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!).semantic_family_ids=['unknown']],
    ['missing locale',(d:ReturnType<typeof docs>)=>delete asMutable(d.map.entries[0]!.locale_field_sha256).tr],
    ['TR hash',(d:ReturnType<typeof docs>)=>asMutable(d.map.entries[0]!.locale_field_sha256.tr).question='0'.repeat(64)],
    ['extra map field',(d:ReturnType<typeof docs>)=>asMutable(d.map).allowUnapproved=true],
    ['unrecognized revision schema',(d:ReturnType<typeof docs>)=>asMutable(d.map).schema='venus.topic-map.v2'],
    ['false status',(d:ReturnType<typeof docs>)=>asMutable(d.map).approved=true],
  ])('rejects %s rather than repairing classifications',(_,operation)=>expect(()=>load(mutate(operation))).toThrow());
  it('checks both TD alternatives and the YesBut responder in every locale',()=>{
    for(const [id,field]of [['TD-0001','truth'],['TD-0001','dare'],['YB-0001','proposal'],['YB-0001','responder']])for(const locale of ['ru','en','tr']){
      const d=mutate(value=>{const entry=value.map.entries.find(e=>e.card_id===id)!;asMutable(entry.locale_field_sha256[locale as 'en'])[field!]='0'.repeat(64);});
      expect(()=>load(d)).toThrow('LOCALE_BINDING');
    }
  });
  it('rejects forged family reverse membership, mixed visibility and identity uniqueness',()=>{
    for(const change of [
      (d:ReturnType<typeof docs>)=>asMutable(d.semantic.families[0]!).members=[],
      (d:ReturnType<typeof docs>)=>asMutable(d.semantic.families[0]!).mixed_visibility=true,
      (d:ReturnType<typeof docs>)=>asMutable(d.semantic.families[0]!.members[0]!).card_revision=99,
    ]){const d=mutate(change);asMutable(d.map).semantic_policy_digest=digest(d.semantic);expect(()=>load(d)).toThrow();}
  });
  it('excludes an entire mixed family unconditionally without changing the pack',()=>{
    const d=docs(),ids=['Q-0001','Q-0104'],family='P04-SEM-17';
    for(const id of ids)asMutable(d.map.entries.find(e=>e.card_id===id)!).semantic_family_ids=[family];
    const members=ids.map(id=>{const c=pack.card(id);return {card_id:id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction};});
    asMutable(d.semantic).families=[...d.semantic.families.filter(f=>!f.members.some(m=>ids.includes(m.card_id))),
      {semantic_family_id:family,classification:'EXPLICIT_FAMILY',mixed_visibility:true,repertoire:'exclude',members}];
    asMutable(d.map).semantic_policy_digest=digest(d.semantic);const before=digest(pack.cards),m=load(d);
    expect(m.excluded_card_ids).toEqual(ids);expect(m.allowed(pack.card(ids[0]!))).toBe(false);expect(m.allowed(pack.card(ids[1]!))).toBe(false);expect(digest(pack.cards)).toBe(before);
    asMutable(d.semantic.families.at(-1)!).repertoire='eligible';asMutable(d.map).semantic_policy_digest=digest(d.semantic);expect(()=>load(d)).toThrow('MIXED');
  });
  it.each([
    ['duplicate key','{"schema":1,"schema":1}'],['nested duplicate','{"nested":{"x":1,"x":2}}'],
    ['BOM','\ufeff{}'],['surrogate','{"x":"\\ud800"}'],['nonfinite','{"x":1e999}'],
    ['trailing','{} {}'],['depth','['.repeat(50)+'0'+']'.repeat(50)],['decomposed NFC','{"x":"e\u0301"}'],
  ])('strict raw parser rejects %s',(_,raw)=>expect(()=>FrozenTopicMap.syntheticFixture({...bytes(),map:Buffer.from(raw)},pack,capability)).toThrow('TOPIC_JSON'));
  it('rejects invalid UTF8 and oversized raw records',()=>{
    expect(()=>FrozenTopicMap.syntheticFixture({...bytes(),map:Buffer.from([0xff])},pack,capability)).toThrow('UTF8');
    expect(()=>FrozenTopicMap.syntheticFixture({...bytes(),map:Buffer.alloc(8*1024*1024+1)},pack,capability)).toThrow('SIZE');
  });
});
