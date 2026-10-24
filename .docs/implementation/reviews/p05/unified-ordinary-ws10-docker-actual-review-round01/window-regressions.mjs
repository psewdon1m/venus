/** Explicit doubles verify producer assertions; not product/transport proof. */
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {installDispatchObserver,observeSuccessfulNarrow} from 'file:///C:/.projects/venus/.artifacts/p05-ordinary-ws/observation.mjs';
const current=readFileSync('.artifacts/p05-ordinary-ws/integration.mjs','utf8'),original=readFileSync('.docs/implementation/reviews/p05/ordinary-ws-round01/integration.mjs','utf8');
const results=[];
function block(source,id){const token=`await check('P05-OWS-${id}',`,start=source.indexOf(token),end=source.indexOf('\n await check(',start+token.length);assert(start>=0&&end>start);return source.slice(start,end).trim();}
async function execute(source,id,scenario){
 const members=Array.from({length:3},(_,i)=>({id:'member-'+i,wire:{frames:[],ws:{readyState:1}}})),shared={room:'room',game:'game',data:{conversation_id:'conversation'},members},first=members[0],grant={roomId:shared.room,memberId:first.id};
 let pending=null,detail,result='NOT_RUN',injected=0;
 const event={eventId:'injected-'+scenario,revision:1,type:'private_conversation_v2',payload:{conversation_id:'conversation',epoch:scenario==='fresh-pending'?2:1,...(scenario==='fresh-pending'?{}:{prompt:{text:'SYNTHETIC_ASSERTION_COUNTEREXAMPLE'}})}};
 const rooms={async dispatchPrivate(g,eventId,enqueue){assert.equal(this,rooms,'Observer must preserve method receiver');if(eventId==='old-ref')return;return enqueue(event,7);}};
 const delivery=installDispatchObserver(rooms),receive=(e)=>{injected++;first.wire.frames.push(JSON.parse(JSON.stringify({schema:1,event_id:e.eventId,stream:'private',stream_rev:e.revision,room_rev:7,audience:'member',type:e.type,room_id:shared.room,target_member_id:first.id,payload:e.payload}))); };
 if(['prequeued','duplicate-id'].includes(scenario))await rooms.dispatchPrivate(grant,event.eventId,e=>{pending=e;});
 class Ledger {narrow(command){assert(command.exclude.includes('topic'));return Object.freeze({revision:2});}}
 const ledger=new Ledger();
 async function inject(){if(scenario==='prequeued')receive(pending);else if(scenario==='unknown-frame')receive(event);else await rooms.dispatchPrivate(grant,event.eventId,receive);}
 const h={rooms,topics:{options:{enabled:true}},call:async()=>{await inject();return {status:503,body:{code:id==='05'?'CATALOG_LEDGER_UNAVAILABLE':'TOPIC_GAMES_DISABLED'}};},round:()=>'/synthetic',pool:{query:async sql=>({rows:sql.includes('event_id FROM topic_game_private_refs')?[{event_id:'old-ref'}]:[sql.includes('presence')?{presence:'online'}:{state:'active'}]})},ok:async()=>({conversation_id:'conversation',epoch:1,offer:{topics:[{topic_id:'topic'}]}}),exclude:async()=>{ledger.narrow({roomId:'room',ownerId:first.id,exclude:['topic']});await inject();return {status:200};},getTopics:async()=>({exclude_topic_ids:['topic']}),loadObject:async()=>({state:{epoch:2}})};
 const context={assert,h,shared,first,delivery,PrivateTopicLedger:Ledger,observeSuccessfulNarrow,actors:()=>members.slice(0,2),freshPrivate:async()=>shared,released:async f=>f,observedGrant:async()=>grant,WebSocket:{OPEN:1},privateFrames:(wire,start=0)=>wire.frames.slice(start).filter(f=>f.stream==='private'),promptFrames:(wire,start=0)=>wire.frames.slice(start).filter(f=>f.stream==='private'&&f.payload?.prompt),sourceFault:()=>({restore(){},assertions:()=>1}),ping:async()=>{},pause:async()=>{},check:async(_id,fn)=>{detail=await fn();result='PASS';}};
 let error=null;try{await vm.runInNewContext('(async()=>{'+block(source,id)+'})()',context);}catch(e){result='REJECTED';error=e.message;}finally{delivery.restore();}
 return {control:id,scenario,result,injected_frames:injected,detail,error};
}
for(const id of ['05','06']){
 const old=await execute(original,id,'active-callback');assert.equal(old.result,'PASS');assert.equal(old.injected_frames,1);results.push({id:'BEFORE-'+id,expected:'PRODUCER_FALSE_NEGATIVE_CONFIRMED',...old});
 for(const scenario of ['active-callback','duplicate-id','unknown-frame']){const fixed=await execute(current,id,scenario);assert.equal(fixed.result,'REJECTED');assert(fixed.error.includes(scenario!=='unknown-frame'?'Private callback enqueue after transition':'Unknown private frame'));results.push({id:'AFTER-'+id+'-'+scenario,expected:'EARLY_LEAK_REJECTED',...fixed});}
 const legitimate=await execute(current,id,'prequeued');assert.equal(legitimate.result,'PASS');assert.equal(legitimate.detail.received_known_pre_boundary_queued_frames,1);results.push({id:'AFTER-'+id+'-prequeued',expected:'LEGITIMATE_PREFAULT_ENQUEUE_ACCEPTED',...legitimate});
}
for(const scenario of ['active-callback','unknown-frame','prequeued','fresh-pending']){const result=await execute(current,'09',scenario);assert.equal(result.result,['prequeued','fresh-pending'].includes(scenario)?'PASS':'REJECTED');results.push({id:'AFTER-09-'+scenario,expected:['prequeued','fresh-pending'].includes(scenario)?'LEGITIMATE_FRAME_ACCEPTED':'EARLY_OLD_PROMPT_REJECTED',...result});}
class ReceiptLedger{narrow(command){if(command.fail)throw Error('EXPECTED_DURABILITY_FAILURE');return command.receipt;}}
const receipt=Object.freeze({revision:8}),ledger=new ReceiptLedger();let markers=0;const restore=observeSuccessfulNarrow(ReceiptLedger,()=>true,()=>{markers++;});assert.equal(ledger.narrow({receipt}),receipt);assert.equal(markers,1);assert.throws(()=>ledger.narrow({fail:true}),/EXPECTED_DURABILITY_FAILURE/);assert.equal(markers,1);restore();
const report={schema_version:1,suite:'OWS_REV_001_ASSERTION_REGRESSION',status:'PASS',actual_product_runtime:false,explicit_doubles_only:true,original_producer_sha256:createHash('sha256').update(original).digest('hex'),corrected_producer_sha256:createHash('sha256').update(current).digest('hex'),checks:results.length+1,results,receipt_identity_and_no_failure_marker:true};writeFileSync('.docs/implementation/reviews/p05/unified-ordinary-ws10-docker-actual-review-round01/window-regression-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
