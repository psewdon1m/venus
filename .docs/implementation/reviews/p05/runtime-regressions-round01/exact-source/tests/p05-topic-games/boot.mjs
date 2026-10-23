/** Actual new Node process. Lifecycle/source/safety remain declared fixtures. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {setTimeout,clearTimeout} from 'node:timers';
import Fastify from 'fastify';
import pg from 'pg';
import {Keyring,DeletionLedger,DomainError,requireThat} from '../../apps/api/dist/security.js';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {TopicGames} from '../../apps/api/dist/topic-games.js';
import {registerTopicGameRoutes} from '../../apps/api/dist/topic-game-routes.js';
import {sourceFixture,safetyFixture} from './fixtures.mjs';
export async function startBootWorker(directory,config){
 const path=join(directory,'boot-worker.json');writeFileSync(path,JSON.stringify(config),{mode:0o600});
 const worker=spawn(process.execPath,[fileURLToPath(import.meta.url),'--worker',path],{stdio:['ignore','pipe','pipe','ipc'],env:process.env});let stderr='';worker.stderr.on('data',v=>{stderr+=v.toString();});
 const ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.kill();reject(new Error('Boot worker ready timeout '+stderr));},20000);worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('exit',code=>{clearTimeout(timer);reject(new Error('Boot worker exited before ready '+code+' '+stderr));});worker.once('message',message=>{clearTimeout(timer);resolve(message);});});
 assert.equal(ready.type,'ready');assert.notEqual(ready.pid,process.pid);
 return {...ready,async close(){if(worker.exitCode!==null)return;const exited=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.kill();reject(new Error('Boot worker cleanup timeout'));},10000);worker.once('exit',code=>{clearTimeout(timer);if(code===0)resolve();else reject(new Error('Boot worker cleanup exit '+code+' '+stderr));});});worker.send({type:'shutdown'});await exited;}};
}
if(process.argv[2]==='--worker'){
 assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');assert.equal(process.platform,'linux');
 const config=JSON.parse(readFileSync(process.argv[3],'utf8')),pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim()}),keys=new Keyring('test',{test:config.key}),source=sourceFixture(),safety=safetyFixture();safety.states.set(config.room,config.safety);
 const rooms=new Rooms({pool,keys,ledger:new DeletionLedger(join(config.directory,'worker-deletions')),origin:'http://fixture.invalid',offer:()=>config.offer,now:()=>config.now,privateProtocol:{guard:async(_c,room,member)=>()=>requireThat(room===config.room&&(!member||config.members.includes(member)),'FIXTURE_LIFECYCLE_DENIED',403)}});
 const games=new TopicGames(rooms,{enabled:true,source:source.provider,safety:safety.provider,syntheticFixtureOnly:true});rooms.attachGames(games);safety.onRevoke((c,r,m)=>games.topicsChanged(c,r,m));
 // Explicit startup barrier completes before any HTTP listener is opened.
 const boot=await games.bootGate(),app=Fastify({logger:false});app.setErrorHandler((e,_r,p)=>p.code(e instanceof DomainError?e.statusCode:500).send({code:e instanceof DomainError?e.code:'INTERNAL_ERROR'}));
 const credential=r=>String(r.headers.cookie??'').match(/(?:^|;\s*)venus_room_session=([^;]+)/)?.[1];
 const read=async r=>{const c=credential(r);requireThat(r.headers.origin===rooms.options.origin&&r.headers['sec-fetch-site']==='same-origin'&&c&&r.headers['x-csrf-token']===rooms.csrf(c),'FIXTURE_GUARD',403);return c;};
 registerTopicGameRoutes(app,games,{roomId:r=>r.params.roomId,credential,origin:r=>requireThat(r.headers.origin===rooms.options.origin,'ORIGIN_REQUIRED',403),body:r=>r.body,memberGuard:read,privateReadGuard:read});const origin=await app.listen({host:'127.0.0.1',port:0});rooms.options.origin=origin;process.send({type:'ready',pid:process.pid,origin,boot});
 process.on('message',async m=>{if(m.type==='shutdown'){try{await app.close();await pool.end();process.exit(0);}catch{process.exit(1);}}});
}
