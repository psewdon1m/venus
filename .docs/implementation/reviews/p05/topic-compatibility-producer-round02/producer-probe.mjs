import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ts from '../../../../../node_modules/typescript/lib/typescript.js';
const base='.docs/implementation/reviews/p05/topic-compatibility-producer-round02';
const text=fs.readFileSync(base+'/producer/integration.mjs.bytes','utf8');
const tree=ts.createSourceFile('producer.mjs',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const functions=new Map(tree.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText(tree)]));
const handlers=new Map();
function walk(n){if(ts.isCallExpression(n)&&n.expression.getText(tree)==='check'&&ts.isStringLiteral(n.arguments[0]))handlers.set(n.arguments[0].text,n.arguments[1].getText(tree));ts.forEachChild(n,walk);}walk(tree);
const results=[];
for(const variant of ['unsupported409','missing503','unexpected200','wrong_status','wrong_code','changed_state','changed_rev','changed_snapshot','changed_digest','changed_round','receipt_written','not_waiting']){
 const before={state:variant==='not_waiting'?'active':'waiting',rev:'17',snapshot_cipher:null,pack_digest:null,current_round:0};let select=0,calls=0,request;
 const expectedStatus=variant==='missing503'?503:409, expectedCode=variant==='missing503'?'TOPIC_HISTORY_UNAVAILABLE':'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED';
 const h={base:f=>'/rooms/'+f.room+'/games',call:async(actor,url,method,body)=>{calls++;assert.equal(actor,'host');assert.equal(url,'/rooms/room-A/games/start');assert.equal(method,'POST');assert.equal(body.draft_rev,17);request=body.request_id;return{status:variant==='unexpected200'?200:variant==='wrong_status'?503:expectedStatus,body:{code:variant==='wrong_code'?'OTHER':expectedCode}};},pool:{query:async(sql,args)=>{if(sql.startsWith('SELECT state,')){assert.deepEqual(Array.from(args),['room-A','session-A']);select++;const row={...before};if(select===2){const key={changed_state:'state',changed_rev:'rev',changed_snapshot:'snapshot_cipher',changed_digest:'pack_digest',changed_round:'current_round'}[variant];if(key)row[key]='CHANGED';}return{rows:[row]};}assert(sql.includes('topic_game_requests'));assert.deepEqual(Array.from(args),['room-A',request]);return{rows:[{count:variant==='receipt_written'?'1':'0'}]};}}};
 const context=vm.createContext({h,assert,randomUUID:()=> 'fixed-request'});vm.runInContext(functions.get('deniedStart')+';globalThis.invoke=deniedStart',context);
 let error;try{await context.invoke({room:'room-A',game:'session-A',host:'host'},expectedStatus,expectedCode);}catch(e){error=e;}
 const positive=['unsupported409','missing503'].includes(variant);assert.equal(!error,positive,variant);if(variant==='not_waiting')assert.equal(calls,0);else assert.equal(calls,1);
 results.push({variant,expected:positive?'ACCEPT':'REJECT',status:'PASS',http_calls:calls});
}
// Execute exact case01 handler with only explicit inert transport/storage doubles.
for(const variant of ['positive','zero_projection','zero_refs']){
 const baselineSnapshot=Buffer.from('synthetic-cipher');
 const h={pool:{query:async(sql)=>({rows:sql.startsWith('SELECT kind')?[{kind:'conversation'},{kind:'chat'},...(variant==='zero_projection'?[]:[{kind:'projection'}])]:[{count:variant==='zero_refs'?'0':'2'}]})},listen:async()=>{},privateRound:async()=>({room:'r',game:'s',host:'actor'}),release:async()=>({prompt:'synthetic',conversation_id:'c',epoch:1}),round:()=>'/round',call:async()=>({status:200})};
 const noop=async()=>{},context=vm.createContext({assert,h,TOPIC_ALGORITHM:'RE-1.P05-TOPIC-2',migrate:noop,migrateGames:noop,migrateChat:noop,migratePrivateTopics:noop,privateTopicSchemaProbe:noop,randomUUID:()=> 'id',snapshot:async()=>baselineSnapshot,history:async()=>({objects:[{kind:'history'}],chunks:[{}]})});
 let error;try{await vm.runInContext('('+handlers.get('P05-COMPAT-01')+')()',context);}catch(e){error=e;}assert.equal(!error,variant==='positive',variant);results.push({variant,expected:variant==='positive'?'ACCEPT':'REJECT',status:'PASS'});
}
// Exact handlers 04/05 must call the helper and preserve the historical scope.
for(const id of ['P05-COMPAT-04','P05-COMPAT-05']){
 let starts=0;const f={room:'room-A',game:'new-session',oldSession:'old-session',host:'host'},baseline={unsupportedSnapshot:null,history:{objects:[{}],chunks:[{}]}};
 const expected=id.endsWith('04')?[409,'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED']:[503,'TOPIC_HISTORY_UNAVAILABLE'];
 const h={base:()=>'/base',call:async()=>({status:503,body:{code:expected[1]}}),pool:{query:async()=>({rows:[{state:'aborted',current_round:1,pack_digest:'digest',snapshot_cipher:null}]})}};
 const context=vm.createContext({assert,h,f,baseline,prepare:async()=>{f.game='next-session';},deniedStart:async(actual,status,code)=>{starts++;assert.equal(actual,f);assert.deepEqual([status,code],expected);return{status,code};},snapshot:async()=>null,history:async()=>baseline.history});
 await vm.runInContext('('+handlers.get(id)+')()',context);assert.equal(starts,1);results.push({variant:id+'_required_start',expected:expected,status:'PASS'});
}
const syntax=[];for(const name of ['integration.mjs','runner.mjs','prepare-runner.mjs']){const child=spawnSync(process.execPath,['--check','--input-type=module'],{input:fs.readFileSync(base+'/producer/'+name+'.bytes'),encoding:'utf8'});assert.equal(child.status,0,child.stderr);syntax.push({name,exit_code:child.status});}
const result={status:'PASS',scope:'EXACT_AST_FUNCTIONS_INERT_VM_NO_HTTP_NO_PG',integration_sha256:crypto.createHash('sha256').update(text).digest('hex'),checks:results.length,results,syntax};fs.writeFileSync(base+'/producer-probe-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
