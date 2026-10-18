import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createApp} from './app.js';
import {database} from './database.js';
import type {Version} from '@venus/contracts';
import {Rooms} from './rooms.js';
import {Keyring,DeletionLedger} from './security.js';
import {migrate,schemaProbe,schemaGeneration} from './migrations.js';
import {migrateGames,engineSchemaProbe} from './game-migrations.js';
import {Games} from './games.js';
let db:ReturnType<typeof database>|undefined;
async function main() {
  const metadata=JSON.parse(readFileSync(new URL('../../../build-metadata.json',import.meta.url),'utf8')) as {version:string;source_revision:string};
  const version:Version={service:'venus',version:metadata.version,source_revision:metadata.source_revision,image_digest:process.env.IMAGE_DIGEST??'unreleased',contract_revision:'P00-2'};
  if(!process.env.KEYRING_FILE||!process.env.DELETION_LEDGER_FILE||!process.env.APP_ORIGIN) throw new Error('External dependencies required');
  const origin=new URL(process.env.APP_ORIGIN);if(origin.origin!==process.env.APP_ORIGIN||origin.protocol!=='https:') throw new Error('HTTPS origin required');
  db=database();const pool=db.pool;
  const keys=Keyring.fromFile(process.env.KEYRING_FILE),ledger=new DeletionLedger(process.env.DELETION_LEDGER_FILE);
  await migrate(pool);await migrateGames(pool);
  const rooms=new Rooms({pool,keys,ledger,origin:origin.origin,offer:()=>null}),games=new Games(rooms,()=>null);rooms.attachGames(games);await rooms.maintain();
  const app=await createApp({probe:async()=>{await schemaProbe(pool);await engineSchemaProbe(pool);},schemaGeneration,rooms,games,version,staticRoot:fileURLToPath(new URL('../../web/dist',import.meta.url))});
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>{void app.close().then(()=>pool.end()).catch(()=>{process.exitCode=1;});});
  await app.listen({port:4300,host:'0.0.0.0'});
}
void main().catch(async()=>{
  // Never print startup exceptions: malformed key/secret files may appear in parser diagnostics.
  process.stderr.write(JSON.stringify({level:50,event:'startup_failed',code:'STARTUP_UNAVAILABLE'})+'\n');
  await db?.close().catch(()=>{});process.exitCode=1;
});
