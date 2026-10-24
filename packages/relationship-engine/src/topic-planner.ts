import {createHmac} from 'node:crypto';
import policy from './policy.json' with {type:'json'};
import {eligible, immutableSnapshot, progressionStage, resolvePair} from './engine.js';
import {canonical, digest, freeze, FrozenPack} from './pack.js';
import {assertEngine, type Card, type Context, type Interaction, type Mode, type PairClass, type Snapshot} from './types.js';
import {FrozenTopicMap, type TopicReference} from './topic-map.js';

/** Additive server-private planner. No exports/activation through legacy index.
 * Public randomness, history, recovery and opportunity schedule never consume
 * private topic settings, attempts, candidate IDs, safety revisions or intensity.
 * Caller authenticates histories/registry/ledger, commits returned immutable state
 * transactionally, and repeats all admission/consent/TTL guards at final enqueue.
 * Pure planning does not grant invitation/action consent or private delivery. */
export const TOPIC_ALGORITHM = 'RE-1.P05-TOPIC-3' as const;
// Compatible partial-function extension; serialized history readers remain v3.
// Exact source + this patch identity + seed + pins identify selection behaviour.
export const TOPIC_SELECTION_REVISION = 'RE-1.P05-TOPIC-3.PUBLIC-EMPTY-PRIVATE-1' as const;
// Selection semantics are versioned separately from the retained RNG domain.
// The exact-ID correction never makes public scheduling consume private history.
export const TOPIC_RANDOM_DOMAIN = 'RE-1.P05-TOPIC-2' as const;
export const TOPIC_PRIVATE_POLICY = 'ROOM-TOPIC-2' as const;
export const TOPIC_RECOVERY_POLICY = 'PUBLIC_BASELINE_PRIVATE_CEILING_35_PERCENT' as const;
export type TopicSnapshot = Readonly<{
  schema: 2; engine_revision: typeof TOPIC_ALGORITHM; private_policy_revision: typeof TOPIC_PRIVATE_POLICY;
  recovery_policy_revision: typeof TOPIC_RECOVERY_POLICY; baseline: Snapshot; pins_digest: string;
}>;
export type TopicSafetyState = Readonly<{
  room_id: string; revision: number;
  members: readonly Readonly<{member_id: string; revision: number; allow_topic_ids: readonly string[]; excluded_topic_ids: readonly string[]}>[];
}>;
export type TopicHistoryRecord = TopicReference & Readonly<{
  sequence: number; room_id: string; session_id: string; round_id: string;
  pack_digest: string; map_sha256: string; repertoire_digest: string;
  mode: Mode; context: Context; interaction: Interaction; actors: readonly string[]; primary_member_id: string; stage: number;
  disclosure: 'selected' | 'disclosed' | 'declined' | 'replaced';
}>;
export type TopicAttempt = Readonly<{
  offer_epoch: number; safety_revision: number; safety_digest: string; candidate_counter: number;
  card: TopicReference | null; state: 'offered' | 'disclosed' | 'declined' | 'replaced' | 'empty';
}>;
export type TopicRound = Readonly<{
  schema: 2; room_id: string; session_id: string; pins_digest: string; round_id: string; round_index: number; stage: number; mode: Mode;
  interaction: Interaction; actors: readonly string[]; primary_member_id: string;
  card: TopicReference | null; requires_action_consent: boolean;
  disclosure: 'selected' | 'disclosed' | 'declined';
  baseline_private_max_intensity: number; attempts: readonly TopicAttempt[];
}>;
export type TopicPlannerHistory = Readonly<{
  schema: 2; provenance: 'RUNTIME' | 'SIMULATION_ONLY'; room_id: string; session_id: string; pins_digest: string; revision: number;
  safety_revision: number; safety_digest: string | null;
  rounds: readonly TopicRound[]; public_history: readonly TopicHistoryRecord[];
  private_history: readonly TopicHistoryRecord[];
}>;
export type TopicPlanningResult = Readonly<{history: TopicPlannerHistory; round: TopicRound}>;
type Option = {kind: Interaction; actors: string[]; cards: Card[]; pairClass: PairClass};
const optionCache = new WeakMap<TopicSnapshot,Map<number,Option[]>>();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const knownSnapshots = new WeakSet<TopicSnapshot>();
const knownSimulations = new WeakSet<TopicPlannerHistory>();
const ownKeys = (value: unknown, names: readonly string[]) => assertEngine(value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...names].sort().join(','), 'TOPIC_PLANNER_FIELDS_INVALID');
const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const pairKey = (actors: readonly string[]) => [...actors].sort().join(':');
const ref = (card: Card): TopicReference => ({card_id: card.id, card_revision: card.revision, card_sha256: digest(card)});
const sameRef = (a: TopicReference | null, b: TopicReference | null) => canonical(a) === canonical(b);
class Random {
  private index = 0;
  constructor(private readonly seed: string, private readonly domain: unknown) {}
  bytes() { return createHmac('sha256', Buffer.from(this.seed, 'hex')).update(TOPIC_RANDOM_DOMAIN + ':' + canonical(this.domain) + ':' + this.index++).digest(); }
  next() { return this.bytes().readUIntBE(0, 6) / 281474976710656; }
  choose<T>(values: readonly T[]) { assertEngine(values.length > 0, 'TOPIC_SAFE_POOL_EXHAUSTED'); return values[Math.floor(this.next() * values.length)]!; }
  weighted<T>(values: readonly T[], weight: (value: T) => number) {
    const weights = values.map(weight), sum = weights.reduce((a,b) => a+b, 0);
    assertEngine(sum > 0 && weights.every(w => Number.isFinite(w) && w >= 0), 'TOPIC_WEIGHTS_INVALID'); let target = this.next() * sum;
    for (let i=0; i<values.length; i++) { target -= weights[i]!; if (target < 0) return values[i]!; } return values.at(-1)!;
  }
  uuid() { const bytes = this.bytes().subarray(0,16); bytes[6] = (bytes[6]! & 15) | 64; bytes[8] = (bytes[8]! & 63) | 128; const h = bytes.toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; }
}
export function immutableTopicSnapshot(input: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap): TopicSnapshot {
  FrozenTopicMap.assertVerified(map, pack);
  ownKeys(input, ['schema','engine_revision','private_policy_revision','recovery_policy_revision','baseline','pins_digest']);
  assertEngine(input.schema === 2 && input.engine_revision === TOPIC_ALGORITHM && input.private_policy_revision === TOPIC_PRIVATE_POLICY
    && input.recovery_policy_revision === TOPIC_RECOVERY_POLICY && input.pins_digest === digest(map.pins), 'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED');
  const baseline = immutableSnapshot(input.baseline, pack);
  const result = freeze({...input, baseline}); knownSnapshots.add(result); return result;
}
function assertSnapshot(snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap) {
  FrozenTopicMap.assertVerified(map, pack);
  assertEngine(knownSnapshots.has(snapshot) && snapshot.pins_digest === digest(map.pins), 'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED');
}
function checkedRef(value: TopicReference, pack: FrozenPack): Card {
  ownKeys(value, ['card_id','card_revision','card_sha256']);
  const card = pack.card(value.card_id);
  assertEngine(value.card_revision === card.revision && value.card_sha256 === digest(card), 'TOPIC_HISTORY_CARD_INVALID'); return card;
}
function records(input: readonly TopicHistoryRecord[], snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap, privateOnly: boolean): void {
  assertEngine(Array.isArray(input) && input.length <= 30000, 'TOPIC_HISTORY_LIMIT');
  const seen = new Set<string>(),sessionCards=new Set<string>(),semanticSeen=new Map<string,Set<string>>(),roundRows=new Map<string,TopicHistoryRecord[]>();
  for (let i=0; i<input.length; i++) {
    const row = input[i]!;
    ownKeys(row, ['card_id','card_revision','card_sha256','sequence','room_id','session_id','round_id','pack_digest','map_sha256','repertoire_digest','mode','context','interaction','actors','primary_member_id','stage','disclosure']);
    const card = checkedRef({card_id:row.card_id,card_revision:row.card_revision,card_sha256:row.card_sha256}, pack);
    assertEngine(row.sequence === i+1 && row.room_id === snapshot.baseline.room_id && uuid.test(row.session_id) && uuid.test(row.round_id)
      && row.pack_digest === pack.digest && row.map_sha256 === map.pins.map_sha256 && row.repertoire_digest === map.pins.repertoire_digest
      && row.mode === card.mode && row.interaction === card.interaction && (row.interaction === 'pair_private') === privateOnly
      && ['online','in_person'].includes(row.context) && card.meeting_contexts.includes(row.context) && integer(row.stage,1,4)
      && card.min_progression_stage <= row.stage && (!privateOnly || row.stage >= 3) && map.allowed(card)
      && (privateOnly ? ['selected','disclosed','declined','replaced'].includes(row.disclosure) : row.disclosure === 'disclosed'), 'TOPIC_HISTORY_INVALID');
    assertEngine(Array.isArray(row.actors) && row.actors.length === card.participants_required && new Set(row.actors).size === row.actors.length
      && row.actors.every((id: string) => uuid.test(id)) && uuid.test(row.primary_member_id)
      && (row.actors.length===0||row.primary_member_id===row.actors[0]), 'TOPIC_HISTORY_SCOPE_INVALID');
    const key = `${row.session_id}:${row.round_id}:${row.card_id}`;
    assertEngine(!seen.has(key), 'TOPIC_HISTORY_DUPLICATE'); seen.add(key);
    if(privateOnly){
      const sessionCard=`${row.session_id}:${row.card_id}`;
      assertEngine(!sessionCards.has(sessionCard),'TOPIC_HISTORY_EXACT_CARD_REPEAT');sessionCards.add(sessionCard);
    }
    const roundKey=`${row.session_id}:${row.round_id}`,sameRound=roundRows.get(roundKey)??[];
    assertEngine(privateOnly?sameRound.length<3&&sameRound.every(prior=>canonical(prior.actors)===canonical(row.actors)
      &&prior.primary_member_id===row.primary_member_id&&prior.mode===row.mode&&prior.context===row.context&&prior.stage===row.stage):sameRound.length===0, 'TOPIC_HISTORY_DUPLICATE_ROUND');
    roundRows.set(roundKey,[...sameRound,row]);
    const scope=privateOnly?pairKey(row.actors):'public',prior=semanticSeen.get(scope)??new Set<string>();
    const familyIds=map.entry(card.id).semantic_family_ids;
    assertEngine(familyIds.every(id=>!prior.has(id)),'TOPIC_HISTORY_SEMANTIC_REPEAT');
    familyIds.forEach(id=>prior.add(id));semanticSeen.set(scope,prior);
  }
}
function validateHistory(history: TopicPlannerHistory, snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap, allowSimulation=false): void {
  ownKeys(history, ['schema','provenance','room_id','session_id','pins_digest','revision','safety_revision','safety_digest','rounds','public_history','private_history']);
  assertEngine(history.provenance === 'RUNTIME' || (allowSimulation && history.provenance === 'SIMULATION_ONLY'), 'TOPIC_SIMULATION_NOT_RUNTIME');
  assertEngine(history.schema === 2 && history.room_id === snapshot.baseline.room_id && history.session_id === snapshot.baseline.session_id
    && history.pins_digest === snapshot.pins_digest && integer(history.revision) && Array.isArray(history.rounds)
    && history.rounds.length <= snapshot.baseline.total_rounds && integer(history.safety_revision)
    && (history.safety_revision===0?history.safety_digest===null:typeof history.safety_digest==='string'&&/^[a-f0-9]{64}$/.test(history.safety_digest)), 'TOPIC_HISTORY_SCOPE_INVALID');
  assertEngine(history.rounds.filter(r=>r.interaction==='pair_private').length<=Math.ceil(.25*snapshot.baseline.total_rounds), 'TOPIC_HISTORY_PRIVATE_CAP');
  records(history.public_history,snapshot,pack,map,false); records(history.private_history,snapshot,pack,map,true);
  const ids = new Set<string>();
  for (let i=0; i<history.rounds.length; i++) {
    const round = history.rounds[i]!;
    ownKeys(round, ['schema','room_id','session_id','pins_digest','round_id','round_index','stage','mode','interaction','actors','primary_member_id','card','requires_action_consent','disclosure','baseline_private_max_intensity','attempts']);
    assertEngine(round.schema === 2 && uuid.test(round.round_id) && !ids.has(round.round_id) && round.round_index === i+1
      && round.room_id===history.room_id&&round.session_id===history.session_id&&round.pins_digest===history.pins_digest
      && round.stage === progressionStage(i+1,snapshot.baseline.total_rounds) && round.mode === snapshot.baseline.mode
      && integer(round.baseline_private_max_intensity,0,4) && Array.isArray(round.attempts) && round.attempts.length <= 3
      && ['selected','disclosed','declined'].includes(round.disclosure)
      && Array.isArray(round.actors) && new Set(round.actors).size === round.actors.length
      && round.actors.every((id: string) => snapshot.baseline.players.some(p => p.id === id))
      && snapshot.baseline.players.some(p => p.id === round.primary_member_id)
      && (round.actors.length === 0 || round.primary_member_id === round.actors[0]), 'TOPIC_HISTORY_ROUND_INVALID'); ids.add(round.round_id);
    const privateRound = round.interaction === 'pair_private';
    assertEngine(privateRound ? round.actors.length === 2 && round.attempts.length > 0 && round.requires_action_consent===true
      : round.card !== null && round.attempts.length === 0, 'TOPIC_HISTORY_ROUND_INVALID');
    if (round.card) {
      const card = checkedRef(round.card,pack);
      assertEngine(card.interaction === round.interaction && map.allowed(card) && eligible(card,snapshot.baseline,round.actors,round.stage)
        && round.requires_action_consent === (card.consent === 'bilateral'), 'TOPIC_HISTORY_ROUND_INVALID');
    }
    for (let j=0; j<round.attempts.length; j++) {
      const attempt=round.attempts[j]!;
      ownKeys(attempt, ['offer_epoch','safety_revision','safety_digest','candidate_counter','card','state']);
      assertEngine(integer(attempt.offer_epoch,1) && integer(attempt.safety_revision,1) && integer(attempt.candidate_counter)
        && /^[a-f0-9]{64}$/.test(attempt.safety_digest)
        && ['offered','disclosed','declined','replaced','empty'].includes(attempt.state)
        && ((attempt.state === 'empty') === (attempt.card === null)), 'TOPIC_HISTORY_ATTEMPT_INVALID');
      if (j>0) assertEngine(attempt.offer_epoch > round.attempts[j-1]!.offer_epoch && attempt.candidate_counter > round.attempts[j-1]!.candidate_counter
        && attempt.safety_revision >= round.attempts[j-1]!.safety_revision, 'TOPIC_HISTORY_ATTEMPT_INVALID');
      if (attempt.card) {
        const card = checkedRef(attempt.card,pack);
        assertEngine(card.interaction === 'pair_private' && map.allowed(card) && eligible(card,snapshot.baseline,round.actors,round.stage), 'TOPIC_HISTORY_ATTEMPT_INVALID');
      }
      if (j < round.attempts.length-1) assertEngine(['replaced','declined','empty'].includes(attempt.state), 'TOPIC_HISTORY_ATTEMPT_INVALID');
    }
    if (privateRound) {
      const last=round.attempts.at(-1)!;
      assertEngine(sameRef(round.card,last.card)
        && round.disclosure === (last.state === 'disclosed' ? 'disclosed' : last.state === 'declined' ? 'declined' : 'selected'), 'TOPIC_HISTORY_ATTEMPT_INVALID');
      const baselineOptions=options(snapshot,pack,map,round.stage).filter(o=>o.kind==='pair_private');
      assertEngine(baselineOptions.some(o=>canonical(o.actors)===canonical(round.actors))
        && round.baseline_private_max_intensity === Math.max(0,...baselineOptions.flatMap(o=>o.cards.map(c=>c.min_comfort))), 'TOPIC_HISTORY_ROUND_INVALID');
    } else assertEngine(round.baseline_private_max_intensity === 0, 'TOPIC_HISTORY_ROUND_INVALID');
    const corresponding = (privateRound ? history.private_history : history.public_history).filter(row => row.session_id === history.session_id && row.round_id === round.round_id);
    const expected: TopicReference[] = privateRound ? round.attempts.filter((a:TopicAttempt)=>a.card).map((a:TopicAttempt)=>a.card!) : round.disclosure==='disclosed'?[round.card!]:[];
    assertEngine(corresponding.length === expected.length && expected.every((r:TopicReference) => corresponding.some(row => row.card_id === r.card_id
      && row.card_revision === r.card_revision && row.card_sha256 === r.card_sha256 && canonical(row.actors) === canonical(round.actors)
      && row.primary_member_id === round.primary_member_id && row.stage === round.stage
      && row.context === snapshot.baseline.context
      && (!privateRound || row.disclosure === (()=>{const a=round.attempts.find((v:TopicAttempt)=>sameRef(v.card,r))!;return a.state==='offered'?'selected':a.state;})()))), 'TOPIC_HISTORY_RECORD_MISMATCH');
  }
  for(const row of [...history.public_history,...history.private_history])if(row.session_id===history.session_id)
    assertEngine(history.rounds.some(r=>r.round_id===row.round_id),'TOPIC_HISTORY_RECORD_MISMATCH');
  assertEngine(history.rounds.flatMap(r=>r.attempts).every(a=>a.safety_revision<=history.safety_revision
    &&(a.safety_revision!==history.safety_revision||a.safety_digest===history.safety_digest)), 'TOPIC_HISTORY_SAFETY_FLOOR');
}
/** Restore validates shape/bindings only. Authentication, monotonic committed
 * revisions, room lifetime and host-file ledger anti-rollback are caller duties. */
