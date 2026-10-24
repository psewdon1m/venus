/** One deterministic command script shared by pure and actual runtime adapters. */
import assert from 'node:assert/strict';
import {DomainError} from '../../apps/api/dist/security.js';
import {assertActorConversation,publicChatNoBump} from '../p05-topic-measurements/private-transcript.mjs';
const adviceText=['SYNTHETIC ADVICE ONE','SYNTHETIC ADVICE TWO'];
export async function runLifecycle(session,{observe=async()=>{},privateRecord=()=>{},roundCheck=async()=>{},shouldStop=()=>false,onRound=()=>{},privateControl=null}={}){
 const R=session.snapshot.baseline.total_rounds,host=session.hostMemberId??session.snapshot.baseline.players[0].id,regime=session.descriptor.regime;
 let nonempty=0,adviceDone=false,completed=0,refusal=null,unavailable=0,commands=0;
 async function state(){const current=await session.current();return{...current,game:session.g};}
 async function observations(label){await observe(session,label);}
 async function clock(ms=100){const from=session.now;await session.stepClock(ms);await observe(session,'clock_tick',{from,to:session.now});}
 async function command(kind,actor,input,label=kind,{denial=false}={}){
  commands++;let value,error;try{value=await session.mutate(kind,actor,input);}catch(e){error=e;}
  if(denial){assert(error instanceof DomainError&&error.statusCode>=400&&error.statusCode<500,'EXPECTED_4XX_NOT_5XX:'+label);unavailable++;}
  else if(error)throw error;
  await observations(label);if(!error)await clock();return value;
 }
 async function readActors(label){const {data}=await state();if(data.plan.interaction!=='pair_private')return;
  const conv=await session.conversationState();for(const actor of data.plan.actors){let v,error;try{v=await session.conversation(actor);}catch(e){error=e;}if(error){assert(error instanceof DomainError&&error.statusCode>=400&&error.statusCode<500);privateRecord({label,actor,status:error.statusCode,code:error.code});await observations(label+'_private_read');continue;}
   if(v?.deferred_error){privateRecord({label,actor,status:v.status,code:v.deferred_error});await observations(label+'_private_read');continue;}
   const accepted=(conv?.state.advice??[]).filter(a=>a.recipient===actor&&a.state==='accepted').map(a=>a.advice_id),active=conv?.state.offer?.state==='active';assertActorConversation(JSON.stringify(v),{bilateral_topic_accepted:active,recipient_advice_accept_ids:accepted});privateRecord({label,actor,status:200,raw:JSON.stringify(v)});await observations(label+'_private_read');
  }
 }
 async function consent(scope){const {data}=await state();for(const actor of [...data.plan.actors].sort()){const target=await session.target(actor),offer=target[scope];await observations(scope+'_target_read');if(offer?.state==='pending'&&offer.own_state!=='accepted'){await command('response',actor,{kind:'accept',scope,offer_id:offer.offer_id,proposal_revision:offer.proposal_revision},scope+'_accept');await readActors(scope+'_after_'+actor);}}}
 async function waitOffer(){const c=await session.conversationState();if(c?.state.last_offer_at!==null&&c?.state.last_offer_at!==undefined){const wait=Math.max(0,c.state.last_offer_at+5001-session.now);if(wait)await clock(wait);}}
 async function offerRef(actor){const v=await session.conversation(actor);assert(v.offer);return{offer_id:v.offer.offer_id,epoch:v.epoch,proposal_revision:v.offer.proposal_revision,token:v.offer.token};}
 async function conversationCommand(actor,body,label,options){const receipt=await command('conversationCommand',actor,body,label,options);await readActors(label);return receipt;}
 try{
  await observations('start');
  for(let index=1;index<=R;index++){
   assert(!shouldStop(),'SECTION_WALL_STOP');let current=await state();const {plan}=current.data;await roundCheck(session,current);onRound({phase:'selected',session,current});
   await readActors('invitation_zero_ack');if(plan.actors.length===2)await consent('invitation');
   current=await state();if(current.game.mode==='truth_or_dare')await command('choice',plan.primary_member_id,{side:index%2?'truth':'dare'},'choice_'+(index%2?'truth':'dare'));
   if(current.game.mode==='yes_but'&&regime!=='T6_TARGETED_CHANGES'){
    if(plan.interaction==='pair_private')await waitOffer();await command('condition',plan.actors[1],{expected_rev:Number(session.g.rev),text:'SYNTHETIC CONDITION 1'},'condition');await readActors('condition_new_binding_zero_ack');
   }
   current=await state();
   if(plan.interaction==='pair_private'){
    const overridden=privateControl?await privateControl({session,plan,command,conversationCommand,offerRef,waitOffer}):false;if(!overridden){
    let conv=await session.conversationState();if(current.data.plan.card&&conv?.state.offer){nonempty++;
     if(regime==='T6_TARGETED_CHANGES'&&nonempty===1){await waitOffer();await conversationCommand(plan.actors[0],{kind:'other_question',...await offerRef(plan.actors[0]),exclude_current_topics:false},'other_question');await roundCheck(session,await state());await waitOffer();conv=await session.conversationState();await conversationCommand(plan.actors[0],{kind:'offer_topic',expected_epoch:conv.state.epoch,topic_ids:['creative']},'targeted_topic');await roundCheck(session,await state());}
     else if(regime==='T6_TARGETED_CHANGES'&&nonempty===2){const actor=plan.actors.includes(session.snapshot.baseline.players[0].id)?session.snapshot.baseline.players[0].id:plan.actors[0];await waitOffer();await conversationCommand(actor,{kind:'other_question',...await offerRef(actor),exclude_current_topics:true},'exclude_current_full_union');await roundCheck(session,await state());}
    }
    conv=await session.conversationState();if(!conv?.state.offer){await command('response',plan.primary_member_id,{kind:'skip'},'safe_empty_skip');}
    else{
     await readActors('topic_zero_ack');for(const [ack,actor]of [...plan.actors].sort().entries()){await conversationCommand(actor,{kind:'respond_topic',...await offerRef(actor),decision:'accept'},ack===0?'topic_one_ack':'topic_two_acks');const view=await session.conversation(actor);assert.equal(Boolean(view.prompt),ack===1,'TOPIC_ACK_PROMPT_BOUNDARY');}
     await consent('action');
     if(!adviceDone){adviceDone=true;const sender=[...plan.actors].sort()[0],recipient=plan.actors.find(a=>a!==sender),active=await session.conversation(sender);let priorId;
      for(let i=0;i<2;i++){const offered=await conversationCommand(sender,{kind:'offer_advice',epoch:active.epoch,offer_id:active.offer.offer_id,text:adviceText[i],...(priorId?{replaces_id:priorId}:{})},i?'advice_edit':'advice_offer');const receiver=await session.conversation(recipient),pending=receiver.advice.find(a=>a.advice_id===offered.advice_id);assert(pending&&!Object.hasOwn(pending,'text'));if(priorId)assert(!JSON.stringify(receiver).includes(adviceText[0]));await conversationCommand(recipient,{kind:'respond_advice',advice_id:offered.advice_id,proposal_revision:pending.revision,epoch:pending.epoch,decision:'accept'},i?'advice_accept_edit':'advice_accept');assert(JSON.stringify(await session.conversation(recipient)).includes(adviceText[i]));priorId=offered.advice_id;}
      const own=(await session.conversation(sender)).advice.find(a=>a.advice_id===priorId);await conversationCommand(sender,{kind:'revoke_advice',advice_id:own.advice_id,proposal_revision:own.revision,epoch:own.epoch},'advice_revoke');for(const actor of plan.actors){const raw=JSON.stringify(await session.conversation(actor));assert(!adviceText.some(t=>raw.includes(t)));}
      await conversationCommand(recipient,{kind:'respond_advice',advice_id:own.advice_id,proposal_revision:own.revision,epoch:own.epoch,decision:'accept'},'stale_advice_response',{denial:true});
      if(session.snapshot.baseline.context==='online'&&session.descriptor.capability==='CHAT_ON'){
       for(const actor of [...plan.actors].sort()){await session.beforeChat?.();const view=await session.conversation(actor),before={room_rev:Number(session.room.rev),game_rev:Number(session.g.rev),public_frame_count:session.roomEvents?.length??0,private_chat_revision:(await session.chat(actor)).revision};await command('sendChat',actor,{conversation_id:view.conversation_id,epoch:view.epoch,text:'SYNTHETIC CHAT'},'chat_send');const after={room_rev:Number(session.room.rev),game_rev:Number(session.g.rev),public_frame_count:session.roomEvents?.length??0,private_chat_revision:(await session.chat(actor)).revision};publicChatNoBump(before,after);}
      }else{const actor=plan.actors[0],view=await session.conversation(actor);await command('sendChat',actor,{conversation_id:view.conversation_id,epoch:view.epoch,text:'SYNTHETIC GUARDED CHAT'},'chat_denied',{denial:true});let denied=false;try{await session.chat(actor);}catch(e){assert(e instanceof DomainError&&e.statusCode>=400&&e.statusCode<500);denied=true;}assert(denied,'CHAT_GET_EXPECTED_DENIAL');}
     }
     await command('finish',plan.primary_member_id,{expected_rev:Number(session.g.rev)},'finish');
    }
   }}else{await consent('action');await command('finish',plan.primary_member_id,{expected_rev:Number(session.g.rev)},'finish');}
   current=await state();assert(['completed','skipped','stopped'].includes(current.data.state));completed++;onRound({phase:'terminal',session,current});await command('advance',host,{expected_rev:Number(session.g.rev)},index===R?'session_complete':'advance');
  }
 }catch(error){if(error.code==='TOPIC_SAFE_POOL_EXHAUSTED'){refusal={reason:error.code,completed_prefix:completed};}else throw error;}
 return{status:refusal?'SAFE_REFUSAL':'COMPLETE',requested_rounds:R,completed_rounds:completed,nonempty_private:nonempty,advice:adviceDone?'EXECUTED':'NA_NO_ACTIVE_TOPIC',unavailable_branches:unavailable,commands,refusal,history:session.history};
}
