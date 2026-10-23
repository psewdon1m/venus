import {describe,it,expect,vi} from 'vitest';
import {randomBytes,randomUUID} from 'node:crypto';
import type pg from 'pg';
import {Rooms} from './rooms.js';
import {Keyring,hash,type Cipher} from './security.js';
import {PrivateTopicPreferences,type PrivateTopicLifecycle,type TopicRoomBirth,type PrivateTopicView} from './private-topic-preferences.js';
import type {TopicNarrowing,TopicSafetyState} from './private-topic-ledger.js';
import {createApp} from './app.js';

// Explicit DB/auth/ledger doubles exercise adapter ordering and projections.
// Actual PostgreSQL, fsync, HTTP auth and restore are separate integration gates.
function fixture() {
 const room=randomUUID(),owner=randomUUID(),other=randomUUID(),keys=new Keyring('v1',{v1:randomBytes(32).toString('base64')});
 const pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['food','music']};
 const birth:TopicRoomBirth={incarnation:randomUUID(),minimumSequence:1,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};
 let now=1000,expiry=100000,protocol=2,missingBirth=false,offerVersion='test',externalLive=true,revoked=false;
 const order:string[]=[],requests=new Map<string,string>(),preferences=new Map<string,{rev:string;cipher:Cipher}>();
 const safety=new Map<string,TopicSafetyState>();let sequence=1;
 const state=(id=owner)=>safety.get(id)??{roomId:room,ownerId:id,incarnation:birth.incarnation,sequence,revision:0,taxonomy:pins.taxonomy,policy:pins.policy,excluded:[]};
 const read=vi.fn(({roomId,ownerId}:{roomId:string;ownerId:string})=>{expect(roomId).toBe(room);return {...state(ownerId),sequence};});
 const narrow=vi.fn((command:TopicNarrowing)=>{
  order.push('durable-narrow');const current=state(command.ownerId);expect(command.expectedRevision).toBe(current.revision);
  const value={...current,sequence:++sequence,revision:current.revision+1,excluded:[...new Set([...current.excluded,...command.exclude])].sort()};safety.set(command.ownerId,value);
  return {...value,operationSequence:sequence,operationRevision:value.revision,replayed:false};
 });
 const query=vi.fn(async(text:string,values:unknown[]=[])=>{
  if(text.startsWith('SELECT private_protocol')) return {rows:[{private_protocol:protocol}]};
  if(text.startsWith('SELECT incarnation'))return {rows:missingBirth?[]:[{incarnation:birth.incarnation,minimum_sequence:String(birth.minimumSequence),taxonomy_digest:birth.taxonomy_digest,policy_digest:birth.policy_digest}]};
  if(text.startsWith('SELECT rev,cipher'))return {rows:preferences.has(values[1] as string)?[preferences.get(values[1] as string)]:[]};
  if(text.startsWith('SELECT request_hash'))return {rows:requests.has(values[2] as string)?[{request_hash:requests.get(values[2] as string)}]:[]};
  if(text.startsWith('SELECT count'))return {rows:[{count:String(requests.size)}]};
  if(text.startsWith('INSERT INTO private_topic_preferences')) {order.push('db-publish');preferences.set(values[1] as string,{rev:String(values[2]),cipher:values[3] as Cipher});return {rows:[]};}
  if(text.startsWith('INSERT INTO private_topic_requests')) {requests.set(values[2] as string,values[3] as string);return {rows:[]};}
  if(text.startsWith('SELECT s.member_id'))return {rows:revoked?[]:[{member_id:owner,expires_at:new Date(expiry),offer_version:offerVersion,offer_digest:'d'}]};
  throw new Error('Unexpected SQL '+text);
 });
 const c={query} as unknown as pg.PoolClient;
 const auth={room:{id:room,state:'open',last_activity_at:new Date(0)},member:{id:owner},sessionHash:hash('credential')};
 const ledger={contains:()=>false};
 const rooms={options:{keys,ledger,origin:'https://localhost',offer:()=>({version:'test',digest:'d'})},now:()=>now,csrf:()=> 'csrf',rateLimit:vi.fn(async()=>{}),
  access:vi.fn(async(_c:unknown,id:string,credential:string|undefined)=>{if(id!==room||credential!=='credential')throw new Error('AUTH_REQUIRED');return auth;}),
  transaction:async<T>(operation:(client:pg.PoolClient)=>Promise<T>)=>{
   const previousPreferences=new Map(preferences),previousRequests=new Map(requests);
   try {return await operation(c);}catch(error){preferences.clear();for(const [key,value] of previousPreferences)preferences.set(key,value);requests.clear();for(const [key,value] of previousRequests)requests.set(key,value);throw error;}
  }} as unknown as Rooms;
 const lifecycle:PrivateTopicLifecycle={open:vi.fn(()=>({read,narrow})),assertLive:vi.fn(()=>{if(!externalLive)throw new Error('RETIRED');}),revoke:vi.fn(async()=>{order.push('revoke');})};
 const service=new PrivateTopicPreferences(rooms,lifecycle,pins);
 const put=(allow:string[],exclude:string[]=[],expected=0,id=randomUUID())=>service.put(room,'credential',{request_id:id,expected_rev:expected,taxonomy_digest:pins.taxonomy,allow_topic_ids:allow,exclude_topic_ids:exclude});
 const exclude=(topics:string[],id=randomUUID())=>service.exclude(room,'credential',{request_id:id,taxonomy_digest:pins.taxonomy,topic_ids:topics});
 const get=async()=>{let view:PrivateTopicView|undefined;await service.dispatch(room,'credential',v=>{view=v;});return view!;};
 return {room,owner,other,keys,pins,birth,rooms,service,lifecycle,query,preferences,requests,safety,state,read,narrow,order,put,exclude,get,auth,
  setNow:(value:number)=>{now=value;},setExpiry:(value:number)=>{expiry=value;},setProtocol:(value:number)=>{protocol=value;},
  noBirth:()=>{missingBirth=true;},retire:()=>{externalLive=false;},revokeAuth:()=>{revoked=true;},reaccept:()=>{offerVersion='old';}};
}
describe('private topic settings adapter bounded preflight',()=>{
 it('starts empty, reads only authenticated owner and has no SQL writes',async()=>{
  const f=fixture();f.safety.set(f.other,{...f.state(f.other),revision:7,excluded:['food']});
  const value=await f.get();expect(value.allow_topic_ids).toEqual([]);expect(value.exclude_topic_ids).toEqual([]);expect(value.owner_member_id).toBe(f.owner);
  expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);expect(f.narrow).not.toHaveBeenCalled();
 });
 it('stores padded encrypted settings and no public room events',async()=>{
  const f=fixture(),value=await f.put(['music','food']);expect(value.allow_topic_ids).toEqual(['food','music']);expect(value.rev).toBe(1);
  const raw=JSON.stringify(f.preferences.get(f.owner));expect(raw).not.toContain('music');expect(raw).not.toContain('food');
  expect(Buffer.from(f.preferences.get(f.owner)!.cipher.data,'base64')).toHaveLength(16384);expect(f.order).toEqual(['revoke','db-publish']);
 });
 it('durably narrows before revoke/SQL publication; old encrypted DB state cannot remove exclusion',async()=>{
  const f=fixture();await f.put(['food','music']);const old=new Map(f.preferences);
  f.order.length=0;const result=await f.exclude(['music']);expect(result.allow_topic_ids).toEqual(['food']);expect(f.order).toEqual(['durable-narrow','revoke','db-publish']);
  f.preferences.clear();for(const [id,row] of old)f.preferences.set(id,row);
  const restored=await f.get();expect(restored.allow_topic_ids).toEqual(['food']);expect(restored.exclude_topic_ids).toEqual(['music']);expect(restored.safety_revision).toBe(1);
 });
 it('leaves stricter durable state after a failed DB mutation',async()=>{
  const f=fixture();await f.put(['music']);vi.mocked(f.lifecycle.revoke).mockRejectedValueOnce(new Error('DB_UNAVAILABLE'));
  await expect(f.exclude(['music'])).rejects.toThrow('DB_UNAVAILABLE');expect(f.preferences.get(f.owner)!.rev).toBe('1');
  expect((await f.get()).allow_topic_ids).toEqual([]);expect((await f.get()).exclude_topic_ids).toEqual(['music']);
 });
 it('cannot re-enable excluded topics and requires explicit removal intent',async()=>{
  const f=fixture();await f.put(['food','music']);await expect(f.put(['food'],[],1)).rejects.toMatchObject({code:'EXPLICIT_TOPIC_EXCLUSION_REQUIRED'});
  await f.exclude(['music']);await expect(f.put(['food','music'],[],2)).rejects.toMatchObject({code:'TOPIC_EXCLUSION_PERMANENT'});
 });
 it('unversioned safety exclusion survives a foreign newer preferences revision',async()=>{
  const f=fixture();await f.put(['food']);await f.put(['food','music'],[],1);await expect(f.put(['food'],['music'],1)).rejects.toMatchObject({code:'REVISION_CONFLICT'});
  expect((await f.exclude(['music'])).exclude_topic_ids).toEqual(['music']);
 });
 it('replays same request as current stricter state without repeating grant/revoke mutation',async()=>{
  const f=fixture(),id=randomUUID();await f.put(['food','music'],[],0,id);await f.exclude(['music']);f.order.length=0;
  const replay=await f.put(['food','music'],[],0,id);expect(replay.allow_topic_ids).toEqual(['food']);expect(replay.rev).toBe(2);expect(f.order).toEqual([]);
  await expect(f.put(['food'],[],0,id)).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});
 });
 for(const protocol of [1,0,3])it(`rejects non-V2 protocol ${protocol} without initializing external files`,async()=>{
  const f=fixture();f.setProtocol(protocol);await expect(f.get()).rejects.toMatchObject({code:'PRIVATE_TOPICS_UNAVAILABLE'});expect(f.lifecycle.open).not.toHaveBeenCalled();
 });
 it('missing DB birth cannot auto-initialize a restored room',async()=>{
  const f=fixture();f.noBirth();await expect(f.get()).rejects.toMatchObject({code:'TOPIC_BIRTH_UNAVAILABLE'});expect(f.lifecycle.open).not.toHaveBeenCalled();
 });
 it('rejects missing external storage/retired room',async()=>{
  const f=fixture();vi.mocked(f.lifecycle.open).mockImplementationOnce(()=>{throw new Error('MISSING_REQUIRED');});await expect(f.get()).rejects.toThrow('MISSING_REQUIRED');
  f.retire();await expect(f.get()).rejects.toThrow('RETIRED');
 });
 it('rechecks auth TTL after final awaited query and synchronous external fence',async()=>{
  const f=fixture(),enqueue=vi.fn();vi.mocked(f.lifecycle.assertLive).mockImplementationOnce(()=>f.setNow(100001));
  await expect(f.service.dispatch(f.room,'credential',enqueue)).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(enqueue).not.toHaveBeenCalled();
 });
 it('does not durably narrow with a credential expiring during the earlier SQL reads',async()=>{
  const f=fixture(),original=f.query.getMockImplementation()!;
  f.query.mockImplementation(async(sql,values)=>{if(sql.startsWith('SELECT count'))f.setNow(100001);return original(sql,values);});
  await expect(f.exclude(['music'])).rejects.toMatchObject({code:'AUTH_REQUIRED'});
  expect(f.narrow).not.toHaveBeenCalled();expect(f.state().excluded).toEqual([]);
 });
 for(const reason of ['revoked','acceptance','idle'] as const)it(`does not enqueue after final ${reason} invalidation`,async()=>{
  const f=fixture(),enqueue=vi.fn();if(reason==='revoked')f.revokeAuth();if(reason==='acceptance')f.reaccept();if(reason==='idle'){f.setExpiry(2e9);f.setNow(timersIdle);}
  await expect(f.service.dispatch(f.room,'credential',enqueue)).rejects.toThrow();expect(enqueue).not.toHaveBeenCalled();
 });
 it('detects a stricter own ledger revision appearing after the awaited final read',async()=>{
  const f=fixture(),enqueue=vi.fn();f.read.mockImplementationOnce(()=>f.state()).mockImplementationOnce(()=>({...f.state(),revision:1,excluded:['music']}));
  await expect(f.service.dispatch(f.room,'credential',enqueue)).rejects.toMatchObject({code:'TOPIC_STATE_CHANGED'});expect(enqueue).not.toHaveBeenCalled();
 });
 it('cipher AAD prevents substituting a different owner or revision',async()=>{
  const f=fixture();await f.put(['food']);const row=f.preferences.get(f.owner)!;f.preferences.set(f.owner,{...row,rev:'2'});await expect(f.get()).rejects.toThrow();
 });
 for(const patch of [{allow_topic_ids:['unknown']},{allow_topic_ids:['food','food']},{exclude_topic_ids:['food'],allow_topic_ids:['food']},{expected_rev:-1},{owner_member_id:randomUUID()},{taxonomy_digest:'wrong'}])it(`rejects malformed or expanded authority ${JSON.stringify(patch)}`,async()=>{
  const f=fixture();await expect(f.service.put(f.room,'credential',{request_id:randomUUID(),expected_rev:0,taxonomy_digest:f.pins.taxonomy,allow_topic_ids:[],exclude_topic_ids:[],...patch})).rejects.toThrow();expect(f.narrow).not.toHaveBeenCalled();expect(f.preferences.size).toBe(0);
 });
 it('does not accept another room or missing session through the typed service interface',async()=>{
  const f=fixture();await expect(f.service.dispatch(randomUUID(),'credential',()=>{})).rejects.toThrow('AUTH_REQUIRED');await expect(f.service.dispatch(f.room,undefined,()=>{})).rejects.toThrow('AUTH_REQUIRED');
 });
});
const timersIdle=86400001;

