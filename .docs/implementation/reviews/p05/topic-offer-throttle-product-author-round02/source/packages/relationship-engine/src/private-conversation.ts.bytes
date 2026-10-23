import {createHash} from 'node:crypto';

/** Additive, server-private, in-memory FSM. No legacy selector/snapshot is changed.
 * All returned states (including errors and projections) MUST be committed by the
 * caller before another operation. In particular, discarding an expiry/rewind
 * result discards its clock fence. This is not a persistence/restore or dispatch
 * fence: authentication, current presence/round, approved catalogue/map proof,
 * room-wide exclusion ledger, candidate selection, and final delivery remain
 * integration responsibilities. Never serialize this internal state to clients.
 * A caller must generate unique unpredictable 256-bit offer tokens. The token is
 * independent of content; the exact candidate binding hash stays server-private.
 */
export const PRIVATE_CONVERSATION_VERSION = 'venus.private-conversation.v1' as const;
const PENDING_MS = 30_000;
const ACTIVE_MS = 180_000;
const OFFER_INTERVAL_MS = 5_000;
const MAX_TOPIC_ATTEMPTS = 3;
type Labels = Readonly<{ru: string; en: string; tr: string}>;
export type ConversationScope = Readonly<{room_id: string; session_id: string; round_id: string; actors: readonly [string, string]}>;
export type ConversationPins = Readonly<{pack_digest: string; map_digest: string; taxonomy_digest: string}>;
export type ConversationTopic = Readonly<{topic_id: string; labels: Labels}>;
export type ConversationCandidate = Readonly<{
  candidate_ref: string; card_id: string; card_revision: number; card_sha256: string;
  prompt: Labels; topic_ids: readonly string[];
}>;
export type TopicPreference = Readonly<{revision: number; allow: readonly string[]; excluded: readonly string[]}>;
type TopicOffer = Readonly<{
  offer_id: string; epoch: number; proposal_revision: number; token: string;
  candidate_ref: string; binding_hash: string; acks: readonly string[];
  state: 'pending' | 'active'; created_at: number; expires_at: number;
}>;
type AdviceOffer = Readonly<{
  advice_id: string; revision: number; sender: string; recipient: string; epoch: number;
  topic_offer_id: string; state: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  text: string | null; created_at: number; expires_at: number;
}>;
export type PrivateConversation = Readonly<{
  schema: typeof PRIVATE_CONVERSATION_VERSION; scope: ConversationScope; pins: ConversationPins;
  topics: readonly ConversationTopic[]; candidates: readonly ConversationCandidate[];
  preferences: Readonly<Record<string, TopicPreference>>;
  revision: number; epoch: number; created_at: number; clock_floor: number; parent_expires_at: number;
  state: 'open' | 'stopped' | 'expired'; offer: TopicOffer | null;
  topic_attempts: number; last_offer_at: number | null; used_offer_ids: readonly string[];
  used_tokens: readonly string[]; used_candidate_refs: readonly string[]; declined_topics: readonly string[];
  advice: readonly AdviceOffer[]; advice_attempts: Readonly<Record<string, number>>;
}>;
export type ConversationContext = Readonly<{scope: ConversationScope; actor: string; now: number}>;
type OfferReference = Readonly<{offer_id: string; epoch: number; proposal_revision: number; token: string}>;
export type PrivateConversationCommand =
  | Readonly<{kind: 'set_topics'; expected_preference_revision: number; allow: readonly string[]; exclude: readonly string[]}>
  | Readonly<{kind: 'offer_topic'; expected_revision: number; expected_epoch: number; offer_id: string; token: string;
      candidate: Readonly<{candidate_ref: string; card_sha256: string}>}>
  | (Readonly<{kind: 'respond_topic'; decision: 'accept' | 'decline'}> & OfferReference)
  | (Readonly<{kind: 'other_question'; exclude_current_topics: boolean}> & OfferReference)
  | Readonly<{kind: 'stop'}>
  | Readonly<{kind: 'offer_advice'; epoch: number; topic_offer_id: string; advice_id: string; text: string; replaces_id?: string}>
  | Readonly<{kind: 'respond_advice'; advice_id: string; revision: number; epoch: number; decision: 'accept' | 'decline'}>
  | Readonly<{kind: 'revoke_advice'; advice_id: string; revision: number; epoch: number}>;
