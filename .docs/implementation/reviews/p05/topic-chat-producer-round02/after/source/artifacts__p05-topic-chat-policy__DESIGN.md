# P05 topic chat policy — actual regression AUTHOR design

Created 2026-10-19T21:37:17.3133160+03:00 by /root/p05_topics_ui_review (AUTHOR of this producer; independent accepter required).

Own only excluded .artifacts/p05-topic-chat-policy and .history/agents/2026-10-19-p05-topic-chat-policy.md. No product, harness, migration, manifest or included edits. Docker NOT_RUN until root accepts this design/checkpoint and freezes included writers.

## Composition and dependencies

Import actual tests/p05-topic-lifecycle/harness.mjs from mounted /app/tests/p05-topic-lifecycle/chat-policy.mjs. Use real PG migrations, Rooms/createApp HTTP routes, actual admission18+, real protected lifecycle registry and preferences. Synthetic card/map remains the only source substitute. Session cookies manually supplied by actual HTTP harness; not browser-cookie or production-CMD proof.

Root is implementing TopicGames.options.privateTextChat (optional default false), harness explicit true, create(2,{context}), privateRound({context,beforeGame}), real encrypted quota sidecar and chat limits. Current first read still has the old interface. Final producer must inspect and pin the completed interface before declaring ready.

## Fixed required controls

1. Online + flag true: real selected private actors, bilateral invitation/topic acceptance; snapshot includes capability, private prompt and chat GET/POST work; own chat permission true.
2. In-person + flag true: real private moment may still exist for verbal use; chat GET/POST denied and self-actions chat false. No private texts leak in rejected error body.
3. In-person + flag false: same chat denial, no implicit enabling by context or old hard-coded snapshot.
4. Online + flag false: actual snapshot capability absent; play through all20 rounds, no private opportunity. No direct SQL seed of actors/consent.
5. Capless online snapshot created while off remains byte-identical/capless after flag enabled; continued planner rounds never gain private opportunities.
6. Online active moment, flag flips off: prompt/chat/send/self-action/replay denied or revoked under authoritative actual policy; original successful request replay cannot retain access or charge quota. Reenable must not resurrect revoked old moment without fresh explicit consent.
7. Actual third member/spectator joins but is outside the selected pair: chat read/write and foreign-scope requests denied. Host status alone gives no private actor permission; use actual selected actors and member IDs.
8. Malformed Unicode lone high/low and embedded surrogate: actual HTTP400 INVALID_TEXT, no quota or receipt consumption. Exact same request retry: identical receipt; stored text count, sequence and encrypted quota consumption unchanged. A changed payload with same request_id conflicts.
9. Fixed calendar minute floor(now/60000),12/min per actor: first12 accepted,13th denied429; peer budget independent; after actual clock advances beyond the window and real credential/presence heartbeat, send allowed. Avoid automatic background ticker/clock expiry confusion.
10. Last32: actual accepted messages with synthetic text and stable round identity; GET shows exactly last32 in increasing sequence, correct sent/received projection. Chat alone must not increment game/room revisions.
11. Round budget128 across epoch: budget survives OtherQuestion/new topic and fresh bilateral consent, without carrying old chat text. Normal sends establish persistence across epoch. Boundary127/128/129 may need an explicitly declared encrypted quota-state fixture because two actors at12/min cannot reach128 naturally inside180s parent consent TTL. This fixture must affect only quota metadata, never actor, consent, lifecycle or auth; it must not be called128 natural successful HTTP sends.
12. Awaited final SQL: choose actual chat delivery or send after child source/capability projection on the same PoolClient; observe pg_stat_activity lock wait, flip flag off while blocked, unlock and assert actual HTTP denial/no text and no successful new send/receipt. Exact target selection required; no global counter attribution. Preserve original query semantics except explicit PG advisory wait.

## Clock, consistency and evidence

Use explicit harness server clock with monotonic forward increments. Refresh real socket grants via Rooms.liveGrant(grant,true) before/after short increments; do not fake presence rows or extend consent expiry. Max elapsed for a single ordinary active consent below180s. Late SQL wait and flagoff happen synchronously while the target final query is held. Assert quotas from actual encrypted stored objects only after successful/denied HTTP operations; SQL snapshots supplement transport, never replace it.

All fixed checks execute exactly once and have safe metadata-only reports. Preserve failed attempts/fixes and exact excluded producer/helper hashes. Root runner builds frozen Docker test image, uses owned unique Compose project/internal PG16, non-root read-only API without socket, bounded CPU/memory; writes before/after source and producer pins and verifies label-owned cleanup. Root alone archives included source and updates manifests. No stage PASS/human450 approval or production claims.

## Readiness

DESIGN_ACK_ROOT_EXCLUDED_IMPLEMENTATION_ONLY. Implementation can proceed excluded-only while root edits product, but runtime NOT_RUN and final pins wait for completed backend/harness interface and a new included-source freeze. Root accepted explicit quota-only encrypted fixture (seed126 then real127/128/129), with no natural128-send claim. Actual runtime still requires root ACK after included freeze.

## Corrective author checkpoint02 (runtime NOT_RUN)

Independent immutable producer round01 found TCP-PRODUCER-R01/R02/R03. Final inventories now capture after owned-resource/secret cleanup and compare exact initial source/files and producer pins; drift forces FAIL/exit1. Fixed report gate requires runtime_cleanup completed. Capless cases require20 distinct IDs, ordered indexes1..20, actual DB count/distinct/min/max20/1/20 and terminal last round at current20. Repeated successful no-op advance is rejected. Author inert corrective probes:13 runner +9 capless PASS, not independent acceptance or actual PG runtime. Initial corrective lint no-unsafe-finally failure and bad runner source preserved; explicit status assignment replaced throw in finally.
