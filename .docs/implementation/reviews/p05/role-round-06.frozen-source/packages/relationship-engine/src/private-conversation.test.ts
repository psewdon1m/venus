import {describe, expect, it} from 'vitest';
import {
  applyPrivateConversation, createPrivateConversation, projectOwnTopicPreferences, projectPrivateConversation,
  type ConversationCandidate, type ConversationContext, type ConversationScope, type PrivateConversation,
  type PrivateConversationCommand,
} from './private-conversation.js';

// Synthetic topics/prompts/pins only; no candidate map or human approval claimed.
const SCOPE: ConversationScope = {room_id: 'room-A', session_id: 'game-A', round_id: 'round-A', actors: ['alice', 'bob']};
const topics = ['music', 'food', 'fiction'].map(topic_id => ({topic_id, labels: {ru: `Тема ${topic_id}`, en: `Topic ${topic_id}`, tr: `Konu ${topic_id}`}}));
const candidates: ConversationCandidate[] = [
  {candidate_ref: 'secret-ref-A', card_id: 'SECRET-CARD-A', card_revision: 3, card_sha256: 'a'.repeat(64), topic_ids: ['music'],
    prompt: {ru: 'Секретный вопрос А', en: 'Secret prompt alpha', tr: 'Gizli soru alfa'}},
  {candidate_ref: 'secret-ref-B', card_id: 'SECRET-CARD-B', card_revision: 8, card_sha256: 'b'.repeat(64), topic_ids: ['food'],
    prompt: {ru: 'Секретный вопрос Б', en: 'Secret prompt beta', tr: 'Gizli soru beta'}},
  {candidate_ref: 'secret-ref-C', card_id: 'SECRET-CARD-C', card_revision: 1, card_sha256: 'c'.repeat(64), topic_ids: ['fiction'],
    prompt: {ru: 'Секретный вопрос В', en: 'Secret prompt gamma', tr: 'Gizli soru gama'}},
  {candidate_ref: 'secret-ref-D', card_id: 'SECRET-CARD-D', card_revision: 1, card_sha256: 'd'.repeat(64), topic_ids: ['music', 'food'],
    prompt: {ru: 'Секретный вопрос Г', en: 'Secret prompt delta', tr: 'Gizli soru delta'}},
];
const base = () => ({scope: SCOPE, pins: {pack_digest: '1'.repeat(64), map_digest: '2'.repeat(64), taxonomy_digest: '3'.repeat(64)},
  topics, candidates, now: 1000, parent_expires_at: 181000});
const fresh = () => createPrivateConversation(base());
const ctx = (actor = 'alice', now = 1000, scope = SCOPE): ConversationContext => ({actor, now, scope});
function run(state: PrivateConversation, command: PrivateConversationCommand, actor = 'alice', now = state.clock_floor): PrivateConversation {
  const result = applyPrivateConversation(state, command, ctx(actor, now));
  expect(result.error).toBeNull();
  return result.state;
}
function permitted(): PrivateConversation {
  let state = fresh();
  for (const actor of SCOPE.actors) state = run(state, {kind: 'set_topics', expected_preference_revision: 1, allow: ['music', 'food', 'fiction'], exclude: []}, actor);
  return state;
}
function propose(state: PrivateConversation, index = 0, now = state.clock_floor): PrivateConversation {
  const candidate = candidates[index]!;
  return run(state, {kind: 'offer_topic', expected_revision: state.revision, expected_epoch: state.epoch,
    offer_id: `offer-${index}`, token: String(index + 4).repeat(64), candidate: {candidate_ref: candidate.candidate_ref, card_sha256: candidate.card_sha256}}, 'alice', now);
}
function respond(state: PrivateConversation, actor: string, decision: 'accept' | 'decline' = 'accept', now = state.clock_floor): PrivateConversation {
  const offer = state.offer!;
  return run(state, {kind: 'respond_topic', offer_id: offer.offer_id, epoch: offer.epoch,
    proposal_revision: offer.proposal_revision, token: offer.token, decision}, actor, now);
}
function active(): PrivateConversation { return respond(respond(propose(permitted()), 'alice'), 'bob'); }
function project(state: PrivateConversation, actor = 'bob', now = state.clock_floor) {
  const projected = projectPrivateConversation(state, ctx(actor, now));
  expect(projected.error).toBeNull();
  return projected;
}
function expectHidden(state: PrivateConversation, actor = 'bob') {
  const view = project(state, actor).view!;
  const bytes = JSON.stringify(view);
  for (const secret of candidates.flatMap(candidate => [candidate.card_id, candidate.card_sha256, candidate.candidate_ref, ...Object.values(candidate.prompt)])) {
    expect(bytes).not.toContain(secret);
  }
  for (const field of ['binding_hash', 'card_id', 'card_revision', 'card_sha256', 'candidate_ref', 'preview', 'length', 'prompt']) {
    expect(bytes).not.toContain(`"${field}"`);
  }
  return view;
}
const topicReply = (state: PrivateConversation): Extract<PrivateConversationCommand, {kind: 'respond_topic'}> => ({kind: 'respond_topic', offer_id: state.offer!.offer_id,
  epoch: state.offer!.epoch, proposal_revision: state.offer!.proposal_revision, token: state.offer!.token, decision: 'accept'});