export type ConversationError = 'INVALID_INPUT' | 'SCOPE_DENIED' | 'INVALID_CLOCK' | 'CLOCK_REWIND'
  | 'CLOSED' | 'STALE' | 'REPLAY' | 'NOT_AVAILABLE' | 'LIMIT' | 'RATE_LIMIT' | 'ROLE_DENIED';
export type ConversationResult = Readonly<{state: PrivateConversation; error: ConversationError | null}>;
export type PrivateConversationView = Readonly<{
  schema: typeof PRIVATE_CONVERSATION_VERSION; revision: number; epoch: number;
  state: 'empty' | 'pending' | 'active' | 'closed';
  offer?: Readonly<{offer_id: string; epoch: number; proposal_revision: number; token: string;
    topics: readonly ConversationTopic[]; own_accepted: boolean; expires_at: number}>;
  prompt?: ConversationCandidate;
  advice: readonly (Readonly<{advice_id: string; revision: number; epoch: number; direction: 'received';
    state: 'pending' | 'accepted'; expires_at: number; text?: string}>
    | Readonly<{advice_id: string; revision: number; epoch: number; direction: 'sent';
      state: 'pending' | 'accepted'; expires_at: number; text: string}>)[];
}>;

class Invalid extends Error {}
function demand(value: unknown): asserts value { if (!value) throw new Invalid(); }
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function safeInt(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function id(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value); }
function digest(value: unknown): value is string { return typeof value === 'string' && /^(?:sha256:)?[a-f0-9]{64}$/.test(value); }
function validText(value: unknown, scalars: number, bytes: number): value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || Buffer.byteLength(value, 'utf8') > bytes
    || Array.from(value).length > scalars || /[\p{Cc}\p{Zl}\p{Zp}\u061c\u200e\u200f\u202a-\u202e\u2066-\u206f]/u.test(value)) return false;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  return true;
}
function labels(value: Labels, limit: number): Labels {
  demand(value && Object.keys(value).sort().join(',') === 'en,ru,tr');
  demand(validText(value.ru, limit, limit * 4) && validText(value.en, limit, limit * 4) && validText(value.tr, limit, limit * 4));
  return {ru: value.ru, en: value.en, tr: value.tr};
}
function topicsSet(values: readonly string[], vocabulary: readonly ConversationTopic[]): string[] {
  demand(Array.isArray(values) && values.length <= vocabulary.length && new Set(values).size === values.length);
  demand(values.every(value => vocabulary.some(topic => topic.topic_id === value)));
  return [...values].sort();
}
function scope(input: ConversationScope): ConversationScope {
  demand(input && id(input.room_id) && id(input.session_id) && id(input.round_id));
  demand(Array.isArray(input.actors) && input.actors.length === 2 && input.actors.every(id) && input.actors[0] !== input.actors[1]);
  const actors = [...input.actors] as [string, string];
  return {room_id: input.room_id, session_id: input.session_id, round_id: input.round_id, actors};
}
function sameScope(a: ConversationScope, b: ConversationScope): boolean {
  try { return JSON.stringify(a) === JSON.stringify(scope(b)); } catch { return false; }
}
function candidateFor(state: PrivateConversation, ref: string): ConversationCandidate | undefined {
  return state.candidates.find(candidate => candidate.candidate_ref === ref);
}
function binding(state: PrivateConversation, offer: Omit<TopicOffer, 'binding_hash'>): string {
  const candidate = candidateFor(state, offer.candidate_ref);
  return createHash('sha256').update(JSON.stringify({schema: state.schema, scope: state.scope, pins: state.pins,
    epoch: offer.epoch, offer_id: offer.offer_id, proposal_revision: offer.proposal_revision,
    token: offer.token, candidate})).digest('hex');
}
function eligible(state: PrivateConversation, candidate: ConversationCandidate): boolean {
  return state.scope.actors.every(actor => {
    const pref = state.preferences[actor]!;
    return candidate.topic_ids.every(topic => pref.allow.includes(topic) && !pref.excluded.includes(topic));
  }) && candidate.topic_ids.every(topic => !state.declined_topics.includes(topic));
}
function revokedAdvice(state: PrivateConversation): readonly AdviceOffer[] {
  return state.advice.map(offer => offer.text === null ? offer : {...offer, state: 'revoked', text: null});
}
function invalidate(state: PrivateConversation): PrivateConversation {
  return {...state, epoch: state.epoch + 1, offer: null, advice: revokedAdvice(state)};
}
function result(state: PrivateConversation, error: ConversationError | null = null): ConversationResult {
  return freeze({state: freeze(state), error});
}

