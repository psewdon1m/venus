import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import {resolve} from 'node:path';
import {once} from 'node:events';
import {clearTimeout} from 'node:timers';
export const cert=readFileSync('tests/fixtures/p02-test-cert.pem');
const key=readFileSync('tests/fixtures/p02-test-key.pem');
export async function startRuntime(extra={}) {
  let port=0;
  const edge=https.createServer({cert,key},(request,reply)=>{
    if(!port) {reply.writeHead(503);reply.end();return;}
    const upstream=http.request({hostname:'127.0.0.1',port,path:request.url,method:request.method,headers:request.headers},response=>{reply.writeHead(response.statusCode,response.headers);response.pipe(reply);});
    upstream.on('error',()=>{reply.writeHead(503);reply.end();});request.pipe(upstream);
  });
  edge.on('upgrade',(request,socket,head)=>{
    const upstream=http.request({hostname:'127.0.0.1',port,path:request.url,method:'GET',headers:request.headers});
    upstream.on('upgrade',(response,upstreamSocket,upstreamHead)=>{
      socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');
      if(head.length) upstreamSocket.write(head);if(upstreamHead.length) socket.write(upstreamHead);
      upstreamSocket.pipe(socket);socket.pipe(upstreamSocket);
      socket.on('error',()=>upstreamSocket.destroy());upstreamSocket.on('error',()=>socket.destroy());
      socket.on('close',()=>upstreamSocket.destroy());upstreamSocket.on('close',()=>socket.destroy());
    });
    upstream.on('response',response=>{socket.end(`HTTP/1.1 ${response.statusCode} Rejected\r\nConnection: close\r\n\r\n`);response.resume();});
    upstream.on('error',()=>socket.destroy());upstream.end();
  });
  edge.listen(0,'127.0.0.1');await once(edge,'listening');const origin=`https://127.0.0.1:${edge.address().port}`;
  let child;
  async function boot() {
    child=spawn(process.execPath,['tests/p02/server.mjs'],{cwd:process.cwd(),env:{...process.env,...extra,APP_ORIGIN:origin},stdio:['ignore','pipe','pipe','ipc']});
    let errors='';child.stderr.on('data',b=>{errors+=b.toString();});
    port=await new Promise((resolve,reject)=>{
      let text='';child.stdout.on('data',b=>{text+=b.toString();for(const line of text.split('\n')) {try {const v=JSON.parse(line);if(v.test_server_port) resolve(v.test_server_port);} catch { /* Ignore incomplete stdout. */ }}});
      child.once('exit',code=>reject(new Error(`Isolated server exited ${code}: ${errors}`)));
    });
  }
  async function stopChild() {
    if(child.exitCode!==null||child.signalCode!==null) {port=0;return;}
    const stopped=once(child,'exit');
    if(child.connected) child.send({type:'shutdown'});else child.kill('SIGTERM');
    let timer;
    try {await Promise.race([stopped,new Promise((_resolve,reject)=>{timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Isolated server graceful shutdown timed out'));},15000);})]);}
    finally {clearTimeout(timer);port=0;}
  }
  await boot();
  return {origin,pause:stopChild,resume:boot,async restart(changes={}){Object.assign(extra,changes);await stopChild();await boot();},async close(){await stopChild();edge.closeAllConnections();await new Promise(resolve=>edge.close(resolve));}};
}
export function request(origin,path,{method='GET',body,headers={}}={}) {
  return new Promise((resolve,reject)=>{
    const bytes=body===undefined?undefined:Buffer.from(JSON.stringify(body));
    const request=https.request(origin+path,{method,ca:cert,headers:{...headers,...(bytes?{'content-type':'application/json','content-length':bytes.length}:{})}},response=>{
      let text='';response.on('data',b=>{text+=b.toString();});response.on('end',()=>{let json;try {json=JSON.parse(text);} catch { /* Static responses need not be JSON. */ }resolve({status:response.statusCode,headers:response.headers,body:json,text});});
    });request.on('error',reject);request.end(bytes);
  });
}
export async function client(origin) {
  const jar=new Map(),roomCsrf=new Map();let admissionCsrf='';
  async function call(path,options={}) {
    const room=path.match(/^\/api\/v1\/rooms\/([a-f0-9-]{36})/i)?.[1];
    const isPublic=path==='/api/v1/rooms'||path==='/api/v1/invitations/resolve'||path.endsWith('/join');
    const result=await request(origin,path,{...options,headers:{origin,cookie:[...jar.entries()].map(([k,v])=>k+'='+v).join('; '),'x-csrf-token':isPublic?admissionCsrf:roomCsrf.get(room)??'',...options.headers}});
    for(const row of result.headers['set-cookie']??[]) {const [pair]=row.split(';'),index=pair.indexOf('=');const k=pair.slice(0,index),v=pair.slice(index+1);if(v) jar.set(k,v);else jar.delete(k);}
    if(result.headers['x-csrf-token']) roomCsrf.set(room??result.body?.room_id,result.headers['x-csrf-token']);return result;
  }
  const policy=await call('/api/v1/entry-policy');admissionCsrf=policy.body.csrf_token;
  const offer=policy.body.offer;
  const acceptance=offer?{offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true}:null;
  return {call,acceptance,get cookies(){return [...jar.entries()].map(([k,v])=>k+'='+v).join('; ');},jar};
}
export const setClock=value=>writeFileSync(resolve(process.env.P02_CLOCK_FILE),String(value));
