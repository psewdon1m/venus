import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {writeFileSync,readFileSync} from 'node:fs';
import {sourceFixture} from './fixture-adapter.mjs';
import {algorithmRevision,policyDigest,digest,eligible,progressionStage,immutableTopicSnapshot,createTopicHistory,selectNextTopicRound,recordTopicOutcome,TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY} from './compiled/index.js';
const base='.docs/implementation/reviews/p05/topic-anti-repeat-prospective-round01';
const {pack,map}=sourceFixture(),players=Array.from({length:3},(_,i)=>({id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),comfort:4,edges:{}}));
for(const p of players)for(const q of players)if(p!==q)p.edges[q.id]={relation:'friendship',explicit:true};
const pair=ids=>[...ids].sort().join(':'),sha=s=>createHash('sha256').update(s).digest('hex');
const minimal=process.argv.includes('--minimal'),seeds=Array.from({length:minimal?1:16},(_,i)=>'venus:P05-ANTI-REPEAT-DIAGNOSTIC-1:'+i); // Complete fixed diagnostic grid; not a statistical or measurement seed search.
const records=[];
for(const literal of seeds){
 const baseline={schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,room_id:'11111111-1111-4111-8111-111111111111',session_id:'22222222-2222-4222-8222-222222222222',seed:sha(literal),mode:'questions',context:'in_person',total_rounds:40,players,capabilities:[]};
 const snapshot=immutableTopicSnapshot({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,baseline,pins_digest:digest(map.pins)},pack,map);
 let safety={room_id:baseline.room_id,revision:1,members:players.map(p=>({member_id:p.id,revision:1,allow_topic_ids:[],excluded_topic_ids:[]}))},history=createTopicHistory(snapshot,pack,map),first=null,second=null,observations=[];
 for(let i=0;i<40;i++){
  const before=history,result=selectNextTopicRound(snapshot,history,pack,map,safety);history=result.history;
  observations.push({round:result.round.round_index,stage:result.round.stage,interaction:result.round.interaction,pair:result.round.actors.length===2?pair(result.round.actors):null,card:result.round.card?.card_id??null,safety_revision:safety.revision,private_history_count_before:before.private_history.length});
  if(result.round.interaction==='pair_private'){
   if(!first){assert.equal(result.round.card,null);assert.equal(history.private_history.length,0);first=result.round;
    safety={...safety,revision:2,members:safety.members.map(p=>({...p,revision:2,allow_topic_ids:['creative','music','romance']}))};
   }else{second=result.round;
    const effective=[];
    for(let a=0;a<players.length;a++)for(let b=a+1;b<players.length;b++){
     const ids=[players[a].id,players[b].id],publicFamilies=new Set(before.public_history.flatMap(r=>map.entry(r.card_id).semantic_family_ids)),cards=pack.cards.filter(c=>c.interaction==='pair_private'&&map.allowed(c)&&eligible(c,snapshot.baseline,ids,result.round.stage)&&!map.entry(c.id).semantic_family_ids.some(f=>publicFamilies.has(f))&&ids.every(id=>{const pref=safety.members.find(m=>m.member_id===id);return map.entry(c.id).topic_ids.every(t=>pref.allow_topic_ids.includes(t)&&!pref.excluded_topic_ids.includes(t));}));
     if(cards.length)effective.push({pair:pair(ids),card_count:cards.length,family_count:new Set(cards.flatMap(c=>map.entry(c.id).semantic_family_ids)).size});
    }
    // No private record exists before this decision, public/private family sets are disjoint in this fixture.
    assert.equal(before.private_history.length,0);assert(effective.some(v=>v.pair!==pair(first.actors)));assert(second.card);
    const repeat=pair(first.actors)===pair(second.actors);records.push({seed_literal:literal,seed_sha256:baseline.seed,status:repeat?'FAIL_STRICT_PREVIOUS_ACTUAL_PAIR':'PASS_CONTROL',first_empty_opportunity:{round:first.round_index,actors:first.actors,card:null},second_opportunity:{round:second.round_index,actors:second.actors,card:second.card.card_id},previous_history_bearing_pair:null,effective_unused_alternative_pairs:effective.filter(v=>v.pair!==pair(first.actors)),observations});break;
   }
  }
  if(result.round.card&&result.round.interaction!=='pair_private')history=recordTopicOutcome(snapshot,history,pack,map,{expected_history_revision:history.revision,round_id:result.round.round_id,offer_epoch:null,card:result.round.card,outcome:'disclosed'}).history;
 }
 if(!second)records.push({seed_literal:literal,seed_sha256:baseline.seed,status:'NO_SECOND_OPPORTUNITY',observations});
}
const failed=records.filter(r=>r.status==='FAIL_STRICT_PREVIOUS_ACTUAL_PAIR'),result={schema_version:1,status:failed.length?'CONFIRMED_STRICT_ANTI_REPEAT_COUNTEREXAMPLE':'NO_COUNTEREXAMPLE_IN_FIXED_DIAGNOSTIC_GRID',scope:'SOURCE_BOUND_PURE_UNIT_DIAGNOSTIC_NOT_RUNTIME_OR_STATISTICS',source_identity:'EXCLUDED_EF1E1122_ENGINE2_PROSPECTIVE_NOT_PRODUCT',fixture:'CURRENT_MACHINE_CONTEXT_FIXTURE_2_NO_REGISTRY_MUTATIONS',fixed_seeds:seeds.length,failures:failed.length,controls:records.filter(r=>r.status==='PASS_CONTROL').length,missing:records.filter(r=>r.status==='NO_SECOND_OPPORTUNITY').length,pack_digest:pack.digest,map_pins:map.pins,records};
writeFileSync(base+'/'+(minimal?'minimal-result.json':'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,failures:result.failures,controls:result.controls,missing:result.missing,first_failure:failed[0]??null}));if(failed.length)process.exitCode=1;