describe('private topic HTTP adapter explicit injection',()=>{
 async function appFixture(enabled=true) {
  const f=fixture(),app=await createApp({rooms:f.rooms,privateTopics:enabled?f.service:undefined,logger:false,probe:async()=>{},version:{service:'venus',version:'test',source_revision:'test',image_digest:'test',contract_revision:'P00-2'}});
  return {...f,app,path:`/api/v1/rooms/${f.room}/me/private-topics`,headers:{cookie:'venus_room_session=credential','x-csrf-token':'csrf','sec-fetch-site':'same-origin'}};
 }
 it('remains unavailable without explicit lifecycle/service injection',async()=>{
  const f=await appFixture(false);try{expect((await f.app.inject({url:f.path,headers:f.headers})).statusCode).toBe(404);}finally{await f.app.close();}
 });
 it('enqueues only current own view with no-store on a guarded browser GET',async()=>{
  const f=await appFixture();try{const r=await f.app.inject({url:f.path,headers:f.headers});expect(r.statusCode).toBe(200);expect(r.headers['cache-control']).toBe('no-store');expect(r.json().owner_member_id).toBe(f.owner);}finally{await f.app.close();}
 });
 for(const headers of [{},{cookie:'venus_room_session=credential'},
  {cookie:'venus_room_session=credential','x-csrf-token':'wrong'},
  {cookie:'venus_room_session=credential','x-csrf-token':'csrf',origin:'https://evil.test'},
  {cookie:'venus_room_session=credential','x-csrf-token':'csrf','sec-fetch-site':'same-site'},
  {cookie:'venus_room_session=credential; venus_room_session=other','x-csrf-token':'csrf'}])it(`rejects unauthenticated/cross-origin GET ${JSON.stringify(headers)}`,async()=>{
  const f=await appFixture();try{expect((await f.app.inject({url:f.path,headers})).statusCode).toBeGreaterThanOrEqual(400);expect(f.lifecycle.open).not.toHaveBeenCalled();}finally{await f.app.close();}
 });
 it('requires PUT Origin and rejects query/extra owner authority without reflection',async()=>{
  const f=await appFixture();try{
   const input={request_id:randomUUID(),expected_rev:0,taxonomy_digest:f.pins.taxonomy,allow_topic_ids:['music'],exclude_topic_ids:[]};
   expect((await f.app.inject({method:'PUT',url:f.path,headers:f.headers,payload:input})).statusCode).toBe(403);
   const headers={...f.headers,origin:'https://localhost'};
   expect((await f.app.inject({method:'PUT',url:f.path+'?owner=private-canary',headers,payload:input})).statusCode).toBe(400);
   const bad=await f.app.inject({method:'PUT',url:f.path,headers,payload:{...input,owner_member_id:'private-canary'}});expect(bad.statusCode).toBe(400);expect(bad.body).not.toContain('private-canary');
   expect(f.preferences.size).toBe(0);
   const good=await f.app.inject({method:'PUT',url:f.path,headers,payload:input});expect(good.statusCode).toBe(200);expect(good.json().allow_topic_ids).toEqual(['music']);
   const excluded=await f.app.inject({method:'POST',url:f.path+'/exclusions',headers,payload:{request_id:randomUUID(),taxonomy_digest:f.pins.taxonomy,topic_ids:['music']}});
   expect(excluded.statusCode).toBe(200);expect(excluded.json().allow_topic_ids).toEqual([]);expect(excluded.json().exclude_topic_ids).toEqual(['music']);
  }finally{await f.app.close();}
 });
});
