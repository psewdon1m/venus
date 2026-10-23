import {beforeEach,describe,it,expect,vi} from 'vitest';
import {proposeConsent,consentResponse} from '@venus/relationship-engine';
import {TopicGames} from './topic-games.js';
import {gameDeliveryFence,type Rooms} from './rooms.js';
import {DomainError} from './security.js';

// Execute real preparation/delivery methods; object storage and SQL are doubles.
// Actual PostgreSQL/ACL/WS behavior is checked by the separate Docker suites.
const objects=vi.hoisted(()=>({values:new Map<string,unknown>(),writes:0}));
vi.mock('./topic-game-model.js',async original=>({...await original<typeof import('./topic-game-model.js')>(),
 loadTopicObject:async(_c:unknown,_k:unknown,s:{id:string})=>structuredClone(objects.values.get(s.id)??null),
 storeTopicObject:async(_c:unknown,_k:unknown,s:{id:string},value:unknown)=>{objects.writes++;objects.values.set(s.id,structuredClone(value));return objects.writes;}
}));
beforeEach(()=>{objects.values.clear();objects.writes=0;});
function fixture(){
 let now=1000,source=true,present=true,stream=0;
 const names=[{id:'a',display_name:'A'},{id:'b',display_name:'B'}],order:string[]=[];
 const invitation=proposeConsent('invitation',['a','b'],'invitation',now),reference={offer_id:invitation.offer_id,scope:invitation.scope,proposal_revision:1};
 const active=consentResponse(consentResponse(invitation,'a','accept',now,reference),'b','accept',now,reference);
 const rooms={now:()=>now,options:{keys:{}}} as unknown as Rooms;
 const games=new TopicGames(rooms,{enabled:true,source:{active:async()=>null,pinned:async()=>{throw Error('unused');},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('unused');},excludeLocked:async()=>{throw Error('unused');},assertCurrent:()=>{}}});
 const conv={state:{revision:1,epoch:1,clock_floor:now,parent_expires_at:181000,offer:{expires_at:181000},advice:[] as {text:string|null;state:string;expires_at:number}[]}};
 const loaded={game:{room_id:'room',id:'session',rev:'1',state:'active'},row:{id:'round'},data:{boot_id:games.bootId,state:'active',clock_floor:now,invitation:active},safety:{room_id:'room',revision:1,members:[]},snapshot:{baseline:{players:[{id:'a'},{id:'b'}]}}};
 Object.defineProperty(loaded.game,gameDeliveryFence,{value:()=>{if(!source)throw new DomainError('SOURCE_UNAVAILABLE',503);}});
 const dto=vi.fn(async()=>({schema_version:2,room_id:'room',session_id:'session',round_id:'round',game_rev:Number(loaded.game.rev),conversation_id:'conversation',revision:conv.state.revision,epoch:conv.state.epoch,state:'active',server_time:new Date(now).toISOString(),expires_at:new Date(181000).toISOString(),advice:[],prompt:{text:'PRIVATE',condition:null,choice:null}}));
 Object.assign(games,{actor:async()=>{order.push('actor');},reconcile:async()=>{order.push('reconcile');conv.state.clock_floor=now;return true;},conversation:async()=>conv,names:async()=>names,dto});
 const c={query:async(sql:string)=>{if(sql.includes('SELECT m.presence'))return {rows:['a','b'].map((_,i)=>({presence:present?'online':'offline',slot:i,removed_at:null,heartbeat_at:new Date(now),reserved_until:new Date(181000)}))};if(sql.startsWith('UPDATE game_private_streams'))return {rows:[{rev:String(++stream)}]};return {rows:[]};}};
 const prepare=Reflect.get(games,'prepareProjection') as (...args:unknown[])=>Promise<unknown>,delivery=Reflect.get(games,'prepared') as (...args:unknown[])=>Promise<Record<symbol,()=>void>&{server_time:string;expires_at:string}>;
 return {games,loaded,conv,names,order,dto,setNow:(n:number)=>now=n,setSource:(v:boolean)=>source=v,setPresent:(v:boolean)=>present=v,stream:()=>stream,
 prepare:(member='a',locale='en')=>prepare.call(games,c,loaded,member,locale),deliver:(member='a',locale='en')=>delivery.call(games,c,loaded,member,locale),stored:()=>objects.values.get('a') as {expires_at:number;member_id:string;locale:string;boot_id:string}};
}
describe('private projection reuse without renewed authority',()=>{
 it('reconciles every read but avoids unchanged projection/stream writes',async()=>{const f=fixture();await f.prepare();const expiry=f.stored().expires_at;f.setNow(2000);await f.prepare();expect(f.dto).toHaveBeenCalledTimes(1);expect(objects.writes).toBe(1);expect(f.stream()).toBe(1);expect(f.stored().expires_at).toBe(expiry);expect(f.conv.state.clock_floor).toBe(2000);expect(f.order).toEqual(['actor','reconcile','actor','reconcile']);});
 it('recomputes a near-expiry projection and emits a fresh reference',async()=>{const f=fixture();await f.prepare();f.setNow(4000);await f.prepare();expect(f.dto).toHaveBeenCalledTimes(2);expect(f.stream()).toBe(2);expect(f.stored().expires_at).toBe(9000);});
 it('uses fresh server time at delivery while keeping absolute consent expiry',async()=>{const f=fixture();await f.prepare();f.setNow(2000);const v=await f.deliver();expect(v.server_time).toBe(new Date(2000).toISOString());expect(v.expires_at).toBe(new Date(181000).toISOString());expect(f.stored().expires_at).toBe(6000);});
 it('recomputes for locale, public display-name and conversation changes',async()=>{const f=fixture();await f.prepare();await f.prepare('a','tr');f.names[0]!.display_name='New name';await f.prepare('a','tr');f.conv.state.revision++;await f.prepare('a','tr');f.conv.state.epoch++;await f.prepare('a','tr');expect(f.dto).toHaveBeenCalledTimes(5);});
 it('recomputes after game revision, safety revision or legacy metadata changes',async()=>{const f=fixture();await f.prepare();f.loaded.game.rev='2';await f.prepare();f.loaded.safety.revision++;await f.prepare();const p=f.stored();Reflect.deleteProperty(p,'locale');objects.values.set('a',p);await f.prepare();expect(f.dto).toHaveBeenCalledTimes(4);});
 it('does not share a prepared view between private participants',async()=>{const f=fixture();await f.prepare('a');await f.prepare('b');expect(f.dto).toHaveBeenCalledTimes(2);expect(objects.values.size).toBe(2);});
 it('rejects locale or name changes between preparation and delivery',async()=>{const f=fixture();await f.prepare();await expect(f.deliver('a','tr')).rejects.toMatchObject({code:'TOPIC_DELIVERY_STALE'});f.names[0]!.display_name='Changed';await expect(f.deliver()).rejects.toMatchObject({code:'TOPIC_DELIVERY_STALE'});});
 it('rejects older boot or member metadata rather than trusting its payload',async()=>{const f=fixture();await f.prepare();const p=f.stored();p.member_id='b';objects.values.set('a',p);await expect(f.deliver()).rejects.toMatchObject({code:'TOPIC_DELIVERY_STALE'});p.member_id='a';p.boot_id='old';objects.values.set('a',p);await expect(f.deliver()).rejects.toMatchObject({code:'TOPIC_DELIVERY_STALE'});});
 it('keeps source/presence/clock/expiry fences active on reused views',async()=>{const f=fixture();await f.prepare();f.setNow(2000);await f.prepare();const view=await f.deliver();f.setSource(false);expect(()=>view[gameDeliveryFence]!()).toThrowError(expect.objectContaining({code:'SOURCE_UNAVAILABLE'}));f.setSource(true);f.setPresent(false);await expect(f.deliver()).rejects.toMatchObject({code:'ACTORS_UNAVAILABLE'});f.setPresent(true);f.setNow(999);await expect(f.deliver()).rejects.toMatchObject({code:'TOPIC_DELIVERY_EXPIRED'});f.setNow(6000);await expect(f.deliver()).rejects.toMatchObject({code:'TOPIC_DELIVERY_EXPIRED'});});
});
