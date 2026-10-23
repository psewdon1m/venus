/** Finite/inert controls only. No Docker, live API, browser, approval or real measurement claim. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,readdirSync,unlinkSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {absoluteBudget,bounded,assertFreshScope,assertKeyboard,assertObservation,assertNativeZoom,safeFailure,ownControlRequirements} from './probe-policy.mjs';
import {assertBinding,captureProducer,assertUnchanged,runtimeDigest} from './runner-policy.mjs';
import {domAudit,focusAudit} from './dom-audit.mjs';
import {screenshotBudget} from './measure.mjs';
const results=[];async function test(name,fn){await fn();results.push({name,status:'PASS'});}
const clone=structuredClone,dir=mkdtempSync(join(tmpdir(),'venus-layout-inert-'));
try{
 await test('absolute-deadline-is-not-refreshed',()=>{let now=0;const b=absoluteBudget(20,()=>now);now=19;assert.equal(b.remaining(),1);b.check();now=20;assert.throws(()=>b.check());assert.equal(b.remaining(),0);});
 await test('bounded-pending-operation-fails',async()=>{await assert.rejects(()=>bounded(absoluteBudget(15),'inert-never',()=>new Promise(()=>{})),/ABSOLUTE_SCENE_DEADLINE_EXHAUSTED/);});
 await test('native-deadline-unaffected-by-wall-rollback',()=>{const saved=Date.now;try{const b=absoluteBudget(1000);Date.now=()=>0;assert(b.remaining()>0&&b.remaining()<=1000);b.check();}finally{Date.now=saved;}});
 const fixture={session:'s',game_rev:2,plan:{round_id:'r',round_index:1}},scope={session_id:'s',round_id:'r',round_index:1,game_rev:3,state:'active',round_state:'pending',started_monotonic_ms:0,received_monotonic_ms:0};
 await test('scope-positive',()=>assertFreshScope(scope,fixture,4999));
 for(const[name,mutate,now]of [['lease-expired',v=>v,5000],['future-receipt',v=>v.received_monotonic_ms=6000,5000],['wrong-session',v=>v.session_id='old',100],['wrong-round',v=>v.round_id='old',100],['wrong-index',v=>v.round_index=2,100],['old-revision',v=>v.game_rev=1,100],['stopped-scope',v=>v.round_state='stopped',100]])await test(name+'-rejected',()=>{const v=clone(scope);mutate(v);assert.throws(()=>assertFreshScope(v,fixture,now));});
 const own={schema_version:2,room_id:'room',member_id:'member',session_id:'s',round_id:'r',game_rev:3,started_monotonic_ms:0,received_monotonic_ms:1,server_time:'2026-10-20T00:00:00Z',expires_at:'2026-10-20T00:00:05Z',session_actions:{pause:false,stop:true,abort:false,resume:false,advance:false},round_actions:{finish:false,skip:false,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,decline_invitation:false,accept_action:false,withdraw_action:false},conversation_actions:{other_question:true,respond_topic:false,offer_topic:false,offer_advice:false,chat:false}},actor={room:'room',id:'member',lastGameView:{game_rev:3}};
 await test('own-controls-from-recipient-facts-no-host-inference',()=>assert.deepEqual(ownControlRequirements(own,fixture,actor,100),['game-stop','topic-other']));
 for(const[name,mutate,now]of [['wrong-recipient',v=>v.member_id='other',100],['wrong-room',v=>v.room_id='other',100],['old-UI-revision',v=>v.game_rev=2,100],['bad-expiry',v=>v.expires_at='invalid',100],['expired-relative-TTL',v=>v.expires_at='2026-10-20T00:00:01Z',1001],['request-aged-before-response',v=>v.received_monotonic_ms=4999,5000],['untyped-permission',v=>v.session_actions.stop='true',100]])await test('own-control-'+name+'-rejected',()=>{const v=clone(own);mutate(v);assert.throws(()=>ownControlRequirements(v,fixture,actor,now));});
 const key={controls:[{id:'game-stop',focus_visible:true,in_viewport:true,not_occluded:true,focus_contrast_unresolved:false,focus_contrast_ratio:5}],truncated:false};
 await test('keyboard-positive',()=>assertKeyboard(key,['game-stop']));
 for(const[name,mutate]of [['unreachable',v=>v.controls=[]],['hidden-focus',v=>v.controls[0].focus_visible=false],['outside-viewport',v=>v.controls[0].in_viewport=false],['occluded',v=>v.controls[0].not_occluded=false],['truncated',v=>v.truncated=true],['focus-contrast-low',v=>v.controls[0].focus_contrast_ratio=2],['focus-contrast-unresolved',v=>v.controls[0].focus_contrast_unresolved=true]])await test(name+'-rejected',()=>{const v=clone(key);mutate(v);assert.throws(()=>assertKeyboard(v,['game-stop']));});
 const native={css_zoom:'1',before_dpr:1,after_dpr:2,before_width:640,after_width:320,scroll_width:320};
 await test('native200-positive',()=>assertNativeZoom(native));
 for(const[name,mutate]of [['css-zoom',v=>v.css_zoom='2'],['overshoot225',v=>v.after_dpr=2.25],['no-reflow',v=>v.after_width=640],['overflow',v=>v.scroll_width=323]])await test(name+'-rejected',()=>{const v=clone(native);mutate(v);assert.throws(()=>assertNativeZoom(v));});
 const binding=JSON.parse(readFileSync('.artifacts/p05-v2-layout-producer-resume02/binding.json','utf8')),ack={root_run_ack:true,independent_producer_review:'PASS',independent_review_index_sha256:'a'.repeat(64),producer_runtime_digest:'b'.repeat(64),source_identity:binding.source_identity,image:binding.image};
 await test('binding-positive-inert',()=>assertBinding(binding,ack));
 for(const[name,mutate]of [['runACKfalse',v=>v.root_run_ack=false],['review-pending',v=>v.independent_producer_review='PENDING'],['wrong-source',v=>v.source_identity='c'.repeat(64)],['wrong-image',v=>v.image='sha256:'+'d'.repeat(64)],['missing-review-index',v=>v.independent_review_index_sha256=null]])await test(name+'-rejected',()=>{const v=clone(ack);mutate(v);assert.throws(()=>assertBinding(binding,v));});
 writeFileSync(join(dir,'a.mjs'),'one');const before=captureProducer(dir);
 await test('dynamic-file-positive',()=>assertUnchanged(before,captureProducer(dir)));
 await test('added-file-rejected',()=>{writeFileSync(join(dir,'added.mjs'),'new');assert.throws(()=>assertUnchanged(before,captureProducer(dir)));unlinkSync(join(dir,'added.mjs'));});
 await test('changed-file-rejected',()=>{writeFileSync(join(dir,'a.mjs'),'two');assert.throws(()=>assertUnchanged(before,captureProducer(dir)));writeFileSync(join(dir,'a.mjs'),'one');});
 await test('removed-file-rejected',()=>{unlinkSync(join(dir,'a.mjs'));assert.throws(()=>assertUnchanged(before,captureProducer(dir)));writeFileSync(join(dir,'a.mjs'),'one');});
 await test('runtime-digest-detects-code-name',()=>assert.notEqual(runtimeDigest(before),runtimeDigest({...before,'new.mjs':{type:'file',sha256:'x',bytes:1}})));
 await test('symlink-type-rejected',()=>{symlinkSync(join(dir,'a.mjs'),join(dir,'link.mjs'),'file');assert.throws(()=>captureProducer(dir));unlinkSync(join(dir,'link.mjs'));});
 await test('error-secrets-never-projected',()=>{assert.deepEqual(safeFailure(Error('cookie=SECRET private text')), {name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});assert.equal(safeFailure(Error('SCENE_PROJECTION_MISSING:private-sensitive')).code,'SCENE_PROJECTION_MISSING');});
 await test('PNG-signature-budget-positive',()=>{const file=join(dir,'ok.png');writeFileSync(file,Buffer.from('89504e470d0a1a0a','hex'));assert.equal(screenshotBudget().accept(file).bytes,8);});
 await test('non-PNG-rejected',()=>{const file=join(dir,'bad.png');writeFileSync(file,'notPNG');assert.throws(()=>screenshotBudget().accept(file));});
 await test('oversize-screenshot-rejected',()=>{const file=join(dir,'large.png');writeFileSync(file,Buffer.alloc(3*1024*1024+1));assert.throws(()=>screenshotBudget().accept(file));});
 // Execute the exact audit functions against declared inert DOM objects to exercise math and failure policy.
 const original=Object.fromEntries(['document','window','getComputedStyle','matchMedia','Node'].map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 function dom(){
  const style={backgroundColor:'rgb(255, 255, 255)',backgroundImage:'none',opacity:'1',color:'rgb(0, 0, 0)',fontSize:'16px',fontWeight:'400',animationName:'none',animationDuration:'0s',transitionDuration:'0s',appearance:'none',borderTopWidth:'1px',borderTopColor:'rgb(0, 0, 0)',outlineWidth:'3px',outlineStyle:'solid',outlineColor:'rgb(0, 0, 0)',boxShadow:'none',zoom:'1',visibility:'visible',display:'block'};
  const make=(tag,id)=>({tagName:tag.toUpperCase(),id,style:{...style},parentElement:null,childNodes:[{nodeType:3,textContent:'synthetic'}],textContent:'synthetic',labels:[{textContent:'synthetic'}],getBoundingClientRect(){return {left:0,top:0,right:100,bottom:44,width:100,height:44};},getAttribute(n){return n==='data-testid'?id:null;},closest(){return null;},contains(e){return e===this;},matches(selector){if(selector===':focus-visible')return true;if(selector===':disabled')return false;return selector.toLowerCase().split(',').some(s=>s.trim().startsWith(tag));}});
  const root=make('html','root'),body=make('body','body'),button=make('button','game-stop');body.parentElement=root;button.parentElement=body;root.clientWidth=320;root.scrollWidth=320;const doc={body,documentElement:root,activeElement:button,scrollingElement:{scrollTop:0},querySelectorAll(){return [button];},getElementById(){return null;},elementFromPoint(){return button;}};
  Object.assign(globalThis,{document:doc,window:{innerWidth:320,innerHeight:568,devicePixelRatio:1},getComputedStyle:e=>e.style,matchMedia:()=>({matches:true}),Node:{TEXT_NODE:3}});return {root,body,button,doc,make};
 }
 try{
  await test('exact-DOM-audit-positive-inert',()=>{dom();assertObservation(domAudit());});
  await test('exact-DOM-low-text-contrast-rejected',()=>{const d=dom();d.button.style.color='rgb(190, 190, 190)';const a=domAudit();assert(a.contrast_failures>0);assert.throws(()=>assertObservation(a));});
  await test('exact-DOM-gradient-unresolved-rejected',()=>{const d=dom();d.body.style.backgroundImage='linear-gradient(white,black)';assert.throws(()=>assertObservation(domAudit()));});
  await test('exact-DOM-motion-rejected',()=>{const d=dom();d.button.style.transitionDuration='.2s';assert.throws(()=>assertObservation(domAudit()));});
  await test('exact-DOM-horizontal-overflow-rejected',()=>{const d=dom();d.root.scrollWidth=323;assert.throws(()=>assertObservation(domAudit()));});
  await test('exact-DOM-native-boundary-unresolved',()=>{const d=dom(),input=d.make('input','adult18');input.parentElement=d.body;input.style.appearance='auto';input.style.borderTopWidth='0px';d.doc.querySelectorAll=()=>[input];assert(domAudit().contrast_unresolved>0);});
  await test('exact-focus-positive-inert',()=>{dom();const r=focusAudit();assertKeyboard({controls:[r],truncated:false},['game-stop']);});
  await test('exact-focus-occlusion-rejected',()=>{const d=dom();d.doc.elementFromPoint=()=>({});const r=focusAudit();assert.throws(()=>assertKeyboard({controls:[r],truncated:false},['game-stop']));});
 }finally{for(const[name,descriptor]of Object.entries(original))if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
 await test('actual-host-entrypoint-ACKfalse-no-allocation',()=>{const root=resolve('.artifacts/p05'),names=readdirSync(root).sort();const r=spawnSync(process.execPath,['.artifacts/p05-v2-layout-producer-resume02/run.mjs'],{encoding:'utf8',timeout:10000});assert.notEqual(r.status,0);assert(r.stderr.includes('ROOT_RUN_ACK_REQUIRED'));assert.deepEqual(readdirSync(root).sort(),names);});
}finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert(resolve(dir).startsWith(join(resolve(tmpdir()),'venus-layout-inert-')));rmSync(dir,{recursive:true,force:true});}
console.log(JSON.stringify({scope:'AUTHOR_FINITE_INERT_ONLY_NO_BROWSER_NO_DOCKER',count:results.length,results},null,2));
