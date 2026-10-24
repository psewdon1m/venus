import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';
import {assertKeyboard} from '../../../../../.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02/probe-policy.mjs';
const root='C:/.projects/venus',producer=root+'/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-02',measure=readFileSync(producer+'/measure.mjs','utf8'),dom=readFileSync(producer+'/dom-audit.mjs','utf8');
const helpers=measure.slice(measure.indexOf('function failedKeyboardProjection('),measure.indexOf('export async function measureRole(')).replace('export async function keyboard','async function keyboard');
const sample=(id,outside=false)=>({id,focus_visible:true,in_viewport:!outside,not_occluded:true,focus_contrast_unresolved:false,focus_contrast_ratio:21,rect:{left:outside?-20:0,top:10,right:80,bottom:30,width:100,height:20},viewport:{width:320,height:568},scroll_top:10,scroll_left:3});
function model(samples,{writeError=null}={}){
 let reads=0,tabs=0;const writes=[],events=[],page={locator:()=>({first:()=>({click:async()=>{}})}),keyboard:{press:async key=>{assert.equal(key,'Tab');tabs++;}},evaluate:async fn=>{assert.equal(fn,'ORIGINAL_FOCUS_FN');return samples[reads++];}};
 const context=vm.createContext({assert,Buffer,join,process:{env:{P05_ARTIFACT_DIRECTORY:'/synthetic-output'}},focusAudit:'ORIGINAL_FOCUS_FN',windowFor:async()=>{throw Error('NO_NEW_FOREGROUND');},bounded:async(_budget,_label,fn)=>fn(),writeFileSync:(path,bytes,options)=>{events.push('write');assert.equal(path,join('/synthetic-output','keyboard-first-failure.json'));assert.equal(options.flag,'wx');assert(bytes.length<=4096);if(writeError)throw writeError;writes.push(JSON.parse(bytes));},assertKeyboard:(result,targets)=>{events.push('assert');return assertKeyboard(result,targets);}});
 vm.runInContext(helpers+';globalThis.run=keyboard;globalThis.project=failedKeyboardProjection;',context);
 return {run:targets=>context.run(page,targets,null,{},true),project:context.project,writes,events,get reads(){return reads;},get tabs(){return tabs;}};
}
const rows=[];async function check(name,fn){await fn();rows.push({name,status:'PASS'});}
await check('same_focus_eval_rect_is_original_single_sample_and_predicate_unchanged',async()=>{
 let rectangles=0;const r={left:-20,top:10,right:80,bottom:30,width:100,height:20};const element={getBoundingClientRect:()=>{rectangles++;return r;},parentElement:null,tagName:'BUTTON',getAttribute:()=> 'pair-decline',matches:()=>true,contains:()=>false};const style={outlineWidth:'2px',outlineStyle:'solid',outlineColor:'rgb(0,0,0)',boxShadow:'none',opacity:'1',visibility:'visible',display:'block'};
 const fn=dom.slice(dom.indexOf('export function focusAudit(){'),dom.indexOf('export function visibleTargets(){')).replace('export function','function');const context=vm.createContext({document:{activeElement:element,body:{},elementFromPoint:()=>element,scrollingElement:{scrollTop:10,scrollLeft:3}},window:{innerWidth:320,innerHeight:568},getComputedStyle:()=>style});vm.runInContext(fn+';globalThis.value=focusAudit();',context);const value=context.value;assert.equal(rectangles,1);assert.equal(value.in_viewport,false);assert.deepEqual(JSON.parse(JSON.stringify(value.rect)),r);assert.equal(value.viewport.width,320);assert.equal(value.scroll_top,10);assert.equal(value.scroll_left,3);
});
await check('first_negative_sample_persists_before_original_assert_no_terminal_reread',async()=>{
 const m=model([sample('pair-decline',true),sample('pair-decline'),sample('game-stop')]);await assert.rejects(m.run(['pair-decline','game-stop']),/KEYBOARD_FOCUS_OUTSIDE:pair-decline/);assert.equal(m.tabs,3);assert.equal(m.reads,3);assert.deepEqual(m.events,['write','assert']);assert.equal(m.writes.length,1);assert.equal(m.writes[0].rect.left,-20);assert.equal(m.writes[0].control,'pair-decline');assert.equal(m.writes[0].first_sample_present,true);assert.equal(m.writes[0].in_viewport,false);
});
await check('positive_path_identical_assertion_and_no_diagnostic_IO',async()=>{
 const m=model([sample('pair-decline'),sample('game-stop')]);const result=await m.run(['pair-decline','game-stop']);assert.equal(m.tabs,2);assert.equal(m.reads,2);assert.equal(result.controls.length,2);assert.equal(result.truncated,false);assert.deepEqual(m.events,['assert']);assert.equal(m.writes.length,0);
});
await check('writer_failure_cannot_replace_original_functional_failure',async()=>{
 const m=model([sample('pair-decline',true)],{writeError:Error('SYNTHETIC_WRITE_FAILURE')});await assert.rejects(m.run(['pair-decline']),/KEYBOARD_FOCUS_OUTSIDE:pair-decline/);assert.deepEqual(m.events,['write','assert']);assert.equal(m.reads,1);
});
await check('projection_static_ID_numeric_finite_bounds_only_no_private_fields',async()=>{
 const m=model([]),bad={...sample('PRIVATE_MEMBER_TOPIC_COOKIE',true),tag:'SECRET_TAG',text:'SECRET_TEXT',value:'SECRET_VALUE',rect:{left:NaN,top:Infinity,right:1e20,bottom:-1e20,width:'SECRET_STRING',height:20},viewport:{width:320,height:Infinity},scroll_top:'SECRET_SCROLL',scroll_left:-10000001,focus_visible:'SECRET_BOOL'};
 const value=m.project({controls:[bad],truncated:false},[bad.id]);assert.equal(value.control,'OTHER');assert.equal(value.focus_visible,null);assert.deepEqual(JSON.parse(JSON.stringify(value.rect)),{left:null,top:null,right:null,bottom:null,width:null,height:20});assert.equal(value.viewport.height,null);assert.equal(value.scroll.top,null);assert.equal(value.scroll.left,null);const text=JSON.stringify(value);assert(!text.includes('SECRET'));assert(!text.includes('PRIVATE_MEMBER'));assert(Buffer.byteLength(text)<=4096);assert.deepEqual(Object.keys(value).sort(),['schema_version','diagnostic_only','sample_kind','control','first_sample_present','truncated','focus_visible','in_viewport','not_occluded','focus_contrast_unresolved','focus_contrast_sufficient','rect','viewport','scroll'].sort());
});
await check('unreached_control_stays_original_FAIL_with_honest_absent_first_sample',async()=>{
 const m=model([null]);const projected=m.project({controls:[],truncated:true},['pair-decline']);assert.equal(projected.control,'pair-decline');assert.equal(projected.first_sample_present,false);assert.equal(projected.rect.left,null);assert.equal(projected.in_viewport,null);assert.throws(()=>assertKeyboard({controls:[],truncated:true},['pair-decline']));
});
console.log(JSON.stringify({status:'PASS_FOCUSED_ACTUAL_HELPERS_COLD_ONLY_NOT_NATIVE',controls:rows.length,rows}));
