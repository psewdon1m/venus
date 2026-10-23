/** Cold fake only: actual positive helper code, no PG/Docker/native corpus. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const version=process.argv[2];assert(['old01','new02'].includes(version));
const {createPositives}=await import(version==='old01'?'../p05-public-wire-adjunct01/positive.mjs':'./positive.mjs');
const counts={setups:0,joins:0,starts:0,skips:0,advances:0},rooms=new Map(),setupAttempts=[];
const h={
 async create(){const id='room-'+(++counts.setups),f={room:id,host:{id:'host-'+id,room:id},game:'game-'+id,index:1};rooms.set(id,f);return f;},
 async joinRoom(f){return {id:'peer-'+(++counts.joins),room:f.room};},
 roomPath:f=>'/room/'+f.room,base:f=>'/game/'+f.room,round:f=>'/round/'+f.room+'/'+f.index,
 async roomView(){return {room_rev:1};},async putTopics(){},
 async current(f){f.plan={interaction:'solo',primary_member_id:f.host.id,round_id:'round-'+f.index};return {rev:f.index+(f.completed?1:0),state:f.completed?'completed':'active'};},
 async ok(actor,path,_method='GET',body){
  assert(['GET','PUT','POST'].includes(_method));
  const f=rooms.get(actor.room);assert(f);
  if(path.endsWith('/me/preferences'))return {rev:1};
  if(path.endsWith('/prepare'))return {game_rev:1};
  if(path.endsWith('/start')){counts.starts++;return {};}
  if(path.endsWith('/response')){assert.equal(body.kind,'skip');counts.skips++;return {};}
  if(path.endsWith('/round/advance')){counts.advances++;if(f.index===20)f.completed=true;else f.index++;return {};}
  throw Error('UNDECLARED_FAKE_PATH');
 }
};
const helper=createPositives({h,capture:{label(){},async http(){throw Error('UNEXPECTED_HTTP');}},fixtures:[],ordinary:async()=>{},acceptInvitations:async()=>{throw Error('UNEXPECTED_PRIVATE');},acceptTopic:async()=>{throw Error('UNEXPECTED_PRIVATE');},until:async()=>{throw Error('UNEXPECTED_WAIT');},assert,randomUUID,requiredPublic:[],extraChecks:[],setupAttempts});
let reason=null;try{await helper.run('truth_or_dare','online','TD-online');assert.fail('No-draw fixture cannot complete');}catch(error){reason=error.message;}
assert.equal(reason,'No private opportunity in exactly3declared20round setup attempts');
assert.deepEqual(counts,{setups:3,joins:6,starts:3,skips:60,advances:60});assert.equal(setupAttempts.length,3);assert(setupAttempts.every(x=>x.status==='NO_PRIVATE_DRAW'&&x.round_bound===20));assert([...rooms.values()].every(f=>f.completed));
console.log(JSON.stringify({status:'PASS_FAITHFUL_FINAL_ADVANCE_NO_DRAW_BOUND',version,reason,counts,completed_setups:3,setupAttempts,actual_transport:false}));
