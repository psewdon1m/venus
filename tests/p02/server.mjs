/** Isolated synthetic test server. Never copied into the runtime image. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createApp} from '../../apps/api/dist/app.js';
import {database} from '../../apps/api/dist/database.js';
import {migrate,schemaProbe,schemaGeneration} from '../../apps/api/dist/migrations.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {migrateGames,engineSchemaProbe} from '../../apps/api/dist/game-migrations.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
if(process.env.VENUS_P02_INTEGRATION!=='1') throw new Error('Isolated test profile required');
const db=database();await migrate(db.pool);await migrateGames(db.pool);
const text={ru:'СИНТЕТИЧЕСКИЙ ТЕСТ. Не оферта.',en:'SYNTHETIC TEST. Not a public offer.',tr:'SENTETİK TEST. Kamuya açık teklif değildir.'};
const offer={version:process.env.P02_OFFER_VERSION??'synthetic-p02-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
const rooms=new Rooms({pool:db.pool,keys:Keyring.fromFile(process.env.KEYRING_FILE),ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:process.env.APP_ORIGIN,
  now:()=>Number(readFileSync(process.env.P02_CLOCK_FILE,'utf8')),offer:()=>process.env.P02_OFFER_DISABLED==='1'?null:offer});
let pack=null;
if(process.env.VENUS_P03_INTEGRATION==='1'&&process.env.P03_PACK_DISABLED!=='1') {
  const {syntheticCards,syntheticManifest}=await import('../p03/fixtures.mjs');const {FrozenPack,digest,policyDigest}=await import('../../packages/relationship-engine/dist/index.js');
  const limit=Number(process.env.P03_PUBLIC_CARD_LIMIT??100);
  if(!Number.isSafeInteger(limit)||limit<1||limit>100) throw new Error('Invalid synthetic public-card limit');
  const cards=syntheticCards().filter(card=>Number(card.id.split('-')[1])>100||Number(card.id.split('-')[1])<=limit),revision=process.env.P03_PACK_REVISION==='2'?2:1;
  if(process.env.P03_PRIVATE_IN_PERSON_ONLY==='1') for(const card of cards) if(card.interaction==='pair_private') {card.meeting_contexts=['in_person'];card.required_capabilities=[];}
  if(revision===2) for(const card of cards) {card.revision=2;for(const text of Object.values(card.text)) for(const key of Object.keys(text)) text[key]+=' revision 2';}
  pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest,revision),true);
}
const games=new Games(rooms,()=>pack,process.env.VENUS_P03_INTEGRATION==='1');rooms.attachGames(games);
await rooms.maintain();
const app=await createApp({rooms,games,probe:async()=>{await schemaProbe(db.pool);await engineSchemaProbe(db.pool);},schemaGeneration,version:{service:'venus',version:'0.0.0',source_revision:process.env.P02_SOURCE_SHA,image_digest:'unreleased',contract_revision:'P00-2'},staticRoot:fileURLToPath(new URL('../../apps/web/dist',import.meta.url)),logger:false});
await app.listen({host:'127.0.0.1',port:0});
const address=app.server.address();console.log(JSON.stringify({test_server_port:address.port}));
let shutdown;
function stop() {
  shutdown??=app.close().then(()=>db.close()).finally(()=>{if(process.connected) process.disconnect();});
  void shutdown.catch(()=>{process.exitCode=1;});
}
process.once('SIGTERM',stop);process.once('SIGINT',stop);
process.on('message',message=>{if(message?.type==='shutdown') stop();});
