# Ordinary real470 probe03: independent HTTP500 diagnosis

Status: **FAIL retained; underlying exception UNKNOWN; safe observability gap CONFIRMED.** This is a source-bound diagnosis, not acceptance of ordinary42 or P05. No Docker, application edits, retry, timer/rate-limit change, or fresh functional run was performed.

## Exact historical scope

The actual run is **A4**, source `fc1bfa0b3dd938ae4f9f0c99fd708032aedcf088b3ef54f14ed55be685a7004e` /1842, normal production image `sha256:1c023d3e8c6c3b8e04fbcdbd98a23c456acfd4967ca26670d37bb84084ee342c`, not current A7. Its ordinary server and real470 owner-provisional provider were used (`source_override:false`, `syntheticFixtureOnly:false`). Exact raw/source inputs are pinned in input-pins.json. Raw report/source are retained at those existing paths, not rewritten.

Two complete online Questions profiles N2 and N3 passed20 rounds each. N4 completed7 more before failure: Q-1126r2, Q-1105r3, Q-1044r1, Q-1026r1, Q-1024r2, Q-1080r2, Q-1082r2. Total47 completed/47 finishes,971 requests,9 WebSocket connections,3 created/closed rooms, client cleanup COMPLETE and no room cleanup failures. N4 already completed5 group and2 pair_public cards; N2/N3 also completed group cards. This is not evidence of a first-group or all-N4 defect.

The preserved failure is GET self-actions HTTP500 at elapsed938168ms. The top-level last_request was subsequently overwritten by successful cleanup close200; error.last_request preserves500. The probe's response-code allowlist omits INTERNAL_ERROR, so code:null does not show an absent server code. Server-generated response request_id, failing request duration, actor/step, and current round8 identity were not retained. No underlying exception, stack, pool/lock observation or app logs were exported before owned DB/app cleanup. The exact failing self-actions position cannot be reconstructed from the seven completed-round entries.

## Bounded source diagnosis

The read enters privateReadGuard (credential/origin and pool-backed rate limit), Rooms.transaction (pool acquisition, BEGIN, shared catalog advisory lock), room advisory/row lock and access, TopicGames.selfActionsContext (game row lock/current-round decrypt and source/history/safety checks), final authorization, then synchronous fenced JSON enqueue. Source references: app.ts46-49; database.ts10; topic-game-routes.ts12,17; rooms.ts79,111; topic-games.ts205,232-234; probe.mjs59,105,123,133; outer.mjs65.

Database configuration is max12, connectionTimeoutMillis2000 and query_timeout5000. A pool wait, query timeout, SQL deadlock or unexpected SQL/data/crypto/JSON/TypeError could reach generic500. None is established by this run: four parallel own reads plus WS/maintenance do not alone prove pool exhaustion; ordinary room/WS paths share room ordering, so no concrete lock inversion was found. No evidence permits attributing938168ms whole-run elapsed to a timer defect. Actual HTTP500 is a server failure response, not a client timeout; an underlying server-side query timeout remains an unproven possibility.

Expected DomainError/EngineError in ordinary context checks reduce permissions; unexpected exceptions propagate. Current-round decrypt/JSON validation can also throw outside that inner catch. Neither source inspection nor already-completed card metadata isolates one of these paths. The eighth selected card, if any, is unknown. Do not substitute a speculative N4/group/card explanation for the missing exception.

## Confirmed P2: P05-ORDINARY-500-TRACE-001

app.ts error handler emits generic INTERNAL_ERROR and a server-generated UUID, while onResponse emits only request_complete, route template, method, status and request_id. It records no safe cause category or static frame. The outer probe exports no application logs before teardown. Consequently an unexpected500 cannot be traced from the preserved failing request to a cause. This is an application observability gap, separate from the unknown underlying defect.

Own native Fastify injection against exact frozen A4: **1 privacy/correlation control PASS; 1 observability regression FAIL (exit1)**. The passing control confirms generic INTERNAL_ERROR, server-generated UUID, correlated request_complete500, and omission of exception/code/cookie/header canaries. The red control requires a distinct correlated safe error category event and fails because none exists. It reproduces the observability gap only, not the historical N4 exception. Initial suite import failed due frozen-source dependency resolution; original output/config are retained, then explicit existing dependency aliases were added only to the reviewer config.

## Minimal correction and qualified reproduction

1. Add a bounded safe unexpected500 event keyed by existing server-generated request_id. Project only a fixed allowlisted error category, exact allowlisted SQLSTATE (unknown/null otherwise), and at most a few known static compiled module/line frames. Do not send original Error objects to logger serializers. Never retain message, raw stack/header/cookie/body/query/SQL/URL, arbitrary name/code, function names, absolute paths, or private fields. Handle hostile getters/malformed values fail-closed. Preserve generic response and existing permissions, transactions, deadlines and rate limits.
2. Extend the existing probe's failure receipt only: validated server UUID request_id, INTERNAL_ERROR allowlist, bounded request duration, fixed phase/round index/actor-position and profile identity. Keep response bodies/credentials transient. Capture bounded sanitized app stdout under exact ownership before teardown; do not dump raw PostgreSQL error messages.
3. Independently test known/unknown names/codes/SQLSTATE/frame canaries and malformed values, then run one explicitly declared N4 online Questions20 forensic profile on precise instrumented source after review/root ACK. The lost seed/state means this is a fresh qualified attempt, not exact replay. No seed search, blind retry or timeout/threshold relaxation. If it fails, retain the correlated safe trace before cleanup and fix the concrete cause before repeating.

A7 Games20/browser may proceed as separate scopes. Their results cannot retrospectively turn this A4 ordinary failure green. The47 completed rounds remain useful partial evidence; N4 and the remaining39 ordinary profiles/negative cases remain unaccepted.
