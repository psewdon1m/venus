import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {syntheticCards,syntheticManifest,playerId} from '../../../../tests/p03/fixtures.mjs';
import {FrozenPack,digest,canonical} from '../../../../packages/relationship-engine/src/pack.js';
import {policyDigest} from '../../../../packages/relationship-engine/src/policy-identity.js';
import {algorithmRevision} from '../../../../packages/relationship-engine/src/engine.js';
import {FrozenTopicMap,TOPIC_MAP_VERSION,syntheticTopicFixtureCapability} from '../../../../packages/relationship-engine/src/topic-map.js';
import {immutableTopicSnapshot,immutableTopicHistory,createTopicHistory,selectNextTopicRound,replaceTopicCandidate,recordTopicOutcome,topicPublicProjection,preflightTopics,TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY} from '../../../../packages/relationship-engine/src/topic-planner.js';

// Public machine-card generator reused; all classifications/assertions below are independent.
const hash=(x:any)=>createHash('sha256').update(x).digest('hex');
const cards=syntheticCards(),pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
const status={classification_status:'SYNTHETIC_MACHINE_FIXTURE',approved:false,runtime_eligible:false,owner_review_status:'SYNTHETIC_ONLY'};
function docs(){
 const taxonomy={schema:TOPIC_MAP_VERSION,taxonomy_revision:'INDEPENDENT-1',...status,topics:['base','extra'].map(topic_id=>({topic_id,labels:{ru:topic_id,en:topic_id,tr:topic_id}}))};
 const semantic={schema:TOPIC_MAP_VERSION,semantic_revision:'INDEPENDENT-1',...status,families:pack.cards.map(c=>({semantic_family_id:'F-'+c.id,classification:'IDENTITY_ONLY',mixed_visibility:false,repertoire:'eligible',members:[{card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}]}))};
 const map={schema:TOPIC_MAP_VERSION,map_revision:'INDEPENDENT-1',...status,pack_digest:pack.digest,taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),entries:pack.cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,topic_ids:Number(c.id.split('-')[1])%3===0?['base','extra']:['base'],semantic_family_ids:['F-'+c.id],locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale]).map(([f,t])=>[f,hash(t)]))]))}))};return {map,taxonomy,semantic};
}
const encode=(d:any)=>Object.fromEntries(Object.entries(d).map(([k,v])=>[k,Buffer.from(JSON.stringify(v))]));
const cap=syntheticTopicFixtureCapability();
const raw=encode(docs());const map=FrozenTopicMap.syntheticFixture(raw as any,pack,cap);
const room='81000000-0000-4000-8000-000000000001',session='82000000-0000-4000-8000-000000000001';
function snap(seed:string,mode='questions',size=4,total_rounds=20){
 const baseline={schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,room_id:room,session_id:session,seed:hash(seed),mode,context:'in_person',total_rounds,capabilities:['private_text_chat'],players:Array.from({length:size},(_,i)=>({id:playerId(i),comfort:4,edges:Object.fromEntries(Array.from({length:size},(_,j)=>[playerId(j),{relation:'in_relationships',explicit:true}]).filter(([id])=>id!==playerId(i)))}))};
 return immutableTopicSnapshot({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,baseline,pins_digest:digest(map.pins)} as any,pack,map);
}
const state=(s:any,allow=['base','extra'],revision=1)=>({room_id:room,revision,members:s.baseline.players.map((p:any)=>({member_id:p.id,revision,allow_topic_ids:[...allow],excluded_topic_ids:[]}))});
function release(s:any,h:any){const r=h.rounds.at(-1);return recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:r.interaction==='pair_private'?r.attempts.at(-1).offer_epoch:null,card:r.card,outcome:'disclosed'}).history;}
function privatePrefix(s=snap('prefix')){let h=createTopicHistory(s,pack,map);for(let i=0;i<s.baseline.total_rounds;i++){h=selectNextTopicRound(s,h,pack,map,state(s)).history;if(h.rounds.at(-1)!.interaction==='pair_private')return {s,h,r:h.rounds.at(-1)!};h=release(s,h);}throw Error('No private fixture');}
 function row(id:string,actors:string[],sequence=1){const c=pack.card(id);return {card_id:id,card_revision:c.revision,card_sha256:digest(c),sequence,room_id:room,session_id:'83000000-0000-4000-8000-000000000001',round_id:'84000000-0000-4000-8000-'+String(sequence).padStart(12,'0'),pack_digest:pack.digest,map_sha256:map.pins.map_sha256,repertoire_digest:map.pins.repertoire_digest,mode:c.mode,context:'in_person',interaction:c.interaction,actors,primary_member_id:actors[0]??playerId(0),stage:Math.max(c.min_progression_stage,c.interaction==='pair_private'?3:1),disclosure:'disclosed'};}

