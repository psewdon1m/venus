/** Pure, inert-testable measurement policy. Permission lifetimes are never renewed here. */
import assert from 'node:assert/strict';
import {types} from 'node:util';
import {fileURLToPath} from 'node:url';

import {performance} from 'node:perf_hooks';
import {setTimeout,clearTimeout} from 'node:timers';
export function absoluteBudget(ms,now=()=>performance.now()){
 const start=now(),deadline=start+ms;assert(ms>0&&Number.isFinite(ms));
 return {start,deadline,ms,remaining(){return Math.max(0,deadline-now());},elapsed(){return now()-start;},check(){assert(now()<deadline,'ABSOLUTE_SCENE_DEADLINE_EXHAUSTED');}};
}
export async function bounded(budget,label,operation){
 budget.check();let timer;try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('ABSOLUTE_SCENE_DEADLINE_EXHAUSTED:'+label)),budget.remaining());})]);}finally{clearTimeout(timer);budget.check();}
}
export const sweepBudget=scene=>['private_offer','truth_dare_choice','yes_but_condition'].includes(scene)?20000:60000;
export function assertFreshScope(observed,fixture,now){
 assert(observed,'UI_GAME_SCOPE_MISSING');assert(observed.received_monotonic_ms>=observed.started_monotonic_ms);assert(now>=observed.received_monotonic_ms);assert(now-observed.started_monotonic_ms<5000,'UI_GAME_OBSERVATION_STALE');
 assert.equal(observed.session_id,fixture.session);assert.equal(observed.round_id,fixture.plan.round_id);assert.equal(observed.round_index,fixture.plan.round_index);assert(observed.game_rev>=fixture.game_rev);assert.equal(observed.state,'active');assert(['pending','active'].includes(observed.round_state));
}
export function ownControlRequirements(view,fixture,actor,now){
 assert(view);assert(view.received_monotonic_ms>=view.started_monotonic_ms);assert(now>=view.received_monotonic_ms&&now-view.started_monotonic_ms<5000);assert.equal(view.session_id,fixture.session);assert.equal(view.round_id,fixture.plan.round_id);assert(view.game_rev>=fixture.game_rev);assert.equal(view.schema_version,2);assert.equal(view.room_id,actor.room);assert.equal(view.member_id,actor.id);
 if(actor.lastGameView)assert.equal(view.game_rev,actor.lastGameView.game_rev,'OWN_UI_PROJECTIONS_DIFFERENT_REVISION');
 const ttl=Date.parse(view.expires_at)-Date.parse(view.server_time);assert(Number.isFinite(ttl)&&ttl>0);assert(now-view.started_monotonic_ms<Math.min(5000,ttl),'SELF_ACTIONS_OBSERVATION_EXPIRED');
 const mappings={session_actions:{pause:'game-pause',stop:'game-stop',abort:'game-stop',resume:'game-resume',advance:'game-next'},round_actions:{finish:'game-finish',skip:'game-skip',choose_truth:'game-truth',choose_dare:'game-dare',propose_condition:'game-condition-input',accept_invitation:'pair-accept',decline_invitation:'pair-decline',accept_action:'action-accept',withdraw_action:'action-withdraw'},conversation_actions:{other_question:'topic-other',respond_topic:'topic-accept',offer_topic:'topic-new',offer_advice:'advice-input',chat:'pair-chat-input'}};
 const controls=new Set();for(const[section,fields]of Object.entries(mappings)){assert(view[section]&&typeof view[section]==='object');for(const[field,id]of Object.entries(fields)){assert.equal(typeof view[section][field],'boolean');if(view[section][field])controls.add(id);}}
 return [...controls].sort();
}
export function assertObservation(audit){
 assert(audit.reduced_motion);assert.equal(audit.motion_violations,0);assert.equal(audit.horizontal_overflow,false);assert.equal(audit.audit_overflow,false);
 assert.equal(audit.contrast_failures,0,'RENDERED_CONTRAST_FAILURE');assert.equal(audit.contrast_unresolved,0,'RENDERED_CONTRAST_UNRESOLVED');assert(audit.named_controls);assert(audit.labels_associated);
}
export function assertKeyboard(result,targets){
 assert(targets.length>0);assert.equal(result.truncated,false);assert.equal(new Set(result.controls.map(v=>v.id)).size,result.controls.length);
 for(const id of targets){const r=result.controls.find(r=>r.id===id);assert(r,'KEYBOARD_UNREACHABLE:'+id);assert(r.focus_visible,'KEYBOARD_FOCUS_INVISIBLE:'+id);assert(r.in_viewport,'KEYBOARD_FOCUS_OUTSIDE:'+id);assert(r.not_occluded,'KEYBOARD_FOCUS_OCCLUDED:'+id);assert.equal(r.focus_contrast_unresolved,false,'KEYBOARD_FOCUS_CONTRAST_UNRESOLVED:'+id);assert(r.focus_contrast_ratio>=3,'KEYBOARD_FOCUS_CONTRAST_FAILURE:'+id);}
}
export function assertNativeZoom(m){assert.equal(m.css_zoom,'1');assert.equal(m.before_dpr,1);assert(Math.abs(m.after_dpr/m.before_dpr-2)<=0.02,'NATIVE_200_NOT_MEASURED');assert(m.after_width<=m.before_width/1.9);assert.equal(m.scroll_width<=m.after_width+2,true);}
// Literal diagnostic labels only. This list never learns codes from error text.
const failureCodes=new Set(["ABSOLUTE_SCENE_DEADLINE_EXHAUSTED","ACTUAL_DOCUMENT_LOCALE_MISMATCH","BROWSER_FORCED_KILL","ERROR_METADATA_TIMEOUT","EXACT_TEXT_OWNER_REQUIRED","EXACT_V2_WINDOW_REQUIRED","KEYBOARD_FOCUS_CONTRAST_FAILURE","KEYBOARD_FOCUS_CONTRAST_UNRESOLVED","KEYBOARD_FOCUS_INVISIBLE","KEYBOARD_FOCUS_OCCLUDED","KEYBOARD_FOCUS_OUTSIDE","KEYBOARD_SAFETY_ACTION_UNAVAILABLE","KEYBOARD_UNREACHABLE","METADATA_BUDGET_EXCEEDED","METHOD12_ACTIVE_UI_SCOPE_REQUIRED","METHOD12_INTENDED_VALUE_CLEARED_BEFORE_PREPARATION","METHOD12_MUTATION_RECORD_CAP","METHOD12_PREPARATION_DEADLINE","METHOD12_PREPARATION_RECORD_CAP","METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK","METHOD12_PRIVATE_TICKET_EXPIRED","METHOD12_PRIVATE_TICKET_REQUIRED","METHOD13_ACTION_PHASE_CAP","METHOD13_ACTION_PHASE_DEADLINE","METHOD13_ACTION_RECEIPT_REV","METHOD18_PRIVATE_SETUP_MODE","METHOD18_PRIVATE_SETUP_NO_ENCOUNTER_WITHIN_3_SESSIONS","METHOD18_PRIVATE_SETUP_RECORD_CAP","METHOD18_PRIVATE_SETUP_ROOM_CHANGED","METHOD18_PRIVATE_SETUP_SCOPE","METHOD18_PRIVATE_SETUP_SELECTED_SESSION","METHOD18_PRIVATE_SETUP_SESSION","NATIVE_200_NOT_MEASURED","NATIVE_RESET_FAILED","NO_EXPECTED_KEYBOARD_CONTROLS","OBSERVER_ABSOLUTE_DEADLINE_REQUIRED","OBSERVER_ALREADY_ATTACHED","OBSERVER_CONTROL_NOT_SUPPORTED","OBSERVER_FOCUS_OPTION_INVALID","OBSERVER_INTENDED_VALUE_CHANGED","OBSERVER_INTENDED_VALUE_INVALID","OBSERVER_NOT_ATTACHED","OBSERVER_NOT_ATTACHED_OR_CLOSED","OBSERVER_PRIVATE_LEAK","OBSERVER_READY_DEADLINE","OBSERVER_SOURCE_PIN_MISMATCH","OWN_PERMITTED_CONTROL_MISSING","OWN_UI_PROJECTIONS_DIFFERENT_REVISION","P05_PRIVATE_PREPARATION_EXPIRED_BEFORE_WATCHERS","P05_REQUEST_EMISSION_OUTSIDE_OBSERVED_PRIVATE_DEADLINE","P05_UI_MUTATION_NOT_DISPATCHED","PINNED_BROWSER_VERSION_MISMATCH","PRODUCER_FILESET_OR_BYTES_CHANGED","PRODUCER_FILETYPE_FORBIDDEN","PRODUCER_SYMLINK_FORBIDDEN","PRODUCTION_MAIN_REQUIRED","REAL_TEXT_FIXTURE_PIN_MISMATCH","RENDERED_CONTRAST_FAILURE","RENDERED_CONTRAST_UNRESOLVED","ROOT_LAYOUT_RUN_ACK_REQUIRED","ROOT_RUN_ACK_REQUIRED","SCENE_FORBIDDEN_PROJECTION","SCENE_PROJECTION_MISSING","SCREENSHOT_FILE_BUDGET","SCREENSHOT_PNG_REQUIRED","SCREENSHOT_TOTAL_BUDGET","SELF_ACTIONS_OBSERVATION_EXPIRED","TEXT_PROBE_ALREADY_PRESENT","TEXT_PROBE_CLEANUP_FAILED","TEXT_PROBE_MISSING","TOKEN_IN_NATIVE_ADDRESSBAR","UI_CLOCK_DISCONTINUITY","UI_GAME_OBSERVATION_STALE","UI_GAME_SCOPE_MISSING"]);
const failureModules=["browser","measure","dom-audit","keyboard-replay","x11","probe-policy","scene-driver","runtime","private-batch-observer","observations","readiness-diagnostics","request-emission","real-text-probe","matrix","runner-policy"];
const failureLocations=failureModules.map(source_module=>({source_module,paths:[new URL('./'+source_module+'.mjs',import.meta.url)].flatMap(url=>[url.href,fileURLToPath(url).replace(/\\/g,'/')])}));
const failureKinds=[[assert.AssertionError,'AssertionError'],[TypeError,'TypeError'],[RangeError,'RangeError'],[ReferenceError,'ReferenceError'],[SyntaxError,'SyntaxError'],[URIError,'URIError'],[EvalError,'EvalError'],[AggregateError,'AggregateError'],[Error,'Error']];
const nativeStackGetter=Object.getOwnPropertyDescriptor(new Error(),'stack')?.get;
const preparer=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');
const nodePreparer=preparer&&'value'in preparer&&typeof preparer.value==='function'&&Function.prototype.toString.call(preparer.value).replace(/\r\n/g,'\n')==='function ErrorPrepareStackTrace(error, trace) {\n  return internalPrepareStackTrace(error, trace);\n}'?preparer.value:undefined;
function safeErrorChain(value){
 if(!value||typeof value!=='object')return false;
 let current=value;
 for(let depth=0;current&&depth<8;depth++){if(types.isProxy(current))return false;current=Object.getPrototypeOf(current);}
 return current===null;
}
function errorData(value,key){
 for(let current=value,depth=0;current&&depth<8;depth++,current=Object.getPrototypeOf(current)){
  const d=Object.getOwnPropertyDescriptor(current,key);if(d)return 'value'in d?d.value:undefined;
 }
}
// Fixed diagnostics only. No message/stack/code value outside these enums is emitted.
const rangeNodeCodes=new Set(['ERR_OUT_OF_RANGE','ERR_BUFFER_OUT_OF_BOUNDS','ERR_STRING_TOO_LONG','ERR_BUFFER_TOO_LARGE','ERR_FS_FILE_TOO_LARGE']);
const rangeStockKinds=new Map([['Maximum call stack size exceeded','CALL_STACK_EXHAUSTED'],['Invalid string length','INVALID_STRING_LENGTH'],['Invalid array length','INVALID_ARRAY_LENGTH'],['Array buffer allocation failed','ARRAY_BUFFER_ALLOCATION_FAILED']]);
function rangeFailureMetadata(error,name,message){
 if(name!=='RangeError')return {};const code=errorData(error,'code');return {range_error_kind:typeof message==='string'&&message.length<=128?(rangeStockKinds.get(message)??'UNKNOWN'):'UNKNOWN',node_code:typeof code==='string'&&code.length<=64&&rangeNodeCodes.has(code)?code:'UNKNOWN'};
}
function failureLocation(error,name,message,nodeCode){
 try{
  // Validate the native header before lazy formatting; comparison text may be
  // multiline but is skipped in full before examining actual frame lines.
  if(errorData(error,'name')!==name||typeof message!=='string'||message.length>8192||Buffer.byteLength(message)>8192||message.includes('\0'))return;
  const descriptor=Object.getOwnPropertyDescriptor(error,'stack');let stack;
  if(descriptor&&'value'in descriptor)stack=descriptor.value;
  else if(descriptor?.get===nativeStackGetter&&nativeStackGetter){
   const hook=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');
   if(hook&&(!('value'in hook)||!nodePreparer||hook.value!==nodePreparer))return;
   stack=nativeStackGetter.call(error);
  }
  if(typeof stack!=='string'||stack.length>16384||Buffer.byteLength(stack)>16384)return;
  const header=name+(name==='AssertionError'?' [ERR_ASSERTION]':name==='RangeError'&&rangeNodeCodes.has(nodeCode)?' ['+nodeCode+']':'')+(message?': '+message:'');
  if(!stack.startsWith(header+'\n'))return;
  for(const raw of stack.slice(header.length+1).split('\n').slice(0,16)){
   const line=raw.replace(/\\/g,'/');if(line.length>1024||!line.startsWith('    at ')||/[\r\0]/.test(line))continue;
   for(const module of failureLocations)for(const pathname of module.paths){
    const at=line.lastIndexOf(pathname);if(at<0)continue;const prefix=line.slice(0,at),parenthesized=prefix.endsWith(' (');
    if(prefix!=='    at '&&prefix!=='    at async '&&!parenthesized)continue;
    const match=/^:([1-9]\d{0,6}):([1-9]\d{0,5})(\)?)$/.exec(line.slice(at+pathname.length));
    if(!match||Boolean(match[3])!==parenthesized)continue;
    const source_line=Number(match[1]),source_column=Number(match[2]);if(source_line>1000000||source_column>100000)continue;
    return {source_module:module.source_module,source_line,source_column};
   }
  }
 }catch{/* A diagnostic must not change the original failure outcome. */}
}
export function safeFailure(error){
 const fallback={name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'};
 try{
  if(!safeErrorChain(error)||!types.isNativeError(error))return fallback;
  const name=failureKinds.find(([constructor])=>error instanceof constructor)?.[1]??'Error';
  const message=errorData(error,'message');
  const prefix=typeof message==='string'&&message.length<=8192&&Buffer.byteLength(message)<=8192?message.split(/[\r\n]/,1)[0].split(':',1)[0]:undefined;
  const range=rangeFailureMetadata(error,name,message);return {name,code:failureCodes.has(prefix)?prefix:fallback.code,...range,...failureLocation(error,name,message,range.node_code)};
 }catch{return fallback;}
}
