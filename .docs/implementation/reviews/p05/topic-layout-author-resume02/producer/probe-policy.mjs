/** Pure, inert-testable measurement policy. Permission lifetimes are never renewed here. */
import assert from 'node:assert/strict';
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
export function safeFailure(error){const prefix=String(error.message??'').split(':')[0];return {name:/^[A-Za-z0-9_]{1,64}$/.test(error.name??'')?error.name:'Error',code:/^[A-Z][A-Z0-9_]{2,80}$/.test(prefix)?prefix:'ASSERTION_OR_OPERATION_FAILED'};}
