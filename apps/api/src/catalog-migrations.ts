import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type pg from 'pg';
export async function migrateCatalog(pool:pg.Pool) {
  const sql=readFileSync(new URL('../catalog-migrations/001_catalog.sql',import.meta.url),'utf8'),hash=createHash('sha256').update(sql).digest('hex'),c=await pool.connect();
  try {
    await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(746826404)');
    await c.query('CREATE TABLE IF NOT EXISTS venus_catalog_schema_migrations(generation integer PRIMARY KEY,sha256 text NOT NULL)');
    const rows=(await c.query<{generation:number;sha256:string}>('SELECT * FROM venus_catalog_schema_migrations ORDER BY generation')).rows;
    if(rows.length===0) {await c.query(sql);await c.query('INSERT INTO venus_catalog_schema_migrations VALUES(1,$1)',[hash]);}
    else if(rows.length!==1||rows[0]!.generation!==1||rows[0]!.sha256!==hash) throw new Error('Catalog schema unsupported');
    await c.query('COMMIT');
  } catch(error) {await c.query('ROLLBACK');throw error;}finally {c.release();}
}
export async function catalogSchemaProbe(pool:Pick<pg.Pool,'query'>) {
  const query={text:`SELECT max(generation) AS generation,(SELECT count(*) FROM unnest(ARRAY['venus_catalog_state','venus_catalog_withdrawals','venus_catalog_events']) AS t(name) WHERE to_regclass(t.name) IS NOT NULL)::int AS tables FROM venus_catalog_schema_migrations`,query_timeout:1000};
  const result=await pool.query<{generation:number;tables:number}>(query);
  if(result.rows[0]?.generation!==1||result.rows[0]?.tables!==3) throw new Error('Catalog schema not ready');
}