/** Pins/candidates are supplied by a separately verified catalogue/map/planner.
 * This constructor proves shape and exact subsequent binding, not semantic tags
 * or human review. Seeds must come from the caller's current room safety ledger.
 */
export function createPrivateConversation(input: Readonly<{
  scope: ConversationScope; pins: ConversationPins; topics: readonly ConversationTopic[];
  candidates: readonly ConversationCandidate[]; now: number; parent_expires_at: number;
  preferences?: Readonly<Record<string, TopicPreference>>;
}>): PrivateConversation {
  const scoped = scope(input.scope);
  demand(safeInt(input.now) && safeInt(input.parent_expires_at) && input.parent_expires_at > input.now
    && input.parent_expires_at - input.now <= ACTIVE_MS);
  demand(input.pins && Object.values(input.pins).length === 3 && Object.values(input.pins).every(digest));
  const pins = {pack_digest: input.pins.pack_digest, map_digest: input.pins.map_digest, taxonomy_digest: input.pins.taxonomy_digest};
  demand(Object.values(pins).every(digest));
  demand(Array.isArray(input.topics) && input.topics.length > 0 && input.topics.length <= 64);
  const topics = input.topics.map(topic => {
    demand(topic && id(topic.topic_id));
    return {topic_id: topic.topic_id, labels: labels(topic.labels, 128)};
  }).sort((a, b) => a.topic_id.localeCompare(b.topic_id));
  demand(new Set(topics.map(topic => topic.topic_id)).size === topics.length);
  demand(Array.isArray(input.candidates) && input.candidates.length <= 450);
  const candidates = input.candidates.map(candidate => {
    demand(candidate && id(candidate.candidate_ref) && id(candidate.card_id) && safeInt(candidate.card_revision)
      && candidate.card_revision > 0 && digest(candidate.card_sha256));
    const ids = topicsSet(candidate.topic_ids, topics);
    demand(ids.length > 0);
    return {candidate_ref: candidate.candidate_ref, card_id: candidate.card_id, card_revision: candidate.card_revision,
      card_sha256: candidate.card_sha256, prompt: labels(candidate.prompt, 4096), topic_ids: ids};
  });
  demand(new Set(candidates.map(candidate => candidate.candidate_ref)).size === candidates.length);
  demand(new Set(candidates.map(candidate => `${candidate.card_id}:${candidate.card_revision}`)).size === candidates.length);
  const preferences: Record<string, TopicPreference> = Object.create(null) as Record<string, TopicPreference>;
  const advice_attempts: Record<string, number> = Object.create(null) as Record<string, number>;
  if (input.preferences) demand(Object.keys(input.preferences).length === 2 && Object.keys(input.preferences).every(actor => scoped.actors.includes(actor)));
  for (const actor of scoped.actors) {
    const seed = input.preferences?.[actor];
    const allow = seed ? topicsSet(seed.allow, topics) : [];
    const excluded = seed ? topicsSet(seed.excluded, topics) : [];
    demand(!seed || (safeInt(seed.revision) && seed.revision > 0));
    demand(allow.every(topic => !excluded.includes(topic)));
    preferences[actor] = {revision: seed?.revision ?? 1, allow, excluded};
    advice_attempts[actor] = 0;
  }
  return freeze({schema: PRIVATE_CONVERSATION_VERSION, scope: scoped, pins, topics, candidates, preferences,
    revision: 1, epoch: 0, created_at: input.now, clock_floor: input.now, parent_expires_at: input.parent_expires_at,
    state: 'open', offer: null, topic_attempts: 0, last_offer_at: null, used_offer_ids: [], used_tokens: [],
    used_candidate_refs: [], declined_topics: [], advice: [], advice_attempts});
}

