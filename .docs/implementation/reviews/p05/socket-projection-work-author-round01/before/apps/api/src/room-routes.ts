import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import cookie from '@fastify/cookie';
import {Ajv2020} from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schemas from '@venus/contracts/schemas' with {type:'json'};
import type {CreateRoom,JoinRoom,ResolveInvite,EntryAcceptance} from '@venus/contracts';
import {Rooms,revision,type SocketGrant} from './rooms.js';
import {requireThat,token,equal,hash} from './security.js';
import {randomUUID} from 'node:crypto';
import type WebSocket from 'ws';
import type {Games} from './games.js';
import {registerGameRoutes} from './game-routes.js';
import type {PrivateTopicPreferences} from './private-topic-preferences.js';
import {enqueueFencedJson} from './http-delivery.js';
import type {TopicGames} from './topic-games.js';
import {registerTopicGameRoutes} from './topic-game-routes.js';
const admissionCookie='__Host-venus-admission';
export const roomCookie=()=>'venus_room_session';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ajv=new Ajv2020({allErrors:false,strict:false,coerceTypes:false,removeAdditional:false});
addFormats.default(ajv);
const validators=new Map<string,ReturnType<typeof ajv.compile>>();
function body<T>(request:FastifyRequest,schema:string):T {
  let validate=validators.get(schema);
  if(!validate) {validate=ajv.compile({$defs:schemas,$ref:'#/$defs/'+schema});validators.set(schema,validate);}
  requireThat(validate(request.body),'INVALID_REQUEST',400);return request.body as T;
}
function roomId(request:FastifyRequest) {const id=(request.params as {roomId:string}).roomId;requireThat(uuid.test(id),'INVALID_REQUEST',400);return id.toLowerCase();}
export async function registerRooms(app:FastifyInstance,rooms:Rooms,games?:Games,privateTopics?:PrivateTopicPreferences,topicGames?:TopicGames,roomCreationProtocol:1|2=1) {
  requireThat(roomCreationProtocol===1||roomCreationProtocol===2,'ROOM_CREATION_PROTOCOL_INVALID',503);
  requireThat(roomCreationProtocol===1||topicGames?.options.enabled===true,'ROOM_CREATION_PROTOCOL_UNAVAILABLE',503);
  await app.register(cookie);
  const sockets=new Map<string,{socket:WebSocket;grant:SocketGrant}>();
  const pending=new Set<WebSocket>();
  function origin(request:FastifyRequest) {requireThat(request.headers.origin===rooms.options.origin,'ORIGIN_FORBIDDEN');}
  function credential(request:FastifyRequest) {
    const copies=(request.headers.cookie??'').split(';').filter(row=>row.trim().startsWith(roomCookie()+'='));
    requireThat(copies.length<=1,'AUTH_REQUIRED',401);return request.cookies[roomCookie()];
  }
  function csrf(request:FastifyRequest,session:string|undefined) {requireThat(session,'AUTH_REQUIRED',401);requireThat(typeof request.headers['x-csrf-token']==='string'&&equal(request.headers['x-csrf-token'],rooms.csrf(session)),'CSRF_FORBIDDEN');}
  function setSession(reply:FastifyReply,id:string,session:string) {
    reply.setCookie(roomCookie(),session,{path:'/api/v1/rooms/'+id,secure:true,httpOnly:true,sameSite:'strict',maxAge:86400});
    if(topicGames) reply.setCookie(roomCookie(),session,{path:'/api/v2/rooms/'+id,secure:true,httpOnly:true,sameSite:'strict',maxAge:86400});
    reply.header('X-CSRF-Token',rooms.csrf(session));
  }
  async function publicGuard(request:FastifyRequest) {
    origin(request);const admission=request.cookies[admissionCookie];csrf(request,admission);
    await rooms.rateLimit('public:'+request.ip,200);await rooms.rateLimit('admission:'+hash(admission!),60);return admission!;
  }
  async function memberGuard(request:FastifyRequest) {
    origin(request);const session=credential(request);csrf(request,session);await rooms.rateLimit('member:'+hash(session!),240);return session;
  }
  async function privateReadGuard(request:FastifyRequest) {
    if(request.headers.origin!==undefined) origin(request);
    requireThat(request.headers['sec-fetch-site']===undefined||request.headers['sec-fetch-site']==='same-origin','ORIGIN_FORBIDDEN');
    const session=credential(request);csrf(request,session);await rooms.rateLimit('member:'+hash(session!),240);return session;
  }
  app.get('/api/v1/entry-policy',async (request,reply)=>{
    if(request.headers.origin!==undefined) origin(request);
    await rooms.rateLimit('bootstrap:'+request.ip,200);
    const admission=request.cookies[admissionCookie]??token();
    reply.setCookie(admissionCookie,admission,{path:'/',secure:true,httpOnly:true,sameSite:'strict',maxAge:86400});
    const offer=rooms.options.offer();
    return {available:Boolean(offer),offer,csrf_token:rooms.csrf(admission)};
  });
  app.get('/api/v1/runtime-capabilities',async request=>{
    if(request.headers.origin!==undefined) origin(request);
    requireThat(request.headers['sec-fetch-site']===undefined||request.headers['sec-fetch-site']==='same-origin','ORIGIN_FORBIDDEN');
    await rooms.rateLimit('bootstrap:'+request.ip,200);
    return {schema_version:1,room_creation_protocol:roomCreationProtocol};
  });
  app.post('/api/v1/rooms',async (request,reply)=>{
    const admission=await publicGuard(request);const result=await rooms.create(body<CreateRoom>(request,'CreateRoom'),admission,request.id);
    const value=result.body as {room_id:string};setSession(reply,value.room_id,result.session!);return reply.code(result.status).send(result.body);
  });
  if(topicGames) {
    requireThat(topicGames.rooms===rooms&&privateTopics?.rooms===rooms&&rooms.options.privateProtocol,'TOPIC_ROOM_SERVICE_MISMATCH',503);
    app.post('/api/v2/rooms',async(request,reply)=>{
      const admission=await publicGuard(request);requireThat(topicGames.options.enabled,'TOPIC_GAMES_DISABLED',503);
      const result=await rooms.create(body<CreateRoom>(request,'CreateRoom'),admission,request.id,2),value=result.body as {room_id:string};
      setSession(reply,value.room_id,result.session!);return reply.code(result.status).send(result.body);
    });
  }
  app.post('/api/v1/invitations/resolve',async request=>{
    await publicGuard(request);const input=body<ResolveInvite>(request,'ResolveInvite');return rooms.resolve(input.invite_token,input.entry_acceptance);
  });
  app.post('/api/v1/rooms/:roomId/join',async (request,reply)=>{
    const id=roomId(request),admission=await publicGuard(request);const result=await rooms.join(id,body<JoinRoom>(request,'JoinRoom'),admission,credential(request),request.id);
    setSession(reply,id,result.session!);return result.body;
  });
  app.get('/api/v1/rooms/:roomId',async (request,reply)=>{
    if(request.headers.origin!==undefined) origin(request);const id=roomId(request),session=credential(request);
    const result=await rooms.snapshot(id,session);reply.header('X-CSRF-Token',rooms.csrf(session!));return result;
  });
  app.get('/api/v1/rooms/:roomId/me/preferences',async request=>{
    if(request.headers.origin!==undefined) origin(request);return rooms.preferences(roomId(request),credential(request));
  });
  app.get('/api/v1/rooms/:roomId/invite',async request=>{
    if(request.headers.origin!==undefined) origin(request);const id=roomId(request);return rooms.hostInvite(id,credential(request));
  });
  for(const route of [
    {method:'PATCH',path:'/context',schema:'ContextPatch',op:'context'},
    {method:'PATCH',path:'/me',schema:'ProfilePatch',op:'profile'},
    {method:'PUT',path:'/me/preferences',schema:'PreferencesPut',op:'preferences'},
    {method:'POST',path:'/me/setup/skip',schema:'RevisionMutation',op:'skip'},
    {method:'POST',path:'/leave',schema:'RevisionMutation',op:'leave'},
    {method:'POST',path:'/close',schema:'RevisionMutation',op:'close'}
  ] as const) app.route({method:route.method,url:'/api/v1/rooms/:roomId'+route.path,handler:async (request,reply)=>{
    const id=roomId(request),session=await memberGuard(request);const result=await rooms.mutate(id,session,route.op,body<Record<string,unknown>>(request,route.schema),request.id);
    if(route.op==='leave') {
      reply.clearCookie(roomCookie(),{path:'/api/v1/rooms/'+id,secure:true,httpOnly:true,sameSite:'strict'});
      if(topicGames) reply.clearCookie(roomCookie(),{path:'/api/v2/rooms/'+id,secure:true,httpOnly:true,sameSite:'strict'});
    }
    return result.body;
  }});
  app.post('/api/v1/rooms/:roomId/me/entry-acceptance',async request=>{
    const id=roomId(request),session=await memberGuard(request);return rooms.reaccept(id,session,body<EntryAcceptance>(request,'EntryAcceptance'),request.id);
  });
  app.post('/api/v1/rooms/:roomId/ws-ticket',async request=>{
    const id=roomId(request),session=await memberGuard(request);body(request,'SafetyStop');return rooms.newTicket(id,session);
  });
  const gameGuards={roomId,origin,credential,memberGuard,privateReadGuard,body};
  if(games) {
    if(rooms.options.privateProtocol) await app.register(async scoped=>{
      // Protocol is immutable from birth. Reject the legacy transport before it
      // can decode or mutate any shared game rows with V1 AAD/contracts.
      scoped.addHook('preHandler',async request=>rooms.transaction(async c=>{
        const a=await rooms.access(c,roomId(request),credential(request),true);
        requireThat(rooms.protocol(a.room)===1,'PRIVATE_TRANSPORT_UPGRADE_REQUIRED',409);
      }));
      registerGameRoutes(scoped,games,gameGuards);
    });
    else registerGameRoutes(app,games,gameGuards);
  }
  if(topicGames) registerTopicGameRoutes(app,topicGames,gameGuards);
  app.get('/api/v1/rooms/:roomId/me/private-protocol',async(request,reply)=>{
    const session=await privateReadGuard(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);
    await rooms.dispatchPrivateProtocol(roomId(request),session,view=>enqueueFencedJson(reply,view));return reply;
  });
  // Explicit injection only. server.ts does not activate the incomplete V2
  // lifecycle; this adapter cannot auto-create ledgers for existing rooms.
  if(privateTopics) {
    requireThat(privateTopics.rooms===rooms,'TOPIC_ROOM_SERVICE_MISMATCH',503);
    const topicPath='/api/v1/rooms/:roomId/me/private-topics';
    const noQuery=(request:FastifyRequest)=>requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);
    const sendTopics=async(request:FastifyRequest,reply:FastifyReply,session:string|undefined)=>{
      try {await privateTopics.dispatch(roomId(request),session,view=>enqueueFencedJson(reply,view));}
      catch(error) {if(!reply.sent) throw error;}return reply;
    };
    app.get(topicPath,async(request,reply)=>{const session=await privateReadGuard(request);noQuery(request);return sendTopics(request,reply,session);});
    app.get('/api/v1/rooms/:roomId/me/private-topic-taxonomy',async(request,reply)=>{
      const session=await privateReadGuard(request);noQuery(request);
      try {await privateTopics.dispatchTaxonomy(roomId(request),session,view=>enqueueFencedJson(reply,view));}
      catch(error) {if(!reply.sent) throw error;}return reply;
    });
    app.put(topicPath,{bodyLimit:8192},async(request,reply)=>{const session=await memberGuard(request);noQuery(request);await privateTopics.put(roomId(request),session,request.body);return sendTopics(request,reply,session);});
    app.post(topicPath+'/exclusions',{bodyLimit:8192},async(request,reply)=>{const session=await memberGuard(request);noQuery(request);await privateTopics.exclude(roomId(request),session,request.body);return sendTopics(request,reply,session);});
  }
  function send(socket:WebSocket,grant:SocketGrant,view:Awaited<ReturnType<Rooms['snapshot']>>) {
    if(socket.readyState!==1) return;
    socket.send(JSON.stringify({schema:1,event_id:randomUUID(),room_id:grant.roomId,room_rev:revision(view.room_rev),stream:'room',stream_rev:revision(view.room_rev),type:'room.snapshot',server_time:new Date(rooms.now()).toISOString(),audience:'room',payload:view}));
  }
  async function sendGame(socket:WebSocket,grant:SocketGrant,bundle:Awaited<ReturnType<Rooms['socketState']>>,publicSnapshot:boolean) {
    if(socket.readyState!==1) return;
    const common={schema:1,room_id:grant.roomId,room_rev:bundle.room.room_rev,server_time:new Date(rooms.now()).toISOString()};
    if(publicSnapshot) await rooms.dispatchGame(grant,(game,roomRev)=>{if(socket.readyState===1) socket.send(JSON.stringify({...common,room_rev:roomRev,server_time:new Date(rooms.now()).toISOString(),event_id:randomUUID(),stream:'game',stream_rev:roomRev,type:'game.snapshot',audience:'room',payload:game}));});
    for(const ref of bundle.privateEvents) await rooms.dispatchPrivate(grant,ref.eventId,(event,roomRev)=>{if(socket.readyState===1) socket.send(JSON.stringify({...common,room_rev:roomRev,server_time:new Date(rooms.now()).toISOString(),event_id:event.eventId,stream:'private',stream_rev:event.revision,type:event.type,audience:'member',target_member_id:grant.memberId,payload:event.payload}));});
  }
  app.get('/api/v1/rooms/:roomId/ws',{websocket:true,preValidation:async request=>{
    origin(request);roomId(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);await rooms.rateLimit('ws-upgrade:'+request.ip,120);
  }},(socket,request)=>{
    pending.add(socket);let grant:SocketGrant|undefined;let chain=Promise.resolve();let lastRevision=-1,lastPrivate=0;let lastPing=-Infinity,pollPending=false;
    const deadline=setTimeout(()=>socket.close(4401,'Authentication required'),5000);deadline.unref();
    socket.on('error',()=>{/* Never log raw frames or credentials. */});
    socket.on('message',message=>{
      chain=chain.then(async()=>{
        const raw=message.toString();requireThat(raw.length<=4096,'INVALID_REQUEST',400);const value:unknown=JSON.parse(raw);
        requireThat(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_REQUEST',400);
        const frame=value as Record<string,unknown>;
        if(!grant) {
          requireThat(frame.type==='auth'&&typeof frame.ticket==='string'&&Object.keys(frame).sort().join(',')==='ticket,type','TICKET_INVALID',401);
          const id=roomId(request);grant=await rooms.connect(id,credential(request),frame.ticket);
          clearTimeout(deadline);pending.delete(socket);
          const key=id+':'+grant.memberId;const old=sockets.get(key);if(old) old.socket.close(4409,'Connection replaced');
          sockets.set(key,{socket,grant});const bundle=await rooms.socketState(grant);lastRevision=bundle.room.room_rev;send(socket,grant,bundle.room);await sendGame(socket,grant,bundle,true);lastPrivate=bundle.privateEvents.at(-1)?.revision??lastPrivate;
        } else {
          requireThat(frame.type==='ping'&&Object.keys(frame).length===1,'INVALID_REQUEST',400);
          const now=performance.now();requireThat(now-lastPing>=500,'RATE_LIMITED',429);lastPing=now;await rooms.liveGrant(grant,true);socket.send(JSON.stringify({type:'pong'}));
        }
      }).catch(()=>{socket.close(4401,'Connection unavailable');});
    });
    const ticker=setInterval(()=>{
      // Keep at most one scheduled/in-flight poll. Slow storage must not build
      // a poll backlog ahead of the heartbeat on the same serialized chain.
      if(!grant||socket.readyState!==1||pollPending)return;
      pollPending=true;
      chain=chain.then(async()=>{if(!grant||socket.readyState!==1) return;const bundle=await rooms.socketState(grant,false,lastPrivate),changed=bundle.room.room_rev>lastRevision;if(changed) {lastRevision=bundle.room.room_rev;send(socket,grant,bundle.room);}await sendGame(socket,grant,bundle,changed);lastPrivate=bundle.privateEvents.at(-1)?.revision??lastPrivate;}).catch(()=>socket.close(4401,'Connection unavailable')).finally(()=>{pollPending=false;});
    },1000);ticker.unref();
    socket.on('close',()=>{
      clearTimeout(deadline);clearInterval(ticker);pending.delete(socket);
      if(grant) {const key=grant.roomId+':'+grant.memberId;if(sockets.get(key)?.socket===socket) sockets.delete(key);void rooms.disconnect(grant).catch(()=>{});}
    });
  });
  let maintaining=false;
  const maintenance=setInterval(()=>{if(maintaining) return;maintaining=true;void rooms.maintain().catch(()=>app.log.warn({event:'maintenance_unavailable'},'maintenance_unavailable')).finally(()=>{maintaining=false;});},10000);maintenance.unref();
  app.addHook('preClose',async()=>{clearInterval(maintenance);const connected=[...sockets.values()];for(const socket of pending) socket.terminate();for(const {socket} of connected) socket.terminate();await Promise.allSettled(connected.map(({grant})=>rooms.disconnect(grant)));});
}
