/** Actual PG/HTTP/filesystem composition. Only card/map source is synthetic. */
import assert from 'node:assert/strict';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,renameSync,chmodSync,unlinkSync,existsSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import pg from 'pg';
import {Keyring,DeletionLedger,hash} from '../../apps/api/dist/security.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {Games} from '../../apps/api/dist/games.js';
import {RoomGames} from '../../apps/api/dist/room-games.js';
import {TopicGames} from '../../apps/api/dist/topic-games.js';
import {TopicRoomDirectories} from '../../apps/api/dist/topic-room-directories.js';
import {TopicRoomLifecycle} from '../../apps/api/dist/topic-room-lifecycle.js';
import {TopicRoomRegistry} from '../../apps/api/dist/topic-room-registry.js';
import {PrivateTopicPreferences} from '../../apps/api/dist/private-topic-preferences.js';
import {createApp} from '../../apps/api/dist/app.js';
import {topicAad,loadTopicObject} from '../../apps/api/dist/topic-game-model.js';
import {sourceFixture} from '../p05-topic-games/fixtures.mjs';
export {migrate} from '../../apps/api/dist/migrations.js';
export {migrateGames} from '../../apps/api/dist/game-migrations.js';
export {migrateChat} from '../../apps/api/dist/chat-migrations.js';
export {migratePrivateTopics,privateTopicSchemaProbe} from '../../apps/api/dist/private-topic-migrations.js';
export {assert,randomUUID,hash,join,readFileSync,writeFileSync,renameSync,chmodSync,unlinkSync,existsSync,readdirSync};

