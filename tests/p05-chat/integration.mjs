/** Actual HTTPS/WS/PostgreSQL tests; fixture-only synthetic cards, no release approval. */
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import https from 'node:https';
import {clearTimeout,setInterval,clearInterval} from 'node:timers';
import {setTimeout as delay} from 'node:timers/promises';
import pg from 'pg';
import WebSocket from 'ws';
import {runtime} from '../p05/runtime.mjs';
import {Keyring} from '../../apps/api/dist/security.js';
import {migrateChat,chatSchemaProbe} from '../../apps/api/dist/chat-migrations.js';

const output=process.env.P05_ARTIFACT_DIRECTORY??'.artifacts/p05-chat';
mkdirSync(output,{recursive:true});
const cert=readFileSync('tests/fixtures/p02-test-cert.pem');
const report={synthetic_fixture_only:true,production_approval:false,implementation_author_test:true,records:[],status:'FAIL'};
let service,pool;const connections=new Set(),socketFrames=new WeakMap();
const base=room=>'/api/v1/rooms/'+room;
const endpoint=f=>base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/chat`;
async function record(id,action){try{const detail=await action();report.records.push({id,status:'PASS',detail});}catch(error){report.records.push({id,status:'FAIL',error:error.message});throw error;}}
function raw(path,{method='GET',headers={},body}={}) {
  return new Promise((done,reject)=>{
    const bytes=body===undefined?undefined:Buffer.from(JSON.stringify(body));
    const req=https.request(service.origin+path,{method,agent:false,ca:cert,headers:{...headers,...(bytes?{'content-type':'application/json','content-length':bytes.length}:{})}},response=>{
      let text='';response.on('data',bytes=>text+=bytes.toString());response.on('end',()=>{let body;try{body=JSON.parse(text);}catch{/* Static payload. */}done({status:response.statusCode,headers:response.headers,text,body});});
    });req.on('error',reject);req.end(bytes);
  });
}
async function actor() {
  const jar=new Map(),csrf=new Map();let admission='';
  async function call(path,options={}) {
    const room=path.match(/^\/api\/v1\/rooms\/([a-f0-9-]{36})/)?.[1],publicAdmission=path==='/api/v1/rooms'||path.endsWith('/join');
    const response=await raw(path,{...options,headers:{origin:service.origin,cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),'x-csrf-token':publicAdmission?admission:csrf.get(room)??'',...options.headers}});
    for(const line of response.headers['set-cookie']??[]){const pair=line.split(';')[0],index=pair.indexOf('=');if(pair.slice(index+1))jar.set(pair.slice(0,index),pair.slice(index+1));else jar.delete(pair.slice(0,index));}
    if(response.headers['x-csrf-token'])csrf.set(room??response.body?.room_id,response.headers['x-csrf-token']);
    return response;
  }
  const bootstrap=await call('/api/v1/entry-policy');assert.equal(bootstrap.status,200);admission=bootstrap.body.csrf_token;
  const offer=bootstrap.body.offer;
  return {call,csrf,jar,acceptance:{offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true},get cookies(){return [...jar].map(([k,v])=>k+'='+v).join('; ');}};
}
async function ok(client,path,method='GET',body) {const result=await client.call(path,{method,...(body===undefined?{}:{body})});assert.equal(result.status,200,result.text);return result.body;}
async function socket(client,room) {
  const ticket=await ok(client,base(room)+'/ws-ticket','POST',{request_id:randomUUID()});
  const ws=new WebSocket(service.origin.replace('https:','wss:')+base(room)+'/ws',{ca:cert,origin:service.origin,headers:{cookie:client.cookies}});connections.add(ws);
  const capture={frames:[],bytes:0,overflow:false,invalid:false};socketFrames.set(ws,capture);
  ws.on('message',bytes=>{capture.bytes+=bytes.length;if(capture.frames.length>=2048||capture.bytes>2*1024*1024){capture.overflow=true;return;}try{capture.frames.push(JSON.parse(bytes.toString()));}catch{capture.invalid=true;}});
  await new Promise((done,reject)=>{const timeout=setTimeout(()=>reject(new Error('WS auth timeout')),10000);ws.once('error',reject);ws.once('open',()=>ws.send(JSON.stringify({type:'auth',ticket:ticket.ticket})));ws.on('message',bytes=>{const row=JSON.parse(bytes.toString());if(row.type==='room.snapshot'){clearTimeout(timeout);done();}});});
  const interval=setInterval(()=>{if(ws.readyState===1)ws.send(JSON.stringify({type:'ping'}));},10000);interval.unref();
  ws.once('close',()=>{clearInterval(interval);connections.delete(ws);});ws.on('error',()=>{});return ws;
}
async function closeSockets(f){for(const ws of f.sockets??[])ws.terminate();await delay(40);}
async function prepare({context='online',participants=2,requirePrivate=true,mode='questions'}={}) {
  const host=await actor(),created=await host.call('/api/v1/rooms',{method:'POST',body:{meeting_context:context,locale:'en',name:'SYNTHETIC CHAT HOST',idempotency_key:randomUUID(),entry_acceptance:host.acceptance}});
  assert.equal(created.status,201,created.text);const room=created.body.room_id,invite=new URL(created.body.invite_url).hash.slice('#invite='.length),members=[];
  for(let index=0;index<participants;index++){
    const value=await actor(),joined=await ok(value,base(room)+'/join','POST',{invite_token:invite,locale:index?'tr':'ru',display_name:'SYNTHETIC CHAT '+index,idempotency_key:randomUUID(),entry_acceptance:value.acceptance});
    value.id=joined.me.id;members.push(value);
  }
  host.id=created.body.me.id;
  const sockets=[];for(const value of [host,...members])sockets.push(await socket(value,room));
  const neutral=!requirePrivate&&mode==='yes_but';
  for(const value of members){const prefs=await ok(value,base(room)+'/me/preferences');const edges=Object.fromEntries(members.filter(other=>other!==value).map(other=>[other.id,neutral?'friendship':context==='in_person'?'in_relationships':'crush']));await ok(value,base(room)+'/me/preferences','PUT',{comfort:neutral?0:4,edges,expected_rev:prefs.rev,idempotency_key:randomUUID()});}
  const snapshot=await ok(host,base(room)),draft=await ok(host,base(room)+'/game/prepare','POST',{mode,round_count:requirePrivate?20:1,players:members.map(value=>value.id),expected_rev:snapshot.room_rev,idempotency_key:randomUUID()});
  await ok(host,base(room)+'/game/start','POST',{draft_rev:draft.game_rev,idempotency_key:randomUUID()});
  const f={host,members,room,game:draft.session_id,sockets,plan:null};
  for(let index=0;index<20;index++){
    f.plan=await service.plan(f.game);if(f.plan.interaction==='pair_private'||!requirePrivate)break;
    const primary=members.find(value=>value.id===f.plan.primary_member_id);assert.ok(primary);
    await ok(primary,base(room)+`/game/${f.game}/round/${f.plan.round_id}/response`,'POST',{kind:'skip',request_id:randomUUID()});
    const view=await ok(host,base(room)+'/game/current');await ok(host,base(room)+`/game/${f.game}/round/advance`,'POST',{expected_rev:view.game_rev,idempotency_key:randomUUID()});
  }
  if(requirePrivate)assert.equal(f.plan.interaction,'pair_private','Synthetic fixture must reach a real private round');
  f.pair=requirePrivate?f.plan.actors.map(id=>members.find(value=>value.id===id)):members;assert.ok(f.pair.every(Boolean));return f;
}
async function invitation(f,value){return ok(value,base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/invitation`);}
async function accept(f,value){const invite=await invitation(f,value);await ok(value,base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/response`,'POST',{kind:'accept',scope:'invitation',offer_id:invite.offer_id,proposal_revision:invite.proposal_revision,request_id:randomUUID()});}
async function activate(f){for(const value of f.pair)await accept(f,value);return invitation(f,f.pair[0]);}
async function send(f,text='SYNTHETIC SECRET '+randomUUID(),client=f.pair[0],requestId=randomUUID()) {return client.call(endpoint(f),{method:'POST',body:{request_id:requestId,text}});}
async function denied(client,path){const result=await client.call(path);assert.ok(result.status>=400,result.text);assert.ok(!result.body?.messages);return result;}
async function counts(f){return (await pool.query(`SELECT (SELECT count(*)::int FROM private_chat_scopes WHERE room_id=$1) AS scopes,(SELECT count(*)::int FROM private_chat_messages WHERE room_id=$1) AS messages,(SELECT count(*)::int FROM private_chat_requests WHERE room_id=$1) AS requests`,[f.room])).rows[0];}
async function checkpoint(f){
  const saved={game:(await pool.query('SELECT state,pause_reason,rev,current_round,snapshot_cipher,pack_digest FROM game_sessions WHERE id=$1',[f.game])).rows[0],round:(await pool.query('SELECT state,cipher FROM game_rounds WHERE id=$1',[f.plan.round_id])).rows[0],chat:{}};
  for(const table of ['private_chat_scopes','private_chat_messages','private_chat_requests'])saved.chat[table]=(await pool.query(`SELECT * FROM ${table} WHERE room_id=$1`,[f.room])).rows;
  return saved;
}
async function restoreRows(f,saved){
  const c=await pool.connect();try{
    await c.query('BEGIN');await c.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[f.room]);
    await c.query('DELETE FROM private_chat_scopes WHERE room_id=$1',[f.room]);
    await c.query('UPDATE game_sessions SET state=$2,pause_reason=$3,rev=$4,current_round=$5,snapshot_cipher=$6,pack_digest=$7 WHERE id=$1',[f.game,saved.game.state,saved.game.pause_reason,saved.game.rev,saved.game.current_round,saved.game.snapshot_cipher,saved.game.pack_digest]);
    await c.query('UPDATE game_rounds SET state=$2,cipher=$3 WHERE id=$1',[f.plan.round_id,saved.round.state,saved.round.cipher]);
    for(const table of ['private_chat_scopes','private_chat_messages','private_chat_requests'])for(const row of saved.chat[table]){
      const columns=Object.keys(row);await c.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES(${columns.map((_,index)=>'$'+(index+1)).join(',')})`,columns.map(key=>row[key]));
    }
    await c.query('COMMIT');
  }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
}
async function stop(f,kind='stop'){return ok(f.pair[0],base(f.room)+`/game/${f.game}`+(kind==='stop'?'/stop':`/round/${f.plan.round_id}/response`),'POST',kind==='stop'?{request_id:randomUUID()}:{kind,request_id:randomUUID()});}

