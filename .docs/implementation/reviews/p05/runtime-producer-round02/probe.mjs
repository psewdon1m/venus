/** Exact captured negative() body. Docker/files/times are explicit doubles;
 * assertion checks exclude undefined-helper ReferenceErrors from false PASS. */
import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import vm from 'node:vm';
const source=readFileSync(resolve('.docs/implementation/reviews/p05/runtime-producer-round02/exact-source/tools/p05-runtime.mjs'),'utf8'),begin=source.indexOf('async function negative('),end=source.indexOf('\ntry{',begin);assert(begin>=0&&end>begin);const fn=source.slice(begin,end);
const pre={schema_version:1,phase:'review',attempts:3,connections:0,started_at:'2026-10-19T18:00:00.000Z',last_observation_at:'2026-10-19T18:00:00.500Z',max_observation_gap_ms:5};
const fresh={...pre,attempts:9,last_observation_at:'2026-10-19T18:00:03.000Z',max_observation_gap_ms:17};
function fixture({before=pre,frames=[fresh],observer={Config:{Labels:{'com.docker.compose.project':'review-owned'}},State:{Running:true,Pid:42}},app={State:{Status:'exited',ExitCode:1,OOMKilled:false,StartedAt:'2026-10-19T18:00:01.000Z',FinishedAt:'2026-10-19T18:00:02.000Z'}}}={}){
 let reads=0,inspects=0;const context={assert,config:{services:{app:{environment:{}}}},stopApp:async()=>{},probe:()=>({unchanged:'sampled fixture'}),saveConfig:()=>{},monitorPhase:async()=>JSON.parse(JSON.stringify(before)),docker:args=>args[0]==='inspect'?(inspects++,{stdout:JSON.stringify([observer])}):{stdout:'{"event":"startup_failed","code":"STARTUP_UNAVAILABLE"}'},compose:[],serviceId:()=> 'monitor-owned-id',project:'review-owned',inspectApp:()=>app,json:()=>{},writeFileSync:()=>{},readFileSync:()=>JSON.stringify(frames[Math.min(reads++,frames.length-1)]),join:(...x)=>x.join('/'),out:'/explicit-double',pause:async()=>{}};vm.createContext(context);vm.runInContext(fn+'\nthis.reviewNegative=negative;',context);return {run:()=>context.reviewNegative('review','true'),stats:()=>({reads,inspects})};
}
const cases=[
 ['RP001 stale pre-start samples',{frames:[pre]},'Observer must advance'],
 ['samples advance but stop before exit',{frames:[{...fresh,last_observation_at:'2026-10-19T18:00:01.500Z'}]},'Observer must publish after app exit'],
 ['wrong phase cannot satisfy current startup',{frames:[{...fresh,phase:'other'}]},null],
 ['four new samples are insufficient',{frames:[{...fresh,attempts:7}]},'Observer must advance'],
 ['invalid post observation time',{frames:[{...fresh,last_observation_at:'invalid'}]},'Observer must publish after app exit'],
 ['pre observer starts after app',{before:{...pre,last_observation_at:'2026-10-19T18:00:01.500Z'}},'Observer must be established'],
 ['missing measured gap',{frames:[{...fresh,max_observation_gap_ms:undefined}]},'Actual sampling gaps required'],
 ['listener observed',{frames:[{...fresh,connections:1}]},'Observer saw a listener'],
 ['monitor no longer running',{observer:{Config:{Labels:{'com.docker.compose.project':'review-owned'}},State:{Running:false,Pid:42}}},'Observer process must still be live'],
 ['no actual monitor pid',{observer:{Config:{Labels:{'com.docker.compose.project':'review-owned'}},State:{Running:true,Pid:0}}},null],
 ['wrong project observer',{observer:{Config:{Labels:{'com.docker.compose.project':'wrong-owner'}},State:{Running:true,Pid:42}}},null],
 ['invalid actual app interval',{app:{State:{Status:'exited',ExitCode:1,OOMKilled:false,StartedAt:'invalid',FinishedAt:'invalid'}}},'Actual startup interval required']
];
for(const [name,input,message] of cases)test(name+' rejects through intended assertion',async()=>{const f=fixture(input);await assert.rejects(f.run(),e=>e instanceof assert.AssertionError&&(!message||e.message.includes(message)));});
test('advancing same phase with live owned observer after app exit passes and reports bounded scope',async()=>{const f=fixture({frames:[{...fresh,attempts:4,last_observation_at:'2026-10-19T18:00:01.500Z'},fresh]}),value=await f.run();assert.equal(f.stats().reads,2);assert.equal(f.stats().inspects,1);assert.equal(value.pre_start_attempts,3);assert.equal(value.observed_attempts,9);assert.equal(value.post_exit_observation_at,fresh.last_observation_at);assert.equal(value.max_observation_gap_ms,17);assert.equal(value.observer_live,true);assert.equal(value.absolute_no_listen_proof,false);assert.equal(value.sampled_state_unchanged,true);assert.equal(value.full_database_equality_proof,false);});
