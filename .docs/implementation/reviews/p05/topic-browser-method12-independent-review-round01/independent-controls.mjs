import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {setTimeout,clearTimeout} from 'node:timers';
import ts from 'file:///C:/.projects/venus/node_modules/typescript/lib/typescript.js';
const out=dirname(fileURLToPath(import.meta.url)),root=process.cwd();
const producer=resolve(root,'.artifacts/p05-private-batch-browser-producer12');
const {exactUiMutation}=await import(pathToFileURL(join(producer,'request-emission.mjs')));
const raw=readFileSync(join(producer,'browser.mjs'),'utf8');
const tree=ts.createSourceFile('browser.mjs',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const functions=Object.fromEntries(tree.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText(tree)]));
const rows=[];
async function check(id,fn){await fn();rows.push({id,status:'PASS'});}
function actor(){return {id:'m',room:'r',lastGameView:{session_id:'s',round_id:'q',round_index:3,game_rev:4,state:'active',round_state:'active'},privateReady:new Map(),privateIntents:new Map(),page:{getByTestId:()=>({inputValue:async()=> 'INTENDED',isChecked:async()=>true})}};}
function context(a,options={}){
 let now=10,cycle=1,calls=0,snapshots=0,doms=0;
 const privateBatches={requireReady:async(_actor,arg)=>{calls++;assert.equal(arg.focus,false);if(options.explicitDeadline)assert.equal(arg.deadline,options.explicitDeadline);if(options.onReady)options.onReady({a,calls,arg});return {ready:true,cycle_id:cycle,lease_remaining_ms:options.lease??90};},snapshot:(_actor,arg)=>{snapshots++;return {ready:options.denySnapshotAt!==snapshots&&arg.expectedScope.rev===a.lastGameView.game_rev&&arg.expectedScope.room===a.room&&arg.expectedScope.member===a.id,cycle_id:cycle,lease_remaining_ms:options.lease??90};}};
 const globals={assert,performance:{now:()=>now},setTimeout,clearTimeout,report:{},save:()=>{},privateBatches,observedOwnStarts:{get:()=>options.ownStart??20},privateDom:async()=>{doms++;if(options.onDom)options.onDom({a,doms});return options.hidden!==true;},delay:async ms=>{now+=ms;},normalPrivateControls:new Set(['action-accept','advice-offer','pair-chat-send'])};
 const f=vm.runInNewContext(functions.expectedPrivateScope+'\n'+functions.normalPrivateReady+'\n'+functions.preparePrivateClick+'\n'+functions.assertPrivateTicket+'\n({normalPrivateReady,preparePrivateClick,assertPrivateTicket,expectedPrivateScope})',globals);
 return {...f,setTime:n=>{now=n;},counts:()=>({calls,snapshots,doms}),globals};
}
await check('lease_bounds_ticket_below_original_absolute_phase',async()=>{const a=actor(),c=context(a,{lease:37,explicitDeadline:200});const t=await c.normalPrivateReady(a,'action-accept',{deadline:200});assert.equal(t.deadline_monotonic_ms,47);assert.equal(t.phase_deadline_monotonic_ms,200);});
await check('exact_snapshot_scope_is_hidden_from_persisted_ticket',async()=>{const a=actor(),c=context(a),t=await c.normalPrivateReady(a,'action-accept',{deadline:100});assert.equal(t.expected.member,'m');assert(!JSON.stringify(t).includes('member'));assert(!JSON.stringify(t).includes('session'));assert(!Object.keys(t).includes('control'));});
await check('private_ticket_denied_when_room_changes',async()=>{const a=actor(),c=context(a),t=await c.normalPrivateReady(a,'action-accept',{deadline:100});a.room='other';assert.throws(()=>c.assertPrivateTicket(a,'action-accept',t),/BATCH_CHANGED/);});
await check('private_ticket_denied_when_actor_changes',async()=>{const a=actor(),c=context(a),t=await c.normalPrivateReady(a,'action-accept',{deadline:100});a.id='other';assert.throws(()=>c.assertPrivateTicket(a,'action-accept',t),/BATCH_CHANGED/);});
await check('private_ticket_wrong_control_denied',async()=>{const a=actor(),c=context(a),t=await c.normalPrivateReady(a,'action-accept',{deadline:100});assert.throws(()=>c.assertPrivateTicket(a,'advice-offer',t),/TICKET_REQUIRED/);});
await check('hidden_dom_never_becomes_private_ready',async()=>{const a=actor(),c=context(a,{hidden:true});await assert.rejects(()=>c.normalPrivateReady(a,'action-accept',{deadline:50}),/PREPARATION_DEADLINE/);assert(c.counts().doms>0);assert.equal(a.privateReady.size,0);});
await check('revision_change_during_dom_reobserves_in_original_deadline',async()=>{const a=actor(),c=context(a,{explicitDeadline:90,onDom:({a,doms})=>{if(doms===1)a.lastGameView={...a.lastGameView,game_rev:5};}});const t=await c.normalPrivateReady(a,'action-accept',{deadline:90});assert.equal(t.expected.rev,5);assert.equal(t.phase_deadline_monotonic_ms,90);assert.equal(c.counts().calls,2);});
await check('post_dom_denial_does_not_issue_ready_ticket',async()=>{const a=actor(),c=context(a,{denySnapshotAt:2});const t=await c.normalPrivateReady(a,'action-accept',{deadline:90});assert.equal(c.counts().calls,2);assert(t.ready);});
await check('wrong_route_session_never_becomes_ready',async()=>{const a=actor(),c=context(a,{explicitDeadline:70});await assert.rejects(()=>c.normalPrivateReady(a,'action-accept',{deadline:70,expected:{session:'foreign'}}),/PREPARATION_DEADLINE/);assert.equal(c.counts().doms,0);});
await check('cleared_checkbox_denied_before_private_batch_wait',async()=>{const a=actor(),c=context(a);a.page.getByTestId=()=>({isChecked:async()=>false});await assert.rejects(()=>c.normalPrivateReady(a,'topic-new',{deadline:90,intendedValue:{control:'offer-topic-creative',value:true}}),/INTENDED_VALUE_CLEARED/);assert.equal(c.counts().calls,0);});
await check('prior_matching_phase_is_consumed_and_never_reset',async()=>{const a=actor(),c=context(a,{explicitDeadline:80});a.privateReady.set('action-accept',{expected:{session:'s',round:'q'},phase_deadline_monotonic_ms:80});const t=await c.preparePrivateClick(a,'action-accept','/api/v2/rooms/r/game/s/round/q/response');assert.equal(t.phase_deadline_monotonic_ms,80);});
await check('old_phase_not_reused_for_new_round',async()=>{const a=actor(),c=context(a,{explicitDeadline:8010});a.privateReady.set('action-accept',{expected:{session:'s',round:'old'},phase_deadline_monotonic_ms:11});const t=await c.preparePrivateClick(a,'action-accept','/api/v2/rooms/r/game/s/round/q/response');assert.equal(t.phase_deadline_monotonic_ms,8010);});
await check('safety_control_bypasses_private_scope_even_if_absent',async()=>{const a=actor(),c=context(a);a.lastGameView=null;for(const id of ['game-stop','game-pause','topic-other','topic-other-exclude','advice-revoke','action-decline','action-withdraw'])assert.equal(await c.preparePrivateClick(a,id),null);assert.equal(c.counts().calls,0);});
await check('inactive_scope_denied_before_observer_wait',async()=>{const a=actor(),c=context(a);a.lastGameView.state='paused';await assert.rejects(()=>c.normalPrivateReady(a,'action-accept',{deadline:80}),/ACTIVE_UI_SCOPE_REQUIRED/);assert.equal(c.counts().calls,0);});
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
async function dispatch(options={}){
 let now=10,clicks=0,event;const rp=deferred(),sp=deferred(),path='/api/v2/rooms/r/game/s/round/q/response';
 const body={request_id:'00000000-0000-4000-8000-000000000001',kind:'accept',scope:'action'};
 const request={url:()=> 'https://fixture.invalid'+path,method:()=> 'POST',postDataJSON:()=>body};
 const response={request:()=>request,status:()=>200,json:async()=>({schema_version:2,game_rev:5,request_id:body.request_id,...options.receipt})};
 let requestPredicate,responsePredicate,requestTimeout,responseTimeout;
 const page={waitForRequest:(fn,o)=>{requestPredicate=fn;requestTimeout=o.timeout;return rp.promise;},waitForResponse:(fn,o)=>{responsePredicate=fn;responseTimeout=o.timeout;return sp.promise;}};
 let result,error;try{result=await exactUiMutation({page,path,kind:'accept',scope:'action',control:'action-accept',prepare:async()=>({deadline_monotonic_ms:50}),now:()=>now,click:async()=>{clicks++;assert(requestPredicate(request));assert(responsePredicate(response));for(const wrong of [{...request,url:()=> 'https://fixture.invalid'+path+'/extra'}, {...request,method:()=> 'PUT'}, {...request,postDataJSON:()=>({...body,scope:'invitation'})}])assert(!requestPredicate(wrong));now=options.emission??49;rp.resolve(request);await Promise.resolve();await Promise.resolve();if(options.rejectResponse)sp.reject(Error('independent receipt timeout'));else sp.resolve(response);},record:e=>{event=e;}});}catch(e){error=e;}
 return {result,error,event,clicks,requestTimeout,responseTimeout};
}
await check('single_request_uses_native_lease_budget_receipt_keeps_15000',async()=>{const v=await dispatch();assert.equal(v.error,undefined);assert.equal(v.requestTimeout,40);assert.equal(v.responseTimeout,15000);assert.equal(v.clicks,1);assert.equal(v.event.result,'EXACT_RECEIPT_VERIFIED');});
await check('native_lease_boundary_is_exclusive_no_click_retry',async()=>{const v=await dispatch({emission:50});assert.match(v.error.message,/EMISSION_OUTSIDE/);assert.equal(v.clicks,1);});
await check('dispatch_without_receipt_is_failure_not_no_dispatch',async()=>{const v=await dispatch({rejectResponse:true});assert.match(v.error.message,/receipt timeout/);assert.equal(v.event.failure,'DISPATCHED_RESPONSE_OR_RECEIPT_FAILURE');assert.equal(v.event.request_observed_monotonic_ms,49);assert.equal(v.clicks,1);});
for(const [name,receipt] of [['schema_string',{schema_version:'2'}],['fractional_rev',{game_rev:2.5}],['missing_uuid',{request_id:undefined}],['nonsafe_revision',{game_rev:2**54}]])await check('receipt_rejects_'+name,async()=>{const v=await dispatch({receipt});assert(v.error);assert.equal(v.clicks,1);});
await check('no_raw_uuid_or_route_scope_in_dispatch_event',async()=>{const v=await dispatch();assert(!JSON.stringify(v.event).includes('00000000-0000-4000-8000-000000000001'));assert.equal(v.event.readiness.deadline_monotonic_ms,50);});
writeFileSync(join(out,'independent-controls.json'),JSON.stringify({status:'PASS',scope:'EXACT_METHOD12_FUNCTIONS_WITH_DECLARED_FAKE_PAGE_OBSERVER_CLOCK_ONLY',checks:rows.length,rows},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',checks:rows.length}));
