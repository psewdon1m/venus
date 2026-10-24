// Scoped adapter integration: real Linux ledger, PostgreSQL and loopback HTTP.
// Lifecycle descriptors/revocation are explicit fixture seams, NOT their proof.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import pg from 'pg';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {migrate} from '../../apps/api/dist/migrations.js';
import {migratePrivateTopics,privateTopicSchemaProbe} from '../../apps/api/dist/private-topic-migrations.js';
import {PrivateTopicLedger} from '../../apps/api/dist/private-topic-ledger.js';
import {PrivateTopicPreferences} from '../../apps/api/dist/private-topic-preferences.js';
import {createApp} from '../../apps/api/dist/app.js';

assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');assert.equal(process.platform,'linux');
const directory=mkdtempSync(join(tmpdir(),'venus-topic-settings-'));
const pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim()});
let onFinal=null,app,now=100000;const results=[];
const wrapped={connect:async()=>{const c=await pool.connect();return {query:async(...args)=>{
 if(typeof args[0]==='string'&&args[0].startsWith('SELECT s.member_id')&&onFinal){const hook=onFinal;onFinal=null;args[0]=await hook(args[0]);}
 return c.query(...args);
},release:()=>c.release()};},query:(...args)=>pool.query(...args)};
const keys=new Keyring('v1',{v1:randomBytes(32).toString('base64')}),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['food','music']};
const offer={version:'synthetic-topic-test',digest:'c'.repeat(64),text:{ru:'mock',en:'mock',tr:'mock'},synthetic:true};
const rooms=new Rooms({pool:wrapped,keys,ledger:new DeletionLedger(join(directory,'deletions')),origin:'https://fixture.invalid',offer:()=>offer,now:()=>now});
const ledgers=new Map(),births=new Map();let retired=false,revokeFault=false;
const service=new PrivateTopicPreferences(rooms,{
 open:(room,birth)=>{assert.deepEqual(birth,births.get(room));assert(ledgers.has(room));return ledgers.get(room);},
 assertLive:()=>{if(retired)throw new Error('FIXTURE_RETIRED');},
 revoke:async c=>{await c.query('SELECT 1');if(revokeFault)throw new Error('FIXTURE_REVOKE_FAILURE');}
},pins);
async function check(id,fn){try{const detail=await fn();results.push({id,status:'PASS',detail:detail??{}});}catch(error){results.push({id,status:'FAIL'});throw error;}}
let origin;
function headers(credential,mutation=false){return {cookie:'venus_room_session='+credential,'x-csrf-token':rooms.csrf(credential),'sec-fetch-site':'same-origin',...(mutation?{origin:rooms.options.origin,'content-type':'application/json'}:{})};}
async function request(room,credential,method='GET',payload,path=''){
 const response=await fetch(origin+`/api/v1/rooms/${room}/me/private-topics`+path,{method,headers:headers(credential,method!=='GET'),...(payload?{body:JSON.stringify(payload)}:{})});
 const body=await response.json();return {status:response.status,body,headers:response.headers};
}
async function create(protocol=2){
 const room=randomUUID(),members=[randomUUID(),randomUUID()],credentials=[randomBytes(32).toString('base64url'),randomBytes(32).toString('base64url')];
 await rooms.transaction(async c=>{
  await c.query(`INSERT INTO rooms(id,host_member_id,meeting_context,state,rev,invite_hash,created_at,last_activity_at,private_protocol)
   VALUES($1,$2,'online','open',1,$3,$4,$4,$5)`,[room,members[0],hash(randomUUID()),new Date(now),protocol]);
  for(let i=0;i<members.length;i++){
   await c.query(`INSERT INTO room_members(room_id,id,display_name,locale,role,slot,heartbeat_at,reserved_until) VALUES($1,$2,$3,'en',$4,$5,$6,$7)`,[room,members[i],'fixture-'+i,i===0?'host':'member',i+1,new Date(now),new Date(now+90000)]);
   await c.query('INSERT INTO room_sessions VALUES($1,$2,$3,$4,NULL)',[hash(credentials[i]),room,members[i],new Date(now+86400000)]);
   await c.query('INSERT INTO entry_acceptances(room_id,member_id,offer_version,offer_digest,accepted_at,adult_declared_at) VALUES($1,$2,$3,$4,$5,$5)',[room,members[i],offer.version,offer.digest,new Date(now)]);
  }
  if(protocol===2){
   const chain=join(directory,room+'-chain'),witness=join(directory,room+'-witness');mkdirSync(chain,{mode:0o700});mkdirSync(witness,{mode:0o700});
   const {ledger,required}=PrivateTopicLedger.initialize({chainDirectory:chain,witnessDirectory:witness,keys,pins});
   const birth={...required,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};ledgers.set(room,ledger);births.set(room,birth);
   await c.query('INSERT INTO private_topic_room_births VALUES($1,$2,$3,$4,$5,$6)',[room,required.incarnation,required.minimumSequence,pins.taxonomy,pins.policy,new Date(now)]);
  }
 });return {room,members,credentials};
}
try{
 await check('P05-TOPICS-SQL-01',async()=>{await migrate(pool);await migratePrivateTopics(pool);await migratePrivateTopics(pool);await privateTopicSchemaProbe(pool);return {actual_postgresql:true,additive_migration_idempotent:true};});
 app=await createApp({rooms,privateTopics:service,logger:false,probe:async()=>{},version:{service:'venus',version:'fixture',source_revision:'dirty-preflight',image_digest:'fixture',contract_revision:'P00-2'}});
 origin=await app.listen({host:'127.0.0.1',port:0});
 const f=await create(),legacy=await create(1),own=f.credentials[0],peer=f.credentials[1];
 const put=(allow,expected=0,id=randomUUID())=>({request_id:id,expected_rev:expected,taxonomy_digest:pins.taxonomy,allow_topic_ids:allow,exclude_topic_ids:[]});
 const exclude=topics=>({request_id:randomUUID(),taxonomy_digest:pins.taxonomy,topic_ids:topics});
 await check('P05-TOPICS-SQL-02',async()=>{
  await assert.rejects(pool.query('UPDATE rooms SET private_protocol=1 WHERE id=$1',[f.room]));
  await assert.rejects(pool.query('UPDATE rooms SET private_protocol=2 WHERE id=$1',[legacy.room]));
  assert.equal((await request(legacy.room,legacy.credentials[0])).status,404);return {actual_protocol_update_trigger:true,no_legacy_auto_upgrade:true};
 });
 await check('P05-TOPICS-SQL-03',async()=>{
  const initial=await request(f.room,own);assert.equal(initial.status,200);assert.deepEqual(initial.body.allow_topic_ids,[]);assert.equal(initial.headers.get('cache-control'),'no-store');
  assert.equal((await request(f.room,own,'PUT',put(['food','music']))).status,200);
  const peerView=await request(f.room,peer);assert.equal(peerView.body.owner_member_id,f.members[1]);assert.deepEqual(peerView.body.allow_topic_ids,[]);
  const row=(await pool.query('SELECT cipher FROM private_topic_preferences WHERE room_id=$1',[f.room])).rows[0];assert(!JSON.stringify(row).includes('music'));assert.equal(Buffer.from(row.cipher.data,'base64').length,16384);
  return {actual_loopback_http:true,actual_owner_auth_and_pg:true,padded_encrypted_settings:true,no_peer_preferences:true};
 });
 const oldRow=(await pool.query('SELECT rev,cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[f.room,f.members[0]])).rows[0];
 await check('P05-TOPICS-SQL-04',async()=>{
  assert.equal((await request(f.room,own,'POST',exclude(['music']),'/exclusions')).status,200);
  await pool.query('UPDATE private_topic_preferences SET rev=$3,cipher=$4 WHERE room_id=$1 AND owner_member_id=$2',[f.room,f.members[0],oldRow.rev,oldRow.cipher]);
  const restored=await request(f.room,own);assert.equal(restored.status,200);assert.deepEqual(restored.body.allow_topic_ids,['food']);assert.deepEqual(restored.body.exclude_topic_ids,['music']);
  return {actual_encrypted_row_rollback:true,newer_linux_ledger_preserved:true,full_database_restore_claimed:false};
 });
 await check('P05-TOPICS-SQL-05',async()=>{
  revokeFault=true;try{assert.equal((await request(f.room,own,'POST',exclude(['food']),'/exclusions')).status,500);}finally{revokeFault=false;}
  const current=await request(f.room,own);assert.deepEqual(current.body.allow_topic_ids,[]);assert.deepEqual(current.body.exclude_topic_ids,['food','music']);
  assert.equal((await pool.query('SELECT rev FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[f.room,f.members[0]])).rows[0].rev,oldRow.rev);
  return {actual_pg_rollback:true,ledger_narrowing_survives:true,dependent_epoch_revocation_is_fixture_seam:true};
 });
 await check('P05-TOPICS-SQL-06',async()=>{
  const response=await fetch(origin+`/api/v1/rooms/${f.room}/me/private-topics`,{headers:{cookie:'venus_room_session='+own}});assert.equal(response.status,403);
  assert.equal((await request(f.room,own,'PUT',{...put([]),owner_member_id:f.members[1]})).status,400);
  assert.equal((await request(legacy.room,own)).status,401);
  return {actual_csrf_and_cross_room_denials:true,no_caller_owner_override:true};
 });
 await check('P05-TOPICS-SQL-07',async()=>{
  const held=await pool.connect();let releaseHook;const entered=new Promise(done=>{releaseHook=done;});
  onFinal=async sql=>{await held.query('SELECT pg_advisory_lock(746826499)');releaseHook();return sql.replace('SELECT s.member_id','SELECT pg_advisory_xact_lock(746826499) AS fixture_wait,s.member_id');};
  const pending=request(f.room,peer);await entered;
  try{
   let waiting=false;
   for(let n=0;n<100;n++){
    const rows=(await pool.query("SELECT pid FROM pg_stat_activity WHERE datname='venus' AND wait_event_type='Lock' AND query LIKE 'SELECT pg_advisory_xact_lock(746826499)%' ")).rows;
    if(rows.length){waiting=true;break;}await new Promise(done=>setTimeout(done,20));
   }
   assert(waiting,'Actual final credential SQL read must be waiting on fixture advisory lock');now+=86400001;
  }finally{await held.query('SELECT pg_advisory_unlock(746826499)');held.release();}
  const response=await pending;assert.equal(response.status,401);assert(!JSON.stringify(response.body).includes('allow_topic_ids'));
  return {actual_pg_final_auth_wait:true,fixture_sql_wait_expression:true,application_source_not_replaced:true,expiry_crosses_await:true,no_preferences_enqueued:true};
 });
 await check('P05-TOPICS-SQL-08',async()=>{
  const fresh=await create();retired=true;try{assert.equal((await request(fresh.room,fresh.credentials[0])).status,500);}finally{retired=false;}
  ledgers.delete(fresh.room);assert.equal((await request(fresh.room,fresh.credentials[0])).status,500);
  return {missing_storage_denies:true,retirement_is_explicit_fixture_seam:true,no_auto_initialize:true};
 });
}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\n');}
finally{
 await app?.close().catch(()=>{});await pool.end();
 const target=resolve(directory);assert(target.startsWith(resolve(tmpdir())+sep)&&target.includes('venus-topic-settings-'));rmSync(target,{recursive:true,force:true});
 const report={schema_version:1,status:process.exitCode?'FAIL':'PASS',suite:'P05_TOPIC_SETTINGS_ADAPTER',synthetic_fixture_only:true,full_p05_pass:false,lifecycle_descriptors_and_epoch_revocation:'FIXTURE_SEAMS_NOT_ACCEPTED',checks:results,runtime_cleanup:'completed'};
 writeFileSync(join(process.env.P05_ARTIFACT_DIRECTORY,'topic-settings-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,checks:results.length}));
}
