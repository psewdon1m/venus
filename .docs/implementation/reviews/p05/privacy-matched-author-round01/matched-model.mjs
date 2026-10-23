/** Fresh native domain fixture. No persistence/auth/network/real-user consent. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {accumulator} from '../p05-pilot-corpus-ranges02/m3/features.mjs';
import {invariantDefinitions,consentCheckFactory} from '../p05-pilot-corpus-ranges02/m3/invariant-definitions.mjs';
import {emptyStage,optionCounter} from '../p05-pilot-corpus-ranges02/m3/diagnostics.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),pairKey=actors=>[...actors].sort().join(':');
const draftRejection=new WeakMap();
export function modelSession(env,descriptor,{onFrame=()=>{},onRound=()=>{},initialSafety=null,prior={public_history:[],private_history:[]}}={}){
 const {engine:e,pack,map,planner:p,renderer}=env,snapshot=env.makeSnapshot(descriptor),s=snapshot.baseline;
 const safety=initialSafety??{room_id:s.room_id,revision:1,members:s.players.map(player=>({member_id:player.id,revision:1,allow_topic_ids:map.topics.map(t=>t.topic_id),excluded_topic_ids:[]}))};
 let history=p.createTopicHistory(snapshot,pack,map,prior),completed=0,tick=0,gameRev=1,current=null,selected=0;
 assert.equal(history.provenance,'RUNTIME'); // Native constructor, never rebranding simulation history.
 const projection=accumulator(pack,s.players),rows=invariantDefinitions(),consentChecks=consentCheckFactory(e),invitations=Array(s.players.length).fill(0),stages={},rawRounds=[];
 const diagnostic=optionCounter(env,snapshot);
 let K=0,Kprivate=0,playablePrivate=0,legacyGlobalIdRepeats=0;const globalIds=new Set(),snapshotHash=e.digest(snapshot);
 const names=s.players.map((player,i)=>({id:player.id,display_name:'OBSERVER_ROLE_'+i+'_END'}));
 const game={id:s.session_id,room_id:s.room_id,state:'active',pause_reason:null,rev:String(gameRev),mode:s.mode,round_count:s.total_rounds};
 const check=(id,ok)=>{const r=rows[id-1];r.checks++;if(!ok){r.violations++;throw Object.assign(new Error('DOMAIN_INVARIANT'),{code:r.id});}};
 if(!draftRejection.has(pack)){let rejected=false;try{e.FrozenPack.load(pack.cards,pack.manifest);}catch(error){if(error?.code!=='PACK_NOT_REVIEWED')throw error;rejected=true;}draftRejection.set(pack,rejected);}check(12,draftRejection.get(pack)&&(pack.synthetic&&pack.approval_scope==='SYNTHETIC_FIXTURE'||!pack.synthetic&&pack.approval_scope==='OWNER_PROVISIONAL_LOCAL_PILOT'&&pack.owner_provisional?.decision_id==='U-019'));
 const stamp=()=>1000000+tick;
 const release=()=>{assert(current.plan.card);history=p.recordTopicOutcome(snapshot,history,pack,map,{expected_history_revision:history.revision,round_id:current.plan.round_id,offer_epoch:current.plan.interaction==='pair_private'?current.plan.attempts.at(-1).offer_epoch:null,card:current.plan.card,outcome:'disclosed'}).history;current.plan=history.rounds.at(-1);};
 const emit=label=>{
  game.rev=String(gameRev++);const view=renderer.topicGameView(game,current,pack,history,'en',names,stamp());
  const frame={model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',modeled_mutation:label,modeled_tick:tick++,payload:view};projection.add(frame);onFrame(frame);
  if(view.current_round.kind==='public'){
   const metadata=['ru','en','tr'].map(locale=>{const v=renderer.topicGameView(game,current,pack,history,locale,names,stamp());delete v.current_round.text;return e.canonical(v);});check(9,metadata.every(v=>v===metadata[0]));
  }
  if(current.plan.interaction==='pair_private')check(13,view.current_round.kind==='generic'&&Object.keys(view.current_round).sort().join(',')==='kind,round_id,round_index,state');
 };
 const acknowledge=scope=>{
  for(const actor of current.plan.actors){const offer=current[scope];assert(offer);assert(!e.consentAllows(offer,actor,stamp())||offer.acks.length===2);current[scope]=e.consentResponse(offer,actor,'accept',stamp(),{offer_id:offer.offer_id,scope,proposal_revision:offer.proposal_revision});
   if(current[scope].state==='active'){
    if(scope==='invitation'&&current.plan.interaction!=='pair_private')release();
    if(scope==='action')current.state='active';
    else if(current.plan.mode!=='truth_or_dare'&&!current.plan.requires_action_consent)current.state='active';
   }
   emit(scope+'_ack');
  }
  assert(current.plan.actors.every(actor=>e.consentAllows(current[scope],actor,stamp())));
 };
 const topicConsent=()=>{
  assert(current.plan.card);assert(current.invitation?.state==='active');const card=pack.card(current.plan.card.card_id),binding={...current.plan.card,candidate_ref:'candidate-'+hash(current.plan.round_id),side:current.choice,condition:current.condition?.text??null};
  const candidate=renderer.candidateFromBinding(pack,binding,map.entry(card.id).topic_ids),scope={room_id:s.room_id,session_id:s.session_id,round_id:current.plan.round_id,actors:current.plan.actors};
  let conversation=e.createPrivateConversation({scope,pins:{pack_digest:pack.digest,map_digest:map.pins.map_sha256,taxonomy_digest:map.pins.taxonomy_digest},topics:map.topics,candidates:[candidate],preferences:Object.fromEntries(scope.actors.map(actor=>[actor,{revision:1,allow:safety.members.find(m=>m.member_id===actor).allow_topic_ids,excluded:safety.members.find(m=>m.member_id===actor).excluded_topic_ids}])),now:stamp(),parent_expires_at:current.invitation.active_until});
  const apply=(command,actor)=>{const result=e.applyPrivateConversation(conversation,command,{scope,actor,now:stamp()});conversation=result.state;assert.equal(result.error,null);};
  apply({kind:'offer_topic',expected_revision:conversation.revision,expected_epoch:conversation.epoch,offer_id:'model-topic-'+current.plan.round_id,token:hash(descriptor.seed+':model-token:'+current.plan.round_id),candidate:{candidate_ref:candidate.candidate_ref,card_sha256:candidate.card_sha256}},scope.actors[0]);
  const project=actor=>{const projected=e.projectPrivateConversation(conversation,{scope,actor,now:stamp()});conversation=projected.state;assert.equal(projected.error,null);return projected.view;};
  assert(!project(scope.actors[0])?.prompt);
  for(const [i,actor]of scope.actors.entries()){
   const offer=conversation.offer;apply({kind:'respond_topic',decision:'accept',offer_id:offer.offer_id,epoch:offer.epoch,proposal_revision:offer.proposal_revision,token:offer.token},actor);
   assert.equal(Boolean(project(actor)?.prompt),i===1);
   if(i===1){assert.equal(conversation.offer.state,'active');release();}
   emit('topic_ack');
  }
  check(6,conversation.offer.state==='active');
 };
 let refusal=null;
 try{
  for(let index=0;index<s.total_rounds;index++){
   const prior=history,planned=p.selectNextTopicRound(snapshot,history,pack,map,safety);history=planned.history;const round=planned.round;selected++;projection.selected(round);
   assert.equal(history.provenance,'RUNTIME');const card=round.card?pack.card(round.card.card_id):null;
   const actors=s.players.filter(player=>round.actors.includes(player.id)),affected=round.interaction==='group'?s.players:actors;
   const cl=actors.length===2?e.resolvePair(actors[0],actors[1]).pairClass:null,order=['X','J','F','G','M','S','R'];
   check(1,cl!=='X');check(2,!card||affected.every(a=>a.comfort>=card.min_comfort));check(3,round.stage===e.progressionStage(round.round_index,s.total_rounds)&&(!card||card.min_progression_stage<=round.stage));
   check(4,!card||s.context!=='online'||!card.requires_physical_contact&&!card.requires_going_away);check(5,!card||!card.requires_physical_contact||s.context==='in_person'&&card.consent==='bilateral'&&card.min_comfort===4&&round.requires_action_consent);
   check(6,round.interaction!=='pair_private'||round.stage>=3&&actors.every(a=>a.comfort>=1)&&round.requires_action_consent&&s.capabilities.includes('private_text_chat'));
   check(7,!card||(cl===null?card.relationship_scope==='none':order.indexOf(cl)>=order.indexOf(env.relationshipPolicy.relationship_scope_min_class[card.relationship_scope])&&cl!=='X'));
   check(8,e.digest(snapshot)===snapshotHash);
   const used=round.interaction==='pair_private'?prior.private_history.filter(r=>pairKey(r.actors)===pairKey(round.actors)):prior.public_history;
   check(15,!card||![...used,...(round.interaction==='pair_private'?prior.public_history:[])].some(row=>row.card_id===card.id||map.entry(row.card_id).semantic_family_ids.some(f=>map.entry(card.id).semantic_family_ids.includes(f))));
   if(card){const repeated=globalIds.has(card.id);legacyGlobalIdRepeats+=Number(repeated);check(15,!repeated);globalIds.add(card.id);}consentChecks({...round,card_id:card?.id},rows);
   const stage=stages[round.stage]??=emptyStage();const availability=diagnostic.record(prior,round,stage,safety);
   stage.rounds++;stage.interactions[round.interaction]++;if(card)stage.min_comfort_histogram[card.min_comfort]++;
   if(round.interaction.startsWith('pair_')){K++;stage.pair_offers++;assert.equal(round.actors.length,2);for(const actor of round.actors){const at=s.players.findIndex(a=>a.id===actor);assert(at>=0);invitations[at]++;}}
   if(round.interaction==='pair_private'){Kprivate++;stage.private_opportunities++;assert(Kprivate<=Math.ceil(.25*s.total_rounds));if(card){playablePrivate++;stage.private_playable++;}else stage.private_safe_empty++;}
   rawRounds.push({round_id:round.round_id,round_index:round.round_index,stage:round.stage,interaction:round.interaction,actors:round.actors,primary_member_id:round.primary_member_id,card:round.card,min_comfort:card?.min_comfort??null,private_history_revision:history.revision,availability});onRound({round,history,prior});
   const pair=round.actors.length===2;current={schema_version:2,plan:round,state:pair||round.mode==='truth_or_dare'?'pending':'active',clock_floor:stamp(),invitation:pair?e.proposeConsent('model-invite-'+round.round_id,round.actors,'invitation',stamp()):null,action:null,choice:null,condition:null,conversation_id:round.interaction==='pair_private'?'model-conversation-'+round.round_id:null,boot_id:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',content_revision:1};
   if(!pair)release();emit('selected');
   if(pair)acknowledge('invitation');
   if(round.mode==='truth_or_dare'){current.choice='truth';current.content_revision++;if(!round.requires_action_consent)current.state='active';emit('choose_truth');}
   if(round.interaction==='pair_private'){
    if(!round.card){current.state='skipped';emit('safe_empty_skip');completed++;continue;}
    if(round.mode==='yes_but'){current.condition={revision:1,text:'MODEL REQUIRED CONDITION'};current.content_revision++;emit('first_private_condition');}
    topicConsent();
   }
   if(round.requires_action_consent){current.action=e.proposeConsent('model-action-'+round.round_id,round.actors,'action',stamp(),current.invitation?.active_until??stamp()+180000);acknowledge('action');}
   if(current.action)assert(e.consentAllows(current.action,round.primary_member_id,stamp()));
   if(current.invitation)assert(e.consentAllows(current.invitation,round.primary_member_id,stamp()));
   current.state='completed';if(current.action)current.action=e.consentResponse(current.action,round.primary_member_id,'finish',stamp());emit('finish');completed++;
  }
  game.state='completed';emit('session_complete');
 }catch(error){if(error?.code!=='TOPIC_SAFE_POOL_EXHAUSTED'){const failure=error&&typeof error==='object'?error:new Error('DOMAIN_FAILURE');failure.domain_prefix={model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',status:'FAIL_DOMAIN_PREFIX_NOT_COMPLETE',selected_rounds:selected,completed_rounds:completed,history,raw_rounds:rawRounds,last_selected_round:history.rounds.at(-1)??null,invariants:rows,features:projection.finish(completed)};throw failure;}refusal={reason:error.code,selected_prefix:selected,completed_prefix:completed,history_revision:history.revision};}
 assert.equal(invitations.reduce((a,b)=>a+b,0),2*K);assert(Kprivate<=Math.ceil(.25*s.total_rounds));
 return {descriptor,model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',actual_transport:false,history_provenance:history.provenance,status:refusal?'SAFE_REFUSAL':'COMPLETE_DOMAIN_MODEL',requested_rounds:s.total_rounds,selected_rounds:selected,completed_rounds:completed,refusal,history,counts:{K,D:2*K,Kprivate,private_playable:playablePrivate,private_safe_empty:Kprivate-playablePrivate,invitations,current_session_exact_ID_repeats:legacyGlobalIdRepeats,legacy_global_ID_repeats:legacyGlobalIdRepeats,legacy_global_ID_zero:legacyGlobalIdRepeats===0,stages},invariants:rows,raw_rounds:rawRounds,features:projection.finish(completed),missing_oracles:['Actual auth/WS/HTTP/close/source/clock/final fence proof','Exact Start-preflight admission parity','Additional exclusion/privatehistory inferability strata common support and actualwire parity']};
}
