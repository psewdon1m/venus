import {createHash, createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {syntheticCards, syntheticManifest, playerId} from './source/tests/p03/fixtures.mjs';
import {canonical, digest, FrozenPack} from './source/packages/relationship-engine/src/pack.js';
import {algorithmRevision, eligible} from './source/packages/relationship-engine/src/engine.js';
import {policyDigest} from './source/packages/relationship-engine/src/policy-identity.js';
import {FrozenTopicMap, syntheticTopicFixtureCapability, TOPIC_MAP_VERSION,
  type RuntimeTopicMap, type RuntimeTopicTaxonomy, type RuntimeSemanticPolicy} from './source/packages/relationship-engine/src/topic-map.js';
import {createTopicHistory, immutableTopicSnapshot, replaceTopicCandidateForTopics, replaceTopicCandidate,
  recordTopicOutcome, selectNextTopicRound, topicPublicProjection, TOPIC_ALGORITHM, TOPIC_PRIVATE_POLICY,
  TOPIC_RECOVERY_POLICY, TOPIC_TARGETED_REPLACEMENT_VERSION, type TopicSnapshot, type TopicSafetyState,
  type TopicPlannerHistory, type TopicRound, type TopicHistoryRecord, type TargetedTopicReplacementRequest} from './source/packages/relationship-engine/src/topic-planner.js';
import type {Card, Mode, Context, Snapshot} from './source/packages/relationship-engine/src/types.js';

// An independent classification: unlike the author fixture, four usable topics
// plus a valid-but-absent topic and cross-mode private semantic families.
const cards = syntheticCards() as Card[];
const pack = FrozenPack.load(cards, syntheticManifest(cards, digest, policyDigest), true);
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const status = {classification_status:'SYNTHETIC_MACHINE_FIXTURE' as const, approved:false,
  runtime_eligible:false, owner_review_status:'SYNTHETIC_ONLY' as const};
const topics = ['anchor','calm','focus','melody','absent'];
const taxonomy: RuntimeTopicTaxonomy = {schema:TOPIC_MAP_VERSION, taxonomy_revision:'REVIEW-TARGET-TAX', ...status,
  topics:topics.map(topic_id => ({topic_id, labels:{ru:topic_id,en:topic_id,tr:topic_id}}))};
const number = (card: Card) => Number(card.id.split('-')[1]);
const family = (card: Card) => ['Q-0001','Q-0104'].includes(card.id) ? 'MIXED-EXCLUDED'
  : card.interaction === 'pair_private' ? `PRIVATE-CROSS-MODE-${number(card)}` : `PUBLIC-${card.id}`;
const families = new Map<string, Card[]>();
for (const card of pack.cards) families.set(family(card), [...(families.get(family(card)) ?? []), card]);
const semantic: RuntimeSemanticPolicy = {schema:TOPIC_MAP_VERSION, semantic_revision:'REVIEW-TARGET-SEM', ...status,
  families:[...families].map(([semantic_family_id,members]) => ({semantic_family_id,
    classification:members.length === 1 ? 'IDENTITY_ONLY' : 'EXPLICIT_FAMILY',
    mixed_visibility:semantic_family_id === 'MIXED-EXCLUDED', repertoire:semantic_family_id === 'MIXED-EXCLUDED' ? 'exclude' : 'eligible',
    members:members.map(c => ({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),interaction:c.interaction}))}))};
const doc: RuntimeTopicMap = {schema:TOPIC_MAP_VERSION, map_revision:'REVIEW-TARGET-MAP', ...status, pack_digest:pack.digest,
  taxonomy_digest:digest(taxonomy), semantic_policy_digest:digest(semantic),
  entries:pack.cards.map(c => ({card_id:c.id,card_revision:c.revision,card_sha256:digest(c),mode:c.mode,interaction:c.interaction,
    topic_ids:['anchor', number(c) % 8 === 0 ? 'melody' : 'calm', ...(number(c) % 16 === 0 ? ['focus'] : [])].sort(),
    semantic_family_ids:[family(c)],locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale => [locale,
      Object.fromEntries(Object.entries(c.text[locale as 'en']).map(([key,value]) => [key,sha(value!)]))]))})) as RuntimeTopicMap['entries']};
