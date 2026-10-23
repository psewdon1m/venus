# Independent diagnosis: actual Chromium METHOD18

Status: **DIAGNOSIS_COMPLETE_ACTUAL_FAIL_PRESERVED**. This is neither a browser gate PASS nor stage acceptance. No Docker/browser run or product edit was made by this reviewer.

The frozen actual INDEX `2b68eb2ca9649e6d334817960f10387e4770a87424d6778c1883fa7b3e95e472` is intact: all52 child size/hash entries and43 archived/original raw byte pairs match. The1819-entry before/after source maps are identical to source `b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4`; all10 producer pins match. Image is `sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5`, Chromium156.0.8078.4, cleanup receipt PASS. Existing image/source and cleanup proofs are inspected, not newly executed. Full stage, production, real devices and clean-source qualification remain absent.

## What actually failed

Cases01–07 passed;08 failed `OBSERVER_READY_DEADLINE`;09–16 did not run. Both Questions and TruthDare private encounters were selected in the first ordinary session, round16. The previous missing-encounter setup problem was not the failure in this attempt.

The failing phase is `acceptActionsUi` in case08. Its12s preparation290222.8–302223.6 native ms ended with `BATCH_INCOMPLETE`: own/self-actions200 exists; target, conversation and chat are absent; no pending body observer or overflow remains. The exact failed model snapshot is in `timeline.json`. No action-accept POST was sent. All84 earlier mutation dispatches have exact200 receipts. No consent check, action click or receipt was bypassed.

This is not established to be a false readiness oracle. At failure the actual fixture is session TruthDare, round16, game revision40, **game paused / round stopped**. All three rendered game snapshots agree; the UI truthfully has no action-accept control. The three live socket markers indicate open current browser sockets, not uninterrupted connectivity or authoritative DB presence. The packet has no server pause_reason, heartbeat transition, socket generation/close history or first failing server fence.

## Measured sequence and clock qualification

Native observer times and fixture server times have different origins; do not calculate expiry by simply adding30s to native255s. Fixture time is driven by its existing native elapsed clock and is not browser wall time. The selected safe records below use server_time where deadlines matter:

| Evidence | Time / value |
|---|---|
| Dare choice mutation | native255042ms; exact receipt200 |
| First / second topic accepts | native270733 /277637ms; exact receipts200 |
| Complete post-accept prompt batches | RU281765ms, lease1619ms; EN284248ms, lease1477ms |
| RU pending action deadline | server `1970-01-01T00:21:29.870Z` |
| RU latest successful own read before failure | native287685ms; server `00:21:26.632Z` |
| RU conversation read | native288937ms; server `00:21:27.952Z` |
| RU chat read | native290137–291819ms; **409 CONSENT_EXPIRED** |
| Latest observed pongs | TR284285ms; EN286649ms; RU286761ms |
| First observed game revision40 | EN292676ms, then TR292950ms |

Thus expiry of an already-created action is directly evidenced near the action preparation. A simple45s heartbeat timeout is not supported by the latest pongs, which are within8.4s of the first paused game snapshot. A pong is received only after `rooms.liveGrant(grant,true)` resolves, though a subsequent disconnect/reconnect or another failed authority fence remains possible. The retained WS rows are rolling diagnostics, not exhaustive transport/server causality.

## Product findings and minimum corrections

**P05-PRIVATE-ACTION-TTL-001 (P2): private action pending consent starts before the prompt can be seen.** The exact b244 `topic-games.ts:148` creates action consent when TruthDare choice is made; `response` calls it before bilateral topic agreement. Its30s pending timer can expire while topic negotiation and disclosure are still in progress. Meanwhile action acceptance requires an active bilateral topic. This is a concrete sequencing gap; actual18's pending action expiry is consistent with it. The minimum correction is to create a fresh private action only when the active topic is first permitted/disclosed, keep public behavior and the180s invitation parent unchanged, and never extend existing consent deadlines. Root is authoring that correction separately; this diagnosis does not accept its future implementation.

**P05-WS-POLL-STARVATION-001 (P2): unbounded scheduled WS polling can starve heartbeat processing.** Exact b244 `room-routes.ts:193–195` appends every1s poll onto the same promise chain that processes pings, without bounding queued polls. Independent `ws-queue-counterexample.mjs` executes the exact extracted handler with a synthetic bounded scheduler:20 scheduled polls and2s injected poll cost delay a ping received at20s until60s; socket remains OPEN, heartbeat age60s exceeds45s. A VM-only counterfactual allowing at most one scheduled/in-flight poll processes it at22s (one poll). No TTL, clock or authority fence changes were involved. Minimal correction: per-socket pending latch, skip new tick while queued/in-flight, clear in finally; retain the same serialized chain, final credential/room/content fences, close behavior and1s schedule. This proves a source defect, **not actual18 poll latency or its sole cause**.

One further source-consistent path deserves a focused existing test if actual pause persists: `TopicGames.privateDelivery` can throw a consent-expiry fence while constructing a prepared private event, before `Rooms.dispatchPrivate` reaches its final event-fence handling; the WS ticker catches rejection and closes4401, `disconnect` marks reconnecting, and `memberStateChanged` pauses/stops. The current unavailable-content allowlist contains only503 source availability errors, not consent expiry. The archive does not identify this particular throw/close, so it is a hypothesis rather than another independently reproduced defect. Do not broadly swallow authorization, SQL, ciphertext, source or unexpected errors, or weaken final disclosure fences to mask it.

## What is required next

Independently review the two narrow product fixes with their existing RED/green regressions. Keep the actual18 FAIL unchanged. Then one new bound image and one actual Chromium16 attempt can test the corrected application after root ACK. Cases08–16 remain mandatory and unproven here. If a fresh run still pauses, inspect the actual expiry/transport failure path rather than weakening readiness, action consent, TTL or UI assertions. The synthetic online fixture does not load r4 card text and does not prove in_person UI, full browser matrix, V2 statistical gates or human card approval.

Exact copied source files, full safe timeline, audit outputs and the bounded counterexample are in this packet. Initial reviewer failures (live source no longer matched b244, CRLF handler delimiter, markdown archive suffix, and one read using the Windows default codec) are recorded in COMMANDS/journal; they are review-fixture/read issues, not product test outcomes.
