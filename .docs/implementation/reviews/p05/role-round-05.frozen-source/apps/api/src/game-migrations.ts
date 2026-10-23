import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import type pg from 'pg';
export const engineSchemaGeneration=1;
export async function migrateGames(pool:pg.Pool,directory=new URL('../game-migrations/',import.meta.url)) {
  const c=await pool.connect();
  try {
    await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(746826403)');
    await c.query('CREATE TABLE IF NOT EXISTS venus_game_schema_migrations(generation integer PRIMARY KEY,sha256 text NOT NULL)');
    for(const file of readdirSync(directory).filter(f=>/^\d{3}_[a-z_]+\.sql$/.test(f)).sort()) {
      const generation=Number(file.slice(0,3)),sql=readFileSync(new URL(file,directory),'utf8'),sha=createHash('sha256').update(sql).digest('hex');
      const row=(await c.query<{sha256:string}>('SELECT sha256 FROM venus_game_schema_migrations WHERE generation=$1',[generation])).rows[0];
      if(row) {if(row.sha256!==sha) throw new Error('Engine migration checksum mismatch');continue;}
      await c.query(sql);await c.query('INSERT INTO venus_game_schema_migrations VALUES($1,$2)',[generation,sha]);
    }
    const value=(await c.query<{generation:number}>('SELECT max(generation) AS generation FROM venus_game_schema_migrations')).rows[0];
    if(value?.generation!==engineSchemaGeneration) throw new Error('Engine schema unsupported');
    await c.query('COMMIT');
  } catch(error) {await c.query('ROLLBACK');throw error;} finally {c.release();}
}
export async function engineSchemaProbe(pool:pg.Pool) {
  const query={text:`SELECT max(generation) AS generation,(SELECT count(*) FROM unnest(ARRAY['game_packs','game_sessions','game_participants','game_rounds','game_round_actors','game_consent_actors','game_private_streams','game_outbox_refs']) AS t(name) WHERE to_regclass(t.name) IS NOT NULL)::int AS tables FROM venus_game_schema_migrations`,query_timeout:1000};
  const value=(await pool.query<{generation:number;tables:number}>(query)).rows[0];
  if(value?.generation!==engineSchemaGeneration||value.tables!==8) throw new Error('Engine schema not ready');
}
