import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setTimeout as wait} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {validatePlan,plannedAck,fixedLanes,main,strictSectionRefusal} from '../p05-full-original-lanes02.mjs';
import {producerPins,validateAuthority} from '../p05-fixedrange-host03.mjs';
const plan=JSON.parse(fs.readFileSync(new URL('./MANIFEST.json',import.meta.url))),out=[];
async function check(name,fn){await fn();out.push(name);console.log('PASS '+name);}
const clone=()=>JSON.parse(JSON.stringify(plan)),sha=b=>createHash('sha256').update(b).digest('hex');
await check('all2609 projectedACKs accepted by unchanged host authority, no RUN',()=>{assert(validatePlan(plan));const p=plan.ack_base.producer_root,pins=producerPins(p),binding=fs.readFileSync(p+'/binding.json'),prereg=fs.readFileSync(p+'/RANGE-PREREG.json'),review=fs.readFileSync(plan.consumer_review);assert.deepEqual(pins,plan.ack_base.producer_pins);for(const j of plan.jobs)validateAuthority(plannedAck(plan.ack_base,j),binding,prereg,review,pins,sha(fs.readFileSync(plan.host_runner)));});
for(const [name,change]of[
 ['gap',p=>p.jobs[1].range.start++],['overlap',p=>p.jobs[1].range.start--],['missingjob',p=>p.jobs.pop()],['changedtotal',p=>p.counts['c2-static']++],['oversizedchunk',p=>p.jobs[0].range.count++],['duplicateowner',p=>p.jobs[1].owner=p.jobs[0].owner],['lanemoved',p=>p.jobs[0].lane=1],['duplicatelanejob',p=>p.lane_jobs[0].push(0)],['ACKtamper',p=>p.jobs[0].ack_sha256='0'.repeat(64)],['replayprefix',p=>p.jobs[0].range.start=0]
])await check(name+' rejected',()=>{const p=clone();change(p);assert.throws(()=>validatePlan(p));});
await check('template cannot authorize execution or create run root',async()=>{assert(!fs.existsSync(plan.run_root));await assert.rejects(main([new URL('./MANIFEST.json',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),new URL('./ROOT-ACTIVATION.template.json',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')]));assert(!fs.existsSync(plan.run_root));});
const tiny={jobs:Array.from({length:16},(_,ordinal)=>({ordinal,lane:ordinal%8})),lane_jobs:Array.from({length:8},(_,i)=>[i,i+8])};
await check('fixed preassigned success executes each once, no reassignment',async()=>{const seen=[];const rows=await fixedLanes(tiny,async(j,l)=>{seen.push([j.ordinal,l]);return {ok:true};},()=>false,()=>assert.fail('unexpectedfailure'));assert.equal(rows.length,16);assert.equal(new Set(seen.map(x=>x[0])).size,16);assert(seen.every(([i,l])=>i%8===l));});
await check('first observed failure stops all new jobs; 7 inflight finish',async()=>{let stopped=false,finished=0;const seen=[];const rows=await fixedLanes(tiny,async j=>{seen.push(j.ordinal);await wait(j.ordinal===0?1:10);finished++;return {ok:j.ordinal!==0};},()=>stopped,()=>{stopped=true;});assert.equal(rows.length,8);assert.equal(finished,8);assert.deepEqual(seen,[0,1,2,3,4,5,6,7]);assert.equal(rows.filter(r=>!r.ok).length,1);});
await check('host launch rejection stops subsequent lane work without retries',async()=>{let stopped=false,calls=0;const rows=await fixedLanes({jobs:[{},{}],lane_jobs:[[0,1]]},async()=>{calls++;throw Error('controlled');},()=>stopped,()=>{stopped=true;});assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(rows[0].ok,false);});
await check('preexisting stop schedules no jobs',async()=>{const rows=await fixedLanes(tiny,()=>assert.fail('mustnotrun'),()=>true,()=>{});assert.equal(rows.length,0);});
await check('strict inference/fairness positive refusal stops; zero does not',()=>{for(const s of ['m3-inference','m3-fairness']){assert.equal(strictSectionRefusal(s,{typed_refusals:1,completed:100}),true);assert.equal(strictSectionRefusal(s,{typed_refusals:0,completed:100}),false);}});
await check('valid C2/invariant refusals never trigger strict STOP; malformedcounter rejects',()=>{for(const s of ['c2-static','c2-trajectory','c2-canary','m3-invariants','m3-gf'])assert.equal(strictSectionRefusal(s,{typed_refusals:16,completed:100}),false);for(const v of [-1,101,'1',NaN])assert.throws(()=>strictSectionRefusal('m3-inference',{typed_refusals:v,completed:100}));});
console.log(JSON.stringify({status:'PASS_COLD_OPERATIONAL_CONTROLS_ONLY',checks:out.length,checks_detail:out,Docker_runs:0,native_cases:0,ROOT_authorization_granted:false}));
