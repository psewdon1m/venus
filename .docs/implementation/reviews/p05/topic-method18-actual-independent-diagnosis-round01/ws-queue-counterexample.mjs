import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const file='apps/api/src/room-routes.ts',source=fs.readFileSync(new URL('./room-routes.actual18.ts.bytes',import.meta.url),'utf8');
const freeze=JSON.parse(fs.readFileSync('.artifacts/p05-unified-source-freeze01.json','utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(source)!==freeze.files[file]) throw Error('NOT_EXACT_ACTUAL18_SOURCE');
const parsed=source.replaceAll('\r\n','\n');
const anchor=parsed.indexOf("app.get('/api/v1/rooms/:roomId/ws'");
const start=parsed.indexOf('(socket,request)=>{',anchor),end=parsed.indexOf('\n  });\n  let maintaining',start);
if(start<0||end<0) throw Error('HANDLER_BOUNDARY');
const original=parsed.slice(start,end)+'\n  }';
const coalesced=original.replace('const ticker=setInterval(()=>{','let pollPending=false;\n    const ticker=setInterval(()=>{\n      if(pollPending) return;pollPending=true;').replace("}).catch(()=>socket.close(4401,'Connection unavailable'));\n    },1000)","}).catch(()=>socket.close(4401,'Connection unavailable')).finally(()=>{pollPending=false;});\n    },1000)");
if(coalesced===original||!coalesced.includes('finally(()=>{pollPending=false;})')) throw Error('COUNTERFACTUAL_PATCH_NOT_APPLIED');
async function run(handlerSource){
 let now=0,polls=0,heartbeat=0,pingProcessedAt=null,release,blockPoll=true;
 const blocked=new Promise(r=>{release=r;}),events=new Map(),intervals=[];
 const socket={readyState:1,on:(k,v)=>events.set(k,v),send:()=>{},close:()=>{throw Error('UNEXPECTED_CLOSE');}};
 const bundle={room:{room_rev:1},privateEvents:[]};
 const rooms={connect:async()=>({roomId:'fixture-room',memberId:'fixture-member'}),socketState:async(_g,beat)=>{
   if(beat!==false){heartbeat=now;return bundle;}
   polls++;if(blockPoll){blockPoll=false;await blocked;}now+=2000;return bundle;
 },liveGrant:async()=>{pingProcessedAt=now;heartbeat=now;},disconnect:async()=>{}};
 const context={Promise,performance:{now:()=>now},pending:new Set(),sockets:new Map(),rooms,
 roomId:()=> 'fixture-room',credential:()=> 'synthetic',requireThat:(v,c)=>{if(!v)throw Error(c);},send:()=>{},sendGame:async()=>{},
 setTimeout:()=>({unref(){}}),clearTimeout:()=>{},setInterval:(f)=>{intervals.push(f);return{unref(){}};},clearInterval:()=>{}};
 const js=ts.transpileModule('const handler='+handlerSource+';handler;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const handler=vm.runInNewContext(js,context);handler(socket,{});
 const flush=async()=>{for(let i=0;i<250;i++)await Promise.resolve();};
 events.get('message')(JSON.stringify({type:'auth',ticket:'synthetic'}));await flush();
 if(intervals.length!==1)throw Error('TICKER_COUNT');
 now=1000;intervals[0]();await flush();
 for(let tick=2;tick<=20;tick++){now=tick*1000;intervals[0]();}
 const pingReceivedAt=now,heartbeatBeforeRelease=heartbeat;
 events.get('message')(JSON.stringify({type:'ping'}));release();await flush();
 if(pingProcessedAt===null)throw Error('PING_NOT_DRAINED');
 return {polls,ping_received_ms:pingReceivedAt,ping_processed_ms:pingProcessedAt,ping_queue_delay_ms:pingProcessedAt-pingReceivedAt,heartbeat_age_before_ping_ms:pingProcessedAt-heartbeatBeforeRelease,presence_45000_expired_before_ping:pingProcessedAt-heartbeatBeforeRelease>45000};
}
const actual=await run(original),counterfactual=await run(coalesced);
if(actual.polls!==20||actual.ping_processed_ms!==60000||!actual.presence_45000_expired_before_ping)throw Error('MISSING_COUNTEREXAMPLE');
if(counterfactual.polls!==1||counterfactual.ping_processed_ms!==22000||counterfactual.presence_45000_expired_before_ping)throw Error('COALESCING_COUNTERFACTUAL_FAILED');
console.log(JSON.stringify({status:'PASS_SOURCE_COUNTEREXAMPLE',source:file,sha256:sha(source),actual,counterfactual,qualification:'Synthetic scheduler and 2s poll latency demonstrate source queue starvation; not actual18 latency or sole-cause proof. Counterfactual is VM-only, not a product edit.'},null,2));
