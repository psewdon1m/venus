/** Isolated synthetic test server. Never copied into the runtime image. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createApp} from '../../apps/api/dist/app.js';
import {database} from '../../apps/api/dist/database.js';
import {migrate,schemaProbe,schemaGeneration} from '../../apps/api/dist/migrations.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
if(process.env.VENUS_P02_INTEGRATION!=='1') throw new Error('Isolated test profile required');
const db=database();await migrate(db.pool);
const text={ru:'СИНТЕТИЧЕСКИЙ ТЕСТ. Не оферта.',en:'SYNTHETIC TEST. Not a public offer.',tr:'SENTETİK TEST. Kamuya açık teklif değildir.'};
const offer={version:process.env.P02_OFFER_VERSION??'synthetic-p02-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
const rooms=new Rooms({pool:db.pool,keys:Keyring.fromFile(process.env.KEYRING_FILE),ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:process.env.APP_ORIGIN,
  now:()=>Number(readFileSync(process.env.P02_CLOCK_FILE,'utf8')),offer:()=>process.env.P02_OFFER_DISABLED==='1'?null:offer});
await rooms.maintain();
const app=await createApp({rooms,probe:()=>schemaProbe(db.pool),schemaGeneration,version:{service:'venus',version:'0.0.0',source_revision:process.env.P02_SOURCE_SHA,image_digest:'unreleased',contract_revision:'P00-2'},staticRoot:fileURLToPath(new URL('../../apps/web/dist',import.meta.url)),logger:false});
await app.listen({host:'127.0.0.1',port:0});
const address=app.server.address();console.log(JSON.stringify({test_server_port:address.port}));
process.once('SIGTERM',()=>{void app.close().then(()=>db.close());});
process.once('SIGINT',()=>{void app.close().then(()=>db.close());});
