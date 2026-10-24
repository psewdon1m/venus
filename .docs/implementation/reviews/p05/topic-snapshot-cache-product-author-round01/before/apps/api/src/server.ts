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
import {migrateCatalog,catalogSchemaProbe} from './catalog-migrations.js';
import {Catalog} from './catalog.js';
import {RevocationLedger,bundledPacks,ownerProvisionalPilot} from '@venus/card-catalog';
import {entryProfile} from './entry-profile.js';
import {migrateChat,chatSchemaProbe} from './chat-migrations.js';
import {privateChatEnabled} from './private-chat.js';
import {migratePrivateTopics,privateTopicSchemaProbe} from './private-topic-migrations.js';
import {TopicRoomDirectories} from './topic-room-directories.js';
import {TopicRoomLifecycle} from './topic-room-lifecycle.js';
import {TopicRoomRegistry} from './topic-room-registry.js';
import {PrivateTopicPreferences} from './private-topic-preferences.js';
import {TopicGames} from './topic-games.js';
import {RoomGames} from './room-games.js';
import {ReleaseTopicGameSource,OwnerProvisionalTopicGameSource,pilotAdmissionEnabled,legacyReleaseCatalog,bootstrapPilotCatalog} from './topic-game-source.js';
import {topicGamesEnabled,releasedRoomTopicProfile,topicStorageDirectories} from './topic-runtime.js';
import {requireThat} from './security.js';
let db:ReturnType<typeof database>|undefined;
async function main() {
  const metadata=JSON.parse(readFileSync(new URL('../../../build-metadata.json',import.meta.url),'utf8')) as {version:string;source_revision:string};
  const version:Version={service:'venus',version:metadata.version,source_revision:metadata.source_revision,image_digest:process.env.IMAGE_DIGEST??'unreleased',contract_revision:'P00-2'};
  if(!process.env.KEYRING_FILE||!process.env.DELETION_LEDGER_FILE||!process.env.APP_ORIGIN) throw new Error('External dependencies required');
  const origin=new URL(process.env.APP_ORIGIN);if(origin.origin!==process.env.APP_ORIGIN||origin.protocol!=='https:') throw new Error('HTTPS origin required');
  const offer=entryProfile(process.env.VENUS_DEPLOYMENT_PROFILE,origin.origin);
  const privateTextChat=privateChatEnabled(process.env.VENUS_PRIVATE_TEXT_CHAT);
  const privateTopicsEnabled=topicGamesEnabled(process.env.VENUS_PRIVATE_TOPICS);
  const pilotConfig={deploymentProfile:process.env.VENUS_DEPLOYMENT_PROFILE,origin:origin.origin,privateTopicsEnabled};
  const pilotEnabled=pilotAdmissionEnabled(pilotConfig);
  db=database();const pool=db.pool;
  const keys=Keyring.fromFile(process.env.KEYRING_FILE),ledger=new DeletionLedger(process.env.DELETION_LEDGER_FILE);
  await migrate(pool);await migrateGames(pool);await migrateCatalog(pool);await migrateChat(pool);await migratePrivateTopics(pool);
  const existing=(await pool.query<{present:boolean}>('SELECT EXISTS(SELECT 1 FROM rooms WHERE private_protocol=2) AS present')).rows[0]!.present;
  let topicGames:TopicGames|undefined,privateTopics:PrivateTopicPreferences|undefined,registry:TopicRoomRegistry|undefined;
  // Existing pilot rooms retain taxonomy metadata for the source-independent boot
  // revocation barrier even when admission is disabled. This does not grant cards.
  const pilotMetadata=pilotEnabled||existing&&bundledPacks.length===0;
  const profile=privateTopicsEnabled||existing?releasedRoomTopicProfile(pilotMetadata):null;
  if(privateTopicsEnabled||existing) requireThat(profile,'TOPIC_RELEASE_PROFILE_REQUIRED',503);
  if(profile) {
    const incompatible=(await pool.query(`SELECT 1 FROM rooms r LEFT JOIN private_topic_room_births b ON b.room_id=r.id
      WHERE r.private_protocol=2 AND (b.room_id IS NULL OR b.taxonomy_digest<>$1 OR b.policy_digest<>$2) LIMIT 1`,[profile.pins.taxonomy,profile.pins.policy])).rowCount;
    requireThat(!incompatible,'TOPIC_PROFILE_COMPATIBILITY_REQUIRED',503);
    const directories=new TopicRoomDirectories(topicStorageDirectories(process.env));
    const storage=new TopicRoomLifecycle({keys,pins:profile.pins,directories:directories.directories.bind(directories),now:Date.now});
    registry=new TopicRoomRegistry({storage,pins:profile.pins,provision:directories.provision.bind(directories),topicsChanged:async(c,room,owner)=>{
      requireThat(topicGames,'TOPIC_RUNTIME_UNAVAILABLE',503);await topicGames.topicsChanged(c,room,owner);
    }});
  }
  const rooms=new Rooms({pool,keys,ledger,origin:origin.origin,offer:()=>offer,...(registry?{privateProtocol:registry}:{})}),games=new Games(rooms,()=>null,false,privateTextChat,true);
  const revocations=process.env.CATALOG_REVOCATION_LEDGER_FILE?new RevocationLedger(process.env.CATALOG_REVOCATION_LEDGER_FILE):null;
  const catalog=revocations?new Catalog(rooms,{withdrawPacks:async(c,digests)=>{await games.withdrawPacks(c,digests);await topicGames?.withdrawPacks(c,digests);}},revocations,pilotEnabled?[...bundledPacks,ownerProvisionalPilot.pack]:bundledPacks):null;
  if(catalog)games.attachCatalog(legacyReleaseCatalog(catalog));
  if(profile&&registry) {
    requireThat(catalog&&revocations,'CATALOG_LEDGER_REQUIRED',503);
    privateTopics=new PrivateTopicPreferences(rooms,registry,profile.pins,profile.topics);
    topicGames=new TopicGames(rooms,{enabled:privateTopicsEnabled&&(!pilotMetadata||pilotEnabled),privateTextChat,source:pilotMetadata?new OwnerProvisionalTopicGameSource(catalog,revocations,pilotConfig):new ReleaseTopicGameSource(catalog,revocations),
      safety:{read:privateTopics.readForPlanner.bind(privateTopics),assertCurrent:privateTopics.assertPlannerCurrent.bind(privateTopics),excludeLocked:privateTopics.excludeForPlannerLocked.bind(privateTopics)}});
  }
  rooms.attachGames(registry?new RoomGames(games,topicGames??null):games);
  // Startup grants never survive a database restore or an API process restart.
  // This barrier is source-independent and must complete before listen/admission.
  await topicGames?.bootGate();
  if(pilotEnabled&&catalog)await bootstrapPilotCatalog(catalog);
  // Neither environment nor network can supply card bytes or approval records.
  await catalog?.reconcile('startup');
  await games.reconcilePublicPairPolicy();await rooms.maintain();
  const app=await createApp({probe:async()=>{await schemaProbe(pool);await engineSchemaProbe(pool);await catalogSchemaProbe(pool);await chatSchemaProbe(pool);await privateTopicSchemaProbe(pool);},schemaGeneration,rooms,games,...(privateTopics?{privateTopics}:{}),...(topicGames?{topicGames}:{}),roomCreationProtocol:privateTopicsEnabled?2:1,version,staticRoot:fileURLToPath(new URL('../../web/dist',import.meta.url))});
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>{void app.close().then(()=>pool.end()).catch(()=>{process.exitCode=1;});});
  await app.listen({port:4300,host:'0.0.0.0'});
}
void main().catch(async()=>{
  // Never print startup exceptions: malformed key/secret files may appear in parser diagnostics.
  process.stderr.write(JSON.stringify({level:50,event:'startup_failed',code:'STARTUP_UNAVAILABLE'})+'\n');
  await db?.close().catch(()=>{});process.exitCode=1;
});
