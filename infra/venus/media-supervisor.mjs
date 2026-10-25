/** Venus single-host media supervisor. No database, owner signing key or Docker socket. */
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID,createHash,createHmac,timingSafeEqual} from 'node:crypto';
import WebSocket,{WebSocketServer} from 'ws';
const keyFile=process.env.VENUS_MEDIA_KEY_FILE??'/run/secrets/media_key',authorityOrigin=process.env.VENUS_MEDIA_AUTHORITY_ORIGIN??'http://app:4300';
const owner=new URL(authorityOrigin);if(owner.protocol!=='http:'||!['app','browser','127.0.0.1','localhost'].includes(owner.hostname)||owner.pathname!=='/'||owner.search||owner.hash||owner.username||owner.password)throw Error('MEDIA_CONFIGURATION');
let key;
// A local Docker fixture may create its owned shared secret before the API boots.
for(let i=0;i<300;i++){try{const s=fs.lstatSync(keyFile);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>4096)throw Error('MEDIA_KEY_UNSAFE');key=JSON.parse(fs.readFileSync(keyFile,'utf8'));break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
if(!key||Object.keys(key).sort().join(',')!=='key_id,secret'||!/^[a-z0-9_-]{6,64}$/.test(key.key_id)||!/^[A-Za-z0-9_-]{43,128}$/.test(key.secret))throw Error('MEDIA_KEY_UNAVAILABLE');
const credential=createHmac('sha256',key.secret).update('venus-media-internal-v1').digest('base64url'),secret=Buffer.from(credential);
const authenticated=request=>{const v=request.headers['x-venus-media-internal'],b=Buffer.from(typeof v==='string'?v:'');return b.length===secret.length&&timingSafeEqual(b,secret);};
let child=null,boot=randomUUID(),apiEpoch='',lastAuthority=0,lastReconcile=0,generation=0,retiring=null,running=false,stopping=false,polling=false,cutoff=true,metrics=[],lastMetric=null;
const diagnostic=process.env.VENUS_P09_MEDIA_DIAGNOSTIC==='1',diagnosticCounts={},diagnosticIceHashes=[];
let diagnosticBuffer='';
function diagnosticLine(bytes){if(!diagnostic)return;diagnosticBuffer+=bytes.toString();if(diagnosticBuffer.length>65536){diagnosticBuffer='';return;}const lines=diagnosticBuffer.split('\n');diagnosticBuffer=lines.pop();for(const line of lines){let row;try{row=JSON.parse(line);}catch{continue;}const original=String(row.msg??row.message??''),credentials=/remoteUfrag: "([^"]+)", remotePwd: "([^"]+)"/.exec(original);if(credentials&&diagnosticIceHashes.length<16)diagnosticIceHashes.push(createHash('sha256').update(JSON.stringify([credentials[1],credentials[2]])).digest('hex'));const text=original.toLowerCase(),failure=/fail|error|invalid|unknown|not found|could not|no conn|mismatch|unauth|broken|wrong/.test(text),category=/ufrag|username/.test(text)?'ice_ufrag':/integrity/.test(text)?'ice_integrity':/stun|binding request/.test(text)?'stun':/drop|discard/.test(text)?'discard':/ice/.test(text)?'ice':/connection state/.test(text)?'connection_state':/dtls/.test(text)?'dtls':/candidate/.test(text)?'candidate':'other',known=[['discard request with broken integrity','stun_request_bad_integrity'],['discard request with wrong username','stun_request_wrong_username'],['discard success response with broken integrity','stun_response_bad_integrity'],['discard success message from','stun_response_unknown_remote'],['discarded','expired_or_discarded']].find(([prefix])=>text.startsWith(prefix)),name=known?.[1]??category+(failure?'_failure':'');diagnosticCounts[name]=(diagnosticCounts[name]??0)+1;}}

const connections=new Set(),rtcPaths=new Set(['/rtc','/rtc/v1','/rtc/validate','/rtc/v1/validate']);
const rpcPaths=new Set(['CreateRoom','DeleteRoom','ListRooms','ListParticipants','GetParticipant','RemoveParticipant'].map(name=>'/twirp/livekit.RoomService/'+name));
function send(reply,status,value){const bytes=Buffer.from(JSON.stringify(value));reply.writeHead(status,{'content-type':'application/json','content-length':bytes.length,'cache-control':'no-store','x-content-type-options':'nosniff'});reply.end(bytes);}
function samples(){try{const text=fs.readFileSync('/sys/fs/cgroup/cpu.stat','utf8'),cpu=Number(/usage_usec (\d+)/.exec(text)?.[1]),memory=Number(fs.readFileSync('/sys/fs/cgroup/memory.current','utf8')),tx=Number(fs.readFileSync('/sys/class/net/eth0/statistics/tx_bytes','utf8')),now=performance.now();if(lastMetric){const seconds=(now-lastMetric.now)/1000;metrics.push({mono_ms:now,cpu_cores:(cpu-lastMetric.cpu)/1e6/seconds,memory_bytes:memory,egress_bps:(tx-lastMetric.tx)*8/seconds});if(metrics.length>120)metrics.shift();}lastMetric={cpu,tx,now};}catch{/* No fabricated resource values on another cgroup layout. */}}
function resetEpoch(){generation++;boot=randomUUID();apiEpoch='';lastAuthority=0;lastReconcile=0;running=false;}
async function quiesce(){
 if(retiring)return retiring;
 resetEpoch();cutoff=false;for(const connection of connections)connection();connections.clear();
 const processToStop=child;
 if(!processToStop||processToStop.exitCode!==null||processToStop.signalCode!==null){child=null;cutoff=true;return true;}
 retiring=new Promise(resolve=>{const deadline=setTimeout(()=>resolve(false),2000),kill=setTimeout(()=>processToStop.kill('SIGKILL'),150);processToStop.once('exit',()=>{clearTimeout(deadline);clearTimeout(kill);resolve(true);});processToStop.kill('SIGTERM');});
 try{const result=await retiring;if(result&&child===processToStop)child=null;cutoff=result===true;return cutoff;}finally{retiring=null;}
}
function launch(){
 const ip=process.env.VENUS_MEDIA_NODE_IP??Object.values(os.networkInterfaces()).flat().find(v=>v&&v.family==='IPv4'&&!v.internal)?.address;if(!ip||!/^[0-9.]{7,15}$/.test(ip))throw Error('MEDIA_NODE_ADDRESS');
 const config={port:7880,bind_addresses:['127.0.0.1'],keys:{[key.key_id]:key.secret},rtc:{node_ip:ip,use_external_ip:false,stun_servers:[],tcp_port:7881,udp_port:7882,force_tcp:process.env.VENUS_MEDIA_FORCE_TCP==='1',enable_loopback_candidate:true},room:{auto_create:false,empty_timeout:30,departure_timeout:5,max_participants:8},turn:{enabled:false},logging:{level:diagnostic?'debug':'error',pion_level:diagnostic?'debug':'error',json:true},enable_data_tracks:false};
 const file='/tmp/venus-livekit.json';fs.writeFileSync(file,JSON.stringify(config),{mode:0o600});child=spawn('/usr/local/bin/venus-media-server',['--config',file],{stdio:['ignore',diagnostic?'pipe':'ignore','pipe'],env:{PATH:process.env.PATH,HOME:'/tmp'}});
 // Upstream diagnostics may contain protocol details: never forward raw lines.
 child.stderr.on('data',diagnosticLine);child.stdout?.on('data',diagnosticLine);child.once('error',()=>{running=false;cutoff=false;});const launched=child;child.once('exit',()=>{if(child===launched){child=null;resetEpoch();}});lastReconcile=performance.now();cutoff=false;
}
async function admin(method,body){const {AccessToken}=await import('livekit-server-sdk');const token=new AccessToken(key.key_id,key.secret,{ttl:10});token.addGrant(method==='ListRooms'?{roomList:true}:{roomAdmin:true,room:body.room});const response=await fetch('http://127.0.0.1:7880/twirp/livekit.RoomService/'+method,{method:'POST',headers:{authorization:'Bearer '+await token.toJwt(),'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(1000)});if(!response.ok)throw Error('MEDIA_RECONCILE_UNAVAILABLE');const raw=await response.text();if(raw.length>65536)throw Error('MEDIA_RECONCILE_LIMIT');return JSON.parse(raw);}
async function poll(){
 if(polling||stopping||retiring)return;polling=true;const revision=generation,currentBoot=boot;
 try{
  const response=await fetch(authorityOrigin+'/internal/v1/media/authority',{method:'POST',headers:{'content-type':'application/json','x-venus-media-internal':credential},body:JSON.stringify({boot_id:currentBoot}),signal:AbortSignal.timeout(1500),redirect:'error'});if(!response.ok)throw Error('AUTHORITY_UNAVAILABLE');const text=await response.text();if(text.length>32768)throw Error('AUTHORITY_LIMIT');const value=JSON.parse(text);
  if(revision!==generation||stopping)return;
  if(value.format!==1||value.boot_id!==currentBoot||typeof value.api_epoch!=='string'||!Array.isArray(value.leases)||value.leases.length>64||value.leases.some(l=>!l||typeof l.id!=='string'||!/^[a-f0-9-]{36}$/.test(l.id)||!/^venus-[a-z]-[a-f0-9]{48}$/.test(l.room)))throw Error('AUTHORITY_INVALID');
  if(apiEpoch&&apiEpoch!==value.api_epoch&&child){await quiesce();return;}
  apiEpoch=value.api_epoch;lastAuthority=performance.now();if(!child)launch();
  // Reconcile real DTLS participants, not merely their signaling sockets.
  const allow=new Set(value.leases.map(l=>l.room+':'+l.id)),rooms=(await admin('ListRooms',{})).rooms??[];if(rooms.length>16)throw Error('MEDIA_ROOM_LIMIT');
  for(const room of rooms){if(revision!==generation||stopping)return;if(typeof room.name!=='string'||!/^venus-[a-z]-[a-f0-9]{48}$/.test(room.name))throw Error('MEDIA_UNKNOWN_ROOM');const participants=(await admin('ListParticipants',{room:room.name})).participants??[];if(participants.length>16)throw Error('MEDIA_PARTICIPANT_LIMIT');for(const p of participants)if(!allow.has(room.name+':'+p.identity))await admin('RemoveParticipant',{room:room.name,identity:p.identity});}
  if(revision===generation&&!stopping){lastReconcile=performance.now();running=true;}
 }catch{if(revision===generation&&(performance.now()-lastAuthority>=5000||!lastAuthority||child&&performance.now()-lastReconcile>=5000))await quiesce();}
 finally{polling=false;}
}
const server=http.createServer((request,reply)=>{
 const url=new URL(request.url,'http://media');
 if(url.pathname==='/internal/health'&&request.method==='GET'){if(!authenticated(request)){send(reply,401,{ready:false});return;}send(reply,200,{running:running&&performance.now()-lastAuthority<5000,boot_id:boot,api_epoch:apiEpoch,cutoff_confirmed:cutoff,authority_age_ms:lastAuthority?performance.now()-lastAuthority:null,metrics,...(diagnostic?{diagnostic_counts:diagnosticCounts,diagnostic_remote_ice_hashes:diagnosticIceHashes}:{})});return;}
 if(url.pathname==='/internal/quiesce'&&request.method==='POST'){if(!authenticated(request)){send(reply,401,{ready:false});return;}void quiesce().then(confirmed=>{send(reply,confirmed?200:503,{running:false,boot_id:boot,api_epoch:apiEpoch,cutoff_confirmed:confirmed});});return;}
 const rpc=rpcPaths.has(url.pathname)&&request.method==='POST';
 if(!(rpc||rtcPaths.has(url.pathname)&&request.method==='GET')||(!rpc&&!authenticated(request))||!running||performance.now()-lastAuthority>=5000||request.headers['content-length']&&Number(request.headers['content-length'])>65536){send(reply,403,{code:'MEDIA_UNAVAILABLE'});return;}
 const upstream=http.request({hostname:'127.0.0.1',port:7880,path:url.pathname+url.search,method:request.method,headers:{...(request.headers.authorization?{authorization:request.headers.authorization}:{}),'content-type':'application/json'},timeout:2000},response=>{reply.writeHead(response.statusCode??502,{'content-type':response.headers['content-type']??'application/json','cache-control':'no-store'});response.pipe(reply);});upstream.on('error',()=>{if(!reply.headersSent)send(reply,503,{code:'MEDIA_UNAVAILABLE'});else reply.destroy();});upstream.on('timeout',()=>upstream.destroy());let bodyBytes=0;request.on('data',chunk=>{bodyBytes+=chunk.length;if(bodyBytes>65536){upstream.destroy();request.destroy();}});request.pipe(upstream);
});
const sockets=new WebSocketServer({noServer:true,maxPayload:262144,perMessageDeflate:false});
server.on('upgrade',(request,socket,head)=>{
 const url=new URL(request.url,'http://media');if(!authenticated(request)||!['/rtc','/rtc/v1'].includes(url.pathname)||!running||performance.now()-lastAuthority>=5000){socket.destroy();return;}
 sockets.handleUpgrade(request,socket,head,client=>{let closed=false;const remote=new WebSocket('ws://127.0.0.1:7880'+url.pathname+url.search,{maxPayload:262144,perMessageDeflate:false,handshakeTimeout:2000}),queue=[];let bytes=0;const close=()=>{if(closed)return;closed=true;connections.delete(close);remote.terminate();client.terminate();};connections.add(close);client.on('error',close);client.on('close',close);remote.on('error',close);remote.on('close',close);
  client.on('message',(data,binary)=>{if(closed)return;if(remote.readyState===WebSocket.OPEN){if(remote.bufferedAmount>1048576){close();return;}remote.send(data,{binary});}else{bytes+=data.length??data.byteLength;if(bytes>1048576){close();return;}queue.push({data,binary});}});
  remote.on('open',()=>{for(const frame of queue)remote.send(frame.data,{binary:frame.binary});queue.length=0;bytes=0;});remote.on('message',(data,binary)=>{if(client.readyState!==WebSocket.OPEN||client.bufferedAmount>1048576){close();return;}client.send(data,{binary});});
 });
});
server.listen(7890,'0.0.0.0');const ticker=setInterval(()=>{samples();void poll();},1000),watchdog=setInterval(()=>{if(child&&!retiring&&(lastAuthority&&performance.now()-lastAuthority>=5000||lastReconcile&&performance.now()-lastReconcile>=5000))void quiesce();},250);void poll();
async function shutdown(){if(stopping)return;stopping=true;clearInterval(ticker);clearInterval(watchdog);await quiesce();server.closeAllConnections();server.close();sockets.close();}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void shutdown();});
