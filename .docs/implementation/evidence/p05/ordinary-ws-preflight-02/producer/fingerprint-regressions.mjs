/** OWS-REV-002 exact assertion counterexamples; explicit doubles, not product leakage. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {installDispatchObserver} from './observation.mjs';
import {installDispatchObserver as oldObserver} from '../../.docs/implementation/reviews/p05/ordinary-ws-round02/observation.mjs';
const results=[];
const clone=value=>JSON.parse(JSON.stringify(value));
async function run(install,variant){
 const actor={id:'synthetic-own',wire:{frames:[]}},f={room:'synthetic-room',members:[actor]},grant={roomId:f.room,memberId:actor.id},event={eventId:'synthetic-event',revision:3,type:'private_conversation_v2',payload:{conversation_id:'synthetic-conversation',epoch:1,prompt:{text:'SYNTHETIC ORIGINAL'},...(variant==='undefined-positive'?{optional:undefined}:{})}},frame={schema:1,event_id:event.eventId,stream:'private',stream_rev:event.revision,room_rev:7,type:event.type,room_id:f.room,target_member_id:actor.id,audience:'member',payload:clone(event.payload)};
 const rooms={async dispatchPrivate(_g,_id,enqueue){assert.equal(this,rooms);return enqueue(event,7);}},observer=install(rooms);await rooms.dispatchPrivate(grant,event.eventId,()=>{});
 if(variant==='two-enqueues-two-late')await rooms.dispatchPrivate(grant,event.eventId,()=>{});
 if(variant==='already-received-replay')actor.wire.frames.push(clone(frame));
 const window=observer.begin(f);window.activate();
 if(variant==='payload-text')frame.payload.prompt.text='SYNTHETIC ALTERED';
 if(variant==='foreign-target')frame.target_member_id='synthetic-foreign';
 if(variant==='foreign-room')frame.room_id='synthetic-foreign-room';
 if(variant==='wrong-audience')frame.audience='room';
 if(variant==='wrong-schema')frame.schema=2;
 if(variant==='wrong-stream')frame.stream='room';
 if(variant==='wrong-type')frame.type='forged';
 if(variant==='wrong-event-id')frame.event_id='unrecorded';
 if(variant==='wrong-stream-rev')frame.stream_rev++;
 if(variant==='wrong-room-rev')frame.room_rev++;
 if(variant==='extra-payload-field')frame.payload.unapproved_text='SYNTHETIC EXTRA';
 actor.wire.frames.push(clone(frame));if(['two-late-one-enqueue','two-enqueues-two-late'].includes(variant))actor.wire.frames.push(clone(frame));
 let status='PASS',detail,error=null;try{detail=window.assertComplete();}catch(e){status='REJECTED';error=e.message;}finally{observer.restore();}return {variant,status,detail,error};
}
const negatives=['payload-text','foreign-target','foreign-room','wrong-audience','wrong-schema','wrong-stream','wrong-type','wrong-event-id','wrong-stream-rev','wrong-room-rev','extra-payload-field','already-received-replay','two-late-one-enqueue'];
for(const variant of negatives){const before=await run(oldObserver,variant),after=await run(installDispatchObserver,variant);assert.equal(after.status,'REJECTED',variant+' must reject');if(['payload-text','foreign-target','foreign-room','wrong-audience','already-received-replay','two-late-one-enqueue'].includes(variant))assert.equal(before.status,'PASS',variant+' old false-negative must reproduce');results.push({variant,before,after,expected:'REJECTED',fixed:true});}
for(const variant of ['legitimate-one-late','undefined-positive','two-enqueues-two-late']){const before=await run(oldObserver,variant),after=await run(installDispatchObserver,variant);assert.equal(after.status,'PASS',variant+' legitimate delivery must pass');results.push({variant,before,after,expected:'PASS',fixed:true});}
const file='.artifacts/p05-ordinary-ws/observation.mjs',report={schema_version:1,suite:'OWS_REV_002_ASSERTION_REGRESSION',status:'PASS',checks:results.length,explicit_doubles_only:true,actual_product_runtime:false,original_observer_sha256:createHash('sha256').update(readFileSync('.docs/implementation/reviews/p05/ordinary-ws-round02/observation.mjs')).digest('hex'),corrected_observer_sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),no_private_text_in_observer_records:true,results};writeFileSync('.artifacts/p05-ordinary-ws/fingerprint-regression-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
