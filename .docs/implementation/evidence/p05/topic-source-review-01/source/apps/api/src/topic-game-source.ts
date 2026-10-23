import type pg from 'pg';
import {FrozenPack,FrozenTopicMap,type TopicMapPins} from '@venus/relationship-engine';
import {bundledTopicSources,sameTopicPins,RevocationLedger,type ReleaseTopicBundle} from '@venus/card-catalog';
import type {GameCatalog} from './catalog.js';
import type {TopicGameSource} from './topic-games.js';
import {DomainError,requireThat} from './security.js';

/** Release-only production source. Caller holds the existing global shared
 * catalog transaction lock through admission and final enqueue. This class does
 * not open nested transactions, choose room taxonomy migrations or grant consent.
 * Default release registry is empty; no constructor accepts arbitrary maps/packs. */
export class ReleaseTopicGameSource implements TopicGameSource {
 constructor(private readonly catalog:GameCatalog,private readonly ledger:RevocationLedger){}
 private bundle(pins:TopicMapPins):ReleaseTopicBundle {
  const value=bundledTopicSources.find(value=>sameTopicPins(value.map.pins,pins));
  requireThat(value,'TOPIC_SOURCE_BUNDLE_UNAVAILABLE',503);
  requireThat(value.pack instanceof FrozenPack&&!value.pack.synthetic&&!value.map.synthetic,'TOPIC_SOURCE_UNREVIEWED',503);
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
  requireThat(pack instanceof FrozenPack&&!pack.synthetic,'TOPIC_SOURCE_UNREVIEWED',503);
  const value=bundledTopicSources.find(value=>value.active&&value.pack===pack);
  if(!value)return null;
  this.assertCurrent(value.map.pins);return Object.freeze({pack:value.pack,map:value.map});
 }
 async pinned(c:pg.PoolClient,pins:TopicMapPins):Promise<{pack:FrozenPack;map:FrozenTopicMap}> {
  const value=this.bundle(pins);await this.catalog.assertPinned(c,value.pack.digest);
  this.assertCurrent(pins);return Object.freeze({pack:value.pack,map:value.map});
 }
}
