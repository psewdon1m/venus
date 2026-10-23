/** Separate real V2 scenes. Exact source-bound METHOD21 helpers; no historical entrypoint evaluation. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {URLSearchParams} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {setTimeout,clearTimeout} from 'node:timers';
import {expect} from '@playwright/test';
import {offeredTopics,expectedOfferLabels,coherentRound,uiRoundMatches} from './observations.mjs';
import {createPrivateBatchObserver} from './private-batch-observer.mjs';
import {exactUiMutation} from './request-emission.mjs';
import {safeFailedReadiness} from './readiness-diagnostics.mjs';
/* global document,window */
export function sceneDriver({browser,service,report,save=()=>{},viewport={width:1440,height:900}}){
let actors=[],phase='layout-prepare';
const base=a=>'/api/v1/rooms/'+a.room,current=a=>read(a,'/api/v2/rooms/'+a.room+'/game/current');
const observedOwnStarts=new WeakMap();
const privateBatches=createPrivateBatchObserver({sourceRoot:process.cwd(),onProjection:(actor,{kind,value})=>{if(actor.closed)return;if(kind==='current')actor.lastGameView=value;if(kind==='own'){actor.lastSelfActions=value;if(Number.isFinite(value.started_monotonic_ms))observedOwnStarts.set(actor,value.started_monotonic_ms);}}});
const normalPrivateControls=new Set(['pair-accept','action-accept','topic-accept','topic-new','advice-offer','advice-accept','advice-edit','pair-chat-send','game-condition-submit']);
async function read(a,suffix){const response=await a.context.request.get(service.origin+suffix,{headers:{origin:service.origin,'x-csrf-token':a.csrf}});assert.equal(response.status(),200,`Authenticated read failed: ${suffix.split('/').at(-1)} ${response.status()}`);return response.json();}

function expectedPrivateScope(a,expected={}){
 const view=a.lastGameView;assert(view&&view.state==='active'&&['pending','active'].includes(view.round_state),'METHOD12_ACTIVE_UI_SCOPE_REQUIRED');
 return {room:a.room,member:a.id,session:expected.session??view.session_id,round:expected.round??view.round_id,minRev:expected.minRev??view.game_rev,afterMonotonic:expected.afterMonotonic??null};
}

function privateDom(a,id,index){return a.page.evaluate(({id,index,room})=>{const round=document.querySelector('[data-testid="game-round"]'),el=document.querySelector('[data-testid="'+id+'"]'),visible=node=>Boolean(node&&node.getClientRects().length>0&&window.getComputedStyle(node).visibility!=='hidden');return document.visibilityState==='visible'&&new URLSearchParams(window.location.hash.slice(1)).get('room')===room&&visible(round)&&new RegExp('\\b'+index+'\\s*/').test(round.textContent??'')&&visible(el)&&!el.matches(':disabled');},{id,index,room:a.room});}

async function normalPrivateReady(a,control,{deadline=performance.now()+8000,expected={},intendedValue=null}={}){
 const started=performance.now(),wanted=expectedPrivateScope(a,expected),row={control,started_monotonic_ms:started,phase_deadline_monotonic_ms:deadline,status:'FAILED',observer_model_only:true,cache_accept_observed:false};
 const rows=report.private_preparation??=[];assert(rows.length<256,'METHOD12_PREPARATION_RECORD_CAP');rows.push(row);let last=null;
 try{
  if(intendedValue){const field=a.page.getByTestId(intendedValue.control),value=typeof intendedValue.value==='boolean'?await field.isChecked():await field.inputValue();assert.equal(value,intendedValue.value,'METHOD12_INTENDED_VALUE_CLEARED_BEFORE_PREPARATION');}
  while(performance.now()<deadline){
   const ready=await privateBatches.requireReady(a,{control,deadline,focus:false,expectedScope:{room:wanted.room,member:wanted.member,session:wanted.session,round:wanted.round},intendedValue});last=ready;
   if(wanted.afterMonotonic!==null&&(observedOwnStarts.get(a)??-Infinity)<wanted.afterMonotonic){await delay(Math.min(20,Math.max(1,deadline-performance.now())));continue;}
   const observed=a.lastGameView;
   if(!observed||observed.session_id!==wanted.session||observed.round_id!==wanted.round||observed.game_rev<wanted.minRev||observed.state!=='active'||!['pending','active'].includes(observed.round_state)){await delay(Math.min(20,Math.max(1,deadline-performance.now())));continue;}
   const exact={room:wanted.room,member:wanted.member,session:wanted.session,round:wanted.round,rev:observed.game_rev};
   const before=privateBatches.snapshot(a,{control,expectedScope:exact});if(!before.ready){await delay(Math.min(20,Math.max(1,deadline-performance.now())));continue;}
   const remaining=deadline-performance.now();assert(remaining>0,'METHOD12_PREPARATION_DEADLINE');let timer;
   let dom;try{dom=await Promise.race([privateDom(a,control,observed.round_index),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('METHOD12_PREPARATION_DEADLINE')),remaining);})]);}finally{clearTimeout(timer);}
   const sampled=performance.now(),final=privateBatches.snapshot(a,{control,expectedScope:exact});last=final;
   if(!dom||a.lastGameView!==observed||!final.ready||before.cycle_id!==final.cycle_id){await delay(Math.min(20,Math.max(1,deadline-performance.now())));continue;}
   assert(sampled<deadline,'METHOD12_PREPARATION_DEADLINE');
   const ticket={...final,phase_deadline_monotonic_ms:deadline,deadline_monotonic_ms:Math.min(deadline,sampled+final.lease_remaining_ms),prepared_monotonic_ms:sampled};
   Object.defineProperties(ticket,{expected:{value:exact},control:{value:control}});a.privateReady??=new Map();a.privateReady.set(control,ticket);row.status='READY';row.snapshot={...ticket};return ticket;
  }
  throw Error('METHOD12_PREPARATION_DEADLINE');
 }catch(error){row.failed_readiness=safeFailedReadiness(error.readiness??last,{actor:a,expected:wanted});throw error;}finally{row.finished_monotonic_ms=performance.now();row.last_snapshot=last;save();}
}

