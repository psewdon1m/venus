# Topic Games V2 implementation checkpoint

2026-10-19. DESIGN PROPOSAL ONLY. No included implementation files changed.
Inputs: topic-planner SHA83f4b5e4bd96d3ad7d2bb00b533693fdee240a628123d983b6491bd2fc77775a; private-conversation SHA57d33ce1af14b4a3a69979a004a7c7122e529f2420ce99cb678089361120ccfd; settings adapter SHA4c22cf0c93eae92f5411c69a2f379b36700aabe5e3343ac0147fd4808194e7f5; AGENTS/ADR023/topic design.

## 1. Concrete dependencies and root integration contract

New `TopicGames` is inactive unless explicitly constructed with feature enabled and all required hooks. It never invokes legacy Games or changes legacy codecs. Root owns protocol2-from-birth admission and the composite RoomGameHooks/router: protocol1 -> Games, protocol2 -> TopicGames or closed/unavailable. Feature-off must not route protocol2 to legacy.

```ts
import type {PoolClient} from 'pg';
import type {FrozenPack,FrozenTopicMap,TopicSafetyState,TopicMapPins} from '@venus/relationship-engine';
export interface PlannerTopicSafetyProvider {
  read(c:PoolClient,roomId:string,exactMemberIds:readonly string[]):Promise<TopicSafetyState>;
  excludeLocked(c:PoolClient,roomId:string,authenticatedMemberId:string,
    requestId:string,topicIds:readonly string[]):Promise<TopicSafetyState>;
  // Sync external birth/lifecycle/ledger fence after the final SQL await.
  // Must deny if exclusions/revisions advanced beyond observed state.
  assertCurrent(roomId:string,observed:TopicSafetyState):void;
}
export interface TopicGameSource {
  active(c:PoolClient):Promise<{pack:FrozenPack;map:FrozenTopicMap}|null>;
  pinned(c:PoolClient,pins:TopicMapPins):Promise<{pack:FrozenPack;map:FrozenTopicMap}>;
  // Sync registry/catalogue withdrawal/lifecycle process-floor fence.
  assertCurrent(pins:TopicMapPins):void;
}
```

Provider reads EXACT selected member IDs; caller validates exact set, room, revision and vocabulary against verified map. `excludeLocked` shares existing catalogue/room transaction/lock and must not open a nested public settings transaction. Backend validates intended current offer/epoch/revision/token before invoking it. A settings narrowing hook calls `TopicGames.topicsChanged(c,roomId,ownerId)` to revoke current epoch/advice/chat/projections inside same transaction. Durable exclusion remains strict if later SQL fails. Root source provider authenticates approved registry pins, not user input. Default synthetic denied; test construction requires an explicitly named fixture option and verified synthetic pack/map, with factory imported only from direct test module (never engine production index).

Backend provides the complete RoomGameHooks surface plus `topicsChanged`/`withdrawPacks`/`quiesce`; root chooses exact protocol before delegation. Existing private ref hooks remain references only. Root must final-recheck actual socket credential/generation/expiry/entry policy after all child awaited reads; child does member/presence/current scope/source/safety/TTL checks. HTTP routes use credential and private-read/member guards and sync `enqueueFencedJson` callback; private GET forbids query, POST requires Origin/CSRF. No trusted member ID accepted from HTTP.

`private-topic-migrations.ts` generation/probe update to2 is a ROOT integration dependency (outside child ownership). Migration002 will be inactive until root updates generation/readiness and runtime fixture applies it. Migration001 and all legacy migrations remain byte-identical.

## 2. Durable state / AAD / capacity

Reuse `game_sessions`, `game_participants`, `game_rounds`, `game_round_actors` ONLY for lifecycle, shared one-running constraint, frozen membership/current round and actor ACL. New sidecar `topic_game_sessions` identifies schema2 and exact pins. Shared draft/snapshot/round cipher contains explicit schema2 payload using exclusively `topic-game-draft:room:session:2`, `topic-game-snapshot:room:session:2`, `topic-game-round:room:session:round:2`; never legacy AAD1/OldRoundData/RoundPlan. Snapshot is real TopicSnapshot whose nested baseline is the genuine immutable schema1 configuration, not fake history/plan. No V2 object is passed to legacy selector/reader.