function advance(state: PrivateConversation, context: ConversationContext): ConversationResult {
  if (!context || !sameScope(state.scope, context.scope) || !state.scope.actors.includes(context.actor)) return result(state, 'SCOPE_DENIED');
  if (!safeInt(context.now)) return result({...invalidate(state), state: 'stopped', revision: state.revision + 1}, 'INVALID_CLOCK');
  if (context.now < state.clock_floor) return result({...invalidate(state), state: 'stopped', revision: state.revision + 1}, 'CLOCK_REWIND');
  let next: PrivateConversation = {...state, clock_floor: context.now};
  if (next.state !== 'open') return result(next);
  if (context.now >= next.parent_expires_at) return result({...invalidate(next), state: 'expired', revision: next.revision + 1});
  if (next.offer && (context.now >= next.offer.expires_at || next.offer.binding_hash !== binding(next, next.offer)
    || !candidateFor(next, next.offer.candidate_ref) || !eligible(next, candidateFor(next, next.offer.candidate_ref)!))) {
    next = {...invalidate(next), revision: next.revision + 1};
  }
  if (next.advice.some(offer => offer.text !== null && context.now >= offer.expires_at)) {
    next = {...next, revision: next.revision + 1, advice: next.advice.map(offer => offer.text !== null && context.now >= offer.expires_at
      ? {...offer, state: 'expired', text: null} : offer)};
  }
  return result(next);
}
function changed(state: PrivateConversation, patch: Partial<PrivateConversation>): ConversationResult {
  return result({...state, ...patch, revision: state.revision + 1});
}

/** Failed actions also return the time-advanced state; never discard that state. */
/** Normal new-topic throttles shared with server capability and pre-mutation gates.
 * Safety commands (other_question/stop/decline) must not use this restriction. */
export function privateTopicOfferRestriction(state: PrivateConversation, now: number): 'LIMIT' | 'RATE_LIMIT' | null {
  if (state.topic_attempts >= MAX_TOPIC_ATTEMPTS) return 'LIMIT';
  if (state.last_offer_at !== null && now - state.last_offer_at < OFFER_INTERVAL_MS) return 'RATE_LIMIT';
  return null;
}

