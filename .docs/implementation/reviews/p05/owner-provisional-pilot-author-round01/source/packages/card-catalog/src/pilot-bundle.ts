import {createHash} from 'node:crypto';
import {FrozenPack,FrozenTopicMap,canonical,digest,ownerProvisionalCapability,type PackManifest} from '@venus/relationship-engine';
import registry from './owner-provisional-pilot.json' with {type:'json'};
import {requireCatalog} from './catalog.js';
const registryDigest='313990feaa17153b4325d0e6d051a539ff926e38dd1e2764cd592070aea1f720';
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
/** Authentication is the compiled exact owner-grant tuple, never user-provided
 * paths, keys or approval labels. Exported for offline tamper validation only. */
export function loadOwnerProvisionalPilot(input:unknown) {
 requireCatalog(digest(input)===registryDigest,'PILOT_REGISTRY_MISMATCH');
 const value=input as typeof registry,grant=value.grant;
 const decode=(text:string)=>{const bytes=Buffer.from(text,'base64');requireCatalog(bytes.toString('base64')===text,'PILOT_BYTES_INVALID');return bytes;};
 const bytes={manifest:decode(value.bytes.manifest),map:decode(value.bytes.map),taxonomy:decode(value.bytes.taxonomy),semantic:decode(value.bytes.semantic)};
 for(const key of ['manifest','map','taxonomy','semantic'] as const)requireCatalog(sha(bytes[key])===grant.bytes_sha256[key],'PILOT_BYTES_MISMATCH');
 const cards=value.cards.map(text=>{const raw=decode(text),card=JSON.parse(raw.toString('utf8')) as {id:string};
  requireCatalog(sha(raw)===grant.card_raw_sha256[card.id as keyof typeof grant.card_raw_sha256],'PILOT_CARD_MISMATCH');return card;});
 requireCatalog(cards.length===470&&new Set(cards.map(c=>c.id)).size===470,'PILOT_CARD_COUNT');
 const authority=ownerProvisionalCapability('local-pilot',{decision_id:'U-019',decision_sha256:grant.references['.docs/implementation/user-decisions.v4.json'],
  grant_sha256:digest(grant),pack_digest:grant.pack_digest,map_sha256:grant.bytes_sha256.map,taxonomy_sha256:grant.bytes_sha256.taxonomy,semantic_sha256:grant.bytes_sha256.semantic});
 const pack=FrozenPack.ownerProvisional(cards,JSON.parse(bytes.manifest.toString('utf8')) as PackManifest,authority);
 const map=FrozenTopicMap.ownerProvisional({map:bytes.map,taxonomy:bytes.taxonomy,semantic:bytes.semantic},pack,authority);
 requireCatalog(canonical(pack.owner_provisional)===canonical(map.owner_provisional),'PILOT_AUTHORITY_MISMATCH');
 return Object.freeze({pack,map,active:true as const,approval_scope:'OWNER_PROVISIONAL_LOCAL_PILOT' as const});
}
/** Loading validates metadata but does not authorize deployment/admission. */
export const ownerProvisionalPilot=loadOwnerProvisionalPilot(registry);
