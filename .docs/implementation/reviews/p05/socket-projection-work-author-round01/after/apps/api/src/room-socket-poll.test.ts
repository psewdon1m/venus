import {EventEmitter} from 'node:events';
import {describe,it,expect,vi,afterEach} from 'vitest';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type WebSocket from 'ws';
import {registerRooms} from './room-routes.js';
import type {Rooms} from './rooms.js';

/** Execute the registered production WS handler with slow service doubles.
 * This proves scheduling/failure behavior, not SQL, upgrade authentication or
 * the unobserved cause of a historical browser disconnect. */
async function fixture() {
 vi.useFakeTimers();
 let handler:((socket:WebSocket,request:FastifyRequest)=>void)|undefined;
 let closeHook:(()=>Promise<void>)|undefined,releasePoll:()=>void=()=>{};
 let calls=0,failPoll=false;
 const wait=new Promise<void>(resolve=>{releasePoll=resolve;});
 const order:string[]=[],grant={roomId:'11111111-1111-4111-8111-111111111111',memberId:'actor',generation:1,sessionHash:'fixture'};
 const socketState=vi.fn(async()=>{
  calls++;order.push('poll:'+calls);
  if(calls===2)await wait;
  if(failPoll&&calls>1)throw Error('fixture storage unavailable');
  return {room:{room_rev:calls},privateEvents:[]};
 });
 const service={options:{origin:'https://localhost'},now:()=>1000,connect:vi.fn(async()=>grant),socketState,
  liveGrant:vi.fn(async()=>{order.push('heartbeat');}),dispatchGame:vi.fn(async()=>{}),
  dispatchPrivate:vi.fn(async()=>{}),disconnect:vi.fn(async()=>{}),maintain:vi.fn(async()=>{})};
 const app={register:async()=>{},route:()=>{},post:()=>{},put:()=>{},get:(path:string,...args:unknown[])=>{
  if(path.endsWith('/ws'))handler=args.at(-1) as typeof handler;
 },addHook:(_name:string,hook:()=>Promise<void>)=>{closeHook=hook;},log:{warn:()=>{}}};
 await registerRooms(app as unknown as FastifyInstance,service as unknown as Rooms);
 const socket=Object.assign(new EventEmitter(),{readyState:1,send:vi.fn(),close:vi.fn(()=>{
  socket.readyState=3;socket.emit('close');
 }),terminate:()=>{socket.readyState=3;socket.emit('close');}});
 handler!(socket as unknown as WebSocket,{params:{roomId:grant.roomId},headers:{cookie:'venus_room_session=fixture'},cookies:{venus_room_session:'fixture'}} as unknown as FastifyRequest);
 socket.emit('message',Buffer.from(JSON.stringify({type:'auth',ticket:'fixture'})));
 await vi.advanceTimersByTimeAsync(0);
 return {socket,service,order,releasePoll,setFailure:()=>{failPoll=true;},async close(){releasePoll();await vi.advanceTimersByTimeAsync(0);await closeHook!();}};
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
});
