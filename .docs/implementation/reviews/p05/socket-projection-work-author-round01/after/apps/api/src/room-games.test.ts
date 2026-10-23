import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {RoomGames} from './room-games.js';
import {gameDeliveryFence,type FencedGameView} from './rooms.js';
import {DomainError} from './security.js';
const hooks=()=>({featureAvailable:vi.fn(async()=>true),publicDelivery:vi.fn(async()=>null as FencedGameView|null),locked:vi.fn(async()=>false),memberStateChanged:vi.fn(async()=>{}),removing:vi.fn(async()=>{}),setupCleared:vi.fn(async()=>{}),purge:vi.fn(async()=>{}),socketView:vi.fn(async()=>({game:null,privateEvents:[]})),privateDelivery:vi.fn(async()=>null)});
const methods=['featureAvailable','publicDelivery','locked','memberStateChanged','removing','setupCleared','purge','socketView','privateDelivery'] as const;
function fixture(protocol:number,available=true){const legacy=hooks(),topics=hooks(),query=vi.fn(async()=>({rows:[{private_protocol:protocol}]})),c={query} as unknown as pg.PoolClient;return {legacy,topics,c,router:new RoomGames(legacy,available?topics:null)};}
describe('immutable room protocol game routing',()=>{
 for(const protocol of [1,2])for(const method of methods)it(`protocol${protocol} ${method} never invokes another decoder`,async()=>{
  const f=fixture(protocol),args=[f.c,'room','member','en',0];
  // Arity is immaterial for this dispatch spy: normal callers are statically
  // typed; this table verifies every hook's implementation selection.
  await (f.router[method] as (...v:unknown[])=>Promise<unknown>)(...args);
  expect((protocol===1?f.legacy:f.topics)[method]).toHaveBeenCalledOnce();expect((protocol===1?f.topics:f.legacy)[method]).not.toHaveBeenCalled();
 });
 for(const method of methods)it(`unavailable V2 ${method} cannot fall back to V1`,async()=>{
  const f=fixture(2,false);await expect((f.router[method] as (...v:unknown[])=>Promise<unknown>)(f.c,'room','member','en',0)).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNAVAILABLE'});for(const spy of Object.values(f.legacy))expect(spy).not.toHaveBeenCalled();
 });
 it('unknown protocol fails closed',async()=>{const f=fixture(3);await expect(f.router.locked(f.c,'room')).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNSUPPORTED'});expect(f.legacy.locked).not.toHaveBeenCalled();expect(f.topics.locked).not.toHaveBeenCalled();});
 it('preserves the exact child DTO and non-JSON publication capability',async()=>{
  const f=fixture(2),view={} as FencedGameView,fence=vi.fn();Object.defineProperty(view,gameDeliveryFence,{value:fence});f.topics.publicDelivery.mockResolvedValue(view);
  expect(await f.router.publicDelivery(f.c,'room','en')).toBe(view);expect(view[gameDeliveryFence]).toBe(fence);expect(JSON.stringify(view)).toBe('{}');
 });
 it('cannot conceal source failure by retrying the legacy implementation',async()=>{
  const f=fixture(2);f.topics.publicDelivery.mockRejectedValue(new Error('source'));await expect(f.router.publicDelivery(f.c,'room','en')).rejects.toThrow('source');expect(f.legacy.publicDelivery).not.toHaveBeenCalled();
 });
 for(const method of ['publicDelivery','socketView','privateDelivery'] as const)it(`withholds ${method} on a known content outage while preserving room transport`,async()=>{
  const f=fixture(2);f.topics[method].mockRejectedValue(new DomainError('CATALOG_LEDGER_UNAVAILABLE',503));
  const value=await (f.router[method] as (...args:unknown[])=>Promise<unknown>)(f.c,'room','member','en',0);
  expect(value).toEqual(method==='socketView'?{game:null,privateEvents:[]}:null);expect(f.legacy[method]).not.toHaveBeenCalled();
 });
 for(const error of [new DomainError('AUTH_REQUIRED',401),new DomainError('TOPIC_ROOM_MEMBER_RETIRED',503),new DomainError('TOPIC_LEDGER_UNAVAILABLE',503),new DomainError('TOPIC_HISTORY_INVALID',503),new DomainError('CATALOG_LEDGER_UNAVAILABLE',401),new Error('CATALOG_LEDGER_UNAVAILABLE')])it('does not disguise authority, personal safety, malformed state or untyped failures: '+error.message,async()=>{
  const f=fixture(2);f.topics.socketView.mockRejectedValue(error);await expect(f.router.socketView(f.c,'room','member','en',0)).rejects.toBe(error);
 });
 it('does not change the legacy projection failure contract',async()=>{
  const f=fixture(1),error=new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);f.legacy.publicDelivery.mockRejectedValue(error);
  await expect(f.router.publicDelivery(f.c,'room','en')).rejects.toBe(error);expect(f.topics.publicDelivery).not.toHaveBeenCalled();
 });
 for(const protocol of [1,2])it(`internal private-only projection option forwards only to V2, protocol${protocol}`,async()=>{
  const f=fixture(protocol);await f.router.socketView(f.c,'room','member','en',0,{includePublicGame:false});
  expect((protocol===2?f.topics:f.legacy).socketView).toHaveBeenCalledWith(...(protocol===2?[f.c,'room','member','en',0,{includePublicGame:false}]:[f.c,'room','member','en',0]));
 });
});
