import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import type {GameView} from '@venus/contracts';
import {Rooms,gameDeliveryFence,type RoomGameHooks,type FencedGameView} from './rooms.js';
import type {RoomPrivateProtocolHooks} from './room-private-protocol.js';
import {DomainError} from './security.js';
function fixture() {
 let now=100,retired=false,deleted=false,offer={version:'mock',digest:'digest'},generation='7';
 const room={id:'room',private_protocol:2,state:'open',rev:'1',last_activity_at:new Date(0)},member={id:'member',room_id:'room',slot:0,locale:'en',socket_generation:'7'};
 let expiry=1000;
 const hooks={guard:vi.fn(async()=>()=>{if(retired)throw new Error('EXTERNAL_RETIRED');})} as unknown as RoomPrivateProtocolHooks;
 const query=vi.fn(async(sql:string)=>{
  if(sql==='SELECT * FROM rooms WHERE id=$1 FOR UPDATE')return {rows:[room]};
  if(sql.startsWith('SELECT m.*'))return {rows:[member]};
  if(sql.startsWith('SELECT offer_version'))return {rows:[{offer_version:offer.version,offer_digest:offer.digest}]};
  if(sql.startsWith('SELECT s.expires_at'))return {rows:[{expires_at:new Date(expiry),offer_version:'mock',offer_digest:'digest',socket_generation:generation,slot:member.slot}]};
  if(['BEGIN','COMMIT','ROLLBACK'].includes(sql)||sql.startsWith('SELECT pg_advisory'))return {rows:[]};
  throw new Error('Unexpected query '+sql);
 });
 const c={query,release:vi.fn()} as unknown as pg.PoolClient,pool={connect:async()=>c} as unknown as pg.Pool;
 const rooms=new Rooms({pool,keys:{} as Rooms['options']['keys'],ledger:{contains:()=>deleted} as Rooms['options']['ledger'],origin:'https://localhost',offer:()=>({...offer,synthetic:true,text:{en:'',ru:'',tr:''}}),now:()=>now,privateProtocol:hooks});
 const a={room,member,sessionHash:'session'} as Awaited<ReturnType<Rooms['access']>>;
 const grant={roomId:room.id,memberId:member.id,generation:7,sessionHash:'session'};
 return {rooms,room,member,c,query,hooks,a,grant,setNow:(n:number)=>{now=n;},expire:()=>{expiry=99;},retire:()=>{retired=true;},remove:()=>{deleted=true;},changeOffer:()=>{offer={version:'new',digest:'new'};},replaceSocket:()=>{generation='8';}};
}
describe('protocol2 final credential and exact-value delivery fences',()=>{
 it('prepares authority before credential SQL and runs the fresh physical fence only at publication',async()=>{
  const f=fixture(),trace:string[]=[],physical=vi.fn(()=>{trace.push('physical');});
  f.hooks.prepareGuard=vi.fn(async()=>{trace.push('prepare');return physical;});
  const original=f.query.getMockImplementation()!;f.query.mockImplementation(async sql=>{const value=await original(sql);if(sql.startsWith('SELECT s.expires_at'))trace.push('credential-read');return value;});
  const fence=await f.rooms.finalAccessFence(f.c,f.a);expect(trace).toEqual(['prepare','credential-read']);expect(f.hooks.guard).not.toHaveBeenCalled();expect(physical).not.toHaveBeenCalled();
  fence();expect(trace).toEqual(['prepare','credential-read','physical']);
 });
 it('prepared final fence rejects withdrawal during the credential SQL await',async()=>{
  const f=fixture();f.hooks.prepareGuard=vi.fn(async()=>()=>{if(retired())throw new Error('EXTERNAL_RETIRED');});
  let withdrawn=false;const retired=()=>withdrawn,original=f.query.getMockImplementation()!;
  f.query.mockImplementation(async sql=>{const value=await original(sql);if(sql.startsWith('SELECT s.expires_at'))withdrawn=true;return value;});
  const fence=await f.rooms.finalAccessFence(f.c,f.a);expect(fence).toThrow('EXTERNAL_RETIRED');expect(f.hooks.guard).not.toHaveBeenCalled();
 });
 it('does not fall back to eager guard when the trusted prepared builder fails',async()=>{
  const f=fixture(),failure=new Error('BIRTH_UNAVAILABLE');f.hooks.prepareGuard=vi.fn(async()=>{throw failure;});
  await expect(f.rooms.finalAccessFence(f.c,f.a)).rejects.toBe(failure);expect(f.hooks.guard).not.toHaveBeenCalled();expect(f.query).not.toHaveBeenCalled();
 });
 it('keeps eager legacy hooks when no prepared builder is provided',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a);expect(f.hooks.guard).toHaveBeenCalledWith(f.c,f.room.id,f.member.id);f.retire();expect(fence).toThrow('EXTERNAL_RETIRED');
 });
 it('rechecks clock at invocation rather than capturing the earlier clock',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a);f.setNow(1000);expect(fence).toThrow(expect.objectContaining({code:'AUTH_REQUIRED'}));
 });
 it('rechecks external withdrawal after the last awaited SQL read',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a);f.retire();expect(fence).toThrow('EXTERNAL_RETIRED');
 });
 it('does not make safety actions depend on current offer acceptance',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a,true);f.changeOffer();expect(fence).not.toThrow();
 });
 it('normal delivery requires the current offer at actual publication',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a);f.changeOffer();expect(fence).toThrow(expect.objectContaining({code:'ENTRY_REACCEPT_REQUIRED'}));
 });
 it('retains room deletion and idle expiry fences even for safety actions',async()=>{
  const f=fixture(),fence=await f.rooms.finalAccessFence(f.c,f.a,true);f.remove();expect(fence).toThrow(expect.objectContaining({code:'ROOM_CLOSED'}));
 });
 for(const cut of ['child-expiry','sql-expiry','socket','withdrawal','child-fence'] as const)it(`does not enqueue a public game across ${cut}`,async()=>{
  const f=fixture(),enqueue=vi.fn(),ownFence=vi.fn(()=>{if(cut==='child-fence')throw new Error('TOPIC_EPOCH_CHANGED');});
  const view=Object.assign({} as GameView,{[gameDeliveryFence]:ownFence});
  f.rooms.attachGames({publicDelivery:async()=>{if(cut==='child-expiry')f.setNow(1000);if(cut==='socket')f.replaceSocket();if(cut==='withdrawal')f.retire();return view;}} as unknown as RoomGameHooks);
  if(cut==='sql-expiry'){const original=f.query.getMockImplementation()!;f.query.mockImplementation(async sql=>{const value=await original(sql);if(sql.startsWith('SELECT s.expires_at'))f.setNow(1000);return value;});}
  await expect(f.rooms.dispatchGame(f.grant,enqueue)).rejects.toBeDefined();expect(enqueue).not.toHaveBeenCalled();expect(f.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
 });
 it('rejects a child DTO without its exact publication capability',async()=>{
  const f=fixture(),enqueue=vi.fn();f.rooms.attachGames({publicDelivery:async()=>({})} as unknown as RoomGameHooks);
  await expect(f.rooms.dispatchGame(f.grant,enqueue)).rejects.toMatchObject({code:'GAME_DELIVERY_FENCE_REQUIRED'});expect(enqueue).not.toHaveBeenCalled();
 });
 it('invokes the exact DTO fence after the final SQL and immediately before enqueue',async()=>{
  const f=fixture(),trace:string[]=[],view={} as FencedGameView;
  Object.defineProperty(view,gameDeliveryFence,{value:()=>{trace.push('child-fence');}});
  const original=f.query.getMockImplementation()!;f.query.mockImplementation(async sql=>{const value=await original(sql);if(sql.startsWith('SELECT s.expires_at'))trace.push('credential-read');return value;});
  f.rooms.attachGames({publicDelivery:async()=>view} as unknown as RoomGameHooks);
  await f.rooms.dispatchGame(f.grant,()=>{trace.push('enqueue');});expect(trace).toEqual(['credential-read','child-fence','enqueue']);expect(JSON.stringify(view)).toBe('{}');
 });
 it('cannot use protocol2 without its mandatory external lifecycle implementation',async()=>{
  const f=fixture(),rooms=new Rooms({...f.rooms.options,privateProtocol:undefined});
  await expect(rooms.finalAccessFence(f.c,f.a)).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNAVAILABLE'});expect(f.query).not.toHaveBeenCalled();
 });
 for(const kind of ['public','private'] as const)it(`suppresses ${kind} enqueue on a known content outage after the final credential await`,async()=>{
  const f=fixture(),enqueue=vi.fn(),late=new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);
  const value=Object.assign(kind==='public'?{}:{eventId:'event',revision:1,type:'private',payload:{text:'MUST_NOT_ENQUEUE'}},{[gameDeliveryFence]:()=>{throw late;}});
  f.rooms.attachGames({publicDelivery:async()=>value,privateDelivery:async()=>value} as unknown as RoomGameHooks);
  if(kind==='public')await f.rooms.dispatchGame(f.grant,enqueue);else await f.rooms.dispatchPrivate(f.grant,'event',enqueue);
  expect(enqueue).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql.startsWith('SELECT s.expires_at'))).toBe(true);
  expect(f.query.mock.calls.at(-1)?.[0]).toBe('COMMIT');
 });
 for(const kind of ['public','private'] as const)it(`does not suppress ${kind} parent authority failure even if its code resembles a content outage`,async()=>{
  const f=fixture(),enqueue=vi.fn(),error=new DomainError('CATALOG_LEDGER_UNAVAILABLE',503),value=Object.assign({},{[gameDeliveryFence]:vi.fn()});
  f.rooms.attachGames({publicDelivery:async()=>value,privateDelivery:async()=>value} as unknown as RoomGameHooks);f.hooks.guard=vi.fn(async()=>{throw error;});
  if(kind==='public')await expect(f.rooms.dispatchGame(f.grant,enqueue)).rejects.toBe(error);else await expect(f.rooms.dispatchPrivate(f.grant,'event',enqueue)).rejects.toBe(error);
  expect(enqueue).not.toHaveBeenCalled();expect(value[gameDeliveryFence]).not.toHaveBeenCalled();expect(f.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
 });
});
