/** Four finite INERT checks of the exact changed prefix; no browser/API/native execution. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const producer=process.argv[2];
const {assertFreshScope,ownControlRequirements,absoluteBudget}=await import(pathToFileURL(producer+'/probe-policy.mjs'));
const source=readFileSync(producer+'/measure.mjs','utf8');
const start=source.indexOf('export async function measureRole('),end=source.indexOf(' for(const control of required)',start);
assert(start>=0&&end>start);
const prefix=source.slice(start,end).replace('export async function measureRole','async function');
const fixture={session:'INERT_SESSION',game_rev:10,plan:{round_id:'INERT_ROUND',round_index:1}};
const game=(now,rev=10)=>({started_monotonic_ms:now,received_monotonic_ms:now,session_id:fixture.session,round_id:fixture.plan.round_id,round_index:1,game_rev:rev,state:'active',round_state:'active'});
const own=(now,rev=10)=>({started_monotonic_ms:now,received_monotonic_ms:now,schema_version:2,room_id:'INERT_ROOM',member_id:'INERT_MEMBER',session_id:fixture.session,round_id:fixture.plan.round_id,game_rev:rev,server_time:'2026-10-23T00:00:00.000Z',expires_at:'2026-10-23T00:00:05.000Z',session_actions:{pause:true,stop:false,abort:false,resume:false,advance:false},round_actions:{finish:false,skip:false,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,decline_invitation:false,accept_action:false,withdraw_action:false},conversation_actions:{other_question:false,respond_topic:false,offer_topic:false,offer_advice:false,chat:false}});
async function scenario(kind){
 let now=1000,preparations=0;const delays=[],checkpoints=[],actor={id:'INERT_MEMBER',room:'INERT_ROOM',lastGameView:game(now),lastSelfActions:own(now),page:{}};
 const budget=absoluteBudget(kind==='expired'?6000:300,()=>now),deadline=budget.deadline;
 const forbidden=Error('SCENE_FORBIDDEN_PROJECTION:game-condition-input');
 const prepare=async(page,scene,role,required,sameBudget)=>{
  assert.strictEqual(page,actor.page);assert.equal(scene,'yes_but_condition');assert.equal(role,'primary');assert.deepEqual(required,['game-pause']);assert.strictEqual(sameBudget,budget);preparations++;
  if(kind==='forbidden')throw forbidden;
  if(kind==='expired')now+=5001;
  else if(kind==='race'&&preparations===1){actor.lastGameView=game(now);actor.lastSelfActions=own(now);}
  else if(kind==='race'&&preparations===2)actor.lastGameView=game(now,11);
  else now++;
 };
 const delay=async ms=>{assert(ms>0&&ms<=25);delays.push(ms);now+=ms;if(kind==='race'&&delays.length===2)actor.lastSelfActions=own(now,11);};
 const operation=Function('assert','performance','windowFor','assertFreshScope','ownControlRequirements','prepareSceneProjection','delay','return ('+prefix+'return required;})')(assert,{now:()=>now},async()=>{},assertFreshScope,ownControlRequirements,prepare,delay);
 const invoke=()=>operation({role:'primary',actor},'yes_but_condition',fixture,{}, {budget,xserver:null,output:null,screenshots:null,onCheckpoint:value=>checkpoints.push(value)});
 if(kind==='expired')await assert.rejects(invoke,/ABSOLUTE_SCENE_DEADLINE_EXHAUSTED/);
 else if(kind==='forbidden')await assert.rejects(invoke,error=>error===forbidden);
 else assert.deepEqual(await invoke(),['game-pause']);
 assert.equal(budget.deadline,deadline,'No renewed absolute budget');
 if(kind==='stable'){assert.equal(preparations,1);assert.deepEqual(delays,[]);}
 if(kind==='race'){assert.equal(preparations,3);assert.deepEqual(delays,[25,25]);assert.equal(actor.lastGameView.game_rev,11);assert.equal(actor.lastSelfActions.game_rev,11);}
 if(kind==='expired'){assert.equal(preparations,1);assert(delays.length>0);assert(now>=deadline);}
 if(kind==='forbidden'){assert.equal(preparations,1);assert.deepEqual(delays,[]);}
 return {case:kind,status:'PASS',positive_DOM_preparations:preparations,delays_ms:delays,absolute_budget_unchanged:true,checkpoints};
}
const results=[];
for(const kind of ['stable','race','expired','forbidden'])results.push(await scenario(kind));
console.log(JSON.stringify({scope:'FOUR_FINITE_INERT_CHANGED_PREFIX_CHECKS_NOT_UI_ACCEPTANCE',exact_measure_prefix_sha256:createHash('sha256').update(source.slice(start,end)).digest('hex'),cases:results,actual_browser_API_native_calls:0,full_stage_PASS:false},null,2));