export function applyPrivateConversation(state: PrivateConversation, command: PrivateConversationCommand, context: ConversationContext): ConversationResult {
  const advanced = advance(state, context);
  if (advanced.error) return advanced;
  const current = advanced.state;
  if (current.state !== 'open') return result(current, 'CLOSED');
  try {
    demand(command && typeof command === 'object');
    const actor = context.actor;
    switch (command.kind) {
      case 'set_topics': {
        const pref = current.preferences[actor]!;
        if (command.expected_preference_revision !== pref.revision) return result(current, 'STALE');
        const allow = topicsSet(command.allow, current.topics);
        const excluded = [...new Set([...pref.excluded, ...topicsSet(command.exclude, current.topics)])].sort();
        if (allow.some(topic => excluded.includes(topic))) return result(current, 'NOT_AVAILABLE');
        if (JSON.stringify(pref.allow) === JSON.stringify(allow) && JSON.stringify(pref.excluded) === JSON.stringify(excluded)) return result(current, 'REPLAY');
        return changed(invalidate(current), {preferences: {...current.preferences, [actor]: {revision: pref.revision + 1, allow, excluded}}});
      }
      case 'offer_topic': {
        if (command.expected_revision !== current.revision || command.expected_epoch !== current.epoch) return result(current, 'STALE');
        demand(id(command.offer_id) && typeof command.token === 'string' && /^[a-f0-9]{64}$/.test(command.token));
        demand(command.candidate && id(command.candidate.candidate_ref) && digest(command.candidate.card_sha256));
        if (current.used_offer_ids.includes(command.offer_id) || current.used_tokens.includes(command.token)) return result(current, 'REPLAY');
        if (current.topic_attempts >= MAX_TOPIC_ATTEMPTS) return result(current, 'LIMIT');
        if (current.offer?.state === 'pending') return result(current, 'NOT_AVAILABLE');
        if (current.last_offer_at !== null && context.now - current.last_offer_at < OFFER_INTERVAL_MS) return result(current, 'RATE_LIMIT');
        const candidate = candidateFor(current, command.candidate.candidate_ref);
        if (!candidate || candidate.card_sha256 !== command.candidate.card_sha256 || current.used_candidate_refs.includes(candidate.candidate_ref)
          || !eligible(current, candidate)) return result(current, 'NOT_AVAILABLE');
        const next = invalidate(current);
        const offer: Omit<TopicOffer, 'binding_hash'> = {offer_id: command.offer_id, token: command.token, epoch: next.epoch,
          proposal_revision: current.topic_attempts + 1, candidate_ref: candidate.candidate_ref, acks: [], state: 'pending',
          created_at: context.now, expires_at: Math.min(context.now + PENDING_MS, next.parent_expires_at)};
        return changed(next, {offer: {...offer, binding_hash: binding(next, offer)}, topic_attempts: current.topic_attempts + 1,
          last_offer_at: context.now, used_offer_ids: [...current.used_offer_ids, command.offer_id], used_tokens: [...current.used_tokens, command.token],
          used_candidate_refs: [...current.used_candidate_refs, candidate.candidate_ref]});
      }
      case 'respond_topic': {
        demand(command.decision === 'accept' || command.decision === 'decline');
        const offer = current.offer;
        if (!offer || command.offer_id !== offer.offer_id || command.epoch !== offer.epoch
          || command.proposal_revision !== offer.proposal_revision || command.token !== offer.token) return result(current, 'STALE');
        if (offer.state !== 'pending' || (command.decision === 'accept' && offer.acks.includes(actor))) return result(current, 'REPLAY');
        if (command.decision === 'decline') {
          const candidate = candidateFor(current, offer.candidate_ref)!;
          return changed(invalidate(current), {declined_topics: [...new Set([...current.declined_topics, ...candidate.topic_ids])].sort()});
        }
        const acks = [...offer.acks, actor].sort();
        return changed(current, {offer: {...offer, acks, state: acks.length === 2 ? 'active' : 'pending',
          expires_at: acks.length === 2 ? Math.min(context.now + ACTIVE_MS, current.parent_expires_at) : offer.expires_at}});
      }
      case 'other_question': {
        demand(typeof command.exclude_current_topics === 'boolean');
        const offer = current.offer;
        // This is content-specific intent, unlike unconditional safety stop.
        // An old question's delayed exclusion must never target a newer prompt.
        if (!offer || command.epoch !== offer.epoch || command.offer_id !== offer.offer_id
          || command.proposal_revision !== offer.proposal_revision || command.token !== offer.token) return result(current, 'STALE');
        const candidate = candidateFor(current, offer.candidate_ref);
        let preferences = current.preferences;
        if (command.exclude_current_topics && candidate) {
          const pref = current.preferences[actor]!;
          const excluded = [...new Set([...pref.excluded, ...candidate.topic_ids])].sort();
          preferences = {...preferences, [actor]: {revision: pref.revision + 1, excluded, allow: pref.allow.filter(topic => !excluded.includes(topic))}};
        }
        return changed(invalidate(current), {preferences});
      }
      case 'stop': return changed(invalidate(current), {state: 'stopped'});
      case 'offer_advice': {
        demand(id(command.advice_id) && validText(command.text, 1000, 4096));
        if (current.offer?.state !== 'active') return result(current, 'NOT_AVAILABLE');
        if (command.epoch !== current.epoch || command.topic_offer_id !== current.offer.offer_id) return result(current, 'STALE');
        if (current.advice.some(offer => offer.advice_id === command.advice_id)) return result(current, 'REPLAY');
        if (current.advice_attempts[actor]! >= 2) return result(current, 'LIMIT');
        const live = current.advice.find(offer => offer.sender === actor && (offer.state === 'pending' || offer.state === 'accepted'));
        if (command.replaces_id !== undefined && (!id(command.replaces_id) || !live || live.advice_id !== command.replaces_id)) return result(current, 'STALE');
        if (live && command.replaces_id === undefined) return result(current, 'NOT_AVAILABLE');
        const recipient = current.scope.actors.find(value => value !== actor)!;
        const advice: AdviceOffer = {advice_id: command.advice_id, revision: live ? live.revision + 1 : 1, sender: actor,
          recipient, epoch: current.epoch, topic_offer_id: current.offer.offer_id, state: 'pending', text: command.text,
          created_at: context.now, expires_at: Math.min(context.now + PENDING_MS, current.offer.expires_at, current.parent_expires_at)};
        return changed(current, {advice: [...current.advice.map(offer => offer === live ? {...offer, state: 'revoked' as const, text: null} : offer), advice],
          advice_attempts: {...current.advice_attempts, [actor]: current.advice_attempts[actor]! + 1}});
      }
      case 'respond_advice':
      case 'revoke_advice': {
        const advice = current.advice.find(offer => offer.advice_id === command.advice_id);
        if (!advice || advice.revision !== command.revision || advice.epoch !== command.epoch || current.epoch !== command.epoch
          || current.offer?.state !== 'active' || advice.topic_offer_id !== current.offer.offer_id) return result(current, 'STALE');
        if (command.kind === 'respond_advice') {
          demand(command.decision === 'accept' || command.decision === 'decline');
          if (advice.recipient !== actor) return result(current, 'ROLE_DENIED');
          if (advice.state !== 'pending') return result(current, 'REPLAY');
        } else if (advice.state !== 'pending' && advice.state !== 'accepted') return result(current, 'REPLAY');
        const status = command.kind === 'revoke_advice' ? 'revoked' : command.decision === 'accept' ? 'accepted' : 'declined';
        return changed(current, {advice: current.advice.map(offer => offer !== advice ? offer : {...offer, state: status,
          text: status === 'accepted' ? offer.text : null, expires_at: status === 'accepted' ? current.offer!.expires_at : offer.expires_at})});
      }
      default: return result(current, 'INVALID_INPUT');
    }
  } catch (error) {
    if (error instanceof Invalid || error instanceof TypeError) return result(current, 'INVALID_INPUT');
    throw error;
  }
}

