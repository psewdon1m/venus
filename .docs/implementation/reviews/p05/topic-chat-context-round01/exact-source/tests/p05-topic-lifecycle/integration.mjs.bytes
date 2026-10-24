/** Actual local Docker PG/HTTP/filesystem composition; not production/full P05. */
import {harness,migrate,migrateGames,migrateChat,migratePrivateTopics,privateTopicSchemaProbe,assert,randomUUID,hash,join,writeFileSync,renameSync,existsSync,readdirSync} from './harness.mjs';
const h=harness(),checks=[],expected=Array.from({length:16},(_,i)=>'P05-TLC-'+String(i+1).padStart(2,'0'));
let cleanup='failed',shared,privateFixture;
async function check(id,fn){try{checks.push({id,status:'PASS',detail:await fn()??{}});}catch(error){checks.push({id,status:'FAIL',error_name:error.name,error_message:error.message});throw error;}}
const scope=(f,kind)=>({room:f.room,session:f.game,id:kind==='history'?f.game:f.data.conversation_id,kind});
async function preparedPrivate(options){const f=await h.privateRound(options);await h.release(f);return f;}
async function noPrivate(r){assert(r.status>=400||r.body.prompt===undefined);assert(!r.raw.includes('SYNTHETIC'));}
async function restorePreference(f,actor,row){await h.pool.query('UPDATE private_topic_preferences SET rev=$3,cipher=$4 WHERE room_id=$1 AND owner_member_id=$2',[f.room,actor.id,row.rev,row.cipher]);}
async function rowSnapshot(f){return {room:(await h.pool.query('SELECT * FROM rooms WHERE id=$1',[f.room])).rows[0],members:(await h.pool.query('SELECT * FROM room_members WHERE room_id=$1',[f.room])).rows,sessions:(await h.pool.query('SELECT * FROM room_sessions WHERE room_id=$1',[f.room])).rows};}
async function restoreRows(f,snapshot){
 await h.pool.query('UPDATE rooms SET state=$2,closed_at=$3,rev=$4,last_activity_at=$5 WHERE id=$1',[f.room,snapshot.room.state,snapshot.room.closed_at,snapshot.room.rev,snapshot.room.last_activity_at]);
 for(const m of snapshot.members)await h.pool.query('UPDATE room_members SET removed_at=$3,slot=$4,presence=$5,heartbeat_at=$6,reserved_until=$7 WHERE room_id=$1 AND id=$2',[f.room,m.id,m.removed_at,m.slot,m.presence,m.heartbeat_at,m.reserved_until]);
 for(const s of snapshot.sessions)await h.pool.query('INSERT INTO room_sessions VALUES($1,$2,$3,$4,$5) ON CONFLICT(token_hash) DO UPDATE SET expires_at=$4,revoked_at=$5',[s.token_hash,s.room_id,s.member_id,s.expires_at,s.revoked_at]);
}
async function realCredentialWait(f,actor,{prefix,key,request,advance=2000,onWait,nthMatch=1}){
 const held=await h.pool.connect();let enteredResolve;const entered=new Promise(done=>{enteredResolve=done;});let injected=false,pending,matched=0;
 await held.query('SELECT pg_advisory_lock($1)',[key]);
 h.setQueryHook(async(_c,args)=>{if(!injected&&typeof args[0]==='string'&&args[0].startsWith(prefix)&&args[1]?.includes(f.room)&&++matched===nthMatch){injected=true;h.setQueryHook(null);enteredResolve();return [args[0].replace(prefix,`SELECT pg_advisory_xact_lock(${key}) AS fixture_wait,`+prefix.slice('SELECT '.length)),...args.slice(1)];}});
 try{
  pending=request();await Promise.race([entered,new Promise((_,reject)=>setTimeout(()=>reject(Error('Credential wait selector not reached')),15000))]);let waiting=false;
  for(let n=0;n<150;n++){if((await h.pool.query("SELECT pid FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1",[`SELECT pg_advisory_xact_lock(${key})%`])).rowCount){waiting=true;break;}await new Promise(done=>setTimeout(done,20));}
  assert(waiting,'Actual pg_stat_activity lock wait required before clock movement');await onWait?.();h.tick(advance);
 }finally{h.setQueryHook(null);await held.query('SELECT pg_advisory_unlock($1)',[key]);held.release();}
 return {response:await pending,injected,credential:actor.id};
}
try{
 await check('P05-TLC-01',async()=>{await migrate(h.pool);await migrateGames(h.pool);await migrateChat(h.pool);await migratePrivateTopics(h.pool);await migratePrivateTopics(h.pool);await privateTopicSchemaProbe(h.pool);await h.listen();return {actual_pg:true,generation:3,migration_idempotent:true};});
 await check('P05-TLC-02',async()=>{
  const refused=await h.create(2,{adult18:false});assert.equal(refused.status,400);shared=await h.create();const birth=await h.birth(shared);h.storage.assertMemberAuthority(shared.room,birth,shared.host.id);
  assert.equal((await h.pool.query('SELECT private_protocol FROM rooms WHERE id=$1',[shared.room])).rows[0].private_protocol,2);assert.equal((await h.pool.query('SELECT count(*) FROM entry_acceptances WHERE room_id=$1 AND adult_declared_at IS NOT NULL',[shared.room])).rows[0].count,'1');
  for(const directory of Object.values(h.store.directories(shared.room)))assert(existsSync(directory));return {actual_http_v2_create:true,explicit_adult18_required:true,actual_external_birth_and_host_admission:true,mock_offer_digest:h.offer.digest};
 });
 await check('P05-TLC-03',async()=>{
  const peer=await h.joinRoom(shared),birth=await h.birth(shared);h.storage.assertMemberAuthority(shared.room,birth,peer.id);await assert.rejects(h.pool.query('UPDATE rooms SET private_protocol=1 WHERE id=$1',[shared.room]));
  const held=await h.pool.connect();try{await held.query('BEGIN');await held.query('DELETE FROM private_topic_room_births WHERE room_id=$1',[shared.room]);await assert.rejects(held.query('SET CONSTRAINTS ALL IMMEDIATE'));}finally{await held.query('ROLLBACK');held.release();}
  const marker=join(h.parents.birthDirectory,shared.room,'birth');renameSync(marker,marker+'.fixture-held');try{const response=await h.call(shared.host,h.roomPath(shared));assert(response.status>=400);assert.equal(existsSync(marker),false,'Read must not create a missing external birth');assert.deepEqual(readdirSync(join(h.parents.birthDirectory,shared.room)),['birth.fixture-held']);}finally{renameSync(marker+'.fixture-held',marker);}
  return {actual_http_v1_join_into_p2:true,actual_external_member_admission:true,protocol_immutable:true,missing_birth_not_initialized:true};
 });
 await check('P05-TLC-04',async()=>{
  await h.putTopics(shared,shared.host);const peer=await h.getTopics(shared,shared.members[1]);assert.deepEqual(peer.allow_topic_ids,[]);assert.equal(peer.owner_member_id,shared.members[1].id);
  const row=(await h.pool.query('SELECT cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[shared.room,shared.host.id])).rows[0];assert.equal(Buffer.from(row.cipher.data,'base64').length,16384);for(const t of h.pins.vocabulary)assert(!JSON.stringify(row).includes(t));return {actual_owner_only_http:true,actual_encrypted_pg_preferences:true,padded_bytes:16384};
 });
 await check('P05-TLC-05',async()=>{
  const old=(await h.pool.query('SELECT rev,cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[shared.room,shared.host.id])).rows[0];const r=await h.exclude(shared,shared.host,['romance']);assert.equal(r.status,200);await restorePreference(shared,shared.host,old);const v=await h.getTopics(shared,shared.host);assert(!v.allow_topic_ids.includes('romance'));assert(v.exclude_topic_ids.includes('romance'));return {actual_old_encrypted_own_row_rollback:true,durable_external_exclusion_preserved:true,full_database_restore:false};
 });
 await check('P05-TLC-06',async()=>{
  const f=await preparedPrivate(),view=await h.ok(f.host,h.round(f)+'/conversation'),topic=view.offer.topics[0].topic_id,before=(await h.pool.query('SELECT rev,cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[f.room,f.host.id])).rows[0];let actualRevoke=false,injected=false;
  h.setQueryHook(async(c,args)=>{if(typeof args[0]==='string'&&args[0].startsWith('INSERT INTO private_topic_preferences')&&args[1]?.[0]===f.room){h.setQueryHook(null);const state=await h.loadObjectClient(c,scope(f,'conversation'));assert.equal(state.state.offer,null);assert(state.state.epoch>view.epoch);actualRevoke=true;injected=true;await c.query('SELECT 1/0 AS explicit_fixture_pg_rollback_after_actual_revoke');}});
  let r;try{r=await h.exclude(f,f.host,[topic]);}finally{h.setQueryHook(null);}assert.equal(r.status,500);assert(actualRevoke&&injected);const after=(await h.pool.query('SELECT rev,cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[f.room,f.host.id])).rows[0];assert.deepEqual(after,before);const own=await h.getTopics(f,f.host);assert(own.exclude_topic_ids.includes(topic));await noPrivate(await h.call(f.host,h.round(f)+'/conversation'));
  return {actual_pg_division_fault_after_real_topicsChanged:true,actual_pg_rollback:true,durable_exclusion_stricter:true,private_epoch_not_regranted:true};
 });
 await check('P05-TLC-07',async()=>{
  const legacy=await h.create(1);await assert.rejects(h.pool.query('UPDATE rooms SET private_protocol=2 WHERE id=$1',[legacy.room]));assert.equal((await h.call(legacy.host,h.roomPath(legacy)+'/me/private-topics')).status,404);
  const f=await h.privateRound(),before=(await h.pool.query('SELECT state,rev,snapshot_cipher FROM game_sessions WHERE id=$1',[f.game])).rows[0],rounds=(await h.pool.query('SELECT id,cipher FROM game_rounds WHERE session_id=$1 ORDER BY round_index',[f.game])).rows;
  assert.equal((await h.call(f.host,h.roomPath(f)+'/game/current')).status,409);await h.legacy.reconcilePublicPairPolicy();await h.legacy.quiesce();await h.rooms.transaction(c=>h.legacy.withdrawPacks(c,[h.source.pack.digest]),'exclusive');
  assert.deepEqual((await h.pool.query('SELECT state,rev,snapshot_cipher FROM game_sessions WHERE id=$1',[f.game])).rows[0],before);assert.deepEqual((await h.pool.query('SELECT id,cipher FROM game_rounds WHERE session_id=$1 ORDER BY round_index',[f.game])).rows,rounds);return {legacy_p1_no_upgrade:true,legacy_http_on_p2_denied:true,legacy_bulk_policy_quiesce_withdraw_skips_aad2:true};
 });
 await check('P05-TLC-08',async()=>{
  privateFixture=await h.privateRound();const first=await h.ok(privateFixture.host,h.round(privateFixture)+'/conversation');assert(!first.prompt);const active=await h.release(privateFixture);assert(active.prompt.text.includes('SYNTHETIC'));assert.equal((await h.ok(privateFixture.host,h.base(privateFixture)+'/current')).current_round.kind,'generic');return {actual_http_setup_prepare_start_invitation_topic_bilateral_release:true,source_card_map_only_synthetic:true,presence_setup:'HTTP ws-ticket plus actual Rooms.connect; no websocket transport claim'};
 });
 await check('P05-TLC-09',async()=>{
  const f=privateFixture,peer=f.members[1];await h.ok(peer,h.round(f)+'/conversation');const event=(await h.pool.query('SELECT event_id FROM topic_game_private_refs WHERE room_id=$1 AND member_id=$2',[f.room,peer.id])).rows[0];assert(event);const old=await rowSnapshot(f);assert.equal((await h.mutateRoom(f,peer,'leave')).status,200);await restoreRows(f,old);await noPrivate(await h.call(peer,h.round(f)+'/conversation'));await assert.rejects(h.rooms.dispatchPrivate(peer.grant,event.event_id,()=>assert.fail('Retired peer cannot enqueue')),error=>error.code==='TOPIC_ROOM_MEMBER_RETIRED');const birth=await h.birth(f);assert.throws(()=>h.storage.assertMemberAuthority(f.room,birth,peer.id),/TOPIC_ROOM_MEMBER_RETIRED/);return {actual_http_leave_then_stale_member_session_row_restore:true,external_retirement_denies_old_credential:true,actual_preexisting_private_ref_used:true};
 });
 await check('P05-TLC-10',async()=>{
  for(const kind of ['corrupt','missing']){const f=await h.create();await h.joinRoom(f);const birth=await h.birth(f);await h.withFault(kind,f,async()=>{const r=await h.mutateRoom(f,f.members[1],'leave');assert.equal(r.status,200);assert.throws(()=>h.storage.assertMemberAuthority(f.room,birth,f.members[1].id),/TOPIC_ROOM_MEMBER_RETIRED/);});}
  return {actual_http_leave_under_personal_chain_corrupt_and_missing:true};
 });
 await check('P05-TLC-11',async()=>{
  const f=await h.create();await h.joinRoom(f);const birth=await h.birth(f);await h.withFault('parent',f,async()=>{const r=await h.mutateRoom(f,f.host,'close');assert.equal(r.status,200);assert.equal(h.storage.retirementStatus(f.room,birth).state,'retired');});return {actual_http_close_under_missing_personal_parent:true,authority_root_healthy:true,bound_method_scope_forwarding:true};
 });
 await check('P05-TLC-12',async()=>{
  const f=await h.create();await h.joinRoom(f);const original=h.time(),operationId=randomUUID(),birth=await h.birth(f);await assert.rejects(h.rooms.transaction(async c=>{await h.rooms.lockRoom(c,f.room);await h.registry.retireRoom(c,f.room,operationId,original);await c.query('SELECT 1/0 AS deliberate_pg_rollback_after_retirement_intent');}));
  assert.equal((await h.pool.query('SELECT state FROM rooms WHERE id=$1',[f.room])).rows[0].state,'open');h.tick(2000);await h.rooms.maintain();const db=(await h.pool.query('SELECT state,closed_at FROM rooms WHERE id=$1',[f.room])).rows[0];assert.equal(db.state,'closed');assert.equal(db.closed_at.getTime(),original);assert.equal(h.storage.retirementStatus(f.room,birth).retiredAt,original);
  for(const key of ['personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'])assert.deepEqual(readdirSync(join(h.parents[key],f.room)),[]);assert(h.time()-original<86400000);return {deliberate_actual_pg_rollback_after_durable_intent:true,unknown_commit_network_fault_claimed:false,original_closedAt_preserved:true,actual_maintenance_cleanup_within_24h:true};
 });
 await check('P05-TLC-13',async()=>{
  const f=await h.create();await h.joinRoom(f);const snapshot=await rowSnapshot(f),birth=await h.birth(f);assert.equal((await h.mutateRoom(f,f.host,'close')).status,200);await restoreRows(f,snapshot);const original=h.rooms.options.ledger;h.rooms.options.ledger=h.freshLegacyLedger();try{assert.equal(h.rooms.options.ledger.contains(f.room),false);assert.equal(h.storage.retirementStatus(f.room,birth).state,'retired');const response=await h.call(f.host,h.roomPath(f));assert(response.status>=400);await noPrivate(response);}finally{h.rooms.options.ledger=original;}return {actual_room_member_session_row_snapshot_restore:true,legacy_deletion_fixture_empty_to_isolate_new_authority:true,external_retirement_independently_denies:true,full_pg_dump_restore:false};
 });
 await check('P05-TLC-14',async()=>{
  const f=await h.create();await h.joinRoom(f);await h.pool.query('UPDATE room_sessions SET expires_at=$2 WHERE token_hash=$1',[hash(f.host.credential),new Date(h.time()+1000)]);const birth=await h.birth(f),before=h.storage.open(f.room,birth).read({roomId:f.room,ownerId:f.host.id});
  const {response,injected}=await realCredentialWait(f,f.host,{prefix:'SELECT s.member_id',key:746826611,request:()=>h.exclude(f,f.host,['music'])});assert(injected);assert.equal(response.status,401);const after=h.storage.open(f.room,birth).read({roomId:f.room,ownerId:f.host.id});assert.deepEqual(after.excluded,before.excluded);assert.equal(after.revision,before.revision);assert.equal((await h.pool.query('SELECT count(*) FROM private_topic_preferences WHERE room_id=$1',[f.room])).rows[0].count,'0');return {actual_pg_final_credential_query_wait:true,explicit_fixture_sql_wait_expression:true,injected_server_clock_crossed_real_session_expiry:true,no_durable_narrowing_or_db_publication:true};
 });
 await check('P05-TLC-15',async()=>{
  const f=await preparedPrivate();await h.pool.query('UPDATE room_sessions SET expires_at=$2 WHERE token_hash=$1',[hash(f.host.credential),new Date(h.time()+1000)]);let enqueued=false;
  const {response,injected}=await realCredentialWait(f,f.host,{prefix:'SELECT s.expires_at',key:746826612,nthMatch:4,onWait:async()=>assert((await h.pool.query("SELECT count(*) FROM topic_game_objects WHERE room_id=$1 AND kind='projection'",[f.room])).rows[0].count!=='0'),request:async()=>{try{await h.topics.dispatchConversation(f.room,f.host.credential,f.game,f.plan.round_id,()=>{enqueued=true;});return {status:200};}catch(e){return {status:e.statusCode??500};}}});assert(injected);assert.equal(response.status,401);assert.equal(enqueued,false);return {actual_pg_credential_wait_before_private_enqueue:true,actual_topic_dispatch_callback_never_called:true,http_transport_not_used_for_this_dispatch_control:true};
 });
 await check('P05-TLC-16',async()=>{
  const f=await preparedPrivate({beforeGame:async f=>assert.equal((await h.exclude(f,f.host,['creative'])).status,200)}),before=await h.loadObject(scope(f,'history')),own=(await h.getTopics(f,f.host)).exclude_topic_ids;await h.ok(f.host,h.round(f)+'/conversation/chat','POST',{request_id:randomUUID(),conversation_id:f.data.conversation_id,epoch:(await h.ok(f.host,h.round(f)+'/conversation')).epoch,text:'SYNTHETIC_BOOT_CLEAR_CANARY'});
  const result=await h.topics.bootGate();assert.equal(result.private_scopes_revoked,true);for(const kind of ['conversation','chat'])assert.equal(await h.loadObject(scope(f,kind)),null);assert.equal((await h.pool.query('SELECT count(*) FROM topic_game_private_refs WHERE room_id=$1',[f.room])).rows[0].count,'0');assert.deepEqual(await h.loadObject(scope(f,'history')),before);assert.deepEqual((await h.getTopics(f,f.host)).exclude_topic_ids,own);await noPrivate(await h.call(f.host,h.round(f)+'/conversation'));return {actual_pg_boot_barrier:true,real_history_and_external_exclusions_retained:true,prior_private_text_chat_refs_and_pair_acks_revoked:true,api_process_restart_not_simulated:true};
 });
}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\n');}
finally{
 try{await h.cleanup();cleanup='completed';}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\n');}
 try{assert.equal(checks.length,expected.length,'Every fixed TLC control must execute');assert.equal(new Set(checks.map(c=>c.id)).size,checks.length);assert(expected.every(id=>checks.some(c=>c.id===id&&c.status==='PASS')));}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\n');}
 const report={schema_version:1,suite:'P05_TOPIC_LIFECYCLE',status:process.exitCode?'FAIL':'PASS',runtime_cleanup:cleanup,actual_postgresql_http_linux_lifecycle:true,synthetic_fixture_only:'CARD_AND_TOPIC_SOURCE_ONLY',database_faults_and_clock:'EXPLICIT_NAMED_TEST_CONTROLS',browser_cookie_jar_proof:false,full_pg_dump_restore:false,full_p05_pass:false,checks};
 writeFileSync(join(process.env.P05_ARTIFACT_DIRECTORY,'topic-lifecycle-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,status:report.status,checks:checks.length,cleanup}));
}

