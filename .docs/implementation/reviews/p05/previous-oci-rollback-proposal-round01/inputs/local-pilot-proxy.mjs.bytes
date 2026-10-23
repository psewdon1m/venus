/** Local Docker TLS fixture only. No public TLS/Cloudflare readiness claim. */
import https from 'node:https';
import http from 'node:http';
import {readFileSync} from 'node:fs';
const server=https.createServer({cert:readFileSync('/run/fixture/cert.pem'),key:readFileSync('/run/fixture/key.pem')},(request,reply)=>{
  const upstream=http.request({hostname:'app',port:4300,path:request.url,method:request.method,headers:request.headers,timeout:15000,agent:false},response=>{reply.writeHead(response.statusCode,response.headers);response.pipe(reply);});
  upstream.on('timeout',()=>upstream.destroy());
  upstream.on('error',()=>{if(!reply.headersSent) reply.writeHead(503);reply.end();});
  request.on('error',()=>upstream.destroy());reply.on('close',()=>{if(!reply.writableFinished) upstream.destroy();});request.pipe(upstream);
});
server.on('upgrade',(request,socket,head)=>{
  const upstream=http.request({hostname:'app',port:4300,path:request.url,method:'GET',headers:request.headers,timeout:15000,agent:false});
  upstream.on('upgrade',(response,peer,peerHead)=>{
    upstream.setTimeout(0);
    socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');
    if(head.length) peer.write(head);if(peerHead.length) socket.write(peerHead);
    peer.pipe(socket);socket.pipe(peer);
    socket.on('error',()=>peer.destroy());peer.on('error',()=>socket.destroy());socket.on('close',()=>peer.destroy());peer.on('close',()=>socket.destroy());
  });
  upstream.on('response',response=>{socket.end(`HTTP/1.1 ${response.statusCode} Rejected\r\nConnection: close\r\n\r\n`);response.resume();});
  upstream.on('timeout',()=>upstream.destroy());upstream.on('error',()=>socket.destroy());upstream.end();
});
server.on('tlsClientError',()=>{});
server.listen(8443,'0.0.0.0');
for(const signal of ['SIGTERM','SIGINT']) process.once(signal,()=>server.close(()=>process.exit(0)));
