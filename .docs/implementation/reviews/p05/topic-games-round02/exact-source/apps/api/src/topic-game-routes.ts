import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import type {TopicGamePrepare,TopicGameStart,TopicGameMutation,TopicConversationCommand,TopicChatSend,TopicGameReceipt} from '@venus/contracts';
import type {GameHttpGuards} from './game-routes.js';
import type {TopicGames} from './topic-games.js';
import {requireThat} from './security.js';
import {enqueueFencedJson} from './http-delivery.js';
/** Registration is explicit; server.ts never installs this by importing it. */
export function registerTopicGameRoutes(app:FastifyInstance,games:TopicGames,guard:GameHttpGuards){
 const base='/api/v2/rooms/:roomId/game';
 const room=(r:FastifyRequest)=>guard.roomId(r);
 function id(r:FastifyRequest,key:string){const value=(r.params as Record<string,string>)[key];requireThat(typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value),'INVALID_REQUEST',400);return value;}
 async function read(r:FastifyRequest){requireThat(!r.url.includes('?'),'INVALID_REQUEST',400);return guard.privateReadGuard(r);}
 async function mutate(r:FastifyRequest){requireThat(!r.url.includes('?'),'INVALID_REQUEST',400);guard.origin(r);return guard.memberGuard(r);}
 async function receipt(r:FastifyRequest,p:FastifyReply,result:TopicGameReceipt){await games.dispatchReceipt(room(r),guard.credential(r),result,value=>enqueueFencedJson(p,value));return p;}
 app.get(base+'/current',async(r,p)=>{await read(r);await games.dispatchHttpView(room(r),guard.credential(r),v=>enqueueFencedJson(p,v));return p;});
 app.get(base+'/availability',async r=>games.availability(room(r),await read(r)));
 app.get(base+'/self-actions',async(r,p)=>{await games.dispatchSelfActions(room(r),await read(r),v=>enqueueFencedJson(p,v));return p;});
 app.post(base+'/prepare',async(r,p)=>receipt(r,p,await games.prepare(room(r),await mutate(r),r.body as TopicGamePrepare)));
 app.post(base+'/start',async(r,p)=>receipt(r,p,await games.start(room(r),await mutate(r),r.body as TopicGameStart)));
 app.post(base+'/:sessionId/round/advance',async(r,p)=>receipt(r,p,await games.advance(room(r),await mutate(r),id(r,'sessionId'),r.body as TopicGameMutation)));
 app.post(base+'/:sessionId/resume',async(r,p)=>receipt(r,p,await games.resume(room(r),await mutate(r),id(r,'sessionId'),r.body as TopicGameMutation)));
 for(const method of ['stop','pause','abort'] as const)app.post(base+'/:sessionId/'+method,async(r,p)=>receipt(r,p,await games.safetyStop(room(r),await mutate(r),id(r,'sessionId'),r.body as TopicGameMutation,method)));
 const round=base+'/:sessionId/round/:roundId';
 app.get(round+'/target',async(r,p)=>{await games.roundTarget(room(r),await read(r),id(r,'sessionId'),id(r,'roundId'),v=>enqueueFencedJson(p,v));return p;});
 app.post(round+'/response',async(r,p)=>receipt(r,p,await games.response(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as Parameters<TopicGames['response']>[4])));
 app.post(round+'/choice',async(r,p)=>receipt(r,p,await games.choice(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as Parameters<TopicGames['choice']>[4])));
 app.post(round+'/condition',async(r,p)=>receipt(r,p,await games.condition(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as Parameters<TopicGames['condition']>[4])));
 app.post(round+'/finish',async(r,p)=>receipt(r,p,await games.finish(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as Parameters<TopicGames['finish']>[4])));
 app.get(round+'/conversation',async(r,p)=>{await games.dispatchConversation(room(r),await read(r),id(r,'sessionId'),id(r,'roundId'),v=>enqueueFencedJson(p,v));return p;});
 app.post(round+'/conversation/commands',{bodyLimit:8192},async(r,p)=>receipt(r,p,await games.conversationCommand(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as TopicConversationCommand)));
 app.post(round+'/conversation/chat',{bodyLimit:8192},async(r,p)=>receipt(r,p,await games.sendChat(room(r),await mutate(r),id(r,'sessionId'),id(r,'roundId'),r.body as TopicChatSend)));
 app.get(round+'/conversation/chat',async(r,p)=>{await games.dispatchChat(room(r),await read(r),id(r,'sessionId'),id(r,'roundId'),v=>enqueueFencedJson(p,v));return p;});
}
