/** Test-only observers. Delegate real methods; never grant permission or change data. */
import assert from 'node:assert/strict';
export function installDispatchObserver(rooms){
 const original=rooms.dispatchPrivate,records=[];
 rooms.dispatchPrivate=function(grant,eventId,enqueue){return Reflect.apply(original,this,[grant,eventId,function(event,roomRev){records.push({sequence:records.length+1,event_id:event.eventId,room_id:grant.roomId,member_id:grant.memberId,type:event.type,conversation_id:event.payload?.conversation_id??null,epoch:event.payload?.epoch??null,prompt_present:Boolean(event.payload?.prompt?.text)});return Reflect.apply(enqueue,this,[event,roomRev]);}]);};
 return {records,restore(){rooms.dispatchPrivate=original;},begin(f,{kind='deny_all',conversationId=null,oldEpoch=null}={}){
  const starts=f.members.map(actor=>({actor,start:actor.wire.frames.length}));let boundary=null;
  function denied(record){if(kind==='deny_all')return true;assert.equal(record.conversation_id,conversationId,'Changed conversation is outside the observed invalidation scope');return record.prompt_present||!Number.isSafeInteger(record.epoch)||record.epoch<=oldEpoch;}
  return {activate(){if(boundary===null)boundary=records.length+1;},get active(){return boundary!==null;},assertComplete(){
   assert.notEqual(boundary,null,'Transition boundary must be observed');const ids=new Set(f.members.map(a=>a.id)),active=records.filter(r=>r.sequence>=boundary&&r.room_id===f.room&&ids.has(r.member_id));
   for(const record of active)assert(!denied(record),'Private callback enqueue after transition violates '+kind);
   let received=0,prequeued=0,pending=0;
   for(const {actor,start}of starts)for(const frame of actor.wire.frames.slice(start).filter(v=>v.stream==='private')){
    received++;const matches=records.filter(r=>r.event_id===frame.event_id&&r.room_id===f.room&&r.member_id===actor.id&&r.type===frame.type&&r.conversation_id===(frame.payload?.conversation_id??null)&&r.epoch===(frame.payload?.epoch??null)&&r.prompt_present===Boolean(frame.payload?.prompt?.text));assert(matches.length>0,'Unknown private frame inside full transition window');
    if(matches.some(r=>r.sequence<boundary))prequeued++;else{assert(matches.every(r=>!denied(r)),'Received private frame violates transition');pending++;}
   }
   return {observation_started_before_transition:true,actual_enqueue_boundary_observed:true,post_boundary_private_callbacks:active.length,received_full_window_private_frames:received,received_known_pre_boundary_queued_frames:prequeued,received_fresh_pending_frames:pending,raw_unknown_private_frames:0,forbidden_post_boundary_private_callbacks:0};
  }};
 }};
}
export function observeSuccessfulNarrow(Ledger,match,onSuccess){
 const original=Ledger.prototype.narrow;Ledger.prototype.narrow=function(command){const receipt=Reflect.apply(original,this,[command]);if(match(command,receipt))onSuccess(command,receipt);return receipt;};return ()=>{Ledger.prototype.narrow=original;};
}
