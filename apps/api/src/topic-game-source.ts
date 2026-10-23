import type pg from 'pg';
import {FrozenPack,FrozenTopicMap,type TopicMapPins} from '@venus/relationship-engine';
import {bundledTopicSources,ownerProvisionalPilot,sameTopicPins,RevocationLedger,type ReleaseTopicBundle} from '@venus/card-catalog';
import type {Catalog,GameCatalog} from './catalog.js';
import type {TopicGameSource} from './topic-games.js';
import {DomainError,requireThat} from './security.js';
import {entryProfile} from './entry-profile.js';
import {canonical} from '@venus/relationship-engine';

/** Release-only production source. Caller holds the existing global shared
 * catalog transaction lock through admission and final enqueue. This class does
 * not open nested transactions, choose room taxonomy migrations or grant consent.
 * Default release registry is empty; no constructor accepts arbitrary maps/packs. */
export class ReleaseTopicGameSource implements TopicGameSource {
 constructor(private readonly catalog:GameCatalog,private readonly ledger:RevocationLedger){}
 private bundle(pins:TopicMapPins):ReleaseTopicBundle {
  const value=bundledTopicSources.find(value=>sameTopicPins(value.map.pins,pins));
  requireThat(value,'TOPIC_SOURCE_BUNDLE_UNAVAILABLE',503);
  requireThat(value.pack instanceof FrozenPack&&!value.pack.synthetic&&!value.map.synthetic&&value.pack.approval_scope==='REVIEWED_RELEASE'&&value.map.approval_scope==='REVIEWED_RELEASE','TOPIC_SOURCE_UNREVIEWED',503);
  FrozenTopicMap.assertVerified(value.map,value.pack);
  requireThat(sameTopicPins(value.map.pins,pins),'TOPIC_SOURCE_PINS_CHANGED',503);return value;
 }
 assertCurrent(pins:TopicMapPins):void {
  const {pack}=this.bundle(pins);let state:ReturnType<RevocationLedger['read']>;
  try {state=this.ledger.read();}catch {throw new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);}
  requireThat(!pack.cards.some(card=>state.entries.some(entry=>entry.withdrawal.card_id===card.id&&entry.withdrawal.revision===card.revision)),
   'CATALOG_WITHDRAWN',503);
 }
 async active(c:pg.PoolClient):Promise<{pack:FrozenPack;map:FrozenTopicMap}|null> {
  const pack=await this.catalog.active(c);if(!pack)return null;
  requireThat(pack instanceof FrozenPack&&!pack.synthetic&&pack.approval_scope==='REVIEWED_RELEASE','TOPIC_SOURCE_UNREVIEWED',503);
  const value=bundledTopicSources.find(value=>value.active&&value.pack===pack);
  if(!value)return null;
  this.assertCurrent(value.map.pins);return Object.freeze({pack:value.pack,map:value.map});
 }
 async pinned(c:pg.PoolClient,pins:TopicMapPins):Promise<{pack:FrozenPack;map:FrozenTopicMap}> {
  const value=this.bundle(pins);await this.catalog.assertPinned(c,value.pack.digest);
  this.assertCurrent(pins);return Object.freeze({pack:value.pack,map:value.map});
 }
}

export type PilotAdmission=Readonly<{deploymentProfile:string|undefined;origin:string;privateTopicsEnabled:boolean}>;
export function pilotAdmissionEnabled(config:PilotAdmission):boolean {
 // Reuse the actual deployment origin validator; no alternative host allowlist.
 const offer=entryProfile(config.deploymentProfile,config.origin);
 return Boolean(offer&&config.deploymentProfile==='local-pilot'&&config.privateTopicsEnabled);
}
/** Normal V2 provider, restricted to the single compiled owner-authorized tuple.
 * The catalog shared lock and both DB/file revocation fences remain authoritative. */
