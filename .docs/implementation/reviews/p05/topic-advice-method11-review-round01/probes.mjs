import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {topicScenario} from '../../apps/web/src/topic-test-harness.ts';
const path='.artifacts/p05-advice-browser-producer11/browser.mjs',source=readFileSync(path,'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'70abacfc3dc3fdb560d9fd21b197ce849a3622984789886c8a3d0fdfdc751df0');
const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),functions=new Map(sf.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText(sf)]));
const results=[];
const baselinePath='.docs/implementation/evidence/p05/renewal-topic-browser-preflight-01/run/producer/browser.mjs',baseline=readFileSync(baselinePath,'utf8'),oldSf=ts.createSourceFile(baselinePath,baseline,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),oldFunctions=new Map(oldSf.statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText(oldSf)]));
function cases(file){const rows=new Map();function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(file)==='check'&&ts.isNumericLiteral(node.arguments[0]))rows.set(Number(node.arguments[0].text),node.arguments[1].getText(file));ts.forEachChild(node,visit);}visit(file);return rows;}
const oldCases=cases(oldSf),newCases=cases(sf),caseChanges=[...oldCases].filter(([id,text])=>newCases.get(id)!==text).map(([id])=>id);
assert.equal(oldCases.size,16);assert.equal(newCases.size,16);assert.deepEqual(caseChanges,[4,6]);
const added=[...functions.keys()].filter(name=>!oldFunctions.has(name));assert.deepEqual(added,['adviceMutation','adviceUiReady','receivedPendingAdvice']);
const changed=[...oldFunctions].filter(([name,text])=>functions.get(name)!==text).map(([name])=>name);assert.deepEqual(changed,['topicUiReady']);
assert.equal(functions.get('topicUiReady').replace("['topic-accept','private-prompt','advice-accept','advice-text','advice-edit','advice-revoke']","['topic-accept','private-prompt']"),oldFunctions.get('topicUiReady'));
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
const ui=await topicScenario(String.raw`
 const g=game('s','questions',34);let active=false;
 const api={async request(path){if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions'))return actions(g,{accept_action:active,finish:false});if(path.endsWith('/target'))return {...target(g),action:{offer_id:'action',consent_scope:'action',proposal_revision:1,own_state:'pending',state:'pending',expires_at:iso(clock+30000)}};if(path.endsWith('/conversation/chat'))return privateChat(conversation(g,true));if(path.endsWith('/conversation'))return conversation(g,active);throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);const before=find(i,'action-accept');const pendingTopicDisabled=Boolean(before?.props.disabled),noPromptBefore=!find(i,'private-prompt');
 active=true;await tick();render(i);return {pendingTopicDisabled,noPromptBefore,afterTopicActionEnabled:find(i,'action-accept')?.props.disabled===false};
`);
await check('actual_TSX_pending_topic_disables_action_then_active_topic_enables',async()=>assert(ui.pendingTopicDisabled&&ui.noPromptBefore&&ui.afterTopicActionEnabled));
await check('exact_acceptActionsUi_blocks_case04_before_topic',async()=>{const ctx={participants:()=>[{id:'a'}],coherentGame:async()=>({fixture:f}),ownUiRound:async(_a,_f,control)=>{assert.equal(control,'action-accept');assert(!ui.pendingTopicDisabled,'actual pending-topic action control disabled');},mutationClick:async()=>{throw Error('must not reach mutation');}};vm.createContext(ctx);vm.runInContext(functions.get('acceptActionsUi'),ctx);await assert.rejects(ctx.acceptActionsUi(f),/actual pending-topic/);});
const activeActionUi=await topicScenario(String.raw`
 const g={...game('s','questions',35),current_round:{...game('s').current_round,state:'active'}};
 const api={async request(path){if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions'))return actions(g,{accept_action:false,finish:true});if(path.endsWith('/target'))return {...target(g),action:{offer_id:'action',consent_scope:'action',proposal_revision:1,own_state:'accepted',state:'active',expires_at:iso(clock+180000)}};if(path.endsWith('/conversation/chat'))return privateChat(conversation(g,true));if(path.endsWith('/conversation'))return conversation(g,true);throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);return {finishVisible:Boolean(find(i,'game-finish')),actionDisabled:find(i,'action-accept')?.props.disabled===true};
`);
await check('actual_TSX_active_action_finish_visible_and_accept_disabled',async()=>assert(activeActionUi.finishVisible&&activeActionUi.actionDisabled));
await check('exact_actionAndFinish_rejects_already_accepted_setup',async()=>{const primary={id:'a',page:{getByTestId:id=>({id})}},ctx={actors:[primary,{id:'b'}],expect:l=>({async toHaveCount(n){assert.equal(l.id,'game-finish');assert.equal(Number(activeActionUi.finishVisible),n,'already-active legitimate finish must not be absent');}}),acceptActionsUi:async()=>{throw Error('should already fail forbidden absence');}};vm.createContext(ctx);vm.runInContext(functions.get('actionAndFinish'),ctx);await assert.rejects(ctx.actionAndFinish(f),/already-active/);});
writeFileSync('.artifacts/p05-advice-method11-review-round01/probes.json',JSON.stringify({status:'PASS_FINDINGS_REPRODUCED',checks:results.length,results,ui,activeActionUi,finiteDiff:{caseChanges,unchangedCases:14,addedFunctions:added,changedFunctions:changed,topicUiChange:'advice locator allowlist only'},scope:'EXACT_FROZEN_PRODUCER_FUNCTIONS_PLUS_UNMODIFIED_CURRENT_TSX_WITH_EXPLICIT_OWN_PERMISSION_FIXTURES_NO_DOCKER'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS_FINDINGS_REPRODUCED',checks:results.length,ui,activeActionUi}));
