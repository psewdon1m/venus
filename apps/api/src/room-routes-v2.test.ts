import {describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createApp} from './app.js';
import {requireThat} from './security.js';
import type {Rooms} from './rooms.js';
import type {Games} from './games.js';
import type {TopicGames} from './topic-games.js';
import type {PrivateTopicPreferences} from './private-topic-preferences.js';
async function fixture(enabled=true,install=true,creationProtocol:1|2=1) {
 const room=randomUUID(),offer={version:'mock',digest:'sha256:'+'a'.repeat(64),text:{ru:'mock',en:'mock',tr:'mock'},synthetic:true};let protocol=2;
 const create=vi.fn(async()=>({status:201,session:'room-token',body:{room_id:room}})),getCurrent=vi.fn(async()=>null);
 const service={options:{origin:'https://localhost',offer:()=>offer,privateProtocol:{}},csrf:(s:string)=>'csrf:'+s,rateLimit:vi.fn(async()=>{}),create,
  transaction:async<T>(fn:(c:unknown)=>Promise<T>)=>fn({}),access:vi.fn(async()=>({room:{id:room,private_protocol:protocol}})),protocol:()=>protocol,
  mutate:vi.fn(async()=>({body:{ok:true}})),dispatchPrivateProtocol:vi.fn(async(id:string,session:string|undefined,enqueue:(v:unknown)=>void)=>{requireThat(session==='room-token','AUTH_REQUIRED',401);enqueue({schema_version:1,room_id:id,private_protocol:protocol});}),maintain:vi.fn(async()=>{})};
 const rooms=service as unknown as Rooms,topics={rooms,options:{enabled}} as unknown as TopicGames,privateTopics={rooms} as PrivateTopicPreferences;
 const games={rooms,getCurrent,dispatchHttpView:vi.fn(async(_id:unknown,_session:unknown,enqueue:(v:unknown)=>void)=>enqueue(null))} as unknown as Games;
 const app=await createApp({rooms,games,privateTopics:install?privateTopics:undefined,topicGames:install?topics:undefined,roomCreationProtocol:creationProtocol,logger:false,probe:async()=>{},version:{service:'venus',version:'test',source_revision:'test',image_digest:'test',contract_revision:'P00-2'}});
 const payload={meeting_context:'in_person',locale:'ru',name:'test',idempotency_key:randomUUID(),entry_acceptance:{accept_offer:true,adult18:true,offer_version:offer.version,offer_digest:offer.digest}};
 const admission={origin:'https://localhost',cookie:'__Host-venus-admission=admission','x-csrf-token':'csrf:admission'};
 const member={origin:'https://localhost',cookie:'venus_room_session=room-token','x-csrf-token':'csrf:room-token','sec-fetch-site':'same-origin'};
 return {app,room,create,getCurrent,rooms,service,payload,admission,member,setProtocol:(n:number)=>{protocol=n;}};
}
describe('explicit V2 HTTP registration; service doubles, not browser-cookie proof',()=>{
 for(const protocol of [1,2] as const)it(`publishes explicit creation capability ${protocol} without a room credential`,async()=>{
  const f=await fixture(true,true,protocol);try{const r=await f.app.inject({url:'/api/v1/runtime-capabilities'});expect(r.statusCode).toBe(200);expect(r.json()).toEqual({schema_version:1,room_creation_protocol:protocol});expect(r.headers['cache-control']).toBe('no-store');expect(f.service.access).not.toHaveBeenCalled();}finally{await f.app.close();}
 });
 it('rejects a creation profile that depends on disabled V2',async()=>{await expect(fixture(false,true,2)).rejects.toMatchObject({code:'ROOM_CREATION_PROTOCOL_UNAVAILABLE'});});
 it('guards cross-site runtime capability reads',async()=>{const f=await fixture();try{for(const headers of [{origin:'https://evil.test'},{'sec-fetch-site':'same-site'}])expect((await f.app.inject({url:'/api/v1/runtime-capabilities',headers})).statusCode).toBe(403);}finally{await f.app.close();}});
 it('classifies V2 from creation and emits two narrow secure cookie paths',async()=>{
  const f=await fixture();try{const r=await f.app.inject({method:'POST',url:'/api/v2/rooms',headers:f.admission,payload:f.payload});expect(r.statusCode).toBe(201);expect(f.create.mock.calls[0]?.at(-1)).toBe(2);
   const cookies=r.headers['set-cookie'] as string[];expect(cookies).toHaveLength(2);for(const [i,version] of [1,2].entries()){expect(cookies[i]).toContain('Path=/api/v'+version+'/rooms/'+f.room);expect(cookies[i]).toContain('HttpOnly');expect(cookies[i]).toContain('Secure');expect(cookies[i]).toContain('SameSite=Strict');}
  }finally{await f.app.close();}
 });
 it('does not register V2 without explicit services',async()=>{const f=await fixture(true,false);try{expect((await f.app.inject({method:'POST',url:'/api/v2/rooms',headers:f.admission,payload:f.payload})).statusCode).toBe(404);expect(f.create).not.toHaveBeenCalled();}finally{await f.app.close();}});
 it('does not create V2 when its feature is disabled',async()=>{const f=await fixture(false);try{expect((await f.app.inject({method:'POST',url:'/api/v2/rooms',headers:f.admission,payload:f.payload})).statusCode).toBe(503);expect(f.create).not.toHaveBeenCalled();}finally{await f.app.close();}});
 for(const patch of [{origin:'https://evil.test'},{'x-csrf-token':'wrong'}])it(`guards V2 creation before service invocation ${JSON.stringify(patch)}`,async()=>{
  const f=await fixture();try{expect((await f.app.inject({method:'POST',url:'/api/v2/rooms',headers:{...f.admission,...patch},payload:f.payload})).statusCode).toBe(403);expect(f.create).not.toHaveBeenCalled();}finally{await f.app.close();}
 });
 it('refuses legacy game decoding for protocol2',async()=>{const f=await fixture();try{const r=await f.app.inject({url:`/api/v1/rooms/${f.room}/game/current`,headers:f.member});expect(r.statusCode).toBe(409);expect(r.json().code).toBe('PRIVATE_TRANSPORT_UPGRADE_REQUIRED');expect(f.getCurrent).not.toHaveBeenCalled();}finally{await f.app.close();}});
 it('preserves legacy game routing for protocol1',async()=>{const f=await fixture();f.setProtocol(1);try{expect((await f.app.inject({url:`/api/v1/rooms/${f.room}/game/current`,headers:f.member})).statusCode).toBe(200);expect(f.getCurrent).toHaveBeenCalledOnce();}finally{await f.app.close();}});
 it('publishes own protocol separately from the legacy RoomView',async()=>{const f=await fixture();try{const r=await f.app.inject({url:`/api/v1/rooms/${f.room}/me/private-protocol`,headers:f.member});expect(r.statusCode).toBe(200);expect(r.json()).toEqual({schema_version:1,room_id:f.room,private_protocol:2});expect(r.headers['cache-control']).toBe('no-store');}finally{await f.app.close();}});
 it('rejects protocol reads without CSRF, with duplicate credentials or a query',async()=>{const f=await fixture();try{for(const headers of [{...f.member,'x-csrf-token':'wrong'},{...f.member,cookie:'venus_room_session=room-token; venus_room_session=other'}])expect((await f.app.inject({url:`/api/v1/rooms/${f.room}/me/private-protocol`,headers})).statusCode).toBeGreaterThanOrEqual(400);expect((await f.app.inject({url:`/api/v1/rooms/${f.room}/me/private-protocol?owner=other`,headers:f.member})).statusCode).toBe(400);expect(f.service.dispatchPrivateProtocol).not.toHaveBeenCalled();}finally{await f.app.close();}});
 it('clears both narrow cookie paths on leave',async()=>{const f=await fixture();try{const r=await f.app.inject({method:'POST',url:`/api/v1/rooms/${f.room}/leave`,headers:f.member,payload:{idempotency_key:randomUUID(),expected_rev:1}});expect(r.statusCode).toBe(200);const cookies=r.headers['set-cookie'] as string[];expect(cookies).toHaveLength(2);expect(cookies[0]).toContain('/api/v1/rooms/'+f.room);expect(cookies[1]).toContain('/api/v2/rooms/'+f.room);}finally{await f.app.close();}});
});
