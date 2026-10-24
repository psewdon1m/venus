import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {syntheticCards,syntheticManifest,playerId} from '../../../tests/p03/fixtures.mjs';
import {digest,FrozenPack} from './pack.js';
import {policyDigest} from './policy-identity.js';
import {algorithmRevision,eligible,immutableSnapshot,preflight,progressionStage} from './engine.js';
import {type Card,type Snapshot,type Relation} from './types.js';
import {FrozenTopicMap,TOPIC_MAP_VERSION,syntheticTopicFixtureCapability,type RuntimeTopicMap,type RuntimeTopicTaxonomy,type RuntimeSemanticPolicy} from './topic-map.js';
import {TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY,createTopicHistory,immutableTopicHistory,immutableTopicSnapshot,
  preflightTopics,recordTopicOutcome,replaceTopicCandidate,selectNextTopicRound,topicPublicProjection,
  replaceTopicCandidateForTopics,TOPIC_TARGETED_REPLACEMENT_VERSION,
  type TopicSnapshot,type TopicSafetyState,type TopicPlannerHistory,type TopicHistoryRecord,type TopicRound,type TargetedTopicReplacementRequest} from './topic-planner.js';

const cards=syntheticCards() as Card[],pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
const sha=(v:string)=>createHash('sha256').update(v).digest('hex');
const synthetic={classification_status:'SYNTHETIC_MACHINE_FIXTURE' as const,approved:false,runtime_eligible:false,owner_review_status:'SYNTHETIC_ONLY' as const};
const taxonomy:RuntimeTopicTaxonomy={schema:TOPIC_MAP_VERSION,taxonomy_revision:'TEST-TAX-1',...synthetic,
  topics:['creative','music','romance'].map(topic_id=>({topic_id,labels:{ru:topic_id,en:topic_id,tr:topic_id}}))};
const families=new Map<string,Card[]>();
const familyFor=(c:Card)=>['Q-0003','TD-0003','YB-0003'].includes(c.id)?'PUBLIC-CROSS-MODE'
  :['Q-0104','TD-0104','YB-0104'].includes(c.id)?'PRIVATE-CROSS-MODE'
  :['Q-0001','Q-0107'].includes(c.id)?'P04-SEM-17':'SINGLE-'+c.id;
for(const c of pack.cards){const family=familyFor(c);families.set(family,[...(families.get(family)??[]),c]);}
const semantic:RuntimeSemanticPolicy={schema:TOPIC_MAP_VERSION,semantic_revision:'TEST-SEM-1',...synthetic,
  families:[...families].map(([semantic_family_id,members])=>({semantic_family_id,classification:members.length===1?'IDENTITY_ONLY':'EXPLICIT_FAMILY',
    mixed_visibility:semantic_family_id==='P04-SEM-17',repertoire:semantic_family_id==='P04-SEM-17'?'exclude':'eligible',
    members:members.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}))}))};
const doc:RuntimeTopicMap={schema:TOPIC_MAP_VERSION,map_revision:'TEST-MAP-1',...synthetic,pack_digest:pack.digest,
  taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),entries:pack.cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,
    topic_ids:c.min_comfort>=2?['romance']:Number(c.id.split('-')[1])%8===0?['creative','music']:['creative'],semantic_family_ids:[familyFor(c)],
    locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale as 'en']).map(([key,text])=>[key,sha(text)]))]))})) as RuntimeTopicMap['entries']};
