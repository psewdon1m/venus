/** Read-only V2 semantic option counter. Never feeds the sampler. */
import assert from 'node:assert/strict';
const key=actors=>[...actors].sort().join(':');
export const emptyStage=()=>({rounds:0,pair_offers:0,private_opportunities:0,private_playable:0,private_safe_empty:0,min_comfort_histogram:{0:0,1:0,2:0,3:0,4:0},interactions:{group:0,solo:0,pair_public:0,pair_private:0},private_eligible_before_cap:0,private_eligible_after_cap:0,private_options_before_cap_sum:0,private_options_after_cap_sum:0,anti_repeat:{decisions_with_unused_alternative:0,private_choices_with_alternative:0,violations:0,same_pair_no_alternative_exceptions:0}});
export function stageTable(){return Array.from({length:7},(_,i)=>i+2).flatMap(size=>['questions','truth_or_dare','yes_but'].flatMap(mode=>['online','in_person'].flatMap(context=>[1,2,3,4].map(stage=>({size,mode,context,stage,...emptyStage()})))));}
export function optionCounter(env,snapshot){
 const {pack,map,engine:e}=env,s=snapshot.baseline,cache=new Map();
 const blocked=(card,rows)=>rows.some(row=>row.card_id===card.id||map.entry(row.card_id).semantic_family_ids.some(id=>map.entry(card.id).semantic_family_ids.includes(id)));
 const baseline=stage=>{
  if(cache.has(stage))return cache.get(stage);const options=[];
  if(s.capabilities.includes('private_text_chat'))for(let a=0;a<s.players.length;a++)for(let b=a+1;b<s.players.length;b++){
   const p=s.players[a],q=s.players[b],resolved=e.resolvePair(p,q);if(resolved.pairClass==='X')continue;
   const actors=resolved.initiator===q.id?[q.id,p.id]:[p.id,q.id],cards=pack.cards.filter(c=>c.mode===s.mode&&c.interaction==='pair_private'&&map.allowed(c)&&e.eligible(c,s,actors,stage));
   if(cards.length&&cards.filter(c=>c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away).length>=Math.ceil(.25*s.total_rounds))options.push({actors,cards});
  }
  cache.set(stage,options);return options;
 };
 return {record(prior,round,row,safety){
  const sessionIds=new Set(prior.private_history.filter(row=>row.session_id===s.session_id).map(row=>row.card_id));
  const before=baseline(round.stage).filter(option=>option.cards.some(card=>!sessionIds.has(card.id)&&!blocked(card,prior.public_history)&&!blocked(card,prior.private_history.filter(r=>key(r.actors)===key(option.actors)))&&option.actors.every(id=>{const m=safety.members.find(v=>v.member_id===id);return m&&map.entry(card.id).topic_ids.every(t=>m.allow_topic_ids.includes(t)&&!m.excluded_topic_ids.includes(t));})));
  const after=prior.rounds.filter(r=>r.interaction==='pair_private').length<Math.ceil(.25*s.total_rounds)?before:[],previous=prior.rounds.findLast(r=>r.interaction==='pair_private')??prior.private_history.at(-1),alternative=previous&&after.some(option=>key(option.actors)!==key(previous.actors));
  row.private_eligible_before_cap+=Number(before.length>0);row.private_eligible_after_cap+=Number(after.length>0);row.private_options_before_cap_sum+=before.length;row.private_options_after_cap_sum+=after.length;
  if(alternative)row.anti_repeat.decisions_with_unused_alternative++;
  if(round.interaction==='pair_private'){
   if(alternative){row.anti_repeat.private_choices_with_alternative++;if(key(round.actors)===key(previous.actors))row.anti_repeat.violations++;assert.notEqual(key(round.actors),key(previous.actors),'private pair repeat despite eligible alternative');}
   else if(previous&&key(round.actors)===key(previous.actors)&&after.some(o=>key(o.actors)===key(round.actors)))row.anti_repeat.same_pair_no_alternative_exceptions++;
  }
  return {before:before.length,after:after.length,alternative:!!alternative};
 }};
}
