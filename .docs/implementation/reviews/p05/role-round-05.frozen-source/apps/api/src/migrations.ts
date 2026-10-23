import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import type pg from 'pg';
export const schemaGeneration = 1;
export async function migrate(pool: pg.Pool, directory = new URL('../migrations/',import.meta.url)) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(746826401)');
    await client.query('CREATE TABLE IF NOT EXISTS venus_schema_migrations (generation integer PRIMARY KEY, sha256 text NOT NULL)');
    const files = readdirSync(directory).filter(f=>/^\d{3}_[a-z_]+\.sql$/.test(f)).sort();
    for (const file of files) {
      const generation = Number(file.slice(0,3));
      const sql = readFileSync(new URL(file,directory),'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{sha256:string}>('SELECT sha256 FROM venus_schema_migrations WHERE generation=$1',[generation]);
      if (existing.rows[0]) {if(existing.rows[0].sha256!==hash) throw new Error('Migration checksum mismatch');continue;}
      await client.query(sql);
      await client.query('INSERT INTO venus_schema_migrations VALUES($1,$2)',[generation,hash]);
    }
    const latest=await client.query<{generation:number}>('SELECT max(generation) AS generation FROM venus_schema_migrations');
    if(latest.rows[0]?.generation!==schemaGeneration) throw new Error('Unsupported schema generation');
    await client.query('COMMIT');
  } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
}
export async function schemaProbe(pool:pg.Pool) {
  const query={text:`SELECT max(generation) AS generation,
    (SELECT count(*) FROM unnest(ARRAY['rooms','room_members','room_sessions','private_preferences','entry_acceptances','ws_tickets','idempotency_keys','outbox_events','audit_events','admission_limits']) AS t(name) WHERE to_regclass(t.name) IS NOT NULL)::int AS tables
    FROM venus_schema_migrations`,query_timeout:1000};
  const result=await pool.query<{generation:number;tables:number}>(query);
  if(result.rows[0]?.generation!==schemaGeneration||result.rows[0]?.tables!==10) throw new Error('Schema is not ready');
}
