import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {FrozenPack, canonical, digest, freeze} from './pack.js';
import {assertEngine, type Card, type Interaction, type Mode} from './types.js';

/** New server-only runtime format. Candidate authoring records are not approval
 * records and are deliberately not silently converted into this format.
 * The caller authenticates/current-checks the trusted registry pins at admission
 * AND final dispatch. This pure loader cannot establish trust in its caller. */
export const TOPIC_MAP_VERSION = 'venus.topic-map.v1' as const;
export type TopicLabels = Readonly<{ru: string; en: string; tr: string}>;
export type TopicReference = Readonly<{
  card_id: string; card_revision: number; card_sha256: string;
}>;
export type TopicMapEntry = TopicReference & Readonly<{
  mode: Mode; interaction: Interaction; topic_ids: readonly string[];
  semantic_family_ids: readonly string[];
  locale_field_sha256: Readonly<Record<'ru' | 'en' | 'tr', Readonly<Record<string, string>>>>;
}>;
type Approval = Readonly<{
  classification_status: 'APPROVED' | 'SYNTHETIC_MACHINE_FIXTURE';
  approved: boolean; runtime_eligible: boolean; owner_review_status: 'APPROVED' | 'SYNTHETIC_ONLY';
}>;
export type RuntimeTopicMap = Approval & Readonly<{
  schema: typeof TOPIC_MAP_VERSION; map_revision: string; pack_digest: string;
  taxonomy_digest: string; semantic_policy_digest: string; entries: readonly TopicMapEntry[];
}>;
export type RuntimeTopicTaxonomy = Approval & Readonly<{
  schema: typeof TOPIC_MAP_VERSION; taxonomy_revision: string;
  topics: readonly Readonly<{topic_id: string; labels: TopicLabels}>[];
}>;
export type RuntimeSemanticPolicy = Approval & Readonly<{
  schema: typeof TOPIC_MAP_VERSION; semantic_revision: string;
  families: readonly Readonly<{
    semantic_family_id: string; classification: 'EXPLICIT_FAMILY' | 'IDENTITY_ONLY';
    mixed_visibility: boolean; repertoire: 'eligible' | 'exclude';
    members: readonly (TopicReference & Readonly<{interaction: Interaction}>)[];
  }>[];
}>;
export type TopicMapBytes = Readonly<{map: Uint8Array; taxonomy: Uint8Array; semantic: Uint8Array}>;
export type TrustedTopicPins = Readonly<{
  approval_id: string; approval_status: 'APPROVED'; pack_digest: string;
  map_sha256: string; taxonomy_sha256: string; semantic_sha256: string;
}>;
export type TopicMapPins = Readonly<{
  pack_digest: string; map_revision: string; taxonomy_revision: string; semantic_revision: string;
  map_sha256: string; taxonomy_sha256: string; semantic_sha256: string;
  taxonomy_digest: string; semantic_policy_digest: string; repertoire_digest: string;
}>;
const hex = /^[a-f0-9]{64}$/;
const ident = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const approvalKeys = ['classification_status', 'approved', 'runtime_eligible', 'owner_review_status'];
const sha = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
function keys(value: unknown, expected: readonly string[]): asserts value is Record<string, unknown> {
  assertEngine(value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...expected].sort().join(','), 'TOPIC_FIELDS_INVALID');
}
function identifier(value: unknown): asserts value is string {
  assertEngine(typeof value === 'string' && ident.test(value), 'TOPIC_ID_INVALID');
}
function hashes(value: unknown): asserts value is string {
  assertEngine(typeof value === 'string' && hex.test(value), 'TOPIC_HASH_INVALID');
}
function list(value: unknown, maximum: number): asserts value is unknown[] {
  assertEngine(Array.isArray(value) && value.length <= maximum, 'TOPIC_LIST_INVALID');
}
function stringSet(value: unknown, maximum: number): asserts value is string[] {
  list(value, maximum); value.forEach(identifier);
  assertEngine(value.length > 0 && new Set(value).size === value.length, 'TOPIC_LIST_INVALID');
}
function reference(value: unknown, extra: readonly string[] = []): asserts value is TopicReference {
  keys(value, ['card_id', 'card_revision', 'card_sha256', ...extra]); identifier(value.card_id);
  assertEngine(Number.isSafeInteger(value.card_revision) && (value.card_revision as number) > 0, 'TOPIC_REVISION_INVALID');
  hashes(value.card_sha256);
}
/** Bounded lexical validation rejects duplicate keys, invalid Unicode, non-finite
 * numbers, BOM and excessive nesting before JSON.parse can erase that evidence. */
