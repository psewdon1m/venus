/** Machine fixtures only; additive P05 in-person baselines do not mutate accepted P03/P04 fixtures. */
/* global structuredClone */
import {FrozenPack,digest,policyDigest} from '../../packages/relationship-engine/dist/index.js';
import {syntheticCards,syntheticManifest} from '../p03/fixtures.mjs';
export function p05Cards(){
  const source=syntheticCards(),cards=source.filter(card=>Number(card.id.split('-')[1])<=15||Number(card.id.split('-')[1])>100);
  for(const [mode,prefix] of [['questions','Q'],['truth_or_dare','TD'],['yes_but','YB']]){
    const original=source.find(card=>card.mode===mode&&card.interaction==='pair_private'&&card.min_comfort===1&&card.relationship_scope==='friend_or_more');
    for(let index=1;index<=25;index++){
      const card=structuredClone(original);card.id=prefix+'-'+String(5000+index);card.meeting_contexts=['in_person'];card.required_capabilities=[];card.requires_physical_contact=false;card.requires_going_away=false;card.safety_tags=['neutral','private'];
      for(const [locale,fields] of Object.entries(card.text))for(const key of Object.keys(fields))fields[key]=`SYNTHETIC ${locale.toUpperCase()} P05 IP ${card.id}: neutral optional conversation {P1}, {P2}.`;
      card.authoring.batch_id='P05-IP-SYNTHETIC-FIXTURE';card.authoring.source_notes='Machine-only in-person baseline; no physical contact, going away, chat or human review.';cards.push(card);
    }
  }
  return cards;
}
export function p05Pack(){const cards=p05Cards();return FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);}
