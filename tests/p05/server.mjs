import {writeFileSync} from 'node:fs';
import {servingBarrier} from '../../apps/api/dist/protected-runtime.js';
/** Only this test process constructs an explicitly synthetic provider. Never an OCI production entry point. */
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {Media} from '../../apps/api/dist/media.js';
import {migrateMedia} from '../../apps/api/dist/media-migrations.js';
import {provisionMedia} from '../../tools/media-provision.mjs';
import {Music} from '../../apps/api/dist/music.js';
import {MusicCatalog} from '../../apps/api/dist/music-catalog.js';
import {migrateMusic} from '../../apps/api/dist/music-migrations.js';
import {createMusicDemo} from '../../tools/music-demo.mjs';
import {existsSync} from 'node:fs';
import {createApp} from '../../apps/api/dist/app.js';
import {database} from '../../apps/api/dist/database.js';
import {migrate,schemaProbe,schemaGeneration} from '../../apps/api/dist/migrations.js';
import {migrateGames,engineSchemaProbe} from '../../apps/api/dist/game-migrations.js';
import {migrateChat,chatSchemaProbe} from '../../apps/api/dist/chat-migrations.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {p05Pack} from './fixtures.mjs';
if(process.env.VENUS_P05_ISOLATED_FIXTURE!=='1') throw new Error('Isolated fixture process required');
const pack=p05Pack();
const db=database();await migrate(db.pool);await migrateGames(db.pool);await migrateChat(db.pool);
const text={ru:'SYNTHETIC P05 — 18+, local fixture only.',en:'SYNTHETIC P05 — 18+, local fixture only.',tr:'SYNTHETIC P05 — 18+, local fixture only.'};
const offer={version:'synthetic-p05-1',digest:'sha256:'+hash(JSON.stringify(text)),text,synthetic:true};
const rooms=new Rooms({pool:db.pool,keys:Keyring.fromFile(process.env.KEYRING_FILE),ledger:new DeletionLedger(process.env.DELETION_LEDGER_FILE),origin:process.env.APP_ORIGIN,now:()=>Date.now()+Number(readFileSync(process.env.P05_CLOCK_FILE,'utf8')),offer:()=>offer});
const games=new Games(rooms,()=>pack,true,true,true);rooms.attachGames(games);await games.reconcilePublicPairPolicy();
let music;
if(process.env.VENUS_P05_MUSIC_FIXTURE==='1'){await migrateMusic(db.pool);const dir=join(dirname(process.env.KEYRING_FILE),'music');if(!existsSync(dir))createMusicDemo(dir);music=new Music(rooms,new MusicCatalog(join(dir,'catalog.json'),true));}
let media;
if(process.env.VENUS_P09_MEDIA_FIXTURE==='1'){await migrateMedia(db.pool);const root='/media-fixture/venus';const files=existsSync(root)?{keyFile:join(root,'key.json'),authorityDirectory:join(root,'authority')}:provisionMedia(root);media=new Media(rooms,{...files,internalOrigin:'http://media:7890',callsEnabled:process.env.VENUS_P11_CALLS_FIXTURE==='1'},music);await media.bootGate();}
const barrier=process.env.P05_SERVING_GATE_FILE?servingBarrier(process.env.P05_SERVING_GATE_FILE):undefined;if(barrier)rooms.attachServingBarrier(barrier);
const mediaFaultFile=join(dirname(process.env.KEYRING_FILE),'media-fault.json');let mediaFault=media&&existsSync(mediaFaultFile)?JSON.parse(readFileSync(mediaFaultFile,'utf8')):{admin:false,quiesce:false};if(media){const remove=media.client.removeParticipant.bind(media.client),del=media.client.deleteRoom.bind(media.client),control=media.control.bind(media);media.client.removeParticipant=(...a)=>{if(mediaFault.admin)throw Error('SYNTHETIC_ADMIN_FAILURE');return remove(...a);};media.client.deleteRoom=(...a)=>{if(mediaFault.admin)throw Error('SYNTHETIC_ADMIN_FAILURE');return del(...a);};media.control=(action)=>{if(action==='quiesce'&&mediaFault.quiesce)throw Error('SYNTHETIC_QUIESCE_FAILURE');return control(action);};}
const app=await createApp({rooms,games,...(barrier?{servingBarrier:barrier}:{}),...(media?{media}:{}),...(music?{music}:{}),probe:async()=>{await schemaProbe(db.pool);await engineSchemaProbe(db.pool);await chatSchemaProbe(db.pool);},schemaGeneration,staticRoot:resolve('apps/web/dist'),logger:{level:'info'},version:{service:'venus',version:'0.0.0',source_revision:'isolated-p05-fixture',image_digest:'unreleased',contract_revision:'P00-2'}});
if(process.env.VENUS_P11_CALLS_FIXTURE==='1')app.get('/fixture/p11-sdk.js',async(_request,reply)=>reply.type('application/javascript').send(readFileSync('node_modules/livekit-client/dist/livekit-client.umd.js')));
await app.listen({host:media?'0.0.0.0':'127.0.0.1',port:media?4300:0});console.log(JSON.stringify({test_server_port:app.server.address().port,synthetic:true,pack_digest:pack.digest}));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await app.close();await db.close();if(process.connected)process.disconnect();}
process.on('message',message=>{if(message?.type==='shutdown')void stop();if(media&&message?.type==='p09-media-fault'&&typeof message.admin==='boolean'&&typeof message.quiesce==='boolean'){mediaFault={admin:message.admin,quiesce:message.quiesce};writeFileSync(mediaFaultFile,JSON.stringify(mediaFault));process.send?.({p09_ack:message.id});}});process.once('SIGTERM',()=>void stop());
