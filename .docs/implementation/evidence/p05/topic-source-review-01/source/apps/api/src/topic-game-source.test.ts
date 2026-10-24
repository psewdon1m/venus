import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type pg from 'pg';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {FrozenPack,digest,policyDigest,type Card,type TopicMapPins,type TrustedTopicPins} from '@venus/relationship-engine';
import {RevocationLedger,loadReleaseTopicBundles,type ReleaseTopicBundle} from '@venus/card-catalog';
import {syntheticCards,syntheticManifest} from '../../../tests/p03/fixtures.mjs';
import {ReleaseTopicGameSource} from './topic-game-source.js';
import type {GameCatalog} from './catalog.js';

// Test module isolation only. The production constructor has no bundle argument,
// no allowSynthetic flag and no dependency on this test-only mutable registry.
const release=vi.hoisted(()=>({bundles:[] as readonly import('@venus/card-catalog').ReleaseTopicBundle[]}));
vi.mock('@venus/card-catalog',async importOriginal=>{const actual=await importOriginal<typeof import('@venus/card-catalog')>();return {...actual,get bundledTopicSources(){return release.bundles;}};});
const temporary:string[]=[];
afterEach(()=>{release.bundles=[];for(const directory of temporary.splice(0))rmSync(directory,{recursive:true,force:true});});
const sha=(raw:string)=>createHash('sha256').update(raw).digest('hex');
function fixture(revision='1',excluded:readonly string[]=[]) {
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
function setup(records:readonly ReleaseTopicBundle[]=[]) {
 release.bundles=records;
 const directory=mkdtempSync(join(tmpdir(),'venus-topic-source-'));temporary.push(directory);const path=join(directory,'revocations.jsonl'),ledger=RevocationLedger.provision(path);
 const c={query:vi.fn(async()=>{throw new Error('Source must use existing Catalog; no direct/nested transaction');})} as unknown as pg.PoolClient;
 const catalog:GameCatalog={active:vi.fn(async()=>records.find(r=>r.active)?.pack??null),assertPinned:vi.fn(async()=>{})};
 return {path,ledger,c,catalog,source:new ReleaseTopicGameSource(catalog,ledger)};
}
const withdrawal=(card='Q-0001',revision=1)=>({card_id:card,revision,reason_code:'safety' as const,operator_id:'MACHINE-ONLY',at:'2026-10-19T00:00:00Z'});
describe('release topic source actual catalog and protected ledger boundary',()=>{
 it('defaults to unavailable with an empty release registry and never opens a nested transaction',async()=>{
  const f=setup();expect(await f.source.active(f.c)).toBeNull();expect(f.catalog.active).toHaveBeenCalledWith(f.c);expect(f.c.query).not.toHaveBeenCalled();
  const unknown=fixture();expect(()=>f.source.assertCurrent(unknown.map.pins)).toThrow('Request could not be completed');
  await expect(f.source.pinned(f.c,unknown.map.pins)).rejects.toMatchObject({code:'TOPIC_SOURCE_BUNDLE_UNAVAILABLE',statusCode:503});
 });
 it('gets the actual active catalog pack then performs the synchronous ledger fence',async()=>{
  const record=fixture(),f=setup([record]);const view=await f.source.active(f.c);
  expect(view).toEqual({pack:record.pack,map:record.map});expect(Object.isFrozen(view)).toBe(true);expect(f.catalog.active).toHaveBeenCalledOnce();expect(f.c.query).not.toHaveBeenCalled();
 });
 it('returns no new-start map when the actual catalog is inactive or only a historical map exists',async()=>{
  const record=fixture(),f=setup([{...record,active:false}]);vi.mocked(f.catalog.active).mockResolvedValue(record.pack);
  expect(await f.source.active(f.c)).toBeNull();vi.mocked(f.catalog.active).mockResolvedValue(null);expect(await f.source.active(f.c)).toBeNull();
 });
 it('retains exact old map pins without upgrading to the new active taxonomy',async()=>{
  const old=fixture('OLD'),newer=fixture('NEW'),f=setup([{...old,active:false},newer]);
  const pinned=await f.source.pinned(f.c,old.map.pins);expect(pinned.map.pins.taxonomy_revision).toBe('MACHINE-TAX-OLD');
  expect(f.catalog.assertPinned).toHaveBeenCalledWith(f.c,old.pack.digest);expect((await f.source.active(f.c))!.map).toBe(newer.map);
 });
 it('denies catalog inconsistency/errors without falling back to a remembered pack',async()=>{
  const record=fixture(),f=setup([record]);vi.mocked(f.catalog.active).mockRejectedValue(new Error('CATALOG_RECONCILIATION_REQUIRED'));
  await expect(f.source.active(f.c)).rejects.toThrow('RECONCILIATION');
  vi.mocked(f.catalog.assertPinned).mockRejectedValue(new Error('CATALOG_WITHDRAWN'));await expect(f.source.pinned(f.c,record.map.pins)).rejects.toThrow('WITHDRAWN');
 });
 it('requires every exact pin, rejects extra fields and never resolves historical pins by pack digest alone',async()=>{
  const record=fixture(),f=setup([record]);
  for(const patch of [{map_revision:'changed'},{taxonomy_sha256:'0'.repeat(64)},{semantic_revision:'changed'},{repertoire_digest:'0'.repeat(64)},{extra:true}]){
   const pins={...record.map.pins,...patch} as TopicMapPins;expect(()=>f.source.assertCurrent(pins)).toThrow();await expect(f.source.pinned(f.c,pins)).rejects.toMatchObject({code:'TOPIC_SOURCE_BUNDLE_UNAVAILABLE'});
  }
  expect(f.catalog.assertPinned).not.toHaveBeenCalled();
 });
 it('withdraws the whole pack when any exact card revision is withdrawn',async()=>{
  const record=fixture(),f=setup([record]);f.ledger.append(withdrawal('Q-0104'));
  expect(()=>f.source.assertCurrent(record.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_WITHDRAWN'}));
  await expect(f.source.active(f.c)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});await expect(f.source.pinned(f.c,record.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 });
 it('does not confuse a different card revision withdrawal with the pinned revision',async()=>{
  const record=fixture(),f=setup([record]);f.ledger.append(withdrawal('Q-0001',2));expect(()=>f.source.assertCurrent(record.map.pins)).not.toThrow();expect(await f.source.pinned(f.c,record.map.pins)).toEqual({pack:record.pack,map:record.map});
 });
 it('withdraws the entire pack even if the withdrawn card is excluded from the mapped repertoire',async()=>{
  const record=fixture('EXCLUDED',['Q-0104']),f=setup([record]);expect(record.map.excluded_card_ids).toContain('Q-0104');
  f.ledger.append(withdrawal('Q-0104'));expect(()=>f.source.assertCurrent(record.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_WITHDRAWN'}));
  await expect(f.source.pinned(f.c,record.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 });
 it('observes a new withdrawal in the final sync fence after catalog active awaits',async()=>{
  const record=fixture(),f=setup([record]);vi.mocked(f.catalog.active).mockImplementation(async()=>{f.ledger.append(withdrawal());return record.pack;});
  await expect(f.source.active(f.c)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 });
 it('observes a new withdrawal in the final sync fence after assertPinned awaits',async()=>{
  const record=fixture(),f=setup([record]);vi.mocked(f.catalog.assertPinned).mockImplementation(async()=>{f.ledger.append(withdrawal());});
  await expect(f.source.pinned(f.c,record.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 });
 it('rereads the actual file at every final delivery fence',()=>{
  const record=fixture(),f=setup([record]);f.source.assertCurrent(record.map.pins);f.ledger.append(withdrawal());
  expect(()=>f.source.assertCurrent(record.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_WITHDRAWN'}));
 });
 for(const damage of ['missing','partial','corrupt','regressed'])it('denies '+damage+' ledger instead of stale content',async()=>{
  const record=fixture(),f=setup([record]);const original=readFileSync(f.path);
  if(damage==='missing')unlinkSync(f.path);
  if(damage==='partial')writeFileSync(f.path,'{');
  if(damage==='corrupt')writeFileSync(f.path,'{"seq":1}\n');
  if(damage==='regressed'){f.ledger.append(withdrawal('Q-9999'));writeFileSync(f.path,original);}
  expect(()=>f.source.assertCurrent(record.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_LEDGER_UNAVAILABLE',statusCode:503}));
  await expect(f.source.pinned(f.c,record.map.pins)).rejects.toMatchObject({code:'CATALOG_LEDGER_UNAVAILABLE'});
 });
 it('rejects synthetic active packs even when a catalog interface incorrectly returns one',async()=>{
  const cards=syntheticCards().slice(0,2),pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true),f=setup();
  vi.mocked(f.catalog.active).mockResolvedValue(pack);await expect(f.source.active(f.c)).rejects.toMatchObject({code:'TOPIC_SOURCE_UNREVIEWED'});
 });
 it('does not trust forged maps inserted by a test dependency instead of the immutable release loader',()=>{
  const record=fixture(),f=setup([{...record,map:{...record.map} as typeof record.map}]);expect(()=>f.source.assertCurrent(record.map.pins)).toThrow('UNVERIFIED');
 });
});