export class OwnerProvisionalTopicGameSource implements TopicGameSource {
 private readonly enabled:boolean;
 constructor(private readonly catalog:GameCatalog,private readonly ledger:RevocationLedger,config:PilotAdmission){this.enabled=pilotAdmissionEnabled(config);}
 private bundle(pins:TopicMapPins) {
  requireThat(this.enabled,'TOPIC_SOURCE_UNAVAILABLE',503);
  const value=ownerProvisionalPilot;
  requireThat(sameTopicPins(value.map.pins,pins),'TOPIC_SOURCE_BUNDLE_UNAVAILABLE',503);
  requireThat(value.pack.approval_scope==='OWNER_PROVISIONAL_LOCAL_PILOT'&&value.map.approval_scope===value.pack.approval_scope&&!value.pack.synthetic&&!value.map.synthetic,'TOPIC_SOURCE_UNREVIEWED',503);
  FrozenTopicMap.assertVerified(value.map,value.pack);return value;
 }
 assertCurrent(pins:TopicMapPins):void {
  const {pack}=this.bundle(pins);let state:ReturnType<RevocationLedger['read']>;
  try{state=this.ledger.read();}catch{throw new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);}
  requireThat(!pack.cards.some(card=>state.entries.some(e=>e.withdrawal.card_id===card.id&&e.withdrawal.revision===card.revision)),'CATALOG_WITHDRAWN',503);
 }
 private async assertStoredIdentity(c:pg.PoolClient) {
  const row=(await c.query<{synthetic:boolean;manifest:unknown}>('SELECT synthetic,manifest FROM game_packs WHERE digest=$1',[ownerProvisionalPilot.pack.digest])).rows[0];
  requireThat(!row||row.synthetic===false&&canonical(row.manifest)===canonical(ownerProvisionalPilot.pack.manifest),'TOPIC_SOURCE_UNREVIEWED',503);
 }
 async active(c:pg.PoolClient) {
  if(!this.enabled)return null;
  const pack=await this.catalog.active(c);if(!pack)return null;
  requireThat(pack===ownerProvisionalPilot.pack,'TOPIC_SOURCE_UNREVIEWED',503);
  await this.assertStoredIdentity(c);this.assertCurrent(ownerProvisionalPilot.map.pins);return {pack,map:ownerProvisionalPilot.map};
 }
 async pinned(c:pg.PoolClient,pins:TopicMapPins) {
  const value=this.bundle(pins);await this.catalog.assertPinned(c,value.pack.digest);
  await this.assertStoredIdentity(c);this.assertCurrent(pins);return {pack:value.pack,map:value.map};
 }
}
/** Legacy Games cannot restore draft manifests as reviewed releases. Keep its
 * admission on reviewed packs; pinned withdrawal checks are still delegated. */
export function legacyReleaseCatalog(catalog:GameCatalog):GameCatalog {
 return {active:async c=>{const pack=await catalog.active(c);return pack?.approval_scope==='REVIEWED_RELEASE'?pack:null;},assertPinned:(c,digest)=>catalog.assertPinned(c,digest)};
}
/** A one-time fresh-install convenience, using the normal catalog CAS. A used,
 * withdrawn or restored null pointer is never reactivated by startup. */
export async function bootstrapPilotCatalog(catalog:Catalog):Promise<'ACTIVATED_FRESH'|'UNCHANGED'> {
 const fresh=await catalog.rooms.transaction(async c=>{
  const row=(await c.query<{active_digest:string|null;generation:string;used:boolean}>(`SELECT active_digest,generation,
   (EXISTS(SELECT 1 FROM venus_catalog_events) OR EXISTS(SELECT 1 FROM rooms) OR EXISTS(SELECT 1 FROM game_sessions) OR EXISTS(SELECT 1 FROM game_packs)) AS used
   FROM venus_catalog_state WHERE singleton=true`)).rows[0];
  requireThat(row,'CATALOG_UNAVAILABLE',503);return row.active_digest===null&&row.generation==='0'&&!row.used;
 },'exclusive');
 if(!fresh)return 'UNCHANGED';
 await catalog.activate(ownerProvisionalPilot.pack.digest,'0','owner-provisional-local-pilot-bootstrap');return 'ACTIVATED_FRESH';
}
