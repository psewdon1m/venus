# P09 independent security repeat — round04

**SOURCE_CLOSED_RUNTIME_HOLD.** Review source is `e08413125cfb29abc2396e3e2a13d874b30903f8`. This sealed source-only record distinguishes source closure from actual acceptance. It grants no security runtime or stage PASS.

S09-04's remaining SQL predicate is fixed at `apps/api/src/media.ts:96`: member/lease-scoped retirement updates current Cinema only when its upstream room belongs to the selected publisher scopes. Deliberately room-wide retirement retains the broad branch. Exact lease selection, same-upstream expansion and this state predicate now preserve newer scope ownership together.

The existing `P09-OLD-RELEASE-KEEPS-NEW-SCOPE` case injects admin+quiesce failure for the retired old publisher, asserts release503, clears failures, retries the same old lease successfully, then checks the current Cinema remains live and the actual viewer continues. It tests the accepted residual sequence, rather than only an ordinary successful delayed release. No separate test framework was added or requested by this reviewer.

Earlier S09-01/02/03 source fixes remain: pending cutoff survives API/unknown-boot retirement until an actual cutoff receipt; expired protected leases perform backend retirement; an unconfirmed old scope blocks a new grant; v3 authenticated open readiness is read-only and closed preparation does not bypass consumer authority. Their exact relevant test sources remain in the current suite. No new concrete security defect was found in the requested remaining finding cycle.

Compared with reviewed5abab, other product delta raises the requested/published frame cadence from15 to30 while retaining explicit user capture, the same maximum30, source types, bitrate bound and generation-owned teardown. Later e084 changes concern fixture calibration/clocks/resources and documentation, not a new consent/grant mechanism. This is source assessment, not AV/resource acceptance.

The actual run may continue lifecycle checks after an AV FAIL, but final `records.every(status==='PASS')` remains required before suite PASS. Continuing diagnostics therefore cannot silently waive the AV criterion. The active exact C run `.artifacts/p05/venus-p05-2864154c0378` is not yet treated as completed proof. No reviewer runtime/tests/Docker/network/API calls were made.

Final P09 acceptance, public network/NAT/TURN/DNS/TLS, physical devices, professional rights, signed v3 publication and final P07 are not granted by this source closure. Immutable signed0.0.1 has no P09 feature claim. Historical failed rounds remain unchanged.

Parent subsequently reports exact e084 round21 completed FAIL: normal AV p95=69ms, glass=78ms, skew=50ms and2100 samples; partial readiness/autoplay/Games/admission/degraded/revoke cases passed. TCP setup could not find the publisher stop control. Parent diagnosed fixture root qdisc shaping both media and private authority/control and is correcting only its media-port filtering. These are handoff statements, not an independently hashed final packet. The original FAIL must remain. The old-release failure/retry, remaining retirement/restart/watchdog/restore cases occur after TCP and are not inferred executed. This source closure does not convert partial actual success into final acceptance.

A new exact fixture revision and completed immutable runtime packet are required for actual rebind/final review; this source-only round must not be overwritten. All reviewer writes stop after final INDEX. COMPLETE_STOP.
