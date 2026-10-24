import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {TopicRoomRegistry} from './topic-room-registry.js';
import {TopicRoomLifecycle,TopicRoomLifecycleError} from './topic-room-lifecycle.js';
const room='10000000-0000-4000-8000-000000000001',owner='20000000-0000-4000-8000-000000000001',op='30000000-0000-4000-8000-000000000001';
const pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['topic']};
const birth={incarnation:'40000000-0000-4000-8000-000000000001',minimumSequence:1,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};
// Explicit seam: these tests verify PG bridge ordering/errors, not Linux storage
// durability. Real lifecycle has its own independently reviewed Linux producer.
function fixture() {
 const trace:string[]=[],storage={
  initializeRoom:vi.fn(()=>{trace.push('initialize');return birth;}),
  admitMember:vi.fn(()=>{trace.push('admit');}),assertMember:vi.fn(()=>{trace.push('member');}),
  assertLive:vi.fn(()=>{trace.push('live');}),open:vi.fn(()=>({read:vi.fn(()=>{trace.push('personal-read');}),narrow:vi.fn()})),
  retireMember:vi.fn(),retirementStatus:vi.fn(()=>({state:'live'} as {state:'live'}|{state:'retiring'|'retired';operationId:string;retiredAt:number})),
  retireRoom:vi.fn(()=>{trace.push('retire');}),cleanupPersonal:vi.fn(()=>{trace.push('personal-clean');}),
  cleanupRetiredMetadata:vi.fn(()=>{trace.push('metadata-clean');})
 };
 let protocol=2,missing=false,closed=1000;
 const query=vi.fn(async(sql:string)=>{
  if(sql.includes('LEFT JOIN private_topic_room_births')) return {rows:missing?[]:[{private_protocol:protocol,incarnation:birth.incarnation,minimum_sequence:'1',taxonomy_digest:pins.taxonomy,policy_digest:pins.policy}]};
  if(sql.startsWith('INSERT INTO private_topic_room_births')) {trace.push('insert-birth');return {rows:[]};}
  if(sql.startsWith('SELECT id FROM room_members'))return {rows:[{id:owner}]};
  if(sql.startsWith('SELECT state,closed_at'))return {rows:[{state:'closed',closed_at:new Date(closed)}]};
  throw new Error('Unexpected query');
 });
 const provision=vi.fn(()=>{trace.push('provision');}),topicsChanged=vi.fn(async()=>{});
 const c={query} as unknown as pg.PoolClient,registry=new TopicRoomRegistry({storage:storage as unknown as TopicRoomLifecycle,pins,provision,topicsChanged});
 return {registry,c,trace,storage,query,provision,topicsChanged,setProtocol:(p:number)=>{protocol=p;},missing:()=>{missing=true;},setClosed:(n:number)=>{closed=n;}};
}
describe('protocol2 PG/lifecycle bridge; explicit storage seam',()=>{
 it('publishes external birth and host admission before DB descriptor',async()=>{
  const f=fixture();await f.registry.birth(f.c,room,owner,op,500);
  expect(f.trace).toEqual(['provision','initialize','admit','insert-birth','member']);
 });
 it('does not publish a DB descriptor after durable admission fails',async()=>{
  const f=fixture();f.storage.admitMember.mockImplementation(()=>{throw new Error('disk');});
  await expect(f.registry.birth(f.c,room,owner,op,500)).rejects.toThrow('disk');
  expect(f.query).not.toHaveBeenCalled();
 });
 it('does not silently reuse an orphaned/existing external room',async()=>{
  const f=fixture();f.provision.mockImplementation(()=>{throw new Error('exists');});
  await expect(f.registry.birth(f.c,room,owner,op,500)).rejects.toThrow('exists');expect(f.storage.initializeRoom).not.toHaveBeenCalled();
 });
 it('validates personal authority before admission can return',async()=>{
  const f=fixture();f.storage.open.mockImplementation(()=>{throw new Error('personal-corrupt');});
  await expect(f.registry.admit(f.c,room,owner,op)).rejects.toThrow('personal-corrupt');expect(f.storage.admitMember).toHaveBeenCalledOnce();
 });
 for(const protocol of [1,0,3])it(`never initializes or falls back from unsupported protocol ${protocol}`,async()=>{
  const f=fixture();f.setProtocol(protocol);await expect(f.registry.guard(f.c,room,owner)).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNAVAILABLE'});
  expect(f.provision).not.toHaveBeenCalled();expect(f.storage.open).not.toHaveBeenCalled();
 });
 it('missing DB scope cannot recreate external authority',async()=>{
  const f=fixture();f.missing();await expect(f.registry.guard(f.c,room)).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNAVAILABLE'});expect(f.provision).not.toHaveBeenCalled();
 });
 it('rechecks member retirement at actual synchronous publication',async()=>{
  const f=fixture(),fence=await f.registry.guard(f.c,room,owner);
  f.storage.assertMember.mockImplementation(()=>{throw new TopicRoomLifecycleError('TOPIC_ROOM_MEMBER_RETIRED');});
  expect(fence).toThrow('TOPIC_ROOM_MEMBER_RETIRED');expect(f.storage.open).not.toHaveBeenCalled();
 });
 it('safety guard does not depend on personal preference file readability',async()=>{
  const f=fixture();f.storage.open.mockImplementation(()=>{throw new Error('corrupt');});const fence=await f.registry.guard(f.c,room,owner);expect(fence).not.toThrow();
 });
 for(const state of ['retiring','retired'] as const)it(`recovers the original ${state} intent, not a new retention deadline`,async()=>{
  const f=fixture();f.storage.retirementStatus.mockReturnValue({state,operationId:op,retiredAt:1000});
  const result=await f.registry.retireRoom(f.c,room,'50000000-0000-4000-8000-000000000001',9999);
  expect(result.retiredAt).toBe(1000);expect(f.storage.retireRoom).toHaveBeenCalledWith(room,birth,{operationId:op,retiredAt:1000},{roomTransactionLockHeld:true});
 });
 it('replays interrupted room withdrawal before any member scan',async()=>{
  const f=fixture();f.storage.retirementStatus.mockReturnValue({state:'retiring',operationId:op,retiredAt:1000});
  expect(await f.registry.recovery(f.c,room)).toEqual({retirement:{operationId:op,retiredAt:1000},retiredMembers:[]});expect(f.storage.assertMember).not.toHaveBeenCalled();
 });
 it('replays only authenticated retired members',async()=>{
  const f=fixture();f.storage.assertMember.mockImplementation(()=>{throw new TopicRoomLifecycleError('TOPIC_ROOM_MEMBER_RETIRED');});
  expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([owner]);
 });
 for(const code of ['TOPIC_ROOM_MEMBER_NOT_ADMITTED','TOPIC_ROOM_BIRTH_MISMATCH','TOPIC_ROOM_INVALID'])it(`does not convert ${code} to an ordinary withdrawal`,async()=>{
  const f=fixture();f.storage.assertMember.mockImplementation(()=>{throw new TopicRoomLifecycleError(code);});
  await expect(f.registry.recovery(f.c,room)).rejects.toThrow(code);
 });
 it('requires exact original closed-at before destructive cleanup',async()=>{
  const f=fixture();f.storage.retirementStatus.mockReturnValue({state:'retired',operationId:op,retiredAt:1000});f.setClosed(1001);
  await expect(f.registry.cleanup(f.c,room)).rejects.toMatchObject({code:'TOPIC_RETIREMENT_DB_MISMATCH'});expect(f.storage.cleanupPersonal).not.toHaveBeenCalled();
 });
 it('cannot erase member metadata while personal cleanup failed',async()=>{
  const f=fixture();f.storage.retirementStatus.mockReturnValue({state:'retired',operationId:op,retiredAt:1000});f.storage.cleanupPersonal.mockImplementation(()=>{throw new Error('fsync');});
  await expect(f.registry.cleanup(f.c,room)).rejects.toThrow('fsync');expect(f.storage.cleanupRetiredMetadata).not.toHaveBeenCalled();
 });
 it('cleans personal data before compacting member metadata',async()=>{
  const f=fixture();f.storage.retirementStatus.mockReturnValue({state:'retired',operationId:op,retiredAt:1000});await f.registry.cleanup(f.c,room);
  expect(f.trace).toEqual(['personal-clean','metadata-clean']);
 });
 it('propagates epoch/chat revocation failure instead of a successful no-op',async()=>{
  const f=fixture();f.topicsChanged.mockRejectedValue(new Error('revoke'));await expect(f.registry.revoke(f.c,room,owner)).rejects.toThrow('revoke');
 });
});
