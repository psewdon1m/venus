import { randomUUID } from 'node:crypto';
import { requireThat, token, hash } from './security.mjs';
import { unavailableTopicContent } from './topic-content-availability.mjs';
const DAY = 86400000;
export const timers = { heartbeat: 20000, presence: 45000, reservation: 90000, hostGrace: 600000, idle: DAY, ticket: 60000, primaryDelete: 23 * 3600000, backup: 7 * DAY };
/** Internal, non-JSON publication fence. A V2 child must repeat its own
 * source/safety/epoch/TTL checks after the parent's final credential SQL await. */
export const gameDeliveryFence = Symbol('venus.game.delivery.final-fence');
export function revision(value) { const n = Number(value); requireThat(Number.isSafeInteger(n) && n >= 0, 'REVISION_OVERFLOW', 503); return n; }
function name(value) {
    requireThat(value.trim().length > 0 && !/[\p{Cc}\p{Zl}\p{Zp}\u202A-\u202E\u2066-\u2069]/u.test(value), 'INVALID_NAME', 400);
    requireThat([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].length <= 48, 'INVALID_NAME', 400);
}
export class Rooms {
    options;
    now;
    games;
    constructor(options) {
        this.options = options;
        this.now = options.now ?? Date.now;
    }
    attachGames(games) { requireThat(!this.games, 'GAME_HOOKS_ALREADY_ATTACHED', 503); this.games = games; }
    protocol(room) {
        const version = room.private_protocol === undefined ? 1 : room.private_protocol;
        requireThat(version === 1 || version === 2, 'PRIVATE_PROTOCOL_UNSUPPORTED', 503);
        return version;
    }
    privateHooks(room) {
        if (this.protocol(room) === 1)
            return null;
        requireThat(this.options.privateProtocol, 'PRIVATE_PROTOCOL_UNAVAILABLE', 503);
        return this.options.privateProtocol;
    }
    /** Call as the final awaited operation, then invoke the returned closure at
     * synchronous enqueue/publication. Do not await unrelated work afterwards. */
    async finalAccessFence(c, a, safety = false, socketGeneration) {
        const external = await this.privateHooks(a.room)?.guard(c, a.room.id, a.member.id);
        const row = (await c.query(`SELECT s.expires_at,e.offer_version,e.offer_digest,m.socket_generation,m.slot
      FROM room_sessions s JOIN room_members m ON m.room_id=s.room_id AND m.id=s.member_id
      LEFT JOIN entry_acceptances e ON e.room_id=m.room_id AND e.member_id=m.id
      WHERE s.token_hash=$1 AND s.room_id=$2 AND s.member_id=$3 AND s.revoked_at IS NULL AND m.removed_at IS NULL`, [a.sessionHash, a.room.id, a.member.id])).rows[0];
        return () => {
            external?.();
            const deleted = this.options.ledger.contains(a.room.id), offer = this.options.offer(), now = this.now();
            requireThat(row && row.expires_at.getTime() > now, 'AUTH_REQUIRED', 401);
            if (socketGeneration !== undefined)
                requireThat(revision(row.socket_generation) === socketGeneration && row.slot !== null, 'SOCKET_REPLACED', 401);
            requireThat(a.room.state === 'open' && !deleted && a.room.last_activity_at.getTime() + timers.idle > now, 'ROOM_CLOSED', 403);
            if (!safety)
                requireThat(offer && row.offer_version === offer.version && row.offer_digest === offer.digest, 'ENTRY_REACCEPT_REQUIRED', 403);
        };
    }
    access(c, roomId, session, safety = false, allowInactive = safety) { return this.auth(c, roomId, session, safety, allowInactive); }
    async dispatchPrivateProtocol(roomId, session, enqueue) {
        return this.transaction(async (c) => {
            const a = await this.auth(c, roomId, session, false, true), view = { schema_version: 1, room_id: roomId, private_protocol: this.protocol(a.room) };
            (await this.finalAccessFence(c, a))();
            enqueue(view);
        });
    }
    async changed(c, roomId, activity = true) { return this.emit(c, await this.room(c, roomId), activity); }
    async transaction(operation, catalogLock = 'shared') {
        const c = await this.options.pool.connect();
        try {
            await c.query('BEGIN');
            await c.query(catalogLock === 'exclusive' ? 'SELECT pg_advisory_xact_lock(746826405)' : 'SELECT pg_advisory_xact_lock_shared(746826405)');
            const result = await operation(c);
            await c.query('COMMIT');
            return result;
        }
        catch (error) {
            await c.query('ROLLBACK');
            throw error;
        }
        finally {
            c.release();
        }
    }
    csrf(session) { return this.options.keys.sign('csrf:' + session); }
    async rateLimit(scope, limit = 120) {
        const window = Math.floor(this.now() / 60000);
        const r = await this.options.pool.query(`INSERT INTO admission_limits VALUES($1,$2,1)
      ON CONFLICT(scope_hash) DO UPDATE SET window_start=$2,requests=CASE WHEN admission_limits.window_start=$2 THEN admission_limits.requests+1 ELSE 1 END RETURNING requests`, [hash(scope), window]);
        requireThat(r.rows[0].requests <= limit, 'RATE_LIMITED', 429);
    }
    assertAcceptance(value) {
        const offer = this.options.offer();
        requireThat(offer, 'ENTRY_POLICY_UNAVAILABLE', 503);
        requireThat(value.accept_offer === true && value.adult18 === true && value.offer_version === offer.version && value.offer_digest === offer.digest, 'ENTRY_ACCEPTANCE_REQUIRED', 403);
    }
    async accept(c, roomId, memberId, value) {
        this.assertAcceptance(value);
        await c.query(`INSERT INTO entry_acceptances(room_id,member_id,offer_version,offer_digest,accepted_at,adult_declared_at) VALUES($1,$2,$3,$4,$5,$5)
      ON CONFLICT(room_id,member_id) DO UPDATE SET offer_version=$3,offer_digest=$4,accepted_at=$5,adult_declared_at=$5,rev=entry_acceptances.rev+1`, [roomId, memberId, value.offer_version, value.offer_digest, new Date(this.now())]);
    }
    async currentAcceptance(c, roomId, memberId) {
        const offer = this.options.offer();
        requireThat(offer, 'ENTRY_POLICY_UNAVAILABLE', 503);
        const record = await c.query('SELECT offer_version,offer_digest FROM entry_acceptances WHERE room_id=$1 AND member_id=$2', [roomId, memberId]);
        requireThat(record.rows[0]?.offer_version === offer.version && record.rows[0].offer_digest === offer.digest, 'ENTRY_REACCEPT_REQUIRED', 403);
    }
    async room(c, id) {
        if (this.options.privateProtocol)
            await this.roomOrdering(c, id);
        const r = await c.query('SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
        requireThat(r.rows[0], 'NOT_FOUND', 404);
        return r.rows[0];
    }
    /** Internal maintenance/catalog caller; does not authenticate a consumer.
     * Acquire advisory ordering before the row lock, exactly as room mutations. */
    lockRoom(c, id) { return this.room(c, id); }
    roomOrdering(c, id) {
        return c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,17))', ['venus:room:' + id]);
    }
    async auth(c, roomId, session, safety = false, allowInactive = false) {
        requireThat(session, 'AUTH_REQUIRED', 401);
        const sessionHash = hash(session);
        const grant = await c.query('SELECT member_id FROM room_sessions WHERE token_hash=$1 AND room_id=$2 AND revoked_at IS NULL AND expires_at>$3', [sessionHash, roomId, new Date(this.now())]);
        requireThat(grant.rows[0], 'AUTH_REQUIRED', 401);
        const room = await this.room(c, roomId);
        requireThat(room.state === 'open' && !this.options.ledger.contains(roomId) && this.now() - room.last_activity_at.getTime() < timers.idle, 'ROOM_CLOSED', 403);
        const result = await c.query(`SELECT m.* FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>$2 AND m.removed_at IS NULL`, [sessionHash, new Date(this.now())]);
        requireThat(result.rows[0], 'AUTH_REQUIRED', 401);
        const member = result.rows[0];
        if (!safety)
            await this.currentAcceptance(c, roomId, member.id);
        if (member.slot === null && !allowInactive) {
            await this.reserve(c, roomId, member.id);
            const refreshed = await c.query('SELECT * FROM room_members WHERE room_id=$1 AND id=$2', [roomId, member.id]);
            Object.assign(member, refreshed.rows[0]);
            await this.emit(c, room, false);
        }
        const auth = { room, member, sessionHash };
        if (this.protocol(room) === 2)
            (await this.finalAccessFence(c, auth, safety))();
        return auth;
    }
    project(m) { return { id: m.id, display_name: m.display_name, locale: m.locale, role: m.role, presence: m.presence, setup_ready: m.ready ?? false }; }
    async view(c, room) {
        const rows = await c.query(`SELECT m.*,COALESCE(p.ready,false) AS ready FROM room_members m LEFT JOIN private_preferences p ON p.room_id=m.room_id AND p.owner_member_id=m.id
      WHERE m.room_id=$1 AND m.removed_at IS NULL AND m.slot IS NOT NULL ORDER BY m.id`, [room.id]);
        const games = await this.games?.featureAvailable(c, room.id) ?? false;
        return { room_id: room.id, room_rev: revision(room.rev), state: room.state, meeting_context: room.meeting_context, members: rows.rows.map(m => this.project(m)), features: { games: games ? 'available' : 'unavailable', music: 'unavailable', cinema: 'unavailable', calls: 'unavailable' } };
    }
    async boundEvents(c, table, age) {
        // The same transaction lock serializes insertion+hard caps across rooms.
        await c.query('SELECT pg_advisory_xact_lock(746826402)');
        await c.query(`DELETE FROM ${table} WHERE created_at<=$1`, [new Date(this.now() - age)]);
        await c.query(`DELETE FROM ${table} WHERE seq IN (SELECT seq FROM (SELECT seq,row_number() OVER(ORDER BY seq DESC) AS n,sum(pg_column_size(e)) OVER(ORDER BY seq DESC) AS bytes FROM ${table} e) bounded WHERE n>10000 OR bytes>67108864)`);
    }
    async audit(c, roomId, memberId, action, requestId) {
        await c.query('SELECT pg_advisory_xact_lock(746826402)');
        await c.query('INSERT INTO audit_events(room_id,actor_member_id,action,request_id,created_at) VALUES($1,$2,$3,$4,$5)', [roomId, memberId, action, requestId, new Date(this.now())]);
        await this.boundEvents(c, 'audit_events', 30 * DAY);
    }
    async emit(c, room, activity = true) {
        const r = await c.query(`UPDATE rooms SET rev=rev+1,last_activity_at=CASE WHEN $2 THEN $3 ELSE last_activity_at END WHERE id=$1 RETURNING *`, [room.id, activity, new Date(this.now())]);
        Object.assign(room, r.rows[0]);
        const payload = await this.view(c, room);
        await c.query('SELECT pg_advisory_xact_lock(746826402)');
        await c.query('INSERT INTO outbox_events(event_id,room_id,room_rev,payload,created_at) VALUES($1,$2,$3,$4,$5)', [randomUUID(), room.id, room.rev, payload, new Date(this.now())]);
        await this.boundEvents(c, 'outbox_events', timers.idle);
        return payload;
    }
    async replay(c, scope, key, input) {
        const r = await c.query('SELECT * FROM idempotency_keys WHERE scope=$1 AND key=$2', [scope, key]);
        if (!r.rows[0])
            return null;
        const row = r.rows[0];
        requireThat(this.options.keys.matchesFingerprint(input, row.request_hash), 'IDEMPOTENCY_CONFLICT', 409);
        const reply = this.options.keys.decrypt(row.result_cipher, 'idem:' + scope + ':' + key);
        requireThat(!this.options.ledger.contains(row.room_id), 'ROOM_CLOSED', 403);
        if (reply.session)
            await this.auth(c, row.room_id, reply.session, true, true);
        return reply;
    }
    async remember(c, scope, key, input, roomId, result, requestId, actionOverride) {
        await c.query('INSERT INTO idempotency_keys VALUES($1,$2,$3,$4,$5,$6,$7)', [scope, key, roomId, result.memberId, this.options.keys.fingerprint(input), this.options.keys.encrypt(result, 'idem:' + scope + ':' + key), new Date(this.now())]);
        const action = actionOverride ?? (scope.includes(':join:') ? 'join' : scope.split(':').at(-1));
        await this.audit(c, roomId, result.memberId, action, requestId);
        return result;
    }
    async initialPreferences(c, roomId, memberId) {
        await c.query('INSERT INTO private_preferences(room_id,owner_member_id,cipher) VALUES($1,$2,$3)', [roomId, memberId, this.options.keys.encrypt({ comfort: 0, edges: {} }, `preferences:${roomId}:${memberId}:1`)]);
    }
    async session(c, roomId, memberId) {
        const value = token();
        await c.query('INSERT INTO room_sessions VALUES($1,$2,$3,$4,NULL)', [hash(value), roomId, memberId, new Date(this.now() + timers.idle)]);
        return value;
    }
    async ticket(c, roomId, memberId, sessionHash) {
        const value = token(), expires = new Date(this.now() + timers.ticket);
        await c.query('INSERT INTO ws_tickets VALUES($1,$2,$3,$4,$5)', [hash(value), roomId, memberId, sessionHash, expires]);
        return { ticket: value, expires_at: expires.toISOString() };
    }
    async freeExpiredSlots(c, roomId) {
        return c.query(`UPDATE room_members SET slot=NULL,presence='inactive' WHERE room_id=$1 AND slot IS NOT NULL AND reserved_until<=$2 AND removed_at IS NULL`, [roomId, new Date(this.now())]);
    }
    async reserve(c, roomId, memberId) {
        await this.freeExpiredSlots(c, roomId);
        const used = await c.query('SELECT slot FROM room_members WHERE room_id=$1 AND slot IS NOT NULL', [roomId]);
        const slot = Array.from({ length: 8 }, (_, i) => i + 1).find(v => !used.rows.some(r => r.slot === v));
        requireThat(slot, 'ROOM_FULL', 409);
        await c.query(`UPDATE room_members SET slot=$3,presence='reconnecting',reserved_until=$4,heartbeat_at=$5 WHERE room_id=$1 AND id=$2`, [roomId, memberId, slot, new Date(this.now() + timers.reservation), new Date(this.now())]);
    }
    async create(input, admission, requestId = randomUUID(), privateProtocol = 1) {
        this.assertAcceptance(input.entry_acceptance);
        name(input.name);
        requireThat(privateProtocol === 1 || privateProtocol === 2, 'PRIVATE_PROTOCOL_UNSUPPORTED', 400);
        if (privateProtocol === 2)
            requireThat(this.options.privateProtocol, 'PRIVATE_PROTOCOL_UNAVAILABLE', 503);
        return this.transaction(async (c) => {
            const scope = 'admission:' + hash(admission) + (privateProtocol === 2 ? ':v2:create' : ':create');
            await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [scope + input.idempotency_key]);
            const old = await this.replay(c, scope, input.idempotency_key, input);
            if (old)
                return old;
            const id = randomUUID(), memberId = randomUUID(), invite = token(), now = new Date(this.now());
            if (privateProtocol === 2) {
                await this.roomOrdering(c, id);
                await c.query(`INSERT INTO rooms(id,host_member_id,meeting_context,state,rev,invite_hash,created_at,last_activity_at,closed_at,private_protocol)
          VALUES($1,$2,$3,'open',1,$4,$5,$5,NULL,2)`, [id, memberId, input.meeting_context, hash(invite), now]);
            }
            else
                await c.query('INSERT INTO rooms VALUES($1,$2,$3,\'open\',1,$4,$5,$5,NULL)', [id, memberId, input.meeting_context, hash(invite), now]);
            await c.query('INSERT INTO room_members(room_id,id,display_name,locale,role,slot,heartbeat_at,reserved_until) VALUES($1,$2,$3,$4,\'host\',1,$5,$6)', [id, memberId, input.name, input.locale, now, new Date(this.now() + timers.reservation)]);
            if (privateProtocol === 2) {
                this.assertAcceptance(input.entry_acceptance);
                await this.options.privateProtocol.birth(c, id, memberId, requestId, now.getTime());
            }
            await this.initialPreferences(c, id, memberId);
            await this.accept(c, id, memberId, input.entry_acceptance);
            const session = await this.session(c, id, memberId);
            const room = await this.room(c, id);
            const view = await this.view(c, room);
            if (privateProtocol === 2) {
                const a = await this.auth(c, id, session);
                (await this.finalAccessFence(c, a))();
            }
            const result = await this.remember(c, scope, input.idempotency_key, input, id, { status: 201, session, memberId, body: { room_id: id, invite_url: this.options.origin + '/#invite=' + invite, me: view.members[0], room_rev: 1 } }, requestId);
            if (privateProtocol === 2) {
                const a = await this.auth(c, id, session);
                (await this.finalAccessFence(c, a))();
            }
            return result;
        });
    }
    async resolve(invite, acceptance) {
        this.assertAcceptance(acceptance);
        return this.transaction(async (c) => {
            if (this.options.privateProtocol) {
                const candidate = (await c.query('SELECT id FROM rooms WHERE invite_hash=$1', [hash(invite)])).rows[0];
                requireThat(candidate, 'NOT_FOUND', 404);
                await this.roomOrdering(c, candidate.id);
            }
            const r = await c.query('SELECT * FROM rooms WHERE invite_hash=$1 FOR UPDATE', [hash(invite)]);
            requireThat(r.rows[0], 'NOT_FOUND', 404);
            const room = r.rows[0];
            if (room.state !== 'open' || this.options.ledger.contains(room.id) || this.now() - room.last_activity_at.getTime() >= timers.idle)
                return { room_id: room.id, availability: 'expired' };
            const protocolFence = await this.privateHooks(room)?.guard(c, room.id);
            const released = await this.freeExpiredSlots(c, room.id);
            if (released.rowCount)
                await this.emit(c, room, false);
            const count = await c.query('SELECT count(*) FROM room_members WHERE room_id=$1 AND slot IS NOT NULL', [room.id]);
            protocolFence?.();
            this.assertAcceptance(acceptance);
            requireThat(this.now() - room.last_activity_at.getTime() < timers.idle, 'INVITE_EXPIRED', 410);
            return { room_id: room.id, availability: Number(count.rows[0].count) >= 8 ? 'full' : 'joinable' };
        });
    }
    async join(roomId, input, admission, existing, requestId = randomUUID()) {
        this.assertAcceptance(input.entry_acceptance);
        name(input.display_name);
        return this.transaction(async (c) => {
            const room = await this.room(c, roomId);
            requireThat(room.invite_hash === hash(input.invite_token), 'NOT_FOUND', 404);
            requireThat(room.state === 'open' && !this.options.ledger.contains(roomId) && this.now() - room.last_activity_at.getTime() < timers.idle, 'INVITE_EXPIRED', 410);
            const scope = 'admission:' + hash(admission) + ':join:' + roomId;
            const old = await this.replay(c, scope, input.idempotency_key, input);
            if (old)
                return old;
            if (existing) {
                const a = await this.auth(c, roomId, existing);
                if (a.member.slot === null)
                    await this.reserve(c, roomId, a.member.id);
                const view = await this.emit(c, room);
                const me = view.members.find(m => m.id === a.member.id);
                if (this.protocol(room) === 2)
                    (await this.finalAccessFence(c, a))();
                const result = await this.remember(c, scope, input.idempotency_key, input, roomId, { status: 200, session: existing, memberId: me.id, body: { me, room_view: view, ws_ticket: await this.ticket(c, roomId, me.id, hash(existing)) } }, requestId);
                if (this.protocol(room) === 2)
                    (await this.finalAccessFence(c, a))();
                return result;
            }
            await this.freeExpiredSlots(c, roomId);
            const id = randomUUID(), now = new Date(this.now());
            const privateHooks = this.privateHooks(room);
            if (privateHooks) {
                const capacity = await c.query('SELECT count(*) AS count FROM room_members WHERE room_id=$1 AND slot IS NOT NULL', [roomId]);
                requireThat(Number(capacity.rows[0].count) < 8, 'ROOM_FULL', 409);
                (await privateHooks.guard(c, roomId))();
                this.assertAcceptance(input.entry_acceptance);
                requireThat(this.now() - room.last_activity_at.getTime() < timers.idle, 'INVITE_EXPIRED', 410);
                await privateHooks.admit(c, roomId, id, requestId);
            }
            await c.query('INSERT INTO room_members(room_id,id,display_name,locale,role,heartbeat_at,reserved_until) VALUES($1,$2,$3,$4,\'member\',$5,$6)', [roomId, id, input.display_name, input.locale, now, new Date(this.now() + timers.reservation)]);
            await this.reserve(c, roomId, id);
            await this.initialPreferences(c, roomId, id);
            await this.accept(c, roomId, id, input.entry_acceptance);
            const session = await this.session(c, roomId, id);
            const view = await this.emit(c, room);
            const me = view.members.find(m => m.id === id);
            if (privateHooks) {
                const a = await this.auth(c, roomId, session);
                (await this.finalAccessFence(c, a))();
            }
            const result = await this.remember(c, scope, input.idempotency_key, input, roomId, { status: 200, session, memberId: id, body: { me, room_view: view, ws_ticket: await this.ticket(c, roomId, id, hash(session)) } }, requestId);
            if (privateHooks) {
                const a = await this.auth(c, roomId, session);
                (await this.finalAccessFence(c, a))();
            }
            return result;
        });
    }
    async snapshot(roomId, session) {
        return this.transaction(async (c) => {
            const a = await this.auth(c, roomId, session, true), view = await this.view(c, a.room);
            if (this.protocol(a.room) === 2)
                (await this.finalAccessFence(c, a, true))();
            return view;
        });
    }
    async hostInvite(roomId, session) {
        return this.transaction(async (c) => {
            const a = await this.auth(c, roomId, session);
            requireThat(a.member.role === 'host' && a.room.host_member_id === a.member.id, 'HOST_REQUIRED');
            const r = await c.query(`SELECT scope,key,result_cipher FROM idempotency_keys WHERE room_id=$1 AND member_id=$2 AND scope LIKE 'admission:%:create' LIMIT 1`, [roomId, a.member.id]);
            requireThat(r.rows[0], 'INVITE_UNAVAILABLE', 503);
            const row = r.rows[0];
            const result = this.options.keys.decrypt(row.result_cipher, 'idem:' + row.scope + ':' + row.key);
            const fragment = new URL(result.body.invite_url).hash;
            requireThat(/^#invite=[A-Za-z0-9_-]{43}$/.test(fragment), 'INVITE_UNAVAILABLE', 503);
            if (this.protocol(a.room) === 2)
                (await this.finalAccessFence(c, a))();
            return { invite_url: this.options.origin + '/' + fragment };
        });
    }
    async preference(c, a) {
        const result = await c.query('SELECT cipher,ready,rev FROM private_preferences WHERE room_id=$1 AND owner_member_id=$2', [a.room.id, a.member.id]);
        const p = result.rows[0];
        requireThat(p, 'PREFERENCES_UNAVAILABLE', 503);
        const data = this.options.keys.decrypt(p.cipher, `preferences:${a.room.id}:${a.member.id}:1`);
        const members = await c.query('SELECT id FROM room_members WHERE room_id=$1 AND id<>$2 AND removed_at IS NULL AND slot IS NOT NULL', [a.room.id, a.member.id]);
        const edges = Object.fromEntries(members.rows.map(m => [m.id, data.edges[m.id] ?? { relation: 'friendship', explicit: false }]));
        return { owner_member_id: a.member.id, comfort: data.comfort, edges, ready: p.ready, locked: await this.games?.locked(c, a.room.id) ?? false, rev: revision(p.rev) };
    }
    async preferences(roomId, session) {
        return this.transaction(async (c) => {
            const a = await this.auth(c, roomId, session), view = await this.preference(c, a);
            if (this.protocol(a.room) === 2)
                (await this.finalAccessFence(c, a))();
            return view;
        });
    }
    async mutate(roomId, session, operation, input, requestId) {
        return this.transaction(async (c) => {
            const safety = operation === 'leave' || operation === 'skip' || operation === 'close';
            const a = await this.auth(c, roomId, session, safety, safety);
            const scope = `${roomId}:${a.member.id}:${operation}`;
            if (operation === 'context' || operation === 'close')
                requireThat(a.member.role === 'host' && a.room.host_member_id === a.member.id, 'HOST_REQUIRED');
            const key = input.idempotency_key;
            const old = await this.replay(c, scope, key, input);
            if (old)
                return old;
            if (operation === 'preferences' || operation === 'context')
                requireThat(!await this.games?.locked(c, roomId), 'GAME_SETTINGS_LOCKED', 409);
            const prefOperation = operation === 'preferences' || operation === 'skip';
            const prefs = prefOperation ? await this.preference(c, a) : null;
            if (operation !== 'leave')
                requireThat(input.expected_rev === (prefs?.rev ?? revision(a.room.rev)), 'REVISION_CONFLICT', 409);
            let body;
            if (operation === 'context') {
                await c.query('UPDATE rooms SET meeting_context=$2 WHERE id=$1', [roomId, input.meeting_context]);
                a.room = await this.room(c, roomId);
            }
            if (operation === 'profile') {
                const patch = input;
                if (patch.display_name !== undefined)
                    name(patch.display_name);
                await c.query('UPDATE room_members SET display_name=COALESCE($3,display_name),locale=COALESCE($4,locale) WHERE room_id=$1 AND id=$2', [roomId, a.member.id, patch.display_name ?? null, patch.locale ?? null]);
            }
            if (prefOperation) {
                // Clearing one's setup is a safety withdrawal, even for an immutable
                // running game snapshot: revoke its current private moment first.
                if (operation === 'skip')
                    await this.games?.setupCleared(c, roomId, a.member.id);
                const p = input;
                const edges = {};
                if (operation === 'preferences') {
                    const targets = await c.query('SELECT id FROM room_members WHERE room_id=$1 AND id<>$2 AND removed_at IS NULL AND slot IS NOT NULL', [roomId, a.member.id]);
                    for (const [id, relation] of Object.entries(p.edges)) {
                        requireThat(targets.rows.some(m => m.id === id), 'INVALID_EDGE_SCOPE', 400);
                        edges[id] = { relation, explicit: true };
                    }
                }
                const cipher = this.options.keys.encrypt({ comfort: operation === 'skip' ? 0 : p.comfort, edges }, `preferences:${roomId}:${a.member.id}:1`);
                await c.query('UPDATE private_preferences SET cipher=$3,ready=true,rev=rev+1 WHERE room_id=$1 AND owner_member_id=$2', [roomId, a.member.id, cipher]);
                body = await this.preference(c, a);
            }
            if (operation === 'leave') {
                const privateHooks = this.privateHooks(a.room);
                if (privateHooks) {
                    (await this.finalAccessFence(c, a, true))();
                    await privateHooks.retireMember(c, roomId, a.member.id, requestId);
                }
                await this.games?.removing(c, roomId, a.member.id);
                await c.query('UPDATE room_members SET removed_at=$3,slot=NULL,presence=\'inactive\' WHERE room_id=$1 AND id=$2', [roomId, a.member.id, new Date(this.now())]);
                await c.query('UPDATE room_sessions SET revoked_at=$3 WHERE room_id=$1 AND member_id=$2', [roomId, a.member.id, new Date(this.now())]);
                await c.query('DELETE FROM private_preferences WHERE room_id=$1 AND owner_member_id=$2', [roomId, a.member.id]);
                if (privateHooks) {
                    await c.query('DELETE FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2', [roomId, a.member.id]);
                    await c.query('DELETE FROM private_topic_requests WHERE room_id=$1 AND owner_member_id=$2', [roomId, a.member.id]);
                }
                const others = await c.query('SELECT * FROM private_preferences WHERE room_id=$1', [roomId]);
                for (const p of others.rows) {
                    const aad = `preferences:${roomId}:${p.owner_member_id}:1`;
                    const data = this.options.keys.decrypt(p.cipher, aad);
                    if (data.edges[a.member.id]) {
                        delete data.edges[a.member.id];
                        await c.query('UPDATE private_preferences SET cipher=$3,rev=rev+1 WHERE room_id=$1 AND owner_member_id=$2', [roomId, p.owner_member_id, this.options.keys.encrypt(data, aad)]);
                    }
                }
            }
            if (operation === 'close') {
                if (this.protocol(a.room) === 2)
                    (await this.finalAccessFence(c, a, true))();
                await this.closeRoom(c, a.room, requestId);
            }
            const view = await this.emit(c, a.room, operation !== 'close');
            if (operation === 'context')
                body = view;
            if (operation === 'profile')
                body = view.members.find(m => m.id === a.member.id);
            body ??= { rev: view.room_rev, request_id: requestId };
            const result = await this.remember(c, scope, key, input, roomId, { status: 200, session: null, memberId: a.member.id, body }, requestId);
            // Leave/close deliberately revoke this credential and return only their
            // committed safety receipt. Other own-state responses require a late fence.
            if (this.protocol(a.room) === 2 && operation !== 'leave' && operation !== 'close')
                (await this.finalAccessFence(c, a, safety))();
            return result;
        });
    }
    async reaccept(roomId, session, input, requestId) {
        return this.transaction(async (c) => { const a = await this.auth(c, roomId, session, true); await this.accept(c, roomId, a.member.id, input); await this.audit(c, roomId, a.member.id, 'reaccept', requestId); const r = await c.query('SELECT rev FROM entry_acceptances WHERE room_id=$1 AND member_id=$2', [roomId, a.member.id]); if (this.protocol(a.room) === 2)
            (await this.finalAccessFence(c, a))(); return { rev: revision(r.rows[0].rev), request_id: requestId }; });
    }
    async newTicket(roomId, session) {
        return this.transaction(async (c) => { const a = await this.auth(c, roomId, session); const result = await this.ticket(c, roomId, a.member.id, a.sessionHash); if (this.protocol(a.room) === 2)
            (await this.finalAccessFence(c, a))(); return result; });
    }
    async connect(roomId, session, ticket) {
        return this.transaction(async (c) => {
            const a = await this.auth(c, roomId, session);
            const t = await c.query('DELETE FROM ws_tickets WHERE token_hash=$1 AND room_id=$2 AND member_id=$3 AND session_hash=$4 AND expires_at>$5 RETURNING token_hash', [hash(ticket), roomId, a.member.id, a.sessionHash, new Date(this.now())]);
            requireThat(t.rowCount === 1, 'TICKET_INVALID', 401);
            if (a.member.slot === null)
                await this.reserve(c, roomId, a.member.id);
            const member = await c.query(`UPDATE room_members SET socket_generation=socket_generation+1,presence='online',heartbeat_at=$3,reserved_until=$4 WHERE room_id=$1 AND id=$2 RETURNING socket_generation`, [roomId, a.member.id, new Date(this.now()), new Date(this.now() + timers.reservation)]);
            await this.games?.memberStateChanged(c, roomId);
            await this.emit(c, a.room, false);
            if (this.protocol(a.room) === 2)
                (await this.finalAccessFence(c, a, false, revision(member.rows[0].socket_generation)))();
            return { roomId, memberId: a.member.id, generation: revision(member.rows[0].socket_generation), sessionHash: a.sessionHash };
        });
    }
    async liveGrant(grant, heartbeat = false) { return (await this.socketState(grant, heartbeat)).room; }
    /** Enqueue synchronously under the same room lock used by every revoke mutation.
     * This read-only dispatch transaction only projects previously committed state. */
    async dispatchPrivate(grant, eventId, enqueue) {
        return this.transaction(async (c) => {
            const room = await this.room(c, grant.roomId);
            requireThat(room.state === 'open' && !this.options.ledger.contains(room.id) && this.now() - room.last_activity_at.getTime() < timers.idle, 'ROOM_CLOSED');
            const member = (await c.query(`SELECT m.* FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 AND m.id=$2 AND m.socket_generation=$3 AND m.slot IS NOT NULL AND m.removed_at IS NULL AND s.token_hash=$4 AND s.revoked_at IS NULL AND s.expires_at>$5`, [grant.roomId, grant.memberId, grant.generation, grant.sessionHash, new Date(this.now())])).rows[0];
            requireThat(member, 'SOCKET_REPLACED', 401);
            await this.currentAcceptance(c, grant.roomId, grant.memberId);
            const event = await this.games?.privateDelivery(c, room.id, member.id, member.locale, eventId);
            if (this.protocol(room) === 2) {
                (await this.finalAccessFence(c, { room, member, sessionHash: grant.sessionHash }, false, grant.generation))();
                if (event) {
                    requireThat(typeof event[gameDeliveryFence] === 'function', 'GAME_DELIVERY_FENCE_REQUIRED', 503);
                    try {
                        event[gameDeliveryFence]();
                    }
                    catch (error) {
                        if (unavailableTopicContent(error))
                            return;
                        throw error;
                    }
                }
            }
            if (event)
                enqueue(event, revision(room.rev));
        });
    }
    /** Public game text needs the same final catalogue/room/generation fence as private
     * text. Never enqueue a cached socketState projection after releasing that fence. */
    async dispatchGame(grant, enqueue) {
        return this.transaction(async (c) => {
            const room = await this.room(c, grant.roomId);
            requireThat(room.state === 'open' && !this.options.ledger.contains(room.id) && this.now() - room.last_activity_at.getTime() < timers.idle, 'ROOM_CLOSED');
            const member = (await c.query(`SELECT m.* FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 AND m.id=$2 AND m.socket_generation=$3 AND m.slot IS NOT NULL AND m.removed_at IS NULL AND s.token_hash=$4 AND s.revoked_at IS NULL AND s.expires_at>$5`, [grant.roomId, grant.memberId, grant.generation, grant.sessionHash, new Date(this.now())])).rows[0];
            requireThat(member, 'SOCKET_REPLACED', 401);
            await this.currentAcceptance(c, grant.roomId, grant.memberId);
            const game = await this.games?.publicDelivery(c, room.id, member.locale);
            if (this.protocol(room) === 2) {
                (await this.finalAccessFence(c, { room, member, sessionHash: grant.sessionHash }, false, grant.generation))();
                if (game) {
                    requireThat(typeof game[gameDeliveryFence] === 'function', 'GAME_DELIVERY_FENCE_REQUIRED', 503);
                    try {
                        game[gameDeliveryFence]();
                    }
                    catch (error) {
                        if (unavailableTopicContent(error))
                            return;
                        throw error;
                    }
                }
            }
            if (game)
                enqueue(game, revision(room.rev));
        });
    }
    async socketState(grant, heartbeat = false, afterPrivate = 0) {
        return this.transaction(async (c) => {
            const room = await this.room(c, grant.roomId);
            requireThat(room.state === 'open' && !this.options.ledger.contains(room.id) && this.now() - room.last_activity_at.getTime() < timers.idle, 'ROOM_CLOSED');
            const member = await c.query(`SELECT m.* FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 AND m.id=$2 AND m.socket_generation=$3 AND m.slot IS NOT NULL AND m.removed_at IS NULL AND s.token_hash=$4 AND s.revoked_at IS NULL AND s.expires_at>$5`, [grant.roomId, grant.memberId, grant.generation, grant.sessionHash, new Date(this.now())]);
            requireThat(member.rowCount === 1, 'SOCKET_REPLACED', 401);
            await this.currentAcceptance(c, grant.roomId, grant.memberId);
            const originalCredentialFence = this.protocol(room) === 2 ? await this.finalAccessFence(c, { room, member: member.rows[0], sessionHash: grant.sessionHash }, false, grant.generation) : null;
            originalCredentialFence?.();
            if (heartbeat) {
                await c.query("UPDATE room_members SET presence='online',heartbeat_at=$3,reserved_until=$4 WHERE room_id=$1 AND id=$2", [grant.roomId, grant.memberId, new Date(this.now()), new Date(this.now() + timers.reservation)]);
                await c.query('UPDATE room_sessions SET expires_at=$2 WHERE token_hash=$1', [grant.sessionHash, new Date(this.now() + timers.idle)]);
                if (member.rows[0].presence !== 'online') {
                    await this.games?.memberStateChanged(c, room.id);
                    await this.emit(c, room, false);
                }
            }
            const bundle = await this.games?.socketView(c, room.id, grant.memberId, member.rows[0].locale, afterPrivate);
            const view = await this.view(c, await this.room(c, room.id));
            if (originalCredentialFence) {
                (await this.finalAccessFence(c, { room, member: member.rows[0], sessionHash: grant.sessionHash }, false, grant.generation))();
                // Do not renew a credential that expired while heartbeat or child IO
                // was awaited: the original expiry still bounds this transaction.
                originalCredentialFence();
            }
            return { room: view, game: bundle?.game ?? null, privateEvents: bundle?.privateEvents ?? [] };
        });
    }
    async disconnect(grant) {
        return this.transaction(async (c) => {
            const room = await this.room(c, grant.roomId);
            const changed = await c.query(`UPDATE room_members SET presence='reconnecting',reserved_until=$4 WHERE room_id=$1 AND id=$2 AND socket_generation=$3 AND removed_at IS NULL AND presence='online'`, [grant.roomId, grant.memberId, grant.generation, new Date(this.now() + timers.reservation)]);
            if (changed.rowCount && room.state === 'open')
                await this.games?.memberStateChanged(c, room.id);
            if (changed.rowCount && room.state === 'open')
                await this.emit(c, room, false);
        });
    }
    async closeRoom(c, room, operationId = randomUUID(), retiredAt = this.now()) {
        const privateHooks = this.privateHooks(room);
        if (privateHooks)
            retiredAt = (await privateHooks.retireRoom(c, room.id, operationId, retiredAt)).retiredAt;
        this.options.ledger.revoke(room.id, retiredAt);
        await this.games?.purge(c, room.id);
        await c.query(`UPDATE rooms SET state='closed',closed_at=COALESCE(closed_at,$2) WHERE id=$1`, [room.id, new Date(retiredAt)]);
        await c.query('UPDATE room_sessions SET revoked_at=$2 WHERE room_id=$1', [room.id, new Date(this.now())]);
        await c.query('DELETE FROM ws_tickets WHERE room_id=$1', [room.id]);
        await c.query('DELETE FROM private_preferences WHERE room_id=$1', [room.id]);
        await c.query('DELETE FROM idempotency_keys WHERE room_id=$1', [room.id]);
        Object.assign(room, await this.room(c, room.id));
        if (privateHooks) {
            await c.query('DELETE FROM private_topic_preferences WHERE room_id=$1', [room.id]);
            await c.query('DELETE FROM private_topic_requests WHERE room_id=$1', [room.id]);
        }
    }
    async maintain() {
        for (const [id, closedAt] of this.options.ledger.entries())
            await this.options.pool.query('UPDATE rooms SET state=\'closed\',closed_at=COALESCE(closed_at,$2) WHERE id=$1 AND state<>\'closed\'', [id, new Date(closedAt)]);
        const rooms = await this.options.pool.query('SELECT id FROM rooms ORDER BY id');
        for (const { id } of rooms.rows)
            await this.transaction(async (c) => {
                const room = await this.room(c, id);
                const privateHooks = this.privateHooks(room);
                if (privateHooks) {
                    const recovery = await privateHooks.recovery(c, id);
                    if (recovery.retirement && room.state === 'open')
                        await this.closeRoom(c, room, recovery.retirement.operationId, recovery.retirement.retiredAt);
                    for (const owner of recovery.retiredMembers) {
                        await this.games?.removing(c, id, owner);
                        await c.query("UPDATE room_members SET removed_at=COALESCE(removed_at,$3),slot=NULL,presence='inactive' WHERE room_id=$1 AND id=$2", [id, owner, new Date(this.now())]);
                        await c.query('UPDATE room_sessions SET revoked_at=COALESCE(revoked_at,$3) WHERE room_id=$1 AND member_id=$2', [id, owner, new Date(this.now())]);
                        await c.query('DELETE FROM private_preferences WHERE room_id=$1 AND owner_member_id=$2', [id, owner]);
                        await c.query('DELETE FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2', [id, owner]);
                        await c.query('DELETE FROM private_topic_requests WHERE room_id=$1 AND owner_member_id=$2', [id, owner]);
                    }
                }
                if (room.state === 'open' && this.now() - room.last_activity_at.getTime() >= timers.idle) {
                    await this.closeRoom(c, room);
                    await this.audit(c, id, null, 'idle_close', randomUUID());
                }
                if (room.state === 'closed') {
                    await this.games?.purge(c, id);
                    await c.query('DELETE FROM room_sessions WHERE room_id=$1', [id]);
                    await c.query('DELETE FROM private_preferences WHERE room_id=$1', [id]);
                    await c.query('DELETE FROM idempotency_keys WHERE room_id=$1', [id]);
                    if (privateHooks) {
                        await c.query('DELETE FROM private_topic_preferences WHERE room_id=$1', [id]);
                        await c.query('DELETE FROM private_topic_requests WHERE room_id=$1', [id]);
                        await privateHooks.cleanup(c, id);
                    }
                    return;
                }
                const presence = await c.query(`UPDATE room_members SET presence='reconnecting' WHERE room_id=$1 AND presence='online' AND heartbeat_at<=$2 AND removed_at IS NULL`, [id, new Date(this.now() - timers.presence)]);
                const slots = await this.freeExpiredSlots(c, id);
                if (presence.rowCount || slots.rowCount)
                    await this.emit(c, room, false);
                await this.games?.memberStateChanged(c, id);
            });
        await this.options.pool.query('DELETE FROM rooms WHERE state=\'closed\' AND closed_at<=$1', [new Date(this.now() - timers.primaryDelete)]);
        await this.options.pool.query('DELETE FROM ws_tickets WHERE expires_at<=$1', [new Date(this.now())]);
        await this.options.pool.query('DELETE FROM outbox_events WHERE created_at<=$1', [new Date(this.now() - timers.idle)]);
        await this.options.pool.query('DELETE FROM audit_events WHERE created_at<=$1', [new Date(this.now() - 30 * DAY)]);
        await this.options.pool.query('DELETE FROM admission_limits WHERE window_start<$1', [Math.floor(this.now() / 60000) - 2]);
        this.options.ledger.prune(this.now(), timers.backup);
    }
}
