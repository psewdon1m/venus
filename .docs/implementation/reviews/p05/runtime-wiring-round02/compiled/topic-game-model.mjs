import { createHash } from 'node:crypto';
import { digest, consentAllows, topicPublicProjection } from '@venus/relationship-engine';
import { requireThat } from './security.mjs';
import { revision } from './rooms.mjs';
export const topicObjectLimits = { chunkBytes: 11000, maxBytes: 8 * 1024 * 1024, maxChunks: 800, historyRows: 30000, chatMessages: 100, chatBytes: 65536 };
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const topicAad = { draft: (r, s) => `topic-game-draft:${r}:${s}:2`, snapshot: (r, s) => `topic-game-snapshot:${r}:${s}:2`, round: (r, s, x) => `topic-game-round:${r}:${s}:${x}:2`, pins: (r, s) => `topic-game-pins:${r}:${s}:2` };
const chunkAad = (s, rev, index, count) => `topic-game-object:${s.room}:${s.session}:${s.id}:${s.kind}:${rev}:${index}:${count}:2`;
export function encodeTopicObject(keys, scope, rev, value) {
    requireThat(Number.isSafeInteger(rev) && rev >= 1, 'TOPIC_OBJECT_INVALID', 503);
    const bytes = Buffer.from(JSON.stringify(value));
    requireThat(bytes.length > 0 && bytes.length <= topicObjectLimits.maxBytes, 'TOPIC_OBJECT_CAPACITY', 503);
    const count = Math.ceil(bytes.length / topicObjectLimits.chunkBytes), digest = sha(bytes);
    requireThat(count <= topicObjectLimits.maxChunks, 'TOPIC_OBJECT_CAPACITY', 503);
    const chunks = Array.from({ length: count }, (_, index) => keys.encrypt({ schema_version: 2, bytes: bytes.length, digest, index, count, segment: bytes.subarray(index * topicObjectLimits.chunkBytes, (index + 1) * topicObjectLimits.chunkBytes).toString('base64') }, chunkAad(scope, rev, index, count)));
    return { bytes: bytes.length, chunks };
}
export function decodeTopicObject(keys, scope, rev, bytes, chunks) {
    requireThat(Number.isSafeInteger(bytes) && bytes > 0 && bytes <= topicObjectLimits.maxBytes && chunks.length === Math.ceil(bytes / topicObjectLimits.chunkBytes) && chunks.length <= topicObjectLimits.maxChunks, 'TOPIC_OBJECT_INVALID', 503);
    let digest = '';
    const parts = chunks.map((cipher, index) => {
        const data = keys.decrypt(cipher, chunkAad(scope, rev, index, chunks.length));
        requireThat(Object.keys(data).sort().join(',') === 'bytes,count,digest,index,schema_version,segment' && data.schema_version === 2 && data.bytes === bytes && data.index === index && data.count === chunks.length && /^[a-f0-9]{64}$/.test(data.digest) && typeof data.segment === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data.segment), 'TOPIC_OBJECT_INVALID', 503);
        if (index === 0)
            digest = data.digest;
        requireThat(data.digest === digest, 'TOPIC_OBJECT_INVALID', 503);
        const part = Buffer.from(data.segment, 'base64');
        requireThat(part.toString('base64') === data.segment && part.length === Math.min(topicObjectLimits.chunkBytes, bytes - index * topicObjectLimits.chunkBytes), 'TOPIC_OBJECT_INVALID', 503);
        return part;
    });
    const joined = Buffer.concat(parts);
    requireThat(joined.length === bytes && sha(joined) === digest, 'TOPIC_OBJECT_INVALID', 503);
    const text = joined.toString('utf8');
    requireThat(Buffer.from(text).equals(joined), 'TOPIC_OBJECT_INVALID', 503);
    return JSON.parse(text);
}
export async function storeTopicObject(c, keys, scope, value) {
    const old = (await c.query('SELECT revision FROM topic_game_objects WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4 FOR UPDATE', [scope.room, scope.session, scope.id, scope.kind])).rows[0];
    const rev = old ? revision(old.revision) + 1 : 1, encoded = encodeTopicObject(keys, scope, rev, value);
    await c.query('INSERT INTO topic_game_objects(room_id,session_id,object_id,kind,revision,chunk_count,byte_length) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(room_id,session_id,object_id,kind) DO UPDATE SET revision=$5,chunk_count=$6,byte_length=$7', [scope.room, scope.session, scope.id, scope.kind, rev, encoded.chunks.length, encoded.bytes]);
    await c.query('DELETE FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4', [scope.room, scope.session, scope.id, scope.kind]);
    for (let index = 0; index < encoded.chunks.length; index++)
        await c.query('INSERT INTO topic_game_chunks VALUES($1,$2,$3,$4,$5,$6)', [scope.room, scope.session, scope.id, scope.kind, index, encoded.chunks[index]]);
    return rev;
}
export async function loadTopicObject(c, keys, scope) {
    const args = [scope.room, scope.session, scope.id, scope.kind], row = (await c.query('SELECT revision,chunk_count,byte_length FROM topic_game_objects WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4', args)).rows[0];
    if (!row)
        return null;
    requireThat(row.chunk_count >= 1 && row.chunk_count <= topicObjectLimits.maxChunks, 'TOPIC_OBJECT_INVALID', 503);
    const chunks = (await c.query('SELECT chunk_index,cipher FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4 ORDER BY chunk_index LIMIT 801', args)).rows;
    requireThat(chunks.length === row.chunk_count && chunks.every((part, i) => part.chunk_index === i), 'TOPIC_OBJECT_INVALID', 503);
    return decodeTopicObject(keys, scope, revision(row.revision), row.byte_length, chunks.map(part => part.cipher));
}
export function candidateFromBinding(pack, b, topics) {
    const card = pack.card(b.card_id);
    requireThat(card.revision === b.card_revision && digest(card) === b.card_sha256, 'TOPIC_CANDIDATE_INVALID', 503);
    const prompt = Object.fromEntries(['ru', 'en', 'tr'].map(locale => { const t = card.text[locale], text = card.mode === 'questions' ? t.question : card.mode === 'truth_or_dare' ? b.side ? t[b.side] : null : t.proposal; requireThat(text, 'TOPIC_CHOICE_REQUIRED', 409); return [locale, text + (card.mode === 'yes_but' ? ' ' + t.responder + (b.condition ? ' ' + b.condition : '') : '')]; }));
    return { candidate_ref: b.candidate_ref, card_id: card.id, card_revision: card.revision, card_sha256: b.card_sha256, prompt, topic_ids: [...topics] };
}
export function topicGameView(game, data, pack, history, locale, names, now = 0) {
    let round = null;
    if (data) {
        const base = { round_id: data.plan.round_id, round_index: data.plan.round_index, state: data.state }, released = topicPublicProjection(data.plan, history ?? undefined);
        round = { ...base, kind: 'generic' };
        if (released.kind === 'public' && pack && (data.plan.interaction !== 'pair_public' || data.invitation && consentAllows(data.invitation, data.plan.actors[0], now))) {
            const card = pack.card(released.card.card_id), raw = card.text[locale], sub = (text) => text.replace(/\{P([12])\}/g, (_m, index) => names.find(n => n.id === [data.plan.primary_member_id, data.plan.actors[1]][Number(index) - 1])?.display_name ?? '');
            const common = { ...base, kind: 'public', card_id: card.id, card_revision: card.revision, actors: data.plan.actors.length ? [...data.plan.actors] : game.mode === 'truth_or_dare' ? [data.plan.primary_member_id] : [], response_state: data.state === 'completed' ? 'completed' : ['skipped', 'stopped'].includes(data.state) ? 'skipped' : data.action?.state === 'active' ? 'accepted' : data.condition ? 'condition_proposed' : 'pending', proposal_revision: data.content_revision };
            round = game.mode === 'questions' ? { ...common, mode: 'questions', text: { question: sub(raw.question) }, choice: null } : game.mode === 'truth_or_dare' ? { ...common, mode: 'truth_or_dare', text: data.choice ? { prompt: sub(raw[data.choice]) } : null, choice: data.choice } : { ...common, mode: 'yes_but', text: { proposal: sub(raw.proposal), responder: sub(raw.responder) }, choice: null };
        }
    }
    return { session_id: game.id, game_rev: revision(game.rev), state: game.state, mode: game.mode, total_rounds: game.round_count, current_round: round, pause_reason: game.pause_reason };
}
export function checkedPins(keys, cipher, room, session) { const pins = keys.decrypt(cipher, topicAad.pins(room, session)); requireThat(pins && typeof pins.map_sha256 === 'string' && /^[a-f0-9]{64}$/.test(pins.map_sha256), 'TOPIC_PINS_INVALID', 503); return pins; }
