/** Test-only observers. Delegate real methods; never grant permission or change data. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
function fingerprint(value){return JSON.stringify([value.schema,value.stream,value.room_id,value.audience,value.target_member_id,value.room_rev,value.stream_rev,value.event_id,value.type,value.payload_sha256]);}
function receivedFingerprint(frame){return fingerprint({...frame,payload_sha256:digest(JSON.stringify(frame.payload))});}
export function installDispatchObserver(rooms){
 const original=rooms.dispatchPrivate,records=[];
 rooms.dispatchPrivate=function(grant,eventId,enqueue){return Reflect.apply(original,this,[grant,eventId,function(event,roomRev){
  // JSON.stringify applies the same undefined omission as the real wire sender.
  // Retain only its SHA and classification fields, never the private text.
  const serialized=JSON.stringify(event.payload),payload=JSON.parse(serialized);
  records.push(Object.freeze({sequence:records.length+1,schema:1,stream:'private',audience:'member',event_id:event.eventId,room_id:grant.roomId,target_member_id:grant.memberId,room_rev:roomRev,stream_rev:event.revision,type:event.type,payload_sha256:digest(serialized),conversation_id:payload.conversation_id??null,epoch:payload.epoch??null,prompt_present:Boolean(payload.prompt?.text)}));
  return Reflect.apply(enqueue,this,[event,roomRev]);
 }]);};
 return {records,restore(){rooms.dispatchPrivate=original;},begin(f,{kind='deny_all',conversationId=null,oldEpoch=null}={}){
  const starts=f.members.map(actor=>({actor,start:actor.wire.frames.length})),startSequence=records.length+1;let boundary=null;
  function denied(record){if(kind==='deny_all')return true;assert.equal(record.conversation_id,conversationId,'Changed conversation is outside the observed invalidation scope');return record.prompt_present||!Number.isSafeInteger(record.epoch)||record.epoch<=oldEpoch;}
  return {activate(){if(boundary===null)boundary=records.length+1;},get active(){return boundary!==null;},assertComplete(){
   assert.notEqual(boundary,null,'Transition boundary must be observed');const ids=new Set(f.members.map(a=>a.id)),relevant=records.filter(r=>r.room_id===f.room&&ids.has(r.target_member_id)),active=relevant.filter(r=>r.sequence>=boundary);
   // An active callback is forbidden independently of any earlier matching ID.
   for(const record of active)assert(!denied(record),'Private callback enqueue after transition violates '+kind);
   const consumed=new Set(),knownIds=new Set(relevant.map(r=>r.event_id));
   const candidate=frame=>frame.stream==='private'||frame.type==='private_conversation_v2'||frame.audience==='member'||Object.hasOwn(frame,'target_member_id')||knownIds.has(frame.event_id);
   function consume(frame,actor,historical){
    const key=receivedFingerprint(frame),record=relevant.find(r=>!consumed.has(r.sequence)&&r.target_member_id===actor.id&&(!historical||r.sequence<startSequence)&&fingerprint(r)===key);
    assert(record,historical?'Historical private frame lacks a unique exact recorded enqueue':'Unknown private frame or replay inside full transition window');consumed.add(record.sequence);return record;
   }
   // Already received pre-window frames spend their enqueue. They cannot later
   // be excused again as delayed TCP merely because event_id/epoch are familiar.
   let baseline=0;for(const {actor,start}of starts)for(const frame of actor.wire.frames.slice(0,start).filter(candidate)){consume(frame,actor,true);baseline++;}
   let received=0,prequeued=0,pending=0;
   for(const {actor,start}of starts)for(const frame of actor.wire.frames.slice(start).filter(candidate)){
    received++;const record=consume(frame,actor,false);if(record.sequence<boundary)prequeued++;else{assert(!denied(record),'Received private frame violates transition');pending++;}
   }
   return {observation_started_before_transition:true,actual_enqueue_boundary_observed:true,post_boundary_private_callbacks:active.length,baseline_private_frames_consumed:baseline,received_full_window_private_frames:received,received_known_pre_boundary_queued_frames:prequeued,received_fresh_pending_frames:pending,full_payload_sha_and_exact_acl_headers:true,distinct_enqueue_per_received_frame:true,raw_unknown_private_frames:0,forbidden_post_boundary_private_callbacks:0};
  }};
 }};
}
export function observeSuccessfulNarrow(Ledger,match,onSuccess){
 const original=Ledger.prototype.narrow;Ledger.prototype.narrow=function(command){const receipt=Reflect.apply(original,this,[command]);if(match(command,receipt))onSuccess(command,receipt);return receipt;};return ()=>{Ledger.prototype.narrow=original;};
}
