/** Exact current mutation method, inert replay-only dependencies. Not an actual runtime proof. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const path='apps/api/src/topic-games.ts',source=readFileSync(path,'utf8'),tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true),method=tree.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='TopicGames').members.find(n=>n.name?.getText(tree)==='mutation').getText(tree);
const code=ts.transpileModule('class Probe{'+method+'};module.exports=Probe;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
vm.runInNewContext(code,{module,exports:module.exports,requestId:()=>{},requireThat:(condition)=>assert(condition),gameDeliveryFence:Symbol('fixture-unused'),DomainError:class extends Error{},EngineError:class extends Error{}},{timeout:1000});
const Probe=module.exports,observed=[];
for(const operation of ['respond','conversation:respond_topic','conversation:offer_advice','conversation:respond_advice']){
 const api=new Probe(),receipt={schema_version:2,request_id:'00000000-0000-4000-8000-000000000001',game_rev:9};let effects=0,auth=0;
 Object.assign(api,{rooms:{access:async()=>({member:{id:'member'}})},protocol:async()=>{},keys:{matchesFingerprint:()=>true,decrypt:()=>receipt},finalAuth:async()=>()=>{auth++;},committed:async work=>work({query:async sql=>{assert(sql.startsWith('SELECT operation,request_hash,receipt_cipher FROM topic_game_requests'));return {rows:[{operation,request_hash:'synthetic',receipt_cipher:{synthetic:true}}]};}})});
 const result=await api.mutation('room','credential',{request_id:receipt.request_id},operation,{sessionId:'session',roundId:'stopped-round'},false,async()=>{effects++;throw Error('Must not execute new effects');});assert.equal(result,receipt);assert.equal(effects,0);assert.equal(auth,1);observed.push({operation,returned_old_receipt:true,new_effects:effects,final_auth_checks:auth});
}
const report={schema_version:1,role:'AUTHOR_NOT_ACCEPTOR',scope:'EXACT_METHOD_INERT_REPLAY_COMPATIBILITY_COUNTEREXAMPLE_NOT_ACTUAL_BOOT_OR_HTTP',source:path,source_sha256:createHash('sha256').update(source).digest('hex'),method_sha256:createHash('sha256').update(method).digest('hex'),status:'DESIGN_CONFLICT_REQUIRES_ROOT_RESOLUTION',reason:'Current exact request replay without optional replayCheck returns harmless prior receipt after auth, while immutable restore design02 requests all old acceptance/advice retries denied4xx. Raw grants/effects need separate assertions.',observed};writeFileSync('.artifacts/p05-topic-restore/receipt-compatibility-result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
