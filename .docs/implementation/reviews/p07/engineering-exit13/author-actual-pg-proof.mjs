import fs from 'node:fs';import assert from 'node:assert/strict';import pg from '/app/node_modules/pg/lib/index.js';import {setTimeout as delay} from 'node:timers/promises';import {createHash} from 'node:crypto';
const names=['migrations','game-migrations','catalog-migrations','chat-migrations','private-topic-migrations','music-migrations','media-migrations','presentation-migrations'];
const migrateNames=['migrate','migrateGames','migrateCatalog','migrateChat','migratePrivateTopics','migrateMusic','migrateMedia','migratePresentations'],probeNames=['schemaProbe','engineSchemaProbe','catalogSchemaProbe','chatSchemaProbe','privateTopicSchemaProbe','musicSchemaProbe','mediaSchemaProbe','presentationSchemaProbe'];
const tables=['venus_schema_migrations','venus_game_schema_migrations','venus_catalog_schema_migrations','venus_chat_schema_migrations','venus_private_conversation_schema_migrations','venus_music_schema_migrations','venus_media_schema_migrations','venus_presentation_schema_migrations'];
const modules=await Promise.all(names.map(n=>import('/app/apps/api/dist/'+n+'.js'))),probes=modules.map((m,i)=>m[probeNames[i]]),config={host:'db',user:'venus',database:'venus',max:12,connectionTimeoutMillis:2000,query_timeout:5000,application_name:'venus_fix13_probe'},pool=new pg.Pool(config);
pool.on('error',()=>{});pool.on('connect',c=>c.on('error',()=>{}));let acquisitions=0;pool.on('acquire',()=>acquisitions++);
const admin=new pg.Client({...config,database:'postgres',application_name:'venus_fix13_admin'});await admin.connect();
const source=fs.readFileSync('/input/server.ts','utf8'),from=source.indexOf('probe:async()=>{')+6,to=source.indexOf('},...(barrier?',from)+1;assert(from>=6&&to>from);
let checkpoints=0;const probe=new Function('pool','protectedRuntime',...probeNames,'return ('+source.slice(from,to)+')')(pool,{checkpoint:()=>{checkpoints++;}},...probes),results=[];
const parity=JSON.parse(fs.readFileSync('/artifacts/compiled-parity.json','utf8'));for(const row of parity)assert.equal(createHash('sha256').update(fs.readFileSync('/app/apps/api/dist/'+row.name+'.js')).digest('hex'),row.after);
try{
 for(let i=0;i<modules.length;i++)await modules[i][migrateNames[i]](pool);
 let before=acquisitions;await probe();assert.equal(acquisitions-before,1);results.push({id:'fresh_all8_one_checkout',status:'PASS',acquisitions:1});
 for(const table of tables){
  const c=await pool.connect(),rows=(await c.query('SELECT generation,sha256 FROM '+table+' ORDER BY generation')).rows;c.release();
  for(const kind of ['changed','missing']){
   await admin.query('SELECT 1');const edit=await pool.connect();if(kind==='changed')await edit.query('UPDATE '+table+' SET generation=999 WHERE generation=$1',[rows.at(-1).generation]);else await edit.query('DELETE FROM '+table);edit.release();
   await assert.rejects(probe);await delay(10);assert.equal(pool.totalCount,0,'Failed schema probe must destroy its only client');
   const restore=await pool.connect();if(kind==='changed')await restore.query('UPDATE '+table+' SET generation=$1 WHERE generation=999',[rows.at(-1).generation]);else for(const row of rows)await restore.query('INSERT INTO '+table+' VALUES($1,$2)',[row.generation,row.sha256]);restore.release();await probe();
   results.push({id:table+'_'+kind,status:'PASS',failed_client_destroyed:true,fresh_recovery:true});
  }
 }
 const locker=new pg.Client({...config,application_name:'venus_fix13_locker'});await locker.connect();await locker.query('BEGIN');await locker.query('LOCK TABLE venus_schema_migrations IN ACCESS EXCLUSIVE MODE');
 const timeoutAt=Date.now();await assert.rejects(probe,/timeout/i);await delay(50);assert.equal(pool.totalCount,0);
 await locker.query('ROLLBACK');await locker.end();await delay(50);assert.equal(Number((await admin.query("SELECT count(*) AS n FROM pg_stat_activity WHERE application_name='venus_fix13_probe'")).rows[0].n),0);await probe();results.push({id:'actual_query_timeout_destroys_pool_client_backend_exits_after_lock_release',status:'PASS',elapsed_ms:Date.now()-timeoutAt,fresh_recovery:true,immediate_server_cancellation_not_claimed:true});
 await admin.query('ALTER DATABASE venus ALLOW_CONNECTIONS false');await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='venus'");await delay(50);
 await assert.rejects(probe);assert.equal(pool.totalCount,0);await admin.query('ALTER DATABASE venus ALLOW_CONNECTIONS true');await probe();results.push({id:'actual_database_admission_outage',status:'PASS',fresh_recovery:true,docker_stop_not_claimed:true});
 for(const single of [false,true]){
  const held=await Promise.all(Array.from({length:11},()=>pool.connect()));let rival;pool.once('acquire',()=>{rival=pool.connect();});const begin=Date.now();
  try{if(single)await probe();else await assert.rejects(async()=>{for(const check of probes)await check(pool);},/timeout/i);assert(rival);const competing=await rival;competing.release();results.push({id:single?'single_checkout_completes8fresh_under12slot_pressure':'legacy8checkouts_times_out_under_same_pressure',status:'PASS',elapsed_ms:Date.now()-begin,held_slots:11,queued_competitor:true,room_advisory_workload_not_claimed:true});}finally{for(const c of held)c.release();}
 }
 assert(checkpoints>=1);fs.writeFileSync('/artifacts/actual-pg-proof.json',JSON.stringify({status:'PASS',scope:'FINITE_READINESS_PG_PROOF_NOT_SOAK_ACCEPTANCE',results,checkpoint_calls:checkpoints,probe_sql_and_compiled_js_unchanged:true},null,2)+'\n');console.log(JSON.stringify({status:'PASS',cases:results.length}));
}finally{await admin.query('ALTER DATABASE venus ALLOW_CONNECTIONS true').catch(()=>{});await admin.end();await pool.end();}