export function immutableTopicHistory(input: TopicPlannerHistory, snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap): TopicPlannerHistory {
  assertSnapshot(snapshot,pack,map); validateHistory(input,snapshot,pack,map);
  return freeze(JSON.parse(canonical(input)) as TopicPlannerHistory);
}
function commitHistory(input:TopicPlannerHistory,snapshot:TopicSnapshot,pack:FrozenPack,map:FrozenTopicMap,simulation:boolean):TopicPlannerHistory {
  assertEngine(input.provenance===(simulation?'SIMULATION_ONLY':'RUNTIME'),'TOPIC_SIMULATION_NOT_RUNTIME');
  validateHistory(input,snapshot,pack,map,simulation);const frozen=freeze(JSON.parse(canonical(input)) as TopicPlannerHistory);
  if(simulation)knownSimulations.add(frozen);return frozen;
}
function validateCurrentHistory(history:TopicPlannerHistory,snapshot:TopicSnapshot,pack:FrozenPack,map:FrozenTopicMap):void {
  validateHistory(history,snapshot,pack,map,knownSimulations.has(history));
}
export function createTopicHistory(snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap,
  prior: Readonly<{public_history: readonly TopicHistoryRecord[]; private_history: readonly TopicHistoryRecord[]}> = {public_history:[],private_history:[]}): TopicPlannerHistory {
  ownKeys(prior,['public_history','private_history']);
  assertEngine([...prior.public_history,...prior.private_history].every(row => row.session_id !== snapshot.baseline.session_id), 'TOPIC_HISTORY_SESSION_REUSE');
  return immutableTopicHistory({schema:2,provenance:'RUNTIME',room_id:snapshot.baseline.room_id,session_id:snapshot.baseline.session_id,pins_digest:snapshot.pins_digest,
    revision:0,safety_revision:0,safety_digest:null,rounds:[],public_history:prior.public_history,private_history:prior.private_history},snapshot,pack,map);
}
function safety(input: TopicSafetyState, snapshot: TopicSnapshot, map: FrozenTopicMap): void {
  ownKeys(input,['room_id','revision','members']);
  assertEngine(input.room_id === snapshot.baseline.room_id && integer(input.revision,1) && Array.isArray(input.members)
    && input.members.length <= 8 && new Set(input.members.map(m=>m.member_id)).size === input.members.length, 'TOPIC_SAFETY_INVALID');
  const known = new Set(map.topics.map(t=>t.topic_id));
  for (const member of input.members) {
    ownKeys(member,['member_id','revision','allow_topic_ids','excluded_topic_ids']);
    assertEngine(snapshot.baseline.players.some(p=>p.id===member.member_id) && integer(member.revision,1), 'TOPIC_SAFETY_INVALID');
    for (const set of [member.allow_topic_ids,member.excluded_topic_ids]) assertEngine(Array.isArray(set) && set.length <= known.size
      && new Set(set).size === set.length && set.every(id=>known.has(id)), 'TOPIC_SAFETY_INVALID');
  }
}
function safetyDigest(input:TopicSafetyState):string {
  return digest({...input,members:input.members.map(m=>({...m,allow_topic_ids:[...m.allow_topic_ids].sort(),excluded_topic_ids:[...m.excluded_topic_ids].sort()}))
    .sort((a,b)=>a.member_id<b.member_id?-1:1)});
}
function assertSafetyProgress(history:TopicPlannerHistory,state:TopicSafetyState):void {
  assertEngine(state.revision>=history.safety_revision
    &&(state.revision!==history.safety_revision||history.safety_digest===safetyDigest(state)), 'TOPIC_SAFETY_REWIND');
}
function options(snapshot: TopicSnapshot, pack: FrozenPack, map: FrozenTopicMap, stage: number): Option[] {
  let stages=optionCache.get(snapshot);if(!stages){stages=new Map();optionCache.set(snapshot,stages);}const cached=stages.get(stage);if(cached)return cached;
  const s=snapshot.baseline, result: Option[]=[], modeCards=pack.cards.filter(c=>c.mode===s.mode&&map.allowed(c));
  const add=(kind:Interaction,actors:string[],pairClass:PairClass='X')=>{
    // V2 private delivery always needs its frozen transport capability in either context.
    if(kind==='pair_private'&&!s.capabilities.includes('private_text_chat'))return;
    const cards=modeCards.filter(c=>c.interaction===kind&&eligible(c,s,actors,stage));
    if(kind==='pair_private'&&cards.filter(c=>c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away).length<Math.ceil(.25*s.total_rounds))return;
    if(cards.length)result.push({kind,actors,cards,pairClass});
  };
  add('group',[]); for(const p of s.players)add('solo',[p.id]);
  for(let a=0;a<s.players.length;a++)for(let b=a+1;b<s.players.length;b++){
    const p=s.players[a]!,q=s.players[b]!,{pairClass,initiator}=resolvePair(p,q);if(pairClass==='X')continue;
    add('pair_public',[p.id,q.id],pairClass);add('pair_private',initiator===q.id?[q.id,p.id]:[p.id,q.id],pairClass);
  }
  freeze(result);stages.set(stage,result);return result;
}
function blocked(card:Card, rows:readonly TopicHistoryRecord[], map:FrozenTopicMap) {
  const families=map.entry(card.id).semantic_family_ids;
  return rows.some(row=>row.card_id===card.id||map.entry(row.card_id).semantic_family_ids.some(id=>families.includes(id)));
}
function appearances(rows: readonly TopicHistoryRecord[]) {
  const counts=new Map<string,number>();for(const row of rows)for(const id of new Set([row.primary_member_id,...row.actors]))counts.set(id,(counts.get(id)??0)+1);return counts;
}
function pickOption(rng:Random,pool:Option[],rows:readonly TopicHistoryRecord[]) {
  const count=appearances(rows),weightedPrior=rng.next()<.05;
  return rng.weighted(pool,o=>1/(1+o.actors.reduce((sum,id)=>sum+(count.get(id)??0),0))
    *(weightedPrior&&o.kind.startsWith('pair_')?policy.pair_weight_by_class[o.pairClass]:1));
}
function previousPublicIntensity(snapshot:TopicSnapshot,history:TopicPlannerHistory,pack:FrozenPack,map:FrozenTopicMap):number {
  const previous=history.rounds.at(-1);if(!previous)return 0;
  if(previous.interaction!=='pair_private')return previous.disclosure==='disclosed'?pack.card(previous.card!.card_id).min_comfort:0;
  // Conservative public recovery ceiling: baseline candidates only, before all
  // private filtering/history. Never inspect the actual hidden previous card.
  return Math.max(0,...options(snapshot,pack,map,previous.stage).filter(o=>o.kind==='pair_private').flatMap(o=>o.cards.map(c=>c.min_comfort)));
}
function record(card:Card,round:TopicRound,snapshot:TopicSnapshot,map:FrozenTopicMap,sequence:number,disclosure:TopicHistoryRecord['disclosure']):TopicHistoryRecord {
  return {...ref(card),sequence,room_id:snapshot.baseline.room_id,session_id:snapshot.baseline.session_id,round_id:round.round_id,
    pack_digest:map.pins.pack_digest,map_sha256:map.pins.map_sha256,repertoire_digest:map.pins.repertoire_digest,
    mode:card.mode,context:snapshot.baseline.context,interaction:card.interaction,actors:[...round.actors],primary_member_id:round.primary_member_id,stage:round.stage,disclosure};
}
function effectivePrivateCards(history:TopicPlannerHistory,actors:readonly string[],cards:readonly Card[],map:FrozenTopicMap,state:TopicSafetyState):Card[] {
  const pairRows=history.private_history.filter(row=>pairKey(row.actors)===pairKey(actors));
  const sessionIds=new Set(history.private_history.filter(row=>row.session_id===history.session_id).map(row=>row.card_id));
  return cards.filter(card=>!sessionIds.has(card.id)&&!blocked(card,history.public_history,map)&&!blocked(card,pairRows,map)&&actors.every(actor=>{
    const member=state.members.find(m=>m.member_id===actor);
    return member&&map.entry(card.id).topic_ids.every(topic=>member.allow_topic_ids.includes(topic)&&!member.excluded_topic_ids.includes(topic));
  }));
}
function candidate(snapshot:TopicSnapshot,history:TopicPlannerHistory,round:TopicRound,pack:FrozenPack,map:FrozenTopicMap,state:TopicSafetyState,
  epoch:number,counter:number):TopicAttempt {
  const pairRows=history.private_history.filter(row=>pairKey(row.actors)===pairKey(round.actors));
  let cards=options(snapshot,pack,map,round.stage).find(o=>o.kind==='pair_private'&&canonical(o.actors)===canonical(round.actors))?.cards??[];
  cards=effectivePrivateCards(history,round.actors,cards,map,state);
  const rng=new Random(snapshot.baseline.seed,{domain:'private-candidate',room_id:snapshot.baseline.room_id,session_id:snapshot.baseline.session_id,round_id:round.round_id,actors:round.actors,offer_epoch:epoch,
    candidate_counter:counter,safety_revision:state.revision,pins:map.pins});
  const previous=pairRows.at(-1),intensity=previous?pack.card(previous.card_id).min_comfort:0;
  if(intensity>=2&&rng.next()<.35){const softer=cards.filter(c=>c.min_comfort<intensity);if(softer.length)cards=softer;}
  const card=cards.length?rng.choose(cards):null;
  return {offer_epoch:epoch,safety_revision:state.revision,safety_digest:safetyDigest(state),candidate_counter:counter,card:card?ref(card):null,state:card?'offered':'empty'};
}
export function selectNextTopicRound(snapshot:TopicSnapshot,history:TopicPlannerHistory,pack:FrozenPack,map:FrozenTopicMap,state:TopicSafetyState):TopicPlanningResult {
  assertSnapshot(snapshot,pack,map);validateCurrentHistory(history,snapshot,pack,map);safety(state,snapshot,map);assertSafetyProgress(history,state);
  const s=snapshot.baseline,index=history.rounds.length+1;assertEngine(index<=s.total_rounds,'TOPIC_SESSION_COMPLETE');
  const stage=progressionStage(index,s.total_rounds),base=options(snapshot,pack,map,stage),privates=base.filter(o=>o.kind==='pair_private');
  const publicRows=history.public_history;
  const rng=new Random(s.seed,{domain:'public-schedule',room_id:s.room_id,session_id:s.session_id,index,public_history:publicRows,pins:map.pins});
  const privateAvailable=privates.length>0&&history.rounds.filter(r=>r.interaction==='pair_private').length<Math.ceil(.25*s.total_rounds);
  const opportunity=privateAvailable&&rng.next()<(stage<3?0:stage===3?.22:.4);
  const roundId=rng.uuid();let round:TopicRound;
  const selectPrivate=():TopicRound=>{
    const privateRng=new Random(s.seed,{domain:'private-option',room_id:s.room_id,session_id:s.session_id,index,round_id:roundId,pins:map.pins,
      private_history:history.private_history,public_history:publicRows});
    let pool=privates;
    const previous=history.rounds.findLast(round=>round.interaction==='pair_private')??history.private_history.at(-1);
    if(previous&&pool.some(o=>pairKey(o.actors)!==pairKey(previous.actors)
      &&effectivePrivateCards(history,o.actors,o.cards,map,state).length>0))
      pool=pool.filter(o=>pairKey(o.actors)!==pairKey(previous.actors));
    const selected=pickOption(privateRng,pool,[...publicRows,...history.private_history]);
    const selectedRound:TopicRound={schema:2,room_id:s.room_id,session_id:s.session_id,pins_digest:snapshot.pins_digest,round_id:roundId,round_index:index,stage,mode:s.mode,interaction:'pair_private',actors:[...selected.actors],
      primary_member_id:selected.actors[0]!,card:null,requires_action_consent:true,disclosure:'selected',
      baseline_private_max_intensity:Math.max(...privates.flatMap(o=>o.cards.map(c=>c.min_comfort))),attempts:[]};
    const attempt=candidate(snapshot,history,selectedRound,pack,map,state,1,0);return {...selectedRound,card:attempt.card,attempts:[attempt]};
  };
  if(opportunity)round=selectPrivate();
  else{
    let pool=base.filter(o=>o.kind!=='pair_private').map(o=>({...o,cards:o.cards.filter(c=>!blocked(c,publicRows,map))})).filter(o=>o.cards.length);
    const intensity=previousPublicIntensity(snapshot,history,pack,map);
    if(intensity>=2&&rng.next()<.35){const softer=pool.map(o=>({...o,cards:o.cards.filter(c=>c.min_comfort<intensity)})).filter(o=>o.cards.length);if(softer.length)pool=softer;}
    // This trigger is public/baseline only. Hidden topic availability must not
    // determine whether an opportunity exists; the unchanged private branch may
    // still return a truthful safe-empty candidate with all consent guards.
    if(pool.length===0&&privateAvailable)round=selectPrivate();
    else{
    assertEngine(pool.length>0,'TOPIC_SAFE_POOL_EXHAUSTED');
    const pairs=pool.filter(o=>o.kind==='pair_public'),general=pool.filter(o=>o.kind==='group'||o.kind==='solo');
    if(pairs.length&&general.length)pool=rng.next()<[.2,.4,.6,.6][stage-1]!?pairs:general;
    const selected=pickOption(rng,pool,publicRows),card=rng.choose(selected.cards),actors=[...selected.actors];
    if(selected.kind==='pair_public'&&rng.next()<.5)actors.reverse();
    const count=appearances(publicRows),primary=actors[0]??rng.weighted(s.players,p=>1/(1+(count.get(p.id)??0))).id;
    round={schema:2,room_id:s.room_id,session_id:s.session_id,pins_digest:snapshot.pins_digest,round_id:roundId,round_index:index,stage,mode:s.mode,interaction:card.interaction,actors,primary_member_id:primary,card:ref(card),
      requires_action_consent:card.consent==='bilateral',disclosure:'selected',baseline_private_max_intensity:0,attempts:[]};
    }
  }
  let next:TopicPlannerHistory={...history,revision:history.revision+1,safety_revision:state.revision,safety_digest:safetyDigest(state),rounds:[...history.rounds,round]};
  if(round.card&&round.interaction==='pair_private'){const card=pack.card(round.card.card_id);
    next={...next,private_history:[...history.private_history,record(card,round,snapshot,map,history.private_history.length+1,'selected')]};}
  const frozen=commitHistory(next,snapshot,pack,map,knownSimulations.has(history));return freeze({history:frozen,round:frozen.rounds.at(-1)!});
}
/** Replace only the current private opportunity, preserving actor order, stage,
 * round and consent requirement. Exact replay is read-only; stale requests fail.
 * Max3 attempts mirrors conversation kernel, but integration must coordinate its
 * larger epoch/TTL/decline state and never treat this result as consent. */
