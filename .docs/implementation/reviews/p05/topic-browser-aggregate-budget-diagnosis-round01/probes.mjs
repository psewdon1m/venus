import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from '../../node_modules/typescript/lib/typescript.js';
import {uiRoundMatches} from '../p05-topic-browser/observations.mjs';
const root='.docs/implementation/evidence/p05/storage503-topic-browser-preflight-01/run';
const source=readFileSync(root+'/producer/browser.mjs','utf8');
const tree=ts.createSourceFile('frozen',source,99,true,1),method=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='topicUiReady').getText(tree);
const rows=[];
async function run({start=7191,ready=10000,stageStart=0,defect=null}={}){
 let now=start;const report={},f={session:'session',game_rev:34,plan:{round_id:'round',round_index:16}},a={id:'member',room:'room',locale:'ru',lastGameView:{session_id:defect==='wrong_scope'?'foreign':'session',round_id:'round',round_index:16,game_rev:36,state:'active',round_state:'pending'}};
 const stage={started:stageStart,deadline:stageStart+8000};
 a.page={evaluate:async(callback,args)=>{const control={getClientRects:()=>now>=ready&&defect!=='never_ready'?[{}]:[],matches:()=>false},round={textContent:'Round 16 / 20',getClientRects:()=>[{}]},document={querySelector:q=>q.includes('game-round')?round:control},window={location:{hash:'#room=room'},getComputedStyle:()=>({visibility:'visible'})};return vm.runInNewContext('('+callback.toString()+')',{document,window,URLSearchParams})(args);}};
 const expect={poll:(work,options)=>({toBe:async value=>{const until=now+options.timeout;while(now<until){if(await work()===value)return;now=Math.min(until,now+100);}throw Error('BOUNDED_TIMEOUT');}})};
 const context=vm.createContext({assert,performance:{now:()=>now},report,save:()=>{},uiRoundMatches,expect});
 let pass=true;try{await vm.runInContext('('+method+')',context)(a,f,36,'private-prompt',stage,'after_second_ack');}catch{pass=false;}
 return {pass,now,report};
}
let r=await run();assert(!r.pass);assert.equal(r.now,8000);rows.push({id:'exact09_aggregate_budget_exhausts_with_only809ms_for_postcommit_phase',status:'PASS',observed:r});
r=await run({stageStart:7191});assert(r.pass);assert.equal(r.now,10091);rows.push({id:'same_exact_helper_separate_prospective_postcommit_phase_accepts_within2900ms',status:'PASS',observed:r});
for(const defect of ['wrong_scope','never_ready']){r=await run({stageStart:7191,defect});assert(!r.pass);assert.equal(r.now,15191);rows.push({id:'per_phase_bound_still_rejects_'+defect,status:'PASS'});}
r=await run({stageStart:7191,ready:15200});assert(!r.pass);rows.push({id:'separate_phase_does_not_wait_unbounded_or_reset_each_poll',status:'PASS'});
r=await run({start:8001,stageStart:0});assert(!r.pass);rows.push({id:'original09_expired_stage_still_fails_not_reclassified_PASS',status:'PASS'});
// Exact cache source, with only its imported clock replaced by an explicit inert clock.
let clock=0;const cacheSource=readFileSync('apps/web/src/topic-state.ts','utf8');
const compiled=ts.transpileModule(cacheSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};vm.runInNewContext(compiled,{module,exports:module.exports,require:name=>{assert.equal(name,'./presentation-clock.js');return {presentationNow:()=>clock};}});
const {TopicCache}=module.exports,scope={room:'room',member:'member',identity:1,transport:1,session:'session',round:'round',rev:36};
const c=new TopicCache(),read=c.bind(scope);assert.equal(c.accept(read,scope,null,null,null,new Date(0).toISOString(),0,5001,new Date(5000).toISOString()),false);rows.push({id:'exact_TopicCache_rejects_expired5s_permission_even_if_test_preparation_extended',status:'PASS'});
const fresh=c.issue();assert(c.accept(fresh,scope,null,null,null,new Date(6000).toISOString(),6000,6100,new Date(11000).toISOString()));clock=10999;assert(c.visible());clock=11000;assert(!c.visible());rows.push({id:'fresh_permission_has_own_original5s_bound_not_test_deadline',status:'PASS'});
writeFileSync('.artifacts/p05-topic-browser-aggregate-budget-diagnosis-round01/probes.json',JSON.stringify({scope:'EXACT_ARCHIVED_HELPER_AND_CURRENT_UNCHANGED_CACHE_IN_EXPLICIT_VIRTUALTIME_DOM_FIXTURES_NOT_BROWSER_ACCEPTANCE',rows},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',checks:rows.length}));
