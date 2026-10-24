/** Exact DOM/focus function counterexamples on declared fake computed styles only; no browser. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {domAudit,focusAudit} from './dom-audit.mjs';
import {assertObservation,assertKeyboard} from './probe-policy.mjs';
const keys=['document','window','Node','getComputedStyle','matchMedia'],original=Object.fromEntries(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),rows=[];
function setup(){
 const style={display:'block',visibility:'visible',backgroundColor:'rgb(255, 255, 255)',backgroundImage:'none',opacity:'1',color:'rgb(0, 0, 0)',fontSize:'16px',fontWeight:'400',animationName:'none',animationDuration:'0s',transitionDuration:'0s',filter:'none',backdropFilter:'none',webkitBackdropFilter:'none',mixBlendMode:'normal',backgroundBlendMode:'normal',isolation:'auto',maskImage:'none',webkitMaskImage:'none',clipPath:'none',webkitClipPath:'none',textShadow:'none',transform:'none',perspective:'none',contentVisibility:'visible',appearance:'none',borderTopWidth:'1px',borderTopColor:'rgb(0, 0, 0)',outlineWidth:'3px',outlineStyle:'solid',outlineColor:'rgb(0, 0, 0)',boxShadow:'none',zoom:'1'};
 const make=(tag,id)=>({tagName:tag.toUpperCase(),style:{...style},parentElement:null,childNodes:[],textContent:'SYNTHETIC LABEL',labels:[],getBoundingClientRect:()=>({width:100,height:44,left:0,right:100,top:0,bottom:44}),getAttribute:k=>k==='data-testid'?id:null,contains(e){return e===this;},closest:()=>null,matches:selector=>selector===':focus-visible'?true:selector===':disabled'?false:selector.split(',').some(v=>v.trim().startsWith(tag))});
 const html=make('html','root'),body=make('body','body'),button=make('button','game-stop');body.parentElement=html;button.parentElement=body;button.childNodes=[{nodeType:3,textContent:'SYNTHETIC LABEL'}];html.lang='en';html.clientWidth=320;html.scrollWidth=320;
 const document={body,documentElement:html,activeElement:button,scrollingElement:{scrollTop:0},querySelectorAll:()=>[button],getElementById:()=>null,elementFromPoint:()=>button};
 Object.assign(globalThis,{document,window:{innerWidth:320,innerHeight:568,devicePixelRatio:1},Node:{TEXT_NODE:3},getComputedStyle:node=>node.style,matchMedia:()=>({matches:true})});return {html,body,button};
}
function test(name,fn){fn();rows.push({name,status:'PASS'});}
try{
 test('supported_flat_srgb_no_filter_context_passes',()=>{setup();assertObservation(domAudit());assertKeyboard({controls:[focusAudit()],truncated:false},['game-stop']);});
 const contexts=[['filter','brightness(0)'],['filter','opacity(0)'],['backdropFilter','blur(4px)'],['webkitBackdropFilter','blur(4px)'],['mixBlendMode','multiply'],['backgroundBlendMode','multiply'],['maskImage','linear-gradient(black, transparent)'],['clipPath','circle(20%)'],['textShadow','0 0 2px black'],['transform','matrix(1,0,0,1,0,0)'],['perspective','100px'],['opacity','0'],['contentVisibility','hidden']];
 for(const [key,value]of contexts)for(const ancestor of [false,true])test((ancestor?'ancestor_':'node_')+key+'_'+value+'_unresolved_and_no_focus_pass',()=>{const f=setup();(ancestor?f.body:f.button).style[key]=value;const audit=domAudit();assert(audit.contrast_unresolved>0,key);assert.throws(()=>assertObservation(audit));const focus=focusAudit();assert.equal(focus.focus_contrast_unresolved,true);assert.equal(focus.focus_visible,false);assert.throws(()=>assertKeyboard({controls:[focus],truncated:false},['game-stop']));});
 test('explicit_supported_defaults_do_not_invent_unresolved_compositing',()=>{const f=setup();f.button.style.backgroundColor='rgba(255, 255, 255, 0.5)';const audit=domAudit();assert.equal(audit.contrast_unresolved,0);assertObservation(audit);});
}finally{for(const key of keys){const d=original[key];if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}}
const result={status:'PASS',scope:'AUTHOR_FAKE_DOM_AND_COMPUTED_PAINT_CONTEXTS_ONLY_NO_BROWSER',count:rows.length,rows};writeFileSync('.artifacts/p05-v2-layout-producer-resume03/paint-context-controls.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:'PASS',count:rows.length}));
