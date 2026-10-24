import {describe,it,expect,vi} from 'vitest';
import {TopicGames} from './topic-games.js';
import type {Rooms} from './rooms.js';

/** Real capability/command methods; transaction/auth/source are isolated doubles.
 * Actual browser08 separately reproduces the advertised-action 409. */
function fixture(now=5999,attempts=1){
 const games=new TopicGames({now:()=>now,options:{}} as unknown as Rooms,{enabled:true,
  source:{active:async()=>null,pinned:async()=>{throw Error('unused');},assertCurrent:()=>{}},
  safety:{read:async()=>{throw Error('unused');},excludeLocked:async()=>{throw Error('unused');},assertCurrent:()=>{}}});
 const state={state:'open',epoch:2,revision:3,clock_floor:1000,parent_expires_at:181000,
  topic_attempts:attempts,last_offer_at:1000,offer:{state:'pending',offer_id:'offer',epoch:2,proposal_revision:1,token:'a'.repeat(64),expires_at:31000,acks:[]},
  scope:{actors:['alice','bob']},preferences:{alice:{revision:1,allow:['creative'],excluded:[]},bob:{revision:1,allow:['creative'],excluded:[]}}};
 const game={id:'session',room_id:'room',rev:'3',state:'active',mode:'questions'},data={state:'active',boot_id:games.bootId,clock_floor:1000,plan:{interaction:'pair_private',actors:['alice','bob']},invitation:null,action:null};
 const loaded={game,data,map:{topics:[{topic_id:'creative'}],pins:{}},safety:{members:['alice','bob'].map(member_id=>({member_id,revision:1,allow_topic_ids:['creative'],excluded_topic_ids:[]}))}};
 const conv={state,stored:{bindings:[]}},context={g:game,r:{row:{id:'round'},data},member:true,host:false,role:'primary',ordinary:true,l:loaded,conv,presence:undefined};
 const a={member:{id:'alice'},room:{id:'room',rev:'1'}},save=vi.fn(),replace=vi.fn(()=>{throw Error('Replacement must not be attempted');});
 Object.assign(games,{mutation:async(...args:unknown[])=>(args.at(-1) as (c:unknown,a:unknown)=>unknown)({},a),target:async()=>loaded,conversation:async()=>conv,replaceCandidate:replace,saveConversation:save,saveRound:save,saveHistory:save});
 return {games,state,save,replace,setNow:(n:number)=>{now=n;},own:()=>Reflect.get(games,'selfActionsValue').call(games,a,context,true),
  command:()=>games.conversationCommand('room','credential','session','round',{request_id:'request',kind:'offer_topic',expected_epoch:2,topic_ids:['creative']})};
}

describe('topic offer capability agrees with the native throttle',()=>{
 it('keeps the new-topic action unavailable until the unchanged five-second boundary',()=>{
  const f=fixture();expect(f.own().conversation_actions.offer_topic).toBe(false);
  f.setNow(6000);expect(f.own().conversation_actions.offer_topic).toBe(true);
 });
 it('does not advertise a fourth topic attempt',()=>{const f=fixture(6000,3);expect(f.own().conversation_actions.offer_topic).toBe(false);});
 it('returns the captured restriction when the clock crosses the boundary during a command',async()=>{
  const f=fixture();let now=5999;Object.assign(f.games.rooms,{now:()=>now++});
  await expect(f.command()).resolves.toMatchObject({deferred_error:'RATE_LIMIT',status:409});
  expect(f.replace).not.toHaveBeenCalled();expect(f.save).not.toHaveBeenCalled();
 });
 for(const [now,attempts,code] of [[5999,1,'RATE_LIMIT'],[6000,3,'LIMIT']] as const)it('rejects '+code+' before replacing or invalidating the current offer',async()=>{
  const f=fixture(now,attempts),before=JSON.stringify(f.state);
  await expect(f.command()).resolves.toMatchObject({deferred_error:code,status:409});
  expect(JSON.stringify(f.state)).toBe(before);expect(f.replace).not.toHaveBeenCalled();expect(f.save).not.toHaveBeenCalled();
 });
});