const map=FrozenTopicMap.syntheticFixture({map:Buffer.from(JSON.stringify(doc)),taxonomy:Buffer.from(JSON.stringify(taxonomy)),semantic:Buffer.from(JSON.stringify(semantic))},pack,syntheticTopicFixtureCapability());
const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
// A versioned positive unit fixture; statistical and diagnostic seed grids are
// separate and unchanged. A valid schedule need not contain a private round.
function snapshot(seed='TOPIC-GOLDEN-'+TOPIC_ALGORITHM,overrides:Partial<Snapshot>={},size=4,relation:Relation='friendship'):TopicSnapshot {
  const players=Array.from({length:size},(_,i)=>({id:playerId(i),comfort:4,edges:Object.fromEntries(Array.from({length:size},(_,j)=>[playerId(j),{relation,explicit:true}]).filter(([id])=>id!==playerId(i)))}));
  const baseline:Snapshot={schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,
    room_id:room,session_id:session,seed:sha(seed),mode:'questions',context:'in_person',total_rounds:20,players,capabilities:['private_text_chat'],...overrides};
  return immutableTopicSnapshot({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,baseline,pins_digest:digest(map.pins)},pack,map);
}
function safety(s:TopicSnapshot,topics=['creative','music','romance'],revision=1):TopicSafetyState {
  return {room_id:s.baseline.room_id,revision,members:s.baseline.players.map(p=>({member_id:p.id,revision,allow_topic_ids:[...topics],excluded_topic_ids:[]}))};
}
function untilPrivate(s=snapshot(),state=safety(s)):{snapshot:TopicSnapshot;history:TopicPlannerHistory;round:TopicRound} {
  let history=createTopicHistory(s,pack,map);
  for(let i=0;i<s.baseline.total_rounds;i++){
    const result=selectNextTopicRound(s,history,pack,map,state);history=result.history;
    if(result.round.interaction==='pair_private')return {snapshot:s,...result};
  }
  throw new Error('FIXTURE_NO_PRIVATE_OPPORTUNITY');
}
function row(id:string,sequence=1,actors:string[]=[]):TopicHistoryRecord {
  const c=pack.card(id);return {card_id:id,card_revision:c.revision,card_sha256:digest(c),sequence,room_id:room,
    session_id:'33333333-3333-4333-8333-333333333333',round_id:'44444444-4444-4444-8444-'+String(sequence).padStart(12,'0'),
    pack_digest:pack.digest,map_sha256:map.pins.map_sha256,repertoire_digest:map.pins.repertoire_digest,
    mode:c.mode,context:'in_person',interaction:c.interaction,actors,primary_member_id:actors[0]??playerId(0),stage:c.interaction==='pair_private'?3:1,disclosure:'disclosed'};
}
const mutable=<T>(v:T)=>v as unknown as Record<string,unknown>;
const unorderedPair=(actors:readonly string[])=>[...actors].sort().join(':');
describe('complete private opportunity history after empty topic setup',()=>{
 it('keeps the previous actual pair across public rounds and avoids it when an effective unused alternative exists',()=>{
  let checked=0,emptyTransitions=0;
  // Fixed diagnostic grid, not a replacement measurement sample or seed search.
  for(let index=0;index<16;index++){
   const s=snapshot('venus:P05-ANTI-REPEAT-UNIT-1:'+index,{context:'online',total_rounds:40},3);
   let state=safety(s,[]),history=createTopicHistory(s,pack,map),previous:TopicRound|null=null;
   for(let n=0;n<40;n++){
    const before=history,next=selectNextTopicRound(s,before,pack,map,state);history=next.history;const current=next.round;
    if(current.interaction==='pair_private'){
     if(previous){
      let alternative=false;
      for(let a=0;a<s.baseline.players.length;a++)for(let b=a+1;b<s.baseline.players.length;b++){
       const actors=[s.baseline.players[a]!.id,s.baseline.players[b]!.id];if(unorderedPair(actors)===unorderedPair(previous.actors))continue;
       const blockedFamilies=new Set([...before.public_history,...before.private_history.filter(row=>unorderedPair(row.actors)===unorderedPair(actors))].flatMap(row=>map.entry(row.card_id).semantic_family_ids));
       const baseline=pack.cards.filter(card=>card.interaction==='pair_private'&&map.allowed(card)&&eligible(card,s.baseline,actors,current.stage));
       if(baseline.filter(card=>card.relationship_scope==='friend_or_more'&&card.min_comfort===1&&!card.requires_physical_contact&&!card.requires_going_away).length<Math.ceil(.25*s.baseline.total_rounds))continue;
       alternative ||= baseline.some(card=>!map.entry(card.id).semantic_family_ids.some(id=>blockedFamilies.has(id))&&actors.every(actor=>{const own=state.members.find(member=>member.member_id===actor)!;return map.entry(card.id).topic_ids.every(topic=>own.allow_topic_ids.includes(topic)&&!own.excluded_topic_ids.includes(topic));}));
      }
      if(alternative){expect(unorderedPair(current.actors)).not.toBe(unorderedPair(previous.actors));checked++;if(previous.card===null)emptyTransitions++;}
     }else{
      expect(current.card).toBeNull();expect(history.private_history).toEqual([]);
      state=safety(s,['creative','music','romance'],2);
     }
     previous=current;
    }else if(current.card)history=recordTopicOutcome(s,history,pack,map,{expected_history_revision:history.revision,round_id:current.round_id,offer_epoch:null,card:current.card,outcome:'disclosed'}).history;
   }
  }
  expect(checked).toBeGreaterThan(0);expect(emptyTransitions).toBeGreaterThan(0);
 });
 it('allows the only pair to recur for N2 without manufacturing an alternative',()=>{
  const s=snapshot('venus:P05-ANTI-REPEAT-N2-1',{context:'online',total_rounds:40},2);let history=createTopicHistory(s,pack,map),count=0;
  for(let n=0;n<40;n++){const next=selectNextTopicRound(s,history,pack,map,safety(s));history=next.history;if(next.round.interaction==='pair_private'){count++;expect(new Set(next.round.actors)).toEqual(new Set(s.baseline.players.map(p=>p.id)));}else if(next.round.card)history=recordTopicOutcome(s,history,pack,map,{expected_history_revision:history.revision,round_id:next.round.round_id,offer_epoch:null,card:next.round.card,outcome:'disclosed'}).history;}
  expect(count).toBeGreaterThan(1);
 });
});
function targetedRequest(history:TopicPlannerHistory,round:TopicRound,topics:readonly string[]=['music']):TargetedTopicReplacementRequest {
  return {operation_revision:TOPIC_TARGETED_REPLACEMENT_VERSION,expected_history_revision:history.revision,round_id:round.round_id,
    offer_epoch:round.attempts.at(-1)!.offer_epoch+1,candidate_counter:round.attempts.at(-1)!.candidate_counter+1,target_topic_ids:topics};
}
describe('versioned topic planner without content activation or runtime delivery',()=>{
  it('keeps selected public/group/solo/quiet-pair candidates generic until exact public release',()=>{
    const s=snapshot(),first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,safety(s));
    expect(topicPublicProjection(first.round)).toEqual({round_id:first.round.round_id,round_index:1,kind:'generic'});
    expect(first.history.public_history).toEqual([]);
  });
  it('does not put quiet public declines in released history or later scheduling inputs',()=>{
    const s=snapshot(),first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,safety(s));
    const declined=recordTopicOutcome(s,first.history,pack,map,{expected_history_revision:first.history.revision,
      round_id:first.round.round_id,offer_epoch:null,card:first.round.card!,outcome:'declined'});
    expect(declined.history.public_history).toEqual([]);
    expect(topicPublicProjection(declined.round)).toEqual({round_id:first.round.round_id,round_index:1,kind:'generic'});
  });
  it('never publishes hidden primary even after an exact public release',()=>{
    const s=snapshot(),first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,safety(s));
    const released=recordTopicOutcome(s,first.history,pack,map,{expected_history_revision:first.history.revision,
      round_id:first.round.round_id,offer_epoch:null,card:first.round.card!,outcome:'disclosed'});
    const projection=topicPublicProjection(released.round,released.history);
    expect(projection.kind).toBe('public');expect(projection).not.toHaveProperty('primary_member_id');
    expect(released.history.public_history).toHaveLength(1);
  });
  it('rejects author simulation history as restored runtime history',()=>{
    const s=snapshot(),sim=preflightTopics(s,pack,map,safety(s));
    expect(sim.history.provenance).toBe('SIMULATION_ONLY');
    expect(()=>immutableTopicHistory(JSON.parse(JSON.stringify(sim.history)),s,pack,map)).toThrow('SIMULATION');
  });
  it('rejects disposition drift between current private attempt and its exact record',()=>{
    const {snapshot:s,history:h}=untilPrivate(),changed=structuredClone(h);
    mutable(changed.private_history.at(-1)!).disclosure='disclosed';
    expect(()=>immutableTopicHistory(changed,s,pack,map)).toThrow('RECORD');
  });
  it('rejects safety revision rewind on a later round',()=>{
    const s=snapshot(),old=untilPrivate(s,safety(s,['creative','music','romance'],5));
    expect(()=>selectNextTopicRound(s,old.history,pack,map,safety(s,['creative','music','romance'],4))).toThrow('SAFETY');
  });
  it('undisclosed quiet-pair choice, identities and decline do not change the next public selection',()=>{
    const s=snapshot('QUIET-HIDDEN',{mode:'yes_but'}),state=safety(s);
    const first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,state);expect(first.round.interaction).toBe('pair_public');
    const hidden=structuredClone(first.history),other=pack.cards.find(c=>c.mode==='yes_but'&&c.id!==first.round.card!.card_id&&c.interaction==='pair_public'
      &&map.allowed(c)&&eligible(c,s.baseline,first.round.actors,1))!;
    mutable(hidden.rounds[0]!).card={card_id:other.id,card_revision:other.revision,card_sha256:digest(other)};
    mutable(hidden.rounds[0]!).actors=[...first.round.actors].reverse();mutable(hidden.rounds[0]!).primary_member_id=hidden.rounds[0]!.actors[0];
    const validHidden=immutableTopicHistory(hidden,s,pack,map);
    const decline=recordTopicOutcome(s,validHidden,pack,map,{expected_history_revision:validHidden.revision,round_id:first.round.round_id,
      offer_epoch:null,card:hidden.rounds[0]!.card!,outcome:'declined'});
    const a=selectNextTopicRound(s,first.history,pack,map,state),b=selectNextTopicRound(s,decline.history,pack,map,state);
    expect(b.round).toEqual(a.round);expect(first.history.public_history).toEqual([]);expect(decline.history.public_history).toEqual([]);
  });
  it('requires exact current runtime release record and always keeps private disclosures generic',()=>{
    const s=snapshot(),state=safety(s),first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,state);
    const released=recordTopicOutcome(s,first.history,pack,map,{expected_history_revision:first.history.revision,round_id:first.round.round_id,
      offer_epoch:null,card:first.round.card!,outcome:'disclosed'});
    expect(topicPublicProjection(released.round,released.history).kind).toBe('public');
    for(const patch of [{room_id:session},{session_id:room},{pins_digest:'0'.repeat(64)},{public_history:[]},{provenance:'SIMULATION_ONLY' as const}])
      expect(topicPublicProjection(released.round,{...released.history,...patch}).kind).toBe('generic');
    const altered=structuredClone(released.history);mutable(altered.public_history[0]!).card_sha256='0'.repeat(64);
    expect(topicPublicProjection(released.round,altered).kind).toBe('generic');
    const p=untilPrivate(),pReleased=recordTopicOutcome(p.snapshot,p.history,pack,map,{expected_history_revision:p.history.revision,
      round_id:p.round.round_id,offer_epoch:1,card:p.round.card!,outcome:'disclosed'});
    expect(topicPublicProjection(pReleased.round,pReleased.history).kind).toBe('generic');
  });
  it('canonicalizes safety-set ordering without weakening same-revision binding',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s);
    const reordered={...state,members:[...state.members].reverse().map(m=>({...m,allow_topic_ids:[...m.allow_topic_ids].reverse()}))};
    const replay=replaceTopicCandidate(s,h,pack,map,reordered,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:1,candidate_counter:0});
    expect(replay.history).toBe(h);
    const changed={...state,members:state.members.map((m,i)=>i===0?{...m,revision:2}:m)};
    expect(()=>replaceTopicCandidate(s,h,pack,map,changed,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:1,candidate_counter:0})).toThrow('SAFETY');
  });
  it('domain-binds round identities to room and session even if caller reused seed',()=>{
    const a=snapshot('REUSED-SEED'),b=snapshot('REUSED-SEED',{session_id:'55555555-5555-4555-8555-555555555555'}),c=snapshot('REUSED-SEED',{room_id:'66666666-6666-4666-8666-666666666666'});
    const first=(s:TopicSnapshot)=>selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,safety(s)).round;
    expect(first(a).round_id).not.toBe(first(b).round_id);expect(first(a).round_id).not.toBe(first(c).round_id);
  });
  it('keeps a monotonic safety floor even when no private candidate has yet been chosen',()=>{
    const s=snapshot(),initial=createTopicHistory(s,pack,map),first=selectNextTopicRound(s,initial,pack,map,safety(s,['creative','music','romance'],9));
    expect(first.round.interaction).not.toBe('pair_private');expect(first.history.safety_revision).toBe(9);
    expect(()=>selectNextTopicRound(s,first.history,pack,map,safety(s,['creative','music','romance'],8))).toThrow('SAFETY');
    const p=untilPrivate(),altered=structuredClone(p.history);mutable(altered).safety_revision=0;mutable(altered).safety_digest=null;
    expect(()=>immutableTopicHistory(altered,p.snapshot,pack,map)).toThrow('SAFETY_FLOOR');
  });
  it('rejects semantic repeats and forged multiple public cards for one historical round',()=>{
    const s=snapshot();
    expect(()=>createTopicHistory(s,pack,map,{public_history:[row('Q-0003',1),row('TD-0003',2)],private_history:[]})).toThrow('SEMANTIC_REPEAT');
    const one=row('Q-0003',1),two={...row('Q-0004',2,[playerId(0)]),round_id:one.round_id};
    expect(()=>createTopicHistory(s,pack,map,{public_history:[one,two],private_history:[]})).toThrow('DUPLICATE_ROUND');
  });
  it('keeps historical source bytes and legacy replay unchanged',()=>{
    expect(sha(readFileSync('packages/relationship-engine/src/engine.ts','utf8'))).toBe('be84b979418c56e17066b0c1788ec985f869a99ab38c2c77ad3daa84657c3d8a');
    expect(sha(readFileSync('packages/relationship-engine/src/types.ts','utf8'))).toBe('7c0d81f738658a626ae1cb75c3bcf0d8d44d1f563cdec8c36f2db5c0d503a6f5');
    const s=snapshot(),before=digest(s.baseline),legacy=preflight(s.baseline,pack);
    preflightTopics(s,pack,map,safety(s));expect(digest(s.baseline)).toBe(before);
    expect(preflight(immutableSnapshot(JSON.parse(JSON.stringify(s.baseline)),pack),pack)).toEqual(legacy);
  });
  it('strictly dispatches new envelope and never adds schema1 topic capabilities',()=>{
    const s=snapshot();expect(Object.isFrozen(s.baseline.players)).toBe(true);
    for(const patch of [{schema:1},{engine_revision:algorithmRevision},{private_policy_revision:'unknown'},
      {pins_digest:'0'.repeat(64)},{recovery_policy_revision:'ignore'},{extra:true}])expect(()=>immutableTopicSnapshot({...s,...patch} as TopicSnapshot,pack,map)).toThrow();
    expect(()=>immutableSnapshot({...s.baseline,capabilities:['private_topics']},pack)).toThrow('CAPABILITY');
    expect(()=>selectNextTopicRound({...s},createTopicHistory(s,pack,map),pack,map,safety(s))).toThrow('VERSION');
  });
  it('replays exact immutable V2 history and deterministic preflight',()=>{
    const s=snapshot(),before=digest(s),first=preflightTopics(s,pack,map,safety(s)),again=preflightTopics(s,pack,map,safety(s));
    expect(again).toEqual(first);expect(first.history.rounds).toHaveLength(20);expect(digest(s)).toBe(before);
    const runtime=untilPrivate(s).history;
    const restored=immutableTopicHistory(JSON.parse(JSON.stringify(runtime)),s,pack,map);expect(restored).toEqual(runtime);
    expect(()=>mutable(restored.rounds[0]!).stage=4).toThrow();
    expect(first.history.rounds.filter(r=>r.card).map(r=>r.card!.card_id).length).toBe(new Set(first.history.rounds.filter(r=>r.card).map(r=>r.card!.card_id)).size);
  });
  it('empty/default allow is safe-empty only at baseline-eligible generic private opportunities',()=>{
    const s=snapshot(),result=preflightTopics(s,pack,map,safety(s,[]));
    expect(result.private_opportunities).toBeGreaterThan(0);expect(result.private_playable).toBe(0);expect(result.private_safe_empty).toBe(result.private_opportunities);
    for(const r of result.history.rounds.filter(r=>r.interaction==='pair_private'))expect(topicPublicProjection(r)).toEqual({round_id:r.round_id,round_index:r.round_index,kind:'generic'});
    const neutral=snapshot('neutral',{players:s.baseline.players.map(p=>({...p,comfort:0}))});
    expect(preflightTopics(neutral,pack,map,safety(neutral,[])).private_opportunities).toBe(0);
    const noChat=snapshot('nochat',{context:'online',capabilities:[]});expect(preflightTopics(noChat,pack,map,safety(noChat)).private_opportunities).toBe(0);
  });
  it('filters entire multi-tag card using both own allow and both room exclusions',()=>{
    const s=snapshot(),state=safety(s,['creative']);
    const result=preflightTopics(s,pack,map,state);expect(result.private_playable).toBeGreaterThan(0);
    for(const r of result.history.rounds.filter(r=>r.interaction==='pair_private'&&r.card))expect(map.entry(r.card!.card_id).topic_ids).toEqual(['creative']);
    const excluded={...state,members:state.members.map(m=>({...m,excluded_topic_ids:['creative']}))};
    expect(preflightTopics(s,pack,map,excluded).private_playable).toBe(0);
    const missing={...state,members:[]};expect(preflightTopics(s,pack,map,missing).private_playable).toBe(0);
  });
  it('keeps full public projections identical across private settings, histories, IDs, intensity, safety revisions and outcomes',()=>{
    for(const seed of ['INDEPENDENCE-A','INDEPENDENCE-B','INDEPENDENCE-C']){
      const s=snapshot(seed,{},4,'in_relationships'),a=preflightTopics(s,pack,map,safety(s));
      const privatePrior=[row('Q-0111',1,[playerId(0),playerId(1)])];
      const b=preflightTopics(s,pack,map,safety(s,[],91),{public_history:[],private_history:privatePrior});
      expect(a.history.public_history).toEqual(b.history.public_history);
      expect(a.history.rounds.map(r=>topicPublicProjection(r))).toEqual(b.history.rounds.map(r=>topicPublicProjection(r)));
      expect(a.private_playable).toBeGreaterThan(0);expect(b.private_playable).toBe(0);
    }
  });
  it('public RNG and next-round choices ignore extra private candidate replacements and disclosed/declined state',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s);
    expect(r.card).not.toBeNull();const changed=replaceTopicCandidate(s,h,pack,map,state,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1});
    const disclosed=recordTopicOutcome(s,changed.history,pack,map,{expected_history_revision:changed.history.revision,round_id:r.round_id,offer_epoch:2,card:changed.round.card!,outcome:'disclosed'});
    const plainNext=selectNextTopicRound(s,h,pack,map,state),changedNext=selectNextTopicRound(s,disclosed.history,pack,map,state);
    expect(topicPublicProjection(changedNext.round)).toEqual(topicPublicProjection(plainNext.round));
  });
  it('rejects all mixed-family members regardless of private history while preserving historical pack',()=>{
    const before=digest(pack.cards),s=snapshot(),result=preflightTopics(s,pack,map,safety(s));
    expect(map.excluded_card_ids).toEqual(['Q-0001','Q-0107']);
    expect(result.history.rounds.every(r=>!r.card||!map.excluded_card_ids.includes(r.card.card_id))).toBe(true);expect(digest(pack.cards)).toBe(before);
  });
  it('binds public semantic history across mode and session, without card-ID-only dedupe',()=>{
    const prior=[row('Q-0003')],s=snapshot('CROSS-MODE-PUBLIC',{mode:'truth_or_dare',total_rounds:50});
    const result=preflightTopics(s,pack,map,safety(s),{public_history:prior,private_history:[]});
    expect(result.history.rounds.some(r=>r.card?.card_id==='TD-0003')).toBe(false);
    expect(result.history.public_history[0]!.card_id).toBe('Q-0003');
  });
  it('filters same-pair private semantic history across modes/sessions and isolates other pairs',()=>{
    const s=snapshot('PRIVATE-CROSS-MODE',{mode:'truth_or_dare'},2),own=[row('Q-0104',1,[playerId(1),playerId(0)])];
    const a=preflightTopics(s,pack,map,safety(s),{public_history:[],private_history:own});
    expect(a.history.rounds.some(r=>r.card?.card_id==='TD-0104')).toBe(false);
    const foreign=[row('Q-0104',1,[playerId(6),playerId(7)])];
    // Exact row remains stored, but cannot constrain this pair. The bound same-pair
    // candidate is demonstrated with a constrained allow pool by other tests.
    expect(preflightTopics(s,pack,map,safety(s),{public_history:[],private_history:foreign}).history.private_history[0]!.actors).toEqual(foreign[0]!.actors);
    const foreignRoom=[{...own[0]!,room_id:'55555555-5555-4555-8555-555555555555'}];
    expect(()=>createTopicHistory(s,pack,map,{public_history:[],private_history:foreignRoom})).toThrow('HISTORY');
  });
  it('room exclusions remain effective for caller-supplied current preferences after new session/mode/pair',()=>{
    for(const mode of ['questions','truth_or_dare','yes_but'] as const){
      const s=snapshot('ROOM-EXCLUSION-'+mode,{mode,session_id:'55555555-5555-4555-8555-555555555555'});
      const state=safety(s),blockedState={...state,members:state.members.map(m=>({...m,excluded_topic_ids:['creative','music','romance']}))};
      expect(preflightTopics(s,pack,map,blockedState).private_playable).toBe(0);
    }
    // Persistence, anti-rollback and retaining exclusions are explicit caller/ledger
    // responsibilities, not established by recreating an in-memory planner.
  });
  it('replaces with exact actual candidate history, fresh epoch, stable scope and bounded attempts',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s),before=digest(h);
    const next=replaceTopicCandidate(s,h,pack,map,state,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1});
    expect(digest(h)).toBe(before);expect(next.round.card).not.toEqual(r.card);expect(next.round.attempts).toHaveLength(2);
    for(const key of ['round_id','round_index','stage','mode','interaction','actors','primary_member_id'] as const)expect(next.round[key]).toEqual(r[key]);
    expect(next.history.private_history.at(-2)!.disclosure).toBe('replaced');expect(next.history.private_history.at(-1)!.card_id).toBe(next.round.card!.card_id);
    const replay=replaceTopicCandidate(s,next.history,pack,map,state,{expected_history_revision:next.history.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1});expect(replay.history).toBe(next.history);
    const third=replaceTopicCandidate(s,next.history,pack,map,state,{expected_history_revision:next.history.revision,round_id:r.round_id,offer_epoch:3,candidate_counter:2});
    expect(()=>replaceTopicCandidate(s,third.history,pack,map,state,{expected_history_revision:third.history.revision,round_id:r.round_id,offer_epoch:4,candidate_counter:3})).toThrow('LIMIT');
  });
  it('records fresh safe-empty after narrowed preferences, never substitutes a public card',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate();
    const next=replaceTopicCandidate(s,h,pack,map,safety(s,[],2),{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1});
    expect(next.round.card).toBeNull();expect(next.round.interaction).toBe('pair_private');expect(next.round.attempts.at(-1)!.state).toBe('empty');
    expect(next.round.actors).toEqual(r.actors);expect(next.round.stage).toBe(r.stage);
  });
  it('denies stale safety/history/epoch/counter, same-revision changed sets and terminal decline',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s),valid={expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:2,candidate_counter:1};
    for(const patch of [{expected_history_revision:0},{round_id:session},{offer_epoch:0},{candidate_counter:2}])expect(()=>replaceTopicCandidate(s,h,pack,map,state,{...valid,...patch})).toThrow();
    expect(()=>replaceTopicCandidate(s,h,pack,map,safety(s,[],1),{...valid,offer_epoch:1,candidate_counter:0})).toThrow('SAFETY');
    const declined=recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:1,card:r.card!,outcome:'declined'});
    expect(()=>replaceTopicCandidate(s,declined.history,pack,map,state,{...valid,expected_history_revision:declined.history.revision})).toThrow('LIMIT');
    expect(()=>recordTopicOutcome(s,declined.history,pack,map,{expected_history_revision:declined.history.revision,round_id:r.round_id,offer_epoch:1,card:r.card!,outcome:'disclosed'})).toThrow('STALE');
  });
  it('does not disclose by selection or manufacture action consent from topic planning',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate();expect(r.requires_action_consent).toBe(true);
    expect(h.private_history.at(-1)!.disclosure).toBe('selected');expect(r.attempts[0]!.state).toBe('offered');
    const disclosed=recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:1,card:r.card!,outcome:'disclosed'});
    expect(disclosed.round.attempts[0]!.state).toBe('disclosed');expect(disclosed.history.private_history.at(-1)!.disclosure).toBe('disclosed');
    expect(JSON.stringify(topicPublicProjection(disclosed.round))).not.toContain(r.card!.card_id);
  });
  it.each([
    ['foreign room',(h:TopicPlannerHistory)=>mutable(h).room_id=session],
    ['foreign session',(h:TopicPlannerHistory)=>mutable(h).session_id=room],
    ['unknown pins',(h:TopicPlannerHistory)=>mutable(h).pins_digest='0'.repeat(64)],
    ['rewound sequence',(h:TopicPlannerHistory)=>mutable(h.public_history[0]!).sequence=99],
    ['impossible stage',(h:TopicPlannerHistory)=>mutable(h.rounds[0]!).stage=4],
    ['wrong card hash',(h:TopicPlannerHistory)=>mutable(h.rounds[0]!.card!).card_sha256='0'.repeat(64)],
    ['fake actual record',(h:TopicPlannerHistory)=>mutable(h).public_history=[]],
    ['extra field',(h:TopicPlannerHistory)=>mutable(h).legacyFallback=true],
  ])('rejects %s on history restore',(_,change)=>{
    const s=snapshot(),first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,safety(s));
    const released=recordTopicOutcome(s,first.history,pack,map,{expected_history_revision:first.history.revision,
      round_id:first.round.round_id,offer_epoch:null,card:first.round.card!,outcome:'disclosed'});
    const altered=structuredClone(released.history);change(altered);expect(()=>immutableTopicHistory(altered,s,pack,map)).toThrow();
  });
  it('rejects unknown safety topics, malformed owner scope and missing revision',()=>{
    const s=snapshot(),h=createTopicHistory(s,pack,map),state=safety(s);
    for(const change of [(v:TopicSafetyState)=>mutable(v).revision=0,(v:TopicSafetyState)=>mutable(v).room_id=session,
      (v:TopicSafetyState)=>mutable(v.members[0]!).allow_topic_ids=['unknown'],(v:TopicSafetyState)=>mutable(v).members=[v.members[0],v.members[0]]]){
      const altered=structuredClone(state);change(altered);expect(()=>selectNextTopicRound(s,h,pack,map,altered)).toThrow('SAFETY');
    }
  });
  it('runs base guard/cap/progression profiles for2..8, all modes and both contexts',()=>{
    for(let size=2;size<=8;size++)for(const mode of ['questions','truth_or_dare','yes_but'] as const)for(const context of ['online','in_person'] as const){
      const s=snapshot(`BASE-${size}-${mode}-${context}`,{mode,context,total_rounds:8},size),result=preflightTopics(s,pack,map,safety(s));
      expect(result.private_opportunities).toBeLessThanOrEqual(2);
      for(const r of result.history.rounds){expect(r.stage).toBe(progressionStage(r.round_index,8));if(r.card)expect(eligible(pack.card(r.card.card_id),s.baseline,r.actors,r.stage)).toBe(true);}
    }
  });
  it('preserves veto and comfort/context guards and reports true shortage',()=>{
    const veto=snapshot('VETO',{mode:'yes_but'},2,'not_a_friend');expect(()=>preflightTopics(veto,pack,map,safety(veto))).toThrow('SAFE_POOL');
    for(const rounds of [1,2,3,4,20,100]){
      const s=snapshot('BOUNDARY-'+rounds,{total_rounds:rounds},2);const result=preflightTopics(s,pack,map,safety(s));
      expect(result.private_opportunities).toBeLessThanOrEqual(Math.ceil(.25*rounds));expect(result.history.rounds).toHaveLength(rounds);
    }
    const s=snapshot('SHORTAGE',{mode:'questions',total_rounds:100}),allPublic=pack.cards.filter(c=>c.mode==='questions'&&c.interaction!=='pair_private'&&map.allowed(c));
    const prior=allPublic.map((c,i)=>row(c.id,i+1,c.interaction==='solo'?[playerId(0)]:c.interaction==='pair_public'?[playerId(0),playerId(1)]:[]));
    expect(()=>preflightTopics(s,pack,map,safety(s),{public_history:prior,private_history:[]})).toThrow('SAFE_POOL');
  });
  it('keeps anti-consecutive private pair where baseline alternatives exist',()=>{
    const s=snapshot('PRIVATE-ALTERNATIVES',{total_rounds:100},4),result=preflightTopics(s,pack,map,safety(s));
    const pairs=result.history.rounds.filter(r=>r.interaction==='pair_private'&&r.card).map(r=>[...r.actors].sort().join(':'));
    expect(pairs.length).toBeGreaterThan(2);for(let i=1;i<pairs.length;i++)expect(pairs[i]).not.toBe(pairs[i-1]);
  });
});
describe('additive targeted private replacement RE-1.P05-TARGET-1',()=>{
  it('chooses the sole genuinely admissible target from the complete pool, never arbitrary-rotate/false-empty',()=>{
    const s=snapshot('TARGET-SOLE',{},2),pair=s.baseline.players.map(p=>p.id);
    const music=pack.cards.filter(c=>c.mode==='questions'&&c.interaction==='pair_private'&&map.allowed(c)
      &&eligible(c,s.baseline,pair,4)&&map.entry(c.id).topic_ids.includes('music'));
    expect(music.length).toBeGreaterThan(5);const only=music[0]!;
    const prior=music.slice(1).map((c,i)=>row(c.id,i+1,pair));
    let history=createTopicHistory(s,pack,map,{public_history:[],private_history:prior});let round:TopicRound|null=null;
    for(let i=0;i<s.baseline.total_rounds;i++){
      const next=selectNextTopicRound(s,history,pack,map,safety(s,['creative']));history=next.history;
      if(next.round.interaction==='pair_private'){round=next.round;break;}
    }
    expect(round).not.toBeNull();expect(map.entry(round!.card!.card_id).topic_ids).not.toContain('music');
    const actual=safety(s,['creative','music','romance'],2),before=digest(actual);
    const selected=replaceTopicCandidateForTopics(s,history,pack,map,actual,targetedRequest(history,round!));
    expect(selected.round.card?.card_id).toBe(only.id);expect(selected.round.attempts.at(-1)!.state).toBe('offered');expect(digest(actual)).toBe(before);
  });
  it('requires all target subjects and preserves the full secondary-tag union',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s);
    const result=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['music']));
    expect(result.round.card).not.toBeNull();expect(map.entry(result.round.card!.card_id).topic_ids).toEqual(['creative','music']);
    const both=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['music','creative']));
    expect(map.entry(both.round.card!.card_id).topic_ids).toEqual(['creative','music']);
    const andNotOr=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['creative','romance']));expect(andNotOr.round.card).toBeNull();
  });
  it('checks each actual actor and denies secondary tags without peer-specific errors',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s,['creative','music','romance'],2);
    const peerExcluded={...state,members:state.members.map(m=>m.member_id===r.actors[1]?{...m,excluded_topic_ids:['music']}:m)};
    const unavailable=replaceTopicCandidateForTopics(s,h,pack,map,peerExcluded,targetedRequest(h,r));expect(unavailable.round.card).toBeNull();
    const secondaryDenied=safety(s,['music'],2);
    expect(replaceTopicCandidateForTopics(s,h,pack,map,secondaryDenied,targetedRequest(h,r)).round.card).toBeNull();
    const unrelated=s.baseline.players.find(p=>!r.actors.includes(p.id))!;
    const spectatorExcluded={...state,members:state.members.map(m=>m.member_id===unrelated.id?{...m,excluded_topic_ids:['music']}:m)};
    expect(replaceTopicCandidateForTopics(s,h,pack,map,spectatorExcluded,targetedRequest(h,r)).round.card).not.toBeNull();
  });
  it('records truthful safe-empty only after all actual target candidates are exhausted by pair history',()=>{
    const s=snapshot('TARGET-EXHAUSTED',{},2),pair=s.baseline.players.map(p=>p.id),state=safety(s);
    const targets=pack.cards.filter(c=>c.mode==='questions'&&c.interaction==='pair_private'&&map.allowed(c)
      &&eligible(c,s.baseline,pair,4)&&map.entry(c.id).topic_ids.includes('music'));
    let history=createTopicHistory(s,pack,map,{public_history:[],private_history:targets.map((c,i)=>row(c.id,i+1,pair))});let round:TopicRound|null=null;
    for(let i=0;i<20;i++){const next=selectNextTopicRound(s,history,pack,map,state);history=next.history;if(next.round.interaction==='pair_private'){round=next.round;break;}}
    expect(round).not.toBeNull();const result=replaceTopicCandidateForTopics(s,history,pack,map,state,targetedRequest(history,round!));
    expect(result.round.card).toBeNull();expect(result.round.interaction).toBe('pair_private');expect(result.round.actors).toEqual(round!.actors);
    expect(result.round.attempts.at(-1)!.state).toBe('empty');expect(result.history.private_history).toHaveLength(history.private_history.length);
  });
  it('uses a deterministic own version domain and canonical target ordering without mutating the prior state',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s),before=digest(h);
    const a=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['creative','music']));
    const b=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['music','creative']));
    expect(a).toEqual(b);expect(digest(h)).toBe(before);
    for(const key of ['room_id','session_id','pins_digest','round_id','round_index','stage','mode','interaction','actors','primary_member_id'] as const)expect(a.round[key]).toEqual(r[key]);
    expect(a.history.private_history.at(-2)!.disclosure).toBe('replaced');expect(a.history.private_history.at(-1)!.card_id).toBe(a.round.card!.card_id);
  });
  it('strictly requires a new epoch while the old untargeted exact replay remains unchanged',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s),request=targetedRequest(h,r),next=replaceTopicCandidateForTopics(s,h,pack,map,state,request);
    expect(()=>replaceTopicCandidateForTopics(s,next.history,pack,map,state,{...request,expected_history_revision:next.history.revision})).toThrow('STALE');
    expect(()=>replaceTopicCandidateForTopics(s,next.history,pack,map,state,{...request,expected_history_revision:next.history.revision,target_topic_ids:['creative']})).toThrow('STALE');
    const oldReplay=replaceTopicCandidate(s,next.history,pack,map,state,{expected_history_revision:next.history.revision,round_id:r.round_id,
      offer_epoch:request.offer_epoch,candidate_counter:request.candidate_counter});expect(oldReplay.history).toBe(next.history);
  });
  it.each([{target_topic_ids:[]},{target_topic_ids:['unknown']},{target_topic_ids:['music','music']},{target_topic_ids:['music','creative','romance','unknown']}])('rejects malformed target list $target_topic_ids',({target_topic_ids})=>{
    const {snapshot:s,history:h,round:r}=untilPrivate();expect(()=>replaceTopicCandidateForTopics(s,h,pack,map,safety(s),targetedRequest(h,r,target_topic_ids))).toThrow('TARGET_INVALID');
  });
  it('rejects unknown revision, stale history/counter/safety, wrong round, public scope and terminal decline',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s),request=targetedRequest(h,r);
    for(const patch of [{operation_revision:'unknown'},{expected_history_revision:0},{offer_epoch:r.attempts.at(-1)!.offer_epoch},
      {candidate_counter:request.candidate_counter+1},{round_id:session}])expect(()=>replaceTopicCandidateForTopics(s,h,pack,map,state,{...request,...patch} as TargetedTopicReplacementRequest)).toThrow();
    const newer=untilPrivate(s,safety(s,['creative','music','romance'],4));
    expect(()=>replaceTopicCandidateForTopics(s,newer.history,pack,map,safety(s),targetedRequest(newer.history,newer.round))).toThrow('SAFETY');
    const first=selectNextTopicRound(s,createTopicHistory(s,pack,map),pack,map,state);
    expect(()=>replaceTopicCandidateForTopics(s,first.history,pack,map,state,{...request,expected_history_revision:first.history.revision,round_id:first.round.round_id})).toThrow('PRIVATE_ROUND');
    const declined=recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,offer_epoch:r.attempts.at(-1)!.offer_epoch,card:r.card!,outcome:'declined'});
    expect(()=>replaceTopicCandidateForTopics(s,declined.history,pack,map,state,targetedRequest(declined.history,declined.round))).toThrow('LIMIT');
  });
  it('keeps future public selection and public history independent of targets and targeted empty outcomes',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s);
    const music=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['music']));
    const empty=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['romance']));
    expect(music.round.card).not.toBeNull();expect(empty.round.card).toBeNull();expect(music.history.public_history).toEqual(empty.history.public_history);
    let left=music.history,right=empty.history;
    for(let index=r.round_index;index<s.baseline.total_rounds;index++){
      const a=selectNextTopicRound(s,left,pack,map,state),b=selectNextTopicRound(s,right,pack,map,state);
      expect(topicPublicProjection(a.round)).toEqual(topicPublicProjection(b.round));left=a.history;right=b.history;
      if(a.round.interaction!=='pair_private'){
        expect(a.round).toEqual(b.round);
        left=recordTopicOutcome(s,left,pack,map,{expected_history_revision:left.revision,round_id:a.round.round_id,offer_epoch:null,card:a.round.card!,outcome:'disclosed'}).history;
        right=recordTopicOutcome(s,right,pack,map,{expected_history_revision:right.revision,round_id:b.round.round_id,offer_epoch:null,card:b.round.card!,outcome:'disclosed'}).history;
      }
    }
    expect(left.public_history).toEqual(right.public_history);
    expect(topicPublicProjection(music.round,music.history)).toEqual(topicPublicProjection(empty.round,empty.history));
  });
  it('bounds targeted attempts, including empty outcomes, without reviving an exhausted private moment',()=>{
    const {snapshot:s,history:h,round:r}=untilPrivate(),state=safety(s);
    const second=replaceTopicCandidateForTopics(s,h,pack,map,state,targetedRequest(h,r,['romance']));expect(second.round.card).toBeNull();
    const third=replaceTopicCandidateForTopics(s,second.history,pack,map,state,targetedRequest(second.history,second.round,['music']));expect(third.round.card).not.toBeNull();
    expect(()=>replaceTopicCandidateForTopics(s,third.history,pack,map,state,targetedRequest(third.history,third.round))).toThrow('LIMIT');
  });
  it('supports real target-pool selection for all modes and both contexts without relaxing baseline guards',()=>{
    for(const mode of ['questions','truth_or_dare','yes_but'] as const)for(const context of ['online','in_person'] as const){
      let found:ReturnType<typeof untilPrivate>|null=null;
      for(let i=0;i<10&&!found;i++){const s=snapshot(`TARGET-${mode}-${context}-${i}`,{mode,context},2);try{found=untilPrivate(s);}catch(error){if(!(error instanceof Error)||error.message!=='FIXTURE_NO_PRIVATE_OPPORTUNITY')throw error;}}
      expect(found).not.toBeNull();const {snapshot:s,history:h,round:r}=found!;
      const next=replaceTopicCandidateForTopics(s,h,pack,map,safety(s),targetedRequest(h,r));expect(next.round.card).not.toBeNull();
      const c=pack.card(next.round.card!.card_id);expect(eligible(c,s.baseline,r.actors,r.stage)).toBe(true);expect(map.entry(c.id).topic_ids).toContain('music');
    }
  });
});

