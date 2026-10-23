import {EventEmitter} from 'node:events';
import {describe,it,expect,vi,afterEach} from 'vitest';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type WebSocket from 'ws';
import {registerRooms} from './room-routes.js';
import type {Rooms} from './rooms.js';

/** Execute the registered production WS handler with slow service doubles.
 * This proves scheduling/failure behavior, not SQL, upgrade authentication or
 * the unobserved cause of a historical browser disconnect. */
async function fixture(input:{connectError?:unknown;heartbeatError?:unknown;loggerError?:boolean;requestId?:string}={}) {
 vi.useFakeTimers();
 let handler:((socket:WebSocket,request:FastifyRequest)=>void)|undefined;
 let closeHook:(()=>Promise<void>)|undefined,releasePoll:()=>void=()=>{};
 let calls=0,failPoll=false;let pollError:unknown=Error('fixture storage unavailable');const events:Record<string,unknown>[]=[];
 const wait=new Promise<void>(resolve=>{releasePoll=resolve;});
 const order:string[]=[],grant={roomId:'11111111-1111-4111-8111-111111111111',memberId:'actor',generation:1,sessionHash:'fixture'};
 const socketState=vi.fn(async()=>{
  calls++;order.push('poll:'+calls);
  if(calls===2)await wait;
  if(failPoll&&calls>1)throw pollError;
  return {room:{room_rev:calls},privateEvents:[]};
 });
 const service={options:{origin:'https://localhost'},now:()=>1000,connect:vi.fn(async()=>{if('connectError'in input)throw input.connectError;return grant;}),socketState,
  liveGrant:vi.fn(async()=>{order.push('heartbeat');if('heartbeatError'in input)throw input.heartbeatError;}),dispatchGame:vi.fn(async()=>{}),
  dispatchPrivate:vi.fn(async()=>{}),disconnect:vi.fn(async()=>{}),maintain:vi.fn(async()=>{})};
 const app={register:async()=>{},route:()=>{},post:()=>{},put:()=>{},get:(path:string,...args:unknown[])=>{
  if(path.endsWith('/ws'))handler=args.at(-1) as typeof handler;
 },addHook:(_name:string,hook:()=>Promise<void>)=>{closeHook=hook;},log:{warn:(event:Record<string,unknown>)=>{events.push(event);if(input.loggerError)throw Error('logger unavailable');}}};
 await registerRooms(app as unknown as FastifyInstance,service as unknown as Rooms);
 const socket=Object.assign(new EventEmitter(),{readyState:1,send:vi.fn(),close:vi.fn(()=>{
  socket.readyState=3;socket.emit('close');
 }),terminate:()=>{socket.readyState=3;socket.emit('close');}});
 handler!(socket as unknown as WebSocket,{id:input.requestId??'11111111-1111-4111-8111-111111111111',params:{roomId:grant.roomId},headers:{cookie:'venus_room_session=fixture'},cookies:{venus_room_session:'fixture'}} as unknown as FastifyRequest);
 socket.emit('message',Buffer.from(JSON.stringify({type:'auth',ticket:'fixture'})));
 await vi.advanceTimersByTimeAsync(0);
 return {socket,service,order,events,releasePoll,setFailure:(error:unknown=Error('fixture storage unavailable'))=>{failPoll=true;pollError=error;},async close(){releasePoll();await vi.advanceTimersByTimeAsync(0);await closeHook!();}};
}

afterEach(()=>{vi.useRealTimers();});

