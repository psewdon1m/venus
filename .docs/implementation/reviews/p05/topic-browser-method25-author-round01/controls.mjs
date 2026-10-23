import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {coherentRound} from '../../../../../.artifacts/p05-private-batch-browser-producer25/observations.mjs';
const root='C:/.projects/venus',source=readFileSync(root+'/.artifacts/p05-private-batch-browser-producer25/browser.mjs','utf8');
const helper=source.slice(source.indexOf('async function coherentGame('),source.indexOf('async function ownUiRound('));
const reads=source.slice(source.indexOf('async function read('),source.indexOf('async function screenshot('));
const rows=[];
const fixture=()=>({session:'synthetic-session',game_rev:41,game_state:'active',current_round:4,plan:{round_id:'synthetic-round',round_index:4},data:{state:'pending'}});
const dto=f=>({session_id:f.session,game_rev:f.game_rev,state:f.game_state,current_round:{round_id:f.plan.round_id,round_index:f.plan.round_index,state:f.data.state}});
const observed=f=>({session_id:f.session,game_rev:f.game_rev,state:f.game_state,round_id:f.plan.round_id,round_index:f.plan.round_index,round_state:f.data.state});
function model({f=fixture(),samples=1,before=()=>{},status=200,reply=null}={}){
 const calls=[],options=[],actors=[{room:'room',locale:'ru',lastGameView:null},{room:'room',locale:'tr',lastGameView:null}],service={origin:'https://synthetic.invalid',async plan(room){assert.equal(room,'room');return f;}};
 for(const a of actors){a.csrf='synthetic-csrf';a.context={request:{async get(url,{headers}){calls.push({locale:a.locale,url});assert.equal(headers.origin,service.origin);return {status:()=>status,json:async()=>reply?reply(calls.length):dto(f)};}}};}
 const expect={poll(callback,configuration){options.push(configuration);assert.equal(configuration.timeout,8000);assert.deepEqual(Array.from(configuration.intervals),[50,100,250]);return {async toBe(wanted){assert.equal(wanted,true);for(let n=0;n<samples;n++){await before({actors,f,n,calls});if(await callback()===true)return;}throw Error('FINITE_ORIGINAL_POLL_DEADLINE');}};}};
 const context=vm.createContext({assert,service,actors,expect,coherentRound});vm.runInContext(reads+helper+';globalThis.run=coherentGame;',context);
 return {actors,f,calls,options,run:context.run};
}
async function check(name,fn){await fn();rows.push({name,status:'PASS'});}
await check('missing_stale_full_tuple_expected_and_room_emit_zero',async()=>{
 const mutations=[()=>null,v=>({...v,session_id:'old'}),v=>({...v,game_rev:40}),v=>({...v,game_rev:42}),v=>({...v,state:'paused'}),v=>({...v,round_id:'old'}),v=>({...v,round_index:3}),v=>({...v,round_state:'completed'})];
 for(const mutate of mutations){const m=model({before:({actors,f})=>{actors[1].lastGameView=mutate(observed(f));}});await assert.rejects(m.run(),/FINITE_ORIGINAL_POLL_DEADLINE/);assert.equal(m.calls.length,0);}
 for(const expected of [{session:'other'},{round:'other'},{index:5},{minRev:42}]){const m=model({before:({actors,f})=>{actors[1].lastGameView=observed(f);}});await assert.rejects(m.run(expected),/FINITE_ORIGINAL_POLL_DEADLINE/);assert.equal(m.calls.length,0);}
 const m=model({before:({actors,f})=>{actors[1].room='other-room';actors[1].lastGameView=observed(f);}});await assert.rejects(m.run(),/FINITE_ORIGINAL_POLL_DEADLINE/);assert.equal(m.calls.length,0);
});
await check('foreground_TR_peer_unblocks_single_genuine_host_read',async()=>{
 const m=model({samples:3,before:({actors,f,n,calls})=>{assert.equal(calls.length,0);if(n===2)actors[1].lastGameView=observed(f);}});
 const result=await m.run({session:m.f.session,round:m.f.plan.round_id,index:4,minRev:41});assert.equal(m.actors[0].lastGameView,null);assert.equal(m.calls.length,1);assert.equal(m.calls[0].locale,'ru');assert(coherentRound(m.f,result.view));
});
await check('completed_skipped_stopped_paused_aborted_not_active_only',async()=>{
 for(const [state,round] of [['active','completed'],['active','skipped'],['aborted','stopped'],['paused','pending'],['aborted','aborted']]){const f=fixture();f.game_state=state;f.data.state=round;const m=model({f,before:({actors,f})=>{actors[1].lastGameView=observed(f);}});const result=await m.run({minRev:41});assert.equal(m.calls.length,1);assert(coherentRound(f,result.view));}
});
await check('normal_observation_never_accepts_mismatching_genuine_DTO',async()=>{
 const m=model({before:({actors,f})=>{actors[1].lastGameView=observed(f);},reply:()=>({...dto(fixture()),game_rev:40})});await assert.rejects(m.run(),/FINITE_ORIGINAL_POLL_DEADLINE/);assert.equal(m.calls.length,1);
 const settled=model({samples:2,before:({actors,f})=>{actors[1].lastGameView=observed(f);},reply:n=>({...dto(fixture()),game_rev:n===1?40:41})});assert(coherentRound(settled.f,(await settled.run()).view));assert.equal(settled.calls.length,2);
});
await check('genuine_429_is_rejected_without_retry',async()=>{
 const m=model({samples:4,status:429,before:({actors,f})=>{actors[1].lastGameView=observed(f);}});await assert.rejects(m.run(),/Authenticated read failed: current 429/);assert.equal(m.calls.length,1);
});
await check('pending_ACK_rejects_existing_authority_prefix_before_inventory_allocation',async()=>{
 const wrapper=readFileSync(root+'/.artifacts/p05-browser25-a18-run01.mjs','utf8'),pending=readFileSync(root+'/.artifacts/p05-browser25-a18-root-ack01.pending.json','utf8');let reads=0;
 const prefix=wrapper.slice(wrapper.indexOf('const image='),wrapper.indexOf('const before=inventory();')).replace('new URL(import.meta.url)',"'UNREACHED_WRAPPER_URL'");
 assert.throws(()=>vm.runInNewContext(prefix,{assert,process:{env:{}},readFileSync:path=>{reads++;assert.equal(path,root+'/.artifacts/p05-browser25-a18-root-ack01.json');return pending;},createHash(){throw Error('UNREACHED_HASH');},execFileSync(){throw Error('UNREACHED_INVENTORY');}}),error=>error.code==='ERR_ASSERTION'&&error.actual==='NOT_AUTHORIZED'&&error.expected==='ROOT_RUN_ACK');assert.equal(reads,1);
});
console.log(JSON.stringify({status:'PASS_COLD_ACTUAL_HELPER_EXTRACTION_ONLY_NO_NATIVE',controls:rows.length,rows}));
