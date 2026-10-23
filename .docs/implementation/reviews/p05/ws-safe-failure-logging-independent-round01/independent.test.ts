import {EventEmitter} from 'node:events';
import {describe,it,expect,vi,afterEach} from 'vitest';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type WebSocket from 'ws';
import {registerRooms} from '../../../../../apps/api/src/room-routes.js';
import type {Rooms} from '../../../../../apps/api/src/rooms.js';

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


describe('independent safe logging adversarial boundaries',()=>{
 it('revoked Proxy and primitive thrown values do not run conversion hooks or disclose values',async()=>{
  const revocable=Proxy.revocable({},{});revocable.revoke();
  for(const error of [revocable.proxy,Symbol('PRIVATE_UNPRINTABLE_CANARY')]){const f=await fixture({connectError:error});try{expect(f.events).toEqual([{event:'websocket_failed',phase:'auth_or_heartbeat',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'UNKNOWN',failure_code:'UNKNOWN'}]);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}}
 });
 it('native error with safe code never invokes private accessor stack/message/name or toJSON',async()=>{
  let calls=0;const error=Object.assign(new Error(),{code:'AUTH_REQUIRED',toJSON(){calls++;throw Error('PRIVATE_CANARY');}});
  for(const field of ['stack','message','name'])Object.defineProperty(error,field,{get(){calls++;throw Error('PRIVATE_CANARY');},configurable:true});
  const f=await fixture({connectError:error});try{expect(f.events).toEqual([{event:'websocket_failed',phase:'auth_or_heartbeat',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'Error',failure_code:'UNKNOWN',domain_code:'AUTH_REQUIRED'}]);expect(calls).toBe(0);expect(JSON.stringify(f.events)).not.toContain('PRIVATE_CANARY');expect(calls).toBe(0);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('throwing logger consumes only this socket latch and queued failure cannot emit again',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('PRIVATE_CANARY'),{code:'SOCKET_REPLACED'}),loggerError:true});
  try{await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from('{"type":"ping"}'));f.setFailure(Object.assign(new Error('PRIVATE_CANARY'),{code:'TOPIC_LEDGER_BUSY'}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'poll',domain_code:'TOPIC_LEDGER_BUSY'});expect(f.service.liveGrant).toHaveBeenCalledOnce();expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
  const next=await fixture({connectError:Object.assign(new Error('PRIVATE_CANARY'),{code:'AUTH_REQUIRED'})});try{expect(next.events).toHaveLength(1);expect(next.events[0]).toMatchObject({phase:'auth_or_heartbeat',domain_code:'AUTH_REQUIRED'});}finally{await next.close();}
 });
});
