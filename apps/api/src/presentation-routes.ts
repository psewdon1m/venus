import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {PresentationCommand,PresentationImport,PresentationMutation} from '@venus/contracts';
import type {Presentations} from './presentations.js';
import type {GameHttpGuards} from './game-routes.js';
import {requireThat} from './security.js';
import {enqueueFencedJson,enqueueFencedPng} from './http-delivery.js';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function registerPresentationRoutes(app:FastifyInstance,presentations:Presentations,guard:GameHttpGuards){
 const prefix='/api/v1/rooms/:roomId/presentations';
 const id=(request:FastifyRequest,key:string)=>{const v=(request.params as Record<string,string>)[key];requireThat(v&&UUID.test(v),'INVALID_REQUEST',400);return v.toLowerCase();};
 const noQuery=(request:FastifyRequest)=>requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);
 app.get(prefix,async(request,reply)=>{await guard.privateReadGuard(request);noQuery(request);await presentations.dispatch(guard.roomId(request),guard.credential(request),view=>enqueueFencedJson(reply,view));return reply;});
 app.post(prefix,async(request,reply)=>{const session=await guard.memberGuard(request);noQuery(request);const body=await presentations.command(guard.roomId(request),session,request.body as PresentationCommand,request.id);await presentations.receipt(guard.roomId(request),session,body,view=>enqueueFencedJson(reply,view));return reply;});
 app.post(prefix+'/jobs',async(request,reply)=>{const session=await guard.memberGuard(request);noQuery(request);const body=await presentations.allocate(guard.roomId(request),session,request.body as PresentationImport,request.id);await presentations.receipt(guard.roomId(request),session,body,view=>enqueueFencedJson(reply,view));return reply;});
 app.get(prefix+'/jobs/:jobId',async(request,reply)=>{await guard.privateReadGuard(request);noQuery(request);await presentations.dispatchJob(guard.roomId(request),guard.credential(request),id(request,'jobId'),view=>enqueueFencedJson(reply,view));return reply;});
 app.post(prefix+'/jobs/:jobId/cancel',async(request,reply)=>{const session=await guard.memberGuard(request);noQuery(request);const body=await presentations.cancel(guard.roomId(request),session,id(request,'jobId'),request.body as PresentationMutation,request.id);await presentations.receipt(guard.roomId(request),session,body,view=>enqueueFencedJson(reply,view));return reply;});
 await app.register(async scoped=>{
  const claims=new WeakMap<FastifyRequest,()=>void>(),deadlines=new WeakMap<FastifyRequest,ReturnType<typeof setTimeout>>();
  const release=(request:FastifyRequest)=>{clearTimeout(deadlines.get(request));deadlines.delete(request);claims.get(request)?.();claims.delete(request);request.raw.setTimeout(0);};
  scoped.addContentTypeParser('application/pdf',{parseAs:'buffer',bodyLimit:16*1024*1024},(_request,body,done)=>done(null,body));
  scoped.addHook('preParsing',async(request,_reply,payload)=>{const session=await guard.memberGuard(request);noQuery(request);requireThat(request.headers['content-type']==='application/pdf'&&typeof request.headers['content-length']==='string'&&/^[1-9][0-9]{0,7}$/.test(request.headers['content-length'])&&request.headers['transfer-encoding']===undefined,'INVALID_REQUEST',400);const length=Number(request.headers['content-length']);requireThat(length<=16*1024*1024,'INVALID_REQUEST',413);const sha=request.headers['x-content-sha256'];requireThat(typeof sha==='string'&&/^[a-f0-9]{64}$/.test(sha),'INVALID_REQUEST',400);claims.set(request,await presentations.claimUpload(guard.roomId(request),session,id(request,'jobId'),length,sha));// Socket inactivity is separate from the absolute body-capture budget.
   const deadline=setTimeout(()=>{release(request);request.raw.destroy();},60000);deadline.unref();deadlines.set(request,deadline);
   request.raw.setTimeout(60000,()=>request.raw.destroy());return payload;});
  scoped.addHook('onError',async request=>release(request));scoped.addHook('onResponse',async request=>release(request));scoped.addHook('onRequestAbort',async request=>release(request));
  scoped.put(prefix+'/jobs/:jobId/source',{bodyLimit:16*1024*1024},async(request,reply)=>{requireThat(Buffer.isBuffer(request.body),'INVALID_REQUEST',400);const session=guard.credential(request),body=await presentations.source(guard.roomId(request),session,id(request,'jobId'),request.body);await presentations.receipt(guard.roomId(request),session,body,view=>enqueueFencedJson(reply,view));return reply;});
 });
 app.get(prefix+'/documents/:documentId/versions/:version/pages/:pageIndex',async(request,reply)=>{await guard.privateReadGuard(request);const params=request.params as Record<string,string>,query=request.query as Record<string,unknown>;requireThat(Object.keys(query).join(',')==='expected_rev'&&typeof query.expected_rev==='string'&&/^(0|[1-9][0-9]{0,14})$/.test(query.expected_rev)&&/^(0|[1-9][0-9]?)$/.test(params.pageIndex??''),'INVALID_REQUEST',400);await presentations.page(guard.roomId(request),guard.credential(request),id(request,'documentId'),id(request,'version'),Number(params.pageIndex),Number(query.expected_rev),bytes=>enqueueFencedPng(reply,bytes));return reply;});
}