const otherQuestion = (state: PrivateConversation, exclude_current_topics = false): Extract<PrivateConversationCommand, {kind: 'other_question'}> => ({
  kind: 'other_question', exclude_current_topics, offer_id: state.offer!.offer_id,
  epoch: state.offer!.epoch, proposal_revision: state.offer!.proposal_revision, token: state.offer!.token,
});
function advice(state: PrivateConversation, actor = 'alice', id = 'advice-1', text = 'Private advice sentinel Ω🙂'): PrivateConversation {
  return run(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: id, text}, actor);
}
const acceptAdvice = (state: PrivateConversation, id = 'advice-1', revision = 1): Extract<PrivateConversationCommand, {kind: 'respond_advice'}> => ({kind: 'respond_advice', advice_id: id, revision,
  epoch: state.epoch, decision: 'accept'});

describe('private conversation boundaries and exact topic invitation', () => {
  it('starts with empty explicit topic choices and never offers a prompt automatically', () => {
    const state = fresh();
    expect(state.preferences.alice!.allow).toEqual([]);
    expect(state.preferences.bob!.allow).toEqual([]);
    expect(expectHidden(state).state).toBe('empty');
    const candidate = candidates[0]!;
    const denied = applyPrivateConversation(state, {kind: 'offer_topic', expected_revision: state.revision, expected_epoch: state.epoch,
      offer_id: 'offer-new', token: 'e'.repeat(64), candidate}, ctx());
    expect(denied.error).toBe('NOT_AVAILABLE');
    expect(denied.state.topic_attempts).toBe(0);
  });

  it('does not infer the other actor consent from one allowed profile or one acknowledgement', () => {
    const initial = fresh();
    const one = run(initial, {kind: 'set_topics', expected_preference_revision: 1, allow: ['music'], exclude: []});
    expect(applyPrivateConversation(one, {kind: 'offer_topic', expected_revision: one.revision, expected_epoch: one.epoch,
      offer_id: 'offer-new', token: 'e'.repeat(64), candidate: candidates[0]!}, ctx()).error).toBe('NOT_AVAILABLE');
    const pending = propose(permitted());
    expect(expectHidden(pending).state).toBe('pending');
    expect(expectHidden(respond(pending, 'alice')).state).toBe('pending');
    expect(project(respond(respond(pending, 'alice'), 'bob')).view!.prompt).toEqual(candidates[0]);
  });

  it('exposes only allowed topic labels and opaque action metadata before both accepts', () => {
    const state = propose(permitted());
    const view = expectHidden(state);
    expect(Object.keys(view.offer!).sort()).toEqual(['epoch', 'expires_at', 'offer_id', 'own_accepted', 'proposal_revision', 'token', 'topics']);
    expect(view.offer!.topics).toEqual([topics[0]]);
    expect(JSON.stringify(view)).not.toContain(state.offer!.binding_hash);
    expect(view.offer!.token).toBe('4'.repeat(64));
  });

  it.each(['offer_id', 'epoch', 'proposal_revision', 'token'] as const)('rejects a response with stale %s', field => {
    const state = propose(permitted());
    const request = {...topicReply(state), [field]: field === 'epoch' || field === 'proposal_revision' ? 999 : 'invalid'};
    expect(applyPrivateConversation(state, request, ctx()).error).toBe('STALE');
    expectHidden(state);
  });

  it('makes decline terminal, clears all delivery and does not expose its topic or actor as a reason', () => {
    const pending = propose(permitted());
    const oldReply = topicReply(pending);
    const declined = respond(pending, 'bob', 'decline');
    expect(applyPrivateConversation(declined, oldReply, ctx()).error).toBe('STALE');
    expect(expectHidden(declined)).toEqual({schema: declined.schema, revision: declined.revision, epoch: declined.epoch, state: 'empty', advice: []});
    const repeated = {...oldReply, kind: 'offer_topic' as const, expected_revision: declined.revision, expected_epoch: declined.epoch,
      offer_id: 'repeat', token: 'f'.repeat(64), candidate: candidates[3]!};
    expect(applyPrivateConversation(declined, repeated, ctx('alice', 6000)).error).toBe('NOT_AVAILABLE');
    expect(propose(declined, 1, 6000).offer!.acks).toEqual([]);
  });

  it('permits withdrawal after own first acknowledgement and rejects duplicate accept', () => {
    const oneAck = respond(propose(permitted()), 'alice');
    expect(applyPrivateConversation(oneAck, topicReply(oneAck), ctx()).error).toBe('REPLAY');
    expect(expectHidden(respond(oneAck, 'alice', 'decline')).state).toBe('empty');
  });

  it('other question immediately removes prompt, advice and acks and requires a real new candidate', () => {
    const old = advice(active());
    const oldReply = topicReply(old);
    const next = run(old, otherQuestion(old));
    expectHidden(next);
    expect(next.advice.every(offer => offer.text === null)).toBe(true);
    expect(applyPrivateConversation(next, oldReply, ctx()).error).toBe('STALE');
    expect(applyPrivateConversation(next, {kind: 'offer_topic', expected_revision: next.revision, expected_epoch: next.epoch,
      offer_id: 'duplicate-card', token: 'f'.repeat(64), candidate: candidates[0]!}, ctx('alice', 6000)).error).toBe('NOT_AVAILABLE');
    const newOffer = propose(next, 1, 6000);
    expect(newOffer.offer!.acks).toEqual([]);
    expect(newOffer.offer!.proposal_revision).toBe(2);
    expectHidden(newOffer);
    expect(project(respond(respond(newOffer, 'bob'), 'alice')).view!.prompt).toEqual(candidates[1]);
  });

  it.each([false, true])('a delayed old-question intent cannot affect a new pending or active offer (exclude=%s)', exclude => {
    const original = advice(active());
    const delayed = otherQuestion(original, exclude);
    const pending = propose(run(original, otherQuestion(original)), 1, 6000);
    const oneAck = respond(pending, 'alice');
    const next = advice(respond(oneAck, 'bob'), 'bob', 'new-topic-advice');
    for (const state of [pending, oneAck, next]) {
      const bytes = JSON.stringify(state);
      const stale = applyPrivateConversation(state, delayed, ctx('alice', 6000));
      expect(stale.error).toBe('STALE');
      expect(JSON.stringify(stale.state)).toBe(bytes);
      expect(stale.state.preferences.alice!.excluded).toEqual([]);
      expect(stale.state.preferences.bob!.excluded).toEqual([]);
    }
    expect(project(next, 'bob').view!.prompt!.topic_ids).toEqual(['food']);
    expect(project(next, 'bob').view!.advice[0]!.text).toContain('sentinel');
  });

  it.each(['offer_id', 'epoch', 'proposal_revision', 'token'] as const)('rejects other-question intent with mismatched %s before changing current pending/active state', field => {
    for (const state of [propose(permitted()), advice(active())]) {
      const command = {...otherQuestion(state, true), [field]: field === 'epoch' || field === 'proposal_revision' ? 999 : 'stale'};
      const before = JSON.stringify(state);
      const stale = applyPrivateConversation(state, command, ctx());
      expect(stale.error).toBe('STALE');
      expect(JSON.stringify(stale.state)).toBe(before);
    }
  });

  it('does not interpret a missing intent as current-topic exclusion or replacement; unconditional stop remains available', () => {
    const state = advice(active());
    for (const exclude_current_topics of [true, false]) {
      const missing = {kind: 'other_question', exclude_current_topics} as unknown as PrivateConversationCommand;
      const stale = applyPrivateConversation(state, missing, ctx());
      expect(stale.error).toBe('STALE');
      expect(JSON.stringify(stale.state)).toBe(JSON.stringify(state));
    }
    const stopped = run(state, {kind: 'stop'});
    expectHidden(stopped);
    expect(stopped.state).toBe('stopped');
    expect(stopped.advice[0]!.text).toBeNull();
    expect(stopped.preferences.alice!.excluded).toEqual([]);
  });

  it('a correct pending-question exclusion only removes the explicitly intended current topics', () => {
    const state = respond(propose(permitted()), 'alice');
    const next = run(state, otherQuestion(state, true), 'bob');
    expect(next.preferences.bob!.excluded).toEqual(['music']);
    expect(next.preferences.bob!.allow).toEqual(['fiction', 'food']);
    expect(next.preferences.alice!.excluded).toEqual([]);
    expect(next.offer).toBeNull();
    expectHidden(next);
  });

  it('an expired old offer cannot exclude its topics or a later replacement', () => {
    const original = propose(permitted());
    const delayed = otherQuestion(original, true);
    const expired = project(original, 'bob', 31000).state;
    const rejected = applyPrivateConversation(expired, delayed, ctx('bob', 31000));
    expect(rejected.error).toBe('STALE');
    expect(rejected.state.preferences.bob!.excluded).toEqual([]);
    expect(JSON.stringify(rejected.state)).toBe(JSON.stringify(expired));
    const replacement = propose(expired, 1, 31000);
    const stale = applyPrivateConversation(replacement, delayed, ctx('bob', 31000));
    expect(stale.error).toBe('STALE');
    expect(JSON.stringify(stale.state)).toBe(JSON.stringify(replacement));
    expect(stale.state.offer!.acks).toEqual([]);
  });

  it('excludes every tag of current prompt monotonically and never reveals other preferences', () => {
    const paired = respond(respond(propose(permitted(), 3), 'alice'), 'bob');
    const next = run(paired, otherQuestion(paired, true), 'bob');
    expect(next.preferences.bob!.excluded).toEqual(['food', 'music']);
    expect(next.preferences.bob!.allow).toEqual(['fiction']);
    expect(next.preferences.alice!.excluded).toEqual([]);
    const own = projectOwnTopicPreferences(next, ctx('alice'));
    expect(own.preference!.excluded).toEqual([]);
    expect(JSON.stringify(expectHidden(next, 'alice'))).not.toContain('excluded');
    expect(applyPrivateConversation(next, {kind: 'set_topics', expected_preference_revision: 3,
      allow: ['food', 'fiction'], exclude: []}, ctx('bob')).error).toBe('NOT_AVAILABLE');
  });

  it('a preference change invalidates an active epoch even if another actor supplied the last shared revision', () => {
    const before = active();
    const next = run(before, {kind: 'set_topics', expected_preference_revision: 2, allow: [], exclude: ['music']}, 'bob');
    expectHidden(next);
    expect(next.epoch).toBeGreaterThan(before.epoch);
    expect(next.preferences.bob!.excluded).toEqual(['music']);
    expect(applyPrivateConversation(next, {kind: 'set_topics', expected_preference_revision: 2, allow: ['food'], exclude: []}, ctx('bob')).error).toBe('STALE');
  });

  it('new candidate creates new epoch and no implicit grant even after prior bilateral acceptance', () => {
    const state = active();
    const old = topicReply(state);
    const next = propose(state, 1, 6000);
    expect(next.epoch).toBeGreaterThan(state.epoch);
    expect(next.offer!.binding_hash).not.toBe(state.offer!.binding_hash);
    expectHidden(next);
    expect(applyPrivateConversation(next, old, ctx()).error).toBe('CLOCK_REWIND');
    expect(applyPrivateConversation(next, old, ctx('alice', 6000)).error).toBe('STALE');
  });

  it('enforces one pending offer, rate limit and three total attempts across epochs', () => {
    let state = propose(permitted());
    const second = {kind: 'offer_topic' as const, expected_revision: state.revision, expected_epoch: state.epoch,
      offer_id: 'offer-another', token: 'f'.repeat(64), candidate: candidates[1]!};
    expect(applyPrivateConversation(state, second, ctx()).error).toBe('NOT_AVAILABLE');
    state = run(state, otherQuestion(state));
    expect(applyPrivateConversation(state, {...second, expected_revision: state.revision, expected_epoch: state.epoch}, ctx('alice', 5999)).error).toBe('RATE_LIMIT');
    state = propose(state, 1, 6000);
    state = run(state, otherQuestion(state));
    state = propose(state, 2, 11000);
    state = run(state, otherQuestion(state));
    expect(applyPrivateConversation(state, {...second, expected_revision: state.revision, expected_epoch: state.epoch}, ctx('alice', 16000)).error).toBe('LIMIT');
    expect(state.topic_attempts).toBe(3);
  });

  it('never reuses opaque IDs/tokens and never accepts unknown candidate hashes', () => {
    const pending = propose(permitted());
    const state = run(pending, otherQuestion(pending));
    const command = {kind: 'offer_topic' as const, expected_revision: state.revision, expected_epoch: state.epoch,
      offer_id: 'new', token: 'f'.repeat(64), candidate: candidates[1]!};
    expect(applyPrivateConversation(state, {...command, offer_id: 'offer-0'}, ctx('alice', 6000)).error).toBe('REPLAY');
    expect(applyPrivateConversation(state, {...command, token: '4'.repeat(64)}, ctx('alice', 6000)).error).toBe('REPLAY');
    expect(applyPrivateConversation(state, {...command, candidate: {...candidates[1]!, card_sha256: '0'.repeat(64)}}, ctx('alice', 6000)).error).toBe('NOT_AVAILABLE');
    expect(applyPrivateConversation(state, {...command, candidate: {...candidates[1]!, candidate_ref: 'unknown'}}, ctx('alice', 6000)).error).toBe('NOT_AVAILABLE');
  });
});

