/** Ordinary server API client only. No server/source/clock/history fixture. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {setInterval,clearInterval} from 'node:timers';
import {setTimeout as delay} from 'node:timers/promises';
/** Fixed diagnostic projection only; never retain raw frame/error/reason/identity. */
export const wsFaultBranches=Object.freeze(['MESSAGE_BYTES','MESSAGE_JSON','SOCKET_ERROR','UNEXPECTED_CLOSE','HEARTBEAT_NOT_OPEN','PONG_STALE','PING_SEND_THROW','AUTH_SEND_THROW']);
export function firstWsFault(first,branch,actorOrdinal,elapsed,readyState,pongAge,closeCode=null){
 if(first!==null)return first;assert(wsFaultBranches.includes(branch),'WS_FAULT_BRANCH');
 const milliseconds=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=6000000?Math.round(value):null;
 return Object.freeze({branch,actor_ordinal:Number.isSafeInteger(actorOrdinal)&&actorOrdinal>=0&&actorOrdinal<8?actorOrdinal:null,elapsed_ms:milliseconds(elapsed),ready_state:[0,1,2,3].includes(readyState)?readyState:null,pong_age_ms:milliseconds(pongAge),close_code:Number.isSafeInteger(closeCode)&&closeCode>=1000&&closeCode<=4999?closeCode:null});
}
export const cohortIds=Object.freeze(['online/questions','online/truth_or_dare','online/yes_but','in_person/questions','in_person/truth_or_dare','in_person/yes_but']);
export function profiles(cohort){assert(cohortIds.includes(cohort),'DECLARED_COHORT_REQUIRED');return ['online','in_person'].flatMap(context=>['questions','truth_or_dare','yes_but'].flatMap(mode=>Array.from({length:7},(_,i)=>({context,mode,N:i+2})))).map((p,i)=>({id:'PILOT470-'+String(i+1).padStart(2,'0'),...p})).filter(p=>p.context+'/'+p.mode===cohort);}
export function negativeProfiles(cohort){const [profile]=profiles(cohort);return profile.mode==='yes_but'?[{context:profile.context,N:2,mode:'yes_but',relation:'not_a_friend'}]:[];}
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function publicIdentity(round,pack,seen){
 assert.equal(round.kind,'public','Every neutral selected round must actually release a public card');
 const card=pack.card(round.card_id);assert.equal(card.revision,round.card_revision);assert.equal(card.mode,round.mode);
 assert(!seen.has(card.id),'Exact selected/released ID repeated in this session');seen.add(card.id);return card;
}
export function receipt(body,id){assert.equal(body.schema_version,2);assert.equal(body.request_id,id);assert(Number.isSafeInteger(body.game_rev)&&body.game_rev>=1);return body;}
export function safeFailure(error){return {name:['AssertionError','Error','TypeError','SyntaxError','AbortError'].includes(error?.name)?error.name:'UNLISTED',code:['ERR_ASSERTION','ABORT_ERR','ERR_INVALID_URL','ECONNREFUSED','ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_SOCKET'].includes(error?.code)?error.code:null,assertion_code:['PROFILE_OR_TOTAL_DEADLINE','WS_FAILURE','REQUEST_CAP','UNEXPECTED_API_STATUS','CLEANUP_ROUTE_ONLY'].includes(error?.message?.split('\n',1)[0])?error.message.split('\n',1)[0]:'PROBE_ASSERTION_FAILED'};}
export function assertText(round,card,locale,names){
 const sub=value=>value.replace(/\{P([12])\}/g,(_m,i)=>names[round.actors[Number(i)-1]]??'');
 const text=card.text[locale];
 if(card.mode==='questions')assert.deepEqual(round.text,{question:sub(text.question)});
 else if(card.mode==='truth_or_dare')assert.deepEqual(round.text,{prompt:sub(text[round.choice])});
 else assert.deepEqual(round.text,{proposal:sub(text.proposal),responder:sub(text.responder)});
}
export async function main(){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');assert(!process.env.NODE_OPTIONS);
 const ack=JSON.parse(readFileSync('/run/pilot470-root-ack.json','utf8'));
 assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'ORDINARY470_FIXED_COHORT_06');
 const cohort=ack.cohort,selectedProfiles=profiles(cohort),selectedNegatives=negativeProfiles(cohort);
 const descriptor=JSON.parse(readFileSync('/run/probe/DESCRIPTOR.json','utf8'));
 for(const[path,hash]of Object.entries(ack.runtime_files))assert.equal(sha(readFileSync('/app/'+path)),hash,'Exact compiled image file mismatch');
 const {ownerProvisionalPilot,bundledPacks,bundledTopicSources}=await import('/app/packages/card-catalog/dist/index.js');
 const {pack,map}=ownerProvisionalPilot;assert.equal(pack.cards.length,470);assert.equal(pack.approval_scope,'OWNER_PROVISIONAL_LOCAL_PILOT');
 assert.equal(map.approval_scope,pack.approval_scope);assert.equal(pack.synthetic||map.synthetic,false);
 assert.equal(pack.digest,ack.pack_digest);assert.deepEqual(map.pins,ack.map_pins);assert.deepEqual(pack.owner_provisional,ack.owner_authority);
 assert.equal(bundledPacks.length,0);assert.equal(bundledTopicSources.length,0);
 const metadata=JSON.parse(readFileSync('/app/build-metadata.json','utf8'));assert.equal(metadata.source_revision,ack.source_revision);
 const require=createRequire('/app/package.json'),{WebSocket}=require('ws');
 const origin='https://127.0.0.1',root='http://127.0.0.1:4300',start=performance.now();let deadline=start+descriptor.rate_schedule.total_probe_deadline_ms;
 const report={schema_version:1,scope:descriptor.scope,status:'FAIL',entrypoint:'apps/api/dist/server.js',API_only:true,actual_browser:false,actual_TLS:false,
  cohort,matrix_complete:false,source_identity:ack.source_identity,image_id:ack.image_id,pack_digest:pack.digest,map_pins:map.pins,owner_authority:pack.owner_provisional,
  source_override:false,syntheticFixtureOnly:false,profiles:selectedProfiles.map(p=>({...p,status:'NOT_RUN'})),
  negative_profiles:selectedNegatives.map(p=>({...p,status:'NOT_RUN'})),ws_first_fault:null,diagnostic_trace:{phase:'startup',round_index:0},
  requests:0,WS_connections:0,rooms_created:0,rooms_closed:0,completed_rounds:0,consent_acceptances:0,choices:0,conditions:0,finishes:0,skips:0,locales_checked_sessions:0,client_cleanup:'NOT_RUN',room_cleanup_failures:0};
 const save=()=>writeFileSync('/tmp/pilot470-report.json',JSON.stringify(report,null,2)+'\n');
 let publicNext=0,wsNext=0,currentActors=[],wsFault=false,cleanupDeadline=null;
 const until=async(test,ms,label)=>{const end=Math.min(deadline,performance.now()+ms);while(performance.now()<end){if(wsFault)throw Error('WS_FAILURE');if(await test())return;await delay(25);}throw Error(label);};
 async function request(actor,path,method='GET',body,{publicRequest=false,status=200,cleanup=false}={}){
  const limit=cleanup?cleanupDeadline:deadline;
  if(cleanup)assert(path===roomBase(actor)||path===roomBase(actor)+'/close','CLEANUP_ROUTE_ONLY');
  assert(performance.now()<limit,'PROFILE_OR_TOTAL_DEADLINE');assert(cleanup||!wsFault,'WS_FAILURE');assert(report.requests<descriptor.caps.requests,'REQUEST_CAP');
  const now=performance.now(),at=publicRequest?Math.max(now,publicNext):Math.max(now,actor.next??0);if(at>now)await delay(at-now);
  assert(performance.now()<limit,'PROFILE_OR_TOTAL_DEADLINE');
  if(publicRequest)publicNext=performance.now()+550;else actor.next=performance.now()+350;
  const requestStarted=performance.now();report.requests++;const response=await fetch(root+path,{method,headers:{origin,'sec-fetch-site':'same-origin',...(actor?.cookie?{cookie:actor.cookie}:{}),...(actor?.csrf?{'x-csrf-token':actor.csrf}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  const reader=response.body.getReader();let length=0,chunks=[];for(;;){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>descriptor.caps.response_bytes){await reader.cancel();throw Error('RESPONSE_BYTE_CAP');}chunks.push(item.value);}
  const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const code=['INVALID_REQUEST','ENTRY_ACCEPTANCE_REQUIRED','TOPIC_SAFE_POOL_EXHAUSTED','RATE_LIMITED','REVISION_CONFLICT','AUTH_REQUIRED','ORIGIN_FORBIDDEN','CSRF_REQUIRED','TOPIC_SOURCE_UNAVAILABLE','TOPIC_SOURCE_UNREVIEWED','TOPIC_SOURCE_BUNDLE_UNAVAILABLE','CATALOG_WITHDRAWN','CONSENT_EXPIRED','ROUND_STALE','ROUND_NOT_ACTIVE','CHOICE_LOCKED','PRIVATE_TRANSPORT_UPGRADE_REQUIRED','TOPIC_GAMES_DISABLED','TOPIC_RELEASE_PROFILE_REQUIRED','INTERNAL_ERROR'].includes(value?.code)?value.code:null;
  const suffix=path.split('/').at(-1);report.last_request={operation:['current','view','target','self-actions','prepare','start','response','choice','condition','finish','advance','close','join','entry-policy','runtime-capabilities','preferences','private-protocol','ws-ticket'].includes(suffix)?suffix:'OTHER',method,status:response.status,code,duration_ms:Math.round(performance.now()-requestStarted),request_id:typeof value?.request_id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.request_id)?value.request_id:null,actor_ordinal:actor&&currentActors.includes(actor)?currentActors.indexOf(actor):null,phase:report.diagnostic_trace.phase,round_index:report.diagnostic_trace.round_index};
  if(status!==null)assert.equal(response.status,status,'UNEXPECTED_API_STATUS');
  return {status:response.status,body:value,headers:response.headers};
 }
 const get=async(a,path)=>(await request(a,path)).body;
 const roomBase=a=>'/api/v1/rooms/'+a.room,gameBase=a=>'/api/v2/rooms/'+a.room+'/game';
 const current=a=>get(a,gameBase(a)+'/current');
 const own=a=>get(a,gameBase(a)+'/self-actions');
 const rpath=(a,g)=>gameBase(a)+'/'+g.session_id+'/round/'+g.current_round.round_id;
 async function mutation(a,path,body){const id=randomUUID(),value=(await request(a,path,'POST',{request_id:id,...body})).body;return receipt(value,id);}
 function sessionCookie(response){const values=response.headers.getSetCookie().filter(s=>s.startsWith('venus_room_session='));assert(values.length>=1);assert(values.every(s=>/Secure/.test(s)&&/HttpOnly/.test(s)));assert.equal(new Set(values.map(s=>s.split(';')[0])).size,1);return values[0].split(';')[0];}
 async function admission(){const response=await request(null,'/api/v1/entry-policy','GET',undefined,{publicRequest:true}),offer=response.body.offer;
  assert.equal(response.body.available,true);assert.equal(offer.synthetic,true);assert.equal(offer.version,'local-pilot-mock-1');assert.deepEqual(Object.keys(offer.text).sort(),['en','ru','tr']);
  const cookie=response.headers.getSetCookie().find(s=>s.startsWith('__Host-venus-admission='));assert(cookie&&/Secure/.test(cookie)&&/HttpOnly/.test(cookie));
  return {cookie:cookie.split(';')[0],csrf:response.body.csrf_token,acceptance:{offer_version:offer.version,offer_digest:offer.digest,adult18:true,accept_offer:true}};
 }
 async function connect(a){const ticket=await mutationTicket(a);if(wsNext>performance.now())await delay(wsNext-performance.now());wsNext=performance.now()+550;const ws=new WebSocket('ws://127.0.0.1:4300'+roomBase(a)+'/ws',{origin,headers:{cookie:a.cookie}});a.ws=ws;let authenticated=false,pong=performance.now();
  const fault=(branch,code=null,mark=true)=>{if(mark)wsFault=true;report.ws_first_fault=firstWsFault(report.ws_first_fault,branch,currentActors.indexOf(a),performance.now()-start,ws.readyState,performance.now()-pong,code);};
  ws.on('message',raw=>{if(raw.length>32768){fault('MESSAGE_BYTES');ws.terminate();return;}try{const value=JSON.parse(raw.toString());if(value.type==='room.snapshot')authenticated=true;if(value.type==='pong')pong=performance.now();}catch{fault('MESSAGE_JSON');}});
  ws.on('error',()=>{fault('SOCKET_ERROR');});ws.on('close',code=>{if(!a.closing)fault('UNEXPECTED_CLOSE',code);});
  await until(()=>ws.readyState===1,10000,'WS_OPEN_TIMEOUT');try{ws.send(JSON.stringify({type:'auth',ticket:ticket.ticket}));}catch(error){fault('AUTH_SEND_THROW',null,false);throw error;}await until(()=>authenticated,10000,'WS_AUTH_TIMEOUT');report.WS_connections++;
  a.ping=setInterval(()=>{if(ws.readyState!==1){fault('HEARTBEAT_NOT_OPEN');return;}if(performance.now()-pong>25000){fault('PONG_STALE');return;}try{ws.send(JSON.stringify({type:'ping'}));}catch{fault('PING_SEND_THROW');}},10000);
 }
 async function mutationTicket(a){return (await request(a,roomBase(a)+'/ws-ticket','POST',{request_id:randomUUID()})).body;}
 async function createProfile(p,negative=false){
  const owner=await admission(),body={name:'Pilot host',locale:'en',meeting_context:p.context,idempotency_key:randomUUID(),entry_acceptance:owner.acceptance};
  // Every fresh room checks negative create before the exact same valid admission.
  const denied=await request(owner,'/api/v2/rooms','POST',{...body,idempotency_key:randomUUID(),entry_acceptance:{...owner.acceptance,adult18:false}},{publicRequest:true,status:null});assert([400,403].includes(denied.status));
  const created=await request(owner,'/api/v2/rooms','POST',body,{publicRequest:true,status:201}),host={room:created.body.room_id,id:created.body.me.id,name:'Pilot host',locale:'en',cookie:sessionCookie(created),csrf:created.headers.get('x-csrf-token')};
  assert(host.csrf);currentActors=[host];report.rooms_created++;const invite=new URL(created.body.invite_url).hash.slice('#invite='.length);assert(invite);
  for(let i=1;i<p.N;i++){const a=await admission(),join={display_name:'Pilot '+i,locale:'en',invite_token:invite,idempotency_key:randomUUID(),entry_acceptance:a.acceptance};
   const refused=await request(a,roomBase(host)+'/join','POST',{...join,idempotency_key:randomUUID(),entry_acceptance:{...a.acceptance,adult18:false}},{publicRequest:true,status:null});assert([400,403].includes(refused.status));
   const joined=await request(a,roomBase(host)+'/join','POST',join,{publicRequest:true});currentActors.push({room:host.room,id:joined.body.me.id,name:'Pilot '+i,locale:'en',cookie:sessionCookie(joined),csrf:joined.headers.get('x-csrf-token')});}
  for(const a of currentActors)await connect(a);
  const protocol=await get(host,roomBase(host)+'/me/private-protocol');assert.equal(protocol.private_protocol,2);
  for(const a of currentActors){const pref=await get(a,roomBase(a)+'/me/preferences');await request(a,roomBase(a)+'/me/preferences','PUT',{idempotency_key:randomUUID(),expected_rev:pref.rev,comfort:0,edges:Object.fromEntries(currentActors.filter(b=>b!==a).map(b=>[b.id,negative?'not_a_friend':'friendship']))});}
  const room=await get(host,roomBase(host));assert.equal(room.members.length,p.N);assert(room.members.every(m=>m.setup_ready&&m.presence==='online'));
  const prep=await mutation(host,gameBase(host)+'/prepare',{expected_rev:room.room_rev,mode:p.mode,round_count:20,players:currentActors.map(a=>a.id)});
  return {host,prep,names:Object.fromEntries(currentActors.map(a=>[a.id,a.name]))};
 }
 async function cleanupClients(){if(!currentActors.length)return;cleanupDeadline=performance.now()+15000;let fault=null;
  for(const a of currentActors)a.closing=true;
  try{const host=currentActors[0],view=(await request(host,roomBase(host),'GET',undefined,{cleanup:true})).body;
   await request(host,roomBase(host)+'/close','POST',{idempotency_key:randomUUID(),expected_rev:view.room_rev},{cleanup:true});report.rooms_closed++;
  }catch(error){fault=error;report.room_cleanup_failures++;}finally{for(const a of currentActors){clearInterval(a.ping);a.ws?.terminate();}currentActors=[];cleanupDeadline=null;await delay(50);}
  if(fault)throw fault;
 }
 async function ownAll(){return Promise.all(currentActors.map(async a=>({a,own:await own(a)})));}
 async function consentRound(g,scope){let count=0;const flag=scope==='invitation'?'accept_invitation':'accept_action';
  for(const a of currentActors){const controls=await own(a);if(!controls.round_actions[flag])continue;const target=await get(a,rpath(a,g)+'/target'),offer=target[scope];assert(offer&&offer.state==='pending');
   await mutation(a,rpath(a,g)+'/response',{kind:'accept',scope,offer_id:offer.offer_id,proposal_revision:offer.proposal_revision});count++;report.consent_acceptances++;}
  return count;
 }
 async function localeCheck(host,g,card,names){const id=g.current_round.card_id,revision=g.current_round.card_revision,rows=[];
  for(const locale of ['ru','en','tr']){const room=await get(host,roomBase(host));await request(host,roomBase(host)+'/me','PATCH',{idempotency_key:randomUUID(),expected_rev:room.room_rev,locale});const value=await current(host);assert.equal(value.current_round.card_id,id);assert.equal(value.current_round.card_revision,revision);assertText(value.current_round,card,locale,names);rows.push({locale,card_id:id,card_revision:revision});}
  const room=await get(host,roomBase(host));await request(host,roomBase(host)+'/me','PATCH',{idempotency_key:randomUUID(),expected_rev:room.room_rev,locale:'en'});report.locales_checked_sessions++;return rows;
 }
 async function playProfile(row){const {host,prep,names}=await createProfile(row);const availability=await get(host,gameBase(host)+'/availability');assert.equal(availability.planned_rounds,20);assert.equal(availability.requested_rounds,20);
  await mutation(host,gameBase(host)+'/start',{draft_rev:prep.game_rev});const seen=new Set();row.rounds=[];
  for(let i=0;i<20;i++){report.diagnostic_trace={phase:'round_current',round_index:i+1};let g=await current(host);assert.equal(g.state,'active');assert.equal(g.current_round.round_index,i+1);assert(!['skipped','stopped'].includes(g.current_round.state));
   report.diagnostic_trace.phase='invitation';await consentRound(g,'invitation');
   if(row.mode==='truth_or_dare'){const chooser=(await ownAll()).filter(x=>x.own.round_actions.choose_truth);assert.equal(chooser.length,1);await mutation(chooser[0].a,rpath(host,g)+'/choice',{side:i%2?'dare':'truth'});report.choices++;}
   if(row.mode==='yes_but'){const proposer=(await ownAll()).filter(x=>x.own.round_actions.propose_condition);assert.equal(proposer.length,1);g=await current(host);await mutation(proposer[0].a,rpath(host,g)+'/condition',{expected_rev:g.game_rev,text:'Pilot: only if everyone is comfortable.'});report.conditions++;}
   report.diagnostic_trace.phase='action';await consentRound(g,'action');report.diagnostic_trace.phase='release';g=await current(host);const card=publicIdentity(g.current_round,pack,seen);assertText(g.current_round,card,'en',names);
   if(i===0)row.locale_identity=await localeCheck(host,g,card,names);
   report.diagnostic_trace.phase='finish_controls';const finishers=(await ownAll()).filter(x=>x.own.round_actions.finish);assert(finishers.length>=1);g=await current(host);
   report.diagnostic_trace.phase='finish';await mutation(finishers[0].a,rpath(host,g)+'/finish',{expected_rev:g.game_rev});report.finishes++;
   report.diagnostic_trace.phase='completed_read';const done=await current(host);assert.equal(done.current_round.state,'completed');assert.equal(done.current_round.round_id,g.current_round.round_id);assert.equal(done.current_round.round_index,i+1);if(card.interaction==='pair_public')assert.equal(done.current_round.kind,'generic');else assert.equal(done.current_round.card_id,card.id);
   row.rounds.push({round_index:i+1,card_id:card.id,revision:card.revision,mode:card.mode,state:'completed'});report.completed_rounds++;
   report.diagnostic_trace.phase='advance';assert.equal((await own(host)).session_actions.advance,true);await mutation(host,gameBase(host)+'/'+g.session_id+'/round/advance',{expected_rev:done.game_rev});
  }
  assert.equal((await current(host)).state,'completed');assert.equal(row.rounds.length,20);assert.equal(seen.size,20);row.session_id=(await current(host)).session_id;row.room_id=host.room;
 }
 save();try{
  const capability=await get({},'/api/v1/runtime-capabilities');assert.equal(capability.room_creation_protocol,2);
  for(const row of report.profiles){deadline=Math.min(start+4600000,performance.now()+600000);row.status='RUNNING';save();try{await playProfile(row);row.status='PASS';console.log(JSON.stringify({profile:row.id,status:'PASS',completed:row.rounds.length}));}catch(error){row.status='FAIL';report.error??={...safeFailure(error),elapsed_ms:Math.round(performance.now()-start),last_request:report.last_request};throw error;}finally{await cleanupClients();save();}}
  for(const row of report.negative_profiles){deadline=Math.min(start+4600000,performance.now()+90000);row.status='RUNNING';save();try{const {host,prep}=await createProfile(row,true),availability=await request(host,gameBase(host)+'/availability','GET',undefined,{status:null});assert.equal(availability.status,409);assert.equal(availability.body.code,'TOPIC_SAFE_POOL_EXHAUSTED');
    const id=randomUUID(),refused=await request(host,gameBase(host)+'/start','POST',{request_id:id,draft_rev:prep.game_rev},{status:null});assert.equal(refused.status,409);assert.equal(refused.body.code,'TOPIC_SAFE_POOL_EXHAUSTED');const g=await current(host);assert.equal(g.state,'waiting');assert.equal(g.current_round,null);row.status='PASS';row.code=refused.body.code;}catch(error){row.status='FAIL';report.error??={...safeFailure(error),elapsed_ms:Math.round(performance.now()-start),last_request:report.last_request};throw error;}finally{await cleanupClients();save();}}
  assert.equal(report.completed_rounds,140);assert.equal(report.finishes,140);assert.equal(report.skips,0);assert.equal(report.locales_checked_sessions,7);assert.equal(report.rooms_created,7+selectedNegatives.length);assert.equal(report.rooms_closed,7+selectedNegatives.length);assert(report.profiles.every(p=>p.status==='PASS'));assert(report.negative_profiles.every(p=>p.status==='PASS'));report.status='PASS';
 }catch(error){report.error??={...safeFailure(error),elapsed_ms:Math.round(performance.now()-start),last_request:report.last_request};process.exitCode=1;
 }finally{try{await cleanupClients();}catch{report.status='FAIL';process.exitCode=1;}report.client_cleanup=report.room_cleanup_failures?'FAIL':'COMPLETE';save();console.log(JSON.stringify({status:report.status,profiles:report.profiles.filter(p=>p.status==='PASS').length,completed_rounds:report.completed_rounds,client_cleanup:report.client_cleanup}));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