async function preparePrivateClick(a,control,path=null){
 if(!normalPrivateControls.has(control))return null;
 const match=path?.match(/\/game\/([^/]+)\/round\/([^/]+)\//),expected=match?{session:match[1],round:match[2]}:{},wanted=expectedPrivateScope(a,expected),prior=a.privateReady?.get(control),intent=a.privateIntents?.get(control);
 a.privateReady?.delete(control);
 const samePrior=prior&&prior.expected.session===wanted.session&&prior.expected.round===wanted.round;
 return normalPrivateReady(a,control,{deadline:samePrior?prior.phase_deadline_monotonic_ms:performance.now()+8000,expected:wanted,intendedValue:intent?.scope.session===wanted.session&&intent?.scope.round===wanted.round?intent.field:null});
}

function assertPrivateTicket(a,id,ticket){
 let current=null,checkedAt=null;
 try{assert(ticket&&ticket.control===id,'METHOD12_PRIVATE_TICKET_REQUIRED');checkedAt=performance.now();assert(checkedAt<ticket.deadline_monotonic_ms,'METHOD12_PRIVATE_TICKET_EXPIRED');current=privateBatches.snapshot(a,{control:id,expectedScope:ticket.expected});assert(current.ready&&current.cycle_id===ticket.cycle_id,'METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK');}
 catch(error){const rows=report.private_ticket_failures??=[];if(rows.length>=128)report.private_ticket_failure_overflow=true;else rows.push({control:normalPrivateControls.has(id)?id:'UNLISTED',checked_monotonic_ms:checkedAt,failed_monotonic_ms:performance.now(),prepared_cycle_id:Number.isSafeInteger(ticket?.cycle_id)&&ticket.cycle_id>=0?ticket.cycle_id:null,ticket_deadline_monotonic_ms:Number.isFinite(ticket?.deadline_monotonic_ms)?ticket.deadline_monotonic_ms:null,reason:!ticket||ticket.control!==id?'TICKET_MISSING_OR_WRONG_CONTROL':!Number.isFinite(ticket.deadline_monotonic_ms)||checkedAt>=ticket.deadline_monotonic_ms?'TICKET_EXPIRED_OR_INVALID_DEADLINE':'BATCH_NOT_READY_OR_CHANGED',current:safeFailedReadiness(current,{actor:a,expected:{...ticket?.expected,minRev:ticket?.expected?.rev}})});save();throw error;}
}

async function click(a,id,prepared=null){
 const ticket=normalPrivateControls.has(id)?prepared??await preparePrivateClick(a,id):null;
 if(ticket)a.privateReady?.delete(id);
 report.last_control={phase,locale:a.locale,member_id:a.id,control:id,started_monotonic_ms:performance.now()};save();const l=a.page.getByTestId(id);if(!ticket){await expect(l).toBeVisible();await expect(l).toBeEnabled();}if(ticket)assertPrivateTicket(a,id,ticket);await l.click(ticket?{timeout:Math.max(1,Math.min(15000,ticket.deadline_monotonic_ms-performance.now()))}:{});
}

async function fillPrivate(a,id,value,submit){
 const deadline=performance.now()+8000,ticket=await normalPrivateReady(a,id,{deadline});await a.page.getByTestId(id).fill(value);assertPrivateTicket(a,id,ticket);await expect(a.page.getByTestId(id)).toHaveValue(value);a.privateIntents??=new Map();a.privateIntents.set(submit,{scope:ticket.expected,field:{control:id,value}});a.privateReady.set(submit,Object.defineProperties({...ticket},{expected:{value:ticket.expected},control:{value:submit}}));
}

function recordMutation(event){const rows=report.mutation_dispatches??=[];assert(rows.length<2048,'METHOD12_MUTATION_RECORD_CAP');rows.push({locale:event.locale??null,...event});}

async function approval(a){await expect(a.page.getByTestId('create-room')).toBeDisabled();await a.page.getByTestId('accept-offer').check();await expect(a.page.getByTestId('create-room')).toBeDisabled();await a.page.getByTestId('adult18').check();}

async function create(a){await approval(a);const contextSelect=a.page.locator('form').filter({has:a.page.getByTestId('create-name')}).locator('select');await contextSelect.selectOption('online');await expect(contextSelect).toHaveValue('online');await a.page.getByTestId('create-name').fill('SYNTHETIC HOST');const response=a.page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v2/rooms'&&r.request().method()==='POST');await a.page.getByTestId('create-room').click();const r=await response;assert.equal(r.status(),201);assert.equal(r.request().postDataJSON().meeting_context,'online');a.csrf=await r.headerValue('x-csrf-token');assert(a.csrf);await a.page.getByTestId('room-shell').waitFor();a.room=new URLSearchParams(new URL(a.page.url()).hash.slice(1)).get('room');a.id=(await read(a,base(a)+'/me/preferences')).owner_member_id;await expect(a.page.getByTestId('room-invite')).not.toHaveValue('');return a.page.getByTestId('room-invite').inputValue();}

async function joinRoom(a,invite,index){await approval(a);await a.page.getByTestId('join-name').fill('SYNTHETIC PEER '+index);await a.page.getByTestId('join-invite').fill(invite);const response=a.page.waitForResponse(r=>/\/join$/.test(new URL(r.url()).pathname)&&r.request().method()==='POST');await a.page.getByTestId('join-room').click();const r=await response;assert.equal(r.status(),200);a.csrf=await r.headerValue('x-csrf-token');assert(a.csrf);await a.page.getByTestId('room-shell').waitFor();a.room=new URLSearchParams(new URL(a.page.url()).hash.slice(1)).get('room');a.id=(await read(a,base(a)+'/me/preferences')).owner_member_id;}

async function ownTopics(a){return read(a,base(a)+'/me/private-topics');}

async function configure(a){await expect(a.page.getByTestId('comfort')).toBeEnabled();await a.page.getByTestId('comfort').focus();await a.page.keyboard.press('End');for(const l of await a.page.locator('[data-testid^="relation-"]').all())await l.selectOption('in_relationships');await click(a,'submit-preferences');await expect.poll(async()=>(await read(a,base(a)+'/me/preferences')).comfort).toBe(4);for(const box of await a.page.locator('[data-testid^="topic-allow-"]').all())if(!await box.isDisabled())await box.check();await click(a,'topics-save');await expect.poll(async()=>(await ownTopics(a)).allow_topic_ids.length).toBe(3);}

async function connected(){await expect.poll(async()=>{const room=await read(actors[0],base(actors[0]));return actors.every(a=>room.members.some(m=>m.id===a.id&&m.presence==='online'));},{timeout:20000}).toBe(true);}

async function start(mode){const host=actors[0];let prior;try{prior=await current(host);}catch{/* First session. */}if(prior&&['active','paused'].includes(prior.state)){await click(host,'game-stop');await expect.poll(async()=>(await current(host)).state).toBe('aborted');}await connected();await host.page.getByTestId('game-mode').selectOption(mode);await host.page.getByTestId('game-rounds').fill('20');for(const a of actors)await host.page.getByTestId('game-player-'+a.id).check();await click(host,'game-prepare');await expect(host.page.getByTestId('game-start')).toBeEnabled();await click(host,'game-start');await expect.poll(async()=>(await current(host)).state).toBe('active');return service.plan(host.room);}

async function coherentGame(expected={}){let result=null;await expect.poll(async()=>{const f=await service.plan(actors[0].room),g=await current(actors[0]);if(!coherentRound(f,g,expected))return false;result={fixture:f,view:g};return true;},{timeout:8000,intervals:[50,100,250]}).toBe(true);return result;}

async function ownUiRound(a,f,control){await expect.poll(()=>uiRoundMatches(a.lastGameView,f),{timeout:8000,intervals:[50,100,250]}).toBe(true);await expect(a.page.getByTestId('game-round')).toContainText(new RegExp('\\b'+f.plan.round_index+'\\s*/'));await expect(a.page.getByTestId(control)).toBeVisible();await expect(a.page.getByTestId(control)).toBeEnabled();}

async function mutationClick(a,control,path,kind,scope,afterClick){const {receipt}=await exactUiMutation({page:a.page,path,kind,scope,control,prepare:()=>preparePrivateClick(a,control,path),click:ticket=>click(a,control,ticket),afterClick,record:event=>recordMutation({locale:a.locale,...event})});return receipt;}

async function advance(snapshot){const host=actors[0],f=snapshot.fixture;await ownUiRound(host,f,'game-next');const receipt=await mutationClick(host,'game-next',`/api/v2/rooms/${host.room}/game/${f.session}/round/advance`);return coherentGame({session:f.session,index:f.plan.round_index+1,minRev:receipt.game_rev});}

async function seekPrivate(){let snapshot=await coherentGame(),session=snapshot.fixture.session;const seen=new Set();for(let n=0;n<20;n++){const f=snapshot.fixture,g=snapshot.view;assert.equal(f.session,session);assert.equal(f.plan.round_index,n+1,'Read settling must never skip planner rounds');assert(!seen.has(f.plan.round_id));seen.add(f.plan.round_id);if(f.plan.interaction==='pair_private'&&['pending','active'].includes(g.current_round.state))return f;if(!['completed','skipped','stopped'].includes(g.current_round.state)){const a=actors.find(a=>a.id===f.plan.primary_member_id);assert(a);await ownUiRound(a,f,'game-skip');const receipt=await mutationClick(a,'game-skip',`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/response`,'skip');snapshot=await coherentGame({session,round:f.plan.round_id,index:f.plan.round_index,minRev:receipt.game_rev});assert(['completed','skipped','stopped'].includes(snapshot.view.current_round.state));}if(n===19)break;snapshot=await advance(snapshot);}throw Error('No real private encounter within declared20-round bound');}

async function startPrivate(mode){
 const rows=report.private_setup_sessions??=[],room=actors[0].room,sessionIds=new Set(),setup=rows.filter(r=>r.attempt===1).length+1;
 assert(['questions','truth_or_dare','yes_but'].includes(mode),'METHOD18_PRIVATE_SETUP_MODE');
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
 assert(uuid.test(room)&&typeof phase==='string'&&phase.length<=80,'METHOD18_PRIVATE_SETUP_SCOPE');
 for(let attempt=1;attempt<=3;attempt++){
  assert(rows.length<24,'METHOD18_PRIVATE_SETUP_RECORD_CAP');
  const row={setup,phase,mode,attempt,max_sessions:3,round_bound:20,room_id:room,session_id:null,outcome:'RUNNING'};rows.push(row);save();
  let seeking=false;
  try{
   const started=await start(mode);assert.equal(actors[0].room,room,'METHOD18_PRIVATE_SETUP_ROOM_CHANGED');
   assert(uuid.test(started.session)&&!sessionIds.has(started.session),'METHOD18_PRIVATE_SETUP_SESSION');sessionIds.add(started.session);row.session_id=started.session;save();
   seeking=true;const found=await seekPrivate();seeking=false;
   assert.equal(found.session,started.session,'METHOD18_PRIVATE_SETUP_SELECTED_SESSION');assert.equal(actors[0].room,room,'METHOD18_PRIVATE_SETUP_ROOM_CHANGED');
   row.outcome='PRIVATE_SELECTED';row.selected_round_index=found.plan.round_index;row.selected_actual_session=found.session;
   save();console.log(JSON.stringify({private_setup:row}));return found;
  }catch(error){
   const noDraw=seeking&&error instanceof Error&&error.constructor===Error&&error.name==='Error'&&error.message==='No real private encounter within declared20-round bound';
   row.outcome=noDraw?'NO_PRIVATE_DRAW':'FAIL';if(noDraw)row.observed_rounds=20;save();console.log(JSON.stringify({private_setup:row}));
   if(!noDraw)throw error;
   if(attempt===3)throw Error('METHOD18_PRIVATE_SETUP_NO_ENCOUNTER_WITHIN_3_SESSIONS',{cause:error});
  }
 }
}

function participants(f){return actors.filter(a=>f.plan.actors.includes(a.id));}

async function invite(f,{side=true,condition=false}={}){const pair=participants(f);assert.equal(pair.length,2);for(const a of pair){const snapshot=await coherentGame({session:f.session,round:f.plan.round_id,index:f.plan.round_index});f.data=snapshot.fixture.data;f.game_rev=snapshot.fixture.game_rev;f.game_state=snapshot.fixture.game_state;f.current_round=snapshot.fixture.current_round;await ownUiRound(a,snapshot.fixture,'pair-accept');await expect(a.page.getByTestId('private-prompt')).toHaveCount(0);const receipt=await mutationClick(a,'pair-accept',`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/response`,'accept','invitation');await coherentGame({session:f.session,round:f.plan.round_id,minRev:receipt.game_rev});}if(f.plan.mode==='truth_or_dare'&&side){const primary=actors.find(a=>a.id===f.plan.primary_member_id),snapshot=await coherentGame({session:f.session,round:f.plan.round_id});await ownUiRound(primary,snapshot.fixture,'game-dare');const receipt=await mutationClick(primary,'game-dare',`/api/v2/rooms/${primary.room}/game/${f.session}/round/${f.plan.round_id}/choice`);await coherentGame({session:f.session,round:f.plan.round_id,minRev:receipt.game_rev});}if(condition){const secondary=actors.find(a=>f.plan.actors.includes(a.id)&&a.id!==f.plan.primary_member_id);await fillPrivate(secondary,'game-condition-input','SYNTHETIC CONDITION ONE','game-condition-submit');const snapshot=await coherentGame({session:f.session,round:f.plan.round_id});await ownUiRound(secondary,snapshot.fixture,'game-condition-submit');const receipt=await mutationClick(secondary,'game-condition-submit',`/api/v2/rooms/${secondary.room}/game/${f.session}/round/${f.plan.round_id}/condition`);await coherentGame({session:f.session,round:f.plan.round_id,minRev:receipt.game_rev});}return pair;}

async function currentOfferTopics(f){const actual=await service.plan(actors[0].room);assert.equal(actual.session,f.session);assert.equal(actual.plan.round_id,f.plan.round_id);f.data=actual.data;f.plan=actual.plan;assert.equal(typeof f.data.conversation_id,'string');const stored=await service.h.loadObject({room:actors[0].room,session:f.session,id:f.data.conversation_id,kind:'conversation'});return offeredTopics(stored,service.h.source.map);}

function topicReadinessPhase(kind,flowStarted,participants){
 const phases=report.topic_preparation_phases??=[];assert(phases.length<128,'Bounded topic preparation phases overflow');
 const started=performance.now(),phase_id=phases.length+1,record={phase_id,kind,method:'FUNCTIONAL_PREPARATION_PHASES_10',budget_ms:8000,started_monotonic_ms:started,deadline_monotonic_ms:started+8000,flow_started_monotonic_ms:flowStarted,expected_actors:participants.map(a=>a.id),completed_actors:[],failed_actors:[],status:'RUNNING',elapsed_ms:0,total_preparation_elapsed_ms:started-flowStarted};phases.push(record);
 return {started,deadline:started+8000,flow_started:flowStarted,phase_id,kind,record};
}

async function topicUiReady(a,f,minRev,control,stage,step,afterMonotonic=null){
 assert(['topic-accept','private-prompt','advice-accept','advice-text','advice-edit','advice-revoke','pair-chat-messages'].includes(control));assert(Number.isSafeInteger(minRev));
 const observations=report.topic_readiness??=[];if(observations.length>=128){report.topic_readiness_overflow=true;throw Error('Bounded topic readiness diagnostics overflow');}
 const project=observed=>observed?{session_id:observed.session_id,round_id:observed.round_id,round_index:observed.round_index,game_rev:observed.game_rev,state:observed.state,round_state:observed.round_state}:null,matches=observed=>Boolean(uiRoundMatches(observed,f)&&observed.game_rev>=minRev&&observed.state==='active'&&['pending','active'].includes(observed.round_state));
 const row={step,phase_id:stage.phase_id,phase_kind:stage.kind,method:'FUNCTIONAL_PREPARATION_PHASES_10',locale:a.locale,member_id:a.id,expected:{room_id:a.room,session_id:f.session,round_id:f.plan.round_id,round_index:f.plan.round_index,min_game_rev:minRev},preparation_budget_ms:8000,result:'FAILED',observed:project(a.lastGameView),own_scope_matches:matches(a.lastGameView),dom:null,dom_sample:'NOT_OBSERVED'};observations.push(row);
 try{
  if(control!=='advice-revoke')await normalPrivateReady(a,control,{deadline:stage.deadline,expected:{session:f.session,round:f.plan.round_id,minRev,afterMonotonic}});
  const remaining=stage.deadline-performance.now();assert(remaining>0,'Topic preparation phase deadline exhausted');
  await expect.poll(async()=>{
   const observed=a.lastGameView;row.observed=project(observed);
   row.own_scope_matches=matches(observed);
   if(performance.now()>=stage.deadline||!row.own_scope_matches)return false;
   const dom=await a.page.evaluate(({id,index,room})=>{const round=document.querySelector('[data-testid="game-round"]'),el=document.querySelector('[data-testid="'+id+'"]'),visible=node=>Boolean(node&&node.getClientRects().length>0&&window.getComputedStyle(node).visibility!=='hidden');return {own_room_matches:new URLSearchParams(window.location.hash.slice(1)).get('room')===room,round_visible:visible(round),round_index_matches:new RegExp('\\b'+index+'\\s*/').test(round?.textContent??''),control_visible:visible(el),control_enabled:Boolean(el&&!el.matches(':disabled'))};},{id:control,index:f.plan.round_index,room:a.room});
   row.dom=dom;row.dom_sample='OBSERVED';row.same_observation=observed===a.lastGameView;
   return performance.now()<stage.deadline&&row.same_observation&&row.own_scope_matches&&Object.values(dom).every(value=>value===true);
  },{timeout:remaining,intervals:[50,100,250]}).toBe(true);
  assert(performance.now()<stage.deadline,'Topic preparation phase deadline exhausted');row.result='READY';
 }finally{const finished=performance.now();row.preparation_elapsed_ms=finished-stage.started;row.total_preparation_elapsed_ms=finished-stage.flow_started;row.remaining_ms=Math.max(0,stage.deadline-finished);stage.record.completed_actors.push(a.id);if(row.result!=='READY')stage.record.failed_actors.push(a.id);stage.record.elapsed_ms=finished-stage.started;stage.record.total_preparation_elapsed_ms=finished-stage.flow_started;stage.record.status=stage.record.failed_actors.length?'FAIL':stage.record.completed_actors.length===stage.record.expected_actors.length?'READY':'RUNNING';save();}
}

async function acceptTopics(f){const pair=participants(f),other=actors.find(a=>!f.plan.actors.includes(a.id)),topics=await currentOfferTopics(f);let initialMinRev=f.game_rev;for(const a of pair){const view=await read(a,`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/conversation`),labels=expectedOfferLabels(view,topics,a.locale),list=a.page.getByTestId('topic-offer-labels');assert(Number.isSafeInteger(view.game_rev));initialMinRev=Math.max(initialMinRev,view.game_rev);await expect(list).toBeVisible();await expect(list.locator('li')).toHaveCount(labels.length);await expect(list.locator('li')).toHaveText(labels);}for(const a of actors)await expect(a.page.getByTestId('private-prompt')).toHaveCount(0);const flowStarted=performance.now(),firstPhase=topicReadinessPhase('before_first_ack',flowStarted,[pair[0]]);await topicUiReady(pair[0],f,initialMinRev,'topic-accept',firstPhase,'before_first_ack');const firstReceipt=await mutationClick(pair[0],'topic-accept',`/api/v2/rooms/${pair[0].room}/game/${f.session}/round/${f.plan.round_id}/conversation/commands`,'respond_topic');await coherentGame({session:f.session,round:f.plan.round_id,index:f.plan.round_index,minRev:firstReceipt.game_rev});for(const a of actors)await expect(a.page.getByTestId('private-prompt')).toHaveCount(0);const secondPhase=topicReadinessPhase('before_second_ack',flowStarted,[pair[1]]);await topicUiReady(pair[1],f,firstReceipt.game_rev,'topic-accept',secondPhase,'before_second_ack');for(const a of actors)await expect(a.page.getByTestId('private-prompt')).toHaveCount(0);const secondReceipt=await mutationClick(pair[1],'topic-accept',`/api/v2/rooms/${pair[1].room}/game/${f.session}/round/${f.plan.round_id}/conversation/commands`,'respond_topic');await coherentGame({session:f.session,round:f.plan.round_id,index:f.plan.round_index,minRev:secondReceipt.game_rev});const promptPhase=topicReadinessPhase('after_second_commit',flowStarted,pair),prompts=await Promise.allSettled(pair.map(a=>topicUiReady(a,f,secondReceipt.game_rev,'private-prompt',promptPhase,'after_second_ack'))),failedPrompt=prompts.find(result=>result.status==='rejected');if(failedPrompt)throw failedPrompt.reason;for(const a of pair){await expect(a.page.getByTestId('private-prompt')).toContainText('SYNTHETIC '+a.locale.toUpperCase());}await expect(other.page.getByTestId('private-prompt')).toHaveCount(0);await expect(other.page.getByTestId('topic-conversation')).toHaveCount(0);return pair;}

async function adviceMutation(a,control,f,kind,expected={}){
 const path=`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/conversation/commands`;
 const {body,receipt}=await exactUiMutation({page:a.page,path,kind,control,prepare:()=>preparePrivateClick(a,control,path),click:ticket=>click(a,control,ticket),record:event=>recordMutation({locale:a.locale,...event})});
 for(const [key,value] of Object.entries(expected))assert.equal(body[key],value,'Wrong advice command tuple '+key);
 await coherentGame({session:f.session,round:f.plan.round_id,index:f.plan.round_index,minRev:receipt.game_rev});
 const rows=report.advice_mutation_receipts??=[];assert(rows.length<32);rows.push({locale:a.locale,kind,request_id:body.request_id,game_rev:receipt.game_rev,expected_tuple_verified:true,advice_id:body.advice_id??null,proposal_revision:body.proposal_revision??null,epoch:body.epoch??null,replaces_id:body.replaces_id??null,committed_native_ms:performance.now()});return receipt;
}

async function adviceUiReady(participants,f,minRev,control,label,afterMonotonic=null){
 const started=performance.now(),stage=topicReadinessPhase('advice_after_commit:'+label,started,participants);
 const results=await Promise.allSettled(participants.map(a=>topicUiReady(a,f,minRev,control,stage,'advice_'+label,afterMonotonic))),failed=results.find(v=>v.status==='rejected');if(failed)throw failed.reason;
}

async function receivedPendingAdvice(a,f){
 const view=await read(a,`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/conversation`),rows=view.advice.filter(v=>v.direction==='received'&&v.state==='pending');assert.equal(rows.length,1);assert.equal(rows[0].text,undefined,'No received pending advice preview');return rows[0];
}

async function acceptActionsUi(f){
 const pair=participants(f);assert.equal(pair.length,2);const started=performance.now(),deadline=started+12000;
 let minRev=Math.max(f.game_rev,...pair.map(a=>a.lastGameView?.game_rev??-1));assert(Number.isSafeInteger(minRev)&&minRev>=0);
 const phases=report.action_preparation_phases??=[];assert(phases.length<32,'METHOD13_ACTION_PHASE_CAP');const phase={started_monotonic_ms:started,deadline_monotonic_ms:deadline,budget_ms:12000,status:'FAILED',actors:[]};phases.push(phase);
 try{
  for(const a of pair){
   assert(performance.now()<deadline,'METHOD13_ACTION_PHASE_DEADLINE');
   const ticket=await normalPrivateReady(a,'action-accept',{deadline,expected:{session:f.session,round:f.plan.round_id,minRev}});
   const path=`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/response`;
   const {receipt}=await exactUiMutation({page:a.page,path,kind:'accept',scope:'action',control:'action-accept',prepare:async()=>ticket,click:prepared=>click(a,'action-accept',prepared),record:event=>recordMutation({locale:a.locale,...event})});
   assert(Number.isSafeInteger(receipt.game_rev)&&receipt.game_rev>=minRev,'METHOD13_ACTION_RECEIPT_REV');minRev=receipt.game_rev;
   phase.actors.push({member_id:a.id,game_rev:minRev});
  }
  await coherentGame({session:f.session,round:f.plan.round_id,minRev});phase.status='READY';return {minRev};
 }finally{phase.finished_monotonic_ms=performance.now();save();}
}

async function newActor(locale){
 const context=await browser.newContext({ignoreHTTPSErrors:true,locale,reducedMotion:'reduce',viewport}),page=await context.newPage();page.setDefaultTimeout(5000);
 const a={context,page,locale,csrf:'',room:null,id:null,lastGameView:null,lastSelfActions:null,closed:false};
 privateBatches.attach(a);
 page.on('pageerror',e=>{if(report.page_errors.length>=64){report.page_errors_overflow=true;return;}report.page_errors.push({name:e.name,phase});});
 page.on('response',response=>{if(a.closed)return;const path=new URL(response.url()).pathname;if(path.startsWith('/api/')){if(report.request_metadata.length<32768)report.request_metadata.push({phase,method:response.request().method(),route:path.replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/g,':id'),status:response.status()});else report.request_metadata_overflow=true;}});
 try{await page.goto(service.origin);await page.getByTestId('adult18').waitFor();await page.locator(`nav button[lang="${locale}"]`).click();return a;}
 catch(error){a.closed=true;try{await context.close();}finally{await privateBatches.close(a);}throw error;}
}
async function seekPublic(){let snapshot=await coherentGame();const session=snapshot.fixture.session,seen=new Set();for(let n=0;n<20;n++){const f=snapshot.fixture,g=snapshot.view;assert.equal(f.session,session);assert.equal(f.plan.round_index,n+1);assert(!seen.has(f.plan.round_id));seen.add(f.plan.round_id);if(f.plan.interaction!=='pair_private'&&['pending','active'].includes(g.current_round.state))return f;if(!['completed','skipped','stopped'].includes(g.current_round.state)){const a=actors.find(a=>a.id===f.plan.primary_member_id);assert(a);await ownUiRound(a,f,'game-skip');const receipt=await mutationClick(a,'game-skip',`/api/v2/rooms/${a.room}/game/${f.session}/round/${f.plan.round_id}/response`,'skip');snapshot=await coherentGame({session,round:f.plan.round_id,index:f.plan.round_index,minRev:receipt.game_rev});}if(n===19)break;snapshot=await advance(snapshot);}throw Error('No public opportunity within fixed20 actual rounds');}
async function prepareScene(scene,locale){
 assert.equal(actors.length,0);assert(['entry','setup','public_questions','private_offer','private_active','truth_dare_choice','yes_but_condition'].includes(scene));phase=scene;
 for(let i=0;i<(scene==='entry'?1:3);i++)actors.push(await newActor(locale));
 if(scene==='entry'){const cap=await actors[0].context.request.get(service.origin+'/api/v1/runtime-capabilities');assert.equal(cap.status(),200);assert.equal((await cap.json()).room_creation_protocol,2);return {scene,actors,roles:[{role:'entry',actor:actors[0]}],fixture:null};}
 const inviteUrl=await create(actors[0]);for(let i=1;i<actors.length;i++)await joinRoom(actors[i],inviteUrl,i);
 for(const a of actors){const p=await read(a,base(a)+'/me/private-protocol');assert.equal(p.private_protocol,2);}
 if(scene==='setup')return {scene,actors,roles:[{role:'host',actor:actors[0]},{role:'guest',actor:actors[1]}],fixture:null};
 for(const a of actors)await configure(a);const mode=scene==='truth_dare_choice'?'truth_or_dare':scene==='yes_but_condition'?'yes_but':'questions';
 let f;if(scene==='public_questions'){await start(mode);f=await seekPublic();}else f=await startPrivate(mode);
 const primary=actors.find(a=>a.id===f.plan.primary_member_id);assert(primary);
 if(scene==='public_questions'){if(f.plan.interaction==='pair_public')await invite(f);if(f.plan.requires_action_consent)await acceptActionsUi(f);await expect(primary.page.getByTestId('game-prompt')).toBeVisible();return {scene,actors,roles:[{role:'primary',actor:primary},{role:'other',actor:actors.find(a=>a!==primary)}],fixture:f};}
 const pair=await invite(f,{side:scene!=='truth_dare_choice'}),secondary=pair.find(a=>a!==primary),observer=actors.find(a=>!pair.includes(a));assert(secondary&&observer);
 if(scene==='private_active'){
  await acceptTopics(f);if(f.plan.requires_action_consent)await acceptActionsUi(f);
  await fillPrivate(primary,'advice-input','SYNTHETIC LAYOUT ADVICE','advice-offer');let receipt=await adviceMutation(primary,'advice-offer',f,'offer_advice');
  await adviceUiReady([secondary],f,receipt.game_rev,'advice-accept','layout_pending');const pending=await receivedPendingAdvice(secondary,f);
  receipt=await adviceMutation(secondary,'advice-accept',f,'respond_advice',{advice_id:pending.advice_id,proposal_revision:pending.revision,epoch:pending.epoch,decision:'accept'});
  await adviceUiReady(pair,f,receipt.game_rev,'advice-text','layout_accepted');
  await fillPrivate(primary,'pair-chat-input','SYNTHETIC LAYOUT CHAT','pair-chat-send');const chatReceipt=await mutationClick(primary,'pair-chat-send',`/api/v2/rooms/${primary.room}/game/${f.session}/round/${f.plan.round_id}/conversation/chat`);
  await adviceUiReady(pair,f,chatReceipt.game_rev,'pair-chat-messages','layout_chat',performance.now());
  for(const a of pair){await expect(a.page.getByTestId('advice-text')).toContainText('SYNTHETIC LAYOUT ADVICE');await expect(a.page.getByTestId('pair-chat-messages')).toContainText('SYNTHETIC LAYOUT CHAT');}
 }
 if(scene==='truth_dare_choice')await expect(primary.page.getByTestId('game-dare')).toBeEnabled();
 if(scene==='yes_but_condition'){await expect(secondary.page.getByTestId('game-condition-input')).toBeVisible();await fillPrivate(secondary,'game-condition-input','SYNTHETIC LAYOUT CONDITION','game-condition-submit');await expect(secondary.page.getByTestId('game-condition-submit')).toBeEnabled();}
 if(scene==='private_offer')for(const a of pair){await expect(a.page.getByTestId('topic-accept')).toBeEnabled();await expect(a.page.getByTestId('private-prompt')).toHaveCount(0);}
 for(const id of ['pair-invitation','topic-conversation','private-prompt','structured-advice','pair-chat'])await expect(observer.page.getByTestId(id)).toHaveCount(0);
 return {scene,actors,roles:[{role:'primary',actor:primary},{role:'secondary',actor:secondary},{role:'observer',actor:observer}],fixture:f};
}
async function closeScene(){const errors=[];for(const a of actors){a.closed=true;try{await a.context.close();}catch(e){errors.push(e);}try{await privateBatches.close(a);}catch(e){errors.push(e);}}actors=[];if(errors.length)throw new AggregateError(errors,'Scene cleanup failed');}
return {prepareScene,closeScene,actors:()=>actors,service,read,current,mutationClick,coherentGame,report};

}
