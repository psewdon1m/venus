import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from '../node_modules/typescript/lib/typescript.js';
const folder='.artifacts/p05-private-batch-browser-producer13',text=readFileSync(folder+'/browser.mjs','utf8');
const parse=s=>ts.createSourceFile('browser.mjs',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const functions=s=>new Map(parse(s).statements.filter(ts.isFunctionDeclaration).map(n=>[n.name.text,n.getText()]));
const current=functions(text),base=functions(readFileSync('.artifacts/p05-private-batch-browser-producer12/browser.mjs','utf8'));
const checks=[];async function check(name,fn){await fn();checks.push({name,status:'PASS'});}
await check('only positive acceptActionsUi function changed',()=>assert.deepEqual([...current].filter(([n,s])=>base.get(n)!==s).map(([n])=>n),['acceptActionsUi']));
const cases=s=>{const tree=parse(s),out=[];const visit=n=>{if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='check'&&ts.isNumericLiteral(n.arguments[0])&&n.arguments[1])out.push([n.arguments[0].text,n.arguments[1].getText(tree)]);ts.forEachChild(n,visit);};visit(tree);return out;};
const oldCases=cases(readFileSync('.artifacts/p05-private-batch-browser-producer12/browser.mjs','utf8')),newCases=cases(text);
await check('all16 exact identities retained',()=>{assert.equal(oldCases.length,16);assert.equal(newCases.length,16);assert.deepEqual(newCases.map(x=>x[0]),oldCases.map(x=>x[0]));});
await check('only case08 body adds earlier positive consent',()=>assert.deepEqual(newCases.filter(([n,s])=>oldCases.find(v=>v[0]===n)?.[1]!==s).map(([n])=>n),['8']));
await check('topic prompt and all negative functions remain exact',()=>{for(const n of ['acceptTopics','actionAndFinish','mutationClick','normalPrivateReady','preparePrivateClick','assertPrivateTicket'])assert.equal(current.get(n),base.get(n));});
await check('case08 preserves finish and screenshot after early consent',()=>assert(newCases.find(x=>x[0]==='8')[1].includes("if(f.plan.requires_action_consent)await acceptActionsUi(f);const result=await actionAndFinish(f);await screenshot('truth-dare-finished')")));
async function fixture({expired=false,denySecond=false,failReceipt=false,badRevision=false,singleActor=false}={}){
 let clock=0,clicks=0,coherent=0,saves=0;
 const actors=[{id:'first',room:'room',locale:'ru',page:{},lastGameView:{game_rev:30}},{id:'second',room:'room',locale:'en',page:{},lastGameView:{game_rev:30}}];
 const records=[],preparations=[],mutations=[],report={};
 const context={assert,actors,report,performance:{now:()=>clock},participants:()=>singleActor?actors.slice(0,1):actors,save:()=>saves++,
  normalPrivateReady:async(a,control,opts)=>{preparations.push({actor:a.id,control,...opts});if(denySecond&&a===actors[1])throw Error('OWN_PERMISSION_DENIED');return{control,actor:a.id,deadline_monotonic_ms:opts.deadline,expected:{session:opts.expected.session,round:opts.expected.round,rev:opts.expected.minRev}};},
  exactUiMutation:async args=>{const t=await args.prepare();assert.equal(args.kind,'accept');assert.equal(args.scope,'action');assert.equal(args.control,'action-accept');assert(args.path.endsWith('/game/session/round/round/response'));await args.click(t);mutations.push(args);args.record({result:'EXACT_RECEIPT_VERIFIED'});if(failReceipt)throw Error('EXACT_RECEIPT_BAD');return{receipt:{schema_version:2,game_rev:badRevision?29:30+clicks}};},
  click:async(a,control,t)=>{assert.equal(a.id,t.actor);assert.equal(control,'action-accept');assert(clock<t.deadline_monotonic_ms);clicks++;clock=expired?8001:clock+100;},
  recordMutation:e=>records.push(e),coherentGame:async scope=>{coherent++;assert.equal(clicks,2);assert.equal(scope.minRev,32);return{};}};
 const fn=vm.runInNewContext('('+current.get('acceptActionsUi')+')',context);
 let error;try{await fn({session:'session',game_rev:30,plan:{round_id:'round'}});}catch(e){error=e;}
 return{clicks,coherent,saves,error,preparations,mutations,records,report};
}
const positive=await fixture();
await check('one actual actor click each and coherence only after both',()=>{assert(!positive.error);assert.equal(positive.clicks,2);assert.equal(positive.coherent,1);});
await check('same one8s phase and deadline used for both',()=>assert.deepEqual(positive.preparations.map(x=>x.deadline),[8000,8000]));
await check('second own readiness binds first exact receipt revision',()=>assert.deepEqual(positive.preparations.map(x=>x.expected.minRev),[30,31]));
await check('exact fixed session/round and intended control maintained',()=>{for(const p of positive.preparations){assert.equal(p.control,'action-accept');assert.equal(p.expected.session,'session');assert.equal(p.expected.round,'round');}});
await check('success records both actual receipt revisions',()=>{assert.equal(positive.report.action_preparation_phases[0].status,'READY');assert.deepEqual(Array.from(positive.report.action_preparation_phases[0].actors,x=>x.game_rev),[31,32]);});
await check('each exact receipt observer retains its own ticket',()=>{assert.equal(positive.records.length,2);assert.equal(positive.saves,1);});
for(const[option,clicks]of[['expired',1],['denySecond',1],['failReceipt',1],['badRevision',1],['singleActor',0]])await check(option+' fails without click retry or final success',async()=>{const x=await fixture({[option]:true});assert(x.error);assert.equal(x.clicks,clicks);assert.equal(x.coherent,0);if(option!=='singleActor')assert.equal(x.report.action_preparation_phases[0].status,'FAILED');});
const result={status:'AUTHOR_FINITE_CONTROL_PASS_NOT_BROWSER',count:checks.length,checks,HTTP_calls:0,Docker_calls:0};
writeFileSync('.artifacts/p05-method13-controls01.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
