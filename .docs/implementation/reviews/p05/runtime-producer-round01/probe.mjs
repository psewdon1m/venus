/** Independent extracted-function probe: no Docker execution or real files. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
const source=readFileSync(resolve('.docs/implementation/reviews/p05/runtime-producer-round01/exact-source/tools/p05-runtime.mjs'),'utf8');
const begin=source.indexOf('async function negative('),end=source.indexOf('\ntry{',begin);assert(begin>=0&&end>begin);const fn=source.slice(begin,end);
function fixture(observed){let monitorBeforeStart=0,fileReads=0;const context={assert,config:{services:{app:{environment:{}}}},stopApp:async()=>{},probe:()=>({unchanged:'fixture'}),saveConfig:()=>{},monitorPhase:async()=>{monitorBeforeStart++;return observed;},docker:()=>({stdout:'{"event":"startup_failed","code":"STARTUP_UNAVAILABLE"}'}),compose:[],inspectApp:()=>({State:{Status:'exited',ExitCode:1,OOMKilled:false,StartedAt:'2026-10-19T18:00:01.000Z',FinishedAt:'2026-10-19T18:00:02.000Z'}}),json:()=>{},writeFileSync:()=>{},readFileSync:()=>{fileReads++;return JSON.stringify(observed);},join:(...x)=>x.join('/'),out:'/explicit-double',pause:async()=>{}};vm.createContext(context);vm.runInContext(fn+'\nthis.reviewNegative=negative;',context);return {run:()=>context.reviewNegative('stale','true'),stats:()=>({monitorBeforeStart,fileReads})};}
test('RP001 negative phase must reject stale monitor that stopped before app started',async()=>{const f=fixture({schema_version:1,phase:'stale',attempts:3,connections:0,started_at:'2026-10-19T18:00:00.000Z',last_observation_at:'2026-10-19T18:00:00.500Z'});await assert.rejects(f.run(),/monitor|observation|fresh|progress/i);});
test('positive control: observer recorded an actual listener and must reject',async()=>{const f=fixture({schema_version:1,phase:'stale',attempts:9,connections:1,last_observation_at:'2026-10-19T18:00:03.000Z'});await assert.rejects(f.run(),e=>String(e.message).includes('Observer saw a listener'));});
test('positive control: sample count below minimum must reject',async()=>{const f=fixture({schema_version:1,phase:'stale',attempts:2,connections:0,last_observation_at:'2026-10-19T18:00:03.000Z'});await assert.rejects(f.run());});