export function replaceTopicCandidate(snapshot:TopicSnapshot,history:TopicPlannerHistory,pack:FrozenPack,map:FrozenTopicMap,state:TopicSafetyState,
  request:Readonly<{expected_history_revision:number;round_id:string;offer_epoch:number;candidate_counter:number}>):TopicPlanningResult {
  assertSnapshot(snapshot,pack,map);validateCurrentHistory(history,snapshot,pack,map);safety(state,snapshot,map);assertSafetyProgress(history,state);
  ownKeys(request,['expected_history_revision','round_id','offer_epoch','candidate_counter']);
  const round=history.rounds.at(-1);assertEngine(round&&round.interaction==='pair_private'&&request.round_id===round.round_id,'TOPIC_PRIVATE_ROUND_REQUIRED');
  const last=round.attempts.at(-1)!;
  assertEngine(integer(request.expected_history_revision)&&integer(request.offer_epoch,1)&&integer(request.candidate_counter),'TOPIC_REPLACEMENT_INVALID');
  if(request.offer_epoch===last.offer_epoch&&request.candidate_counter===last.candidate_counter&&state.revision===last.safety_revision){
    assertEngine(request.expected_history_revision===history.revision&&last.safety_digest===safetyDigest(state),'TOPIC_STALE');return freeze({history,round});
  }
  assertEngine(request.expected_history_revision===history.revision&&request.offer_epoch>last.offer_epoch
    &&request.candidate_counter===last.candidate_counter+1&&state.revision>=last.safety_revision
    &&(state.revision!==last.safety_revision||last.safety_digest===safetyDigest(state)),'TOPIC_STALE');
  assertEngine(round.attempts.length<3&&last.state!=='declined','TOPIC_ATTEMPT_LIMIT');
  const attempt=candidate(snapshot,history,round,pack,map,state,request.offer_epoch,request.candidate_counter);
  const replaced={...round,card:attempt.card,disclosure:'selected' as const,attempts:[...round.attempts.slice(0,-1),{...last,state:last.card?'replaced' as const:'empty' as const},attempt]};
  let rows=history.private_history.map(row=>row.session_id===history.session_id&&row.round_id===round.round_id&&row.card_id===last.card?.card_id?{...row,disclosure:'replaced' as const}:row);
  if(attempt.card)rows=[...rows,record(pack.card(attempt.card.card_id),replaced,snapshot,map,rows.length+1,'selected')];
  const next=commitHistory({...history,revision:history.revision+1,safety_revision:state.revision,safety_digest:safetyDigest(state),rounds:[...history.rounds.slice(0,-1),replaced],private_history:rows},snapshot,pack,map,knownSimulations.has(history));
  return freeze({history:next,round:next.rounds.at(-1)!});
}
export const TOPIC_TARGETED_REPLACEMENT_VERSION = 'RE-1.P05-TARGET-1' as const;
export type TargetedTopicReplacementRequest = Readonly<{
  operation_revision: typeof TOPIC_TARGETED_REPLACEMENT_VERSION;
  expected_history_revision: number; round_id: string; offer_epoch: number; candidate_counter: number;
  target_topic_ids: readonly string[];
}>;
/** Additive explicitly targeted operation; the existing replacement/replay path
 * is unchanged. Every target must occur in the candidate's FULL topic union;
 * extra subjects still require both real allow sets and neither exclusion set.
 * The conversation offer must display that full union before fresh bilateral
 * acceptance. Never narrow/fabricate safety state to manufacture this filter.
 *
 * This operation only accepts a STRICTLY NEW epoch. Its request/target binding
 * and authenticated idempotent response live in the caller's encrypted request
 * records. Existing attempt/history schemas do not secretly acquire a new field.
 * Known unavailable targets and genuine exhaustion both yield safe-empty; do not
 * expose whose settings/history removed a subject or exact eligible pool counts.
 */
