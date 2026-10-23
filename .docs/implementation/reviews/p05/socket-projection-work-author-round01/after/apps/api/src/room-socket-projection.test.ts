import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {Rooms,gameDeliveryFence,type RoomGameHooks,type FencedGameView} from './rooms.js';
import {type DeletionLedger,type Keyring} from './security.js';
import type {RoomPrivateProtocolHooks} from './room-private-protocol.js';

/** Real Rooms transaction/credential/final-dispatch paths with a deterministic
 * SQL service double. Native PG/filesystem transport proof remains separate. */
function fixture(protocol=2){
 let now=100,expires=150,credentialReads=0,retired=false,expireAtFinal=false;
 const room={id:'room',private_protocol:protocol,state:'open',rev:'1',last_activity_at:new Date(100),meeting_context:'online'},
  member={id:'member',room_id:'room',socket_generation:'1',slot:1,presence:'online',removed_at:null,locale:'en'};
 const checks=vi.fn(()=>{if(retired)throw Error('retired');});
 const guard=vi.fn(async()=>{checks();return checks;});
 const query=vi.fn(async(sql:string,values?:unknown[])=>{
  if(sql.startsWith('SELECT * FROM rooms'))return {rows:[room],rowCount:1};
  if(sql.startsWith('SELECT m.* FROM room_members m JOIN room_sessions'))return {rows:[member],rowCount:1};
  if(sql.startsWith('SELECT offer_version,offer_digest'))return {rows:[{offer_version:'v',offer_digest:'digest'}],rowCount:1};
  if(sql.startsWith('SELECT s.expires_at')){credentialReads++;if(expireAtFinal&&credentialReads===2)now=200;return {rows:[{expires_at:new Date(expires),offer_version:'v',offer_digest:'digest',socket_generation:'1',slot:1}],rowCount:1};}
  if(sql.startsWith('UPDATE room_sessions SET expires_at'))expires=(values![1] as Date).getTime();
  if(sql.startsWith('SELECT m.*,COALESCE'))return {rows:[],rowCount:0};
  return {rows:[],rowCount:0};
 });
 const client={query,release:vi.fn()},pool={connect:vi.fn(async()=>client)} as unknown as pg.Pool;
 const rooms=new Rooms({pool,keys:{} as Keyring,ledger:{contains:()=>false} as unknown as DeletionLedger,origin:'https://fixture.invalid',offer:()=>({version:'v',digest:'digest',text:{ru:'',en:'',tr:''},synthetic:true}),now:()=>now,privateProtocol:{guard} as unknown as RoomPrivateProtocolHooks});
 const child={featureAvailable:vi.fn(async()=>false),socketView:vi.fn(async()=>({game:null,privateEvents:[{eventId:'event',revision:1}]})),publicDelivery:vi.fn(async()=>null as FencedGameView|null)};
 rooms.attachGames(child as unknown as RoomGameHooks);
 const grant={roomId:'room',memberId:'member',generation:1,sessionHash:'session'};
 return {rooms,child,grant,guard,checks,query,revoke:()=>{retired=true;},expireAtFinal:()=>{expireAtFinal=true;}};
}
describe('internal V2 socket projection work selection preserves credential fences',()=>{
 it('default direct caller retains child projection, while private-only asks for private preparation',async()=>{
  const f=fixture();await f.rooms.socketState(f.grant);expect(f.child.socketView).toHaveBeenLastCalledWith(expect.anything(),'room','member','en',0);
  const bundle=await f.rooms.socketState(f.grant,false,9,{projection:'private'});expect(f.child.socketView).toHaveBeenLastCalledWith(expect.anything(),'room','member','en',9,{includePublicGame:false});expect(bundle.privateEvents).toEqual([{eventId:'event',revision:1}]);
 });
 it('V2 heartbeat skips all child projection but renews presence/session and rechecks current authority',async()=>{
  const f=fixture();await f.rooms.liveGrant(f.grant,true);expect(f.child.socketView).not.toHaveBeenCalled();expect(f.guard).toHaveBeenCalledTimes(2);expect(f.checks).toHaveBeenCalledTimes(5);
  expect(f.query.mock.calls.some(([sql])=>sql.startsWith('UPDATE room_members SET'))).toBe(true);expect(f.query.mock.calls.some(([sql])=>sql.startsWith('UPDATE room_sessions SET'))).toBe(true);expect(f.query.mock.calls.some(([sql])=>sql==='COMMIT')).toBe(true);
 });
 it('renewed heartbeat cannot revive the original credential expiring during later IO',async()=>{
  const f=fixture();f.expireAtFinal();await expect(f.rooms.liveGrant(f.grant,true)).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(f.child.socketView).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql==='ROLLBACK')).toBe(true);
 });
 it('V1 ignores V2-only projection selection and keeps legacy heartbeat work unchanged',async()=>{
  const f=fixture(1);await f.rooms.liveGrant(f.grant,true);expect(f.child.socketView).toHaveBeenCalledWith(expect.anything(),'room','member','en',0);expect(f.guard).not.toHaveBeenCalled();
 });
 it('public enqueue still invokes fresh current publication fences rather than a discarded bundle',async()=>{
  const f=fixture(),check=vi.fn(),value={} as FencedGameView;Object.defineProperty(value,gameDeliveryFence,{value:check});f.child.publicDelivery.mockResolvedValue(value);const enqueue=vi.fn();await f.rooms.dispatchGame(f.grant,enqueue);expect(check).toHaveBeenCalledOnce();expect(f.guard).toHaveBeenCalledOnce();expect(enqueue).toHaveBeenCalledWith(value,1);
  f.child.publicDelivery.mockImplementation(async()=>{f.revoke();return value;});enqueue.mockClear();await expect(f.rooms.dispatchGame(f.grant,enqueue)).rejects.toThrow('retired');expect(enqueue).not.toHaveBeenCalled();
 });
});