describe('ROOM-TOPIC-2 unified transport eligibility',()=>{
 for(const context of ['online','in_person'] as const)for(const mode of ['questions','truth_or_dare','yes_but'] as const)it(context+' '+mode+' plans public safe rounds without a private capability',()=>{
  const s=snapshot('CAPLESS-POLICY-2',{context,mode,capabilities:[]}),state=safety(s),before=JSON.stringify(s);
  const result=preflightTopics(s,pack,map,state);
  expect(result.planned_rounds).toBe(20);expect(result.private_opportunities).toBe(0);
  expect(result.history.rounds.every(r=>r.interaction!=='pair_private')).toBe(true);expect(JSON.stringify(s)).toBe(before);
 });
 it('keeps the declared positive in-person private fixture when its capability is present',()=>{
  const result=untilPrivate();expect(result.snapshot.private_policy_revision).toBe('ROOM-TOPIC-2');expect(result.snapshot.baseline.context).toBe('in_person');
  expect(result.snapshot.baseline.capabilities).toContain('private_text_chat');expect(result.round.interaction).toBe('pair_private');
 });
 it('rejects the former snapshot policy without silently upgrading its capability or history',()=>{
  const old={...snapshot(),private_policy_revision:'ROOM-TOPIC-1'} as unknown as TopicSnapshot,before=JSON.stringify(old);
  expect(()=>immutableTopicSnapshot(old,pack,map)).toThrow(expect.objectContaining({code:'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED'}));expect(JSON.stringify(old)).toBe(before);
 });
});