before(async()=>{
  assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');service=await runtime();
  pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),max:8});
});
after(async()=>{
  for(const ws of connections)ws.terminate();if(service)await service.close();if(pool)await pool.end();
  report.expected_cases=19;report.status=report.records.length===19&&report.records.every(row=>row.status==='PASS')?'PASS':'FAIL';
  writeFileSync(join(output,'chat-integration.json'),JSON.stringify(report,null,2));
});

test('P05-CHAT-01 actual bilateral invitation ACL, host and other pair/room exclusion',async()=>record('P05-CHAT-01',async()=>{
  const f=await prepare({participants:4});try{
    for(const value of [f.host,...f.members])await denied(value,endpoint(f));
    await accept(f,f.pair[0]);await denied(f.pair[0],endpoint(f));await accept(f,f.pair[1]);
    const secret='SYNTHETIC SECRET ACL '+randomUUID(),sent=await send(f,secret);assert.equal(sent.status,200,sent.text);
    const before=await ok(f.host,base(f.room)+'/game/current');
    for(const value of f.pair){const view=await ok(value,endpoint(f));assert.equal(view.messages[0].text,secret);assert.equal(view.chat_rev,1);}
    for(const value of [f.host,...f.members.filter(value=>!f.pair.includes(value))])await denied(value,endpoint(f));
    await denied(f.pair[0],endpoint({...f,game:randomUUID()}));await denied(f.pair[0],endpoint({...f,plan:{...f.plan,round_id:randomUUID()}}));
    const outsider=await actor(),otherRoom=await outsider.call('/api/v1/rooms',{method:'POST',body:{meeting_context:'online',locale:'en',name:'SYNTHETIC OTHER ROOM',idempotency_key:randomUUID(),entry_acceptance:outsider.acceptance}});
    assert.equal(otherRoom.status,201,otherRoom.text);await denied(outsider,endpoint(f));await denied(f.pair[0],endpoint({...f,room:otherRoom.body.room_id}));
    const fresh=await ok(f.host,base(f.room)+'/game/current');assert.equal(fresh.game_rev,before.game_rev,'chat must not bump game_rev');
    const own=await raw(endpoint(f),{headers:{cookie:f.pair[0].cookies,'x-csrf-token':f.pair[0].csrf.get(f.room),'sec-fetch-site':'same-origin'}});assert.equal(own.status,200,own.text);
    assert.equal(own.headers['cache-control'],'no-store');
    for(const headers of [{cookie:f.pair[0].cookies},{cookie:f.pair[0].cookies,'x-csrf-token':'wrong'},{cookie:f.pair[0].cookies,'x-csrf-token':f.pair[0].csrf.get(f.room),origin:'https://evil.test'},{cookie:f.pair[0].cookies,'x-csrf-token':f.pair[0].csrf.get(f.room),'sec-fetch-site':'cross-site'}])assert.ok((await raw(endpoint(f),{headers})).status>=400);
    return {actors:2,nonpair_members_denied:3,cross_session:true,stale_round:true,cross_room_real_foreign_cookie:true,csrf_get_without_origin:true,game_revision_unchanged:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-02 ciphertext/AAD, no plaintext in SQL persistence, independent request idempotency',async()=>record('P05-CHAT-02',async()=>{
  const f=await prepare();try{
    await activate(f);const text='SYNTHETIC SECRET STORAGE '+randomUUID(),requestId=randomUUID();
    const initial=await send(f,text,f.pair[0],requestId);assert.equal(initial.status,200,initial.text);
    const replay=await send(f,text,f.pair[0],requestId);assert.deepEqual(replay.body,initial.body);
    const conflict=await send(f,text+' changed',f.pair[0],requestId);assert.equal(conflict.status,409);assert.equal(conflict.body.code,'IDEMPOTENCY_CONFLICT');
    assert.deepEqual(await counts(f),{scopes:1,messages:1,requests:1});
    const tables=['private_chat_scopes','private_chat_messages','private_chat_requests','audit_events','outbox_events','game_outbox_refs','idempotency_keys'];
    for(const table of tables){const dump=await pool.query(`SELECT row_to_json(t) AS data FROM ${table} t WHERE room_id=$1`,[f.room]);assert.ok(!JSON.stringify(dump.rows).includes(text),table+' plaintext leak');}
    const row=(await pool.query('SELECT * FROM private_chat_messages WHERE room_id=$1',[f.room])).rows[0],keys=Keyring.fromFile(service.fixtureConfig.keyringFile);
    assert.equal(Buffer.from(row.cipher.data,'base64').length,16384);assert.equal(keys.decrypt(row.cipher,`private-chat:${f.room}:${f.game}:${f.plan.round_id}:${row.message_id}:1`).text,text);
    assert.throws(()=>keys.decrypt(row.cipher,`private-chat:${randomUUID()}:${f.game}:${f.plan.round_id}:${row.message_id}:1`));
    const scope=(await pool.query('SELECT rev,total FROM private_chat_scopes WHERE round_id=$1',[f.plan.round_id])).rows[0];assert.equal(Number(scope.rev),1);assert.equal(scope.total,1);
    const logs=service.logs();assert.equal(logs.truncated,false,'Absence proof requires complete bounded log capture');assert.ok(logs.text.includes('request_complete'));assert.ok(!logs.text.includes(text),'Live API log plaintext leak');
    const cookie=f.pair[0].jar.get('venus_room_session');assert.ok(cookie);assert.ok(!logs.text.includes(cookie),'Live API cookie leak');
    return {sql_tables_inspected:tables.length,plaintext_absent:true,actual_api_log_complete_and_secret_absent:true,padded_cipher_bytes:16384,cross_room_aad_rejected:true,idempotent_quota:1,changed_text_conflict:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-03 actual request validation and persistent rate/volume bounds',async()=>record('P05-CHAT-03',async()=>{
  // Keep the natural 13-send check away from a minute boundary without changing
  // server clocks backwards or granting any consent before its creation time.
  service.tick((10000-service.fixtureConfig.now()%60000+60000)%60000);
  const f=await prepare();try{
    await activate(f);
    for(const body of [{request_id:randomUUID(),text:''},{request_id:randomUUID(),text:'a'.repeat(1001)},{request_id:randomUUID(),text:'\ud800'},{request_id:randomUUID(),text:'\nprivate'},{request_id:randomUUID(),text:'valid',extra:true}]){
      const result=await f.pair[0].call(endpoint(f),{method:'POST',body});assert.equal(result.status,400,result.text);
    }
    for(let index=0;index<12;index++){const result=await send(f,'SYNTHETIC RATE '+index);assert.equal(result.status,200,result.text);}
    const excess=await send(f);assert.equal(excess.status,429,excess.text);assert.equal(excess.body.code,'RATE_LIMITED');
    const other=await send(f,'SYNTHETIC OTHER ACTOR',f.pair[1]);assert.equal(other.status,200,other.text);
    const count=await counts(f);assert.equal(count.messages,13);assert.equal(count.requests,13);
    // Explicit persisted-state fault fixture: natural 128-send exhaustion cannot
    // occur inside the 3-minute invitation at the stricter per-minute quota.
    await pool.query("UPDATE private_chat_scopes SET total=128,actor_counts='{}' WHERE round_id=$1",[f.plan.round_id]);
    const volume=await send(f,'SYNTHETIC VOLUME FAULT',f.pair[1]);assert.equal(volume.status,429,volume.text);assert.equal(volume.body.code,'PRIVATE_CHAT_VOLUME_LIMIT');
    assert.deepEqual(await counts(f),count);
    return {malformed_inputs_rejected:5,actor_rate_limit:12,other_actor_independent:true,volume_limit_persisted_fault_fixture:128,no_overquota_insert:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-04 full buffer retains latest32 and bounds encrypted rows',async()=>record('P05-CHAT-04',async()=>{
  const f=await prepare();try{
    await activate(f);
    // Reset only the rate window in explicit SQL fault fixture; all 40 requests
    // still use actual HTTP validation/encryption, quota, idempotency and pruning.
    for(let index=0;index<40;index++){
      if(index%10===0)await pool.query("UPDATE private_chat_scopes SET actor_counts='{}' WHERE round_id=$1",[f.plan.round_id]);
      const result=await send(f,'SYNTHETIC BUFFER '+index);assert.equal(result.status,200,result.text);
    }
    const view=await ok(f.pair[1],endpoint(f));assert.equal(view.messages.length,32);assert.equal(view.messages[0].text,'SYNTHETIC BUFFER 8');assert.equal(view.messages.at(-1).text,'SYNTHETIC BUFFER 39');assert.equal(view.chat_rev,40);
    const count=await counts(f);assert.deepEqual(count,{scopes:1,messages:32,requests:40});
    const payload=(await pool.query("SELECT sum(octet_length(decode(cipher->>'data','base64')))::int AS bytes FROM private_chat_messages WHERE round_id=$1",[f.plan.round_id])).rows[0];assert.equal(payload.bytes,32*16384);
    return {actual_http_sends:40,rate_window_reset_fault_fixture:true,retained_messages:32,retained_cipher_bytes:payload.bytes,first_retained_index:8};
  }finally{await closeSockets(f);}
}));

for(const kind of ['decline','skip','stop','finish','disconnect','leave','setup-withdrawal','close'])test(`P05-CHAT lifecycle ${kind} clears SQL transcript and old access`,async()=>record('P05-CHAT-LIFECYCLE-'+kind,async()=>{
  const f=await prepare();try{
    await activate(f);assert.equal((await send(f)).status,200);assert.equal((await counts(f)).messages,1);
    if(kind==='disconnect'){
      const index=f.members.indexOf(f.pair[0])+1,ws=f.sockets[index];ws.terminate();
      for(let attempt=0;attempt<100;attempt++){if((await counts(f)).scopes===0)break;await delay(30);}
    }else if(kind==='close'){
      const room=await ok(f.host,base(f.room));await ok(f.host,base(f.room)+'/close','POST',{expected_rev:room.room_rev,idempotency_key:randomUUID()});
    }else if(kind==='leave'){
      const room=await ok(f.pair[0],base(f.room));await ok(f.pair[0],base(f.room)+'/leave','POST',{expected_rev:room.room_rev,idempotency_key:randomUUID()});
    }else if(kind==='setup-withdrawal'){
      const before=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[f.game])).rows[0].snapshot_cipher;
      const own=await ok(f.pair[0],base(f.room)+'/me/preferences');await ok(f.pair[0],base(f.room)+'/me/setup/skip','POST',{expected_rev:own.rev,idempotency_key:randomUUID()});
      const cleared=(await pool.query('SELECT state,snapshot_cipher,rev FROM game_sessions WHERE id=$1',[f.game])).rows[0];assert.equal(cleared.state,'aborted');assert.deepEqual(cleared.snapshot_cipher,before,'Withdrawal must not rewrite immutable snapshot');
      const resume=await f.host.call(base(f.room)+`/game/${f.game}/resume`,{method:'POST',body:{expected_rev:Number(cleared.rev),idempotency_key:randomUUID()}});assert.equal(resume.status,409);assert.equal(resume.body.code,'GAME_NOT_PAUSED');
      const freshPrefs=await ok(f.pair[0],base(f.room)+'/me/preferences');assert.equal(freshPrefs.comfort,0);
    }else if(kind==='finish'){
      // questions finish belongs to its actual primary; no action consent needed
      // for this non-contact fixture. If an action offer exists, explicitly accept it.
      const data=(await pool.query('SELECT cipher FROM game_rounds WHERE id=$1',[f.plan.round_id])).rows[0],keys=Keyring.fromFile(service.fixtureConfig.keyringFile),round=keys.decrypt(data.cipher,`game-round:${f.room}:${f.game}:${f.plan.round_id}:1`);
      if(round.action)for(const value of f.pair)await ok(value,base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/response`,'POST',{kind:'accept',scope:'action',offer_id:round.action.offer_id,proposal_revision:round.action.proposal_revision,request_id:randomUUID()});
      const primary=f.pair.find(value=>value.id===f.plan.primary_member_id);
      await ok(primary,base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/finish`,'POST',{request_id:randomUUID()});
    }else await stop(f,kind);
    assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    for(const value of f.pair)await denied(value,endpoint(f));assert.ok((await send(f)).status>=400);
    return {scope_deleted:true,ciphertext_deleted:true,receipts_deleted:true,old_get_and_send_denied:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-CONTEXT in-person immutable snapshot never advertises online text transport',async()=>record('P05-CHAT-CONTEXT',async()=>{
  const f=await prepare({context:'in_person',requirePrivate:false});try{
    await denied(f.pair[0],endpoint(f));assert.ok((await send(f)).status>=400);assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    const game=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[f.game])).rows[0],keys=Keyring.fromFile(service.fixtureConfig.keyringFile),snapshot=keys.decrypt(game.snapshot_cipher,`game-snapshot:${f.room}:${f.game}:1`);
    assert.ok(!snapshot.capabilities.includes('private_text_chat'));
    return {actual_in_person_snapshot:true,round_interaction:f.plan.interaction,private_ip_gameplay_not_claimed:true,in_person_snapshot_has_no_chat_capability:true,http_unavailable:true,no_chat_rows:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-EXPIRY awaited SQL read + concurrent revoke respects final clock fence',async()=>record('P05-CHAT-EXPIRY-RACE',async()=>{
  const f=await prepare();let lock;try{
    const offer=await activate(f),secret='SYNTHETIC RACE SECRET '+randomUUID();assert.equal((await send(f,secret)).status,200);
    lock=await pool.connect();await lock.query('BEGIN');await lock.query('LOCK TABLE private_chat_messages IN ACCESS EXCLUSIVE MODE');
    const get=f.pair[1].call(endpoint(f));let blocked=false;
    for(let index=0;index<100;index++){
      const waiting=await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'SELECT message_id,member_id,cipher,sent_at,expires_at FROM private_chat_messages%' LIMIT 1");
      if(waiting.rowCount){blocked=true;break;}await delay(20);
    }
    assert.equal(blocked,true,'Actual message SELECT must wait behind table lock');
    const withdrawal=stop(f,'stop');
    service.tick(Math.max(0,Date.parse(offer.expires_at)-service.fixtureConfig.now()+100));
    await lock.query('COMMIT');lock.release();lock=null;
    const response=await get;assert.ok(response.status>=400,response.text);assert.ok(!response.text.includes(secret));await withdrawal;
    assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    return {actual_pg_relation_wait:true,concurrent_stop_serialized:true,clock_advanced_after_real_await:true,expiry_margin_ms:100,no_private_enqueue_after_expiry:true};
  }finally{if(lock){await lock.query('ROLLBACK');lock.release();}await closeSockets(f);}
}));

test('P05-CHAT-RESTORE cold restart and restored revoked rows do not recreate grants',async()=>record('P05-CHAT-RESTORE',async()=>{
  const f=await prepare();try{
    await activate(f);assert.equal((await send(f)).status,200);
    const backup=await checkpoint(f);
    await service.restart();assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    // New process has no grant even when old session/round and both actor
    // presences are made current again through real transport reconnects.
    f.sockets=[];for(const value of [f.host,...f.members])f.sockets.push(await socket(value,f.room));
    await denied(f.pair[0],endpoint(f));assert.ok((await send(f)).status>=400);
    const current=await ok(f.host,base(f.room)+'/game/current');assert.equal(current.session_id,f.game);
    // Actual row restore from an in-memory fixture snapshot, not a filesystem
    // production backup claim. No secret contents enter reports or logs.
    await restoreRows(f,backup);
    assert.equal((await pool.query('SELECT state FROM game_sessions WHERE id=$1',[f.game])).rows[0].state,'active');
    const restoredCipher=(await pool.query('SELECT cipher FROM game_rounds WHERE id=$1',[f.plan.round_id])).rows[0].cipher,keys=Keyring.fromFile(service.fixtureConfig.keyringFile);
    assert.equal(keys.decrypt(restoredCipher,`game-round:${f.room}:${f.game}:${f.plan.round_id}:1`).invitation.state,'active');
    await denied(f.pair[0],base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/private`);
    await denied(f.pair[0],endpoint(f));assert.ok((await send(f)).status>=400);
    await service.restart();assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    return {actual_api_restart:true,game_identity_preserved:true,transcript_purged:true,restored_active_game_and_bilateral_round:true,restored_sql_rows_cannot_restore_volatile_grant:true,second_boot_repurged:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-REVOKED-RESTORE same-boot rollback cannot resurrect withdrawn grant',async()=>record('P05-CHAT-REVOKED-RESTORE',async()=>{
  const f=await prepare();try{
    await activate(f);assert.equal((await send(f)).status,200);const backup=await checkpoint(f);
    await stop(f,'decline');assert.deepEqual(await counts(f),{scopes:0,messages:0,requests:0});
    await restoreRows(f,backup);
    const state=(await pool.query('SELECT state FROM game_sessions WHERE id=$1',[f.game])).rows[0].state;assert.equal(state,'active');
    assert.equal((await counts(f)).messages,1,'Explicit row restore actually recreated ciphertext');
    await denied(f.pair[0],base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/private`);
    await denied(f.pair[0],endpoint(f));assert.ok((await send(f)).status>=400);
    return {same_api_process:true,explicit_revoke_committed:true,pre_revoke_active_game_round_and_ciphertext_restored:true,volatile_grant_not_resurrected:true};
  }finally{await closeSockets(f);}
}));

test('P05-CHAT-MIGRATION additive generation/hash checks fail closed',async()=>record('P05-CHAT-MIGRATION',async()=>{
  await migrateChat(pool);await chatSchemaProbe(pool);await migrateChat(pool);
  const row=(await pool.query('SELECT generation,sha256 FROM venus_chat_schema_migrations')).rows;assert.equal(row.length,1);assert.equal(row[0].generation,1);
  try{
    await pool.query("UPDATE venus_chat_schema_migrations SET sha256='tampered' WHERE generation=1");await assert.rejects(migrateChat(pool),/checksum/);
  }finally{await pool.query('UPDATE venus_chat_schema_migrations SET sha256=$1 WHERE generation=1',[row[0].sha256]);}
  try{
    await pool.query("INSERT INTO venus_chat_schema_migrations VALUES(2,'unsupported')");await assert.rejects(migrateChat(pool),/unsupported/);
  }finally{await pool.query('DELETE FROM venus_chat_schema_migrations WHERE generation=2');}
  assert.equal((await pool.query('SELECT max(generation)::int AS n FROM venus_game_schema_migrations')).rows[0].n,1);
  await chatSchemaProbe(pool);return {generation:1,game_generation_unchanged:1,repeat_schema_idempotent:true,checksum_rejected:true,future_generation_rejected:true,startup_ephemeral_data_purge:true};
}));

function quietPath(f,suffix){return base(f.room)+`/game/${f.game}/round/${f.plan.round_id}/`+suffix;}
function completeCapture(ws){const capture=socketFrames.get(ws);assert.ok(capture);assert.equal(capture.overflow,false,'Absence proof requires complete bounded WS capture');assert.equal(capture.invalid,false);return capture;}
function quietFrames(f,client,revision=0,roomRevision=0){
  const index=[f.host,...f.members].indexOf(client),capture=completeCapture(f.sockets[index]);
  return capture.frames.filter(frame=>frame.type==='game.snapshot'&&frame.payload?.session_id===f.game&&frame.payload.game_rev>=revision&&frame.room_rev>=roomRevision);
}
function genericQuiet(view,f){
  assert.equal(view.session_id,f.game);const round=view.current_round;assert.ok(round);assert.equal(round.round_id,f.plan.round_id);assert.equal(round.kind,'generic');
  assert.deepEqual(Object.keys(round).sort(),['kind','round_id','round_index','state']);
  const bytes=JSON.stringify(view);assert.ok(!bytes.includes(f.plan.card_id));for(const value of f.pair)assert.ok(!bytes.includes(value.id),'Generic view must not identify the pair');assert.ok(!bytes.includes('SYNTHETIC'),'Generic view must not carry card/member text');
}
async function quietPhase(f,observers,name,kind,minimumRoomRevision=0){
  const anchor=await ok(f.host,base(f.room)+'/game/current'),revision=anchor.game_rev,room=await ok(f.host,base(f.room));
  for(let attempt=0;attempt<250;attempt++){
    if(observers.every(value=>quietFrames(f,value,revision,minimumRoomRevision).length>0))break;
    await delay(20);
  }
  const evidence=[];
  for(const value of observers){
    const http=await ok(value,base(f.room)+'/game/current'),frames=quietFrames(f,value,revision,minimumRoomRevision);assert.ok(frames.length>0,'Actual outsider game.snapshot missing for committed game_rev '+revision);
    assert.ok(http.game_rev>=revision);const views=[http,...frames.map(frame=>frame.payload)];
    for(const view of views){if(kind==='generic')genericQuiet(view,f);else{assert.equal(view.current_round.kind,'public');assert.equal(view.current_round.card_id,f.plan.card_id);assert.equal(view.current_round.card_revision,f.plan.card_revision);assert.deepEqual(view.current_round.actors,f.plan.actors);}}
    const capture=completeCapture(f.sockets[[f.host,...f.members].indexOf(value)]);
    assert.equal(capture.frames.some(frame=>frame.type==='game.consent_requested'&&frame.payload?.round_id===f.plan.round_id),false,'Observer must not receive the private invitation');
    const allGameFrames=capture.frames.filter(frame=>frame.type?.startsWith('game.')&&frame.room_rev>=Math.max(room.room_rev,minimumRoomRevision)&&(frame.payload?.session_id===f.game||frame.payload?.round_id===f.plan.round_id));
    if(kind==='generic')for(const frame of allGameFrames){const bytes=JSON.stringify(frame);assert.ok(!bytes.includes(f.plan.card_id));for(const member of f.pair)assert.ok(!bytes.includes(member.id));assert.ok(!bytes.includes('SYNTHETIC'));assert.ok(!/declin|reject|refus/i.test(bytes),'Generic outsider event must not identify a refusal or its reason');}
    evidence.push({observer_id:value.id,http,actual_ws_frames:frames,all_game_events_at_committed_room_revision:allGameFrames,capture_complete:true,captured_frames:capture.frames.length,captured_bytes:capture.bytes});
  }
  return {phase:name,committed_game_rev:revision,minimum_room_rev:minimumRoomRevision,observers:evidence};
}
async function publicFixture(){
  const f=await prepare({participants:7,requirePrivate:false,mode:'yes_but'});assert.equal((await ok(f.host,base(f.room))).members.length,8);assert.equal(f.plan.interaction,'pair_public');
  // Existing non-private helper semantics remain unchanged; only these two new
  // public-pair cases derive the selected pair from the real encrypted plan.
  f.pair=f.plan.actors.map(id=>f.members.find(value=>value.id===id));assert.equal(f.pair.length,2);assert.ok(f.pair.every(Boolean));return f;
}

test('P05-QUIET-PUBLIC 8-member actual HTTP/WS zero/one/two acknowledgements and withdrawal',async()=>record('P05-QUIET-PUBLIC-ACK-REVOKE',async()=>{
  const f=await publicFixture();try{
    const observers=[f.host,...f.members.filter(value=>!f.pair.includes(value))];assert.equal(observers.length,6);const phases=[];
    phases.push(await quietPhase(f,observers,'zero-ack','generic'));await accept(f,f.pair[0]);phases.push(await quietPhase(f,observers,'one-ack','generic'));
    await accept(f,f.pair[1]);phases.push(await quietPhase(f,observers,'two-ack','public'));
    for(const value of [f.host,...f.members])for(const path of [quietPath(f,'private'),endpoint(f)]){const response=await denied(value,path);assert.ok(!response.text.includes(f.plan.card_id));assert.ok(!response.text.includes('SYNTHETIC'));}
    const actions=[];for(const value of f.pair){const action=await value.call(quietPath(f,'action-consent'));if(action.status===200){assert.equal(action.body.state,'pending');assert.equal(action.body.own_state,'pending');actions.push(action.body);}else assert.ok(action.status>=400);}
    const withdrawal=await ok(f.pair[0],quietPath(f,'response'),'POST',{kind:'stop',request_id:randomUUID()});assert.ok(Number.isSafeInteger(withdrawal.rev));
    const after=await quietPhase(f,observers,'withdrawn','generic');assert.ok(after.committed_game_rev>=withdrawal.rev);phases.push(after);
    // Force another real room emission after the withdrawal commit, instead of
    // treating an arbitrary sleep or the absence of a new frame as evidence.
    const room=await ok(f.host,base(f.room));await ok(f.host,base(f.room)+'/me','PATCH',{locale:'tr',expected_rev:room.room_rev,idempotency_key:randomUUID()});const later=await ok(f.host,base(f.room));
    phases.push(await quietPhase(f,observers,'later-room-emission-after-withdrawal','generic',later.room_rev));
    return {actual_members:8,actual_observers:6,phases,action_consents_unaccepted:actions,private_prompt_and_chat_denied_for_all8:true,prior_authorized_public_content_not_erased_claim:false,server_wire_race_not_claimed:true};
  }finally{await closeSockets(f);}
}));

test('P05-QUIET-PUBLIC decline after one acknowledgement never exposes selected actors or prompt',async()=>record('P05-QUIET-PUBLIC-DECLINE',async()=>{
  const f=await publicFixture();try{
    const observers=[f.host,...f.members.filter(value=>!f.pair.includes(value))],phases=[];
    phases.push(await quietPhase(f,observers,'zero-ack','generic'));await accept(f,f.pair[0]);phases.push(await quietPhase(f,observers,'one-ack','generic'));
    await ok(f.pair[1],quietPath(f,'response'),'POST',{kind:'decline',request_id:randomUUID()});phases.push(await quietPhase(f,observers,'declined-after-one-ack','generic'));
    for(const value of observers){for(const suffix of ['invitation','private','chat']){const response=await denied(value,quietPath(f,suffix));assert.ok(!response.text.includes(f.plan.card_id));assert.ok(!response.text.includes('SYNTHETIC'));}for(const frame of quietFrames(f,value))genericQuiet(frame.payload,f);}
    return {actual_members:8,actual_observers:6,phases,all_captured_public_snapshots_generic:true,declining_actor_and_reason_absent_from_game_projection:true,outsider_invitation_private_chat_denied:true};
  }finally{await closeSockets(f);}
}));
