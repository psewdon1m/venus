# P05 Topic Games V2 — independent review, round 01

Result: **CHANGES_REQUESTED**. One P2 finding, TG-REV-001. This is a frozen component review, not a full P05 gate or human catalogue approval.

Reviewed source identity: `62b9d73a1e72a63aaf44fa26c98b8219e21c79f43a82f7dfc908cf29ac1d955b`; immutable runtime image `sha256:6f2c41b444f2789c99989a41c6228e5771654a5a307a58a675564c8a0f1059f6`. Twelve exact component sources and their hashes are retained in [the evidence directory](topic-games-round01/pins.json). No included implementation was edited by the reviewer.

## Finding TG-REV-001 — P2 — request replay omits URL session and round

Location: `apps/api/src/topic-games.ts:72`, `mutation()`, plus callers such as `response()`, `finish()`, `conversationCommand()` and `sendChat()`.

The stored idempotency tuple contains room/member/request ID, operation name and an HMAC of the request body. It omits `sessionId` and `roundId` from the URL. The replay branch returns the old encrypted receipt before the callback validates the requested session, current round and actor. A successful request replayed at a different round or session URL therefore receives HTTP 200 with the earlier successful receipt.

Independent reproduction uses actual PostgreSQL, real migrations, the production V2 routes and real loopback HTTP in the frozen image. First submit a valid `response` with `{request_id,kind:'skip'}`. Repeat the identical body at (a) the same session with a different UUID round and (b) a different UUID session with the original round. Both returned **HTTP 200**, byte-equivalent parsed receipt, rather than scope conflict/not-found/stale. The same-scope replay succeeded correctly; changing the body correctly produced HTTP 409 `IDEMPOTENCY_CONFLICT`.

This proves incorrect success and scope-unbound replay. It **does not prove** a second consent grant, cross-member disclosure or execution of a second mutation: the callback is skipped. Nevertheless, the endpoint cannot authoritatively acknowledge the URL scope the caller requested, violating exact scope/idempotency requirements.

Required correction: bind the effective operation identity to all relevant route scope, including the session/round and chat/conversation scope where applicable. Historical body-only receipts need explicit compatibility behavior; do not silently reinterpret old hashes as newly scoped records. Retest same-scope, wrong-round and wrong-session replay through HTTP and independently rerun the frozen source gate.

Raw evidence: [actual SQL/HTTP output](topic-games-round01/runtime/venus-topic-games-review-19a8c1525ff6/tests.txt), [five-case report](topic-games-round01/runtime/venus-topic-games-review-19a8c1525ff6/topic-games-report.json), [independent boundary tests](topic-games-round01/probe-raw-02.txt).

## Executed checks and proof verification

- Independent Linux/Node boundary probes: **34 PASS / 1 FAIL**, exit 1. The failing assertion is TG-REV-001. These execute actual backend/model methods with explicitly declared SQL/auth/source boundary doubles, not actual database transactions. They cover body/operation replay rejection; savepoint rollback versus committed tagged errors; final credential failure; exact non-JSON receipt fences; source failure after final await; source-independent Stop/Pause/Abort and actor refusals; non-host/nonparticipant/nonactor denial; late presence/credential/offer expiry; chunk AAD substitution, authenticated header corruption, UTF-8/multi-chunk padding and capacity bounds.
- Independent actual PostgreSQL + HTTP scope probes: **3 PASS / 2 FAIL**, exit 1. Both failures are the separate wrong-round/wrong-session manifestations of TG-REV-001. The frozen producer retains explicit external source/safety/lifecycle fixtures. Owned project `venus-topic-games-review-19a8c1525ff6`; cleanup completed and a fresh label query found no containers, networks or volumes. The two Node probe containers also auto-removed.
- Author/root 18-case proof: independently verified **19 indexed file hashes**, all **1780 ZIP entries**, before/after file map equality and computed identity; exact 18 unique PASS IDs; terminal runner status and empty owned resources. The image executes the exact captured 12 component sources; the independent probe checks their hashes inside the image. No full 18-case rerun is claimed by the reviewer.
- The root producer assertions support the declared three modes, 100 actual HTTP rounds, bilateral quietness, advice opt-in/replacement/revocation, TD choice/action separation, YB epoch invalidation, targeted selection/exclusion, real runtime prior, clock-floor handling, bounded recipient references, actual WS over an explicit fixture adapter, final credential wait in PostgreSQL, distinct-process boot and source-independent withdrawal/purge. The scope labels accurately leave external provider/lifecycle composition, production WS routing/browser UX and cross-mode semantic-family canary open. TG09 retains real prior records but does not independently prove cross-mode semantic-family avoidance.

The independent SQL runner records the concurrently evolving checkout identity in its generic `source_identity` metadata. That inventory is **not** the executed image identity: the execution target is the frozen `62b9…` archive/image stated above. No live checkout bind or rebuild was used. The only added bind replaces the producer with the retained independent five-case producer; external package/backend runtime files come from the immutable image.

## Static audit conclusions and limits

The reviewed backend uses AAD2 namespaces and sidecar/session markers, does not decode legacy `RoundPlan` as V2, reconstructs candidate text only from pinned bindings, emits complete topic unions before acceptance and omits card/hash/candidate internals from conversation DTOs. Public private-pair projections remain generic. Advice pending views omit recipient text; epoch changes clear chat; prepared projections are bounded and fenced again at final enqueue. Per-recipient stream revisions do not serialize a global event sequence. These observations plus the targeted probes are component evidence, not an exhaustive absence-of-vulnerabilities claim.

Stop/Pause/Abort, actor round refusal, boot revocation, pack withdrawal and purge avoid normal source reads. Root lifecycle guards and the exact-returned-value Symbol fence remain required composition boundaries. SQL mocks cannot establish real transactional durability, filesystem crash safety or restore behavior; the actual scope test establishes only its named PostgreSQL/HTTP assertions. Full lifecycle/source/safety integration, rollback/restore, final app/browser wiring, new semantic canary, clean-source quality/CI and human review450 remain separate requirements.

The first preparatory Python derivation failed on CRLF matching before creating/running a SQL producer; this was corrected by normalizing only the derived probe input. Both successful executions and failing assertions are retained. Original evidence and accepted migration bytes were not rewritten.

Reviewer journal: [p05-topic-games-review](../../../../.history/agents/2026-10-19-p05-topic-games-review.md). Retest round 02 is required after the author's correction and new frozen inputs.
