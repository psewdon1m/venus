import {describe,it,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {execFileSync} from 'node:child_process';
import pg from 'pg';
import WebSocket from 'ws';
import {startRuntime,client,cert} from '../p02/harness.mjs';
import {migrate} from '../../apps/api/dist/migrations.js';
import {migrateGames} from '../../apps/api/dist/game-migrations.js';
import {migrateCatalog,catalogSchemaProbe} from '../../apps/api/dist/catalog-migrations.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {Catalog} from '../../apps/api/dist/catalog.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {RevocationLedger} from '../../packages/card-catalog/dist/index.js';
import {testPacks} from './fixtures.mjs';
if(process.env.VENUS_P04_INTEGRATION!=='1') throw new Error('Isolated P04 required');
const packs=testPacks(),records=[],sockets=new Set();let pool,runtime,operator,keys;
const pause=process.env.P04_PAUSE_FILE,ledgerPath=process.env.P04_LEDGER_FILE;
const httpPause=process.env.P04_HTTP_PAUSE_FILE;
const backup=process.env.P04_TEST_DIRECTORY+'/restore-before-revision2-withdrawal.dump';let restoredGameId;
const base=r=>`/api/v1/rooms/${r.id}`,game=r=>base(r)+'/game';
const text={ru:'SYNTHETIC P04, not a public offer.',en:'SYNTHETIC P04, not a public offer.',tr:'SYNTHETIC P04, not a public offer.'};
const offer={version:'synthetic-p04-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
function service(production=false) {
  const rooms=new Rooms({pool,keys,ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:runtime.origin,now:()=>Number(readFileSync(process.env.P02_CLOCK_FILE,'utf8')),offer:()=>offer});
  const games=new Games(rooms,()=>null,!production);rooms.attachGames(games);
  const catalog=production?null:new Catalog(rooms,games,new RevocationLedger(ledgerPath),packs,true);if(catalog) games.attachCatalog(catalog);return {rooms,games,catalog};
}
async function ok(c,path,method='GET',body,status=200) {const result=await c.call(path,{method,...(body===undefined?{}:{body})});assert.equal(result.status,status,result.text);return result.body;}
async function generation() {return (await pool.query('SELECT generation FROM venus_catalog_state')).rows[0].generation;}
async function activate(pack=packs[0]) {return operator.catalog.activate(pack.digest,await generation(),'SYNTHETIC-OPERATOR');}
async function waitFor(test) {for(let i=0;i<300;i++) {if(await test()) return;await new Promise(resolve=>setTimeout(resolve,10));}throw new Error('P04 state timeout');}
async function ws(c,r) {
  const ticket=await ok(c,base(r)+'/ws-ticket','POST',{request_id:randomUUID()}),frames=[];
  const socket=new WebSocket(runtime.origin.replace('https:','wss:')+base(r)+'/ws',{ca:cert,origin:runtime.origin,headers:{cookie:c.cookies}});sockets.add(socket);
  socket.on('message',raw=>frames.push(JSON.parse(raw.toString())));socket.on('error',()=>{});await once(socket,'open');socket.send(JSON.stringify({type:'auth',ticket:ticket.ticket}));
  await waitFor(()=>frames.some(f=>f.type==='room.snapshot'));return {socket,frames};
}
async function prepare(r,rounds=10) {
  const room=await ok(r.host,base(r));return ok(r.host,game(r)+'/prepare','POST',{mode:'questions',round_count:rounds,players:r.ids,expected_rev:room.room_rev,idempotency_key:randomUUID()});
}
async function fixture(start=true) {
  const host=await client(runtime.origin),created=await ok(host,'/api/v1/rooms','POST',{meeting_context:'in_person',locale:'ru',name:'SYNTHETIC-HOST',entry_acceptance:host.acceptance,idempotency_key:randomUUID()},201);
  const r={host,id:created.room_id,ids:[created.me.id]},guest=await client(runtime.origin);
  const joined=await ok(guest,base(r)+'/join','POST',{invite_token:new URL(created.invite_url).hash.slice('#invite='.length),display_name:'SYNTHETIC-GUEST',locale:'en',entry_acceptance:guest.acceptance,idempotency_key:randomUUID()});r.guest=guest;r.ids.push(joined.me.id);
  for(const c of [host,guest]) await ok(c,base(r)+'/me/preferences','PUT',{comfort:0,edges:{},expected_rev:0,idempotency_key:randomUUID()});
  r.hostWs=await ws(host,r);r.guestWs=await ws(guest,r);r.draft=await prepare(r);r.gameId=r.draft.session_id;
  if(start) await ok(host,game(r)+'/start','POST',{draft_rev:r.draft.game_rev,idempotency_key:randomUUID()});return r;
}
async function privateFixture() {
  const r=await fixture(false);
  for(const c of [r.host,r.guest]) {const own=await ok(c,base(r)+'/me/preferences');await ok(c,base(r)+'/me/preferences','PUT',{comfort:4,edges:{},expected_rev:own.rev,idempotency_key:randomUUID()});}
  const draft=await prepare(r,20);await ok(r.host,game(r)+'/start','POST',{draft_rev:draft.game_rev,idempotency_key:randomUUID()});
  for(let i=0;i<20;i++) {
    const row=(await pool.query('SELECT * FROM game_rounds WHERE session_id=$1 ORDER BY round_index DESC LIMIT 1',[r.gameId])).rows[0];
    const data=keys.decrypt(row.cipher,`game-round:${r.id}:${r.gameId}:${row.id}:1`),round=game(r)+`/${r.gameId}/round/${row.id}`;
    if(data.plan.interaction==='pair_private') {
      for(const c of [r.host,r.guest]) {const invitation=await ok(c,round+'/invitation');await ok(c,round+'/response','POST',{kind:'accept',scope:'invitation',offer_id:invitation.offer_id,proposal_revision:invitation.proposal_revision,request_id:randomUUID()});}
      await ok(r.host,round+'/private');r.privatePath=round+'/private';return r;
    }
    const actor=data.plan.primary_member_id===r.ids[0]?r.host:r.guest;await ok(actor,round+'/response','POST',{kind:'skip',request_id:randomUUID()});
    const current=await ok(r.host,game(r)+'/current');await ok(r.host,game(r)+`/${r.gameId}/round/advance`,'POST',{expected_rev:current.game_rev,idempotency_key:randomUUID()});
  }
  throw new Error('No private round in limited-public synthetic fixture');
}
function mark(id,detail={}) {records.push({id,status:'PASS',detail});}
describe('P04 actual PostgreSQL, HTTPS and WS catalogue controls',()=>{
  before(async()=>{
    keys=Keyring.fromFile(process.env.KEYRING_FILE);pool=new pg.Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),max:12});
    await migrate(pool);await migrateGames(pool);await Promise.all([migrateCatalog(pool),migrateCatalog(pool)]);
    runtime=await startRuntime({P04_TEST_SERVER:'1'});operator=service();
  });
  after(async()=>{
    writeFileSync(pause,'go');writeFileSync(httpPause,'go');for(const socket of sockets) socket.terminate();await runtime?.close();await pool?.end();mkdirSync('.artifacts/p04',{recursive:true});
    const required=['P04-MIGRATION','P04-ATOMIC-POINTER','P04-SHORTAGE-ACL','P04-PINNED-ROLLBACK','P04-MUTATION-RECEIPTS','P04-READONLY-AUTH','P04-PUBLIC-READONLY','P04-PUBLIC-REVOKE-FENCE','P04-HTTP-REVOKE-FENCE','P04-PRIVATE-REVOKE-CLEAR','P04-COMMIT-FAILURE','P04-RESTORE-LEDGER','P04-MISSING-LEDGER'];
    writeFileSync('.artifacts/p04/runtime-report.json',JSON.stringify({schema_version:1,source_sha:process.env.P04_SOURCE_SHA,synthetic:true,required,records,status:required.every(id=>records.some(r=>r.id===id))?'PASS':'FAIL'},null,2));
  });
  it('uses a separate checked migration stream and rejects future/checksum corruption',async()=>{
    await catalogSchemaProbe(pool);assert.equal((await pool.query('SELECT count(*)::int AS n FROM venus_game_schema_migrations')).rows[0].n,1);
    await pool.query("UPDATE venus_catalog_schema_migrations SET sha256=repeat('0',64)");await assert.rejects(migrateCatalog(pool),/Catalog schema unsupported/);
    const checksum=hash(readFileSync('apps/api/catalog-migrations/001_catalog.sql','utf8'));await pool.query('UPDATE venus_catalog_schema_migrations SET sha256=$1',[checksum]);await catalogSchemaProbe(pool);mark('P04-MIGRATION');
  });
  it('rejects drafts in production Catalog and commits one compare-and-swap pointer winner',async()=>{
    assert.throws(()=>new Catalog(operator.rooms,operator.games,new RevocationLedger(ledgerPath),packs),e=>e.code==='CATALOG_UNREVIEWED');
    const rev=await generation(),results=await Promise.allSettled(packs.map(p=>operator.catalog.activate(p.digest,rev,'SYNTHETIC-OPERATOR')));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='CATALOG_POINTER_CONFLICT').length,1);
    await activate();mark('P04-ATOMIC-POINTER');
  });
  it('uses active Catalog for Prepare and reports safe shortage before Start without private details',async()=>{
    const r=await fixture(false);assert.equal((await ok(r.host,game(r)+'/availability')).available,true);
    assert.equal((await r.guest.call(game(r)+'/availability')).body.code,'HOST_REQUIRED');
    const draft=await prepare(r,20),result=await ok(r.host,game(r)+'/availability');assert.equal(result.available,false);assert.equal(result.reason,'INSUFFICIENT_SAFE_CARDS');
    assert.deepEqual(Object.keys(result).sort(),['available','draft_rev','reason','recheck_required_at_start','requested_rounds']);
    const start=await r.host.call(game(r)+'/start',{method:'POST',body:{draft_rev:draft.game_rev,idempotency_key:randomUUID()}});assert.equal(start.status,422);assert.equal(start.body.code,'SAFE_POOL_EXHAUSTED');
    assert.equal((await pool.query('SELECT state FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].state,'waiting');mark('P04-SHORTAGE-ACL');
  });
  it('keeps an existing pinned pack through pointer switch/compatible rollback and process restart',async()=>{
    const r=await fixture();const old=(await ok(r.host,game(r)+'/current')).current_round;
    await activate(packs[1]);assert.equal((await ok(r.host,game(r)+'/current')).current_round.card_id,old.card_id);
    await operator.catalog.activate(packs[0].digest,await generation(),'SYNTHETIC-OPERATOR',true);
    const rebound=service();assert.equal((await rebound.games.getCurrent(r.id,r.host.jar.get('venus_room_session'))).current_round.card_revision,1);
    mark('P04-PINNED-ROLLBACK',{pinned_digest:packs[0].digest,rollback_target:packs[0].digest});
  });
  it('preserves stop/abort scalar receipts and original view mutation session/revision across idempotent replay',async()=>{
    const r=await fixture(),current=await ok(r.host,game(r)+'/current'),input={expected_rev:current.game_rev,idempotency_key:randomUUID()},path=game(r)+`/${r.gameId}/pause`;
    const first=await ok(r.host,path,'POST',input);assert.equal(first.session_id,r.gameId);
    const stopInput={request_id:randomUUID()},stopPath=game(r)+`/${r.gameId}/stop`,stopped=await ok(r.host,stopPath,'POST',stopInput);
    assert.deepEqual(Object.keys(stopped).sort(),['request_id','rev']);const next=await prepare(r);assert.notEqual(next.session_id,r.gameId);
    assert.deepEqual(await ok(r.host,path,'POST',input),first);assert.deepEqual(await ok(r.host,stopPath,'POST',stopInput),stopped);
    mark('P04-MUTATION-RECEIPTS',{scalar_stop_contract:true,exact_view_replay_after_another_session:true});
  });
  it('final HTTP authorization never reserves/reactivates an inactive member before enqueue',async()=>{
    const r=await fixture(),cookie=r.guest.jar.get('venus_room_session');await pool.query("UPDATE room_members SET slot=NULL,presence='inactive' WHERE id=$1",[r.ids[1]]);
    await pool.query("CREATE FUNCTION p04_no_member_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forbidden final auth write'; END $$");
    await pool.query('CREATE TRIGGER p04_no_member_write BEFORE UPDATE ON room_members FOR EACH ROW EXECUTE FUNCTION p04_no_member_write()');
    try {await assert.rejects(operator.games.dispatchHttpView(r.id,cookie,()=>assert.fail('Inactive member must not receive text')),e=>e.code==='ACTORS_UNAVAILABLE');}
    finally {await pool.query('DROP TRIGGER p04_no_member_write ON room_members');await pool.query('DROP FUNCTION p04_no_member_write()');}
    assert.equal((await pool.query('SELECT slot FROM room_members WHERE id=$1',[r.ids[1]])).rows[0].slot,null);mark('P04-READONLY-AUTH',{inactive_no_reserve:true,real_write_rejection_trigger:true});
  });
  it('final public projection cannot write or invent revisions even at exact consent expiry',async()=>{
    const r=await privateFixture(),row=(await pool.query('SELECT * FROM game_rounds WHERE session_id=$1 ORDER BY round_index DESC LIMIT 1',[r.gameId])).rows[0];
    const data=keys.decrypt(row.cipher,`game-round:${r.id}:${r.gameId}:${row.id}:1`),before=(await pool.query('SELECT rev FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].rev;
    const clock=readFileSync(process.env.P02_CLOCK_FILE,'utf8');writeFileSync(process.env.P02_CLOCK_FILE,String(data.invitation.active_until));
    const c=await pool.connect();try {await c.query('BEGIN READ ONLY');await c.query('SELECT pg_advisory_xact_lock_shared(746826405)');const view=await operator.games.publicDelivery(c,r.id,'en');assert.equal(view.current_round,null);assert.equal(view.game_rev,Number(before));await c.query('COMMIT');}finally {c.release();writeFileSync(process.env.P02_CLOCK_FILE,clock);}
    assert.equal((await pool.query('SELECT rev FROM game_sessions WHERE id=$1',[r.gameId])).rows[0].rev,before);mark('P04-PUBLIC-READONLY',{postgres_read_only_transaction:true,expiry_boundary:true});
  });
  it('withdrawal stops pinned games and fences a cached public WS projection before enqueue',async()=>{
    const r=await fixture(),privateRoom=await privateFixture(),cached=await ok(r.host,game(r)+'/current');assert.ok(cached.current_round.card_id);
    await waitFor(()=>privateRoom.hostWs.frames.some(f=>f.type==='game.private_prompt')&&privateRoom.guestWs.frames.some(f=>f.type==='game.private_prompt'));
    const lastPrompt=[privateRoom.hostWs,privateRoom.guestWs].map(connection=>Math.max(...connection.frames.filter(f=>f.stream==='private').map(f=>f.stream_rev)));
    writeFileSync(httpPause,'pause');const publicRequest=r.host.call(game(r)+'/current'),privateRequest=privateRoom.host.call(privateRoom.privatePath);
    await waitFor(()=>existsSync(httpPause+'.public.ready')&&existsSync(httpPause+'.private.ready'));
    writeFileSync(pause,'pause');await waitFor(()=>existsSync(pause+'.ready'));
    const sentBefore=r.hostWs.frames.length;
    await operator.catalog.withdraw({card_id:packs[0].cards[0].id,revision:1,operator_id:'SYNTHETIC-OPERATOR',reason_code:'safety',at:new Date().toISOString()});
    writeFileSync(pause,'go');writeFileSync(httpPause,'go');
    const [publicHttp,privateHttp]=await Promise.all([publicRequest,privateRequest]);assert.equal(publicHttp.status,200);assert.equal(publicHttp.body.state,'aborted');assert.equal(publicHttp.body.current_round,null);
    assert.notEqual(privateHttp.status,200);assert.equal(privateHttp.text.includes('prompt'),false);
    assert.equal(publicHttp.headers['cache-control'],'no-store');assert.equal(publicHttp.headers['x-content-type-options'],'nosniff');assert.ok(publicHttp.headers['content-security-policy'].includes("frame-ancestors 'none'"));
    mark('P04-HTTP-REVOKE-FENCE',{actual_delayed_https_public_and_private:true,security_headers_preserved:true});
    await waitFor(()=>r.hostWs.frames.slice(sentBefore).some(f=>f.type==='game.snapshot'));
    const views=r.hostWs.frames.slice(sentBefore).filter(f=>f.type==='game.snapshot');assert.ok(views.every(f=>f.payload.state==='aborted'&&f.payload.current_round===null));
    assert.equal((await ok(r.host,game(r)+'/current')).state,'aborted');
    for(const [index,connection] of [privateRoom.hostWs,privateRoom.guestWs].entries()) await waitFor(()=>connection.frames.some(f=>f.type==='game.private_cleared'&&f.stream_rev>lastPrompt[index]));
    const denied=await privateRoom.host.call(privateRoom.privatePath);assert.notEqual(denied.status,200);assert.equal(denied.text.includes('prompt'),false);
    const deniedConsent=await privateRoom.host.call(privateRoom.privatePath.replace(/\/private$/,'/action-consent'));
    assert.equal(deniedConsent.status,404);assert.equal(deniedConsent.body.code,'PRIVATE_CHAT_UNAVAILABLE');
    const stoppedRow=(await pool.query('SELECT * FROM game_rounds WHERE session_id=$1 ORDER BY round_index DESC LIMIT 1',[privateRoom.gameId])).rows[0];
    const terminal=keys.decrypt(stoppedRow.cipher,`game-round:${privateRoom.id}:${privateRoom.gameId}:${stoppedRow.id}:1`);
    assert.equal(terminal.state,'stopped');assert.equal(terminal.invitation.state,'stopped');assert.equal(terminal.action.state,'stopped');
    assert.deepEqual(terminal.invitation.acks,[]);assert.deepEqual(terminal.action.acks,[]);
    mark('P04-PRIVATE-REVOKE-CLEAR',{both_prior_recipients_cleared:true,monotonic_stream_revisions:true});
    await assert.rejects(operator.catalog.activate(packs[0].digest,await generation(),'SYNTHETIC-OPERATOR',true),e=>e.code==='CATALOG_WITHDRAWN');
    await activate(packs[1]);mark('P04-PUBLIC-REVOKE-FENCE',{delayed_actual_ws_projection:true,withdrawn_card:packs[0].cards[0].id});
  });
  it('an fsynced withdrawal intent survives a real PostgreSQL commit failure and gates all cached serving',async()=>{
    const r=await fixture(),pack=packs[1],withdrawal={card_id:pack.cards[1].id,revision:2,operator_id:'SYNTHETIC-OPERATOR',reason_code:'rights',at:new Date().toISOString()};
    restoredGameId=r.gameId;
    execFileSync('docker',['exec',process.env.P04_DB_CONTAINER,'pg_dump','-U','venus','-d','venus','-Fc','-f','/tmp/p04-restore.dump']);
    execFileSync('docker',['cp',process.env.P04_DB_CONTAINER+':/tmp/p04-restore.dump',backup]);
    await pool.query("CREATE FUNCTION p04_fail_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic commit fault'; END $$");
    await pool.query('CREATE CONSTRAINT TRIGGER p04_catalog_commit_fault AFTER UPDATE ON venus_catalog_state DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION p04_fail_commit()');
    await assert.rejects(operator.catalog.withdraw(withdrawal),/synthetic commit fault/);
    const head=new RevocationLedger(ledgerPath).read().head;assert.notEqual((await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head,head);
    const failed=await r.host.call(game(r)+'/current');assert.equal(failed.status,503);assert.equal(failed.body.code,'CATALOG_RECONCILIATION_REQUIRED');
    await pool.query('DROP TRIGGER p04_catalog_commit_fault ON venus_catalog_state');await pool.query('DROP FUNCTION p04_fail_commit()');
    await operator.catalog.reconcile('SYNTHETIC-RECOVERY');assert.equal((await ok(r.host,game(r)+'/current')).state,'aborted');mark('P04-COMMIT-FAILURE',{intent_head:head});
  });
  it('replays the external ledger after restoring a genuine older full database backup',async()=>{
    // Restore the full checkpoint taken while the revision2 game was still active,
    // before the later withdrawal/commit-failure intents existed in the external ledger.
    assert.ok(existsSync(backup));const backupSha=hash(readFileSync(backup));
    const w={card_id:packs[1].cards[2].id,revision:2,operator_id:'SYNTHETIC-OPERATOR',reason_code:'safety',at:new Date().toISOString()};
    await operator.catalog.withdraw(w);const head=new RevocationLedger(ledgerPath).read().head;
    for(const socket of sockets) socket.terminate();await runtime.pause();
    execFileSync('docker',['exec',process.env.P04_DB_CONTAINER,'pg_restore','-U','venus','-d','venus','--clean','--if-exists','/tmp/p04-restore.dump']);
    assert.equal((await pool.query('SELECT state FROM game_sessions WHERE id=$1',[restoredGameId])).rows[0].state,'active');
    assert.notEqual((await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head,head);
    const restored=service();await restored.catalog.reconcile('SYNTHETIC-RESTORE');assert.equal((await pool.query('SELECT ledger_head FROM venus_catalog_state')).rows[0].ledger_head,head);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM venus_catalog_withdrawals WHERE card_id=$1 AND revision=2',[w.card_id])).rows[0].n,1);
    assert.equal((await pool.query('SELECT state FROM game_sessions WHERE id=$1',[restoredGameId])).rows[0].state,'aborted');
    await runtime.resume();mark('P04-RESTORE-LEDGER',{full_pg_dump_restore:true,backup_sha256:backupSha,revived_active_game_aborted:true,external_head:head});
  });
  it('production Games with missing catalogue configuration refuse even retained cached packs',async()=>{
    const production=service(true),room=(await pool.query('SELECT room_id,id FROM game_sessions WHERE pack_digest IS NOT NULL LIMIT 1')).rows[0];assert.ok(room);
    const adapter=production.games,c=await pool.connect();try {await assert.rejects(adapter.pack(c,{room_id:room.room_id,id:room.id,pack_digest:packs[0].digest}),e=>e.code==='CATALOG_LEDGER_REQUIRED');}finally {c.release();}
    mark('P04-MISSING-LEDGER');
  });
});
