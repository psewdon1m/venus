import type {FastifyInstance,FastifyRequest} from 'fastify';
import WebSocket from 'ws';
import type {GameHttpGuards} from './game-routes.js';
import {requireThat} from './security.js';
import {enqueueFencedJson} from './http-delivery.js';
import {Media,mediaLimits} from './media.js';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
function input(request:FastifyRequest,keys:string){const v=request.body;requireThat(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys,'INVALID_REQUEST',400);return v as Record<string,unknown>;}
export function registerMediaRoutes(app:FastifyInstance,media:Media,guard:GameHttpGuards){
 const root='/api/v1/rooms/:roomId',cinema=root+'/cinema';
 app.get(cinema,async(request,reply)=>{await guard.privateReadGuard(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);await media.inspect(guard.roomId(request),guard.credential(request),state=>enqueueFencedJson(reply,state));return reply;});
 for(const action of ['start','join'] as const)app.post(cinema+'/'+action,async(request,reply)=>{
  const session=await guard.memberGuard(request),v=input(request,'expected_rev,idempotency_key');requireThat(typeof v.idempotency_key==='string'&&UUID.test(v.idempotency_key)&&Number.isSafeInteger(v.expected_rev),'INVALID_REQUEST',400);
  await media.grant(guard.roomId(request),session,{action,expected_rev:v.expected_rev as number,idempotency_key:v.idempotency_key},grant=>enqueueFencedJson(reply,grant));return reply;
 });
 app.post(cinema+'/source',async request=>{const session=await guard.memberGuard(request),v=input(request,'audio,idempotency_key,lease_id,scope_id,video');requireThat(typeof v.lease_id==='string'&&UUID.test(v.lease_id)&&typeof v.scope_id==='string'&&UUID.test(v.scope_id)&&typeof v.idempotency_key==='string'&&UUID.test(v.idempotency_key)&&typeof v.video==='boolean'&&typeof v.audio==='boolean','INVALID_REQUEST',400);return media.confirmSource(guard.roomId(request),session,v.lease_id,v.scope_id,v.video,v.audio,v.idempotency_key);});
 app.post(cinema+'/stop',async request=>{const session=await guard.memberGuard(request),v=input(request,'idempotency_key,scope_id');requireThat(typeof v.scope_id==='string'&&UUID.test(v.scope_id)&&typeof v.idempotency_key==='string'&&UUID.test(v.idempotency_key),'INVALID_REQUEST',400);return media.stop(guard.roomId(request),session,v.scope_id,v.idempotency_key);});
 app.post(root+'/media/leases/:leaseId/renew',async request=>{const session=await guard.memberGuard(request),v=input(request,'idempotency_key'),id=(request.params as {leaseId:string}).leaseId;requireThat(UUID.test(id)&&typeof v.idempotency_key==='string'&&UUID.test(v.idempotency_key),'INVALID_REQUEST',400);return media.renew(guard.roomId(request),session,id);});
 app.post(root+'/media/leases/:leaseId/release',async request=>{const session=await guard.memberGuard(request),v=input(request,'idempotency_key'),id=(request.params as {leaseId:string}).leaseId;requireThat(UUID.test(id)&&typeof v.idempotency_key==='string'&&UUID.test(v.idempotency_key),'INVALID_REQUEST',400);return media.release(guard.roomId(request),session,id,v.idempotency_key);});
 const query=(request:FastifyRequest)=>{
  if(request.headers.upgrade?.toLowerCase()==='websocket'||request.headers.origin)guard.origin(request);else requireThat(request.headers['sec-fetch-site']==='same-origin','ORIGIN_REQUIRED',403);requireThat(!request.headers.authorization,'MEDIA_TOKEN_INVALID',401);const url=new URL(request.url,media.rooms.options.origin),values=[...url.searchParams];requireThat(url.search.length<=24576&&values.length<=24&&new Set(values.map(([k])=>k)).size===values.length&&values.every(([k,v])=>k.length<=64&&v.length<=16384&&!['room','identity','metadata','name','grants','api_key','authorization'].includes(k)),'INVALID_REQUEST',400);
  const token=url.searchParams.get('access_token');requireThat(token,'MEDIA_TOKEN_INVALID',401);return {token,search:url.search};
 };
 for(const suffix of ['/rtc/validate','/rtc/v1/validate'])app.get(root+'/media'+suffix,async(request,reply)=>{
  const q=query(request),session=guard.credential(request);await media.gateway(guard.roomId(request),session,q.token,()=>{});
  const response=await fetch(media.internalOrigin+suffix+q.search,{headers:{'x-venus-media-internal':media.internalKey},signal:AbortSignal.timeout(2500),redirect:'error'});requireThat(response.ok,'MEDIA_TRANSPORT_UNAVAILABLE',503);
  await media.gateway(guard.roomId(request),session,q.token,()=>enqueueFencedJson(reply,{ready:true}));return reply;
 });
 for(const suffix of ['/rtc','/rtc/v1'])app.get(root+'/media'+suffix,{websocket:true,preValidation:async request=>{const q=query(request);await media.rooms.rateLimit('media-signal:'+media.rooms.csrf(guard.credential(request)??''),120);await media.gateway(guard.roomId(request),guard.credential(request),q.token,()=>{});}},(socket,request)=>{
  const q=query(request),session=guard.credential(request),id=guard.roomId(request);let upstream:WebSocket|undefined,unregister:(()=>void)|undefined,closed=false,leaseId='',pending=0,window=performance.now(),frames=0,resolveReady:()=>void=()=>{},rejectReady:(error:Error)=>void=()=>{};
  const ready=new Promise<void>((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});void ready.catch(()=>{});
  const close=()=>{if(closed)return;closed=true;clearTimeout(deadline);rejectReady(Error('MEDIA_DISCONNECTED'));unregister?.();upstream?.terminate();socket.terminate();};
  const deadline=setTimeout(close,5000);deadline.unref();let inbound=Promise.resolve(),outbound=Promise.resolve();
  const enqueue=(target:'client'|'server',data:WebSocket.RawData,binary:boolean)=>{
   const size=Array.isArray(data)?data.reduce((n,b)=>n+b.length,0):data.byteLength;pending+=size;
   const now=performance.now();if(now-window>=1000){window=now;frames=0;}frames++;
   if(size>mediaLimits.maxFrame||pending>mediaLimits.maxPendingBytes||frames>160){close();return;}
   const operation=async()=>{try{await ready;if(closed)return;await media.frame(id,session,leaseId,()=>{requireThat(!closed,'MEDIA_LEASE_RETIRED',401);const destination=target==='client'?socket:upstream;requireThat(destination?.readyState===WebSocket.OPEN&&destination.bufferedAmount<=mediaLimits.maxPendingBytes,'MEDIA_TRANSPORT_UNAVAILABLE',503);destination.send(data,{binary});});}finally{pending-=size;}};
   if(target==='client')outbound=outbound.then(operation).catch(close);else inbound=inbound.then(operation).catch(close);
  };
  // Listeners are attached before the first asynchronous authorization/upgrade.
  socket.on('message',(data,binary)=>enqueue('server',data,binary));socket.on('close',close);socket.on('error',close);
  void media.gateway(id,session,q.token,lease=>{
   requireThat(!closed,'MEDIA_LEASE_RETIRED',401);leaseId=lease.id;unregister=media.bindSocket(lease.id,{close});
   upstream=new WebSocket(media.internalOrigin.replace('http:','ws:')+suffix+q.search,{headers:{'x-venus-media-internal':media.internalKey,origin:media.rooms.options.origin},maxPayload:mediaLimits.maxFrame,perMessageDeflate:false,handshakeTimeout:3000});
   upstream.on('message',(data,binary)=>enqueue('client',data,binary));upstream.on('error',close);upstream.on('close',close);
   upstream.on('open',()=>{void media.gateway(id,session,q.token,()=>{if(closed)return;clearTimeout(deadline);resolveReady();}).catch(async()=>{close();try{await media.client.removeParticipant(lease.upstream_room,lease.id);}catch{/* Watchdog independently removes any late join. */}});});
  }).catch(close);
 });
 app.post('/internal/v1/media/authority',async request=>{media.internalCredential(request.headers['x-venus-media-internal']);const v=input(request,'boot_id');requireThat(typeof v.boot_id==='string'&&UUID.test(v.boot_id),'INVALID_REQUEST',400);return media.watchdog(v.boot_id);});
 app.addHook('onClose',async()=>{try{await media.control('quiesce');}catch{/* Independent supervisor watchdog stops media after API disappearance. */}});
}
