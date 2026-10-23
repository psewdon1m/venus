/** Exact own keyboard helper in an inert VM; no native input, browser or Docker is executed. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {absoluteBudget,bounded,assertFreshScope} from './probe-policy.mjs';
import {sha} from './runner-policy.mjs';
const source=readFileSync('.artifacts/p05-v2-layout-producer-resume03/measure.mjs','utf8'),ast=ts.createSourceFile('measure.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='activateSafety');assert(node);const exact=source.slice(node.getStart(ast),node.end),text=exact.replace(/^export /,'');
const results=[];
async function replay(change={}){
 const fixture={session:'s',game_rev:1,plan:{round_id:'r',round_index:1}},request={request_id:'11111111-1111-4111-8111-111111111111',side:'dare'},receipt={schema_version:2,request_id:request.request_id,game_rev:2};change.request?.(request);change.receipt?.(receipt);
 const scene=change.scene??'truth_dare_choice',suffix=scene==='private_offer'||scene==='private_active'?'conversation/commands':scene==='yes_but_condition'?'condition':'choice';
 if(scene==='private_offer'){request.kind='respond_topic';request.decision=change.wrongDecision?'accept':'decline';}if(scene==='private_active'){request.kind='other_question';request.exclude_current_topics=change.wrongExclusion??false;}if(scene==='yes_but_condition')request.text=change.wrongText??'SYNTHETIC LAYOUT CONDITION';
 let tabs=0,enters=0;
 const req={method:()=>change.wrongMethod?'GET':'POST',postDataJSON:()=>request},response={url:()=>`https://fixture/api/v2/rooms/room/game/s/round/${change.wrongRound?'other':'r'}/${suffix}`,request:()=>req,status:()=>change.status??200,json:async()=>receipt};
 const actor={room:'room',id:'member',lastGameView:{session_id:'s',round_id:'r',round_index:1,game_rev:1,state:'active',round_state:'active',started_monotonic_ms:0,received_monotonic_ms:1},page:{getByTestId:()=>({isVisible:async()=>!change.invisible,isEnabled:async()=>!change.disabled}),waitForResponse:predicate=>!change.unresolved&&predicate(response)?Promise.resolve(response):new Promise(()=>{}),keyboard:{press:async key=>{assert.equal(key,'Enter');enters++;}}}};
 const ctx={assert,performance:{now:()=>100},URL,bounded,assertFreshScope,keyboard:async()=>{tabs++;},globalThis:null};ctx.globalThis=ctx;
 vm.runInNewContext(text+'\nglobalThis.run=activateSafety;',ctx);
 const role=scene==='yes_but_condition'?'secondary':'primary';let result,error;
 try{result=await ctx.run({scene,fixture,roles:[{role,actor}]},{budget:absoluteBudget(30),xserver:null,native:false});}catch(e){error=e;}
 return {result,error,tabs,enters};
}
const test=async(name,fn)=>{await fn();results.push({name,status:'PASS'});};
await test('positive-real-helper-shape',async()=>{const r=await replay();assert(!r.error);assert.equal(r.result.receipt_matches,true);assert.equal(r.tabs,1);assert.equal(r.enters,1);});
for(const[name,change]of [['unresolved-receipt',{unresolved:true}],['wrong-round',{wrongRound:true}],['wrong-method',{wrongMethod:true}],['HTTP403',{status:403}],['missing-request-id',{request:r=>delete r.request_id,receipt:r=>delete r.request_id}],['wrong-receipt-id',{receipt:r=>r.request_id='22222222-2222-4222-8222-222222222222'}],['legacy-schema',{receipt:r=>r.schema_version=1}],['wrong-choice',{request:r=>r.side='truth'}],['wrong-topic-decision',{scene:'private_offer',wrongDecision:true}],['wrong-permanent-exclusion',{scene:'private_active',wrongExclusion:true}],['wrong-condition',{scene:'yes_but_condition',wrongText:'different'}],['invisible-action',{invisible:true}],['disabled-action',{disabled:true}]])await test(name+'-rejected',async()=>{const r=await replay(change);assert(r.error);assert.equal(r.result,undefined);});
console.log(JSON.stringify({scope:'INERT_VM_EXACT_KEYBOARD_HELPER_NO_INPUT',exact_function_sha256:sha(Buffer.from(exact)),count:results.length,results},null,2));
