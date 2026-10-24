/** Inclusive operational timers; no sample execution on import. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
export class LayerTimings{
 constructor(){this.rows=new Map();this.restores=[];this.active=0;this.overlap=0;}
 begin(label){const state={at:performance.now(),cpu:process.cpuUsage(),depth:this.active++};if(state.depth)this.overlap++;return state;}
 end(label,state){this.active--;const cpu=process.cpuUsage(state.cpu),row=this.rows.get(label)??{calls:0,inclusive_wall_ms:0,inclusive_user_ms:0,inclusive_system_ms:0,max_wall_ms:0,nested_calls:0};const elapsed=performance.now()-state.at;row.calls++;row.inclusive_wall_ms+=elapsed;row.inclusive_user_ms+=cpu.user/1000;row.inclusive_system_ms+=cpu.system/1000;row.max_wall_ms=Math.max(row.max_wall_ms,elapsed);if(state.depth)row.nested_calls++;this.rows.set(label,row);}
 sync(label,fn){const s=this.begin(label);try{return fn();}finally{this.end(label,s);}}
 async awaited(label,fn){const s=this.begin(label);try{return await fn();}finally{this.end(label,s);}}
 wrap(prototype,name,label,{async=false}={}){const descriptor=Object.getOwnPropertyDescriptor(prototype,name);assert(descriptor&&typeof descriptor.value==='function'&&descriptor.configurable,'EXACT_TIMER_METHOD_REQUIRED:'+name);const actual=descriptor.value,t=this;const wrapped=async?async function(...args){return t.awaited(label,()=>Reflect.apply(actual,this,args));}:function(...args){return t.sync(label,()=>Reflect.apply(actual,this,args));};Object.defineProperty(prototype,name,{...descriptor,value:wrapped});this.restores.push(()=>{assert.equal(Object.getOwnPropertyDescriptor(prototype,name).value,wrapped,'INSTRUMENTATION_METHOD_CHANGED');Object.defineProperty(prototype,name,descriptor);});}
 restore(){while(this.restores.length)this.restores.pop()();}
 snapshot(){return{layers:Object.fromEntries(this.rows),active_calls:this.active,overlap_events:this.overlap,interpretation:'Inclusive wall/process CPU may nest and overlap, including concurrent Promise.all reads. Never sum these as exclusive cost. SelectNext core is not independently instrumented unless explicitly recorded. Native host/Docker VM CPU is not process CPU.',function_substitution_scope:'Wrappers call captured original exactly once with same this/arguments and preserve result/throw; async wrappers add measured scheduling overhead. No alternate selector, candidate or grant.'};}
}
export const diagnosticTimings=new LayerTimings();
