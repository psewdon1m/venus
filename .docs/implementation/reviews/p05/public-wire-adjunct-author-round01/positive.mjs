/** Three explicitly declared finite positive adjuncts; existing API/WS helpers. */
export const publicCheckpoints=Object.freeze([
 'P05-OWS-02:returned','P05-OWS-03:returned','P05-OWS-04:returned','P05-OWS-09:returned',
 'Q-online:public-released','Q-online:public-finished','Q-online:precontent','Q-online:one-topic-ack','Q-online:two-topic-acks','Q-online:action','Q-online:finish',
 'TD-online:precontent','TD-online:choice','TD-online:one-topic-ack','TD-online:two-topic-acks','TD-online:action','TD-online:finish',
 'YB-IP:precontent','YB-IP:condition','YB-IP:one-topic-ack','YB-IP:two-topic-acks','YB-IP:action','YB-IP:finish'
]);
export function createPositives({h,capture,fixtures,ordinary,acceptInvitations,acceptTopic,until,assert,randomUUID,requiredPublic,extraChecks,setupAttempts}){
 const actors=f=>f.plan.actors.map(id=>f.members.find(m=>m.id===id));
 async function checkpoint(f,label){requiredPublic.push(label);capture.label(label);const row=await capture.http(h,f,label);assert(row);await until(()=>capture.coverage([label]).status==='PASS_FINITE_PUBLIC_DTO_PARITY_NOT_CADENCE_INFERENCE','same-native-revision public HTTP/WS '+label);}
 async function controlActor(f,key){const found=[];for(const actor of f.members){const view=await h.ok(actor,h.base(f)+'/self-actions');if(view.round_actions[key])found.push(actor);}assert.equal(found.length,1);return found[0];}
 async function actionAcks(f){for(const actor of f.members){const controls=await h.ok(actor,h.base(f)+'/self-actions');if(!controls.round_actions.accept_action)continue;const target=await h.ok(actor,h.round(f)+'/target'),offer=target.action;assert(offer);await h.ok(actor,h.round(f)+'/response','POST',{request_id:randomUUID(),kind:'accept',scope:'action',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision});}}
 async function finishActual(f,label){const actor=await controlActor(f,'finish'),view=await h.ok(actor,h.base(f)+'/current');await h.ok(actor,h.round(f)+'/finish','POST',{request_id:randomUUID(),expected_rev:view.game_rev});await checkpoint(f,label);}
 async function fixture(context){const f=await h.create(2,{context}),a=await h.joinRoom(f),b=await h.joinRoom({...f});f.members=[f.host,a,b];fixtures.push(f);for(const actor of f.members)await ordinary(f,actor);for(const actor of f.members){const pref=await h.ok(actor,h.roomPath(f)+'/me/preferences');await h.ok(actor,h.roomPath(f)+'/me/preferences','PUT',{expected_rev:pref.rev,idempotency_key:randomUUID(),comfort:4,edges:Object.fromEntries(f.members.filter(m=>m!==actor).map(m=>[m.id,'in_relationships']))});await h.putTopics(f,actor);}return f;}
 async function start(f,mode){const view=await h.roomView(f),prep=await h.ok(f.host,h.base(f)+'/prepare','POST',{request_id:randomUUID(),expected_rev:view.room_rev,mode,round_count:20,players:f.members.map(m=>m.id)});await h.ok(f.host,h.base(f)+'/start','POST',{request_id:randomUUID(),draft_rev:prep.game_rev});await h.current(f);}
 async function privateRound(mode,context){for(let attempt=0;attempt<3;attempt++){const f=await fixture(context);await start(f,mode);let found=false;
  for(let index=0;index<20;index++){
   if(f.plan.interaction==='pair_private'){setupAttempts.push({mode,context,attempt:attempt+1,selected_round:index+1,status:'SELECTED_REAL_PRIVATE'});found=true;break;}
   if(mode==='questions'&&attempt===0&&index===0){await acceptInvitations(f);await actionAcks(f);await checkpoint(f,'Q-online:public-released');await finishActual(f,'Q-online:public-finished');}
   else{const actor=f.members.find(m=>m.id===f.plan.primary_member_id);await h.ok(actor,h.round(f)+'/response','POST',{request_id:randomUUID(),kind:'skip'});}
   const current=await h.current(f);await h.ok(f.host,h.base(f)+`/${f.game}/round/advance`,'POST',{request_id:randomUUID(),expected_rev:Number(current.rev)});await h.current(f);
  }
  if(found)return f;setupAttempts.push({mode,context,attempt:attempt+1,round_bound:20,status:'NO_PRIVATE_DRAW'});
 }throw Error('No private opportunity in exactly3declared20round setup attempts');}
 async function run(mode,context,label){capture.label(label);const f=await privateRound(mode,context);await acceptInvitations(f);await checkpoint(f,label+':precontent');
  if(mode==='truth_or_dare'){const actor=await controlActor(f,'choose_truth');await h.ok(actor,h.round(f)+'/choice','POST',{request_id:randomUUID(),side:'truth'});await checkpoint(f,label+':choice');}
  if(mode==='yes_but'){const actor=await controlActor(f,'propose_condition'),view=await h.ok(actor,h.base(f)+'/current');await h.ok(actor,h.round(f)+'/condition','POST',{request_id:randomUUID(),expected_rev:view.game_rev,text:'SYNTHETIC WIRE CONDITION'});await checkpoint(f,label+':condition');}
  await acceptTopic(f,actors(f)[0]);await checkpoint(f,label+':one-topic-ack');await acceptTopic(f,actors(f)[1]);await checkpoint(f,label+':two-topic-acks');await actionAcks(f);await checkpoint(f,label+':action');await finishActual(f,label+':finish');extraChecks.push({mode,context,status:'PASS',bound_setup:'max3sessionsx20rounds',actual_public_wire:true});
 }
 return {checkpoint,run};
}