export function replaceTopicCandidateForTopics(snapshot:TopicSnapshot,history:TopicPlannerHistory,pack:FrozenPack,map:FrozenTopicMap,state:TopicSafetyState,
  request:TargetedTopicReplacementRequest):TopicPlanningResult {
  assertSnapshot(snapshot,pack,map);validateCurrentHistory(history,snapshot,pack,map);safety(state,snapshot,map);assertSafetyProgress(history,state);
  ownKeys(request,['operation_revision','expected_history_revision','round_id','offer_epoch','candidate_counter','target_topic_ids']);
  assertEngine(request.operation_revision===TOPIC_TARGETED_REPLACEMENT_VERSION,'TOPIC_TARGET_VERSION_UNSUPPORTED');
  const vocabulary=new Set(map.topics.map(t=>t.topic_id));
  assertEngine(Array.isArray(request.target_topic_ids)&&request.target_topic_ids.length>0&&request.target_topic_ids.length<=vocabulary.size
    &&new Set(request.target_topic_ids).size===request.target_topic_ids.length&&request.target_topic_ids.every((id:string)=>vocabulary.has(id)), 'TOPIC_TARGET_INVALID');
  const targets=[...request.target_topic_ids].sort();
  const round=history.rounds.at(-1);assertEngine(round&&round.interaction==='pair_private'&&request.round_id===round.round_id,'TOPIC_PRIVATE_ROUND_REQUIRED');
  const last=round.attempts.at(-1)!;
  assertEngine(integer(request.expected_history_revision)&&integer(request.offer_epoch,1)&&integer(request.candidate_counter),'TOPIC_REPLACEMENT_INVALID');
  assertEngine(request.expected_history_revision===history.revision&&request.offer_epoch>last.offer_epoch
    &&request.candidate_counter===last.candidate_counter+1&&state.revision>=last.safety_revision,'TOPIC_STALE');
  assertEngine(round.attempts.length<3&&last.state!=='declined','TOPIC_ATTEMPT_LIMIT');
  const pairRows=history.private_history.filter(row=>pairKey(row.actors)===pairKey(round.actors));
  // Filter the complete actual repertoire BEFORE drawing; one arbitrary card
  // missing a target is never evidence that the target pool is empty.
  let pool=options(snapshot,pack,map,round.stage).find(o=>o.kind==='pair_private'&&canonical(o.actors)===canonical(round.actors))?.cards??[];
  pool=effectivePrivateCards(history,round.actors,pool,map,state).filter(card=>{
    const subjects=map.entry(card.id).topic_ids;
    return targets.every(target=>subjects.includes(target));
  });
  const rng=new Random(snapshot.baseline.seed,{domain:'private-targeted-candidate',operation_revision:TOPIC_TARGETED_REPLACEMENT_VERSION,
    target_topic_ids:targets,room_id:snapshot.baseline.room_id,session_id:snapshot.baseline.session_id,round_id:round.round_id,actors:round.actors,
    offer_epoch:request.offer_epoch,candidate_counter:request.candidate_counter,safety_revision:state.revision,safety_digest:safetyDigest(state),pins:map.pins});
  const previous=pairRows.at(-1),intensity=previous?pack.card(previous.card_id).min_comfort:0;
  if(intensity>=2&&rng.next()<.35){const softer=pool.filter(card=>card.min_comfort<intensity);if(softer.length)pool=softer;}
  const selected=pool.length?rng.choose(pool):null;
  const attempt:TopicAttempt={offer_epoch:request.offer_epoch,safety_revision:state.revision,safety_digest:safetyDigest(state),
    candidate_counter:request.candidate_counter,card:selected?ref(selected):null,state:selected?'offered':'empty'};
  const replaced:TopicRound={...round,card:attempt.card,disclosure:'selected',attempts:[...round.attempts.slice(0,-1),
    {...last,state:last.card?'replaced':'empty'},attempt]};
  let rows=history.private_history.map(row=>row.session_id===history.session_id&&row.round_id===round.round_id&&row.card_id===last.card?.card_id
    ?{...row,disclosure:'replaced' as const}:row);
  if(selected)rows=[...rows,record(selected,replaced,snapshot,map,rows.length+1,'selected')];
  const next=commitHistory({...history,revision:history.revision+1,safety_revision:state.revision,safety_digest:safetyDigest(state),
    rounds:[...history.rounds.slice(0,-1),replaced],private_history:rows},snapshot,pack,map,knownSimulations.has(history));
  return freeze({history:next,round:next.rounds.at(-1)!});
}
/** Caller may record disclosure only after its exact current bilateral/topic/
 * action and delivery fences succeed. Decline is terminal for this opportunity;
 * no API herein reopens it. No reason/actor identity is recorded publicly. */
