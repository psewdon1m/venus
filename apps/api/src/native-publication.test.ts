import {expect,it} from 'vitest';
import type {FastifyRequest} from 'fastify';
import {createApp} from './app.js';
import {registerMediaRoutes} from './media-routes.js';
import {Media} from './media.js';
import {requireThat} from './security.js';
import type {Rooms} from './rooms.js';
import type {GameHttpGuards} from './game-routes.js';

it('native protocol cannot mint a grant; inherited guards run before its capability fence',async()=>{
 const calls:string[]=[];let retired=false;
 const media=Object.assign(Object.create(Media.prototype) as Media,{rooms:{
  transaction:async(fn:(c:unknown)=>Promise<unknown>)=>fn({}),
  access:async()=>{calls.push('access');return {member:{socket_generation:'7'}};},
  finalAccessFence:async()=>()=>{calls.push('fence');requireThat(!retired,'ROOM_CLOSED',403);}
 } as unknown as Rooms,control:async()=>({running:false,cutoff_confirmed:true})});
 const app=await createApp({probe:async()=>{},logger:false,version:{service:'venus',version:'0.0.0',source_revision:'a'.repeat(40),image_digest:'sha256:'+'b'.repeat(64),contract_revision:'P00-2'}});
 const origin=(r:FastifyRequest)=>requireThat(r.headers.origin==='http://localhost','ORIGIN_REQUIRED',403);
 const credential=(r:FastifyRequest)=>r.headers.cookie;
 const guard:GameHttpGuards={roomId:()=> '00000000-0000-4000-8000-000000000001',origin,credential,body:()=>{throw Error('unused');},
  privateReadGuard:async r=>{requireThat(credential(r)==='accepted','AUTH_REQUIRED',401);return credential(r);},
  memberGuard:async r=>{origin(r);requireThat(credential(r)==='accepted','AUTH_REQUIRED',401);requireThat(r.headers['x-csrf-token']==='current','CSRF_REQUIRED',403);calls.push('guard');return credential(r);}};
 registerMediaRoutes(app,media,guard);const root='/api/v1/rooms/00000000-0000-4000-8000-000000000001/cinema';
 try{
  expect((await app.inject(root+'/publication-capabilities')).statusCode).toBe(401);expect(calls).toEqual([]);
  const result=await app.inject({url:root+'/publication-capabilities',headers:{cookie:'accepted'}});
  expect(result.statusCode).toBe(200);expect(result.headers['cache-control']).toBe('no-store');expect(result.json().native_publish).toEqual({enabled:false,accepted_protocols:[],device_qualified:false});
  calls.length=0;
  expect((await app.inject({method:'POST',url:root+'/native/start',headers:{cookie:'accepted'}})).statusCode).toBe(403);expect(calls).toEqual([]);
  expect((await app.inject({method:'POST',url:root+'/native/start',headers:{origin:'http://localhost',cookie:'accepted'}})).statusCode).toBe(403);expect(calls).toEqual([]);
  for(const build of ['unknown','forged-approved-build']){
   const denied=await app.inject({method:'POST',url:root+'/native/start',headers:{origin:'http://localhost',cookie:'accepted','x-csrf-token':'current'},payload:{build,protocol:1}});
   expect(denied.statusCode).toBe(409);expect(denied.json().code).toBe('NATIVE_PUBLICATION_UNAVAILABLE');expect(denied.body).not.toMatch(/"token"|"lease_id"/);
  }
  expect(calls).toEqual(['guard','access','fence','guard','access','fence']);
  retired=true;const closed=await app.inject({url:root+'/publication-capabilities',headers:{cookie:'accepted'}});expect(closed.statusCode).toBe(403);expect(closed.body).not.toContain('accepted_protocols');
 }finally{await app.close();}
});