Sidecar encrypted object store `topic_game_objects(room,session,object_id,kind,revision,chunk_count,byte_length)` + `topic_game_chunks(...,chunk_index,cipher)` supports snapshot/history metadata, each planner round/history record, conversation state, advice/chat/projections and idempotency receipts. Private metadata/text is never SQL plaintext: only fixed kind, UUID scope/revision/count/time lifecycle metadata. AAD includes version2, room/session/round/object/kind/revision/index/count; authenticated object header also binds complete byte count/content digest. JSON UTF8 splits into <=11000-byte chunks encoded inside padded16KiB cipher (<=16380 JSON bytes); bounded decode/count/exact ordering/missing/extra/hash reject. Each object <=8MiB, <=800chunks; candidates are stored as pinned card/side/condition references and reconstructed from verified pack (max3 actual candidates per moment), not duplicated450 full multilingual prompt texts. Advice <=4 offers, chat bounded messages/page/bytes; 100 rounds supported without a single16KiB assumption.

Actual planner records are stored/reloaded exactly: history metadata + genuine rounds/public_history/private_history. Cross-session/mode prior histories come only from this room's verified encrypted runtime records, with original exact pins/ref/session/round/disclosure; never invented RoundPlan/card IDs, simulation provenance or cleared history. Filter incompatible map/pack pins by refusing new mixed-history start, not discarding prior repeat protection silently. Bound room records at30000 (planner validation ceiling), session rounds100 and attempts3; bounded queries LIMIT+overflow reject, no unbounded fetch. History has no public topic/semantic index. Public sequence consumes public history only; private prior remains private per planner policy. Child tests exercise chunk boundary/100round state/max candidate sizes/corruption/overflow.

## 3. Round lifecycle for all three modes

Prepare: host, protocol2, enabled exact active source, expected room rev, valid2..8 selected ready members. Store V2 draft. Start: re-read current room/members/current entry/setup/heartbeat, exact approved source/map, provider safety; construct real immutable TopicSnapshot and runtime createTopicHistory with authenticated cross-session prior. Preflight is capacity simulation only, never persisted as runtime consent/history. Select real first topic round, persist complete returned history and current round together. Participants inserted while shared game state waiting. Then state active with V2 snapshot/pins. No approved map/source or feature-off -> closed start, no legacy fallback.

Every advance consumes actual persisted runtime history, only after terminal current round; last advance completes session. New replay is prepare/start new UUID/snapshot/seed with room prior retained. Public nonpair rounds are released through recordTopicOutcome(disclosed) only after final publication checks; group Questions primary remains private (actors=[] public contract, actor ACL table fallback primary).

Both public/private pair rounds begin quiet generic bilateral invitation. Private candidate topics/content never appear in public GameView. Public pair exposes reviewed public card only after both invitation accepts and final presence/source/TTL fence. Private pair additionally creates versioned conversation/topic offer after invitation (and TD choice when needed). Empty eligible pool becomes explicit safe-empty own state without hidden reason/count/topic and allows round-only refusal/skip. Private online requires V2 epoch chat support, never old chat-v1.

Questions: selected primary finishes after applicable invitation/topic/action consent. TD: primary chooses truth/dare after quiet invitation; own alternatives lock on choice; private prompt materializes corresponding pinned field only through new topic epoch bilateral accept. YesBut: secondary proposes validated bounded condition; condition stored encrypted; changing it invalidates current topic/content acknowledgements AND action consent, creates new exact proposal/epoch; no previous acceptance applies to new text. Public YB condition is own-pair data, never added to generic public room fields. Action consent is separate from topic/invitation; action accepts bind exact candidate/side/condition revision and expire within parent moment.

Finish/skip/decline stop current conversation/advice/chat, wipe transient payload/projection rows and persist terminal round and history outcome. Advance creates a new actual round. Pause/Stop/Abort use shared exact participant/host authorization independent of source/ledger health: Stop/Abort end session; Pause closes private grants and pauses. Round refusal closes only own current round. Source faults disable ordinary operations but do not hide authorized session safety; display ownbool remains dense, separate versioned route, no actor/primary/partner/reason matrix.

## 4. Private conversation / advice / chat commands

`/api/v2/rooms/:roomId/game` current/availability/self-actions/prepare/start; session pause/resume/stop/abort/advance; round response/choice/condition/finish; exact round `/conversation` GET, `/conversation/topic-offers`, `/conversation/other-question`, `/conversation/topic-offers/:offerId/respond`, `/conversation/advice` and advice respond/revoke; `/conversation/chat` GET/POST with mandatory conversation ID/epoch.