describe('structured advice opt-in', () => {
  it('withholds text, preview, hash and length from pending recipient but lets sender see own composition', () => {
    const state = advice(active());
    const recipient = project(state).view!;
    expect(Object.keys(recipient.advice[0]!).sort()).toEqual(['advice_id', 'direction', 'epoch', 'expires_at', 'revision', 'state']);
    const serialized = JSON.stringify(recipient.advice);
    for (const secret of ['Private advice sentinel', 'text', 'preview', 'hash', 'length']) expect(serialized).not.toContain(secret);
    expect(project(state, 'alice').view!.advice[0]!.text).toBe('Private advice sentinel Ω🙂');
  });

  it('only exact recipient acceptance exposes the current advice and replay cannot duplicate acceptance', () => {
    const pending = advice(active());
    expect(applyPrivateConversation(pending, acceptAdvice(pending), ctx()).error).toBe('ROLE_DENIED');
    expect(applyPrivateConversation(pending, {...acceptAdvice(pending), revision: 2}, ctx('bob')).error).toBe('STALE');
    const accepted = run(pending, acceptAdvice(pending), 'bob');
    expect(project(accepted).view!.advice[0]!.text).toBe('Private advice sentinel Ω🙂');
    expect(applyPrivateConversation(accepted, acceptAdvice(accepted), ctx('bob')).error).toBe('REPLAY');
  });

  it.each(['decline', 'revoke'] as const)('%s removes advice from all later projections', action => {
    let state = advice(active());
    state = action === 'decline'
      ? run(state, {...acceptAdvice(state), kind: 'respond_advice', decision: 'decline'}, 'bob')
      : run(run(state, acceptAdvice(state), 'bob'), {kind: 'revoke_advice', advice_id: 'advice-1', revision: 1, epoch: state.epoch});
    expect(project(state).view!.advice).toEqual([]);
    expect(project(state, 'alice').view!.advice).toEqual([]);
    expect(state.advice[0]!.text).toBeNull();
    expect(applyPrivateConversation(state, acceptAdvice(state), ctx('bob')).error).toBe('REPLAY');
  });

  it('editing accepted text revokes old ID/revision and requires fresh recipient opt-in', () => {
    let state = advice(active());
    state = run(state, acceptAdvice(state), 'bob');
    state = run(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'advice-2', text: 'New body must remain private', replaces_id: 'advice-1'});
    expect(state.advice[0]!.text).toBeNull();
    expect(state.advice[1]!.revision).toBe(2);
    expect(project(state).view!.advice).toHaveLength(1);
    expect(JSON.stringify(project(state).view!.advice)).not.toContain('New body');
    expect(applyPrivateConversation(state, acceptAdvice(state), ctx('bob')).error).toBe('REPLAY');
    expect(applyPrivateConversation(state, acceptAdvice(state, 'advice-2', 1), ctx('bob')).error).toBe('STALE');
    const accepted = run(state, acceptAdvice(state, 'advice-2', 2), 'bob');
    expect(project(accepted).view!.advice[0]!.text).toBe('New body must remain private');
  });

  it('bounds each direction independently to one pending and two total attempts across topic epochs', () => {
    let state = advice(active());
    expect(applyPrivateConversation(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'third', text: 'Next body'}, ctx()).error).toBe('NOT_AVAILABLE');
    state = advice(state, 'bob', 'bob-1');
    state = run(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'advice-2', text: 'Edited body', replaces_id: 'advice-1'});
    expect(applyPrivateConversation(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'third', text: 'Third body', replaces_id: 'advice-2'}, ctx()).error).toBe('LIMIT');
    state = propose(state, 1, 6000);
    state = respond(respond(state, 'alice'), 'bob');
    expect(applyPrivateConversation(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'fourth', text: 'Fourth body'}, ctx('alice', 6000)).error).toBe('LIMIT');
    expect(advice(state, 'bob', 'bob-2').advice_attempts.bob).toBe(2);
  });

  it('requires an active bilateral topic epoch and rejects stale recipient response after replacement', () => {
    const pendingTopic = propose(permitted());
    expect(applyPrivateConversation(pendingTopic, {kind: 'offer_advice', epoch: pendingTopic.epoch, topic_offer_id: pendingTopic.offer!.offer_id, advice_id: 'a', text: 'Advice'}, ctx()).error).toBe('NOT_AVAILABLE');
    const before = advice(active());
    const next = propose(before, 1, 6000);
    expect(applyPrivateConversation(next, acceptAdvice(before), ctx('bob', 6000)).error).toBe('STALE');
    expect(project(next).view!.advice).toEqual([]);
  });

  it('does not relabel a delayed old-epoch advice send as part of a new accepted topic', () => {
    const old = active();
    const delayed: PrivateConversationCommand = {kind: 'offer_advice', epoch: old.epoch, topic_offer_id: old.offer!.offer_id,
      advice_id: 'delayed', text: 'Old topic advice must not cross epochs'};
    const replacement = propose(run(old, otherQuestion(old)), 1, 6000);
    const next = respond(respond(replacement, 'alice'), 'bob');
    const rejected = applyPrivateConversation(next, delayed, ctx('alice', 6000));
    expect(rejected.error).toBe('STALE');
    expect(rejected.state.advice).toEqual([]);
    expect(JSON.stringify(project(rejected.state, 'bob', 6000).view)).not.toContain('Old topic advice');
    expect(applyPrivateConversation(next, {...delayed, epoch: next.epoch}, ctx('alice', 6000)).error).toBe('STALE');
  });

  it('rejects a delayed edit of an already superseded advice ID without reopening the old text', () => {
    let state = advice(active());
    const edit: PrivateConversationCommand = {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer!.offer_id,
      advice_id: 'edited', text: 'First edit', replaces_id: 'advice-1'};
    state = run(state, edit);
    const stale = applyPrivateConversation(state, {...edit, advice_id: 'delayed-edit'}, ctx());
    expect(stale.error).toBe('LIMIT');
    expect(state.advice.filter(offer => offer.text !== null).map(offer => offer.text)).toEqual(['First edit']);
    expect(project(state).view!.advice[0]).not.toHaveProperty('text');
  });

  it.each(['', ' '.repeat(10), 'x'.repeat(1001), '🙂'.repeat(1001), '\ud800', '\udfff', 'x\u0000y', 'x\ny', 'x\ty', 'x\u007fy', 'x\u202ey', 'x\u2069y', 'x\u061cy', 'x\u2028y'])('rejects invalid advice %j', text => {
    const state = active();
    expect(applyPrivateConversation(state, {kind: 'offer_advice', epoch: state.epoch, topic_offer_id: state.offer?.offer_id ?? 'missing', advice_id: 'invalid', text}, ctx()).error).toBe('INVALID_INPUT');
    expect(state.advice).toEqual([]);
  });

  it('accepts exactly 1000 Unicode scalars and keeps the recipient boundary', () => {
    const state = advice(active(), 'alice', 'boundary', '🙂'.repeat(1000));
    expect(state.advice[0]!.text).toHaveLength(2000);
    expect(project(state).view!.advice[0]).not.toHaveProperty('text');
  });
});

