import assert from 'node:assert/strict';
import pg from 'pg';
import {setTimeout as delay} from 'node:timers/promises';
const config={host:'db',user:'venus',database:'venus',connectionTimeoutMillis:2000,statement_timeout:5000};
const w=new pg.Client(config),a=new pg.Client(config),o=new pg.Client(config),report={format:1,scope:'MINIMAL_REAL_POSTGRES_ROOM_FK_MEDIA_LOCK_GRAPH',status:'FAIL',cases:[],full_application_or_protected_authority_test:false};
const room='10000000-0000-4000-8000-000000000001',lease='20000000-0000-4000-8000-000000000001',key=746826411;
for(const c of [w,a,o])c.on('error',()=>{});
const error=e=>({code:e.code,message:e.message,detail:e.detail,where:e.where});
async function waitFor(fn){const end=Date.now()+3000;for(;;){const r=await fn();if(r)return r;assert(Date.now()<end,'Bounded diagnostic observation deadline');await delay(20);}}
async function graph(label){const r=await o.query(`SELECT a.pid,a.query,a.wait_event_type,a.wait_event,pg_blocking_pids(a.pid) AS blocked_by,l.locktype,l.mode,l.granted,l.relation::regclass::text AS relation,l.transactionid::text AS transactionid,l.classid::text AS classid,l.objid::text AS objid FROM pg_stat_activity a LEFT JOIN pg_locks l ON l.pid=a.pid WHERE a.pid=ANY($1::int[]) ORDER BY a.pid,l.granted,l.locktype,l.mode`,[[w.processID,a.processID]]);return{label,rows:r.rows};}
async function reset(){await o.query('TRUNCATE leases,rooms');await o.query('INSERT INTO rooms VALUES($1)',[room]);await o.query('INSERT INTO leases VALUES($1,$2,NULL,false)',[lease,room]);}
async function finish(c,operation){try{await operation;await c.query('COMMIT');return{status:'COMMITTED'};}catch(e){await c.query('ROLLBACK');return{status:'ROLLED_BACK',error:error(e)};}}
try{
 await Promise.all([w.connect(),a.connect(),o.connect()]);
 report.postgresql=(await o.query('SELECT version() AS version')).rows[0].version;
 await o.query('CREATE TABLE rooms(id uuid PRIMARY KEY); CREATE TABLE leases(id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES rooms(id),revoked_at timestamptz,cutoff_pending boolean NOT NULL)');
 await reset();await w.query('BEGIN');await w.query('SELECT pg_advisory_xact_lock($1)',[key]);
 await w.query('UPDATE leases SET revoked_at=COALESCE(revoked_at,now()),cutoff_pending=(cutoff_pending OR revoked_at IS NULL)');
 await a.query('BEGIN');await a.query('SELECT * FROM rooms WHERE id=$1 FOR UPDATE',[room]);
 const watchdog=finish(w,w.query('UPDATE leases SET revoked_at=COALESCE(revoked_at,now()),cutoff_pending=true WHERE id=$1',[lease]));
 await waitFor(async()=>(await o.query('SELECT pg_blocking_pids($1) AS p',[w.processID])).rows[0].p.includes(a.processID));
 const before=await graph('watchdog second UPDATE FK waits for reaccept room FOR UPDATE');
 const reaccept=finish(a,a.query('SELECT pg_advisory_xact_lock($1)',[key]));
 await waitFor(async()=>{const r=(await o.query('SELECT pg_blocking_pids($1) AS p',[a.processID])).rows[0].p;return r.includes(w.processID);});
 const cycle=await graph('cycle: watchdog waits room; reaccept waits media advisory');
 const result=await Promise.all([watchdog,reaccept]);assert(result.some(r=>r.error?.code==='40P01'),'Baseline must observe actual PostgreSQL deadlock');
 report.cases.push({id:'BASELINE_DOUBLE_UPDATE',expected:'40P01',status:'PASS_REPRODUCED',before,cycle,transactions:result});
 for(const confirmed of [false,true]){
  await reset();await w.query('BEGIN');await w.query('SELECT pg_advisory_xact_lock($1)',[key]);
  const retired=(await w.query('SELECT id FROM leases WHERE revoked_at IS NULL OR cutoff_pending')).rows.map(r=>r.id);assert.deepEqual(retired,[lease]);
  await a.query('BEGIN');await a.query('SELECT * FROM rooms WHERE id=$1 FOR UPDATE',[room]);
  const reaccept=finish(a,a.query('SELECT pg_advisory_xact_lock($1)',[key]));
  await waitFor(async()=>(await o.query('SELECT pg_blocking_pids($1) AS p',[a.processID])).rows[0].p.includes(w.processID));
  const before=await graph('reaccept holds room and waits media; watchdog has only SELECTed boot retirees');
  const watchdog=finish(w,w.query('UPDATE leases SET revoked_at=COALESCE(revoked_at,now()),cutoff_pending=$2 WHERE id=ANY($1::uuid[])',[retired,!confirmed]));
  const result=await Promise.all([watchdog,reaccept]);assert(result.every(r=>r.status==='COMMITTED'),'One-update variant must not deadlock');
  const stored=(await o.query('SELECT revoked_at IS NOT NULL AS revoked,cutoff_pending FROM leases WHERE id=$1',[lease])).rows[0];assert.equal(stored.revoked,true);assert.equal(stored.cutoff_pending,!confirmed);
  report.cases.push({id:'SELECT_THEN_SINGLE_UPDATE_'+(confirmed?'CONFIRMED':'UNCONFIRMED'),status:'PASS',before,transactions:result,stored});
 }
 report.status='PASS_DIAGNOSTIC_BASELINE_DEADLOCK_AND_SINGLE_UPDATE_CLEAR';
}catch(e){report.error=error(e);process.exitCode=1;}
finally{for(const c of [w,a])await c.query('ROLLBACK').catch(()=>{});for(const c of [w,a,o])await c.end().catch(()=>{});console.log(JSON.stringify(report));}