Client topic offer contains desired allowed vocabulary IDs, never candidate/card/hash/text. Server chooses/replaces candidate only through real topic planner and requires exact current epoch. Other-question first applies exact intended reference check; only then optional durable own exclusion, then current safety union and candidate replacement with new planner epoch/counter; old topic/chat/advice cleared. Planner attempt epoch and kernel offer epoch are distinct stored counters; do not assume equality after side/condition/content invalidations. Replacement after terminal decline prohibited. Rate/attempt caps remain kernel3 topic attempts,5s interval,2 advice/direction, parent<=180s; new offers do not extend original moment.

Kernel candidates are backend-pinned real refs; no participant supplies them. New candidate references append to reconstructed trusted candidate set (<=3). All returned apply/project states, including errors/clock floor/expiry/rewind, are saved before returning error (transaction returns tagged error, outer method throws only AFTER COMMIT). Safety preferences from provider are reconciled before every action; narrowing invalidates content/acks, never re-expands previous exclusions. Backend uses current room-owned preferences as authority; conversation-local set_topics is not public settings authority.

Structured advice sender text is encrypted, <=1000scalars/4096bytes. Recipient pending response has only opaque advice ID/revision/epoch/state/expiry; no text/preview/hash/length/card. Current recipient opt-in opens exact current advice; edit revokes old, creates fresh pending; decline/revoke/expiry/current topic change/disconnect clears delivery. V2 chat requires active current epoch and bounded current pair; sender human text is not claimed topic-filtered. Message IDs/server sequence/cursors are opaque; no old chat-v1 grants, transcript or transport reuse.

## 5. DTO and publication fences

Shared current is existing GameView shape: session/game_rev/state/mode/total_rounds/current_round/pause_reason; V2 route signals schema through envelope/header, not hidden private fields. Public round exact old union rendered from real TopicRound/ref; generic until public release, always generic for private. New `TopicConversationView` envelope: schema_version2, room/session/round/conversation_id/game_rev/revision/epoch/server_time/expires_at and own sanitized kernel projection. Before bilateral topic accept: only allowed topic labels/opaque response fields, no candidate/card/hash/prompt/condition/partner ID. After accept: localized own prompt/optional own condition; omit internal ConversationCandidate ref/hash from API DTO. Advice collection honors exact opt-in. New own-actions dense booleans plus scope/revisions/short relative lease, no role/reason/public leakage. Public outbox never stores private DTOs; private outbox stores opaque reference/revision only and reconstructs current projection at dispatch.

Credential/slot/heartbeat/reservation/entry/room lifetime, immutable protocol2 birth/lifecycle, current exact session/round/revision/epoch, current pair, verified source pins/withdrawal, current safety intersections, invitation/topic/action and advice TTL are rechecked after every awaited preparation and immediately before sync enqueue. Unexpected SQL errors propagate.

To preserve returned clock floors even if a request errors, preparation transaction reconciles/projects and COMMITS encrypted state/projection references before delivery. Delivery transaction only reads exact committed state/projection refs, validates equality/current conditions and synchronously enqueues after final await + sync source/safety/lifecycle/time fences. It never runs a new FSM projection that could return an uncommitted floor. If time/expiry/rewind invalidates the prepared view, it commits a revoke/reconcile result and returns no payload; caller can retry current state. No cached private body is returned from idempotency. `socketView` prepares/persists reference-only state in its committed outer transaction; `privateDelivery` only returns already-committed matching projection after final fences. Root socket credential fence remains mandatory.

## 6. Restart, retained safety, hooks, validation plan

Random process boot token is compared against encrypted moment boot token. First access after restart stops private moment, increments epoch, clears all acks/advice/chat/prepared projections; history/room exclusions persist. Missing birth/provider/source fails closed. Settings narrowing/removal/transport change/pack withdrawal/room purge revoke dependent projection refs and advice/chat within same existing room lock. No missing files initialize through backend. Safety methods can mark shared game aborted/paused and delete private objects even if source/map/ordinary decoding unavailable; no revoked state is made active on retry.

Meaningful tests: real migration/PG constraints and100round object roundtrip; HTTP3modes prepare/start/replay/history; public quiet0/1/2acks; private no content0/1ack; replacement/exclusion cross pair/mode/session; TD/condition oldconsent invalid; structured advice no recipient preview before exactoptin and edit/revoke race; V2chat epoch; stale/late/scope/auth/TTL final-await races; restart/featureoff/mapwithdrawal/sourcefault; retained Stop/Pause/refusal with ordinary failed; source-bound HTTP/WS/PG tests and independent agent review. Child unit/model tests do not substitute for these actual gates. Implementation may proceed in source chunks but will explicitly mark all unimplemented integration gates; no full P05 acceptance from this design or component counts.
