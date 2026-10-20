/** Actual PostgreSQL and filesystem regression. Calls production services directly;
 * this is not an HTTP/browser or approved-content proof. */
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,unlinkSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import pg from 'pg';
import http from 'node:http';
import {createApp} from '../../apps/api/dist/app.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {Catalog} from '../../apps/api/dist/catalog.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {migrate} from '../../apps/api/dist/migrations.js';
import {migrateGames} from '../../apps/api/dist/game-migrations.js';
import {migrateChat} from '../../apps/api/dist/chat-migrations.js';
import {migrateCatalog} from '../../apps/api/dist/catalog-migrations.js';
import {RevocationLedger,emptyLedgerHead} from '../../packages/card-catalog/dist/index.js';
import {FrozenPack,digest,policyDigest} from '../../packages/relationship-engine/dist/index.js';
import {syntheticManifest} from '../p03/fixtures.mjs';
import {p05Cards} from '../p05/fixtures.mjs';

const output=process.env.P05_ARTIFACT_DIRECTORY??'.artifacts/p05-catalog';
const report={synthetic_fixture_only:true,production_approval:false,transport:'real PostgreSQL/filesystem; direct production service calls and one real internal HTTP replay case, no TLS/browser proof',records:[],status:'FAIL'};
let pool,directory,rooms,games,catalog,ledger,ledgerFile,packs;
async function record(id,action){try{const detail=await action();report.records.push({id,status:'PASS',detail});}catch(error){report.records.push({id,status:'FAIL',error:error.message});throw error;}}
async function activate(pack=packs[0]){const generation=(await pool.query('SELECT generation FROM venus_catalog_state')).rows[0].generation;return catalog.activate(pack.digest,generation,'SYNTHETIC-P05-OPERATOR');}
async function fixture(rounds=1){
  const offer=rooms.options.offer(),acceptance={offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true};
  const host=await rooms.create({meeting_context:'in_person',locale:'en',name:'SYNTHETIC CATALOG HOST',idempotency_key:randomUUID(),entry_acceptance:acceptance},randomUUID());
  const room=host.body.room_id,invite=new URL(host.body.invite_url).hash.slice('#invite='.length);
  const guest=await rooms.join(room,{invite_token:invite,locale:'tr',display_name:'SYNTHETIC CATALOG GUEST',idempotency_key:randomUUID(),entry_acceptance:acceptance},randomUUID());
  const actors=[host,guest],grants=[];
  for(const actor of actors){
    const own=await rooms.preferences(room,actor.session);
    await rooms.mutate(room,actor.session,'preferences',{comfort:0,edges:{},expected_rev:own.rev,idempotency_key:randomUUID()},randomUUID());
    const ticket=await rooms.newTicket(room,actor.session);grants.push(await rooms.connect(room,actor.session,ticket.ticket));
  }
  const roomRev=(await pool.query('SELECT rev FROM rooms WHERE id=$1',[room])).rows[0].rev;
  const draft=await games.prepare(room,host.session,{mode:'questions',round_count:rounds,players:actors.map(actor=>actor.memberId),expected_rev:Number(roomRev),idempotency_key:randomUUID()},randomUUID());
  await games.start(room,host.session,{draft_rev:draft.game_rev,idempotency_key:randomUUID()},randomUUID());
  return {room,host,guest,grants,game:draft.session_id,view:await games.getCurrent(room,host.session)};
}
async function state(f){return (await pool.query('SELECT state,snapshot_cipher FROM game_sessions WHERE id=$1',[f.game])).rows[0];}
async function stop(f){const request_id=randomUUID();return games.stop(f.room,f.guest.session,f.game,{request_id},request_id);}
async function latestRoom(f){return (await pool.query('SELECT payload FROM outbox_events WHERE room_id=$1 ORDER BY seq DESC LIMIT 1',[f.room])).rows[0].payload;}
async function unavailable(f){assert.equal((await latestRoom(f)).features.games,'unavailable');}
async function breakLedger(kind,operation){
  const original=readFileSync(ledgerFile);
  if(kind==='missing')unlinkSync(ledgerFile);else writeFileSync(ledgerFile,kind==='utf8'?Buffer.from([0xff]):'{partial');
  try{return await operation();}finally{writeFileSync(ledgerFile,original,{mode:0o600});}
}
before(async()=>{
  assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1','Owned isolated Docker required');
  directory=mkdtempSync(join(tmpdir(),'venus-p05-catalog-'));mkdirSync(output,{recursive:true});
  const keyFile=join(directory,'keys.json'),deletionFile=join(directory,'deletions.jsonl');ledgerFile=join(directory,'withdrawals.jsonl');
  writeFileSync(keyFile,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}),{mode:0o600});writeFileSync(deletionFile,'',{mode:0o600});
  ledger=RevocationLedger.provision(ledgerFile);
  pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),max:8});
  await migrate(pool);await migrateGames(pool);await migrateChat(pool);await migrateCatalog(pool);
  packs=[1,2].map(revision=>{const cards=p05Cards().map(card=>({...card,revision}));return FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);});
  const general=p05Cards().filter(card=>card.interaction==='group');packs.push(FrozenPack.load(general,syntheticManifest(general,digest,policyDigest),true));
  const text={ru:'SYNTHETIC P05, 18+.',en:'SYNTHETIC P05, 18+.',tr:'SYNTHETIC P05, 18+.'},offer={version:'synthetic-catalog-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
  rooms=new Rooms({pool,keys:Keyring.fromFile(keyFile),ledger:new DeletionLedger(deletionFile),origin:'https://synthetic-p05.invalid',offer:()=>offer});
  games=new Games(rooms,()=>null,true,true,true);rooms.attachGames(games);catalog=new Catalog(rooms,games,ledger,packs,true);games.attachCatalog(catalog);await activate();
});
after(async()=>{
  if(pool)await pool.end();
  if(directory){assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(directory.startsWith(join(tmpdir(),'venus-p05-catalog-')));rmSync(directory,{recursive:true,force:true});}
  report.status=report.records.length===8&&report.records.every(row=>row.status==='PASS')?'PASS':'FAIL';
  mkdirSync(output,{recursive:true});writeFileSync(join(output,'catalog-integration.json'),JSON.stringify(report,null,2));
});
for(const kind of ['missing','utf8','partial'])test(`B05-003 actual ${kind} ledger cannot roll back emergency stop`,async()=>record('B05-003-STOP-'+kind,async()=>{
  const f=await fixture();await breakLedger(kind,async()=>{
    const receipt=await stop(f);assert.ok(receipt.rev>0);assert.equal((await state(f)).state,'aborted');await unavailable(f);
    await assert.rejects(rooms.transaction(c=>catalog.active(c)),error=>error.code==='CATALOG_LEDGER_UNAVAILABLE');
  });return {real_pg_committed_stop:true,room_emit_committed:true,catalog_new_start_fail_closed:true};
}));
test('B05-003 unreadable ledger cannot roll back neutral setup withdrawal',async()=>record('B05-003-NEUTRAL',async()=>{
  const f=await fixture(),before=(await state(f)).snapshot_cipher;
  await breakLedger('missing',async()=>{
    const own=await rooms.preferences(f.room,f.guest.session);
    await rooms.mutate(f.room,f.guest.session,'skip',{expected_rev:own.rev,idempotency_key:randomUUID()},randomUUID());
    const row=await state(f);assert.equal(row.state,'aborted');assert.deepEqual(row.snapshot_cipher,before);await unavailable(f);
    assert.equal((await rooms.preferences(f.room,f.guest.session)).comfort,0);
  });return {real_pg_aborted:true,snapshot_unchanged:true,preferences_neutral:true};
}));
test('B05-003 unreadable ledger cannot roll back member leave and socket revocation',async()=>record('B05-003-LEAVE',async()=>{
  const f=await fixture();await breakLedger('utf8',async()=>{
    const rev=(await pool.query('SELECT rev FROM rooms WHERE id=$1',[f.room])).rows[0].rev;
    await rooms.mutate(f.room,f.guest.session,'leave',{expected_rev:Number(rev),idempotency_key:randomUUID()},randomUUID());
    assert.ok((await pool.query('SELECT removed_at FROM room_members WHERE room_id=$1 AND id=$2',[f.room,f.guest.memberId])).rows[0].removed_at);
    await assert.rejects(rooms.socketState(f.grants[1]),error=>error.code==='SOCKET_REPLACED');await unavailable(f);
  });return {real_pg_leave_committed:true,stale_socket_denied:true};
}));
test('B05-001 actual HTTP idempotent advance replay cannot redisclose a stopped round',async()=>record('B05-001-HTTP-REPLAY',async()=>{
  await activate(packs[2]);const f=await fixture(2);
  const app=await createApp({rooms,games,logger:false,probe:async()=>{},version:{service:'venus',version:'0.0.0',source_revision:'synthetic-p05-catalog',image_digest:'unreleased',contract_revision:'P00-2'}});
  try{
    await app.listen({host:'127.0.0.1',port:0});const port=app.server.address().port;
    function call(actor,path,body){
      return new Promise((done,reject)=>{
        const bytes=Buffer.from(JSON.stringify(body)),request=http.request({host:'127.0.0.1',port,path,method:'POST',agent:false,headers:{origin:rooms.options.origin,cookie:'venus_room_session='+actor.session,'x-csrf-token':rooms.csrf(actor.session),'content-type':'application/json','content-length':bytes.length}},response=>{
          let text='';response.on('data',chunk=>text+=chunk.toString());response.on('end',()=>{try{assert.equal(response.statusCode,200,text);done(JSON.parse(text));}catch(error){reject(error);}});
        });request.on('error',reject);request.end(bytes);
      });
    }
    const row=(await pool.query('SELECT * FROM game_rounds WHERE session_id=$1',[f.game])).rows[0];
    const plan=rooms.options.keys.decrypt(row.cipher,`game-round:${f.room}:${f.game}:${row.id}:1`).plan;
    const primary=plan.primary_member_id===f.host.memberId?f.host:f.guest,prefix=`/api/v1/rooms/${f.room}/game/${f.game}`;
    await call(primary,prefix+`/round/${row.id}/response`,{kind:'skip',request_id:randomUUID()});
    const current=await games.getCurrent(f.room,f.host.session),input={expected_rev:current.game_rev,idempotency_key:randomUUID()};
    const receipt=await call(f.host,prefix+'/round/advance',input);assert.equal(receipt.current_round.kind,'public');
    await call(f.guest,prefix+'/stop',{request_id:randomUUID()});
    const replay=await call(f.host,prefix+'/round/advance',input);
    assert.equal(replay.session_id,receipt.session_id);assert.equal(replay.game_rev,receipt.game_rev);assert.equal(replay.current_round,null);
    assert.equal((await state(f)).state,'aborted');
    return {real_internal_http:true,real_pg_encrypted_idempotency:true,original_public_round_observed:true,stopped_round_redacted:true,committed_session_and_revision_preserved:true};
  }finally{await app.close();await activate();}
}));
test('B05-003 fsynced withdrawal commits affected-game abort through intermediate head mismatch',async()=>record('B05-003-WITHDRAW',async()=>{
  const f=await fixture(),card=packs[0].cards[0];
  const before=(await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head;assert.equal(before,emptyLedgerHead);
  const result=await catalog.withdraw({card_id:card.id,revision:card.revision,reason_code:'safety',operator_id:'SYNTHETIC-P05-OPERATOR',at:new Date().toISOString()});
  assert.equal(result.active_digest,null);assert.notEqual(result.ledger_head,before);assert.equal((await state(f)).state,'aborted');assert.equal((await state(f)).snapshot_cipher,null);
  assert.equal((await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head,ledger.read().head);await unavailable(f);
  const frames=[];await rooms.dispatchGame(f.grants[0],view=>frames.push(view));
  assert.equal(frames.length,1);assert.equal(frames[0].state,'aborted');assert.equal(frames[0].current_round,null);
  return {actual_fsynced_ledger:true,actual_pg_abort_committed:true,intermediate_emit_did_not_rollback:true,snapshot_cleared:true,public_dispatch_clear_only:true};
}));
test('B05-003 restart-style reconciliation applies external durable intent without restoring old game',async()=>record('B05-003-RECONCILE',async()=>{
  await activate(packs[1]);const f=await fixture(),card=packs[1].cards[0];
  ledger.append({card_id:card.id,revision:card.revision,reason_code:'correction',operator_id:'SYNTHETIC-P05-OPERATOR',at:new Date().toISOString()});
  await assert.rejects(rooms.transaction(c=>catalog.active(c)),error=>error.code==='CATALOG_RECONCILIATION_REQUIRED');
  const result=await catalog.reconcile('SYNTHETIC-P05-OPERATOR');assert.equal(result.active_digest,null);assert.equal((await state(f)).state,'aborted');await unavailable(f);
  assert.equal((await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head,ledger.read().head);
  const repeated=await catalog.reconcile('SYNTHETIC-P05-OPERATOR');assert.equal(repeated.ledger_head,result.ledger_head);assert.equal((await state(f)).state,'aborted');
  return {durable_intent_before_pg:true,reconciliation_committed:true,repeat_did_not_revive:true};
}));