function strictJson(raw: Uint8Array): unknown {
  assertEngine(raw instanceof Uint8Array && raw.byteLength > 0 && raw.byteLength <= 8 * 1024 * 1024, 'TOPIC_JSON_SIZE');
  let text: string;
  try { text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(raw); }
  catch { assertEngine(false, 'TOPIC_JSON_UTF8'); }
  assertEngine(!text.startsWith('\ufeff'), 'TOPIC_JSON_BOM');
  let at = 0;
  const ws = () => { while (/[\x20\t\r\n]/.test(text[at] ?? 'x')) at++; };
  const str = (): string => {
    assertEngine(text[at] === '"', 'TOPIC_JSON_SYNTAX'); const start = at++;
    while (at < text.length) {
      const c = text[at++]; if (c === '\\') at++;
      else if (c === '"') {
        const value = JSON.parse(text.slice(start, at)) as string;
        assertEngine(value === value.normalize('NFC') && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value), 'TOPIC_JSON_UNICODE');
        return value;
      }
    }
    assertEngine(false, 'TOPIC_JSON_SYNTAX');
  };
  const value = (depth: number): void => {
    assertEngine(depth <= 48, 'TOPIC_JSON_DEPTH'); ws(); const c = text[at];
    if (c === '{') {
      at++; ws(); const seen = new Set<string>();
      if (text[at] !== '}') while (true) {
        ws(); const key = str(); assertEngine(!seen.has(key), 'TOPIC_JSON_DUPLICATE'); seen.add(key);
        ws(); assertEngine(text[at++] === ':', 'TOPIC_JSON_SYNTAX'); value(depth + 1); ws();
        if (text[at] !== ',') break; at++;
      }
      assertEngine(text[at++] === '}', 'TOPIC_JSON_SYNTAX');
    } else if (c === '[') {
      at++; ws(); if (text[at] !== ']') while (true) { value(depth + 1); ws(); if (text[at] !== ',') break; at++; }
      assertEngine(text[at++] === ']', 'TOPIC_JSON_SYNTAX');
    } else if (c === '"') str();
    else {
      const start = at; while (at < text.length && !/[\s,\]}]/.test(text[at]!)) at++;
      assertEngine(at > start, 'TOPIC_JSON_SYNTAX'); const token: unknown = JSON.parse(text.slice(start, at));
      assertEngine(typeof token !== 'number' || Number.isFinite(token), 'TOPIC_JSON_NUMBER');
    }
  };
  try { value(0); ws(); assertEngine(at === text.length, 'TOPIC_JSON_TRAILING'); return JSON.parse(text) as unknown; }
  catch (error) { if (error instanceof SyntaxError) assertEngine(false, 'TOPIC_JSON_SYNTAX'); throw error; }
}
function approval(value: unknown, synthetic: boolean): asserts value is Approval {
  const v = value as Partial<Approval> | null;
  assertEngine(v && (synthetic
    ? v.classification_status === 'SYNTHETIC_MACHINE_FIXTURE' && v.approved === false && v.runtime_eligible === false && v.owner_review_status === 'SYNTHETIC_ONLY'
    : v.classification_status === 'APPROVED' && v.approved === true && v.runtime_eligible === true && v.owner_review_status === 'APPROVED'), 'TOPIC_NOT_APPROVED');
}
function validLabels(value: unknown): asserts value is TopicLabels {
  keys(value, ['ru', 'en', 'tr']);
  for (const label of Object.values(value)) assertEngine(typeof label === 'string' && label.trim() === label
    && label.length > 0 && [...label].length <= 128 && !/[\p{Cc}\p{Zl}\p{Zp}\u061c\u200e\u200f\u202a-\u202e\u2066-\u206f]/u.test(label), 'TOPIC_LABEL_INVALID');
}
const verified = new WeakSet<FrozenTopicMap>();
// Server-private index of fully verified, deeply frozen entries; never serialized.
const entryIndexes = new WeakMap<FrozenTopicMap,ReadonlyMap<string,TopicMapEntry>>();
const fixtureCapabilities = new WeakSet<object>();
export type SyntheticTopicFixtureCapability = Readonly<{scope: 'SYNTHETIC_TOPIC_FIXTURE_ONLY'}>;
/** Test-only explicit capability factory; do not export through production index. */
export function syntheticTopicFixtureCapability(): SyntheticTopicFixtureCapability {
  const token = Object.freeze({scope: 'SYNTHETIC_TOPIC_FIXTURE_ONLY' as const});
  fixtureCapabilities.add(token); return token;
}
/** Never serialize this server-only object or its diagnostics to participants. */
export class FrozenTopicMap {
  private constructor(readonly pins: TopicMapPins, readonly entries: readonly TopicMapEntry[],
    readonly topics: RuntimeTopicTaxonomy['topics'], readonly families: RuntimeSemanticPolicy['families'],
    readonly excluded_card_ids: readonly string[], readonly synthetic: boolean) {}
  static load(bytes: TopicMapBytes, pack: FrozenPack, trusted: TrustedTopicPins): FrozenTopicMap {
    keys(trusted, ['approval_id', 'approval_status', 'pack_digest', 'map_sha256', 'taxonomy_sha256', 'semantic_sha256']);
    identifier(trusted.approval_id);
    assertEngine(pack instanceof FrozenPack && !pack.synthetic && trusted.approval_status === 'APPROVED'
      && trusted.pack_digest === pack.digest, 'TOPIC_NOT_APPROVED');
    for (const kind of ['map', 'taxonomy', 'semantic'] as const) {
      hashes(trusted[`${kind}_sha256`]); assertEngine(sha(bytes[kind]) === trusted[`${kind}_sha256`], 'TOPIC_HASH_INVALID');
    }
    return FrozenTopicMap.read(bytes, pack, false);
  }
  /** Explicit machine-fixture entry, intentionally not exported from index.ts.
   * This is not an approval bypass for candidate450: every fixture document must
   * use its own synthetic format/status, and the pack must also be synthetic. */
  static syntheticFixture(bytes: TopicMapBytes, pack: FrozenPack, capability: SyntheticTopicFixtureCapability): FrozenTopicMap {
    assertEngine(pack instanceof FrozenPack && pack.synthetic && fixtureCapabilities.has(capability), 'TOPIC_FIXTURE_ONLY');
    return FrozenTopicMap.read(bytes, pack, true);
  }
  private static read(bytes: TopicMapBytes, pack: FrozenPack, synthetic: boolean): FrozenTopicMap {
    keys(bytes, ['map', 'taxonomy', 'semantic']);
    const map = strictJson(bytes.map), taxonomy = strictJson(bytes.taxonomy), semantic = strictJson(bytes.semantic);
    for (const v of [map, taxonomy, semantic]) approval(v, synthetic);
    keys(map, ['schema', 'map_revision', 'pack_digest', 'taxonomy_digest', 'semantic_policy_digest', 'entries', ...approvalKeys]);
    keys(taxonomy, ['schema', 'taxonomy_revision', 'topics', ...approvalKeys]);
    keys(semantic, ['schema', 'semantic_revision', 'families', ...approvalKeys]);
    assertEngine([map, taxonomy, semantic].every(v => v.schema === TOPIC_MAP_VERSION), 'TOPIC_VERSION_UNSUPPORTED');
    identifier(map.map_revision); identifier(taxonomy.taxonomy_revision); identifier(semantic.semantic_revision);
    assertEngine(map.pack_digest === pack.digest && map.taxonomy_digest === digest(taxonomy)
      && map.semantic_policy_digest === digest(semantic), 'TOPIC_BINDING_INVALID');
    list(taxonomy.topics, 64); assertEngine(taxonomy.topics.length > 0, 'TOPIC_LIST_INVALID');
    const topicIds = new Set<string>();
    for (const raw of taxonomy.topics) {
      keys(raw, ['topic_id', 'labels']); identifier(raw.topic_id); validLabels(raw.labels);
      assertEngine(!topicIds.has(raw.topic_id), 'TOPIC_LIST_INVALID'); topicIds.add(raw.topic_id);
    }
    list(map.entries, 30000); assertEngine(map.entries.length === pack.cards.length, 'TOPIC_COVERAGE_INVALID');
    const entries = new Map<string, TopicMapEntry>();
    for (const raw of map.entries) {
      reference(raw, ['mode', 'interaction', 'topic_ids', 'semantic_family_ids', 'locale_field_sha256']);
      const entry = raw as TopicMapEntry, card = pack.card(entry.card_id);
      assertEngine(!entries.has(entry.card_id) && card.revision === entry.card_revision && digest(card) === entry.card_sha256
        && card.mode === entry.mode && card.interaction === entry.interaction, 'TOPIC_CARD_BINDING_INVALID');
      stringSet(entry.topic_ids, 64); assertEngine(entry.topic_ids.every(id => topicIds.has(id)), 'TOPIC_UNKNOWN');
      stringSet(entry.semantic_family_ids, 30000); keys(entry.locale_field_sha256, ['ru', 'en', 'tr']);
      for (const locale of ['ru', 'en', 'tr'] as const) {
        keys(entry.locale_field_sha256[locale], Object.keys(card.text[locale]));
        for (const [field, text] of Object.entries(card.text[locale])) {
          const pinned = entry.locale_field_sha256[locale][field]; hashes(pinned);
          assertEngine(pinned === createHash('sha256').update(text).digest('hex'), 'TOPIC_LOCALE_BINDING_INVALID');
        }
      }
      entries.set(entry.card_id, entry);
    }
    list(semantic.families, 30000); const familyIds = new Set<string>(), excluded = new Set<string>();
    const actualFamilies = new Map<string,Set<string>>();
    for (const raw of semantic.families) {
      keys(raw, ['semantic_family_id', 'classification', 'mixed_visibility', 'repertoire', 'members']);
      identifier(raw.semantic_family_id);
      assertEngine(!familyIds.has(raw.semantic_family_id) && ['EXPLICIT_FAMILY', 'IDENTITY_ONLY'].includes(raw.classification as string)
        && typeof raw.mixed_visibility === 'boolean' && ['eligible', 'exclude'].includes(raw.repertoire as string), 'TOPIC_FAMILY_INVALID');
      familyIds.add(raw.semantic_family_id); list(raw.members, 30000); const seen = new Set<string>();
      let hasPrivate = false, hasPublic = false;
      for (const member of raw.members) {
        reference(member, ['interaction']); const m = member as TopicReference & {interaction: Interaction};
        const entry = entries.get(m.card_id);
        assertEngine(entry && !seen.has(m.card_id) && entry.card_revision === m.card_revision && entry.card_sha256 === m.card_sha256
          && entry.interaction === m.interaction && entry.semantic_family_ids.includes(raw.semantic_family_id), 'TOPIC_FAMILY_BINDING_INVALID');
        seen.add(m.card_id); if (m.interaction === 'pair_private') hasPrivate = true; else hasPublic = true;
        const actual=actualFamilies.get(m.card_id)??new Set<string>();actual.add(raw.semantic_family_id);actualFamilies.set(m.card_id,actual);
        if (raw.repertoire === 'exclude') excluded.add(m.card_id);
      }
      assertEngine(raw.mixed_visibility === (hasPrivate && hasPublic)
        && (!(hasPrivate && hasPublic) || raw.repertoire === 'exclude')
        && (raw.classification !== 'IDENTITY_ONLY' || raw.members.length === 1), 'TOPIC_MIXED_FAMILY_INVALID');
      if (['P04-SEM-17', 'P04-SEM-18'].includes(raw.semantic_family_id)) assertEngine(raw.repertoire === 'exclude', 'TOPIC_MIXED_FAMILY_INVALID');
    }
    assertEngine([...entries.values()].every(e => e.semantic_family_ids.every(id => familyIds.has(id))), 'TOPIC_UNKNOWN_FAMILY');
    assertEngine([...entries.values()].every(e=>e.semantic_family_ids.length===(actualFamilies.get(e.card_id)?.size??0)
      &&e.semantic_family_ids.every(id=>actualFamilies.get(e.card_id)?.has(id))), 'TOPIC_FAMILY_BINDING_INVALID');
    const pins: TopicMapPins = {
      pack_digest: pack.digest, map_revision: map.map_revision, taxonomy_revision: taxonomy.taxonomy_revision,
      semantic_revision: semantic.semantic_revision, map_sha256: sha(bytes.map), taxonomy_sha256: sha(bytes.taxonomy),
      semantic_sha256: sha(bytes.semantic), taxonomy_digest: digest(taxonomy), semantic_policy_digest: digest(semantic),
      repertoire_digest: digest({version: TOPIC_MAP_VERSION, map_sha256: sha(bytes.map), excluded_card_ids: [...excluded].sort()}),
    };
    const result = new FrozenTopicMap(freeze(pins), freeze(JSON.parse(canonical([...entries.values()].sort((a,b) => a.card_id < b.card_id ? -1 : 1))) as TopicMapEntry[]),
      freeze(JSON.parse(canonical(taxonomy.topics)) as RuntimeTopicTaxonomy['topics']), freeze(JSON.parse(canonical(semantic.families)) as RuntimeSemanticPolicy['families']),
      freeze([...excluded].sort()), synthetic);
    entryIndexes.set(result,new Map(result.entries.map(entry=>[entry.card_id,entry])));
    verified.add(result); return Object.freeze(result);
  }
  entry(id: string): TopicMapEntry { const e = entryIndexes.get(this)?.get(id); assertEngine(e, 'TOPIC_CARD_UNKNOWN'); return e; }
  allowed(card: Card): boolean {
    const entry=entryIndexes.get(this)?.get(card.id);
    return Boolean(entry&&entry.card_revision===card.revision&&entry.card_sha256===digest(card)&&!this.excluded_card_ids.includes(card.id));
  }
  static assertVerified(value: FrozenTopicMap, pack: FrozenPack): void {
    assertEngine(verified.has(value) && value.pins.pack_digest === pack.digest && value.synthetic === pack.synthetic, 'TOPIC_MAP_UNVERIFIED');
  }
}
