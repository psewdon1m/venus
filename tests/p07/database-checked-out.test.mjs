/** Actual checked-out pg client transport failures. No browser, fake Pool or fake error. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import pg from 'pg';
if(process.env.VENUS_P07_DATABASE_FIXTURE!=='1'||process.platform!=='linux')throw Error('Owned Linux PG regression fixture required');
const moduleFile='/app/apps/api/src/database.ts',worker=process.argv.includes('--worker');
if(worker){
 const {database}=await import(moduleFile),db=database(),table=process.env.VENUS_DATABASE_TEST_TABLE;assert.match(table,/^venus_checked_out_[a-f0-9]{12}$/);
 let client=await db.pool.connect();const first=(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
 await client.query('BEGIN');await client.query('INSERT INTO '+table+' VALUES(1)');
 const operation=client.query('SELECT pg_sleep(30)').then(()=>({success:true}),error=>({success:false,code:error.code??error.name}));
 process.send({phase:'active-query',pid:first});const failed=await operation;assert.equal(failed.success,false,'Killed active query must reject');await delay(150);client.release();
 await db.probe();client=await db.pool.connect();const recovered=(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;assert.notEqual(recovered,first);
 assert.equal((await client.query('SELECT count(*)::int AS n FROM '+table+' WHERE id=1')).rows[0].n,0,'Killed transaction must roll back');
 process.send({phase:'checked-out-between-queries',pid:recovered,first_query_error:failed.code,first_rolled_back:true});
 await new Promise(resolve=>process.once('message',message=>{assert.equal(message.phase,'backend-terminated');resolve();}));await delay(150);
 await assert.rejects(client.query('SELECT 1'),'Dead checked-out client must remain unusable');client.release();
 await db.probe();const final=await db.pool.connect();const finalPid=(await final.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;assert.notEqual(finalPid,recovered);
 await final.query('BEGIN');await final.query('INSERT INTO '+table+' VALUES(2)');await final.query('COMMIT');final.release();await db.close();
 process.send({phase:'complete',active_query_rejected:true,rollback_preserved:true,between_queries_did_not_crash:true,dead_client_query_rejected:true,fresh_connection_after_each_failure:true,new_transaction_committed:true,backend_pids:[first,recovered,finalPid]});process.disconnect();
}else test('real PG terminate_backend preserves active-query rejection and checked-out-client recovery',{timeout:20000},async()=>{
 const password=fs.readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),admin=new pg.Client({host:process.env.DB_HOST,user:'venus',database:'venus',password,connectionTimeoutMillis:2000,query_timeout:5000}),table='venus_checked_out_'+randomBytes(6).toString('hex');let child,exit,stderr='';const messages=[];
 try{
  await admin.connect();await admin.query('CREATE TABLE '+table+'(id integer PRIMARY KEY)');
  child=spawn(process.execPath,[new URL(import.meta.url).pathname,'--worker'],{env:{...process.env,VENUS_DATABASE_TEST_TABLE:table},stdio:['ignore','ignore','pipe','ipc']});child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-4096);});child.on('message',message=>messages.push(message));const done=new Promise(resolve=>child.once('exit',(code,signal)=>{exit={code,signal};resolve(exit);}));
  async function phase(name){const deadline=Date.now()+8000;for(;;){const value=messages.find(message=>message.phase===name);if(value)return value;if(exit)throw Error('Isolated worker exited '+exit.code+' during '+name+'; '+stderr.replace(/[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g,'[REDACTED_JWT]'));assert(Date.now()<deadline,'Worker phase deadline '+name);await delay(20);}}
  const active=await phase('active-query');let sleeping=false;for(let n=0;n<100;n++){sleeping=(await admin.query('SELECT wait_event FROM pg_stat_activity WHERE pid=$1',[active.pid])).rows[0]?.wait_event==='PgSleep';if(sleeping)break;await delay(10);}assert(sleeping,'Kill only after the actual query reached PostgreSQL pg_sleep');
  assert.equal((await admin.query('SELECT pg_terminate_backend($1) AS stopped',[active.pid])).rows[0].stopped,true);
  const held=await phase('checked-out-between-queries');assert.equal(held.first_rolled_back,true);assert.equal((await admin.query('SELECT state FROM pg_stat_activity WHERE pid=$1',[held.pid])).rows[0].state,'idle');assert.equal((await admin.query('SELECT pg_terminate_backend($1) AS stopped',[held.pid])).rows[0].stopped,true);child.send({phase:'backend-terminated'});
  const proof=await phase('complete'),ended=await done;assert.equal(ended.code,0);assert.equal(ended.signal,null);assert.deepEqual((await admin.query('SELECT id FROM '+table+' ORDER BY id')).rows,[{id:2}]);console.log(JSON.stringify({status:'PASS',scope:'ACTUAL_LINUX_POSTGRES_CHECKED_OUT_TRANSPORT_FAILURE',first_query_error:held.first_query_error,...proof}));
 }finally{if(child&&child.exitCode===null&&child.signalCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGKILL');await done;}await admin.query('DROP TABLE IF EXISTS '+table).catch(()=>{});await admin.end();}
});