export function recordTopicOutcome(snapshot:TopicSnapshot,history:TopicPlannerHistory,pack:FrozenPack,map:FrozenTopicMap,
  request:Readonly<{expected_history_revision:number;round_id:string;offer_epoch:number|null;card:TopicReference;outcome:'disclosed'|'declined'}>):TopicPlanningResult {
  assertSnapshot(snapshot,pack,map);validateCurrentHistory(history,snapshot,pack,map);
  ownKeys(request,['expected_history_revision','round_id','offer_epoch','card','outcome']);
  const round=history.rounds.at(-1);assertEngine(round&&round.round_id===request.round_id&&sameRef(round.card,request.card)
    &&request.expected_history_revision===history.revision&&['disclosed','declined'].includes(request.outcome),'TOPIC_STALE');
  const privateRound=round.interaction==='pair_private',last=round.attempts.at(-1);
  assertEngine(privateRound?request.offer_epoch===last!.offer_epoch&&['offered','disclosed'].includes(last!.state):request.offer_epoch===null,'TOPIC_STALE');
  assertEngine(privateRound||round.disclosure!=='declined','TOPIC_STALE');
  if(round.disclosure===request.outcome)return freeze({history,round});
  assertEngine(privateRound||round.disclosure==='selected','TOPIC_STALE');
  const updated=privateRound?{...round,disclosure:request.outcome,attempts:[...round.attempts.slice(0,-1),{...last!,state:request.outcome}]}:{...round,disclosure:request.outcome};
  const next=commitHistory({...history,revision:history.revision+1,rounds:[...history.rounds.slice(0,-1),updated],
    private_history:privateRound?history.private_history.map(row=>row.session_id===history.session_id&&row.round_id===round.round_id&&row.card_id===round.card!.card_id?{...row,disclosure:request.outcome}:row):history.private_history,
    public_history:!privateRound&&request.outcome==='disclosed'?[...history.public_history,record(pack.card(round.card!.card_id),updated,snapshot,map,history.public_history.length+1,'disclosed')]:history.public_history},snapshot,pack,map,knownSimulations.has(history));
  return freeze({history:next,round:next.rounds.at(-1)!});
}
/** Public release is a durable, caller-authorized audience release following
 * consent/final fence, not proof every physical client received the bytes.
 * Default generic; private pairs never become public, even after disclosure.
 * Simulation records are never usable to authorize this runtime projection. */
