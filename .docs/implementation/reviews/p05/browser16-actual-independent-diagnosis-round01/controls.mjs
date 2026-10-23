/** Model only: execute exact frozen click/ticket functions; no real UI or POST. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const root='.docs/implementation/evidence/p05/recovery-method16-chromium-actual01/run',source=readFileSync(root+'/producer/browser.mjs','utf8'),ast=ts.createSourceFile('browser.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),fn=name=>ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name).getText(ast);
const assertion=fn('assertPrivateTicket'),original=fn('click'),before='await expect(l).toBeVisible();await expect(l).toBeEnabled();if(ticket)',after='if(!ticket){await expect(l).toBeVisible();await expect(l).toBeEnabled();}if(ticket)';
assert.equal(original.split(before).length,2);const candidate=original.replace(before,after),checks=[];
for(const variant of ['original','minimal-proposal'])for(const fault of ['none','poll-between-redundant-awaits','already-stale','forbidden','expired','wrong-control','actuator-error','unprotected']){
 let cycle=fault==='already-stale'?29:28,expects=0,clicks=0,prepares=0;const actor={id:'fixture',locale:'tr',page:{getByTestId:()=>({click:async()=>{clicks++;if(fault==='actuator-error')throw Error('ACTUATOR_FAILURE');}})},privateReady:new Map()},control=fault==='unprotected'?'game-pause':'advice-accept',ticket={control:fault==='wrong-control'?'wrong':'advice-accept',deadline_monotonic_ms:fault==='expired'?1:1000,cycle_id:28,expected:{scope:'fixture'}};
 const context={assert,performance:{now:()=>100},normalPrivateControls:new Set(['advice-accept']),preparePrivateClick:async()=>{prepares++;return ticket;},privateBatches:{snapshot:(_a,o)=>{assert.deepEqual(o.expectedScope,ticket.expected);return{ready:fault!=='forbidden',cycle_id:cycle};}},report:{},phase:'fixture',save(){},Math,expect:()=>({toBeVisible:async()=>{expects++;if(fault==='poll-between-redundant-awaits')cycle=29;},toBeEnabled:async()=>{expects++;}})};
 let error=null;try{await vm.runInNewContext(assertion+'\n'+(variant==='original'?original:candidate)+'\nclick(actor,control,ticket)',vm.createContext({...context,actor,control,ticket}),{timeout:1000});}catch(e){error=e.message;}
 const deny=['already-stale','forbidden','expired','wrong-control'].includes(fault)||fault==='poll-between-redundant-awaits'&&variant==='original';
 if(deny){assert(error);assert.equal(clicks,0);}else if(fault==='actuator-error'){assert.equal(error,'ACTUATOR_FAILURE');assert.equal(clicks,1);}else{assert.equal(error,null);assert.equal(clicks,1);}
 assert.equal(prepares,0);if(fault==='unprotected')assert.equal(expects,2);else if(variant==='minimal-proposal')assert.equal(expects,0);
 checks.push({variant,fault,status:'PASS',fake_actuator_calls:clicks,redundant_expect_calls:expects,error});
}
const caseBodies=code=>{const a=ts.createSourceFile('browser.mjs',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),out={};const walk=n=>{if(ts.isCallExpression(n)&&n.expression.getText(a)==='check'&&n.arguments.length===2&&ts.isNumericLiteral(n.arguments[0]))out[n.arguments[0].text]=n.arguments[1].getText(a);ts.forEachChild(n,walk);};walk(a);return out;};
const old=caseBodies(readFileSync('.artifacts/p05-private-batch-browser-producer15/browser.mjs','utf8')),now=caseBodies(source);assert.equal(Object.keys(now).length,16);assert.deepEqual(now,old);
const result={status:'PASS_FINITE_CONSISTENT_RACE_MODEL_NOT_ACTUAL_CAUSE_PROOF',controls:checks,case_bodies_15_to_16_identical:16,proposal_scope:'Only remove two redundant expect awaits for a nonnull protected ticket; no producer bytes changed',actual_UI_clicks:0,actual_POSTs:0,Docker_calls:0};writeFileSync('.artifacts/p05-browser16-independent-diagnosis01/controls-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,controls:checks.length,case_bodies:16}));