const map = FrozenTopicMap.syntheticFixture({map:Buffer.from(JSON.stringify(doc)),taxonomy:Buffer.from(JSON.stringify(taxonomy)),
  semantic:Buffer.from(JSON.stringify(semantic))},pack,syntheticTopicFixtureCapability());
const room = 'abcddcba-1111-4111-8111-111111111111';
const session = 'abcddcba-2222-4222-8222-222222222222';
function snapshot(seed: string, mode: Mode = 'questions', context: Context = 'in_person', size = 2, overrides: Partial<Snapshot> = {}): TopicSnapshot {
  const players = Array.from({length:size},(_,i) => ({id:playerId(i),comfort:4,
    edges:Object.fromEntries(Array.from({length:size},(_,j) => [playerId(j),{relation:'friendship',explicit:true}]).filter(([id]) => id !== playerId(i)))}));
  const baseline = {schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,
    room_id:room,session_id:session,seed:sha(seed),mode,context,total_rounds:20,players,capabilities:['private_text_chat'],...overrides} as Snapshot;
  return immutableTopicSnapshot({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,
    recovery_policy_revision:TOPIC_RECOVERY_POLICY,baseline,pins_digest:digest(map.pins)},pack,map);
}
function safety(s: TopicSnapshot, revision = 1): TopicSafetyState {
  return {room_id:room,revision,members:s.baseline.players.map(p => ({member_id:p.id,revision,allow_topic_ids:[...topics],excluded_topic_ids:[]}))};
}
function firstPrivate(s: TopicSnapshot, state = safety(s), prior: {public_history: TopicHistoryRecord[];private_history: TopicHistoryRecord[]} = {public_history:[],private_history:[]}) {
  let history = createTopicHistory(s,pack,map,prior);
  for (let n=0;n<s.baseline.total_rounds;n++) {
    const result = selectNextTopicRound(s,history,pack,map,state); history = result.history;
    if (result.round.interaction === 'pair_private') return result;
  }
  throw new Error('REVIEW_FIXTURE_NO_PRIVATE');
}
function found(seed: string, mode: Mode = 'questions', context: Context = 'in_person', size = 2) {
  for (let n=0;n<20;n++) {
    const s = snapshot(seed+n,mode,context,size);
    try { return {s,...firstPrivate(s)}; } catch (error) { if ((error as Error).message !== 'REVIEW_FIXTURE_NO_PRIVATE') throw error; }
  }
  throw new Error('REVIEW_FIXTURE_SEEDS_EXHAUSTED');
}
function request(h: TopicPlannerHistory, r: TopicRound, target_topic_ids: readonly string[] = ['melody']): TargetedTopicReplacementRequest {
  return {operation_revision:TOPIC_TARGETED_REPLACEMENT_VERSION,expected_history_revision:h.revision,round_id:r.round_id,
    offer_epoch:r.attempts.at(-1)!.offer_epoch+1,candidate_counter:r.attempts.at(-1)!.candidate_counter+1,target_topic_ids};
}
function blocked(c: Card, rows: readonly TopicHistoryRecord[]) {
  return rows.some(row => row.card_id === c.id || map.entry(row.card_id).semantic_family_ids.some(f => map.entry(c.id).semantic_family_ids.includes(f)));
}
function fullPool(s: TopicSnapshot, h: TopicPlannerHistory, r: TopicRound, state: TopicSafetyState, targets: readonly string[]) {
  return pack.cards.filter(c => c.mode === s.baseline.mode && c.interaction === 'pair_private' && map.allowed(c)
    && eligible(c,s.baseline,r.actors,r.stage) && targets.every(t => map.entry(c.id).topic_ids.includes(t))
    && !blocked(c,h.public_history) && !blocked(c,h.private_history.filter(row => [...row.actors].sort().join() === [...r.actors].sort().join()))
    && r.actors.every(actor => {
      const member = state.members.find(m => m.member_id === actor);
      return member && map.entry(c.id).topic_ids.every(t => member.allow_topic_ids.includes(t) && !member.excluded_topic_ids.includes(t));
    }));
}
function priorRow(c: Card, actors: readonly string[], sequence: number): TopicHistoryRecord {
  return {card_id:c.id,card_revision:c.revision,card_sha256:digest(c),sequence,room_id:room,
    session_id:'abcddcba-3333-4333-8333-333333333333',round_id:`abcddcba-4444-4444-8444-${String(sequence).padStart(12,'0')}`,
    pack_digest:pack.digest,map_sha256:map.pins.map_sha256,repertoire_digest:map.pins.repertoire_digest,mode:c.mode,
    context:'in_person',interaction:c.interaction,actors:[...actors],primary_member_id:actors[0]!,stage:3,disclosure:'disclosed'};
}
function changeMember(state: TopicSafetyState, id: string, patch: Partial<TopicSafetyState['members'][number]>): TopicSafetyState {
  return {...state,members:state.members.map(m => m.member_id === id ? {...m,...patch} : m)};
}

