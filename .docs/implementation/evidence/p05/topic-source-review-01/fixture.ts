import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type pg from 'pg';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {FrozenPack,digest,policyDigest,type Card,type TopicMapPins,type TrustedTopicPins} from '@venus/relationship-engine';
import {RevocationLedger,loadReleaseTopicBundles,type ReleaseTopicBundle} from '@venus/card-catalog';
import {syntheticCards,syntheticManifest} from '../../../../../tests/p03/fixtures.mjs';
import {ReleaseTopicGameSource} from '../../../../../apps/api/src/topic-game-source.ts';
import type {GameCatalog} from '../../../../../apps/api/src/catalog.ts';

// Test module isolation only. The production constructor has no bundle argument,
// no allowSynthetic flag and no dependency on this test-only mutable registry.
const release=vi.hoisted(()=>({bundles:[] as readonly import('@venus/card-catalog').ReleaseTopicBundle[]}));
vi.mock('@venus/card-catalog',async importOriginal=>{const actual=await importOriginal<typeof import('@venus/card-catalog')>();return {...actual,get bundledTopicSources(){return release.bundles;}};});
const temporary:string[]=[];
afterEach(()=>{release.bundles=[];for(const directory of temporary.splice(0))rmSync(directory,{recursive:true,force:true});});
const sha=(raw:string)=>createHash('sha256').update(raw).digest('hex');
export function fixture(revision='1',excluded:readonly string[]=[]) {
 // Explicit reviewed-format machine fixtures, no actual owner/human claim.
 const cards=(syntheticCards() as Card[]).filter(c=>['Q-0001','Q-0104','TD-0001','YB-0001'].includes(c.id))
  .map(c=>({...c,status:'reviewed' as const,authoring:{...c.authoring,reviewed_by:'MACHINE-BOUNDARY-NOT-HUMAN',reviewed_at:'2026-10-19T00:00:00Z',rights_status:'original_verified' as const}}));
 const manifest=syntheticManifest(cards,digest,policyDigest);manifest.status='reviewed_release_candidate';manifest.reviewed_cards=cards.length;
 manifest.canonical_payload_sha256=digest(Object.fromEntries(Object.entries(manifest).filter(([key])=>key!=='canonical_payload_sha256')));
 const pack=FrozenPack.load(cards,manifest),approval={classification_status:'APPROVED',approved:true,runtime_eligible:true,owner_review_status:'APPROVED'};
 const taxonomy={schema:'venus.topic-map.v1',taxonomy_revision:'MACHINE-TAX-'+revision,...approval,topics:[{topic_id:'creative',labels:{ru:'Тест',en:'Test',tr:'Test'}}]};
 const semantic={schema:'venus.topic-map.v1',semantic_revision:'MACHINE-SEM-'+revision,...approval,families:pack.cards.map(c=>({semantic_family_id:'SINGLE-'+c.id,classification:'IDENTITY_ONLY',mixed_visibility:false,repertoire:excluded.includes(c.id)?'exclude':'eligible',members:[{card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}]}))};
 const map={schema:'venus.topic-map.v1',map_revision:'MACHINE-MAP-'+revision,...approval,pack_digest:pack.digest,taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),entries:pack.cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,topic_ids:['creative'],semantic_family_ids:['SINGLE-'+c.id],locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale as 'en']).map(([field,text])=>[field,sha(text!)]))]))}))};
 const raw={map:JSON.stringify(map),taxonomy:JSON.stringify(taxonomy),semantic:JSON.stringify(semantic)};
 const trusted:TrustedTopicPins={approval_id:'MACHINE-ONLY-'+revision,approval_status:'APPROVED',pack_digest:pack.digest,map_sha256:sha(raw.map),taxonomy_sha256:sha(raw.taxonomy),semantic_sha256:sha(raw.semantic)};
 const bundles=loadReleaseTopicBundles({schema_version:1,approved:[{trusted,bytes:Object.fromEntries(Object.entries(raw).map(([kind,text])=>[kind,Buffer.from(text).toString('base64')])),active:true}]},[pack]);
 return bundles[0]!;
}
export function setup(records:readonly ReleaseTopicBundle[]=[]) {
 release.bundles=records;
 const directory=mkdtempSync(join(tmpdir(),'venus-topic-source-'));temporary.push(directory);const path=join(directory,'revocations.jsonl'),ledger=RevocationLedger.provision(path);
 const c={query:vi.fn(async()=>{throw new Error('Source must use existing Catalog; no direct/nested transaction');})} as unknown as pg.PoolClient;
 const catalog:GameCatalog={active:vi.fn(async()=>records.find(r=>r.active)?.pack??null),assertPinned:vi.fn(async()=>{})};
 return {path,ledger,c,catalog,source:new ReleaseTopicGameSource(catalog,ledger)};
}
export const withdrawal=(card='Q-0001',revision=1)=>({card_id:card,revision,reason_code:'safety' as const,operator_id:'MACHINE-ONLY',at:'2026-10-19T00:00:00Z'});
