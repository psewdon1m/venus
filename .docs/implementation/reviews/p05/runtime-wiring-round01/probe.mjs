/** Static preflight support only: exact captured TS implementation, transpiled
 * locally; explicit SQL rows/doubles. No Docker, PostgreSQL or websocket proof. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=resolve('.docs/implementation/reviews/p05/runtime-wiring-round01');
let source=readFileSync(resolve(dir,'exact-source/apps/api/src/topic-games.ts'),'utf8');
for(const name of ['rooms','security','topic-game-model'])source=source.replaceAll(`'./${name}.js'`,JSON.stringify(pathToFileURL(resolve('apps/api/dist',name+'.js')).href));
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
writeFileSync(resolve(dir,'captured-topic-games.mjs'),output);
const {TopicGames}=await import(pathToFileURL(resolve(dir,'captured-topic-games.mjs')).href);
const {DomainError,Keyring}=await import(pathToFileURL(resolve('apps/api/dist/security.js')).href);
for(const state of ['active','paused','completed'])test('RW-002 feature-off room socket survives retained '+state+' game',async()=>{
 const rooms={now:()=>1000,options:{}},games=new TopicGames(rooms,{enabled:false,source:{active:async()=>null,pinned:async()=>{throw Error('must not be reached');},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('must not be reached');},excludeLocked:async()=>{throw Error('must not be reached');},assertCurrent:()=>{}}});
 games.row=async()=>({id:'session',room_id:'room',state,current_round:1,rev:'3'});
 const c={query:async()=>({rows:[]})};
 try {const view=await games.socketView(c,'room','member','en',0);assert.deepEqual(view.privateEvents,[]);}
 catch(error){console.log(JSON.stringify({state,actual_error:error.code,ordinary_room_socket_path:'Rooms.socketState -> TopicGames.socketView -> source -> production route catch closes4401'}));assert.fail('Ordinary room snapshot rejects '+error.code);}
});
test('RW-002 feature-off public delivery retains generic/null projection',async()=>{
 const games=new TopicGames({now:()=>1000,options:{}},{enabled:false,source:{active:async()=>null,pinned:async()=>null,assertCurrent:()=>{}},safety:{read:async()=>null,excludeLocked:async()=>null,assertCurrent:()=>{}}});games.row=async()=>({id:'session',room_id:'room',state:'paused',current_round:1,rev:'3'});
 await assert.doesNotReject(games.publicDelivery({query:async()=>({rows:[]})},'room','en'));
});
test('feature-off intentional ordinary source lookup denies rather than enabling starts',async()=>{
 const games=new TopicGames({now:()=>1000,options:{}},{enabled:false,source:{active:async()=>null,pinned:async()=>null,assertCurrent:()=>{}},safety:{read:async()=>null,excludeLocked:async()=>null,assertCurrent:()=>{}}});
 await assert.rejects(games.source({query:async()=>({rows:[]})}),e=>e instanceof DomainError&&e.code==='TOPIC_GAMES_DISABLED');
});
for(const state of ['active','paused','completed'])test('RW-003 expected catalogue-ledger outage preserves ordinary room projection for '+state,async()=>{
 const keys=new Keyring('test',{test:Buffer.alloc(32,9).toString('base64')}),pins={map_sha256:'a'.repeat(64)};
 const games=new TopicGames({now:()=>1000,options:{keys}},{enabled:true,source:{active:async()=>null,pinned:async()=>{throw new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('Safety must not be reached');},excludeLocked:async()=>null,assertCurrent:()=>{}}});
 games.row=async()=>({id:'session',room_id:'room',state,current_round:1,rev:'3'});
 const c={query:async sql=>({rows:sql.includes('pins_cipher')?[{pins_cipher:keys.encrypt(pins,'topic-game-pins:room:session:2')}]:[]})};
 try {const view=await games.socketView(c,'room','member','en',0);assert.deepEqual(view.privateEvents,[]);}
 catch(error){console.log(JSON.stringify({state,actual_error:error.code,source:'EXPLICIT_PROVIDER_DOMAIN_ERROR_MATCHING_PRODUCTION_LEDGER_NORMALIZATION'}));assert.fail('Ordinary room snapshot rejects '+error.code);}
});