describe('expiry, authorization, immutable inputs and malformed pins', () => {
  it('pending invitation expires at exactly 30s with no implicit accept and cannot revive', () => {
    const pending = propose(permitted());
    expect(project(pending, 'bob', 30999).view!.state).toBe('pending');
    const expired = project(pending, 'bob', 31000);
    expectHidden(expired.state);
    expect(expired.view!.state).toBe('empty');
    expect(applyPrivateConversation(expired.state, topicReply(pending), ctx('alice', 31000)).error).toBe('STALE');
    const rewound = projectPrivateConversation(expired.state, ctx('bob', 30999));
    expect(rewound.error).toBe('CLOCK_REWIND');
    expect(rewound.view).toBeNull();
    expect(project(rewound.state, 'bob', 31001).view!.state).toBe('closed');
  });

  it('new offers and late active acceptance cannot extend the parent private moment', () => {
    let state = propose(permitted());
    state = respond(respond(state, 'alice', 'accept', 30999), 'bob', 'accept', 30999);
    expect(state.offer!.expires_at).toBe(181000);
    expect(project(state, 'bob', 180999).view!.state).toBe('active');
    const expired = project(state, 'bob', 181000);
    expect(expired.view!.state).toBe('closed');
    expectHidden(expired.state);
    expect(applyPrivateConversation(expired.state, otherQuestion(state), ctx('bob', 181001)).error).toBe('CLOSED');
  });

  it('pending advice expires at exactly 30s; accepted advice lasts only until the active parent deadline', () => {
    const pending = advice(active());
    expect(project(pending, 'bob', 30999).view!.advice).toHaveLength(1);
    const expired = project(pending, 'bob', 31000);
    expect(expired.view!.advice).toEqual([]);
    expect(expired.state.advice[0]!.text).toBeNull();
    expect(applyPrivateConversation(expired.state, acceptAdvice(pending), ctx('bob', 31000)).error).toBe('REPLAY');
    let accepted = run(pending, acceptAdvice(pending), 'bob', 30999);
    expect(accepted.advice[0]!.expires_at).toBe(181000);
    expect(project(accepted, 'bob', 180999).view!.advice[0]!.text).toContain('sentinel');
    accepted = project(accepted, 'bob', 181000).state;
    expect(project(accepted, 'bob', 181001).view!.advice).toEqual([]);
  });

  it.each([NaN, Infinity, -1, 1000.5, Number.MAX_SAFE_INTEGER + 1])('fails closed on invalid time %s and never revives', now => {
    const invalid = projectPrivateConversation(advice(active()), ctx('bob', now));
    expect(invalid.error).toBe('INVALID_CLOCK');
    expect(invalid.view).toBeNull();
    expect(project(invalid.state).view!.state).toBe('closed');
  });

  it('a failed business action still returns the advanced clock fence', () => {
    const state = propose(permitted());
    const stale = applyPrivateConversation(state, {...topicReply(state), token: 'bad'}, ctx('alice', 2000));
    expect(stale.error).toBe('STALE');
    expect(stale.state.clock_floor).toBe(2000);
    const rewind = projectPrivateConversation(stale.state, ctx('bob', 1999));
    expect(rewind.error).toBe('CLOCK_REWIND');
    expect(project(rewind.state, 'bob', 2001).view!.state).toBe('closed');
  });

  it('an observed future expiry closes delivery and cannot be undone by returning the clock to the past', () => {
    const future = project(advice(active()), 'bob', 1_000_000);
    expect(future.view!.state).toBe('closed');
    expect(future.view!.advice).toEqual([]);
    const past = projectPrivateConversation(future.state, ctx('bob', 1001));
    expect(past.error).toBe('CLOCK_REWIND');
    expect(past.view).toBeNull();
  });

  it('the internal binding rejects altered exact candidate bytes or map pin before delivery', () => {
    const state = active();
    const changedPrompt = {...state, candidates: state.candidates.map((candidate, i) => i === 0
      ? {...candidate, prompt: {...candidate.prompt, en: 'Changed unacknowledged prompt'}} : candidate)};
    expectHidden(project(changedPrompt).state);
    const changedPin = {...state, pins: {...state.pins, map_digest: '0'.repeat(64)}};
    expectHidden(project(changedPin).state);
    expect(state.offer!.state).toBe('active');
  });

  it.each([
    {...SCOPE, room_id: 'room-B'}, {...SCOPE, session_id: 'game-B'}, {...SCOPE, round_id: 'round-B'},
    {...SCOPE, actors: ['alice', 'eve'] as const}, {...SCOPE, actors: ['alice', 'alice'] as const},
  ])('denies substituted scope without advancing clock or leaking content: %j', wrong => {
    const state = advice(active());
    const denied = projectPrivateConversation(state, ctx('alice', 99999, wrong));
    expect(denied.error).toBe('SCOPE_DENIED');
    expect(denied.view).toBeNull();
    expect(denied.state).toBe(state);
    expect(applyPrivateConversation(state, {kind: 'stop'}, ctx('alice', 99999, wrong)).error).toBe('SCOPE_DENIED');
  });

  it('rejects a third actor and own-preference access and rejects a reversed actor ordering', () => {
    const state = active();
    expect(projectPrivateConversation(state, ctx('eve')).error).toBe('SCOPE_DENIED');
    expect(projectOwnTopicPreferences(state, ctx('eve')).preference).toBeNull();
    expect(projectPrivateConversation(state, ctx('bob', 1000, {...SCOPE, actors: ['bob', 'alice']})).error).toBe('SCOPE_DENIED');
  });

  it('defensively copies and deeply freezes input state, labels, candidates and projections', () => {
    const input = structuredClone(base());
    const before = JSON.stringify(input);
    let state = createPrivateConversation(input);
    (input.candidates[0]!.prompt as {en: string}).en = 'External change';
    expect(state.candidates[0]!.prompt.en).toBe('Secret prompt alpha');
    expect(JSON.stringify(base())).toBe(before);
    const original = JSON.stringify(state);
    state = run(state, {kind: 'set_topics', expected_preference_revision: 1, allow: ['music'], exclude: []});
    expect(JSON.parse(original).preferences.alice.allow).toEqual([]);
    expect(Object.isFrozen(state.preferences.alice!.allow)).toBe(true);
    expect(() => (state.candidates[0]!.prompt as {en: string}).en = 'Mutation').toThrow();
    const projected = project(active());
    expect(Object.isFrozen(projected.view!.prompt!.prompt)).toBe(true);
  });

  it('rejects unknown topics, malformed labels, duplicate/unknown refs and invalid time bounds at construction', () => {
    expect(() => createPrivateConversation({...base(), topics: [{topic_id: 'music', labels: {ru: 'a', en: 'b', tr: '\ud800'}}]})).toThrow();
    expect(() => createPrivateConversation({...base(), candidates: [{...candidates[0]!, topic_ids: ['unknown']}]})).toThrow();
    expect(() => createPrivateConversation({...base(), candidates: [candidates[0]!, candidates[0]!]})).toThrow();
    expect(() => createPrivateConversation({...base(), candidates: [{...candidates[0]!, card_sha256: 'bad'}]})).toThrow();
    expect(() => createPrivateConversation({...base(), pins: {...base().pins, map_digest: 'unknown'}})).toThrow();
    expect(() => createPrivateConversation({...base(), parent_expires_at: 181001})).toThrow();
    expect(() => createPrivateConversation({...base(), parent_expires_at: 1000})).toThrow();
  });

  it('seeds exact room-ledger exclusions without widening and rejects malformed owner settings', () => {
    const state = createPrivateConversation({...base(), preferences: {
      alice: {revision: 8, allow: ['food'], excluded: ['music']}, bob: {revision: 2, allow: [], excluded: []},
    }});
    expect(projectOwnTopicPreferences(state, ctx()).preference).toEqual({revision: 8, allow: ['food'], excluded: ['music']});
    expect(applyPrivateConversation(state, {kind: 'set_topics', expected_preference_revision: 8, allow: ['food', 'music'], exclude: []}, ctx()).error).toBe('NOT_AVAILABLE');
    expect(applyPrivateConversation(state, {kind: 'set_topics', expected_preference_revision: 8, allow: ['unknown'], exclude: []}, ctx()).error).toBe('INVALID_INPUT');
    expect(() => createPrivateConversation({...base(), preferences: {alice: {revision: 1, allow: [], excluded: []}}})).toThrow();
  });
});