export function topicPublicProjection(round:TopicRound,history?:TopicPlannerHistory) {
  const released=history?.provenance==='RUNTIME'&&round.room_id===history.room_id&&round.session_id===history.session_id&&round.pins_digest===history.pins_digest
    &&round.disclosure==='disclosed'&&history.rounds.some(r=>canonical(r)===canonical(round))
    &&history.public_history.some(row=>row.session_id===history.session_id&&row.round_id===round.round_id&&row.disclosure==='disclosed'
      &&row.interaction!=='pair_private'&&sameRef({card_id:row.card_id,card_revision:row.card_revision,card_sha256:row.card_sha256},round.card)
      &&canonical(row.actors)===canonical(round.actors));
  return round.interaction==='pair_private'||!released?freeze({round_id:round.round_id,round_index:round.round_index,kind:'generic' as const})
    :freeze({round_id:round.round_id,round_index:round.round_index,kind:'public' as const,card:round.card,interaction:round.interaction,actors:[...round.actors]});
}
/** Deterministic planning simulation only; no consent/delivery is manufactured.
 * Private safe-empty is counted separately, never relabelled playable coverage. */
export function preflightTopics(snapshot:TopicSnapshot,pack:FrozenPack,map:FrozenTopicMap,state:TopicSafetyState,
  prior:Readonly<{public_history:readonly TopicHistoryRecord[];private_history:readonly TopicHistoryRecord[]}>={public_history:[],private_history:[]}) {
  let history=commitHistory({...createTopicHistory(snapshot,pack,map,prior),provenance:'SIMULATION_ONLY'},snapshot,pack,map,true);
  for(let i=0;i<snapshot.baseline.total_rounds;i++){
    const result=selectNextTopicRound(snapshot,history,pack,map,state);history=result.history;
    // Explicit capacity simulation, not an actual public release or consent.
    if(result.round.interaction!=='pair_private')history=recordTopicOutcome(snapshot,history,pack,map,
      {expected_history_revision:history.revision,round_id:result.round.round_id,offer_epoch:null,card:result.round.card!,outcome:'disclosed'}).history;
  }
  const privateRounds=history.rounds.filter(r=>r.interaction==='pair_private');
  return freeze({history,requested_rounds:snapshot.baseline.total_rounds,planned_rounds:history.rounds.length,
    private_opportunities:privateRounds.length,private_playable:privateRounds.filter(r=>r.card).length,
    private_safe_empty:privateRounds.filter(r=>!r.card).length,simulation_only:true as const});
}