describe('independent targeted replacement exact-source review', () => {
  it('removes only the additive block to recover exact old accepted source bytes', () => {
    const bytes = readFileSync(new URL('./source/packages/relationship-engine/src/topic-planner.ts',import.meta.url));
    const start = bytes.indexOf(Buffer.from('export const TOPIC_TARGETED_REPLACEMENT_VERSION'));
    const end = bytes.indexOf(Buffer.from('/** Caller may record disclosure only after'),start);
    expect(start).toBeGreaterThan(0); expect(end).toBeGreaterThan(start);
    expect(sha(Buffer.concat([bytes.subarray(0,start),bytes.subarray(end)]))).toBe('83f4b5e4bd96d3ad7d2bb00b533693fdee240a628123d983b6491bd2fc77775a');
  });
  for (const mode of ['questions','truth_or_dare','yes_but'] as const) for (const context of ['online','in_person'] as const) {
    it(`uses every baseline eligibility constraint and ALL targets in ${mode}/${context}`, () => {
      const {s,history:h,round:r} = found('INDEPENDENT-BASE-',mode,context,4), state = safety(s);
      const expected = fullPool(s,h,r,state,['melody','focus']); expect(expected.length).toBeGreaterThan(0);
      const result = replaceTopicCandidateForTopics(s,h,pack,map,state,request(h,r,['focus','melody']));
      expect(expected.map(c => c.id)).toContain(result.round.card!.card_id);
      expect(map.entry(result.round.card!.card_id).topic_ids).toEqual(['anchor','focus','melody']);
      expect(eligible(pack.card(result.round.card!.card_id),s.baseline,r.actors,r.stage)).toBe(true);
      expect(result.round.actors).toEqual(r.actors); expect(result.round.stage).toBe(r.stage);
      expect(result.round.round_id).toBe(r.round_id); expect(result.round.requires_action_consent).toBe(true);
      expect(topicPublicProjection(result.round,result.history)).toEqual(topicPublicProjection(r,h));
    });
    it(`keeps the complete released future public trace invariant in ${mode}/${context}`, () => {
      const {s,history:h,round:r} = found('INDEPENDENT-PUBLIC-',mode,context), state = safety(s);
      const selected = replaceTopicCandidateForTopics(s,h,pack,map,state,request(h,r,['melody']));
      const empty = replaceTopicCandidateForTopics(s,h,pack,map,state,request(h,r,['absent']));
      expect(selected.round.card).not.toBeNull(); expect(empty.round.card).toBeNull();
      let left = selected.history, right = empty.history; let publicCount = 0;
      while (left.rounds.length < s.baseline.total_rounds) {
        const a = selectNextTopicRound(s,left,pack,map,state), b = selectNextTopicRound(s,right,pack,map,state);
        expect(topicPublicProjection(a.round,a.history)).toEqual(topicPublicProjection(b.round,b.history));
        left = a.history; right = b.history;
        if (a.round.interaction !== 'pair_private') {
          publicCount++; expect(a.round).toEqual(b.round);
          left = recordTopicOutcome(s,left,pack,map,{expected_history_revision:left.revision,round_id:a.round.round_id,
            offer_epoch:null,card:a.round.card!,outcome:'disclosed'}).history;
          right = recordTopicOutcome(s,right,pack,map,{expected_history_revision:right.revision,round_id:b.round.round_id,
            offer_epoch:null,card:b.round.card!,outcome:'disclosed'}).history;
          expect(topicPublicProjection(left.rounds.at(-1)!,left)).toEqual(topicPublicProjection(right.rounds.at(-1)!,right));
        }
      }
      expect(publicCount).toBeGreaterThan(0); expect(left.public_history).toEqual(right.public_history);
    });
  }
  for (const actorIndex of [0,1]) for (const secondary of ['anchor','focus']) {
    it(`denies excluded extra topic ${secondary} by actor ${actorIndex} without fallback`, () => {
      const {s,history:h,round:r} = found('INDEPENDENT-EXCLUSION-'), state = safety(s,2);
      const narrowed = changeMember(state,r.actors[actorIndex]!,{excluded_topic_ids:[secondary]});
      expect(fullPool(s,h,r,narrowed,['focus','melody'])).toHaveLength(0);
      const result = replaceTopicCandidateForTopics(s,h,pack,map,narrowed,request(h,r,['focus','melody']));
      expect(result.round.card).toBeNull(); expect(result.round.attempts.at(-1)!.state).toBe('empty');
      expect(result.history.public_history).toEqual(h.public_history); expect(result.history.private_history).toHaveLength(h.private_history.length);
    });
  }
  it('distinguishes malformed from known-but-unavailable without peer-specific failure', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-GENERIC-'), state = safety(s,2);
    const unavailable = changeMember(state,r.actors[1]!,{allow_topic_ids:['calm']});
    const peer = replaceTopicCandidateForTopics(s,h,pack,map,unavailable,request(h,r));
    const none = replaceTopicCandidateForTopics(s,h,pack,map,state,request(h,r,['absent']));
    expect(peer.round.card).toBeNull(); expect(none.round.card).toBeNull();
    expect(topicPublicProjection(peer.round,peer.history)).toEqual(topicPublicProjection(none.round,none.history));
    expect(Object.keys(peer.round.attempts.at(-1)!)).not.toContain('reason');
    const missing = {...state,members:state.members.filter(m => m.member_id !== r.actors[0])};
    expect(replaceTopicCandidateForTopics(s,h,pack,map,missing,request(h,r)).round.card).toBeNull();
  });
  it('ignores spectator preferences while using both actual actors', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-SPECTATOR-','questions','in_person',8), state = safety(s,2);
    const spectator = s.baseline.players.find(p => !r.actors.includes(p.id))!;
    const changed = changeMember(state,spectator.id,{allow_topic_ids:[],excluded_topic_ids:[...topics]});
    expect(fullPool(s,h,r,changed,['melody']).map(c => c.id)).toEqual(fullPool(s,h,r,state,['melody']).map(c => c.id));
    expect(replaceTopicCandidateForTopics(s,h,pack,map,changed,request(h,r)).round.card).not.toBeNull();
  });
  it('finds the sole surviving target despite cross-mode semantic history in a prior session', () => {
    const s = snapshot('INDEPENDENT-SOLE'), actors = s.baseline.players.map(p => p.id), state = safety(s);
    const potential = pack.cards.filter(c => c.mode === 'questions' && c.interaction === 'pair_private' && map.allowed(c)
      && eligible(c,s.baseline,actors,4) && map.entry(c.id).topic_ids.includes('melody'));
    expect(potential.length).toBeGreaterThan(4); const only = potential.at(-1)!;
    const prior = potential.slice(0,-1).map((c,i) => priorRow(pack.card(c.id.replace('Q-','TD-')),actors,i+1));
    const restricted = changeMember(changeMember(state,actors[0]!,{allow_topic_ids:['anchor','calm']}),actors[1]!,{allow_topic_ids:['anchor','calm']});
    const {history:h,round:r} = firstPrivate(s,restricted,{public_history:[],private_history:prior});
    const actual = safety(s,2), before = canonical({h,actual});
    expect(fullPool(s,h,r,actual,['melody']).map(c => c.id)).toEqual([only.id]);
    const result = replaceTopicCandidateForTopics(s,h,pack,map,actual,request(h,r));
    expect(result.round.card!.card_id).toBe(only.id); expect(canonical({h,actual})).toBe(before);
    expect(Object.isFrozen(result.history)).toBe(true); expect(Object.isFrozen(result.round.attempts)).toBe(true);
  });
  it('recognizes actual target exhaustion through prior sessions and modes', () => {
    const s = snapshot('INDEPENDENT-EXHAUSTED'), actors = s.baseline.players.map(p => p.id), state = safety(s);
    const potential = pack.cards.filter(c => c.mode === 'questions' && c.interaction === 'pair_private' && map.allowed(c)
      && eligible(c,s.baseline,actors,4) && map.entry(c.id).topic_ids.includes('melody'));
    const prior = potential.map((c,i) => priorRow(pack.card(c.id.replace('Q-','YB-')),actors,i+1));
    const {history:h,round:r} = firstPrivate(s,state,{public_history:[],private_history:prior});
    expect(fullPool(s,h,r,state,['melody'])).toHaveLength(0);
    expect(replaceTopicCandidateForTopics(s,h,pack,map,state,request(h,r)).round.card).toBeNull();
  });
  it('does not consume another pair private semantic history', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-OTHER-PAIR-','questions','in_person',4), state = safety(s,2);
    const otherActors = s.baseline.players.filter(p => !r.actors.includes(p.id)).map(p => p.id);
    const eligibleTarget = fullPool(s,h,r,state,['melody']);
    const prior = eligibleTarget.map((c,i) => priorRow(pack.card(c.id.replace('Q-','TD-')),otherActors,i+1));
    const withPrior = createTopicHistory(snapshot('INDEPENDENT-OTHER-PAIR-NEW'),pack,map,{public_history:[],private_history:prior});
    expect(withPrior.private_history).toHaveLength(prior.length);
    // Independent pool oracle makes the scope explicit; a separate matching
    // round state below must leave these exact other-pair rows eligible.
    const changed = {...h,private_history:[...prior,...h.private_history.map((row,i) => ({...row,sequence:prior.length+i+1}))]};
    const result = replaceTopicCandidateForTopics(s,changed,pack,map,state,request(changed,r));
    expect(result.round.card).not.toBeNull(); expect(eligibleTarget.map(c => c.id)).toContain(result.round.card!.card_id);
  });
  it('canonicalizes target ordering and matches an independent HMAC private-domain oracle', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-RNG-'), state = safety(s), req = request(h,r,['melody','focus']);
    const expectedPool = fullPool(s,h,r,state,req.target_topic_ids);
    const safetyDigest = digest({...state,members:state.members.map(m => ({...m,allow_topic_ids:[...m.allow_topic_ids].sort(),
      excluded_topic_ids:[...m.excluded_topic_ids].sort()})).sort((a,b) => a.member_id.localeCompare(b.member_id))});
    const domain = {domain:'private-targeted-candidate',operation_revision:TOPIC_TARGETED_REPLACEMENT_VERSION,
      target_topic_ids:[...req.target_topic_ids].sort(),room_id:room,session_id:session,round_id:r.round_id,actors:r.actors,
      offer_epoch:req.offer_epoch,candidate_counter:req.candidate_counter,safety_revision:state.revision,safety_digest:safetyDigest,pins:map.pins};
    // Friendship candidates have min_comfort=1: no recovery branch consumes a draw.
    expect(pack.card(h.private_history.at(-1)!.card_id).min_comfort).toBe(1);
    const random = createHmac('sha256',Buffer.from(s.baseline.seed,'hex')).update(TOPIC_ALGORITHM+':'+canonical(domain)+':0').digest().readUIntBE(0,6)/281474976710656;
    const result = replaceTopicCandidateForTopics(s,h,pack,map,state,req);
    expect(result.round.card!.card_id).toBe(expectedPool[Math.floor(random*expectedPool.length)]!.id);
    expect(replaceTopicCandidateForTopics(s,h,pack,map,state,{...req,target_topic_ids:['focus','melody']})).toEqual(result);
  });
  for (const [label,patch] of [
    ['extra fields',{unexpected:true}],['version',{operation_revision:'RE-1.P05-TARGET-2'}],['round',{round_id:session}],
    ['old revision',{expected_history_revision:0}],['future revision',{expected_history_revision:100000}],
    ['negative epoch',{offer_epoch:-1}],['noninteger epoch',{offer_epoch:1.5}],['unsafe epoch',{offer_epoch:Number.MAX_SAFE_INTEGER+1}],
    ['negative counter',{candidate_counter:-1}],['skipped counter',{candidate_counter:100}],['empty targets',{target_topic_ids:[]}],
    ['unknown targets',{target_topic_ids:['unknown']}],['duplicate targets',{target_topic_ids:['melody','melody']}],
    ['nonarray targets',{target_topic_ids:'melody'}],['nonstring targets',{target_topic_ids:[1]}],
  ] as const) it(`denies ${label}`, () => {
    const {s,history:h,round:r} = found('INDEPENDENT-INVALID-');
    expect(() => replaceTopicCandidateForTopics(s,h,pack,map,safety(s),{...request(h,r),...patch} as TargetedTopicReplacementRequest)).toThrow();
  });
  it('denies stale safety, same-revision safety substitution and untrusted snapshot clones', () => {
    const s = snapshot('INDEPENDENT-SAFETY'), state = safety(s,8), {history:h,round:r} = firstPrivate(s,state);
    expect(() => replaceTopicCandidateForTopics(s,h,pack,map,safety(s,7),request(h,r))).toThrow('SAFETY');
    expect(() => replaceTopicCandidateForTopics(s,h,pack,map,changeMember(state,r.actors[0]!,{excluded_topic_ids:['melody']}),request(h,r))).toThrow('SAFETY');
    expect(() => replaceTopicCandidateForTopics(structuredClone(s),h,pack,map,state,request(h,r))).toThrow('SNAPSHOT');
  });
  it('strictly denies same-epoch replay or changed targets while preserving old read-only replay', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-EPOCH-'), state = safety(s), req = request(h,r);
    const result = replaceTopicCandidateForTopics(s,h,pack,map,state,req);
    for (const target_topic_ids of [['melody'],['calm']]) expect(() => replaceTopicCandidateForTopics(s,result.history,pack,map,state,
      {...req,expected_history_revision:result.history.revision,target_topic_ids})).toThrow('STALE');
    expect(replaceTopicCandidate(s,result.history,pack,map,state,{expected_history_revision:result.history.revision,round_id:r.round_id,
      offer_epoch:req.offer_epoch,candidate_counter:req.candidate_counter}).history).toBe(result.history);
  });
  it('allows a larger new epoch but only the next counter, then enforces three total attempts', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-BOUND-'), state = safety(s);
    const second = replaceTopicCandidateForTopics(s,h,pack,map,state,{...request(h,r,['absent']),offer_epoch:50});
    expect(second.round.card).toBeNull(); expect(second.round.attempts.at(-1)!.offer_epoch).toBe(50);
    const third = replaceTopicCandidateForTopics(s,second.history,pack,map,state,request(second.history,second.round));
    expect(third.round.attempts).toHaveLength(3); expect(third.round.card).not.toBeNull();
    expect(() => replaceTopicCandidateForTopics(s,third.history,pack,map,state,request(third.history,third.round))).toThrow('LIMIT');
  });
  it('never reopens a terminal actor decline', () => {
    const {s,history:h,round:r} = found('INDEPENDENT-DECLINE-'), state = safety(s);
    const declined = recordTopicOutcome(s,h,pack,map,{expected_history_revision:h.revision,round_id:r.round_id,
      offer_epoch:r.attempts.at(-1)!.offer_epoch,card:r.card!,outcome:'declined'});
    expect(() => replaceTopicCandidateForTopics(s,declined.history,pack,map,state,request(declined.history,declined.round))).toThrow('LIMIT');
  });
});
