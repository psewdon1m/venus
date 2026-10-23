# Ordinary runtime producer — independent preflight round 01

Result: **CHANGES_REQUESTED**. One P2 finding, RP-001. This review examines the producer before actual execution; no Docker/runtime acceptance is claimed.

Reviewed exact bytes match the author's handoff: runner `99cefbfc303b5d6acb20bf7940c61f6f3906e3fdd040150ce7ede99dc5db77df`; HTTP/SQL/FS probe `12959fd5ca669b9a3b0f7e6cde52432c991d4aeaa7e7cd916988869505fa8e88`; monitor `1dabaff6442ebc8a76aadd2513b9bd57e99c76718f4c1371436d98634da66245`. Ordinary Dockerfile is also captured. [Four input hashes](runtime-producer-round01/pins.json).

## RP-001 — P2 — pre-start monitor samples can satisfy the final startup-observation gate

Location: `tools/p05-runtime.mjs`, `monitorPhase()` and `negative()`.

Before starting the application, `monitorPhase()` already waits for at least three samples in the new phase. After the application exits, `negative()` requires only that the phase report still has at least three attempts and zero connections. It never requires the counter to advance after app start, a live monitor, or an observation at/after the app's recorded finish time.

A monitor that stalls immediately after its three initial pre-start samples can therefore satisfy the final check even though it never observed the application startup interval. The explicit `absolute_no_listen_proof:false` qualification correctly avoids an absolute claim, but the narrower claimed supporting observation interval is still unproven.

Independent reproduction executes the exact captured `negative()` function body with explicit Docker/file/clock doubles. Its monitor report has three attempts, zero connections and `last_observation_at` before Docker `StartedAt`. The function accepts it and returns the successful negative-case detail. The desired stale-report rejection assertion fails: **2 PASS / 1 FAIL**, exit 1. Listener-observed and insufficient-sample controls correctly reject. [Probe](runtime-producer-round01/probe.mjs), [raw output](runtime-producer-round01/probe-raw-01.txt). No real Docker process or monitor was used in this reproduction.

Required correction: retain the pre-start observation/counter; after app exit require a live monitor, additional samples and an observation at or after Docker `FinishedAt` for the same phase. Wait boundedly for those samples instead of accepting an old file. Retain the pre/post counts/timestamps and a gap metric in case detail. Sampling remains supporting evidence with explicitly limited temporal resolution. A fresh probe must reject stale/wedged/stopped monitors, and accept a genuinely advancing monitor; later actual runtime evidence must verify the monitor/container/phase identities.

## Other reviewed properties and limits

- Eight fixed unique IDs are required; failure interrupts and final report cannot become PASS without all expected IDs. Source before/after identity and file maps are compared. A dirty run is explicitly marked preflight.
- The app service uses the ordinary production Dockerfile/image CMD and no producer/source/approval bind. Actual image/container Cmd and image ID are inspected. Probe/monitor commands and their script binds are confined to the separate monitor service. The current approved registries are asserted empty; no positive V2 approval is injected.
- SQL fixture insertion respects the deferred room/host/birth constraint structure. Its description explicitly says restored metadata only, no real V2 admission/full backup restore/external birth authority.
- Manual secure-cookie transport over internal HTTP is explicitly not browser/TLS/cookie-jar proof. The P1 missing-root read probe is explicitly not a V2 authority-read test.
- Secrets are generated into a separate temporary directory; config/inspection retains paths, not values. The monitor's temporary client state containing session/CSRF stays in container tmpfs and is not emitted as an artifact. No secret leakage was identified in reviewed producer output paths; actual raw output still needs inspection after execution.
- Cleanup is restricted to a random unique Compose project with ownership-label checks and post-cleanup resource queries. Secret removal checks the exact temporary parent/prefix. Images are retained for evidence and not represented as deleted.
- `snapshot()` compares counts/classifications, migration records and top-level root metadata. Its `state_unchanged` label must be read within that narrow scope: it is not a hash of every SQL row/descriptor/file. Do not promote it to a full no-mutation or restore-integrity claim. If exact birth/room metadata preservation becomes a required gate, expand the snapshot/proof accordingly.

No other blocking schema, cleanup, secret or unchanged-CMD defect was identified in this static pass. This is not evidence that the producer actually builds/starts/cleans successfully. Root is preparing RP-001 correction; the original capture and failure remain immutable.

Next: independently review the corrected producer bytes, then verify the actual root image/run/archive, unique eight IDs, raw exits/logs, resource cleanup and source binding. Positive V2 serving under real approved content, ordinary WebSocket/browser UX, full restore and human review450 remain separate gates/HOLD.

Journal: [reviewer journal](../../../../.history/agents/2026-10-19-p05-topic-games-review.md).
