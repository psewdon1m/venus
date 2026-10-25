import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {CallJoin,CallMutation} from '@venus/contracts';
import type {GameHttpGuards} from './game-routes.js';
import type {Calls} from './calls.js';
import {requireThat} from './security.js';
import {enqueueFencedJson} from './http-delivery.js';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function command(request:FastifyRequest,keys:string){const v=request.body;requireThat(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys,'INVALID_REQUEST',400);const body=v as Record<string,unknown>;requireThat(Number.isSafeInteger(body.expected_rev)&&(body.expected_rev as number)>=0&&typeof body.idempotency_key==='string'&&uuid.test(body.idempotency_key),'INVALID_REQUEST',400);return body;}
function source(request:FastifyRequest){const v=command(request,'audio,expected_rev,idempotency_key,video');requireThat(typeof v.audio==='boolean'&&typeof v.video==='boolean','INVALID_REQUEST',400);return v as unknown as CallJoin;}
export function registerCallRoutes(app:FastifyInstance,calls:Calls,guard:GameHttpGuards){
 const root='/api/v1/rooms/:roomId/calls',id=(r:FastifyRequest)=>{const v=(r.params as {scopeId:string}).scopeId;requireThat(uuid.test(v),'INVALID_REQUEST',400);return v;};
 const mutate=async(r:FastifyRequest)=>{const session=await guard.memberGuard(r);await calls.media.rooms.rateLimit('calls:'+calls.media.rooms.csrf(session??''),40);return session;};
 app.get(root,async(request,reply)=>{await guard.privateReadGuard(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);await calls.inspect(guard.roomId(request),guard.credential(request),view=>enqueueFencedJson(reply,view));return reply;});
 app.post(root+'/general/join',async(request,reply)=>{const session=await mutate(request);await calls.generalJoin(guard.roomId(request),session,source(request),grant=>enqueueFencedJson(reply,grant));return reply;});
 app.post(root+'/pairs/invite',async(request,reply)=>{const session=await mutate(request),v=command(request,'expected_rev,idempotency_key,member_id');requireThat(typeof v.member_id==='string'&&uuid.test(v.member_id),'INVALID_REQUEST',400);await calls.invite(guard.roomId(request),session,v as unknown as CallMutation&{member_id:string},view=>enqueueFencedJson(reply,view));return reply;});
 app.post(root+'/pairs/:scopeId/accept',async(request,reply)=>{const session=await mutate(request),v=command(request,'expected_rev,idempotency_key');await calls.accept(guard.roomId(request),session,id(request),v as unknown as CallMutation,view=>enqueueFencedJson(reply,view));return reply;});
 app.post(root+'/pairs/:scopeId/media',async(request,reply)=>{const session=await mutate(request);await calls.pairMedia(guard.roomId(request),session,id(request),source(request),grant=>enqueueFencedJson(reply,grant));return reply;});
 for(const action of ['decline','cancel'] as const)app.post(root+'/pairs/:scopeId/'+action,async request=>{const session=await mutate(request),v=command(request,'expected_rev,idempotency_key');return calls.end(guard.roomId(request),session,id(request),v as unknown as CallMutation,action);});
 app.post(root+'/:scopeId/leave',async request=>{const session=await mutate(request),v=command(request,'expected_rev,idempotency_key');return calls.end(guard.roomId(request),session,id(request),v as unknown as CallMutation,'leave');});
}
