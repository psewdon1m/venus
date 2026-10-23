/** Independent exact-AST static probes; inert HTTP/SQL stubs, no Docker/PG. */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';import ts from 'typescript';
const dir=path.resolve('.docs/implementation/reviews/p05/topic-chat-producer-round03'),file=path.join(dir,'source/artifacts__p05-topic-chat-policy__integration.mjs'),source=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),rows=[];
const functions=new Map(tree.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n]));
async function check(id,fn){try{await fn();rows.push({id,status:'PASS'});}catch(e){rows.push({id,status:'FAIL',message:e.message});}}
const deniedSource=functions.get('denied').getText(tree);
for(const [id,response,expected] of [
 ['denial_404',{status:404,body:{code:'PRIVATE_CHAT_UNAVAILABLE'},raw:'{}'},true],
 ['denial_409',{status:409,body:{code:'ROUND_NOT_ACTIVE'},raw:'{}'},true],
 ['reject_200',{status:200,body:{code:'PRIVATE_CHAT_UNAVAILABLE'},raw:'{}'},false],
 ['reject_500',{status:500,body:{code:'PRIVATE_CHAT_UNAVAILABLE'},raw:'{}'},false],
 ['reject_302',{status:302,body:{code:'PRIVATE_CHAT_UNAVAILABLE'},raw:'{}'},false],
 ['reject_unexpected_code',{status:404,body:{code:'UNRELATED'},raw:'{}'},false],
 ['reject_private_body',{status:404,body:{code:'PRIVATE_CHAT_UNAVAILABLE'},raw:'SYNTHETIC CHAT'},false],
])await check(id,async()=>{const denied=vm.runInNewContext('('+deniedSource+')',{assert,h:{call:async()=>response}});let accepted=false;try{await denied({},'/');accepted=true;}catch{}assert.equal(accepted,expected);});
let hookNode;function walk(n){if(ts.isCallExpression(n)&&n.expression.getText(tree)==='h.setQueryHook'&&n.arguments[0]&&ts.isArrowFunction(n.arguments[0]))hookNode=n.arguments[0];ts.forEachChild(n,walk);}walk(tree);assert(hookNode);
const hookSource=hookNode.getText(tree),f={room:'room-A',game:'game-A'},a={credential:'credential-A'},hash=x=>'hash:'+x;
function harness(){const state={f,a,hash,seen:new WeakMap(),matched:false,key:746826633,entered:0,unhooked:0};state.resolveEntered=()=>state.entered++;state.h={setQueryHook:v=>{assert.equal(v,null);state.unhooked++;}};const context=vm.createContext(state),hook=vm.runInContext('('+hookSource+')',context);return {state,hook};}
const object=(room=f.room,game=f.game,kind='chat')=>['SELECT revision,chunk_count,byte_length FROM topic_game_objects WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4',[room,game,'object-A',kind]],credentials=(room=f.room,credential=a.credential)=>['SELECT s.expires_at FROM sessions s WHERE credential=$1 AND room_id=$2',[hash(credential),room]];
for(const [id,steps,expected]of [
 ['selector_requires_prior_chat',[['final','c1']],false],
 ['selector_correct_same_client',[['chat','c1'],['final','c1']],true],
 ['selector_rejects_other_client',[['chat','c1'],['final','c2']],false],
 ['selector_begin_resets_client',[['chat','c1'],['begin','c1'],['final','c1']],false],
 ['selector_rejects_wrong_room',[['wrong_room','c1'],['final','c1']],false],
 ['selector_rejects_wrong_session',[['wrong_game','c1'],['final','c1']],false],
 ['selector_rejects_nonchat_object',[['wrong_kind','c1'],['final','c1']],false],
 ['selector_rejects_wrong_final_credential',[['chat','c1'],['wrong_credential','c1']],false],
 ['selector_rejects_wrong_final_room',[['chat','c1'],['wrong_final_room','c1']],false],
])await check(id,async()=>{const {hook,state}=harness(),clients={c1:{},c2:{}};let selected;for(const [step,client]of steps){const args=step==='chat'?object():step==='final'?credentials():step==='begin'?['BEGIN']:step==='wrong_room'?object('room-B'):step==='wrong_game'?object(f.room,'game-B'):step==='wrong_kind'?object(f.room,f.game,'advice'):step==='wrong_credential'?credentials(f.room,'credential-B'):credentials('room-B');const result=await hook(clients[client],args);if(result)selected={args,result};}assert.equal(Boolean(selected),expected);assert.equal(state.entered,expected?1:0);assert.equal(state.unhooked,expected?1:0);if(selected){assert.equal(selected.result[0],selected.args[0].replace('SELECT ','SELECT pg_advisory_xact_lock(746826633) AS fixture_wait,'));assert.equal(selected.result[1],selected.args[1]);assert.equal(await hook(clients.c1,credentials()),undefined);}});
await check('harness_exports_exact_ast',()=>{const file=path.join(dir,'source/tests__p05-topic-lifecycle__harness.mjs'),text=fs.readFileSync(file,'utf8'),parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),fn=parsed.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='harness'),ret=fn.body.statements.find(ts.isReturnStatement),names=new Set(ret.expression.properties.map(p=>p.name?.text)),used=new Set();function walk(n){if(ts.isPropertyAccessExpression(n)&&n.expression.getText(tree)==='h')used.add(n.name.text);ts.forEachChild(n,walk);}walk(tree);assert.deepEqual([...used].filter(n=>!names.has(n)),[]);assert(text.includes("context='in_person'"));assert(text.includes('privateTextChat:true'));});
await check('quota_fixture_declared_only_sidecar',()=>{assert(source.includes('fixture={...data,chat_quota:{schema_version:1,round_id:round,total:126'));assert(source.includes('await h.rooms.lockRoom(c,f.room)'));assert(source.includes('WHERE room_id=$1 AND session_id=$2 AND id=$3 FOR UPDATE'));assert(source.includes('WHERE id=$1 AND room_id=$3 AND session_id=$4'));assert(source.includes('explicit_encrypted_quota_only_fixture_total:126,natural_http_messages_in_case:2,not_128_natural_sends:true'));});
await check('late_wait_cleanup_declared',()=>{assert(source.includes('clearTimeout(waitTimer);h.setQueryHook(null)'));assert(source.includes("try{if(lockAcquired)await blocker.query('SELECT pg_advisory_unlock($1)',[key]);}finally{blocker.release();}"));assert(source.includes('if(pending)response=await pending'));assert(source.includes("wait_event_type='Lock' AND query LIKE $1"));});
const report={scope:'STATIC_EXACT_AST_WITH_INERT_STUBS_NO_DOCKER_NO_ACTUAL_PG',source_sha256:crypto.createHash('sha256').update(source).digest('hex'),rows};fs.writeFileSync(path.join(dir,'integration-probes.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;


