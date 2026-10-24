import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
assert.deepEqual(readFileSync('/proc/1/cmdline','utf8').split('\0').filter(Boolean),['node','apps/api/dist/server.js']);
const started=new Date().toISOString();process.kill(1,'SIGUSR1');
let target=null;for(let i=0;i<30;i++){try{const rows=await(await fetch('http://127.0.0.1:9229/json/list',{signal:AbortSignal.timeout(1000)})).json();target=rows.find(x=>typeof x.webSocketDebuggerUrl==='string');if(target)break;}catch{/* bounded listener readiness only */}await sleep(100);}
assert(target);assert.match(target.webSocketDebuggerUrl,/^ws:\/\/127\.0\.0\.1:9229\//);
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});setTimeout(()=>reject(Error('WS_OPEN_DEADLINE')),3000).unref();});
let id=0;const pending=new Map();ws.addEventListener('message',event=>{const row=JSON.parse(event.data);if(row.id&&pending.has(row.id)){const p=pending.get(row.id);pending.delete(row.id);clearTimeout(p.timer);if(row.error)p.reject(Error('CDP_FAILURE'));else p.resolve(row.result);}});
function send(method,params={}){return new Promise((resolve,reject)=>{const seq=++id,timer=setTimeout(()=>{pending.delete(seq);reject(Error('CDP_DEADLINE'));},5000);pending.set(seq,{resolve,reject,timer});ws.send(JSON.stringify({id:seq,method,params}));});}
try{
 await send('Profiler.enable');await send('Profiler.setSamplingInterval',{interval:1000});await send('Profiler.start');await sleep(7000);const {profile}=await send('Profiler.stop');await send('Profiler.disable');
 const cleanURL=url=>{if(!url)return '';if(url.startsWith('file:'))return url.split(/[?#]/)[0];if(url.startsWith('node:')||url.startsWith('internal/'))return url;return '<other-static-script>';};
 const safe={startTime:profile.startTime,endTime:profile.endTime,samples:profile.samples,timeDeltas:profile.timeDeltas,nodes:profile.nodes.map(n=>({id:n.id,callFrame:{functionName:n.callFrame.functionName.slice(0,256),scriptId:n.callFrame.scriptId,url:cleanURL(n.callFrame.url),lineNumber:n.callFrame.lineNumber,columnNumber:n.callFrame.columnNumber},hitCount:n.hitCount,children:n.children??[]}))};
 const output={scope:'OWNED_NODE_PID1_CPU_PROFILE_ONLY_NO_HEAP_OR_ARGUMENTS',started_at:started,finished_at:new Date().toISOString(),requested_profile_ms:7000,diagnostic_listener:'CONTAINER_LOOPBACK_ONLY_NO_HOST_PORT',instrumented_attempt_not_uninstrumented_latency_comparison:true,profile:safe};const raw=JSON.stringify(output);assert(Buffer.byteLength(raw)<=8*1024**2);console.log(raw);
}finally{ws.close();}
