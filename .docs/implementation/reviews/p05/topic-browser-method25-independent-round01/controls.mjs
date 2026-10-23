import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {coherentRound} from '../../../../../.artifacts/p05-private-batch-browser-producer25/observations.mjs';
const root='C:/.projects/venus';
const source=readFileSync(root+'/.artifacts/p05-private-batch-browser-producer25/browser.mjs','utf8');
const helper=source.slice(source.indexOf('async function coherentGame('),source.indexOf('async function ownUiRound('));
const read=source.slice(source.indexOf('async function read('),source.indexOf('async function screenshot('));
const fixture={session:'session',game_rev:21,game_state:'active',current_round:3,plan:{round_id:'round',round_index:3},data:{state:'pending'}};
const dto=f=>({session_id:f.session,game_rev:f.game_rev,state:f.game_state,current_round:{round_id:f.plan.round_id,round_index:f.plan.round_index,state:f.data.state}});
const seen=f=>({session_id:f.session,game_rev:f.game_rev,state:f.game_state,round_id:f.plan.round_id,round_index:f.plan.round_index,round_state:f.data.state});
function model({f=structuredClone(fixture),samples=4,before=()=>{},status=200,reply=()=>dto(f)}={}){
 const actors=[{room:'room',csrf:'synthetic',lastGameView:null},{room:'room',lastGameView:null},{room:'foreign',lastGameView:null}],calls=[],configs=[];
 actors[0].context={request:{async get(url,{headers}){assert.equal(headers.origin,'https://synthetic.invalid');assert.equal(headers['x-csrf-token'],'synthetic');calls.push(url);return {status:()=>status,json:async()=>reply()};}}};
 const service={origin:'https://synthetic.invalid',async plan(room){assert.equal(room,'room');return f;}};
 const expect={poll(cb,opts){configs.push(opts);return {async toBe(want){assert.equal(want,true);for(let n=0;n<samples;n++){before(actors,n,calls);if(await cb())return;}throw Error('ORIGINAL_FINITE_DEADLINE');}};}};
 const context=vm.createContext({assert,actors,service,expect,coherentRound});vm.runInContext(read+helper+';globalThis.run=coherentGame;',context);
 return {actors,calls,configs,f,run:context.run};
}
const results=[];
async function check(name,fn){await fn();results.push({name,status:'PASS'});}
await check('foreign_ready_peer_and_same_room_partial_or_future_tuple_never_emit',async()=>{
 for(const change of [v=>null,v=>({...v,state:undefined}),v=>({...v,round_state:undefined}),v=>({...v,game_rev:22}),v=>({...v,game_rev:20}),v=>({...v,round_index:4}),v=>({...v,round_state:'completed'}),v=>({...v,state:'aborted'})]){
  const m=model({before:actors=>{actors[2].lastGameView=seen(fixture);actors[1].lastGameView=change(seen(fixture));}});await assert.rejects(m.run(),/ORIGINAL_FINITE_DEADLINE/);assert.equal(m.calls.length,0);assert.equal(m.configs.length,1);
 }
});
await check('same_room_nonhost_terminal_tuple_enables_one_host_HTTP_without_active_filter',async()=>{
 for(const [state,round] of [['active','completed'],['active','skipped'],['active','stopped'],['paused','active'],['aborted','aborted']]){
  const f=structuredClone(fixture);f.game_state=state;f.data.state=round;
  const m=model({f,before:(actors,n,calls)=>{assert.equal(calls.length,0);if(n===3)actors[1].lastGameView=seen(f);}});const answer=await m.run({session:f.session,round:f.plan.round_id,index:3,minRev:21});assert(coherentRound(f,answer.view));assert.equal(m.calls.length,1);assert.equal(m.actors[0].lastGameView,null);assert.equal(m.configs.length,1);assert.deepEqual(Array.from(m.configs[0].intervals),[50,100,250]);assert.equal(m.configs[0].timeout,8000);
 }
});
await check('expected_minRev_gate_and_real_DTO_check_are_both_indispensable',async()=>{
 for(const expected of [{minRev:22},{session:'old'},{round:'old'},{index:2}]){
  const m=model({before:actors=>{actors[1].lastGameView=seen(fixture);}});await assert.rejects(m.run(expected),/ORIGINAL_FINITE_DEADLINE/);assert.equal(m.calls.length,0);
 }
 const m=model({before:actors=>{actors[1].lastGameView=seen(fixture);},reply:()=>({...dto(fixture),state:'aborted'})});await assert.rejects(m.run(),/ORIGINAL_FINITE_DEADLINE/);assert.equal(m.calls.length,4);assert.equal(m.configs.length,1);
});
await check('one_original_poll_and_original_429_error_fail_without_new_attempt',async()=>{
 const m=model({samples:12,status:429,before:(actors,n)=>{if(n===2)actors[1].lastGameView=seen(fixture);}});await assert.rejects(m.run(),e=>e.code==='ERR_ASSERTION'&&e.actual===429&&e.expected===200);assert.equal(m.calls.length,1);assert.equal(m.configs.length,1);assert.equal(m.configs[0].timeout,8000);
});
console.log(JSON.stringify({status:'PASS_ACTUAL_HELPER_FINITE_COLD_ONLY',controls:results.length,results}));
