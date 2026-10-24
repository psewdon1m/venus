import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
const source=readFileSync('C:/.projects/venus/.artifacts/p05-private-batch-browser-producer24/browser.mjs','utf8');
const file=ts.createSourceFile('browser.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const names=new Set(['expectedPrivateScope','privateDom','normalPrivateReady','assertPrivateTicket','click']),declarations=[];let body;
function visit(n){if(ts.isFunctionDeclaration(n)&&names.has(n.name?.text))declarations.push(n.getText(file));if(ts.isCallExpression(n)&&n.expression.getText(file)==='check'&&n.arguments[0]?.getText(file)==='9')body=n.arguments[1].getText(file);ts.forEachChild(n,visit);}visit(file);
assert.equal(declarations.length,5);assert(body);
const {exactUiMutation}=await import(pathToFileURL('C:/.projects/venus/.artifacts/p05-private-batch-browser-producer24/request-emission.mjs'));
async function run(kind){
 let now=200;const counts={native_clicks:0,POST_watchers:0,fills:0,batch_reads:0,recorded_mutations:0};let value='';
 const game={session_id:'session',game_rev:kind==='old_floor'?40:41,state:'active',round_id:'round',round_index:4,round_state:'active'};
 const page={getByTestId(control){return {async fill(v){counts.fills++;value=v;if(kind==='fill_expiry')now=8201;},async inputValue(){return kind==='changed_input'?'CHANGED_AFTER_FILL':value;},async click(){counts.native_clicks++;throw Error('UNEXPECTED_NATIVE_CLICK');}};},async evaluate(){return true;},waitForResponse(){counts.POST_watchers++;throw Error('UNEXPECTED_POST_WATCHER');},waitForRequest(){counts.POST_watchers++;throw Error('UNEXPECTED_POST_WATCHER');}};
 const secondary={id:'secondary',room:'room',locale:'ru',lastGameView:game,page},primary={id:'primary',room:'room',locale:'en',lastGameView:{...game},page},actors=[secondary,primary];
 const fixture={session:'session',game_rev:30,plan:{round_id:'round',round_index:4,actors:['primary','secondary'],primary_member_id:'primary',requires_action_consent:kind!=='coherent_expiry'}};
 const report={};
 const batch={ready:true,reason:'READY',cycle_id:1,accepted_cycle_id:1,lease_remaining_ms:5000};
 const env={assert,actors,report,phase:'cold',performance:{now:()=>now},delay:async ms=>{now+=ms;},save:()=>{},
  observedOwnStarts:new WeakMap(),normalPrivateControls:new Set(['game-condition-submit']),
  privateBatches:{async requireReady(){counts.batch_reads++;return {...batch};},snapshot(){return {...batch};}},
  safeFailedReadiness:()=>({reason:'FINITE_MODEL'}),startPrivate:async()=>fixture,invite:async()=>{},acceptTopics:async()=>{},participants:()=>actors,
  acceptActionsUi:async()=>({minRev:41}),coherentGame:async()=>{assert.equal(kind,'coherent_expiry');now=8201;return {view:{game_rev:52}};},
  expect:()=>({async toHaveValue(v){assert.equal(value,v);},async toHaveCount(){},async toContainText(){},async toBeVisible(){},async toBeEnabled(){}}),
  exactUiMutation,recordMutation:()=>{counts.recorded_mutations++;},actionAndFinish:async()=>{throw Error('UNEXPECTED_FINISH');}};
 const fn=Function(...Object.keys(env),declarations.join('\n')+'\nreturn ('+body+');')(...Object.values(env));
 let error;try{await fn();}catch(e){error=e;}
 assert(error,'Expected cold negative to fail closed');assert.equal(counts.native_clicks,0);assert.equal(counts.POST_watchers,0);assert.equal(counts.recorded_mutations,0);
 if(kind==='old_floor'){assert.equal(error.message,'METHOD12_PREPARATION_DEADLINE');assert.equal(counts.fills,0);assert(now>=8200);}
 if(kind==='changed_input'){assert.equal(error.message.includes('METHOD12_INTENDED_VALUE_CLEARED_BEFORE_PREPARATION'),true);assert.equal(counts.fills,1);assert.equal(counts.batch_reads,1);}
 if(kind==='fill_expiry'){assert.equal(error.message.includes('METHOD12_PRIVATE_TICKET_EXPIRED'),true);assert.equal(counts.fills,1);}
 if(kind==='coherent_expiry'){assert.equal(error.message,'METHOD12_PREPARATION_DEADLINE');assert.equal(counts.fills,0);assert.equal(counts.batch_reads,0);}
 return {kind,status:'PASS',...counts};
}
const rows=[];for(const kind of ['old_floor','changed_input','fill_expiry','coherent_expiry'])rows.push(await run(kind));
console.log(JSON.stringify({status:'PASS_FOUR_INDEPENDENT_ACTUAL_HELPER_CASE_NEGATIVES_NOT_NATIVE',controls:rows.length,rows}));
