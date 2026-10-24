import {describe,it,expect,vi} from 'vitest';
import {applyPrivateConversation,consentResponse,digest,proposeConsent,type PrivateConversation} from '@venus/relationship-engine';
import {TopicGames} from '../../apps/api/src/topic-games.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
import type {StoredConversation} from '../../apps/api/src/topic-game-model.js';

/** Native API lifecycle/FSM; persistence, target authorization and transactions
 * are explicit doubles. This is not PostgreSQL/transport acceptance. */
function fixture(interaction='pair_private'){
 let now=1000,member='bob';
 const games=new TopicGames({now:()=>now,options:{}} as unknown as Rooms,{enabled:true,privateTextChat:true,
  source:{active:async()=>null,pinned:async()=>{throw Error('unused');},assertCurrent:()=>{}},
  safety:{read:async()=>{throw Error('unused');},excludeLocked:async()=>{throw Error('unused');},assertCurrent:()=>{}}});
 const actors=['alice','bob'];let invitation=proposeConsent('invitation',actors,'invitation',now);
 for(const id of actors)invitation=consentResponse(invitation,id,'accept',now,{offer_id:'invitation',scope:'invitation',proposal_revision:1});
 const card={id:'YB-TEST',revision:1,mode:'yes_but',text:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,{proposal:'Synthetic proposal',responder:'Synthetic responder'}]))};
 const data={plan:{interaction,actors,primary_member_id:'alice',requires_action_consent:true,card:{card_id:card.id,card_revision:1,card_sha256:digest(card)}},
  state:'pending',boot_id:games.bootId,clock_floor:1000,invitation,action:null,choice:null,condition:null,content_revision:1,conversation_id:'conversation'};
 const game={id:'session',room_id:'room',rev:'3',mode:'yes_but',state:'active'},row={id:'round'},
  map={pins:{map_sha256:'2'.repeat(64),taxonomy_digest:'3'.repeat(64)},topics:[{topic_id:'creative',labels:{ru:'Творчество',en:'Creative',tr:'Yaratıcılık'}}],entry:()=>({topic_ids:['creative']})},
  safety={members:actors.map(member_id=>({member_id,revision:1,allow_topic_ids:['creative'],excluded_topic_ids:[]}))},
  loaded={game,row,data,map,safety,snapshot:{baseline:{context:'online',capabilities:['private_text_chat']}},pack:{digest:'1'.repeat(64),card:()=>card}};
 let stored:StoredConversation|null=null;
 const saveConversation=vi.fn(async(_c:unknown,_l:unknown,state:PrivateConversation,bindings:StoredConversation['bindings'])=>{stored={schema_version:2,state,bindings};});
 const saveRound=vi.fn(),unpack=Reflect.get(games,'unpack'),auth=()=>({member:{id:member},room:{id:'room',rev:'1'}});
 Object.assign(games,{mutation:async(...args:unknown[])=>(args.at(-1) as (c:unknown,a:unknown)=>unknown)({},auth()),target:async()=>loaded,
  actor:async(_c:unknown,_g:unknown,_r:unknown,id:string,role?:string)=>{if(!actors.includes(id)||role&&id!==(role==='secondary'?'bob':'alice'))throw Error('ROUND_ACTOR_REQUIRED');},
  conversation:async()=>stored?unpack.call(games,stored,loaded):null,saveConversation,saveRound});
 return {games,data,game,saveConversation,saveRound,get stored(){return stored;},setNow:(n:number)=>now=n,setMember:(id:string)=>member=id,
  begin:()=>Reflect.get(games,'beginConversation').call(games,{},loaded),
  command:(text='Synthetic condition')=>games.condition('room','credential','session','round',{request_id:'request',expected_rev:3,text}),
  finish:()=>games.finish('room','credential','session','round',{request_id:'request',expected_rev:3}),
  own:()=>Reflect.get(games,'selfActionsValue').call(games,auth(),{g:game,r:{row,data},member:true,host:false,role:member==='bob'?'secondary':'primary',ordinary:true,l:loaded,conv:stored?unpack.call(games,stored,loaded):null},true),
  acceptTopics:()=>{for(const actor of actors){const o=stored!.state.offer!,r=applyPrivateConversation(stored!.state,{kind:'respond_topic',offer_id:o.offer_id,epoch:o.epoch,proposal_revision:o.proposal_revision,token:o.token,decision:'accept'},{scope:stored!.state.scope,actor,now});expect(r.error).toBeNull();stored={...stored!,state:r.state};}}
 };
}


import {DomainError} from '../../apps/api/src/security.js';

