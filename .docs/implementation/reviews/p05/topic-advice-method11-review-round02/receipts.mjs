import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {topicScenario} from '../../apps/web/src/topic-test-harness.ts';
const path='.artifacts/p05-advice-browser-producer11-r2/browser.mjs',source=readFileSync(path,'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'6f09bd209c961fb8abdee51864a742973db21db0d7a145407ed6f9757f4ad670');
const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),functions=new Map(sf.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText(sf)]));
const results=[];
async function check(name,fn){await fn();results.push({name,status:'PASS'});}
const f={session:'s',plan:{round_id:'r',round_index:14,requires_action_consent:true,primary_member_id:'a',actors:['a','b']}};
const body={kind:'respond_advice',request_id:'own-request',advice_id:'advice',epoch:1,proposal_revision:2,decision:'accept'},receipt={schema_version:2,request_id:'own-request',game_rev:34};
function mutationContext(change={}){
 const report={},calls=[],a={locale:'tr',room:'room'},request={method:()=>change.method??'POST',postDataJSON:()=>({...body,...change.body})},response={url:()=>change.url??'https://fixture.invalid/api/v2/rooms/room/game/s/round/r/conversation/commands',request:()=>request,status:()=>change.status??200,json:async()=>({...receipt,...change.receipt})};
 a.page={waitForResponse:async predicate=>{await Promise.resolve();if(!predicate(response))throw Error('NO_MATCHING_RESPONSE');return response;}};
 const context={URL,assert,report,performance:{now:()=>1000},click:async()=>calls.push('click'),coherentGame:async x=>{calls.push(x);return {fixture:f};}};
 vm.createContext(context);vm.runInContext(functions.get('adviceMutation'),context);
 return {context,a,calls,report};
}
await check('exact_receipt_tuple_coherent_minrev',async()=>{const x=mutationContext();const r=await x.context.adviceMutation(x.a,'advice-accept',f,'respond_advice',{advice_id:'advice',epoch:1,proposal_revision:2,decision:'accept'});assert.equal(r.game_rev,34);assert.equal(x.calls[1].minRev,34);assert.equal(x.calls[1].round,'r');assert.equal(x.report.advice_mutation_receipts.length,1);});
for(const [name,change] of Object.entries({wrongStatus:{status:409},wrongSchema:{receipt:{schema_version:1}},wrongRequest:{receipt:{request_id:'foreign'}},badRev:{receipt:{game_rev:'34'}},wrongKind:{body:{kind:'other_question'}},wrongMethod:{method:'GET'},wrongPath:{url:'https://fixture.invalid/api/v2/rooms/foreign/game/s/round/r/conversation/commands'},wrongAdvice:{body:{advice_id:'foreign'}},wrongEpoch:{body:{epoch:2}},wrongProposal:{body:{proposal_revision:3}},wrongDecision:{body:{decision:'decline'}}}))
 await check('reject_'+name,async()=>{const x=mutationContext(change);await assert.rejects(x.context.adviceMutation(x.a,'advice-accept',f,'respond_advice',{advice_id:'advice',epoch:1,proposal_revision:2,decision:'accept'}));assert(!x.report.advice_mutation_receipts);});
await check('recipient_waits_share_one_stage_and_drain_on_failure',async()=>{let release,finished=false;const stage={started:100,deadline:8100},seen=[];const context={performance:{now:()=>100},topicReadinessPhase:()=>stage,topicUiReady:async(a,ff,rev,control,s)=>{seen.push(s);if(a.id==='a')throw Error('first-fails');await new Promise(r=>release=r);finished=true;}};vm.createContext(context);vm.runInContext(functions.get('adviceUiReady'),context);let settled=false;const p=context.adviceUiReady([{id:'a'},{id:'b'}],f,34,'private-prompt','revoked').then(()=>{settled=true;},()=>{settled=true;});await Promise.resolve();await Promise.resolve();assert(!settled);release();await p;assert(finished);assert.equal(seen.length,2);assert(seen.every(x=>x===stage));});
writeFileSync('.artifacts/p05-advice-method11-review-round02/receipts.json',JSON.stringify({status:'PASS',checks:results.length,results},null,2)+'\n');console.log(JSON.stringify({status:'PASS',checks:results.length}));
