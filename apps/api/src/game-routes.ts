import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {PrepareGame,StartGame,RevisionMutation,RoundResponse,RoundChoice,YesButCondition,SafetyStop} from '@venus/contracts';
import type {Games} from './games.js';
import {requireThat} from './security.js';
export interface GameHttpGuards {
  roomId:(request:FastifyRequest)=>string;
  origin:(request:FastifyRequest)=>void;
  credential:(request:FastifyRequest)=>string|undefined;
  memberGuard:(request:FastifyRequest)=>Promise<string|undefined>;
  body:<T>(request:FastifyRequest,schema:string)=>T;
}
export function registerGameRoutes(app:FastifyInstance,games:Games,guard:GameHttpGuards) {
  const prefix='/api/v1/rooms/:roomId/game';
  function id(request:FastifyRequest,key:string) {const value=(request.params as Record<string,string>)[key];requireThat(value&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value),'INVALID_REQUEST',400);return value.toLowerCase();}
  app.get(prefix+'/current',async request=>{if(request.headers.origin!==undefined) guard.origin(request);return games.getCurrent(guard.roomId(request),guard.credential(request));});
  app.post(prefix+'/prepare',async request=>games.prepare(guard.roomId(request),await guard.memberGuard(request),guard.body<PrepareGame>(request,'PrepareGame'),request.id));
  app.post(prefix+'/start',async request=>games.start(guard.roomId(request),await guard.memberGuard(request),guard.body<StartGame>(request,'StartGame'),request.id));
  app.post(prefix+'/:sessionId/round/advance',async request=>games.advance(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),guard.body<RevisionMutation>(request,'RevisionMutation'),request.id));
  for(const method of ['pause','resume'] as const) app.post(prefix+'/:sessionId/'+method,async request=>games[method](guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),guard.body<RevisionMutation>(request,'RevisionMutation'),request.id));
  for(const method of ['stop','abort'] as const) app.post(prefix+'/:sessionId/'+method,async request=>games.stop(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),guard.body<SafetyStop>(request,'SafetyStop'),request.id,method==='abort'));
  app.post(prefix+'/:sessionId/round/:roundId/response',async request=>games.response(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),id(request,'roundId'),guard.body<RoundResponse>(request,'RoundResponse'),request.id));
  app.post(prefix+'/:sessionId/round/:roundId/choice',async request=>games.choice(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),id(request,'roundId'),guard.body<RoundChoice>(request,'RoundChoice'),request.id));
  app.post(prefix+'/:sessionId/round/:roundId/condition',async request=>games.condition(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),id(request,'roundId'),guard.body<YesButCondition>(request,'YesButCondition'),request.id));
  app.post(prefix+'/:sessionId/round/:roundId/finish',async request=>games.finish(guard.roomId(request),await guard.memberGuard(request),id(request,'sessionId'),id(request,'roundId'),guard.body<SafetyStop>(request,'SafetyStop'),request.id));
  for(const [path,kind] of [['invitation','invitation'],['private','private'],['action-consent','action'],['condition','condition']] as const) app.get(prefix+'/:sessionId/round/:roundId/'+path,async request=>{
    if(request.headers.origin!==undefined) guard.origin(request);return games.readTarget(guard.roomId(request),guard.credential(request),id(request,'sessionId'),id(request,'roundId'),kind);
  });
}
