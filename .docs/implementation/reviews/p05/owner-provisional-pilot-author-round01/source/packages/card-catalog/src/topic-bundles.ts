import {FrozenPack,FrozenTopicMap,canonical,type TopicMapPins,type TrustedTopicPins} from '@venus/relationship-engine';
import registry from './approved-topic-bundles.json' with {type:'json'};
import {bundledPacks} from './bundles.js';
import {requireCatalog} from './catalog.js';

export type ReleaseTopicBundle=Readonly<{pack:FrozenPack;map:FrozenTopicMap;active:boolean}>;
const exact=(value:unknown,names:readonly string[]):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)
 &&Object.keys(value).sort().join(',')===[...names].sort().join(','));
function raw(value:unknown):Buffer {
 requireCatalog(typeof value==='string'&&value.length>0&&value.length<=Math.ceil(8*1024*1024/3)*4,'CATALOG_TOPIC_BYTES_INVALID');
 const result=Buffer.from(value as string,'base64');
 requireCatalog(result.length>0&&result.length<=8*1024*1024&&result.toString('base64')===value,'CATALOG_TOPIC_BYTES_INVALID');return result;
}
/** Offline release validation. authorizedPacks is the reviewed release registry,
 * not a consumer input. Runtime uses ONLY bundledTopicSources below; no endpoint,
 * environment path or URL is accepted, and no synthetic bypass exists here. */
export function loadReleaseTopicBundles(input:unknown,authorizedPacks:readonly FrozenPack[]):readonly ReleaseTopicBundle[] {
 requireCatalog(exact(input,['schema_version','approved'])&&input.schema_version===1&&Array.isArray(input.approved)
  &&input.approved.length<=128,'CATALOG_TOPIC_REGISTRY_INVALID');
 requireCatalog(authorizedPacks.every(pack=>pack instanceof FrozenPack&&!pack.synthetic&&pack.approval_scope==='REVIEWED_RELEASE')
  &&new Set(authorizedPacks.map(pack=>pack.digest)).size===authorizedPacks.length,'CATALOG_TOPIC_PACK_REGISTRY_INVALID');
 const tuples=new Set<string>(),activePacks=new Set<string>();
 const output=input.approved.map((entry:unknown)=>{
  requireCatalog(exact(entry,['trusted','bytes','active'])&&typeof entry.active==='boolean'
   &&exact(entry.bytes,['map','taxonomy','semantic']),'CATALOG_TOPIC_REGISTRY_INVALID');
  const trusted=entry.trusted as TrustedTopicPins;
  const pack=authorizedPacks.find(pack=>pack.digest===trusted?.pack_digest);
  requireCatalog(pack,'CATALOG_TOPIC_PACK_UNAVAILABLE');
  const map=FrozenTopicMap.load({map:raw(entry.bytes.map),taxonomy:raw(entry.bytes.taxonomy),semantic:raw(entry.bytes.semantic)},pack,trusted);
  const key=canonical(map.pins);
  requireCatalog(!tuples.has(key),'CATALOG_TOPIC_BUNDLE_DUPLICATE');tuples.add(key);
  requireCatalog(!entry.active||!activePacks.has(pack.digest),'CATALOG_TOPIC_ACTIVE_AMBIGUOUS');
  if(entry.active)activePacks.add(pack.digest);
  return Object.freeze({pack,map,active:entry.active});
 });
 return Object.freeze(output);
}
/** Retain historical inactive exact pin tuples for pinned sessions and rollback.
 * Empty until genuine owner approval and reviewed pack/map records are released.
 * This release list is never refreshed from disk/network during serving. */
export const bundledTopicSources=loadReleaseTopicBundles(registry,bundledPacks);
export function sameTopicPins(left:TopicMapPins,right:TopicMapPins):boolean {return canonical(left)===canonical(right);}
