/** Passive observer controls with exact pinned production validators/TopicCache. All transport and DOM are inert. */
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {setImmediate} from 'node:timers';
const {createPrivateBatchObserver}=await import('../../../../../.artifacts/p05-private-batch-browser-producer19/private-batch-observer.mjs');
let clock=1000;const iso=n=>new Date(n).toISOString(),observer=createPrivateBatchObserver({now:()=>clock}),results=[];
const flush=()=>new Promise(done=>setImmediate(done));
function actor(o=observer){const page=new EventEmitter();page.evaluate=async fn=>fn.toString().includes('hasFocus')?{visible:true,focused:true}:true;page.bringToFront=async()=>{};page.url=()=> 'https://fixture/#room=ROOM';page.getByTestId=()=>({isVisible:async()=>true,isEnabled:async()=>true,inputValue:async()=> 'SYNTHETIC INPUT',isChecked:async()=>true});const a={page,room:'ROOM',id:'MEMBER'};o.attach(a);const ws=new EventEmitter();page.emit('websocket',ws);return {a,ws};}
function values({rev=1,round='ROUND',server=100000,conversationServer=server,invitationState='active',invitationExpires=server+180000,advice=[],state='active'}={}){
 const current={session_id:'SESSION',game_rev:rev,state:'active',mode:'questions',total_rounds:20,current_round:{round_id:round,round_index:1,state:'active',kind:'generic'},pause_reason:null};
 const own={schema_version:2,room_id:'ROOM',member_id:'MEMBER',session_id:'SESSION',round_id:round,game_rev:rev,room_rev:1,server_time:iso(server),expires_at:iso(server+5000),session_actions:{pause:true,stop:true,abort:false,resume:false,advance:false,neutral_reset:true,neutral_reset_aborts_game:false},round_actions:{finish:true,skip:true,choose_truth:true,choose_dare:true,propose_condition:true,accept_invitation:true,accept_action:true,decline_invitation:true,withdraw_action:true},conversation_actions:{offer_topic:true,other_question:true,respond_topic:true,offer_advice:true,chat:true}};
 const target={schema_version:2,room_id:'ROOM',session_id:'SESSION',round_id:round,game_rev:rev,content_revision:1,invitation:{offer_id:'OPAQUE_INVITATION',consent_scope:'invitation',proposal_revision:1,own_state:'accepted',state:invitationState,expires_at:iso(invitationExpires)},action:null,choice:null,condition:null};
 const conversation={schema_version:2,room_id:'ROOM',session_id:'SESSION',round_id:round,game_rev:rev,conversation_id:'OPAQUE_CONVERSATION',revision:1,epoch:1,state,server_time:iso(conversationServer),expires_at:iso(conversationServer+180000),offer:{offer_id:'OPAQUE_OFFER',epoch:1,proposal_revision:1,token:'SECRET_TOKEN',topics:[{topic_id:'creative',label:'Synthetic'}],own_accepted:state==='active',expires_at:iso(conversationServer+180000)},advice,...(state==='active'?{prompt:{text:'PRIVATE_SYNTHETIC_TEXT',condition:null,choice:null}}:{})};
 const chat={schema_version:2,conversation_id:'OPAQUE_CONVERSATION',epoch:1,revision:1,state:'active',messages:[]};return {current,own,target,conversation,chat,round};
}
function request(a,kind,round='ROUND'){const path=kind==='current'?'/current':kind==='own'?'/self-actions':`/SESSION/round/${round}/${kind==='chat'?'conversation/chat':kind}`,r={url:()=> 'https://fixture/api/v2/rooms/ROOM/game'+path,method:()=> 'GET'};a.page.emit('request',r);return r;}
async function response(a,r,body,status=200,bodyPromise=null){a.page.emit('response',{request:()=>r,status:()=>status,body:()=>bodyPromise??Promise.resolve(Buffer.from(JSON.stringify(body)))});await flush();}
async function part(a,kind,v,status=200){await response(a,request(a,kind,v.round),status===200?v[kind]:{code:'CONVERSATION_UNAVAILABLE'},status);}
async function cycle(a,v,{omit=[],conversationStatus=200}={}){for(const kind of ['current','own','target','conversation',...(v.conversation.state==='active'?['chat']:[])])if(!omit.includes(kind))await part(a,kind,v,kind==='conversation'?conversationStatus:200);}
async function test(name,fn){await fn();results.push({name,status:'PASS'});}

async function heldCurrent(a,v){let release;const r=request(a,'current');await response(a,r,null,200,new Promise(done=>release=()=>done(Buffer.from(JSON.stringify(v.current)))));return release;}
async function privateParts(a,v){for(const k of ['own','target','conversation','chat'])await part(a,k,v);}

const snapshots=[];
for(const kind of ['malformedJSON','bodyReadFailure']){
 const {a}=actor();await cycle(a,values());
 const req=request(a,'own');
 if(kind==='malformedJSON')await response(a,req,null,200,Promise.resolve(Buffer.from('{')));
 else await response(a,req,null,200,Promise.reject(Error('synthetic body read failure')));
 const snapshot=observer.snapshot(a,{control:'advice-offer'});snapshots.push({kind,snapshot});
 await observer.close(a);
}
{
 const {a}=actor();await cycle(a,values());
 const deny=values();deny.own.conversation_actions.offer_advice=false;
 await part(a,'own',deny);const afterDenial=observer.snapshot(a,{control:'advice-offer'});
 assert.equal(afterDenial.ready,false);
 request(a,'own');const afterNextRefresh=observer.snapshot(a,{control:'advice-offer'});
 snapshots.push({kind:'ownDenialThenAnotherOwnRequest',afterDenial,snapshot:afterNextRefresh});await observer.close(a);
}
console.log(JSON.stringify({scope:'INDEPENDENT_OWN_BODY_AND_DENIAL_COUNTEREXAMPLES',snapshots},null,2));
assert(snapshots.every(x=>!x.snapshot.ready),'NEW_OWN_BODY_FAULT_MUST_NOT_REUSE_OLD_READY_GRANT');
