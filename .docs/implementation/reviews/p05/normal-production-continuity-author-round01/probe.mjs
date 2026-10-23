/** One normal persistent-room continuity boundary. Client state is secret, never an authority fixture. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {setInterval,clearInterval} from 'node:timers';
import {setTimeout as delay} from 'node:timers/promises';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function safeFailure(e){return {name:['AssertionError','Error','TypeError','SyntaxError','AbortError'].includes(e?.name)?e.name:'UNLISTED',code:['ERR_ASSERTION','ABORT_ERR'].includes(e?.code)?e.code:null,reason:['PROFILE_OR_TOTAL_DEADLINE','WS_FAILURE','REQUEST_CAP','UNEXPECTED_API_STATUS'].includes(e?.message)?e.message:'BOUNDARY_ASSERTION_FAILED'};}
export function receipt(b,id){assert.equal(b.schema_version,2);assert.equal(b.request_id,id);assert(Number.isSafeInteger(b.game_rev)&&b.game_rev>=1);return b;}
export function assertSafeOwn(v){assert.equal(v.schema_version,2);assert(Number.isSafeInteger(v.room_rev)&&v.room_rev>=0);assert(Number.isSafeInteger(v.game_rev)&&v.game_rev>=0);assert.equal(v.session_actions.neutral_reset,true);assert.equal(v.session_actions.resume,false);assert.equal(v.session_actions.advance,false);assert(Object.values(v.conversation_actions).every(x=>x===false));for(const k of ['finish','choose_truth','choose_dare','propose_condition','accept_invitation','accept_action'])assert.equal(v.round_actions[k],false);}
export function assertSamePersisted(a,b){for(const k of ['room_id','session_id','pack_digest','snapshot_sha256','pins_sha256','history_sha256','participants','game_count','room_count'])assert.deepEqual(b[k],a[k]);assert.equal(b.private_objects,0);assert.equal(b.private_refs,0);assert.equal(b.catalog.ledger_head,a.catalog.ledger_head);}
export async function main(){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');assert(!process.env.NODE_OPTIONS);
 const phase=process.argv[2];assert(['a-on','b-off','b-on'].includes(phase));
 const ack=JSON.parse(readFileSync('/run/pilot470-root-ack.json','utf8'));assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'NORMAL470_PERSISTENT_A6_B4_01');
 const binding=phase==='a-on'?ack.A:ack.B;for(const [p,h]of Object.entries(binding.runtime_files))assert.equal(sha(readFileSync('/app/'+p)),h);
 const {ownerProvisionalPilot,bundledPacks,bundledTopicSources}=await import('/app/packages/card-catalog/dist/index.js');const {pack,map}=ownerProvisionalPilot;
 assert.equal(pack.cards.length,470);assert.equal(pack.synthetic||map.synthetic,false);assert.equal(pack.approval_scope,'OWNER_PROVISIONAL_LOCAL_PILOT');assert.equal(pack.digest,ack.pack_digest);assert.deepEqual(map.pins,ack.map_pins);assert.equal(bundledPacks.length,0);assert.equal(bundledTopicSources.length,0);
 const descriptor=JSON.parse(readFileSync('/run/probe/DESCRIPTOR.json','utf8')),require=createRequire('/app/package.json'),{WebSocket}=require('ws');
 const origin='https://127.0.0.1',root='http://127.0.0.1:4300',start=performance.now(),deadline=start+descriptor.phase_deadline_ms;
 const report={schema_version:1,phase,status:'FAIL',API_only:true,actual_TLS:false,requests:0,WS_connections:0,rooms_created:0,consent_acceptances:0};
 const statePath='/run/continuity-private/client-state.json',reportPath='/run/continuity-private/report-'+phase+'.json';
 let state=null;if(phase!=='a-on'){const bytes=readFileSync(statePath);assert(bytes.length<65536,'CLIENT_STATE_CAP');try{state=JSON.parse(bytes.toString('utf8'));}catch{throw Error('CLIENT_STATE_INVALID');}}
 const save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
 let publicNext=0,wsNext=0,currentActors=[],wsFault=false,cleanupDeadline=null;
 const until=async(test,ms,label)=>{const end=Math.min(deadline,performance.now()+ms);while(performance.now()<end){if(wsFault)throw Error('WS_FAILURE');if(await test())return;await delay(25);}throw Error(label);};
 async function request(actor,path,method='GET',body,{publicRequest=false,status=200,cleanup=false}={}){
  const limit=cleanup?cleanupDeadline:deadline;
  if(cleanup)assert(path===roomBase(actor)||path===roomBase(actor)+'/close','CLEANUP_ROUTE_ONLY');
  assert(performance.now()<limit,'PROFILE_OR_TOTAL_DEADLINE');assert(cleanup||!wsFault,'WS_FAILURE');assert(report.requests<descriptor.caps.requests,'REQUEST_CAP');
  const now=performance.now(),at=publicRequest?Math.max(now,publicNext):Math.max(now,actor.next??0);if(at>now)await delay(at-now);
  assert(performance.now()<limit,'PROFILE_OR_TOTAL_DEADLINE');
  if(publicRequest)publicNext=performance.now()+550;else actor.next=performance.now()+350;
  report.requests++;const response=await fetch(root+path,{method,headers:{origin,'sec-fetch-site':'same-origin',...(actor?.cookie?{cookie:actor.cookie}:{}),...(actor?.csrf?{'x-csrf-token':actor.csrf}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  const reader=response.body.getReader();let length=0,chunks=[];for(;;){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>descriptor.caps.response_bytes){await reader.cancel();throw Error('RESPONSE_BYTE_CAP');}chunks.push(item.value);}
  const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const code=['INVALID_REQUEST','ENTRY_ACCEPTANCE_REQUIRED','TOPIC_SAFE_POOL_EXHAUSTED','RATE_LIMITED','REVISION_CONFLICT','AUTH_REQUIRED','ORIGIN_FORBIDDEN','CSRF_REQUIRED','TOPIC_SOURCE_UNAVAILABLE','TOPIC_SOURCE_UNREVIEWED','TOPIC_SOURCE_BUNDLE_UNAVAILABLE','CATALOG_WITHDRAWN','CONSENT_EXPIRED','ROUND_STALE','ROUND_NOT_ACTIVE','CHOICE_LOCKED','PRIVATE_TRANSPORT_UPGRADE_REQUIRED','TOPIC_GAMES_DISABLED','TOPIC_RELEASE_PROFILE_REQUIRED'].includes(value?.code)?value.code:null;
  const suffix=path.split('/').at(-1);report.last_request={operation:['current','view','target','self-actions','prepare','start','response','choice','condition','finish','advance','close','join','entry-policy','runtime-capabilities','preferences','private-protocol','ws-ticket'].includes(suffix)?suffix:'OTHER',method,status:response.status,code};
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
  ws.on('message',raw=>{if(raw.length>32768){wsFault=true;ws.terminate();return;}try{const value=JSON.parse(raw.toString());if(value.type==='room.snapshot')authenticated=true;if(value.type==='pong')pong=performance.now();}catch{wsFault=true;}});
  ws.on('error',()=>{wsFault=true;});ws.on('close',()=>{if(!a.closing)wsFault=true;});
  await until(()=>ws.readyState===1,10000,'WS_OPEN_TIMEOUT');ws.send(JSON.stringify({type:'auth',ticket:ticket.ticket}));await until(()=>authenticated,10000,'WS_AUTH_TIMEOUT');report.WS_connections++;
  a.ping=setInterval(()=>{if(ws.readyState!==1||performance.now()-pong>25000){wsFault=true;return;}try{ws.send(JSON.stringify({type:'ping'}));}catch{wsFault=true;}},10000);
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
 async function ownAll(){return Promise.all(currentActors.map(async a=>({a,own:await own(a)})));}
 async function consentRound(g,scope){let count=0;const flag=scope==='invitation'?'accept_invitation':'accept_action';
  for(const a of currentActors){const controls=await own(a);if(!controls.round_actions[flag])continue;const target=await get(a,rpath(a,g)+'/target'),offer=target[scope];assert(offer&&offer.state==='pending');
   await mutation(a,rpath(a,g)+'/response',{kind:'accept',scope,offer_id:offer.offer_id,proposal_revision:offer.proposal_revision});count++;report.consent_acceptances++;}
  return count;
 }

 async function persisted(){
  const {database}=await import('/app/apps/api/dist/database.js'),db=database();let c;
  try{c=await db.pool.connect();await c.query('BEGIN READ ONLY');
   const g=(await c.query('SELECT g.id,g.room_id,g.pack_digest,g.snapshot_cipher,g.state,t.pins_cipher FROM game_sessions g JOIN topic_game_sessions t ON t.room_id=g.room_id AND t.session_id=g.id WHERE g.id=$1 AND g.room_id=$2',[state.session,state.actors[0].room])).rows;assert.equal(g.length,1);
   const h=(await c.query("SELECT object_id,chunk_index,cipher FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND kind='history' ORDER BY object_id,chunk_index",[g[0].room_id,g[0].id])).rows;assert(h.length>0&&h.length<=800);
   const counts=(await c.query("SELECT (SELECT count(*)::int FROM rooms) AS room_count,(SELECT count(*)::int FROM game_sessions) AS game_count,(SELECT count(*)::int FROM game_participants WHERE session_id=$1) AS participants,(SELECT count(*)::int FROM topic_game_objects WHERE kind<>'history') AS private_objects,(SELECT count(*)::int FROM topic_game_private_refs) AS private_refs",[state.session])).rows[0];
   const cat=(await c.query('SELECT active_digest,generation,ledger_head FROM venus_catalog_state WHERE singleton=true')).rows;assert.equal(cat.length,1);
   await c.query('COMMIT');return {...counts,room_id:g[0].room_id,session_id:g[0].id,pack_digest:g[0].pack_digest,game_state:g[0].state,snapshot_sha256:sha(JSON.stringify(g[0].snapshot_cipher)),pins_sha256:sha(JSON.stringify(g[0].pins_cipher)),history_sha256:sha(JSON.stringify(h)),catalog:cat[0]};
  }finally{c?.release();await db.close();}
 }
 async function refused(a,path,method='GET',body,code){const r=await request(a,path,method,body,{status:null});assert.equal(r.status,503);assert.equal(r.body.code,code);report.refusals??=[];report.refusals.push({method,code,status:r.status});}
 try{
  assert.equal((await get({},'/health/ready')).status,'ready');
  if(phase==='a-on'){
   const {host,prep}=await createProfile({N:2,context:'online',mode:'yes_but'});await mutation(host,gameBase(host)+'/start',{draft_rev:prep.game_rev});
   let g=await current(host);assert.equal(g.state,'active');assert.equal(g.current_round.round_index,1);assert.equal(g.current_round.actors.length,2);
   assert.equal(await consentRound(g,'invitation'),2);g=await current(host);const proposer=(await ownAll()).filter(x=>x.own.round_actions.propose_condition);assert.equal(proposer.length,1);await mutation(proposer[0].a,rpath(host,g)+'/condition',{expected_rev:g.game_rev,text:'Continuity test: only while both agree.'});assert.equal(await consentRound(g,'action'),2);g=await current(host);assert.equal(g.current_round.kind,'public');const card=pack.card(g.current_round.card_id);assert.equal(card.interaction,'pair_public');assert.equal(card.mode,'yes_but');
   const controls=await ownAll();assert(controls.some(x=>x.own.round_actions.finish));
   state={schema_version:1,actors:currentActors.map(({room,id,name,locale,cookie,csrf})=>({room,id,name,locale,cookie,csrf})),session:g.session_id,round:g.current_round.round_id,draft_rev:prep.game_rev};
   const before=await persisted();assert.equal(before.catalog.active_digest,pack.digest);assert.equal(before.game_count,1);assert.equal(before.room_count,1);assert.equal(before.participants,2);state.before=before;report.persisted=before;
   writeFileSync(statePath,JSON.stringify(state)+'\n',{mode:0o600});
   report.released={card_id:card.id,revision:card.revision,round_index:1,bilateral_invitation:true};
  }else{
   currentActors=state.actors;for(const a of currentActors)await connect(a);const host=currentActors[0],oldRound=gameBase(host)+'/'+state.session+'/round/'+state.round;
   const before=await persisted();assertSamePersisted(state.before,before);assert.equal(before.catalog.active_digest,null);report.persisted_before=before;
   for(const a of currentActors){const room=await get(a,roomBase(a));assert.equal(room.members.length,2);assert.equal((await get(a,roomBase(a)+'/me/private-protocol')).private_protocol,2);assertSafeOwn(await own(a));}
   const unavailable=phase==='b-off'?'TOPIC_GAMES_DISABLED':'TOPIC_SOURCE_UNAVAILABLE';
   if(phase==='b-off'){
    await refused(host,gameBase(host)+'/'+state.session+'/round/advance','POST',{request_id:randomUUID(),expected_rev:(await own(host)).game_rev},unavailable);
    let ownView=await own(host);assert.equal(ownView.session_actions.pause,true);await mutation(host,gameBase(host)+'/'+state.session+'/pause',{});
    ownView=await own(host);assert.equal(ownView.session_actions.stop,true);await mutation(host,gameBase(host)+'/'+state.session+'/stop',{});
   }
   const view=await get(host,roomBase(host));await refused(host,gameBase(host)+'/prepare','POST',{request_id:randomUUID(),expected_rev:view.room_rev,mode:'yes_but',round_count:20,players:currentActors.map(a=>a.id)},unavailable);
   const denied=await request(host,gameBase(host)+'/start','POST',{request_id:randomUUID(),draft_rev:state.draft_rev},{status:null});assert.equal(denied.status,409);assert.equal(denied.body.code,'GAME_NOT_WAITING');report.stale_start={status:409,code:'GAME_NOT_WAITING'};
   // Legacy B4 has no bundle/view route. No generic200 is misclassified as denied content.
   const absent=await request(host,oldRound+'/view','GET',undefined,{status:404});assert.equal(absent.status,404);
   const after=await persisted();assertSamePersisted(state.before,after);assert.equal(after.game_state,'aborted');assert.equal(after.catalog.active_digest,null);report.persisted_after=after;
   if(phase==='b-on'){assert(BigInt(after.catalog.generation)>BigInt(state.before.catalog.generation));const room=await get(host,roomBase(host));await request(host,roomBase(host)+'/close','POST',{idempotency_key:randomUUID(),expected_rev:room.room_rev});report.room_closed=true;}
  }
  report.status='PASS';
 }catch(error){report.error={...safeFailure(error),elapsed_ms:Math.round(performance.now()-start),last_request:report.last_request??null};process.exitCode=1;
 }finally{for(const a of currentActors){a.closing=true;clearInterval(a.ping);a.ws?.terminate();}save();console.log(JSON.stringify({phase,status:report.status,requests:report.requests}));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