/** Private-pair projection only. No group/public event projector exists here.
 * Pending offers contain only allowed topic labels and opaque response metadata;
 * no card reference, prompt/candidate hash, preview, text or length is returned.
 */
export function projectPrivateConversation(state: PrivateConversation, context: ConversationContext): Readonly<{
  state: PrivateConversation; error: ConversationError | null; view: PrivateConversationView | null;
}> {
  const advanced = advance(state, context);
  if (advanced.error) return freeze({...advanced, view: null});
  const current = advanced.state;
  const offer = current.offer;
  const candidate = offer ? candidateFor(current, offer.candidate_ref) : undefined;
  const view: PrivateConversationView = {schema: current.schema, revision: current.revision, epoch: current.epoch,
    state: current.state !== 'open' ? 'closed' : offer?.state ?? 'empty',
    ...(offer && candidate ? {offer: {offer_id: offer.offer_id, epoch: offer.epoch, proposal_revision: offer.proposal_revision,
      token: offer.token, topics: current.topics.filter(topic => candidate.topic_ids.includes(topic.topic_id)),
      own_accepted: offer.acks.includes(context.actor), expires_at: offer.expires_at}} : {}),
    ...(offer?.state === 'active' && candidate ? {prompt: candidate} : {}),
    advice: offer?.state === 'active' ? current.advice.filter(advice => advice.epoch === current.epoch
      && advice.topic_offer_id === offer.offer_id && advice.text !== null && (advice.state === 'pending' || advice.state === 'accepted'))
      .map(advice => advice.sender === context.actor
        ? {advice_id: advice.advice_id, revision: advice.revision, epoch: advice.epoch, direction: 'sent' as const,
          state: advice.state as 'pending' | 'accepted', expires_at: advice.expires_at, text: advice.text!}
        : {advice_id: advice.advice_id, revision: advice.revision, epoch: advice.epoch, direction: 'received' as const,
          state: advice.state as 'pending' | 'accepted', expires_at: advice.expires_at,
          ...(advice.state === 'accepted' ? {text: advice.text!} : {})}) : []};
  return freeze({...advanced, view});
}

export function projectOwnTopicPreferences(state: PrivateConversation, context: ConversationContext): Readonly<{
  state: PrivateConversation; error: ConversationError | null; preference: TopicPreference | null;
}> {
  const advanced = advance(state, context);
  return freeze({...advanced, preference: advanced.error ? null : advanced.state.preferences[context.actor]!});
}
