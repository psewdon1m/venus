import assert from 'node:assert/strict';
import {digest} from '../../packages/relationship-engine/dist/index.js';
import {hardEligible,certificate,pairKey} from '../p05-topic-measurements/support.mjs';
export function sessionDiagnostics(session){
 const snapshotHash=digest(session.snapshot),seen=new Set(),violations=[],counters={hard_card_checks:0,private_rounds:0,empty_private:0,strict_anti_repeat_checks:0,strict_anti_repeat_violations:0,no_effective_alternative_exceptions:0,prior_content_diagnostic_checks:0},stages={};
 const entry=new Map(session.f.map.entries.map(e=>[e.card_id,e]));
 const fail=(code,details={})=>{violations.push({code,...details});throw Error(code);};
 function semantic(history){for(const [visibility,records]of [['public',history.public_history],['private',history.private_history]]){const used=new Map();for(const row of records){const key=visibility==='private'?pairKey(row.actors):'room-public',families=used.get(key)??new Set();for(const family of entry.get(row.card_id).semantic_family_ids){if(families.has(family))fail('SEMANTIC_REPEAT',{visibility,scope:key,family});families.add(family);}used.set(key,families);}}}
 return{violations,counters,stages,
  async check(_s,{data}){
   const p=data.plan,s=session.snapshot.baseline,h=session.history;assert.equal(digest(session.snapshot),snapshotHash,'IMMUTABLE_SNAPSHOT_CHANGED');assert.equal(p.stage,Math.min(4,1+Math.floor(4*(p.round_index-1)/Math.max(1,s.total_rounds-1))),'STAGE_MISMATCH');assert(h.rounds.filter(r=>r.interaction==='pair_private').length<=Math.ceil(.25*s.total_rounds),'PRIVATE_BUDGET');assert(p.attempts.length<=3,'PRIVATE_ATTEMPT_LIMIT');
   if(p.card){const card=session.f.pack.card(p.card.card_id);counters.hard_card_checks++;assert(hardEligible(card,session.snapshot,p.actors,p.stage),'HARD_GUARD_VIOLATION');assert(!session.f.map.excluded_card_ids.includes(card.id),'MIXED_QUARANTINE_SELECTED');if(p.interaction==='pair_private'){const topic=entry.get(card.id).topic_ids;assert(topic.every(t=>p.actors.every(id=>{const m=session.safety.members.find(m=>m.member_id===id);return m.allow_topic_ids.includes(t)&&!m.excluded_topic_ids.includes(t);})),'FULL_TOPIC_UNION_VIOLATION');}}
   semantic(h);if(seen.has(p.round_id))return;seen.add(p.round_id);
   const before={...h,rounds:h.rounds.slice(0,-1),public_history:h.public_history.filter(r=>r.session_id!==h.session_id||r.round_id!==p.round_id),private_history:h.private_history.filter(r=>r.session_id!==h.session_id||r.round_id!==p.round_id)},stage=stages[p.stage]??={rounds:0,private_eligible_after_cap:0,private_selected:0,empty_selected:0};stage.rounds++;
   let available=[];if(before.rounds.filter(r=>r.interaction==='pair_private').length<Math.ceil(.25*s.total_rounds))for(let a=0;a<s.players.length;a++)for(let b=a+1;b<s.players.length;b++){
    const actors=[s.players[a].id,s.players[b].id],c=certificate(session.f,session.snapshot,before,session.safety,actors,p.stage);if(c.baseline_common>=Math.ceil(.25*s.total_rounds)){stage.private_eligible_after_cap++;if(c.after_targeted_topics.length)available.push(pairKey(actors));}
   }
   if(p.interaction==='pair_private'){counters.private_rounds++;stage.private_selected++;if(!p.card){counters.empty_private++;stage.empty_selected++;}const previous=before.rounds.findLast(r=>r.interaction==='pair_private');if(previous){counters.strict_anti_repeat_checks++;if(available.some(key=>key!==pairKey(previous.actors))){if(pairKey(p.actors)===pairKey(previous.actors)){counters.strict_anti_repeat_violations++;fail('STRICT_CURRENT_SESSION_PAIR_REPEAT',{round:p.round_index});}}else counters.no_effective_alternative_exceptions++;}if(before.private_history.length)counters.prior_content_diagnostic_checks++;}
  },
  finish(){return{status:violations.length?'FAIL':'PASS',scope:'ACTUAL_MUTATOR_PURE_MODEL_WITH_INDEPENDENT_CARD_TOPIC_SEMANTIC_AR_ORACLE_NOT_RUNTIME_AUTHORITY',counters,stages,violations,runtime_evidence_required:['actual authentication/ACL/host denial','presence/expiry/source/finalawait fences','close/restore/externalledger','approved450 human review'],I14_close_runtime_not_inferred:true};}
 };
}
