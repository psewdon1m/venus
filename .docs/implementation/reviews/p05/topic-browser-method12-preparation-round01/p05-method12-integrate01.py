from pathlib import Path
import hashlib
r=Path.cwd();base=r/'.artifacts/p05-advice-browser-producer11-r2';out=r/'.artifacts/p05-private-batch-browser-producer12'
p=out/'browser.mjs';assert p.read_bytes()==(base/'browser.mjs').read_bytes()
s=p.read_bytes().decode('utf8');nl='\r\n' if '\r\n' in s else '\n'
def once(a,b):
    global s
    assert s.count(a)==1,a[:100];s=s.replace(a,b)
once("import {runtime} from './runtime.mjs';","import {runtime} from './runtime.mjs';"+nl+"import {createPrivateBatchObserver} from './private-batch-observer.mjs';"+nl+"import {exactUiMutation} from './request-emission.mjs';")
once("browser_method_revision:'ADVICE_RECEIPT_PHASES_11_TOPIC_PHASES_10'","browser_method_revision:'PRIVATE_BATCH_PREPARATION_12_ADVICE_11_TOPIC_PHASES_10'")
once('const delivery=createDeliveryDiagnostics(loadFrontendValidators());','const delivery=createDeliveryDiagnostics(loadFrontendValidators());'+nl+"const privateBatches=createPrivateBatchObserver({sourceRoot:'/app'});"+nl+"const normalPrivateControls=new Set(['pair-accept','action-accept','topic-accept','topic-new','advice-offer','advice-accept','advice-edit','pair-chat-send','game-condition-submit']);")
once(' delivery.attach(a);',' delivery.attach(a);privateBatches.attach(a);')
old=next(line for line in s.splitlines() if line.startswith('async function click(a,id)'))
helpers=r'''function expectedPrivateScope(a,expected={}){
 const view=a.lastGameView;assert(view&&view.state==='active'&&['pending','active'].includes(view.round_state),'METHOD12_ACTIVE_UI_SCOPE_REQUIRED');
 return {room:a.room,member:a.id,session:expected.session??view.session_id,round:expected.round??view.round_id,minRev:expected.minRev??view.game_rev};
}
function privateDom(a,id,index){return a.page.evaluate(({id,index,room})=>{const round=document.querySelector('[data-testid="game-round"]'),el=document.querySelector('[data-testid="'+id+'"]'),visible=node=>Boolean(node&&node.getClientRects().length>0&&window.getComputedStyle(node).visibility!=='hidden');return document.visibilityState==='visible'&&new URLSearchParams(window.location.hash.slice(1)).get('room')===room&&visible(round)&&new RegExp('\\b'+index+'\\s*/').test(round.textContent??'')&&visible(el)&&!el.matches(':disabled');},{id,index,room:a.room});}
async function normalPrivateReady(a,control,{deadline=performance.now()+8000,expected={},intendedValue=null}={}){
 const started=performance.now(),wanted=expectedPrivateScope(a,expected),row={control,started_monotonic_ms:started,phase_deadline_monotonic_ms:deadline,status:'FAILED',observer_model_only:true,cache_accept_observed:false};
 const rows=report.private_preparation??=[];assert(rows.length<256,'METHOD12_PREPARATION_RECORD_CAP');rows.push(row);let last=null;
 try{
  if(intendedValue){const field=a.page.getByTestId(intendedValue.control),value=typeof intendedValue.value==='boolean'?await field.isChecked():await field.inputValue();assert.equal(value,intendedValue.value,'METHOD12_INTENDED_VALUE_CLEARED_BEFORE_PREPARATION');}
  while(performance.now()<deadline){
   const ready=await privateBatches.requireReady(a,{control,deadline,focus:false,expectedScope:{room:wanted.room,member:wanted.member,session:wanted.session,round:wanted.round},intendedValue});last=ready;
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
 }finally{row.finished_monotonic_ms=performance.now();row.last_snapshot=last;save();}
}
async function preparePrivateClick(a,control,path=null){
 if(!normalPrivateControls.has(control))return null;
 const match=path?.match(/\/game\/([^/]+)\/round\/([^/]+)\//),expected=match?{session:match[1],round:match[2]}:{},wanted=expectedPrivateScope(a,expected),prior=a.privateReady?.get(control),intent=a.privateIntents?.get(control);
 a.privateReady?.delete(control);
 const samePrior=prior&&prior.expected.session===wanted.session&&prior.expected.round===wanted.round;
 return normalPrivateReady(a,control,{deadline:samePrior?prior.phase_deadline_monotonic_ms:performance.now()+8000,expected:wanted,intendedValue:intent?.scope.session===wanted.session&&intent?.scope.round===wanted.round?intent.field:null});
}
function assertPrivateTicket(a,id,ticket){
 assert(ticket&&ticket.control===id,'METHOD12_PRIVATE_TICKET_REQUIRED');assert(performance.now()<ticket.deadline_monotonic_ms,'METHOD12_PRIVATE_TICKET_EXPIRED');const current=privateBatches.snapshot(a,{control:id,expectedScope:ticket.expected});assert(current.ready&&current.cycle_id===ticket.cycle_id,'METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK');
}
async function click(a,id,prepared=null){
 const ticket=normalPrivateControls.has(id)?prepared??await preparePrivateClick(a,id):null;
 report.last_control={phase,locale:a.locale,member_id:a.id,control:id,started_monotonic_ms:performance.now()};save();const l=a.page.getByTestId(id);await expect(l).toBeVisible();await expect(l).toBeEnabled();if(ticket)assertPrivateTicket(a,id,ticket);await l.click(ticket?{timeout:Math.max(1,Math.min(15000,ticket.deadline_monotonic_ms-performance.now()))}:{});
}
async function fillPrivate(a,id,value,submit){
 const deadline=performance.now()+8000,ticket=await normalPrivateReady(a,id,{deadline});await a.page.getByTestId(id).fill(value);assertPrivateTicket(a,id,ticket);await expect(a.page.getByTestId(id)).toHaveValue(value);a.privateIntents??=new Map();a.privateIntents.set(submit,{scope:ticket.expected,field:{control:id,value}});a.privateReady.set(submit,Object.defineProperties({...ticket},{expected:{value:ticket.expected},control:{value:submit}}));
}
async function choosePrivate(a,id,submit){const ticket=await normalPrivateReady(a,id);await a.page.getByTestId(id).check();assertPrivateTicket(a,id,ticket);a.privateIntents??=new Map();a.privateIntents.set(submit,{scope:ticket.expected,field:{control:id,value:true}});a.privateReady.set(submit,Object.defineProperties({...ticket},{expected:{value:ticket.expected},control:{value:submit}}));}
function recordMutation(event){const rows=report.mutation_dispatches??=[];assert(rows.length<256,'METHOD12_MUTATION_RECORD_CAP');rows.push({locale:event.locale??null,...event});}
'''
once(old,helpers.strip().replace('\n',nl))
old=next(line for line in s.splitlines() if line.startswith('async function mutationClick(a,control'))
once(old,"async function mutationClick(a,control,path,kind,scope,afterClick){const {receipt}=await exactUiMutation({page:a.page,path,kind,scope,control,prepare:()=>preparePrivateClick(a,control,path),click:ticket=>click(a,control,ticket),afterClick,record:event=>recordMutation({locale:a.locale,...event})});return receipt;}")
once("  const remaining=stage.deadline-performance.now();assert(remaining>0,'Topic preparation phase deadline exhausted');","  await normalPrivateReady(a,control,{deadline:stage.deadline,expected:{session:f.session,round:f.plan.round_id,minRev}});"+nl+"  const remaining=stage.deadline-performance.now();assert(remaining>0,'Topic preparation phase deadline exhausted');")
once("assert(['topic-accept','private-prompt','advice-accept','advice-text','advice-edit','advice-revoke'].includes(control));","assert(['topic-accept','private-prompt','advice-accept','advice-text','advice-edit','advice-revoke','pair-chat-messages'].includes(control));")
# Revoke remains a safety control; its existing method11 UI check gets no normal-action guard.
once('  await normalPrivateReady(a,control,{deadline:stage.deadline,expected:{session:f.session,round:f.plan.round_id,minRev}});',"  if(control!=='advice-revoke')await normalPrivateReady(a,control,{deadline:stage.deadline,expected:{session:f.session,round:f.plan.round_id,minRev}});")
old=" const pending=a.page.waitForResponse(response=>new URL(response.url()).pathname===path&&response.request().method()==='POST'&&response.request().postDataJSON()?.kind===kind);pending.catch(()=>{});"+nl+" await click(a,control);const response=await pending;assert.equal(response.status(),200,'Exact advice mutation must commit');"+nl+" const body=response.request().postDataJSON(),receipt=await response.json();assert.equal(receipt.request_id,body.request_id);assert.equal(receipt.schema_version,2);assert(Number.isSafeInteger(receipt.game_rev));"
new=" const {body,receipt}=await exactUiMutation({page:a.page,path,kind,control,prepare:()=>preparePrivateClick(a,control,path),click:ticket=>click(a,control,ticket),record:event=>recordMutation({locale:a.locale,...event})});"
once(old,new)
replacements=[("await secondary.page.getByTestId('game-condition-input').fill('SYNTHETIC CONDITION ONE');","await fillPrivate(secondary,'game-condition-input','SYNTHETIC CONDITION ONE','game-condition-submit');"),("await sender.page.getByTestId('advice-input').fill('SYNTHETIC ADVICE ONE');","await fillPrivate(sender,'advice-input','SYNTHETIC ADVICE ONE','advice-offer');"),("await sender.page.getByTestId('advice-input').fill('SYNTHETIC ADVICE TWO');","await fillPrivate(sender,'advice-input','SYNTHETIC ADVICE TWO','advice-offer');"),("await sender.page.getByTestId('pair-chat-input').fill('SYNTHETIC EPOCH CHAT');await click(sender,'pair-chat-send');","await fillPrivate(sender,'pair-chat-input','SYNTHETIC EPOCH CHAT','pair-chat-send');const chatReceipt=await mutationClick(sender,'pair-chat-send',`/api/v2/rooms/${sender.room}/game/${q.session}/round/${q.plan.round_id}/conversation/chat`);await adviceUiReady([receiver],q,chatReceipt.game_rev,'pair-chat-messages','chat_committed');"),("await pair[0].page.getByTestId('offer-topic-creative').check();","await choosePrivate(pair[0],'offer-topic-creative','topic-new');"),("await secondary.page.getByTestId('game-condition-input').fill('SYNTHETIC CONDITION TWO');","await fillPrivate(secondary,'game-condition-input','SYNTHETIC CONDITION TWO','game-condition-submit');"),("await pair[0].page.getByTestId('pair-chat-input').fill('SYNTHETIC CLOCK CHAT');await click(pair[0],'pair-chat-send');","await fillPrivate(pair[0],'pair-chat-input','SYNTHETIC CLOCK CHAT','pair-chat-send');const chatReceipt=await mutationClick(pair[0],'pair-chat-send',`/api/v2/rooms/${pair[0].room}/game/${f.session}/round/${f.plan.round_id}/conversation/chat`);await adviceUiReady([pair[1]],f,chatReceipt.game_rev,'pair-chat-messages','clock_chat_committed');")]
for a,b in replacements:once(a,b)
once("try{await browser?.close();}catch(e){errors.push(e.name);}","for(const a of actors)try{await privateBatches.close(a);}catch(e){errors.push(e.name);}try{await browser?.close();}catch(e){errors.push(e.name);}")
p.write_bytes(s.encode('utf8'));print('method12 prospective integrated',hashlib.sha256(p.read_bytes()).hexdigest())
