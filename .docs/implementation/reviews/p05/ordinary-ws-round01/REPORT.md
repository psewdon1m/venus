# Ordinary room WebSocket producer — independent round01

**FAIL: OWS-REV-001 (P2 test false-negative).** Exact producer `73590fb8bb0b55e0cf89b2e60383248749ea2f9328c70e45e9dde469f8683980`; runner `68b8686b7a1017ef5a4800c50fdaee757ce7f4c9890b5be08b12a4d571c742f7`. Both are copied into this immutable packet.

## Confirmed gap

OWS05/06 install source outage/feature-off, await content HTTP and three ping/pong operations, then capture frame-index starts. Their later slice assertions discard every frame received during that initial fault-active interval. They nevertheless report `no_new_private_frames:true`.

Independent `window-counterexamples.mjs` extracts each unchanged actual control and supplies explicit doubles that append one synthetic private prompt frame during the initial HTTP call. Both exact controls still return PASS and the no-new-private-frames claim. This proves an assertion gap, not actual Venus product leakage. Raw expected claim/injected frame counts are saved.

Correct the producer to observe the full fault-active interval. A real Rooms.dispatchPrivate wrapper may delegate the original implementation and record callback enqueues under a fault-active marker; it must preserve ordinary route/auth/lifecycle/source behavior and distinguish frames legitimately queued before the fault. Keep ordinary WS observations too. OWS09 exclusion observation also starts late, so inspect that invalidation window. Archive root attempt01 before any excluded producer fix, then repeat actual tests against new exact producer bytes.

## Other review

Ordinary clients use actual HTTP tickets and auth frames on registerRooms WS, three real admitted members, real protected lifecycle/provider and only declared synthetic content/source faults. OWS10 observes a private-ref read and subsequent parent final credential SELECT on the same client, restricted by room/member/credential; pg_stat_activity wait and final terminal result remain to be inspected. Global source counters are correctly unattributed, so they do not establish this specific child fence invocation.

Root handle45076 was still live at report creation (parent reported OWS01–08 PASS); partial/live results are not accepted as a complete gate. No reviewer Docker run or product/producer edits occurred. No production CMD, browser cookie jar/TLS, full restore/rollback or full P05 claim is supported.