describe('independent private YesBut boundaries',()=>{
 it('first condition after45s keeps original parent expiry and starts exactly one fresh offer',async()=>{const f=fixture();const parent=f.data.invitation.active_until;f.setNow(45000);await f.command('Late first condition');expect(f.stored!.state.topic_attempts).toBe(1);expect(f.stored!.state.last_offer_at).toBe(45000);expect(f.stored!.state.parent_expires_at).toBe(parent);expect(f.stored!.state.offer).toMatchObject({state:'pending',acks:[],expires_at:75000});expect(f.data.action).toBeNull();});
 it('expired parent denies first condition before any content/storage change',async()=>{const f=fixture(),before=JSON.stringify(f.data);f.setNow(181000);await expect(f.command()).rejects.toMatchObject({code:'CONDITION_NOT_AVAILABLE'});expect(JSON.stringify(f.data)).toBe(before);expect(f.saveConversation).not.toHaveBeenCalled();expect(f.saveRound).not.toHaveBeenCalled();});
 it('stale revision denies before first content/epoch creation',async()=>{const f=fixture(),before=JSON.stringify(f.data);f.game.rev='4';await expect(f.command()).rejects.toMatchObject({code:'REVISION_CONFLICT'});expect(JSON.stringify(f.data)).toBe(before);expect(f.stored).toBeNull();});
 it('missing already-required conversation does not become optional first-condition absence',async()=>{const f=fixture();await f.command();f.setNow(6000);const before=JSON.stringify(f.data);Object.assign(f.games,{conversation:async()=>null});await expect(f.command('Cannot recreate')).rejects.toMatchObject({code:'CONVERSATION_UNAVAILABLE'});expect(JSON.stringify(f.data)).toBe(before);});
 it('condition replacement revokes already-accepted advisory text without retaining its consent',async()=>{const f=fixture();await f.command();f.acceptTopics();let s=f.stored!.state;const o=s.offer!;let v=applyPrivateConversation(s,{kind:'offer_advice',epoch:s.epoch,topic_offer_id:o.offer_id,advice_id:'advice',text:'Synthetic prior advice'},{scope:s.scope,actor:'alice',now:1001});expect(v.error).toBeNull();s=v.state;const advice=s.advice[0]!;v=applyPrivateConversation(s,{kind:'respond_advice',epoch:s.epoch,advice_id:advice.advice_id,revision:advice.revision,decision:'accept'},{scope:s.scope,actor:'bob',now:1002});expect(v.error).toBeNull();Reflect.set(f.stored!,'state',v.state);f.setNow(6000);await f.command('New scope');expect(f.stored!.state.advice.every(a=>a.text===null&&a.state==='revoked')).toBe(true);expect(f.stored!.state.offer).toMatchObject({state:'pending',acks:[]});});
 it('real mutation wrapper rolls back late DomainError writes before time-maintenance and stores no success receipt',async()=>{
  let db={condition:'old',epoch:1,clock_floor:1000},saved=JSON.parse(JSON.stringify(db)),inserted=0;const calls:string[]=[];
  const query=async(sql:string)=>{calls.push(sql);if(sql.startsWith('SELECT private_protocol'))return{rows:[{private_protocol:2}]};if(sql.startsWith('SELECT operation'))return{rows:[]};if(sql.startsWith('SELECT count'))return{rows:[{count:'0'}]};if(sql==='SAVEPOINT topic_operation')saved=JSON.parse(JSON.stringify(db));else if(sql==='ROLLBACK TO SAVEPOINT topic_operation')db=JSON.parse(JSON.stringify(saved));else if(sql.startsWith('INSERT'))inserted++;return{rows:[]};};
  const auth={member:{id:'bob'},room:{id:'room'}},rooms={now:()=>181000,options:{keys:{}},access:async()=>auth,transaction:async(fn:(c:unknown)=>Promise<unknown>)=>fn({query}),finalAccessFence:async()=>()=>{}} as unknown as Rooms;
  const games=new TopicGames(rooms,{enabled:true,source:{active:async()=>null,pinned:async()=>{throw Error('unused');},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('unused');},excludeLocked:async()=>{throw Error('unused');},assertCurrent:()=>{}}});
  Object.assign(games,{persistTimeFailure:async()=>{calls.push('TIME_MAINTENANCE');db.clock_floor=181000;}});
  const promise=Reflect.get(games,'mutation').call(games,'room','credential',{request_id:'11111111-1111-4111-8111-111111111111'},'condition',{},false,async()=>{db.condition='partial';db.epoch++;throw new DomainError('CLOSED',409);});
  await expect(promise).rejects.toMatchObject({code:'CLOSED',statusCode:409});expect(db).toEqual({condition:'old',epoch:1,clock_floor:181000});expect(inserted).toBe(0);expect(calls.indexOf('ROLLBACK TO SAVEPOINT topic_operation')).toBeLessThan(calls.indexOf('TIME_MAINTENANCE'));
 });
});
