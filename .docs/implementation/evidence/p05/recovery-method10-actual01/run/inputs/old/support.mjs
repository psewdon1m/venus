/** Independent explicit predicates; never call selector eligibility/options helpers. */
import {policy} from './profiles.mjs';
import {createHash} from 'node:crypto';
const classes=['X','J','F','G','M','S','R'];
const lookup=new WeakMap();
export const pairKey=ids=>ids.slice().sort().join(':');
export function hardEligible(card,snapshot,actors,stage){
 const s=snapshot.baseline??snapshot,selected=s.players.filter(p=>actors.includes(p.id)),pair=card.interaction.startsWith('pair_'),privatePair=card.interaction==='pair_private';
 if(card.mode!==s.mode||!card.meeting_contexts.includes(s.context)||card.min_progression_stage>stage||!card.required_capabilities.every(c=>s.capabilities.includes(c)))return false;
 if(new Set(actors).size!==actors.length||actors.length!==(pair?2:card.interaction==='solo'?1:0)||selected.length!==actors.length)return false;
 if(!(card.interaction==='group'?s.players:selected).every(p=>p.comfort>=card.min_comfort))return false;
 if(s.context==='online'&&(card.requires_physical_contact||card.requires_going_away))return false;
 if(card.requires_physical_contact&&(card.min_comfort!==4||card.consent!=='bilateral'||stage<3))return false;
 if(privatePair&&(stage<3||card.min_comfort<1||card.consent!=='bilateral'||s.context==='online'&&!s.capabilities.includes('private_text_chat')))return false;
 if(!privatePair&&(card.min_comfort!==0||!['none','acquaintance'].includes(card.relationship_scope)||card.requires_physical_contact||card.requires_going_away))return false;
 if(pair){const a=selected[0],b=selected[1],cl=policy.pair_class_matrix[a.edges[b.id]?.relation??'friendship'][b.edges[a.id]?.relation??'friendship'];if(cl==='X'||classes.indexOf(cl)<classes.indexOf(policy.relationship_scope_min_class[card.relationship_scope]))return false;}
 else if(card.relationship_scope!=='none')return false;
 return true;
}
export function certificate(f,snapshot,history,safety,actors,stage,requested=[]){
 let cached=lookup.get(f);if(!cached){cached={entry:new Map(f.map.entries.map(e=>[e.card_id,e])),excluded:new Set(f.map.excluded_card_ids)};lookup.set(f,cached);}const {entry,excluded}=cached,pub=new Set(history.public_history.flatMap(r=>entry.get(r.card_id).semantic_family_ids)),priv=new Set(history.private_history.filter(r=>pairKey(r.actors)===pairKey(actors)).flatMap(r=>entry.get(r.card_id).semantic_family_ids)),members=actors.map(id=>safety.members.find(m=>m.member_id===id));
 const raw=f.pack.cards.filter(c=>c.mode===snapshot.baseline.mode&&c.interaction==='pair_private'),quarantine=raw.filter(c=>!excluded.has(c.id)),hard=quarantine.filter(c=>hardEligible(c,snapshot,actors,stage)),topic=hard.filter(c=>entry.get(c.id).topic_ids.every(t=>members.every(m=>m.allow_topic_ids.includes(t)&&!m.excluded_topic_ids.includes(t)))),noPublic=topic.filter(c=>entry.get(c.id).semantic_family_ids.every(t=>!pub.has(t))),noPrivate=noPublic.filter(c=>entry.get(c.id).semantic_family_ids.every(t=>!priv.has(t))),target=noPrivate.filter(c=>requested.every(t=>entry.get(c.id).topic_ids.includes(t)));
 const families=[...new Set(target.flatMap(c=>entry.get(c.id).semantic_family_ids))].sort(),opportunities=history.rounds.filter(r=>r.interaction==='pair_private').length,remaining=Math.max(0,Math.ceil(.25*snapshot.baseline.total_rounds)-opportunities),last=history.rounds.at(-1),currentSlots=last?.interaction==='pair_private'?3-last.attempts.length:0;
 return{baseline_raw_card_ids:raw.map(c=>c.id),after_whole_family_quarantine:quarantine.map(c=>c.id),after_context_class_comfort_capability:hard.map(c=>c.id),after_full_union_allow_exclude:topic.map(c=>c.id),after_room_public_semantic_history:noPublic.map(c=>c.id),after_same_pair_private_semantic_history:noPrivate.map(c=>c.id),after_targeted_topics:target.map(c=>c.id),distinct_residual_family_ids:families,sorted_family_sha256:createHash('sha256').update(JSON.stringify(families)).digest('hex'),remaining_private_opportunities:remaining,remaining_candidate_attempt_budget:3*remaining+currentSlots,baseline_common:hard.filter(c=>c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away).length};
}
