/** Deliberately unhealthy fixture image only; never copied into service build. */
import fs from 'node:fs';
if(process.env.VENUS_P06_FIXTURE_KIND==='migration'){
 const {database}=await import('./apps/api/dist/database.js');const db=database(),c=await db.pool.connect();let rolledBack=false;
 try{await c.query('BEGIN');await c.query('ALTER TABLE rooms ADD COLUMN p06_fixture_uncommitted boolean');await c.query('SELECT p06_deliberately_missing_function()');}catch{await c.query('ROLLBACK');rolledBack=true;}finally{c.release();await db.close();}
 fs.writeFileSync('/var/lib/venus-protected/p06-fixture-migration.json',JSON.stringify({synthetic:true,attempted_real_PostgreSQL_migration:true,rolled_back:rolledBack})+'\n',{mode:0o600});
}
process.exitCode=70;