export function harness(){
 assert.equal(process.platform,'linux');assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');
 const directory=mkdtempSync(join(tmpdir(),'venus-topic-lifecycle-')),pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim()}),source=sourceFixture(),keys=new Keyring('test',{test:randomBytes(32).toString('base64')});
 const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'];
 const parents=Object.fromEntries(names.map(n=>{const p=join(directory,n);mkdirSync(p,0o700);return[n,p];})),store=new TopicRoomDirectories(parents);
 const offer={version:'standalone-mock-lifecycle-1',digest:'sha256:'+createHash('sha256').update('MOCK Venus local pilot offer; explicit adult18 required').digest('hex'),synthetic:true,text:{ru:'MOCK 18+',en:'MOCK 18+',tr:'MOCK 18+'}};
 const acceptance={offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true};
 const pins={taxonomy:source.map.pins.taxonomy_digest,policy:createHash('sha256').update('VENUS-TLC-PRIVATE-TOPIC-POLICY-1').digest('hex'),vocabulary:source.map.topics.map(t=>t.topic_id)};
 let now=1000000,app,origin,queryHook=null;
 // Explicit SQL fault/wait selector only. Every normal query executes on the
 // actual PoolClient; hooks never replace lifecycle, safety or revocation.
 const wrapped={query:(...args)=>pool.query(...args),connect:async()=>{const c=await pool.connect();return {query:async(...args)=>{if(queryHook){const next=await queryHook(c,args);if(next)args=next;}return c.query(...args);},release:()=>c.release()};}};
 const storage=new TopicRoomLifecycle({keys,pins,directories:store.directories.bind(store),now:()=>now});let topics;
 const registry=new TopicRoomRegistry({storage,pins,provision:store.provision.bind(store),topicsChanged:(...args)=>topics.topicsChanged(...args)});
 const rooms=new Rooms({pool:wrapped,keys,ledger:new DeletionLedger(join(directory,'deletions')),origin:'http://unbound.invalid',offer:()=>offer,now:()=>now,privateProtocol:registry});
 const preferences=new PrivateTopicPreferences(rooms,registry,pins),safety={read:preferences.readForPlanner.bind(preferences),assertCurrent:preferences.assertPlannerCurrent.bind(preferences),excludeLocked:preferences.excludeForPlannerLocked.bind(preferences)};
 topics=new TopicGames(rooms,{enabled:true,privateTextChat:true,source:source.provider,safety,syntheticFixtureOnly:true});const legacy=new Games(rooms,()=>source.pack,true,true,true);rooms.attachGames(new RoomGames(legacy,topics));
 async function listen(){app=await createApp({rooms,games:legacy,topicGames:topics,privateTopics:preferences,logger:false,probe:()=>pool.query('SELECT 1'),version:{service:'venus',version:'fixture',source_revision:'root-frozen-run',image_digest:'root-runner',contract_revision:'P00-2'}});origin=await app.listen({host:'127.0.0.1',port:0});rooms.options.origin=origin;}
 function headers(actor,mutation=false){const credential=actor?.credential??actor?.admission;return {...(credential?{cookie:(actor.credential?'venus_room_session':'__Host-venus-admission')+'='+credential,'x-csrf-token':rooms.csrf(credential)}:{}),'sec-fetch-site':'same-origin',...(mutation?{origin:rooms.options.origin,'content-type':'application/json'}:{})};}
 async function call(actor,path,method='GET',body){const r=await fetch(origin+path,{method,headers:headers(actor,method!=='GET'),...(body===undefined?{}:{body:JSON.stringify(body)})}),raw=await r.text();let value;try{value=JSON.parse(raw);}catch{value={invalid_json:true};}return {status:r.status,body:value,raw,headers:r.headers};}
 async function ok(actor,path,method='GET',body,expected=200){const r=await call(actor,path,method,body);assert.equal(r.status,expected,JSON.stringify({path,method,status:r.status,response_code:r.body.code}));return r.body;}
 function sessionFrom(r,name){const values=r.headers.getSetCookie();const matches=values.map(v=>v.match(new RegExp('^'+name+'=([^;]+)'))).filter(Boolean);assert(matches.length);assert(matches.every(m=>m[1]===matches[0][1]));return decodeURIComponent(matches[0][1]);}
 async function admission(){const r=await call(null,'/api/v1/entry-policy');assert.equal(r.status,200);assert.equal(r.body.offer.digest,offer.digest);return {admission:sessionFrom(r,'__Host-venus-admission')};}
 async function create(protocol=2,{adult18=true,context='in_person'}={}){const actor=await admission(),r=await call(actor,`/api/v${protocol}/rooms`,'POST',{name:'Synthetic host',locale:'en',meeting_context:context,idempotency_key:randomUUID(),entry_acceptance:{...acceptance,adult18}});if(!adult18)return r;assert.equal(r.status,201,JSON.stringify({code:r.body.code,status:r.status}));return {room:r.body.room_id,invite:new URL(r.body.invite_url).hash.split('invite=')[1],host:{id:r.body.me.id,credential:sessionFrom(r,'venus_room_session')},members:[]};}
 async function joinRoom(f){const actor=await admission(),r=await call(actor,`/api/v1/rooms/${f.room}/join`,'POST',{invite_token:f.invite,display_name:'Synthetic peer',locale:'en',idempotency_key:randomUUID(),entry_acceptance:acceptance});assert.equal(r.status,200,JSON.stringify({code:r.body.code,status:r.status}));const peer={id:r.body.me.id,credential:sessionFrom(r,'venus_room_session')};f.members=[f.host,peer];return peer;}
 const roomPath=f=>`/api/v1/rooms/${f.room}`,base=f=>`/api/v2/rooms/${f.room}/game`,round=f=>base(f)+`/${f.game}/round/${f.plan.round_id}`;
 async function birth(f){const r=(await pool.query('SELECT * FROM private_topic_room_births WHERE room_id=$1',[f.room])).rows[0];assert(r);return {incarnation:r.incarnation,minimumSequence:Number(r.minimum_sequence),taxonomy_digest:r.taxonomy_digest,policy_digest:r.policy_digest};}
 async function roomView(f,actor=f.host){return ok(actor,roomPath(f));}
 async function getTopics(f,actor=f.host){return ok(actor,roomPath(f)+'/me/private-topics');}
 async function putTopics(f,actor,allow=pins.vocabulary){const v=await getTopics(f,actor);return ok(actor,roomPath(f)+'/me/private-topics','PUT',{request_id:randomUUID(),expected_rev:v.rev,taxonomy_digest:pins.taxonomy,allow_topic_ids:allow,exclude_topic_ids:[]});}
 async function exclude(f,actor,ids){return call(actor,roomPath(f)+'/me/private-topics/exclusions','POST',{request_id:randomUUID(),taxonomy_digest:pins.taxonomy,topic_ids:ids});}
 async function connect(f,actor){const t=await ok(actor,roomPath(f)+'/ws-ticket','POST',{request_id:randomUUID()});actor.grant=await rooms.connect(f.room,actor.credential,t.ticket);return actor.grant;}
 async function setup(f){for(const actor of f.members){await connect(f,actor);const p=await ok(actor,roomPath(f)+'/me/preferences');await ok(actor,roomPath(f)+'/me/preferences','PUT',{expected_rev:p.rev,idempotency_key:randomUUID(),comfort:4,edges:Object.fromEntries(f.members.filter(m=>m!==actor).map(m=>[m.id,'in_relationships']))});await putTopics(f,actor);}return f;}
 async function current(f){const g=(await pool.query('SELECT * FROM game_sessions WHERE room_id=$1 ORDER BY seq DESC LIMIT 1',[f.room])).rows[0];assert(g);f.game=g.id;if(g.current_round){const row=(await pool.query('SELECT * FROM game_rounds WHERE session_id=$1 AND round_index=$2',[g.id,g.current_round])).rows[0];f.data=keys.decrypt(row.cipher,topicAad.round(f.room,g.id,row.id));f.plan=f.data.plan;}return g;}
 async function game(f){const v=await roomView(f),prepared=await ok(f.host,base(f)+'/prepare','POST',{request_id:randomUUID(),expected_rev:v.room_rev,mode:'questions',round_count:20,players:f.members.map(m=>m.id)});await ok(f.host,base(f)+'/start','POST',{request_id:randomUUID(),draft_rev:prepared.game_rev});await current(f);return f;}
 async function actorInvitation(f){for(const id of f.plan.actors){const a=f.members.find(m=>m.id===id),v=await ok(a,round(f)+'/target');if(v.invitation?.state==='pending'&&v.invitation.own_state!=='accepted')await ok(a,round(f)+'/response','POST',{request_id:randomUUID(),kind:'accept',scope:'invitation',offer_id:v.invitation.offer_id,proposal_revision:v.invitation.proposal_revision});}}
 async function privateRound({beforeGame,context='in_person'}={}){for(let attempt=0;attempt<3;attempt++){const f=await create(2,{context});await joinRoom(f);await setup(f);await beforeGame?.(f);await game(f);for(let n=0;n<20;n++){if(f.plan.interaction==='pair_private'){await actorInvitation(f);return f;}const actor=f.members.find(m=>m.id===f.plan.primary_member_id);await ok(actor,round(f)+'/response','POST',{request_id:randomUUID(),kind:'skip'});const g=await current(f);await ok(f.host,base(f)+`/${f.game}/round/advance`,'POST',{request_id:randomUUID(),expected_rev:Number(g.rev)});await current(f);}}throw Error('No private opportunity in bounded actual-admission sessions');}
 async function release(f){for(const id of f.plan.actors){const actor=f.members.find(m=>m.id===id),v=await ok(actor,round(f)+'/conversation');assert(v.offer);await ok(actor,round(f)+'/conversation/commands','POST',{request_id:randomUUID(),kind:'respond_topic',offer_id:v.offer.offer_id,epoch:v.epoch,proposal_revision:v.offer.proposal_revision,token:v.offer.token,decision:'accept'});}const v=await ok(f.host,round(f)+'/conversation');assert(v.prompt?.text.includes('SYNTHETIC'));return v;}
 async function mutateRoom(f,actor,operation){const expected=operation==='leave'?0:(await roomView(f,actor)).room_rev;return call(actor,roomPath(f)+'/'+operation,'POST',{idempotency_key:randomUUID(),expected_rev:expected});}
 async function withFault(kind,f,fn){const path=kind==='parent'?parents.personalChainDirectory:join(parents.personalChainDirectory,f.room,'chain');let saved;if(kind==='corrupt'){saved=readFileSync(path);const b=Buffer.from(saved);b[24]^=1;writeFileSync(path,b);}else renameSync(path,path+'.fixture-detached');try{return await fn();}finally{if(kind==='corrupt')writeFileSync(path,saved);else renameSync(path+'.fixture-detached',path);}}
 async function cleanup(){await app?.close();await pool.end();const path=resolve(directory);assert(path.startsWith(resolve(tmpdir())+sep)&&path.includes('venus-topic-lifecycle-'));rmSync(path,{recursive:true,force:true});}
 return {directory,pool,wrapped,source,keys,pins,parents,store,storage,registry,rooms,preferences,topics,legacy,offer,acceptance,listen,admission,create,joinRoom,setup,connect,game,privateRound,release,current,birth,roomView,roomPath,base,round,call,ok,getTopics,putTopics,exclude,mutateRoom,withFault,cleanup,loadObject:(scope)=>loadTopicObject(pool,keys,scope),loadObjectClient:(c,scope)=>loadTopicObject(c,keys,scope),time:()=>now,tick:ms=>{now+=ms;},setQueryHook:fn=>{queryHook=fn;},freshLegacyLedger:()=>new DeletionLedger(join(directory,'empty-old-legacy-'+randomUUID()))};
}
