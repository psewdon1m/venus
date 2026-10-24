/** Explicit isolated synthetic API process. Production provider remains fail-closed. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createApp} from '../../apps/api/dist/app.js';
import {database} from '../../apps/api/dist/database.js';
import {migrate,schemaProbe,schemaGeneration} from '../../apps/api/dist/migrations.js';
import {migrateGames} from '../../apps/api/dist/game-migrations.js';
import {migrateCatalog,catalogSchemaProbe} from '../../apps/api/dist/catalog-migrations.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {Catalog} from '../../apps/api/dist/catalog.js';
import {RevocationLedger} from '../../packages/card-catalog/dist/index.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {testPacks} from './fixtures.mjs';
if(process.env.VENUS_P04_INTEGRATION!=='1') throw new Error('Isolated P04 profile required');
const db=database();await migrate(db.pool);await migrateGames(db.pool);await migrateCatalog(db.pool);
const text={ru:'SYNTHETIC P04, not a public offer.',en:'SYNTHETIC P04, not a public offer.',tr:'SYNTHETIC P04, not a public offer.'};
const offer={version:'synthetic-p04-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
const rooms=new Rooms({pool:db.pool,keys:Keyring.fromFile(process.env.KEYRING_FILE),ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:process.env.APP_ORIGIN,now:()=>Number(readFileSync(process.env.P02_CLOCK_FILE,'utf8')),offer:()=>offer});
const games=new Games(rooms,()=>null,true);rooms.attachGames(games);
const catalog=new Catalog(rooms,games,new RevocationLedger(process.env.P04_LEDGER_FILE),testPacks(),true);games.attachCatalog(catalog);await catalog.reconcile('synthetic-startup');
const original=rooms.socketState.bind(rooms);
rooms.socketState=async(...args)=>{
  const bundle=await original(...args);
  if(readFileSync(process.env.P04_PAUSE_FILE,'utf8')==='pause') {writeFileSync(process.env.P04_PAUSE_FILE+'.ready','projected');while(readFileSync(process.env.P04_PAUSE_FILE,'utf8')==='pause') await new Promise(resolve=>setTimeout(resolve,10));}
  return bundle;
};
for(const [method,kind] of [['dispatchHttpView','public'],['dispatchHttpTarget','private']]) {
  const dispatch=games[method].bind(games);games[method]=async(...args)=>{
    if(readFileSync(process.env.P04_HTTP_PAUSE_FILE,'utf8')==='pause') {writeFileSync(process.env.P04_HTTP_PAUSE_FILE+'.'+kind+'.ready','prepared');while(readFileSync(process.env.P04_HTTP_PAUSE_FILE,'utf8')==='pause') await new Promise(resolve=>setTimeout(resolve,10));}
    return dispatch(...args);
  };
}
const app=await createApp({rooms,games,probe:async()=>{await schemaProbe(db.pool);await catalogSchemaProbe(db.pool);},schemaGeneration,logger:false,version:{service:'venus',version:'0.0.0',source_revision:process.env.P04_SOURCE_SHA,image_digest:'unreleased',contract_revision:'P00-2'}});
await app.listen({host:'127.0.0.1',port:0});console.log(JSON.stringify({test_server_port:app.server.address().port}));
let stopping=false;const stop=async()=>{if(stopping) return;stopping=true;await app.close();await db.close();if(process.connected) process.disconnect();};
process.on('message',message=>{if(message?.type==='shutdown') void stop();});process.once('SIGTERM',()=>void stop());
