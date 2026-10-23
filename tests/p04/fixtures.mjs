/** Isolated runtime fixture, no real human approval. Not included in OCI. */
import {syntheticCards,syntheticManifest} from '../p03/fixtures.mjs';
import {FrozenPack,digest,policyDigest} from '../../packages/relationship-engine/dist/index.js';
export function testPacks() {
  const cards=syntheticCards().filter(card=>Number(card.id.split('-')[1])<=15||Number(card.id.split('-')[1])>100);
  for(const card of cards) if(card.interaction==='pair_private') {card.meeting_contexts=['in_person'];card.required_capabilities=[];}
  const revised=JSON.parse(JSON.stringify(cards));for(const card of revised) {card.revision=2;for(const text of Object.values(card.text)) for(const key of Object.keys(text)) text[key]+=' P04 synthetic revision2';}
  return [FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true),FrozenPack.load(revised,syntheticManifest(revised,digest,policyDigest,2),true)];
}