describe('independent adversarial topic planner component gate',()=>{
 for(const mode of ['questions','truth_or_dare','yes_but'])for(const seed of ['delta-A','delta-B','delta-C','delta-D'])it(`actual public release sequence independent ${mode}/${seed}`,()=>{
  const s=snap(seed,mode),aState=state(s),bState=state(s,[],31);let a=createTopicHistory(s,pack,map),b=createTopicHistory(s,pack,map);
  for(let i=0;i<20;i++){
   a=selectNextTopicRound(s,a,pack,map,aState).history;b=selectNextTopicRound(s,b,pack,map,bState).history;
   let ar=a.rounds.at(-1)!,br=b.rounds.at(-1)!;expect([ar.round_id,ar.round_index,ar.interaction]).toEqual([br.round_id,br.round_index,br.interaction]);
   if(ar.interaction==='pair_private'){
    // Change actual private RNG demand/history/disposition/intensity, keep public slots unchanged.
    if(ar.card){a=replaceTopicCandidate(s,a,pack,map,aState,{expected_history_revision:a.revision,round_id:ar.round_id,offer_epoch:9,candidate_counter:1}).history;ar=a.rounds.at(-1)!;
     if(ar.card)a=recordTopicOutcome(s,a,pack,map,{expected_history_revision:a.revision,round_id:ar.round_id,offer_epoch:9,card:ar.card,outcome:i%2?'disclosed':'declined'}).history;}
    expect(br.card).toBeNull();expect(topicPublicProjection(a.rounds.at(-1)!,a)).toEqual(topicPublicProjection(br,b));
   }else{expect(ar).toEqual(br);a=release(s,a);b=release(s,b);expect(topicPublicProjection(a.rounds.at(-1)!,a)).toEqual(topicPublicProjection(b.rounds.at(-1)!,b));expect(topicPublicProjection(a.rounds.at(-1)!,a).kind).toBe('public');}
   expect(a.public_history).toEqual(b.public_history);
  }
 });
 it('runtime projection never serializes primary, private pair or candidate, even after private release',()=>{
  const {s,h,r}=privatePrefix(),released=release(s,h),wire=JSON.stringify(topicPublicProjection(released.rounds.at(-1)!,released));
  for(const secret of [r.card!.card_id,...r.actors,'primary_member_id','card_sha256','safety_revision','attempts'])expect(wire).not.toContain(secret);
 });
 it('default and mismatched release histories cannot expose a selected public candidate',()=>{
  const s=snap('first'),selected=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,state(s)),h=release(s,selected.history),r=h.rounds.at(-1)!;
  expect(topicPublicProjection(r).kind).toBe('generic');expect(topicPublicProjection(selected.round,h).kind).toBe('generic');
  for(const patch of [{room_id:session},{session_id:room},{pins_digest:'0'.repeat(64)},{public_history:[]},{provenance:'SIMULATION_ONLY'}])expect(topicPublicProjection(r,{...h,...patch} as any).kind).toBe('generic');
 });
 it('serialized simulation loses its in-process capability and remains rejected as runtime',()=>{
  const s=snap('sim'),sim=preflightTopics(s,pack,map,state(s));expect(sim.simulation_only).toBe(true);expect(()=>immutableTopicHistory(JSON.parse(JSON.stringify(sim.history)),s,pack,map)).toThrow('SIMULATION');
  expect(()=>selectNextTopicRound(s,JSON.parse(JSON.stringify(sim.history)),pack,map,state(s))).toThrow('SIMULATION');
  expect(topicPublicProjection(sim.history.rounds[0]!,sim.history).kind).toBe('generic');
 });
 it('replacement safe-empty leaves previous immutable inputs and stable scope',()=>{
  const {s,h,r}=privatePrefix(),before=canonical(h),safety=state(s,[],2),next=replaceTopicCandidate(s,h,pack,map,safety,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:7,candidate_counter:1});
  expect(canonical(h)).toBe(before);expect(next.round.card).toBeNull();for(const k of ['actors','primary_member_id','round_index','round_id','stage','mode'])expect((next.round as any)[k]).toEqual((r as any)[k]);
  expect(next.round.attempts[0]!.state).toBe('replaced');expect(next.round.attempts[1]!.state).toBe('empty');expect(Object.isFrozen(next.history.private_history)).toBe(true);
 });
 for(const [name,mutate]of Object.entries({
  'floor':(h:any)=>h.safety_revision=0,
  'attempt future':(h:any)=>h.rounds.at(-1).attempts.at(-1).safety_revision=99,
  'unknown reference':(h:any)=>h.rounds.at(-1).card.card_id='Q-9999',
  'unknown pins':(h:any)=>h.pins_digest='f'.repeat(64),
  'changed session':(h:any)=>h.rounds.at(-1).session_id=room,
  'changed actor order':(h:any)=>h.rounds.at(-1).actors.reverse(),
  'missing audit record':(h:any)=>h.private_history.pop(),
  'fake disclosed':(h:any)=>h.private_history.at(-1).disclosure='disclosed',
  'public selected record':(h:any)=>h.public_history[0].disclosure='selected',
  'unknown revision':(h:any)=>h.schema=3,
  'foreign prior room':(h:any)=>h.public_history[0].room_id=session,
 }))it(`restore rejects ${name}`,()=>{const {s,h}=privatePrefix(),changed=structuredClone(h);mutate(changed);expect(()=>immutableTopicHistory(changed,s,pack,map)).toThrow();});
 it('same unordered pair prior blocks candidate while another pair record does not block its card',()=>{
  const s=snap('pair-local','questions',2),own=[row('Q-0104',[playerId(1),playerId(0)])],other=[row('Q-0104',[playerId(6),playerId(7)])];
  const ownRun=preflightTopics(s,pack,map,state(s),{public_history:[],private_history:own} as any);expect(ownRun.history.rounds.some(r=>r.card?.card_id==='Q-0104')).toBe(false);
  // Exact independently constrained map remains whole; compare candidate branch against absence across seeds.
  for(let n=0;n<8;n++){const t=snap('pair-isolation-'+n,'questions',2),x=preflightTopics(t,pack,map,state(t)),y=preflightTopics(t,pack,map,state(t),{public_history:[],private_history:other} as any);
   expect(x.history.public_history).toEqual(y.history.public_history);expect(y.history.private_history[0]!.actors).toEqual(other[0]!.actors);}
 });
 it('refuses forged fixture capability and candidate-shaped input rather than normalizing',()=>{
  expect(()=>FrozenTopicMap.syntheticFixture(raw as any,pack,{scope:'SYNTHETIC_TOPIC_FIXTURE_ONLY'})).toThrow('FIXTURE_ONLY');
  expect(()=>FrozenTopicMap.syntheticFixture({...raw,map:Buffer.from('{"schema":1,"approved":false,"runtime_eligible":false}')} as any,pack,cap)).toThrow();
  const d=docs();(d.map as any).entries[0].locale_field_sha256.tr={};expect(()=>FrozenTopicMap.syntheticFixture(encode(d) as any,pack,cap)).toThrow();
 });
 it('constrained singleton private pool proves no cross-pair card suppression',()=>{
  const s=snap('singleton-proof','questions',2),pair=[playerId(0),playerId(1)];
  const exhausted=pack.cards.filter(c=>c.mode==='questions'&&c.interaction==='pair_private'&&c.id!=='Q-0104').map((c,i)=>row(c.id,pair,i+1));
  const foreign=[...exhausted,row('Q-0104',[playerId(6),playerId(7)],exhausted.length+1)],own=[...exhausted,row('Q-0104',pair,exhausted.length+1)];
  const allowed=preflightTopics(s,pack,map,state(s),{public_history:[],private_history:foreign} as any),denied=preflightTopics(s,pack,map,state(s),{public_history:[],private_history:own} as any);
  expect(allowed.private_playable).toBe(1);expect(allowed.history.rounds.filter(r=>r.interaction==='pair_private'&&r.card).map(r=>r.card!.card_id)).toEqual(['Q-0104']);expect(denied.private_playable).toBe(0);
  expect(allowed.history.public_history).toEqual(denied.history.public_history);
 });
 it('strict parser rejects escaped duplicate keys, truncated escape, infinity and malformed UTF8',()=>{
  for(const bytes of [Buffer.from('{"x":1,"\\u0078":2}'),Buffer.from('{"x":"\\'),Buffer.from('{"x":1e309}'),Buffer.from([0xc0,0xaf])])expect(()=>FrozenTopicMap.syntheticFixture({...raw,map:bytes} as any,pack,cap)).toThrow('TOPIC_JSON');
 });
 it('rejects backward and same-revision changed safety and terminal-decline resurrection',()=>{
  const {s,h,r}=privatePrefix(),base={expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1};
  expect(()=>replaceTopicCandidate(s,h,pack,map,state(s,[],1),base)).toThrow('SAFETY');
  const terminal=recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:1,card:r.card!,outcome:'declined'}).history;
  expect(()=>replaceTopicCandidate(s,terminal,pack,map,state(s),{...base,expected_history_revision:terminal.revision})).toThrow('LIMIT');
  expect(()=>recordTopicOutcome(s,terminal,pack,map,{expected_history_revision:terminal.revision,round_id:r.round_id,offer_epoch:1,card:r.card!,outcome:'disclosed'})).toThrow('STALE');
 });
});
