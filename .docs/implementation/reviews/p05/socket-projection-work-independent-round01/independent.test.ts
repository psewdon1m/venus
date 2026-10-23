import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {Rooms,gameDeliveryFence,type RoomGameHooks,type FencedGameView} from '../../../../../apps/api/src/rooms.js';
import {type DeletionLedger,type Keyring} from '../../../../../apps/api/src/security.js';
import type {RoomPrivateProtocolHooks} from '../../../../../apps/api/src/room-private-protocol.js';

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

describe('independent no-projection credential and publication boundaries',()=>{
 it('heartbeat final external withdrawal aborts even though child projection is absent',async()=>{
  const f=fixture(),original=f.query.getMockImplementation()!;f.query.mockImplementation(async(sql,values)=>{const result=await original(sql,values);if(sql.startsWith('SELECT m.*,COALESCE'))f.revoke();return result;});
  await expect(f.rooms.liveGrant(f.grant,true)).rejects.toThrow('retired');expect(f.child.socketView).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql==='ROLLBACK')).toBe(true);
 });
 it('fresh socket generation mismatch after renewal refuses heartbeat publication',async()=>{
  const f=fixture(),original=f.query.getMockImplementation()!;let late=false;f.query.mockImplementation(async(sql,values)=>{const result=await original(sql,values);if(sql.startsWith('SELECT m.*,COALESCE'))late=true;if(late&&sql.startsWith('SELECT s.expires_at'))return {rows:[{...result.rows[0],socket_generation:'2'}],rowCount:1};return result;});
  await expect(f.rooms.liveGrant(f.grant,true)).rejects.toMatchObject({code:'SOCKET_REPLACED'});expect(f.child.socketView).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql==='ROLLBACK')).toBe(true);
 });
 it('fresh entry acceptance mismatch after room view refuses heartbeat publication',async()=>{
  const f=fixture(),original=f.query.getMockImplementation()!;let late=false;f.query.mockImplementation(async(sql,values)=>{const result=await original(sql,values);if(sql.startsWith('SELECT m.*,COALESCE'))late=true;if(late&&sql.startsWith('SELECT s.expires_at'))return {rows:[{...result.rows[0],offer_digest:'different'}],rowCount:1};return result;});
  await expect(f.rooms.liveGrant(f.grant,true)).rejects.toMatchObject({code:'ENTRY_REACCEPT_REQUIRED'});expect(f.child.socketView).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql==='ROLLBACK')).toBe(true);
 });
 it('a private ref is not authorization: stale private delivery capability cannot enqueue',async()=>{
  const f=fixture(),event={eventId:'event',revision:1,type:'private_conversation_v2',payload:{text:'SYNTHETIC'}};Object.defineProperty(event,gameDeliveryFence,{value:()=>{throw Error('synthetic consent expired');}});Object.assign(f.child,{privateDelivery:vi.fn(async()=>event)});const enqueue=vi.fn();
  await expect(f.rooms.dispatchPrivate(f.grant,'event',enqueue)).rejects.toThrow('synthetic consent expired');expect(enqueue).not.toHaveBeenCalled();
 });
});
