/** Excluded fixture observation oracles. Never mutate product/auth/state. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function offeredTopics(stored,map){
 assert.equal(stored?.schema_version,2);assert(stored.state?.offer);assert(Array.isArray(stored.bindings));
 const binding=stored.bindings.find(b=>b.candidate_ref===stored.state.offer.candidate_ref);assert(binding,'Current offer binding required');
 const ids=map.entry(binding.card_id).topic_ids;assert(ids.length>0);assert.equal(new Set(ids).size,ids.length);
 const topics=map.topics.filter(t=>ids.includes(t.topic_id));assert.equal(topics.length,ids.length,'Every offered topic needs the pinned taxonomy label');return topics;
}
export function expectedOfferLabels(view,topics,locale){
 assert(view?.offer);const expected=topics.map(t=>({topic_id:t.topic_id,label:t.labels[locale]}));assert(expected.every(t=>typeof t.label==='string'&&t.label.length>0));
 assert.deepEqual(view.offer.topics,expected,'Projection must expose the full pinned topic union');return expected.map(t=>t.label);
}
export const conversationPath=s=>`/api/v2/rooms/${s.room}/game/${s.session}/round/${s.round}/conversation`;
export function privatePayloadMetadata(path,status,bytes,selection){
 if(!selection||path!==conversationPath(selection)||status!==200)return null;
 let view;try{view=JSON.parse(bytes.toString('utf8'));}catch{return null;}
 if(view.schema_version!==2||view.room_id!==selection.room||view.session_id!==selection.session||view.round_id!==selection.round||view.conversation_id!==selection.conversation||view.epoch!==selection.epoch||view.state!=='active'||typeof view.prompt?.text!=='string'||!view.prompt.text.includes('SYNTHETIC '))return null;
 return {payload_kind:'private_conversation',private_payload:true,status,epoch:view.epoch,body_sha256:createHash('sha256').update(bytes).digest('hex')};
}
export function coherentRound(f,view,expected={}){
 if(!f?.plan||!f.data||!view?.current_round)return false;
 const r=view.current_round;
 return f.session===view.session_id&&f.game_rev===view.game_rev&&f.game_state===view.state&&f.current_round===r.round_index&&f.plan.round_id===r.round_id&&f.plan.round_index===r.round_index&&f.data.state===r.state&&(!expected.session||f.session===expected.session)&&(!expected.round||r.round_id===expected.round)&&(!expected.index||r.round_index===expected.index)&&(expected.minRev===undefined||view.game_rev>=expected.minRev);
}
export function uiRoundMatches(observed,f){return Boolean(observed&&observed.session_id===f.session&&observed.round_id===f.plan.round_id&&observed.round_index===f.plan.round_index&&observed.game_rev>=f.game_rev);}
