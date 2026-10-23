import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import type pg from 'pg';
export const chatSchemaGeneration=1;
export async function migrateChat(pool:pg.Pool,directory=new URL('../chat-migrations/',import.meta.url)) {
  const c=await pool.connect();
  try {
    await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(746826406)');
    await c.query('CREATE TABLE IF NOT EXISTS venus_chat_schema_migrations(generation integer PRIMARY KEY,sha256 text NOT NULL)');
    for(const file of readdirSync(directory).filter(f=>/^\d{3}_[a-z_]+\.sql$/.test(f)).sort()) {
      const generation=Number(file.slice(0,3)),sql=readFileSync(new URL(file,directory),'utf8'),sha=createHash('sha256').update(sql).digest('hex');
      const row=(await c.query<{sha256:string}>('SELECT sha256 FROM venus_chat_schema_migrations WHERE generation=$1',[generation])).rows[0];
      if(row) {if(row.sha256!==sha) throw new Error('Chat migration checksum mismatch');continue;}
      await c.query(sql);await c.query('INSERT INTO venus_chat_schema_migrations VALUES($1,$2)',[generation,sha]);
    }
    const value=(await c.query<{generation:number}>('SELECT max(generation) AS generation FROM venus_chat_schema_migrations')).rows[0];
    if(value?.generation!==chatSchemaGeneration) throw new Error('Chat schema unsupported');
    // Deliberately ephemeral: no transcript or grant is restored across API boots.
    await c.query('DELETE FROM private_chat_scopes');
    await c.query('COMMIT');
  } catch(error) {await c.query('ROLLBACK');throw error;} finally {c.release();}
}
export async function chatSchemaProbe(pool:pg.Pool) {
  const query={text:`SELECT max(generation) AS generation,(SELECT count(*) FROM unnest(ARRAY['private_chat_scopes','private_chat_messages','private_chat_requests']) AS t(name) WHERE to_regclass(t.name) IS NOT NULL)::int AS tables FROM venus_chat_schema_migrations`,query_timeout:1000};
  const value=(await pool.query<{generation:number;tables:number}>(query)).rows[0];
  if(value?.generation!==chatSchemaGeneration||value.tables!==3) throw new Error('Chat schema not ready');
}
