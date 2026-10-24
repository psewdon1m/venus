import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22/browser-child.mjs','utf8');
const body=source.slice(source.indexOf('export async function installApiQuiescence'),source.indexOf('export async function browser(')).replace('export async function','async function');
function fixture(){
 let virtualMs=0,ticks=0,closed=false;
 const handlers=new Map(),context={on(name,cb){handlers.set(name,cb);},async route(){},async routeWebSocket(){},async close(){closed=true;}};
 const install=new Function('assert','performance','setTimeout',body+'\nreturn installApiQuiescence;')(assert,{now:()=>virtualMs},(cb,ms)=>{assert.equal(ms,25);virtualMs+=ms;ticks++;assert(ticks<=4801);cb();});
 const request={url:()=> 'https://localhost:8443/api/v2/rooms/synthetic/game/current',method:()=> 'GET'};
 return {context,install,request,emit(name){handlers.get(name)?.(request);},get state(){return{virtualMs,ticks,closed};}};
}
const checks=[];
{
 const f=fixture(),gate=await f.install(f.context,'synthetic',{assert(){}});f.emit('request');gate.dispose();await f.context.close();assert(f.state.closed);assert.equal(gate.diagnostic().inflight_HTTP,1);assert.equal(gate.diagnostic().disposing,true);
 await assert.rejects(gate.hold(),error=>error.code==='ERR_ASSERTION'&&error.message==='BROWSER_API_QUIESCENCE_DEADLINE');assert.equal(f.state.virtualMs,120000);assert.equal(gate.diagnostic().inflight_HTTP,1);
 checks.push({name:'exact_helper_closed_disposed_gate_with_missing_terminal_request_event_times_out',status:'PASS_COUNTEREXAMPLE',virtual_ms:f.state.virtualMs,ticks:f.state.ticks});
}
{
 const f=fixture(),gate=await f.install(f.context,'synthetic',{assert(){}});f.emit('request');gate.dispose();await f.context.close();f.emit('requestfailed');const result=await gate.hold();assert.equal(result.inflight_HTTP,0);assert.equal(f.state.ticks,0);
 checks.push({name:'late_terminal_request_event_drains_gate_without_timeout',status:'PASS_NEGATIVE_CONTROL'});
}
{
 // This is a prospective orchestration model only; it does not alter the exact helper or producer.
 const f=fixture(),retired=[],gate=await f.install(f.context,'synthetic',{assert(){}}),live=[gate];f.emit('request');gate.dispose();await f.context.close();assert(f.state.closed);assert.equal(live.pop(),gate);retired.push(gate);assert.equal(retired[0].diagnostic().inflight_HTTP,1);await Promise.all(live.map(g=>g.hold()));assert.equal(f.state.ticks,0);
 const g=fixture(),bad=await g.install(g.context,'synthetic',{assert(){}}),stillLive=[bad];g.emit('request');bad.dispose();let retiredAfterFailedClose=false;
 await assert.rejects((async()=>{await Promise.reject(Error('SYNTHETIC_CLOSE_REJECTION'));stillLive.pop();retiredAfterFailedClose=true;})(),/SYNTHETIC_CLOSE_REJECTION/);assert.equal(retiredAfterFailedClose,false);assert.equal(stillLive[0],bad);assert.equal(bad.diagnostic().inflight_HTTP,1);
 checks.push({name:'retirement_model_only_after_confirmed_close_preserves_stale_count_and_failed_close_FAIL',status:'PASS_MODEL_NOT_IMPLEMENTATION'});
}
{
 // Stronger prospective model: obtain a genuine pre-close zero observation before retirement.
 const f=fixture(),gate=await f.install(f.context,'synthetic',{assert(){}}),live=[gate];f.emit('request');const waiting=gate.hold();f.emit('requestfailed');const preClose=await waiting;
 assert.equal(preClose.held,true);assert.equal(preClose.inflight_HTTP,0);const preserved=JSON.parse(JSON.stringify(preClose));gate.dispose();await f.context.close();assert(f.state.closed);assert.equal(live.pop(),gate);const separateProof={pre_close:preserved,context_closed:true};await Promise.all(live.map(g=>g.hold()));assert.equal(separateProof.pre_close.inflight_HTTP,0);assert.equal(separateProof.context_closed,true);assert.deepEqual(Object.keys(preClose).sort(),['held','inflight_HTTP','blocked_HTTP','blocked_WS','completed_current_GET200'].sort());
 checks.push({name:'stronger_retirement_model_real_preclose_hold_zero_then_confirmed_close_separate_proof',status:'PASS_MODEL_NOT_IMPLEMENTATION'});
}
console.log(JSON.stringify({status:'PASS_COLD_COUNTEREXAMPLE_NOT_ACTUAL_CAUSE_NOT_REMEDY_ACCEPTANCE',checks,count:checks.length,source_function_exact:true,DB_connections:0,Docker_allocations:0,browser_launches:0,real_wait_ms:0}));
