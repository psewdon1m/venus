import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {setImmediate as tick} from 'node:timers/promises';
import ts from '../../node_modules/typescript/lib/typescript.js';
import {uiRoundMatches} from '../p05-topic-browser/observations.mjs';
const text=readFileSync('.artifacts/p05-topic-browser/browser.mjs','utf8'),tree=ts.createSourceFile('frozen10',text,99,true,1);
const method=name=>tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name).getText(tree);
const rows=[];
async function scenario({beforeFirst=6000,beforeSecond=6000,post=[3000,6500],defect=null}={}){
 let now=0,commits=0,finished=false,error=null,matchers=0;const report={},events=[],jobs=[];
 const f={session:'session',game_rev:34,plan:{round_id:'round',round_index:16,actors:['a','b']}};
 const actors=['a','b','observer'].map((id,i)=>({id,room:'room',locale:['ru','tr','en'][i],lastGameView:{session_id:'session',round_id:'round',round_index:16,game_rev:34,state:'active',round_state:'pending'},page:{}}));
 const getStage=()=>report.topic_preparation_phases?.at(-1);
 function ready(i,id){const phase=getStage(),elapsed=now-(phase?.started_monotonic_ms??0);if(id==='topic-accept')return i<2&&elapsed>=(i===0?beforeFirst:beforeSecond);return i<2&&commits===2&&elapsed>=post[i];}
 for(let i=0;i<actors.length;i++){
  const a=actors[i];a.page.getByTestId=id=>({i,id,locator:()=>({i,id,labels:true})});
  a.page.evaluate=async(callback,args)=>{
   if(defect==='throw_post_first'&&args.id==='private-prompt'&&i===0)throw Error('EXPLICIT_DOM_OBSERVER_FAILURE');
   const round={textContent:'Round 16 / 20',getClientRects:()=>[{}]},control={getClientRects:()=>ready(i,args.id)&&!(defect==='missing_post_second'&&i===1&&args.id==='private-prompt')?[{}]:[],matches:()=>defect==='disabled'};
   const window={location:{hash:'#room='+(defect==='wrong_room'?'foreign':'room')},getComputedStyle:()=>({visibility:'visible'})},document={querySelector:q=>q.includes('game-round')?round:control};
   const value=vm.runInNewContext('('+callback.toString()+')',{window,document,URLSearchParams})(args);
   if(defect==='changed_observation')a.lastGameView={...a.lastGameView};
   events.push({kind:'dom',i,id:args.id,now});return value;
  };
 }
 if(defect==='stale_scope')actors[1].lastGameView.round_id='foreign';
 const expect=locator=>({
  toBeVisible:async()=>{},toHaveText:async()=>{},
  toHaveCount:async count=>{if(locator.id!=='private-prompt')return;assert.equal(count,0);events.push({kind:'no_prompt',commits,now,i:locator.i});if(defect==='early_after_second_ready'&&commits===1&&getStage()?.kind==='before_second_ack'&&getStage().status==='READY')throw Error('EARLY_PROMPT');},
  toContainText:async content=>{assert.equal(commits,2);assert(ready(locator.i,'private-prompt'));assert.equal(content,'SYNTHETIC '+actors[locator.i].locale.toUpperCase());if(defect==='wrong_content')throw Error('WRONG_LOCALIZED_CONTENT');matchers++;events.push({kind:'matcher',now,i:locator.i});}
 });
 expect.poll=(work,{timeout})=>({toBe:expected=>new Promise((resolve,reject)=>{jobs.push({work,expected,resolve,reject,deadline:now+timeout,done:false});})});
 const context=vm.createContext({assert,performance:{now:()=>now},report,save:()=>{},uiRoundMatches,expect,actors,
  participants:()=>actors.slice(0,2),currentOfferTopics:async()=>['fullunion'],read:async()=>({game_rev:34}),expectedOfferLabels:()=>['fullunion'],
  mutationClick:async a=>{assert(getStage().status==='READY');commits++;events.push({kind:'commit',i:actors.indexOf(a),now});now+=600;for(const actor of actors)actor.lastGameView.game_rev=34+commits;return {game_rev:34+commits};},
  coherentGame:async expected=>{assert.equal(expected.minRev,34+commits);events.push({kind:'coherent',commits,now});now+=500;}
 });
 for(const name of ['topicReadinessPhase','topicUiReady','acceptTopics'])context[name]=vm.runInContext('('+method(name)+')',context);
 const task=context.acceptTopics(f).then(()=>{finished=true;},e=>{error=e;finished=true;});
 // Independent cooperative scheduler: concurrent polls observe the same native instant.
 for(let step=0;!finished&&step<1000;step++){
  await tick();const active=jobs.filter(j=>!j.done);
  for(const job of active){try{if(now>=job.deadline)throw Error('PHASE_TIMEOUT');if(await job.work()===job.expected){job.done=true;job.resolve();}}catch(e){job.done=true;job.reject(e);}}
  await tick();if(!finished)now+=50;
 }
 await task;assert(finished);assert(jobs.every(j=>j.done),'No poll may remain live after return');return {pass:!error,error:error?.message,now,commits,matchers,report,events};
}
let x=await scenario();assert(x.pass);assert(x.now>16000);assert.equal(x.matchers,2);const phases=x.report.topic_preparation_phases;assert.deepEqual(Array.from(phases,p=>p.kind),['before_first_ack','before_second_ack','after_second_commit']);for(const p of phases){assert.equal(p.deadline_monotonic_ms-p.started_monotonic_ms,8000);assert.equal(p.status,'READY');}assert.equal(phases[2].completed_actors.length,2);const postRows=x.report.topic_readiness.filter(r=>r.step==='after_second_ack');assert.equal(postRows[0].phase_id,postRows[1].phase_id);rows.push({id:'three_absolute_phases_allow_total_over8s_without_per_actor_post_reset',status:'PASS',phases});
for(const defect of ['wrong_room','disabled','changed_observation','stale_scope','early_after_second_ready','wrong_content','missing_post_second']){x=await scenario({defect});assert(!x.pass,defect);rows.push({id:'reject_'+defect,status:'PASS',commits:x.commits,matchers:x.matchers});}
x=await scenario({beforeFirst:8100});assert(!x.pass);assert.equal(x.commits,0);assert.equal(x.report.topic_preparation_phases.length,1);rows.push({id:'pre_first_timeout_has_no_ack_or_retry',status:'PASS'});
x=await scenario({beforeSecond:8100});assert(!x.pass);assert.equal(x.commits,1);assert.equal(x.report.topic_preparation_phases.length,2);rows.push({id:'pre_second_timeout_has_only_first_ack',status:'PASS'});
x=await scenario({post:[100,8100]});assert(!x.pass);assert.equal(x.matchers,0);assert.equal(x.report.topic_preparation_phases.at(-1).status,'FAIL');assert.equal(x.report.topic_preparation_phases.at(-1).completed_actors.length,2);rows.push({id:'shared_post_deadline_rejects_second_actor_late_without_new8s',status:'PASS'});
x=await scenario({defect:'throw_post_first',post:[100,6500]});assert(!x.pass);assert.equal(x.matchers,0);assert.equal(x.report.topic_preparation_phases.at(-1).completed_actors.length,2);assert(x.report.topic_preparation_phases.at(-1).elapsed_ms>=6500);rows.push({id:'allSettled_drains_other_post_actor_after_first_rejection',status:'PASS'});
const phasesReport={topic_preparation_phases:Array.from({length:128},()=>({}))},overflow=vm.createContext({assert,report:phasesReport,performance:{now:()=>0}});assert.throws(()=>vm.runInContext('('+method('topicReadinessPhase')+')',overflow)('before_first_ack',0,[{id:'a'}]));rows.push({id:'phase_diagnostics_cap128_fail_closed',status:'PASS'});
writeFileSync('.artifacts/p05-topic-browser-method10-review-round01/probes.json',JSON.stringify({scope:'EXACT10_THREE_FUNCTIONS_AND_ACTUAL_DOM_CALLBACK_WITH_EXPLICIT_COOPERATIVE_TIME_HTTP_RECEIPT_COHERENCE_DOUBLES_NOT_BROWSER_ACCEPTANCE',rows},null,2)+'\n');console.log(JSON.stringify({status:'PASS',checks:rows.length}));
