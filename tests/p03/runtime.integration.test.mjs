/** Actual PostgreSQL + authenticated HTTPS/WS, synthetic content only. */
import {describe,it,before,after,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import WebSocket from 'ws';
import {startRuntime,client,request,cert,setClock} from '../p02/harness.mjs';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {migrateGames,engineSchemaProbe} from '../../apps/api/dist/game-migrations.js';
import {migrate} from '../../apps/api/dist/migrations.js';
import {sealBackup,openBackup} from '../../apps/api/dist/backup.js';
import {FrozenPack,digest,policyDigest} from '../../packages/relationship-engine/dist/index.js';
import {syntheticCards,syntheticManifest} from './fixtures.mjs';

if(process.env.VENUS_P03_INTEGRATION!=='1') throw new Error('Isolated synthetic profile required');
const expected=['P03-SCHEMA','P03-START-RACE','P03-SNAPSHOT-LOCK','P03-CONSENT-ACL','P03-CONDITION-REVISION','P03-CLOCK-DEADLINE','P03-DISPATCH-FENCE','P03-OLD-RECIPIENT-CLEAR','P03-HTTP-WS-PRIVACY','P03-FINISH-REPLAY','P03-PINNING-RESTART','P03-VERSION-REFUSAL','P03-SQL-SCOPE','P03-DECLINE-RACES','P03-TRANSPORT-RESUME','P03-STOP-LEAVE-CLOSE','P03-IDENTITY-NO-SUBSTITUTION','P03-BACKUP-RESTORE','P03-ROLLBACK'];
const records=[],sockets=new Set();let runtime,pool,clock,keys,pack;
const reportPath='.artifacts/p03/integration-report.json';
function mark(id,detail={}) {records.push({id,status:'PASS',detail});}
function tick(ms) {clock+=ms;setClock(clock);}
const base=r=>`/api/v1/rooms/${r.roomId}`;
const gameBase=r=>base(r)+'/game';
const roundPath=(r,id=r.roundId)=>gameBase(r)+`/${r.gameId}/round/${id}`;
const sessionToken=c=>c.jar.get('venus_room_session');
async function ok(c,path,method='GET',body,status=200) {const response=await c.call(path,{method,...(body===undefined?{}:{body})});assert.equal(response.status,status,response.text);return response.body;}
async function roomSnapshot(r) {return ok(r.host,base(r));}
async function current(r) {return ok(r.host,gameBase(r)+'/current');}
async function roundData(r) {
  const row=(await pool.query('SELECT r.* FROM game_rounds r JOIN game_sessions g ON g.id=r.session_id WHERE g.id=$1 AND r.round_index=g.current_round',[r.gameId])).rows[0];
  assert.ok(row);r.roundId=row.id;return keys.decrypt(row.cipher,`game-round:${r.roomId}:${r.gameId}:${row.id}:1`);
}
async function post(c,path,body) {return ok(c,path,'POST',body);}
async function prepare(r,mode='questions',rounds=20) {
  const view=await roomSnapshot(r),draft=await post(r.host,gameBase(r)+'/prepare',{mode,round_count:rounds,players:r.actorIds,expected_rev:view.room_rev,idempotency_key:randomUUID()});
  r.gameId=draft.session_id;return draft;
}
async function start(r,mode='questions',rounds=20) {
  const draft=await prepare(r,mode,rounds);
  const result=await post(r.host,gameBase(r)+'/start',{draft_rev:draft.game_rev,idempotency_key:randomUUID()});assert.equal(result.session_id,r.gameId);
  await roundData(r);return result;
}
async function fixture(mode='questions',rounds=20) {
  const host=await client(runtime.origin),created=await ok(host,'/api/v1/rooms','POST',{meeting_context:'in_person',locale:'ru',name:'Host observer',idempotency_key:randomUUID(),entry_acceptance:host.acceptance},201);
  const r={host,roomId:created.room_id,hostId:created.me.id,invite:new URL(created.invite_url).hash.slice('#invite='.length),actors:[],actorIds:[],clients:new Map()};
  r.clients.set(r.hostId,host);
  for(const name of ['actor-A','actor-B']) {
    const c=await client(runtime.origin),joined=await post(c,base(r)+'/join',{invite_token:r.invite,locale:'en',display_name:name,idempotency_key:randomUUID(),entry_acceptance:c.acceptance});
    r.actors.push(c);r.actorIds.push(joined.me.id);r.clients.set(joined.me.id,c);
  }
  for(let index=0;index<r.actors.length;index++) await ok(r.actors[index],base(r)+'/me/preferences','PUT',{comfort:4,edges:{[r.actorIds[1-index]]:'friendship'},expected_rev:0,idempotency_key:randomUUID()});
  // Admission reserves a slot; only a live authenticated socket makes an actor present.
  for(const c of r.actors) await websocket(r,c);
  if(mode) await start(r,mode,rounds);return r;
}
async function advance(r) {const view=await current(r);const result=await post(r.host,gameBase(r)+`/${r.gameId}/round/advance`,{expected_rev:view.game_rev,idempotency_key:randomUUID()});if(result.current_round) r.roundId=result.current_round.round_id;return result;}
async function privateRound(r) {
  for(let index=0;index<20;index++) {
    const data=await roundData(r);if(data.plan.interaction==='pair_private') return data;
    await post(r.clients.get(data.plan.primary_member_id),roundPath(r)+'/response',{kind:'skip',request_id:randomUUID()});await advance(r);
  }
  throw new Error('Synthetic limited-public repertoire did not reach a private round');
}
async function offerFor(r,c,scope='invitation') {return ok(c,roundPath(r)+(scope==='invitation'?'/invitation':'/action-consent'));}
async function accept(r,c,offer,scope=offer.consent_scope) {return post(c,roundPath(r)+'/response',{kind:'accept',scope,offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()});}
async function reveal(r) {const offer=await offerFor(r,r.actors[0]);await accept(r,r.actors[0],offer);await accept(r,r.actors[1],offer);return offer;}
function service() {
  const rooms=new Rooms({pool,keys,ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:runtime.origin,now:()=>clock,offer:()=>({version:'synthetic-p02-1',digest:'sha256:'+hash(JSON.stringify({ru:'СИНТЕТИЧЕСКИЙ ТЕСТ. Не оферта.',en:'SYNTHETIC TEST. Not a public offer.',tr:'SENTETİK TEST. Kamuya açık teklif değildir.'})),synthetic:true,text:{ru:'test',en:'test',tr:'test'}})});
  const games=new Games(rooms,()=>pack,true);rooms.attachGames(games);return {rooms,games};
}
async function grantFor(r,c,rooms) {const ticket=await post(c,base(r)+'/ws-ticket',{request_id:randomUUID()});return rooms.connect(r.roomId,sessionToken(c),ticket.ticket);}
async function websocket(r,c) {
  const ticket=await post(c,base(r)+'/ws-ticket',{request_id:randomUUID()}),frames=[];
  const ws=new WebSocket(runtime.origin.replace('https:','wss:')+base(r)+'/ws',{ca:cert,origin:runtime.origin,headers:{cookie:c.cookies}});sockets.add(ws);
  const ready=new Promise((resolve,reject)=>{ws.on('message',bytes=>{const frame=JSON.parse(bytes.toString());frames.push(frame);if(frame.type==='room.snapshot') resolve();});ws.on('error',reject);ws.on('close',code=>{if(!frames.length) reject(new Error('WS closed before authentication: '+code));});});
  await once(ws,'open');ws.send(JSON.stringify({type:'auth',ticket:ticket.ticket}));await ready;
  return {ws,frames};
}
async function waitFor(predicate) {for(let index=0;index<100;index++) {if(await predicate()) return;await new Promise(resolve=>setTimeout(resolve,30));}throw new Error('Timed out waiting for actual state/delivery');}

describe('EXIT-P03 actual PostgreSQL / HTTPS / WS',()=>{
  before(async()=>{
    clock=Number(readFileSync(process.env.P02_CLOCK_FILE,'utf8'));keys=Keyring.fromFile(process.env.KEYRING_FILE);
    pool=new pg.Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),max:12});
    await migrate(pool);assert.equal((await pool.query("SELECT to_regclass('game_sessions') AS name")).rows[0].name,null);
    const acceptedCore=execFileSync('git',['show',process.env.P03_PREVIOUS_SOURCE+':apps/api/migrations/001_rooms.sql']);
    assert.equal((await pool.query('SELECT sha256 FROM venus_schema_migrations WHERE generation=1')).rows[0].sha256,createHash('sha256').update(acceptedCore).digest('hex'));
    await Promise.all([migrateGames(pool),migrateGames(pool),migrateGames(pool)]);
    const cards=syntheticCards().filter(card=>Number(card.id.split('-')[1])>100||Number(card.id.split('-')[1])<=15);
    for(const card of cards) if(card.interaction==='pair_private') {card.meeting_contexts=['in_person'];card.required_capabilities=[];}
    pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
    runtime=await startRuntime({VENUS_P03_INTEGRATION:'1',P03_PUBLIC_CARD_LIMIT:'15',P03_PRIVATE_IN_PERSON_ONLY:'1'});
  });
  beforeEach(()=>tick(120000));
  afterEach(()=>{for(const ws of sockets) ws.terminate();sockets.clear();});
  after(async()=>{
    try {if(runtime) await runtime.close();} finally {if(pool) await pool.end();}
    mkdirSync('.artifacts/p03',{recursive:true});
    writeFileSync(reportPath,JSON.stringify({source_sha:process.env.P03_SOURCE_SHA,source_dirty:process.env.P03_SOURCE_DIRTY==='1',synthetic:true,pack_digest:pack?.digest,tests:records,all_expected_checks:expected.length,expected_checks:expected,status:expected.every(id=>records.filter(r=>r.id===id&&r.status==='PASS').length===1)?'PASS':'FAIL'},null,2));
  });

  it('checks extension migration repeat/checksum/future generation and real readiness',async()=>{
    await migrateGames(pool);await migrateGames(pool);await engineSchemaProbe(pool);
    const original=(await pool.query('SELECT sha256 FROM venus_game_schema_migrations WHERE generation=1')).rows[0].sha256;
    try {await pool.query("UPDATE venus_game_schema_migrations SET sha256='tampered' WHERE generation=1");await assert.rejects(migrateGames(pool),/checksum/);}
    finally {await pool.query('UPDATE venus_game_schema_migrations SET sha256=$1 WHERE generation=1',[original]);}
    try {await pool.query("INSERT INTO venus_game_schema_migrations VALUES(2,'future')");await assert.rejects(migrateGames(pool),/unsupported/);assert.equal((await request(runtime.origin,'/health/ready')).status,503);}
    finally {await pool.query('DELETE FROM venus_game_schema_migrations WHERE generation=2');}
    assert.equal((await request(runtime.origin,'/health/ready')).status,200);mark('P03-SCHEMA',{core_generation:1,engine_generation:1,accepted_p02_core_checksum_verified:true,concurrent_first_upgrade_calls:3,checksum_rejection:true,future_rejection:true});
  });
  it('serializes concurrent start and same-key duplicate advance without extra rounds',async()=>{
    const r=await fixture(null),draft=await prepare(r),body={draft_rev:draft.game_rev,idempotency_key:randomUUID()};
    const replies=await Promise.all(Array.from({length:6},()=>r.host.call(gameBase(r)+'/start',{method:'POST',body})));
    for(const result of replies) {assert.equal(result.status,200,result.text);assert.deepEqual(result.body,replies[0].body);}
    await roundData(r);const data=await roundData(r);await post(r.clients.get(data.plan.primary_member_id),roundPath(r)+'/response',{kind:'skip',request_id:randomUUID()});
    const view=await current(r),next={expected_rev:view.game_rev,idempotency_key:randomUUID()},advanced=await Promise.all(Array.from({length:6},()=>r.host.call(gameBase(r)+`/${r.gameId}/round/advance`,{method:'POST',body:next})));
    for(const result of advanced) {assert.equal(result.status,200,result.text);assert.deepEqual(result.body,advanced[0].body);}
    assert.equal(Number((await pool.query('SELECT count(*) FROM game_rounds WHERE session_id=$1',[r.gameId])).rows[0].count),2);
    assert.equal((await r.host.call(gameBase(r)+`/${r.gameId}/round/advance`,{method:'POST',body:{...next,expected_rev:next.expected_rev+1}})).body.code,'IDEMPOTENCY_CONFLICT');
    mark('P03-START-RACE',{concurrent_starts:6,concurrent_duplicate_advances:6,rounds:2});
  });
  it('pins encrypted snapshot and locks preferences/context in active and safety pause',async()=>{
    const r=await fixture(),before=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher;
    const snapshot=keys.decrypt(before,`game-snapshot:${r.roomId}:${r.gameId}:1`);assert.deepEqual(snapshot.players.map(p=>p.id),[...r.actorIds].sort());
    assert.equal(JSON.stringify(before).includes('friendship'),false);
    const preference=await ok(r.actors[0],base(r)+'/me/preferences');assert.equal(preference.locked,true);
    const input={comfort:0,edges:{},expected_rev:preference.rev,idempotency_key:randomUUID()};assert.equal((await r.actors[0].call(base(r)+'/me/preferences',{method:'PUT',body:input})).body.code,'GAME_SETTINGS_LOCKED');
    await post(r.actors[0],gameBase(r)+`/${r.gameId}/pause`,{expected_rev:0,idempotency_key:randomUUID()});
    assert.equal((await r.actors[0].call(base(r)+'/me/preferences',{method:'PUT',body:input})).body.code,'GAME_SETTINGS_LOCKED');
    const room=await roomSnapshot(r);assert.equal((await r.host.call(base(r)+'/context',{method:'PATCH',body:{meeting_context:'online',expected_rev:room.room_rev,idempotency_key:randomUUID()}})).body.code,'GAME_SETTINGS_LOCKED');
    await post(r.actors[0],base(r)+'/me/setup/skip',{expected_rev:preference.rev,idempotency_key:randomUUID()});
    const view=await current(r);assert.equal(view.state,'aborted');assert.equal(view.pause_reason,null);
    assert.equal((await r.host.call(gameBase(r)+`/${r.gameId}/resume`,{method:'POST',body:{expected_rev:view.game_rev,idempotency_key:randomUUID()}})).body.code,'GAME_NOT_PAUSED');
    assert.deepEqual((await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher,before);
    mark('P03-SNAPSHOT-LOCK',{snapshot_sha256:createHash('sha256').update(JSON.stringify(before)).digest('hex'),active_and_paused_locked:true,neutral_skip_available:true,p05_safety_clear_aborts_before_new_snapshot:true});
  });
  it('requires exact actors, independent invitation/action consent and terminal decline',async()=>{
    const r=await fixture();await privateRound(r);const offer=await offerFor(r,r.actors[0]);
    assert.equal((await r.host.call(roundPath(r)+'/invitation')).status,404);
    assert.equal((await request(runtime.origin,roundPath(r)+'/private')).status,401);
    assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    assert.equal((await r.host.call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()}})).body.code,'ROUND_ACTOR_REQUIRED');
    assert.equal((await r.actors[0].call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID(),target_member_id:r.actorIds[1]}})).status,400);
    await accept(r,r.actors[0],offer);assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    assert.equal((await r.actors[1].call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:randomUUID(),proposal_revision:offer.proposal_revision,request_id:randomUUID()}})).body.code,'CONSENT_PROPOSAL_STALE');
    await accept(r,r.actors[1],offer);assert.equal((await ok(r.actors[0],roundPath(r)+'/private')).state,'active');
    const action=await offerFor(r,r.actors[0],'action');assert.notEqual(action.offer_id,offer.offer_id);assert.equal(action.state,'pending');
    assert.equal((await r.actors[0].call(roundPath(r)+'/finish',{method:'POST',body:{request_id:randomUUID()}})).body.code,'ROUND_NOT_ACTIVE');
    await accept(r,r.actors[0],action);await accept(r,r.actors[1],action);
    await post(r.actors[1],roundPath(r)+'/response',{kind:'decline',request_id:randomUUID()});
    assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    assert.equal((await r.actors[0].call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'action',offer_id:action.offer_id,proposal_revision:action.proposal_revision,request_id:randomUUID()}})).body.code,'CONSENT_TERMINAL');
    mark('P03-CONSENT-ACL',{nonactor_host_denied:true,unauth_denied:true,two_scopes:true,late_decline_revokes:true});
  });
  it('keeps YesBut condition actor scoped and invalidates old proposal acknowledgements',async()=>{
    const r=await fixture('yes_but',5),data=await roundData(r),primary=r.clients.get(data.plan.actors[0]),secondary=r.clients.get(data.plan.actors[1]),offer=await offerFor(r,primary,'action');
    await accept(r,primary,offer);
    const condition={offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,condition:'PRIVATE_CONDITION_CANARY',request_id:randomUUID()};
    assert.equal((await primary.call(roundPath(r)+'/condition',{method:'POST',body:condition})).body.code,'ROUND_ACTOR_REQUIRED');
    await post(secondary,roundPath(r)+'/condition',condition);
    const updated=await offerFor(r,primary,'action');assert.equal(updated.proposal_revision,offer.proposal_revision+1);assert.equal(updated.own_state,'pending');
    assert.equal((await secondary.call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'action',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()}})).body.code,'CONSENT_PROPOSAL_STALE');
    assert.equal((await r.host.call(roundPath(r)+'/condition')).status,404);assert.equal(JSON.stringify(await current(r)).includes('PRIVATE_CONDITION_CANARY'),false);
    assert.equal((await ok(primary,roundPath(r)+'/condition')).condition,'PRIVATE_CONDITION_CANARY');await accept(r,primary,updated);await accept(r,secondary,updated);
    assert.equal((await secondary.call(roundPath(r)+'/condition',{method:'POST',body:{...condition,proposal_revision:updated.proposal_revision,request_id:randomUUID()}})).body.code,'CONDITION_NOT_ALLOWED');
    mark('P03-CONDITION-REVISION',{condition_private:true,old_acks_reset:true,active_condition_immutable:true});
  });
  it('denies private access on clock rollback and exact invitation/action deadline',async()=>{
    const r=await fixture();await privateRound(r);const offer=await offerFor(r,r.actors[0]);tick(1000);await accept(r,r.actors[0],offer);tick(1000);await accept(r,r.actors[1],offer);
    const activated=clock;setClock(activated-1);clock=activated-1;assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    tick(1);assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,200);
    const action=await offerFor(r,r.actors[0],'action');tick(30000);const late=await r.actors[1].call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'action',offer_id:action.offer_id,proposal_revision:action.proposal_revision,request_id:randomUUID()}});
    assert.equal(late.body.code,'CONSENT_TERMINAL');assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    const pending=await fixture();await privateRound(pending);const invitation=await offerFor(pending,pending.actors[0]);tick(30000);
    const pendingLate=await pending.actors[0].call(roundPath(pending)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:invitation.offer_id,proposal_revision:invitation.proposal_revision,request_id:randomUUID()}});assert.equal(pendingLate.body.code,'CONSENT_TERMINAL');
    const active=await fixture();await privateRound(active);await reveal(active);const activeAction=await offerFor(active,active.actors[0],'action');tick(1000);await accept(active,active.actors[0],activeAction);tick(1000);await accept(active,active.actors[1],activeAction);
    tick(-1);const earlyFinish=await active.actors[0].call(roundPath(active)+'/finish',{method:'POST',body:{request_id:randomUUID()}});assert.equal(earlyFinish.body.code,'ACTION_CONSENT_REQUIRED');tick(1);
    await post(active.actors[0],roundPath(active)+'/finish',{request_id:randomUUID()});
    mark('P03-CLOCK-DEADLINE',{invitation_pre_final_ack_denied:true,action_pre_final_ack_denied:true,at_final_ack_allowed:true,exact_invitation_pending_deadline_denied:true,exact_action_pending_deadline_denied:true});
  });
  it('revalidates a prepared private reference after committed revoke before dispatch',async()=>{
    const r=await fixture();await privateRound(r);await reveal(r);const {rooms}=service(),grant=await grantFor(r,r.actors[0],rooms),bundle=await rooms.socketState(grant);
    const references=[];for(const ref of bundle.privateEvents) await rooms.dispatchPrivate(grant,ref.eventId,event=>{if(event.type==='game.private_prompt') references.push(ref);});assert.ok(references.length);
    await post(r.actors[1],roundPath(r)+'/response',{kind:'decline',request_id:randomUUID()});
    const delivered=[];for(const ref of references) await rooms.dispatchPrivate(grant,ref.eventId,event=>delivered.push(event));
    assert.ok(delivered.length);assert.ok(delivered.every(event=>event.type==='game.private_cleared'));assert.equal(JSON.stringify(delivered).includes('card_id'),false);
    mark('P03-DISPATCH-FENCE',{prepared_references:references.length,committed_decline_before_dispatch:true,only_clear_delivered:true});
  });
  it('clears old actor recipients when stop and advance happen before the next WS poll',async()=>{
    const r=await fixture();await privateRound(r);await reveal(r);const {rooms}=service(),grant=await grantFor(r,r.actors[0],rooms),bundle=await rooms.socketState(grant);
    const priorRound=r.roundId,last=bundle.privateEvents.at(-1)?.revision??0;
    await post(r.actors[0],roundPath(r)+'/response',{kind:'skip',request_id:randomUUID()});const view=await advance(r);assert.notEqual(view.current_round.round_id,priorRound);
    const next=await rooms.socketState(grant,false,last),delivered=[];
    for(const ref of next.privateEvents) await rooms.dispatchPrivate(grant,ref.eventId,event=>delivered.push(event));
    assert.ok(delivered.some(event=>event.type==='game.private_cleared'&&event.payload.round_id===priorRound));
    mark('P03-OLD-RECIPIENT-CLEAR',{old_round:priorRound,current_round:view.current_round.round_id,clear_delivered:true});
  });
  it('delivers actual WS private prompt only to selected actors and clears it after decline',async()=>{
    const r=await fixture();await privateRound(r);const hostSocket=await websocket(r,r.host),a=await websocket(r,r.actors[0]),b=await websocket(r,r.actors[1]);
    await reveal(r);await waitFor(()=>a.frames.some(frame=>frame.type==='game.private_prompt')&&b.frames.some(frame=>frame.type==='game.private_prompt'));
    const privateFrame=a.frames.find(frame=>frame.type==='game.private_prompt');assert.equal(privateFrame.target_member_id,r.actorIds[0]);
    const publicText=JSON.stringify(hostSocket.frames);assert.equal(publicText.includes(privateFrame.payload.card_id),false);assert.equal(publicText.includes('game.private_prompt'),false);assert.equal(publicText.includes('consent_requested'),false);
    const generic=hostSocket.frames.filter(frame=>frame.type==='game.snapshot').at(-1).payload.current_round;assert.equal(generic.kind,'generic');assert.deepEqual(Object.keys(generic).sort(),['kind','round_id','round_index','state']);
    await post(r.actors[1],roundPath(r)+'/response',{kind:'decline',request_id:randomUUID()});await waitFor(()=>a.frames.some(frame=>frame.type==='game.private_cleared'&&frame.payload.round_id===r.roundId));
    assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    mark('P03-HTTP-WS-PRIVACY',{two_authenticated_actor_sockets:true,independent_nonactor_host_socket:true,public_generic_only:true,revoke_clears:true});
  });
  it('replays the original finish alias and rejects conflicting payloads',async()=>{
    const r=await fixture('questions',5),data=await roundData(r),actor=r.clients.get(data.plan.primary_member_id),body={request_id:randomUUID()};
    if(data.action) {const offer=await offerFor(r,r.actors[0],'action');await accept(r,r.actors[0],offer);await accept(r,r.actors[1],offer);}
    const first=await post(actor,roundPath(r)+'/finish',body),second=await post(actor,roundPath(r)+'/response',{...body,kind:'finish'});assert.deepEqual(second,first);
    await advance(r);assert.deepEqual(await post(actor,roundPath(r,data.plan.round_id)+'/finish',body),first);
    const response=await actor.call(roundPath(r,data.plan.round_id)+'/response',{method:'POST',body:{kind:'finish',request_id:body.request_id,offer_id:randomUUID()}});
    assert.equal(response.body.code,'IDEMPOTENCY_CONFLICT');
    const next=await roundData(r),nextActor=r.clients.get(next.plan.primary_member_id),nextId=randomUUID();
    if(next.action) {const offer=await offerFor(r,r.actors[0],'action');await accept(r,r.actors[0],offer);await accept(r,r.actors[1],offer);}
    const fromResponse=await post(nextActor,roundPath(r)+'/response',{kind:'finish',request_id:nextId});assert.deepEqual(await post(nextActor,roundPath(r)+'/finish',{request_id:nextId}),fromResponse);
    mark('P03-FINISH-REPLAY',{same_key_replay_after_advance:true,both_alias_directions:true,cross_alias_changed_body_rejected:true});
  });
  it('retains exact old pack/snapshot across restart, refreshed pack, locale and spectator',async()=>{
    const r=await fixture(),before=(await pool.query('SELECT snapshot_cipher,pack_digest FROM game_sessions WHERE id=$1',[r.gameId])).rows[0],beforeGame=await current(r);
    await runtime.restart({P03_PACK_REVISION:'2'});
    assert.deepEqual((await pool.query('SELECT snapshot_cipher,pack_digest FROM game_sessions WHERE id=$1',[r.gameId])).rows[0],before);
    const view=await roomSnapshot(r);await ok(r.actors[0],base(r)+'/me','PATCH',{locale:'tr',expected_rev:view.room_rev,idempotency_key:randomUUID()});
    const spectator=await client(runtime.origin);await post(spectator,base(r)+'/join',{invite_token:r.invite,locale:'en',display_name:'spectator',idempotency_key:randomUUID(),entry_acceptance:spectator.acceptance});
    assert.deepEqual((await pool.query('SELECT snapshot_cipher,pack_digest FROM game_sessions WHERE id=$1',[r.gameId])).rows[0],before);
    assert.equal((await current(r)).session_id,beforeGame.session_id);assert.equal((await current(r)).current_round.card_revision,1);
    await runtime.restart({P03_PACK_REVISION:'1'});mark('P03-PINNING-RESTART',{old_pack:before.pack_digest,new_provider_revision:2,snapshot_unchanged:true,locale_and_spectator_unchanged:true});
  });
  it('fails closed on unknown persisted policy/pack and an empty safe pool without weakening X veto',async()=>{
    const r=await fixture('questions',5),before=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher;
    const snapshot=keys.decrypt(before,`game-snapshot:${r.roomId}:${r.gameId}:1`);
    for(const changed of [{...snapshot,policy_revision:'RE-UNKNOWN'},{...snapshot,pack_digest:'sha256:'+'0'.repeat(64)}]) {
      try {await pool.query('UPDATE game_sessions SET snapshot_cipher=$2 WHERE id=$1',[r.gameId,keys.encrypt(changed,`game-snapshot:${r.roomId}:${r.gameId}:1`)]);assert.equal((await r.host.call(gameBase(r)+'/current')).status,503);}
      finally {await pool.query('UPDATE game_sessions SET snapshot_cipher=$2 WHERE id=$1',[r.gameId,before]);}
    }
    await runtime.restart({P03_PACK_DISABLED:'1'});assert.equal((await r.host.call(gameBase(r)+'/current')).status,200);
    const unavailable=await fixture(null),view=await roomSnapshot(unavailable);
    assert.equal((await unavailable.host.call(gameBase(unavailable)+'/prepare',{method:'POST',body:{mode:'questions',players:unavailable.actorIds,round_count:5,expected_rev:view.room_rev,idempotency_key:randomUUID()}})).body.code,'PACK_UNAVAILABLE');
    await runtime.restart({P03_PACK_DISABLED:'0'});
    const impossible=await fixture(null),prefs=await ok(impossible.actors[0],base(impossible)+'/me/preferences');
    await ok(impossible.actors[0],base(impossible)+'/me/preferences','PUT',{comfort:4,edges:{[impossible.actorIds[1]]:'not_a_friend'},expected_rev:prefs.rev,idempotency_key:randomUUID()});
    const draft=await prepare(impossible,'yes_but',5),failure=await impossible.host.call(gameBase(impossible)+'/start',{method:'POST',body:{draft_rev:draft.game_rev,idempotency_key:randomUUID()}});
    assert.equal(failure.status,422);assert.equal(failure.body.code,'SAFE_POOL_EXHAUSTED');assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_rounds WHERE session_id=$1',[impossible.gameId])).rows[0].n,0);
    mark('P03-VERSION-REFUSAL',{unknown_policy_rejected:true,unknown_snapshot_pack_rejected:true,pinned_pack_retained_without_current_provider:true,new_game_without_provider_rejected:true,empty_safe_pool_no_round:true,x_veto_preserved:true});
  });
  it('enforces actual SQL actor scope, exactly two consent actors and one running game',async()=>{
    const r=await fixture('yes_but',5),data=await roundData(r);assert.ok(data.action);
    await assert.rejects(pool.query('DELETE FROM game_consent_actors WHERE offer_id=$1 AND member_id=$2',[data.action.offer_id,r.actorIds[0]]),error=>error.code==='23514');
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_consent_actors WHERE offer_id=$1',[data.action.offer_id])).rows[0].n,2);
    const c=await pool.connect();try {
      await c.query('BEGIN');const id=randomUUID();await c.query("INSERT INTO game_rounds(id,room_id,session_id,round_index,state,cipher,created_at) VALUES($1,$2,$3,99,'pending','{}',now())",[id,r.roomId,r.gameId]);
      await assert.rejects(c.query("INSERT INTO game_round_actors VALUES($1,$2,$3,$4,'primary')",[r.roomId,r.gameId,id,r.hostId]),error=>error.code==='23503');
    } finally {await c.query('ROLLBACK');c.release();}
    await assert.rejects(pool.query("INSERT INTO game_sessions(id,room_id,state,mode,round_count,draft_cipher,created_at,updated_at) VALUES($1,$2,'waiting','questions',5,'{}',now(),now())",[randomUUID(),r.roomId]),error=>error.code==='23505');
    mark('P03-SQL-SCOPE',{consent_exactly_two:true,nonparticipant_actor_fk_denied:true,one_running_game:true});
  });
  it('makes decline terminal in both serial orders and concurrent HTTP races',async()=>{
    const results=[];
    for(const order of ['accept_then_decline','decline_then_accept','concurrent']) {
      const r=await fixture();await privateRound(r);const offer=await offerFor(r,r.actors[0]);await accept(r,r.actors[0],offer);
      const acceptRequest=()=>r.actors[1].call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()}});
      const declineRequest=()=>r.actors[1].call(roundPath(r)+'/response',{method:'POST',body:{kind:'decline',request_id:randomUUID()}});
      let responses;
      if(order==='concurrent') responses=await Promise.all([acceptRequest(),declineRequest()]);
      else if(order==='accept_then_decline') responses=[await acceptRequest(),await declineRequest()];
      else responses=[await declineRequest(),await acceptRequest()];
      assert.ok(responses.every(response=>response.status===200||response.status===409));
      assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
      const data=await roundData(r);assert.ok(['declined','stopped'].includes(data.invitation.state));assert.deepEqual(data.invitation.acks,[]);assert.ok(['skipped','stopped'].includes(data.state));
      results.push({order,statuses:responses.map(response=>response.status),state:data.invitation.state});
    }
    mark('P03-DECLINE-RACES',{cases:results});
  });
  it('transport pause/reconnect preserves snapshot and never revives consent or safety pause',async()=>{
    const r=await fixture();await privateRound(r);await reveal(r);const before=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher;
    const socket=await websocket(r,r.actors[0]),oldRound=r.roundId;socket.ws.terminate();
    await waitFor(async()=>{const row=(await pool.query('SELECT state,pause_reason FROM game_sessions WHERE id=$1',[r.gameId])).rows[0];return row.state==='paused'&&row.pause_reason==='transport';});
    assert.notEqual((await r.actors[1].call(roundPath(r)+'/private')).status,200);
    const resumed=await websocket(r,r.actors[0]);assert.equal((await current(r)).state,'active');assert.equal((await r.actors[0].call(roundPath(r)+'/private')).status,404);
    assert.deepEqual((await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher,before);
    await post(r.actors[0],gameBase(r)+`/${r.gameId}/pause`,{expected_rev:0,idempotency_key:randomUUID()});resumed.ws.terminate();
    await websocket(r,r.actors[0]);const safety=await current(r);assert.equal(safety.state,'paused');assert.equal(safety.pause_reason,'safety');
    await post(r.host,gameBase(r)+`/${r.gameId}/resume`,{expected_rev:safety.game_rev,idempotency_key:randomUUID()});
    assert.equal((await r.actors[0].call(roundPath(r,oldRound)+'/private')).status,404);
    mark('P03-TRANSPORT-RESUME',{same_identity:true,snapshot_unchanged:true,old_consent_not_revived:true,safety_requires_host_resume:true});
  });
  it('stop, leave and room close revoke HTTP/WS and room close deletes private engine rows',async()=>{
    const outcomes=[];
    for(const operation of ['stop','leave','close']) {
      const r=await fixture('yes_but');await privateRound(r);await reveal(r);const data=await roundData(r),secondary=r.clients.get(data.plan.actors[1]),offer=await offerFor(r,secondary,'action');
      await post(secondary,roundPath(r)+'/condition',{condition:'EPHEMERAL_CONDITION_'+operation,offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()});
      const actorSocket=await websocket(r,r.actors[0]);await waitFor(()=>actorSocket.frames.some(frame=>frame.type==='game.private_prompt'));
      if(operation==='stop') await post(r.actors[0],gameBase(r)+`/${r.gameId}/stop`,{request_id:randomUUID()});
      else if(operation==='leave') await post(r.actors[0],base(r)+'/leave',{expected_rev:0,idempotency_key:randomUUID()});
      else {const view=await roomSnapshot(r);await post(r.host,base(r)+'/close',{expected_rev:view.room_rev,idempotency_key:randomUUID()});}
      assert.notEqual((await r.actors[0].call(roundPath(r)+'/private')).status,200);assert.notEqual((await r.actors[1].call(roundPath(r)+'/private')).status,200);
      if(operation==='stop') {await waitFor(()=>actorSocket.frames.some(frame=>frame.type==='game.private_cleared'));const closed=await roundData(r);assert.equal(closed.condition,null);assert.deepEqual(closed.invitation.acks,[]);assert.deepEqual(closed.action.acks,[]);}
      else await waitFor(()=>actorSocket.ws.readyState===WebSocket.CLOSED);
      if(operation==='leave') assert.equal((await pool.query('SELECT count(*)::int AS n FROM private_preferences WHERE room_id=$1 AND owner_member_id=$2',[r.roomId,r.actorIds[0]])).rows[0].n,0);
      if(operation==='close') for(const table of ['game_sessions','game_rounds','game_participants','game_round_actors','game_consent_actors','game_outbox_refs','game_private_streams']) assert.equal((await pool.query(`SELECT count(*)::int AS n FROM ${table} WHERE room_id=$1`,[r.roomId])).rows[0].n,0,table);
      outcomes.push({operation,http_denied:true,ws_cleared_or_closed:true,...(operation==='close'?{private_engine_rows_deleted:true}:{})});
    }
    const disabled=await fixture();
    try {await runtime.restart({P02_OFFER_DISABLED:'1'});const view=await roomSnapshot(disabled);await post(disabled.host,base(disabled)+'/close',{expected_rev:view.room_rev,idempotency_key:randomUUID()});assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_sessions WHERE room_id=$1',[disabled.roomId])).rows[0].n,0);}
    finally {await runtime.restart({P02_OFFER_DISABLED:'0'});}
    mark('P03-STOP-LEAVE-CLOSE',{cases:outcomes,room_close_private_wipe:true,host_close_available_without_current_offer:true});
  });
  it('does not substitute a new same-name identity for a departed pinned actor',async()=>{
    const r=await fixture();await privateRound(r);await reveal(r);const offer=await offerFor(r,r.actors[0]),oldCookies=r.actors[0].cookies,oldId=r.actorIds[0];
    const before=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher;
    await post(r.actors[0],base(r)+'/leave',{expected_rev:0,idempotency_key:randomUUID()});
    const newcomer=await client(runtime.origin),joined=await post(newcomer,base(r)+'/join',{invite_token:r.invite,locale:'en',display_name:'actor-A',idempotency_key:randomUUID(),entry_acceptance:newcomer.acceptance});
    assert.notEqual(joined.me.id,oldId);assert.equal(joined.me.display_name,'actor-A');
    assert.equal((await request(runtime.origin,roundPath(r)+'/private',{headers:{origin:runtime.origin,cookie:oldCookies}})).status,401);
    assert.equal((await newcomer.call(roundPath(r)+'/private')).status,404);
    const forged=await newcomer.call(roundPath(r)+'/response',{method:'POST',body:{kind:'accept',scope:'invitation',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()}});assert.equal(forged.body.code,'ROUND_ACTOR_REQUIRED');
    const socket=await websocket(r,newcomer);await waitFor(()=>socket.frames.some(frame=>frame.type==='game.snapshot'));
    assert.equal(socket.frames.some(frame=>frame.type==='game.private_prompt'||frame.type==='game.consent_requested'||frame.type==='game.pair_condition'),false);
    assert.deepEqual((await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher,before);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_participants WHERE session_id=$1 AND member_id=$2',[r.gameId,joined.me.id])).rows[0].n,0);
    mark('P03-IDENTITY-NO-SUBSTITUTION',{same_name:true,new_uuid:true,old_cookie_revoked:true,new_actor_http_denied:true,no_private_ws:true,snapshot_unchanged:true});
  });
  it('restores exact encrypted engine scope but reapplies ledger and expiry before access',async()=>{
    const open=await fixture('yes_but'),closed=await fixture();await privateRound(open);await reveal(open);
    const data=await roundData(open),secondary=open.clients.get(data.plan.actors[1]),offer=await offerFor(open,secondary,'action');
    await post(secondary,roundPath(open)+'/condition',{condition:'RESTORE_PRIVATE_CONDITION_CANARY',offer_id:offer.offer_id,proposal_revision:offer.proposal_revision,request_id:randomUUID()});
    const snapshot=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[open.gameId])).rows[0].snapshot_cipher;
    const beforeMembers=(await pool.query('SELECT id,role FROM room_members WHERE room_id=$1 ORDER BY id',[open.roomId])).rows;
    const beforePreferences=(await pool.query('SELECT owner_member_id,cipher,rev FROM private_preferences WHERE room_id=$1 ORDER BY owner_member_id',[open.roomId])).rows;
    const dump=execFileSync('docker',['exec',process.env.P02_DB_CONTAINER,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl'],{maxBuffer:128*1024*1024});
    const envelope=sealBackup(dump,keys,clock);assert.equal(openBackup(envelope,keys,clock).equals(dump),true);assert.throws(()=>openBackup(envelope,keys,clock+7*86400000));
    const view=await roomSnapshot(closed);await post(closed.host,base(closed)+'/close',{expected_rev:view.room_rev,idempotency_key:randomUUID()});
    for(const ws of sockets) ws.terminate();sockets.clear();await runtime.pause();await pool.end();tick(180001);
    execFileSync('docker',['exec','-i',process.env.P02_DB_CONTAINER,'pg_restore','-U','venus','-d','venus','--clean','--if-exists','--no-owner','--no-acl','--single-transaction'],{input:openBackup(envelope,keys,clock),maxBuffer:128*1024*1024});
    pool=new pg.Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),max:12});await runtime.resume();
    assert.deepEqual((await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[open.gameId])).rows[0].snapshot_cipher,snapshot);
    assert.deepEqual((await pool.query('SELECT id,role FROM room_members WHERE room_id=$1 ORDER BY id',[open.roomId])).rows,beforeMembers);
    assert.deepEqual((await pool.query('SELECT owner_member_id,cipher,rev FROM private_preferences WHERE room_id=$1 ORDER BY owner_member_id',[open.roomId])).rows,beforePreferences);
    assert.equal((await pool.query('SELECT state FROM rooms WHERE id=$1',[closed.roomId])).rows[0].state,'closed');
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_sessions WHERE room_id=$1',[closed.roomId])).rows[0].n,0);
    assert.notEqual((await closed.host.call(gameBase(closed)+'/current')).status,200);
    await websocket(open,open.actors[0]);await websocket(open,open.actors[1]);
    assert.equal((await open.actors[0].call(roundPath(open)+'/private')).status,404);assert.equal((await open.actors[0].call(roundPath(open)+'/condition')).status,404);
    const restored=await roundData(open);assert.equal(restored.condition,null);assert.deepEqual(restored.invitation.acks,[]);assert.deepEqual(restored.action.acks,[]);
    mark('P03-BACKUP-RESTORE',{encrypted_roundtrip:true,seven_day_expiry:true,exact_snapshot_identity_preferences_preserved:true,external_closed_ledger_reapplied:true,expired_scopes_revoked_before_access:true,private_condition_erased:true});
  });
  it('quiesces with API stopped, runs accepted P02 OCI against upgraded DB and returns without reviving consent',async()=>{
    const r=await fixture(),q=await fixture(),old=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0];
    const oldSnapshot=keys.decrypt(old.snapshot_cipher,`game-snapshot:${r.roomId}:${r.gameId}:1`),identities=(await pool.query('SELECT room_id,id,role FROM room_members WHERE room_id=$1 ORDER BY id',[r.roomId])).rows;
    const prefs=(await pool.query('SELECT owner_member_id,cipher FROM private_preferences WHERE room_id=$1 ORDER BY owner_member_id',[r.roomId])).rows;
    assert.match(process.env.P03_PROJECT,/^venus-p03-[a-f0-9]{12}$/);
    const container=process.env.P03_PROJECT+'-rollback',ledgerVolume=container+'-ledger',diagnostics=[],cleanupErrors=[];
    const docker=args=>execFileSync('docker',args,{encoding:'utf8',maxBuffer:4*1024*1024,stdio:['pipe','pipe','pipe']});
    const privateValues=[readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),...Object.values(JSON.parse(readFileSync(process.env.KEYRING_FILE,'utf8')).keys),...[r,q].flatMap(room=>[...room.clients.values()].flatMap(c=>[...c.jar.values(),keys.sign('csrf:'+sessionToken(c))]))].filter(Boolean);
    const sanitize=value=>privateValues.reduce((text,secret)=>text.split(secret).join('[REDACTED]'),String(value));
    let phase='production',volumeCreated=false,primaryError;
    function inspectOld() {return spawnSync('docker',['inspect',container],{encoding:'utf8',maxBuffer:4*1024*1024});}
    function collect(phaseName) {
      const path=`.artifacts/p03/rollback-${process.env.P03_PROJECT}-${phaseName}.txt`,inspected=inspectOld(),logs=spawnSync('docker',['logs',container],{encoding:'utf8',maxBuffer:4*1024*1024});
      let state={inspect_status:inspected.status,inspect_error:inspected.stderr};
      if(inspected.status===0) {const row=JSON.parse(inspected.stdout)[0];state={image:row.Image,user:row.Config.User,supplementary_groups:row.HostConfig.GroupAdd,state:row.State,mounts:row.Mounts.map(m=>({type:m.Type,destination:m.Destination,rw:m.RW}))};}
      writeFileSync(path,sanitize(JSON.stringify({phase:phaseName,...state},null,2)+'\n--- captured stdout/stderr ---\n'+logs.stdout+'\n'+logs.stderr));diagnostics.push(path);
    }
    function stopRemove(phaseName) {
      const before=inspectOld();if(before.status!==0) {if(/No such (?:object|container)/i.test(before.stderr)) return;throw new Error('Rollback inspect failed: '+sanitize(before.stderr));}
      collect(phaseName+'-before-stop');
      if(JSON.parse(before.stdout)[0].State.Running) {
        const stopped=spawnSync('docker',['stop','--timeout','10',container],{encoding:'utf8'});
        if(stopped.status!==0&&!/No such (?:object|container)/i.test(stopped.stderr)) throw new Error('Rollback stop failed: '+sanitize(stopped.stderr));
      }
      collect(phaseName+'-after-stop');
      const removed=spawnSync('docker',['rm','--volumes',container],{encoding:'utf8'});
      if(removed.status!==0&&!/No such (?:object|container)/i.test(removed.stderr)) throw new Error('Rollback remove failed: '+sanitize(removed.stderr));
    }
    await runtime.pause();
    try {
      await service().games.quiesce();assert.equal((await pool.query("SELECT count(*)::int AS n FROM game_sessions WHERE state IN ('waiting','active','paused')")).rows[0].n,0);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_rounds WHERE session_id=ANY($1::uuid[])',[[r.gameId,q.gameId]])).rows[0].n,0);
      // Real Linux permissions even on Docker Desktop: the host-owned 0600 file stays private.
      // This isolated metadata volume deliberately has an owner different from image UID1000.
      docker(['volume','create','--label','venus.test-project='+process.env.P03_PROJECT,ledgerVolume]);volumeCreated=true;
      const initialize=`import fs from 'node:fs';fs.chownSync('/var/lib/venus',1000,1000);fs.chmodSync('/var/lib/venus',0o750);const path='/var/lib/venus/deletions.jsonl';fs.writeFileSync(path,${JSON.stringify(readFileSync(process.env.DELETION_LEDGER_FILE,'utf8'))});fs.chownSync(path,12345,12346);fs.chmodSync(path,0o660);const s=fs.statSync(path);console.log(JSON.stringify({uid:s.uid,gid:s.gid,mode:s.mode&0o777}));`;
      const permissions=JSON.parse(execFileSync('docker',['run','-i','--rm','--network','none','--user','0:0','--mount',`type=volume,src=${ledgerVolume},dst=/var/lib/venus`,process.env.P03_PREVIOUS_IMAGE,'node','--input-type=module','-'],{input:initialize,encoding:'utf8',stdio:['pipe','pipe','pipe']}));
      assert.deepEqual(permissions,{uid:12345,gid:12346,mode:0o660});
      const runArgs=['run','--detach','--name',container,'--group-add','12346','--network','container:'+process.env.P02_DB_CONTAINER,'--mount',`type=bind,src=${process.env.DB_PASSWORD_FILE},dst=/run/secrets/db_password,readonly`,'--mount',`type=bind,src=${process.env.KEYRING_FILE},dst=/run/secrets/keyring,readonly`,'--mount',`type=volume,src=${ledgerVolume},dst=/var/lib/venus`,'--env','DB_HOST=127.0.0.1','--env','DB_PASSWORD_FILE=/run/secrets/db_password','--env','KEYRING_FILE=/run/secrets/keyring','--env','DELETION_LEDGER_FILE=/var/lib/venus/deletions.jsonl','--env','APP_ORIGIN='+runtime.origin,'--env','P03_ROLLBACK_CLOCK='+clock,process.env.P03_PREVIOUS_IMAGE];
      docker(runArgs);
      const fetchOld=(path,options={})=>{
        const script=`try{const r=await fetch(${JSON.stringify('http://127.0.0.1:4300'+path)},${JSON.stringify(options)});console.log(JSON.stringify({status:r.status,body:await r.json()}));}catch{console.error('Previous image request unavailable');process.exitCode=1;}`;
        return JSON.parse(execFileSync('docker',['exec','-i',container,'node','--input-type=module','-'],{input:script,encoding:'utf8',stdio:['pipe','pipe','pipe']}));
      };
      const waitOld=async()=>{let ready=false;for(let index=0;index<50;index++) {const inspected=inspectOld();if(inspected.status===0&&!JSON.parse(inspected.stdout)[0].State.Running) {collect(phase+'-startup-exit');throw new Error('Rollback '+phase+' exited before readiness; see sanitized rollback diagnostic.');}try {if(fetchOld('/health/ready').status===200) {ready=true;break;}} catch { /* The previous image may still be starting. */ }await new Promise(resolve=>setTimeout(resolve,100));}if(!ready) collect(phase+'-readiness-timeout');assert.equal(ready,true);};
      await waitOld();
      assert.equal(fetchOld('/api/v1/version').body.source_revision,process.env.P03_PREVIOUS_SOURCE);
      assert.equal(fetchOld(base(r),{headers:{cookie:r.host.cookies}}).status,200);
      assert.equal(fetchOld(gameBase(r)+'/current',{headers:{cookie:r.host.cookies}}).status,404);
      assert.deepEqual((await pool.query('SELECT room_id,id,role FROM room_members WHERE room_id=$1 ORDER BY id',[r.roomId])).rows,identities);
      assert.deepEqual((await pool.query('SELECT owner_member_id,cipher FROM private_preferences WHERE room_id=$1 ORDER BY owner_member_id',[r.roomId])).rows,prefs);
      const oldPost=(c,path,body)=>fetchOld(path,{method:'POST',headers:{cookie:c.cookies,origin:runtime.origin,'content-type':'application/json','x-csrf-token':keys.sign('csrf:'+sessionToken(c))},body:JSON.stringify(body)});
      assert.equal(oldPost(q.actors[0],base(q)+'/leave',{expected_rev:0,idempotency_key:randomUUID()}).status,200);
      const qView=fetchOld(base(q),{headers:{cookie:q.host.cookies}});assert.equal(qView.status,200);
      const defaultClose=oldPost(q.host,base(q)+'/close',{expected_rev:qView.body.room_rev,idempotency_key:randomUUID()});assert.equal(defaultClose.status,503);assert.equal(defaultClose.body.code,'ENTRY_POLICY_UNAVAILABLE');
      assert.equal(fetchOld('/api/v1/entry-policy').body.available,false);
      stopRemove('production');phase='synthetic';
      // Exact accepted image/modules; only this explicit synthetic bootstrap injects a test offer.
      // The production entry point above remains fail-closed and receives no fabricated approval.
      const bootstrap=`import {createApp} from '/app/apps/api/dist/app.js';import {database} from '/app/apps/api/dist/database.js';import {Rooms} from '/app/apps/api/dist/rooms.js';import {Keyring,DeletionLedger,hash} from '/app/apps/api/dist/security.js';import {migrate,schemaProbe,schemaGeneration} from '/app/apps/api/dist/migrations.js';import {readFileSync} from 'node:fs';const db=database();await migrate(db.pool);const text={ru:'СИНТЕТИЧЕСКИЙ ТЕСТ. Не оферта.',en:'SYNTHETIC TEST. Not a public offer.',tr:'SENTETİK TEST. Kamuya açık teklif değildir.'};const offer={version:'synthetic-p02-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};const rooms=new Rooms({pool:db.pool,keys:Keyring.fromFile(process.env.KEYRING_FILE),ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:process.env.APP_ORIGIN,now:()=>Number(process.env.P03_ROLLBACK_CLOCK),offer:()=>offer});await rooms.maintain();const metadata=JSON.parse(readFileSync('/app/build-metadata.json','utf8'));const app=await createApp({rooms,probe:()=>schemaProbe(db.pool),schemaGeneration,logger:false,version:{service:'venus',version:metadata.version,source_revision:metadata.source_revision,image_digest:'unreleased',contract_revision:'P00-2'}});process.once('SIGTERM',()=>{void app.close().then(()=>db.close());});await app.listen({host:'0.0.0.0',port:4300});`;
      docker([...runArgs,'node','--input-type=module','-e',bootstrap]);await waitOld();
      assert.equal(fetchOld('/api/v1/version').body.source_revision,process.env.P03_PREVIOUS_SOURCE);
      const enabledView=fetchOld(base(q),{headers:{cookie:q.host.cookies}});assert.equal(enabledView.status,200);
      assert.equal(oldPost(q.host,base(q)+'/close',{expected_rev:enabledView.body.room_rev,idempotency_key:randomUUID()}).status,200);
      collect('synthetic-after-close');
    } catch(error) {primaryError=error;try {collect(phase+'-failure');} catch(diagnosticError) {cleanupErrors.push('Diagnostic: '+sanitize(diagnosticError.message));}}
    finally {
      try {stopRemove(phase);} catch(error) {cleanupErrors.push('Container cleanup: '+sanitize(error.message));}
      if(volumeCreated) {
        try {
          const restoredLedger=docker(['run','--rm','--network','none','--user','1000:1000','--group-add','12346','--mount',`type=volume,src=${ledgerVolume},dst=/var/lib/venus`,process.env.P03_PREVIOUS_IMAGE,'node','--input-type=module','-e',"import fs from 'node:fs';process.stdout.write(fs.readFileSync('/var/lib/venus/deletions.jsonl','utf8'));"]);
          writeFileSync(process.env.DELETION_LEDGER_FILE,restoredLedger);
        } catch(error) {cleanupErrors.push('Ledger synchronization: '+sanitize(error.message));}
        try {docker(['volume','rm',ledgerVolume]);} catch(error) {cleanupErrors.push('Volume cleanup: '+sanitize(error.message));}
      }
      try {await runtime.resume();} catch(error) {cleanupErrors.push('Runtime resume: '+sanitize(error.message));}
    }
    if(primaryError) {if(cleanupErrors.length) console.error(JSON.stringify({event:'rollback_cleanup_secondary_failure',errors:cleanupErrors}));throw primaryError;}
    assert.deepEqual(cleanupErrors,[],'Rollback cleanup must complete');
    assert.equal((await current(r)).state,'aborted');assert.equal((await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].snapshot_cipher,null);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM game_sessions WHERE room_id=$1',[q.roomId])).rows[0].n,0);
    for(const actor of r.actors) await websocket(r,actor);
    await start(r,'questions',5);const fresh=(await pool.query('SELECT snapshot_cipher FROM game_sessions WHERE id=$1',[r.gameId])).rows[0];const next=keys.decrypt(fresh.snapshot_cipher,`game-snapshot:${r.roomId}:${r.gameId}:1`);
    assert.notEqual(next.session_id,oldSnapshot.session_id);assert.notEqual(next.seed,oldSnapshot.seed);
    mark('P03-ROLLBACK',{previous_source:process.env.P03_PREVIOUS_SOURCE,previous_image:process.env.P03_PREVIOUS_IMAGE,api_stopped_before_quiesce:true,core_identities_preferences_unchanged:true,old_room_leave_close_work:true,old_close_requires_synthetic_offer:true,old_default_close_status:503,old_default_close_code:'ENTRY_POLICY_UNAVAILABLE',compatibility_bootstrap:'Exact accepted P02 image/modules, explicitly synthetic offer adapter; no production approval',linux_ledger_permissions:{owner_uid:12345,owner_gid:12346,mode:'0660',runtime_uid:1000,supplementary_gid:12346},rollback_diagnostics:diagnostics,private_volume_cleaned:true,closed_engine_rows_purged:true,old_consent_not_revived:true,new_session_seed:true});
  });
});
