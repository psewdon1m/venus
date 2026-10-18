import {readFileSync} from 'node:fs';
import pg from 'pg';
export function database() {
  const passwordFile = process.env.DB_PASSWORD_FILE;
  if (!passwordFile) throw new Error('DB_PASSWORD_FILE is required');
  const password = readFileSync(passwordFile, 'utf8').trim();
  if (password.length < 16) throw new Error('Database credential is too short');
  const pool = new pg.Pool({host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432), user: 'venus', database: 'venus', password,
    connectionTimeoutMillis: 2000, query_timeout: 5000, max: 12, idleTimeoutMillis: 10000});
  pool.on('error', () => { /* Failed idle connections are handled by the next readiness probe. */ });
  return {pool,probe: async () => {await pool.query('SELECT 1');}, close: () => pool.end()};
}
