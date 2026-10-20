import {describe,it,expect,vi} from 'vitest';
import Fastify from 'fastify';
import {registerTopicGameRoutes} from './topic-game-routes.js';
import type {TopicGames} from './topic-games.js';
import type {GameHttpGuards} from './game-routes.js';
import {DomainError} from './security.js';
describe('additive coherent round-view route',()=>{
 it('uses private read guard, exact IDs and fenced no-store delivery',async()=>{const app=Fastify(),read=vi.fn(async()=> 'credential'),dispatch=vi.fn(async(...args:unknown[])=>{(args[4]as (v:unknown)=>void)({schema_version:2,own:{safe:true},target:null,conversation:null,chat:null});});
  const guard={roomId:r=>(r.params as {roomId:string}).roomId,privateReadGuard:read,credential:()=> 'credential',origin:()=>{},memberGuard:async()=> 'credential'} as GameHttpGuards;
  registerTopicGameRoutes(app,{dispatchRoundView:dispatch} as unknown as TopicGames,guard);
  const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',round='33333333-3333-4333-8333-333333333333',url=`/api/v2/rooms/${room}/game/${session}/round/${round}/view`;
  try{const response=await app.inject({method:'GET',url});expect(response.statusCode).toBe(200);expect(response.headers['cache-control']).toBe('no-store');expect(dispatch.mock.calls[0]?.slice(0,4)).toEqual([room,'credential',session,round]);expect(read).toHaveBeenCalledTimes(1);expect((await app.inject({method:'GET',url:url+'?query=1'})).statusCode).toBe(400);expect(dispatch).toHaveBeenCalledTimes(1);expect((await app.inject({method:'GET',url:url.replace(session,'invalid')})).statusCode).toBe(400);expect(dispatch).toHaveBeenCalledTimes(1);read.mockRejectedValue(new DomainError('AUTH_REQUIRED',401));expect((await app.inject({method:'GET',url})).statusCode).toBe(401);expect(dispatch).toHaveBeenCalledTimes(1);}finally{await app.close();}
 });
});
