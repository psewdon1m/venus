/** Author controls: helpers + deliberately fake planner. No r4 planner run. */
import assert from 'node:assert/strict';
import {axes,cells,cellAt,safetyState,fullUnionAllowed,staticCell,runPreflight,canaryCell,assertExecutionRequest} from '../../../../../.artifacts/p05-r4-v2-c2-consumer02/consumer.mjs';
const results=[];
const test=(name,fn)=>{fn();results.push({name,status:'PASS',scope:'AUTHOR_FINITE_HELPER_FAKE_NOT_ACTUAL_C2'});};
const error=code=>Object.assign(new Error('RAW_CANARY_NOT_LOGGED'),{code});
const cell={size:2,mode:'questions',context:'in_person',comfort:1,pairClass:'F',stage:3,rounds:20,cap:'ON',regime:'all_allow',profile:'private_R100'};
const topics=['creative_expression','music_sound','friendship'];
const cards=[{id:'P',mode:'questions',interaction:'pair_private',participants_required:2,relationship_scope:'friend_or_more',min_comfort:1},{id:'Q',mode:'questions',interaction:'pair_private',participants_required:2,relationship_scope:'friend_or_more',min_comfort:1},{id:'U',mode:'questions',interaction:'solo',participants_required:1}];
const entries={P:{topic_ids:['creative_expression','music_sound'],semantic_family_ids:['PF']},Q:{topic_ids:['creative_expression'],semantic_family_ids:['QF']},U:{topic_ids:['friendship'],semantic_family_ids:['UF']}};
const map={topics:topics.map(topic_id=>({topic_id})),entry:id=>entries[id],allowed:()=>true};
const snapshot=(c,session_id='22222222-2222-4222-8222-222222222222')=>({baseline:{room_id:'room',session_id,players:[{id:'A'},{id:'B'}],...c}});
const pack={cards,card:id=>cards.find(c=>c.id===id)};
const round=(index,privateId=null)=>({round_id:'round-'+index,round_index:index,stage:privateId?3:1,interaction:privateId?'pair_private':'solo',actors:privateId?['A','B']:['A'],primary_member_id:'A',baseline_private_max_intensity:privateId?1:0,requires_action_consent:!!privateId,card:{card_id:privateId??'U'},attempts:privateId?[{offer_epoch:1,candidate_counter:0}]:[]});
function result(id=null,prior={public_history:[],private_history:[]}){
 const rounds=Array.from({length:20},(_,i)=>round(i+1,i===19?id:null));
 return {simulation_only:true,planned_rounds:20,private_opportunities:id?1:0,private_playable:id?1:0,private_safe_empty:0,history:{provenance:'SIMULATION_ONLY',revision:20,rounds,public_history:[...prior.public_history],private_history:[...prior.private_history,...(id?[{card_id:id,actors:['A','B']}]:[])]}};
}
const env={pack,map,snapshot,eligible:()=>true,preflightTopics:()=>result(),targetVersion:'fake-version'};


const cases=[];const check=(name,fn)=>{fn();cases.push(name);};
const execute=raw=>runPreflight(cell,{...env,preflightTopics:()=>raw});
const reject=raw=>assert.throws(()=>execute(raw),{code:'ERR_ASSERTION'});
check('prior exact null-card/playable1 counterexample rejected',()=>{const r=result('P');r.history.rounds.at(-1).card=null;r.history.private_history=[];reject(r);});
check('nonempty mislabeled safe-empty rejected',()=>{const r=result('P');r.private_playable=0;r.private_safe_empty=1;reject(r);});
check('genuine playable remains playable',()=>{const r=execute(result('P'));assert.equal(r.private_playable,1);assert.equal(r.private_safe_empty,0);assert.equal(r.status,'PLANNED_SIMULATION_ONLY');});
check('genuine empty remains explicit separate status',()=>{const r=result('P');r.history.rounds.at(-1).card=null;r.history.private_history=[];r.private_playable=0;r.private_safe_empty=1;assert.equal(execute(r).status,'PLANNED_WITH_PRIVATE_SAFE_EMPTY');});
for(const key of ['private_opportunities','private_playable','private_safe_empty'])for(const v of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1',null,undefined])check(key+' invalid '+String(v),()=>{const r=result('P');r[key]=v;reject(r);});
for(const v of [undefined,[],false,0,{},'P'])check('malformed reference '+JSON.stringify(v),()=>{const r=result('P');r.history.rounds.at(-1).card=v;reject(r);});
console.log(JSON.stringify({status:'PASS_TARGETED_ORACLE_ONLY',cases:cases.length,checks:cases,actual_preflight_calls:0,actual_C2:'NOT_RUN'},null,2));
