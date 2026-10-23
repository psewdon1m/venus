import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {describe,it,expect} from 'vitest';
import {FrozenPack,canonical,digest,policyDigest,type Card,type PackManifest,type TrustedTopicPins} from '@venus/relationship-engine';
import {bundledTopicSources,loadReleaseTopicBundles} from '../../../../../packages/card-catalog/src/topic-bundles.ts';
import {bundledPacks} from '../../../../../packages/card-catalog/src/bundles.ts';

const sha=(raw:string)=>createHash('sha256').update(raw).digest('hex');
const {syntheticCards,syntheticManifest}=createRequire(import.meta.url)('../../../../../tests/p03/fixtures.mjs') as {
 syntheticCards():Card[];syntheticManifest(cards:Card[],hash:typeof digest,policy:string):PackManifest;
};
export function registryFixture(revision='1') {
 // Reviewed-FORMAT machine trust boundary objects, never actual human approval.
 // No fixture data is written to approved-bundles or approved-topic-bundles.
 const cards=(syntheticCards() as Card[]).filter(c=>['Q-0001','Q-0104','TD-0001','YB-0001'].includes(c.id))
  .map(c=>({...c,status:'reviewed' as const,authoring:{...c.authoring,reviewed_by:'MACHINE-BOUNDARY-NOT-HUMAN',reviewed_at:'2026-10-19T00:00:00Z',rights_status:'original_verified' as const}}));
 const manifest=syntheticManifest(cards,digest,policyDigest);manifest.status='reviewed_release_candidate';manifest.reviewed_cards=cards.length;
 manifest.canonical_payload_sha256=digest(Object.fromEntries(Object.entries(manifest).filter(([key])=>key!=='canonical_payload_sha256')));
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
