import fs from 'node:fs';
const out='.docs/implementation/reviews/p05/socket-projection-work-independent-round01',source=fs.readFileSync('.docs/implementation/reviews/p05/socket-projection-work-author-round01/after/apps/api/src/room-socket-projection.test.ts','utf8');
const fixture=source.slice(0,source.indexOf("describe('internal V2 socket projection work" )).replaceAll("from './", "from '../../../../../apps/api/src/");
const cases=String.raw`
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
`;
fs.writeFileSync(out+'/independent.test.ts',fixture+cases);
