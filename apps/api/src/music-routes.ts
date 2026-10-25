import type {FastifyInstance} from 'fastify';
import type {MusicCommand} from '@venus/contracts';
import type {Music} from './music.js';
import type {GameHttpGuards} from './game-routes.js';
import {requireThat} from './security.js';
import {enqueueFencedJson} from './http-delivery.js';
export function registerMusicRoutes(app:FastifyInstance,music:Music,guard:GameHttpGuards){
 const prefix='/api/v1/rooms/:roomId/music';
 app.get(prefix,async(request,reply)=>{await guard.privateReadGuard(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);await music.dispatch(guard.roomId(request),guard.credential(request),view=>{enqueueFencedJson(reply,view);});return reply;});
 app.post(prefix,async request=>{const session=await guard.memberGuard(request);requireThat(!request.url.includes('?'),'INVALID_REQUEST',400);return music.command(guard.roomId(request),session,request.body as MusicCommand,request.id);});
 app.get(prefix+'/tracks/:trackId/stream',async(request,reply)=>{
  if(request.headers.origin!==undefined)guard.origin(request);
  requireThat(request.headers['sec-fetch-site']==='same-origin'&&(request.headers['sec-fetch-dest']==='audio'||request.headers.origin!==undefined),'ORIGIN_FORBIDDEN');
  const query=request.query as Record<string,unknown>;requireThat(Object.keys(query).length===0||Object.keys(query).join(',')==='personal'&&query.personal==='1','INVALID_REQUEST',400);
  const trackId=(request.params as {trackId:string}).trackId;requireThat(/^[a-z0-9][a-z0-9_-]{0,63}$/.test(trackId),'INVALID_REQUEST',400);
  const session=guard.credential(request);requireThat(session,'AUTH_REQUIRED',401);await music.rooms.rateLimit('music-stream:'+music.rooms.csrf(session),240);
  const value=await music.stream(guard.roomId(request),session,trackId,request.headers.range,query.personal==='1');
  try{await value.deliver(reply.raw,()=>{
   const headers:Record<string,string|number>={'Accept-Ranges':'bytes','Content-Type':value.mime,'Content-Length':value.end-value.start+1,'ETag':value.etag,'Cache-Control':'no-store, private','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
   if(value.partial)headers['Content-Range']=`bytes ${value.start}-${value.end}/${value.size}`;
   reply.code(value.partial?206:200);reply.hijack();reply.raw.writeHead(value.partial?206:200,headers);
  },request.method==='HEAD');return reply;}finally{value.close();}
 });
}
