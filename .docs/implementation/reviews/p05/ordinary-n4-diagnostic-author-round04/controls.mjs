import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {profiles,safeFailure} from './probe.mjs';
import {diagnosticEvents} from './outer.mjs';
let count=0;function check(fn){fn();count++;}
check(()=>assert.deepEqual(profiles(),[{context:'online',mode:'questions',N:4}]));
check(()=>{const err=new assert.AssertionError({message:'UNEXPECTED_API_STATUS',actual:500,expected:200,operator:'strictEqual'});assert.equal(safeFailure(err).assertion_code,'UNEXPECTED_API_STATUS');});
check(()=>assert.equal(safeFailure(new Error('PRIVATE_CANARY\nUNEXPECTED_API_STATUS')).assertion_code,'PROBE_ASSERTION_FAILED'));
const event={event:'request_failed',request_id:'d0000000-0000-4000-8000-000000000001',error_kind:'Error',failure_code:'40P01',source_module:'topic-games',source_line:100,source_column:4};
check(()=>assert.deepEqual(diagnosticEvents(JSON.stringify({...event,err:{message:'PRIVATE_CANARY'},cookie:'SECRET',body:'SECRET',stack:'SECRET'})),[event]));
check(()=>assert.deepEqual(diagnosticEvents('BAD_JSON\n'+JSON.stringify({...event,request_id:'SECRET'})+'\n'+JSON.stringify({...event,failure_code:'PRIVATE_CANARY'})),[]));
check(()=>{const rows=diagnosticEvents(JSON.stringify({...event,source_module:'/private/path',source_line:Infinity}));assert.deepEqual(rows,[{event:event.event,request_id:event.request_id,error_kind:event.error_kind,failure_code:event.failure_code}]);});
check(()=>assert.throws(()=>diagnosticEvents(Array(65).fill(JSON.stringify(event)).join('\n')),/DIAGNOSTIC_EVENT_CAP/));
check(()=>{const s=readFileSync(new URL('./outer.mjs',import.meta.url),'utf8');const capture=s.indexOf('if(appId){try{');assert(capture>s.indexOf('}finally{'));assert(capture<s.indexOf("docker(['down'"));assert(s.includes("run(['logs','--tail','1000',appId])"));});
check(()=>{const d=JSON.parse(readFileSync(new URL('./DESCRIPTOR.json',import.meta.url),'utf8'));assert.equal(d.rate_schedule.retries,0);assert.equal(d.rate_schedule.per_member_http_min_gap_ms,350);assert.equal(d.rate_schedule.all_public_http_min_gap_ms,550);assert.equal(d.expected_completed_rounds,20);assert.equal(d.calibration04.full_matrix_pass,false);});
console.log(JSON.stringify({status:'PASS_BOUNDED_DIAGNOSTIC_METHOD_CONTROLS_ONLY_NOT_RUN',checks:count}));
