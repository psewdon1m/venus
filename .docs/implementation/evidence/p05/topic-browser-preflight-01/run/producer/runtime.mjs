/** Excluded fixture derivative: real composition, synthetic card/map source only. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {setInterval,clearInterval} from 'node:timers';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,symlinkSync,rmSync} from 'node:fs';
import {resolve,join,dirname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import https from 'node:https';
import http from 'node:http';
import {once} from 'node:events';
import {conversationPath,privatePayloadMetadata} from './observations.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const harnessPin='06fb5638c7af93e6fbf62ca1d842e80ecc3fddb629455f14f4d524f9b57ea4fd';
export async function runtime(output){
 assert.equal(process.platform,'linux');assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');
 const original=readFileSync('tests/p05-topic-lifecycle/harness.mjs');assert.equal(sha(original),harnessPin,'Refuse changed included fixture');
 const replacements=[['new PrivateTopicPreferences(rooms,registry,pins)','new PrivateTopicPreferences(rooms,registry,pins,source.map.topics)'],['privateTopics:preferences,logger:false',"privateTopics:preferences,roomCreationProtocol:2,staticRoot:resolve('apps/web/dist'),logger:false"]];
 let text=original.toString('utf8');for(const [before,after]of replacements){assert.equal(text.split(before).length,2,'Each approved replacement must match exactly once');text=text.replace(before,after);}
 const moduleRoot=mkdtempSync(join(tmpdir(),'venus-p05-topic-browser-modules-')),modulePath=join(moduleRoot,'tests/p05-topic-lifecycle/harness.mjs');mkdirSync(dirname(modulePath),{recursive:true});writeFileSync(modulePath,text);
 for(const name of ['apps','packages','node_modules'])symlinkSync(resolve(name),join(moduleRoot,name),'dir');
 symlinkSync(resolve('tests/p05-topic-games'),join(moduleRoot,'tests/p05-topic-games'),'dir');
 writeFileSync(join(output,'harness-original.mjs'),original);writeFileSync(join(output,'harness-derivative.mjs'),text);
 const fixture={original_sha256:sha(original),derivative_sha256:sha(text),exact_semantic_replacements:replacements.map(([before,after])=>({before,after})),module_resolution:'Owned temporary mirror links to frozen /app paths; original import bytes unchanged',synthetic_source_only:true,production_approval:false};writeFileSync(join(output,'fixture-diff.json'),JSON.stringify(fixture,null,2));
 const m=await import(pathToFileURL(modulePath).href),h=m.harness();let upstreamPort=0,wsBlocked=false,holdReads=false,holdSelection=null,holdGeneration=0,closed=false,timer,last=0,clockStart=performance.now();const sockets=new Set(),held=[];const transport=[];
 const edge=https.createServer({cert:readFileSync('tests/fixtures/p02-test-cert.pem'),key:readFileSync('tests/fixtures/p02-test-key.pem')},(request,reply)=>{
  if(!upstreamPort){reply.writeHead(503);reply.end();return;}
  const upstream=http.request({host:'127.0.0.1',port:upstreamPort,path:request.url,method:request.method,headers:request.headers,agent:false},response=>{
   if(holdReads&&request.method==='GET'&&/^\/api\/v2\/rooms\/[a-f0-9-]+\/game\//.test(request.url)&&(!holdSelection||request.url===conversationPath(holdSelection))){
    const selection=holdSelection,generation=holdGeneration,bytes=[];let size=0;response.on('data',b=>{size+=b.length;if(size>1024*1024){upstream.destroy();reply.destroy();return;}bytes.push(b);});response.on('end',()=>{const queuedAt=performance.now(),body=Buffer.concat(bytes),metadata=privatePayloadMetadata(request.url,response.statusCode,body,selection);if(!holdReads||generation!==holdGeneration||selection&&!metadata){reply.writeHead(response.statusCode,response.headers);reply.end(body);transport.push({kind:'private_hold_candidate_rejected',status:response.statusCode});return;}const row={reply,status:response.statusCode,headers:response.headers,body,queuedAt,metadata};held.push(row);transport.push({kind:'held_real_backend_response',status:response.statusCode,queued_at_monotonic_ms:queuedAt,...metadata});});return;
   }
   reply.writeHead(response.statusCode,response.headers);response.pipe(reply);
  });upstream.on('error',()=>{if(!reply.headersSent)reply.writeHead(502);reply.end();});request.on('error',()=>upstream.destroy());request.pipe(upstream);
 });
 edge.on('upgrade',(request,socket,head)=>{
  if(wsBlocked||!upstreamPort){socket.destroy();return;}sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});
  const upstream=http.request({host:'127.0.0.1',port:upstreamPort,path:request.url,method:'GET',headers:request.headers,agent:false});
  upstream.on('upgrade',(response,remote,remoteHead)=>{socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([key,value])=>key+': '+value+'\r\n').join('')+'\r\n');if(head.length)remote.write(head);if(remoteHead.length)socket.write(remoteHead);remote.pipe(socket);socket.pipe(remote);socket.on('error',()=>remote.destroy());remote.on('error',()=>socket.destroy());socket.on('close',()=>remote.destroy());remote.on('close',()=>socket.destroy());});
  upstream.on('error',()=>socket.destroy());upstream.on('response',r=>{r.resume();socket.destroy();});upstream.end();
 });
 async function close(){if(closed)return;closed=true;clearInterval(timer);for(const socket of sockets)socket.destroy();for(const row of held.splice(0))row.reply.destroy();const errors=[];try{edge.closeAllConnections();if(edge.listening)await new Promise((done,reject)=>edge.close(e=>e?reject(e):done()));}catch(e){errors.push(e);}try{await h.cleanup();}catch(e){errors.push(e);}try{const target=resolve(moduleRoot);assert.equal(dirname(target),resolve(tmpdir()));assert(target.startsWith(resolve(tmpdir())+sep+'venus-p05-topic-browser-modules-'));rmSync(target,{recursive:true,force:true});}catch(e){errors.push(e);}if(errors.length)throw new AggregateError(errors,'Owned runtime cleanup failed');}
 try{await m.migrate(h.pool);await m.migrateGames(h.pool);await m.migrateChat(h.pool);await m.migratePrivateTopics(h.pool);await m.privateTopicSchemaProbe(h.pool);await h.listen();upstreamPort=Number(new URL(h.rooms.options.origin).port);edge.listen(0,'127.0.0.1');await once(edge,'listening');const origin=`https://127.0.0.1:${edge.address().port}`;h.rooms.options.origin=origin;clockStart=performance.now();last=0;timer=setInterval(()=>{const elapsed=Math.floor(performance.now()-clockStart);h.tick(elapsed-last);last=elapsed;},50);
  fixture.pins=h.source.map.pins;fixture.pack_digest=h.source.pack.digest;fixture.taxonomy_labels_identical_across_locales=true;fixture.clock='Existing fixture h.tick driven native performance elapsed at50ms, epoch1000000; browser performance remains native';writeFileSync(join(output,'fixture-diff.json'),JSON.stringify(fixture,null,2));
  return {h,origin,fixture,transport,holdReads(value,selection=null){holdGeneration++;holdReads=value;holdSelection=selection;},heldCount:()=>held.length,heldPrivate:()=>held.filter(row=>row.metadata?.private_payload).map(row=>({...row.metadata})),releaseReads(){holdGeneration++;holdReads=false;holdSelection=null;const released=[];for(const row of held.splice(0)){const metadata={kind:'released_real_backend_response',status:row.status,elapsed_ms:performance.now()-row.queuedAt,aborted:row.reply.destroyed,...row.metadata};transport.push(metadata);released.push(metadata);if(!row.reply.destroyed){row.reply.writeHead(row.status,row.headers);row.reply.end(row.body);}}return released;},disconnect(){wsBlocked=true;for(const socket of sockets)socket.destroy();},reconnect(){wsBlocked=false;},sourceEnabled(value){h.source.setEnabled(value);},async plan(room){const f={room};await h.current(f);return {session:f.game,data:f.data,plan:f.plan};},close};
 }catch(error){try{await close();}catch(cleanupError){throw new AggregateError([error,cleanupError],'Runtime startup/cleanup failed',{cause:cleanupError});}throw error;}
}
