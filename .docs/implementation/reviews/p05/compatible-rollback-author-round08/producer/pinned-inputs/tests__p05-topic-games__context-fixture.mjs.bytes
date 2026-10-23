/** P05-CONTEXT-FIXTURE-2. Machine data only; original P03 fixtures stay immutable.
 * Chat is an online transport. A card's required capabilities remain literal,
 * so distinct context variants model verbal in-person and online chat honestly. */
import {syntheticCards,syntheticManifest} from '../p03/fixtures.mjs';
export const p05ContextFixtureProfile='P05-CONTEXT-FIXTURE-2';
export function contextualSyntheticCards(){return syntheticCards().flatMap(original=>{
 const card={...original,pack_id:'venus-p05-context-synthetic',authoring:{...original.authoring,batch_id:p05ContextFixtureProfile,source_notes:'Synthetic P05 context-specific machine fixture only; no human or production approval.'}};
 if(card.interaction!=='pair_private'||!card.meeting_contexts.includes('online')||!card.meeting_contexts.includes('in_person'))return [card];
 const [prefix,number]=card.id.split('-');return [{...card,meeting_contexts:['online']},{...card,id:prefix+'-'+String(Number(number)+1000).padStart(4,'0'),meeting_contexts:['in_person'],required_capabilities:card.required_capabilities.filter(v=>v!=='private_text_chat')}];
});}
export function contextualSyntheticManifest(cards,digest,policyDigest){const {canonical_payload_sha256:oldDigest,...original}=syntheticManifest(cards,digest,policyDigest,2);void oldDigest;const payload={...original,pack_id:'venus-p05-context-synthetic',caveats:[...original.caveats,p05ContextFixtureProfile+'; context variants are one semantic family, not extra distinct content.']};return {...payload,canonical_payload_sha256:digest(payload)};}
export function contextualSyntheticFamilies(cards,digest){const grouped=new Map();for(const c of cards){const [prefix,n]=c.id.split('-'),id=prefix+'-'+String(Number(n)>1000?Number(n)-1000:Number(n)).padStart(4,'0'),family=grouped.get(id)??[];family.push({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction});grouped.set(id,family);}return [...grouped].map(([id,members])=>({semantic_family_id:'context-source-'+id,classification:members.length===1?'IDENTITY_ONLY':'EXPLICIT_FAMILY',mixed_visibility:false,repertoire:'eligible',members}));}