describe('bounded ordinary room WS polling',()=>{
 it('coalesces slow poll ticks so queued polls cannot starve a heartbeat',async()=>{
  const f=await fixture();try{
   await vi.advanceTimersByTimeAsync(6000);expect(f.service.socketState).toHaveBeenCalledTimes(2);
   expect(f.service.socketState).toHaveBeenNthCalledWith(1,expect.anything(),false,0,{projection:'private'});
   expect(f.service.socketState).toHaveBeenNthCalledWith(2,expect.anything(),false,0,{projection:'private'});
   f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));
   await vi.advanceTimersByTimeAsync(0);f.releasePoll();await vi.advanceTimersByTimeAsync(0);
   expect(f.order).toEqual(['poll:1','poll:2','heartbeat']);
   expect(f.service.liveGrant).toHaveBeenCalledWith(expect.anything(),true);
   expect(f.socket.send).toHaveBeenCalledWith(JSON.stringify({type:'pong'}));
   await vi.advanceTimersByTimeAsync(1000);
   expect(f.service.socketState).toHaveBeenCalledTimes(3);
   expect(f.service.dispatchGame).toHaveBeenCalledTimes(3);
  }finally{await f.close();}
 });
 it('retains fail-closed storage errors and stops polling after socket close',async()=>{
  const f=await fixture();try{
   await vi.advanceTimersByTimeAsync(3000);f.setFailure();f.releasePoll();await vi.advanceTimersByTimeAsync(0);
   expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');
   const calls=f.service.socketState.mock.calls.length;await vi.advanceTimersByTimeAsync(10000);
   expect(f.service.socketState).toHaveBeenCalledTimes(calls);
   expect(f.service.liveGrant).not.toHaveBeenCalled();
  }finally{await f.close();}
 });

 it('logs one safe poll failure then still closes4401, without raw private error content',async()=>{
  const secret='WS_PRIVATE_BODY_COOKIE_TOKEN_MESSAGE\nCANARY',f=await fixture();try{await vi.advanceTimersByTimeAsync(1000);f.setFailure(Object.assign(new TypeError(secret),{code:'40P01',cookie:secret,body:secret,frames:[secret]}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({event:'websocket_failed',phase:'poll',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'TypeError',failure_code:'40P01'});expect(JSON.stringify(f.events)).not.toContain('WS_PRIVATE');expect(Object.keys(f.events[0]).every(k=>['event','phase','request_id','error_kind','failure_code','domain_code','source_module','source_line','source_column'].includes(k))).toBe(true);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('logs auth failure as safe policy enum and omits invalid request IDs',async()=>{
  const f=await fixture({connectError:Object.assign(new Error('private cookie'),{code:'AUTH_REQUIRED'}),requestId:'private-cookie-invalid-id'});try{expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({event:'websocket_failed',phase:'auth_or_heartbeat',domain_code:'AUTH_REQUIRED'});expect(f.events[0]).not.toHaveProperty('request_id');expect(JSON.stringify(f.events)).not.toContain('private');expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('keeps a one-socket latch when a queued heartbeat also fails after the poll',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('private'),{code:'CONSENT_EXPIRED'})});try{await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));f.setFailure(Object.assign(new Error('private'),{code:'ACTORS_UNAVAILABLE'}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'poll',domain_code:'ACTORS_UNAVAILABLE'});expect(f.service.liveGrant).toHaveBeenCalledOnce();expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('heartbeat failure is categorized while logger failure cannot prevent connection closure',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('private'),{code:'SOCKET_REPLACED'}),loggerError:true});try{f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'auth_or_heartbeat',domain_code:'SOCKET_REPLACED'});expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('normal auth, polls and heartbeat emit no failure events',async()=>{const f=await fixture();try{f.releasePoll();await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));await vi.advanceTimersByTimeAsync(0);expect(f.events).toEqual([]);expect(f.socket.send).toHaveBeenCalledWith(JSON.stringify({type:'pong'}));expect(f.socket.close).not.toHaveBeenCalled();}finally{await f.close();}});
 it('does not invoke hostile error Proxy hooks in the actual handler diagnostic path',async()=>{
  let calls=0;const error=new Proxy({}, {getOwnPropertyDescriptor(){calls++;throw Error('private');},getPrototypeOf(){calls++;throw Error('private');}}),f=await fixture({heartbeatError:error});try{f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toEqual({event:'websocket_failed',phase:'auth_or_heartbeat',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'UNKNOWN',failure_code:'UNKNOWN'});expect(calls).toBe(0);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
});
