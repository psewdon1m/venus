# PLAN-PRESENTATIONS independent engineering exit — round01

Decision: **FAIL**, with three bounded mandatory findings. This is a functional local-Docker exit review of source `31b4a57c5cfc6d78d311df9a892e49cb84a8efc8`, core `bd08b803cc55090fd346a2ece5b38eadb94eb93f505e2e078eed5068c9f43b1a`. The reviewer did not implement the feature, run a build or modify application files.

## What the evidence proves

Native round04 is clean-source and unchanged-source evidence: 46/46 Node tests, including 12 unique actual presentation cases, native exit0 and completed cleanup. The 34 other cases include release/operator logic and BK1/BK2 framing checks; they must not be described as 46 browser scenarios. Chromium156 actually uploads and decodes rendered PNG, exercises local/live page transitions, late join/reconnect, RU/EN/TR at320/768/1024, bounded objectURL/inflight caches, and real game coexistence. No full browser matrix, aggregate P07, devices or production is proved.

Real PostgreSQL near-capacity admission was exercised: four rooms, encrypted assets66,325,926B, before-replacement old assets counted, quota denial409, actual BK2 producer/reader75,937,032B dump and matching restored ciphertext/PNG hashes. The fixture's fixed Docker adapter verifies API process absent and converter stopped. Protected files are outside PG restore; old replaced/deleted generations remain omitted/denied while unaffected room cookie and PNG survive. Feature-off/re-enable preserves library and never resumes live.

The converter was actually isolated by Docker private PID namespace/no init/network-none/read-only root/.5CPU/512MiB/32pids and only SETUID/GID/KILL. The untrusted65534 probe has no capabilities, cannot signal guardian, cannot see keys/socket, creates a double-fork/setsid orphan and chmod000/FIFO/symlink junk. Actual post-job evidence has no untrusted PIDs and only health.json, scratch empty; subsequent small PDF succeeds. Limits in source and effective container configuration support bounded operation, without claiming all possible hostile inputs are exhaustively proved.

Production build01 genuinely builds an unsigned local image `sha256:7b09df3915153ddbc1874f681b7ff83b39b892196c0b55177d27a725ec1ef383`, verifies actual pinned Python/Poppler and copyright files. This does not prove signed release/public licensing or zero advisories. Prior FAIL rounds01–03 are retained and are not erased by round04.

## Findings requiring correction / focused proof

### PREZA-ENG-01 — absolute source-capture deadline is absent (P1, application)

`apps/api/src/presentation-routes.ts:21` claims the single global raw upload slot then invokes `request.raw.setTimeout(60000)`. This is an inactivity timeout. A current authenticated host can send a declared PDF body in small chunks less than60s apart, keeping the parser and `rawClaim` occupied beyond the promised absolute60s capture bound and preventing all other room imports. `jobFence` eventually refuses publication after job expiry but does not abort the in-progress body; Node's broader request timeout is not the contract's60s deadline. No explicit Fastify requestTimeout60s is configured.

Acceptance: arm an absolute per-request deadline at admission (at most the remaining source lease), destroy the raw request and release the claim on expiry, and clear its timer on success/error/abort. Add one finite trickled-body check showing activity cannot extend the deadline, then a new room can import. A short test-only bounded timing seam is acceptable if actual production60s configuration is checked; no general framework or long statistics are needed.

### PREZA-ENG-02 — new production operator stop/restart path is not proved (P1, mandatory proof)

`tests/presentations/backup-capacity.mjs:18` intentionally uses a fixed adapter and direct PG restore. It does not execute `DockerDriver.stop`, authenticated `/internal/v1/presentations/quiesce`, exact owned-volume validation and two-UID purge, profile4 `start`, or compatible rollback. The new implementation in `tools/venus-operator/driver.mjs:85–91` has materially different behavior from the accepted media-v3 path. Feature-off API fixture restart alone cannot stand in for that required contract.

Acceptance: one bounded actual local-Docker profile4 smoke exercising real driver stop while a job/source is active or pending; prove serving closed, authenticated quiesce, all app/media/converter writers stopped, owned volatile spool empty and protected hashes/bindings preserved. Use actual compatible gen4 start with presentations disabled and then enabled; prove healthy Rooms and existing library hashes, no live auto-resume. Keep an incompatible gen3 downgrade rejected. Exercise the real driver methods, not overrides of the methods under review. Reuse the current image, DB and operator seams; no full P06/P07 rerun is requested.

### PREZA-ENG-03 — durable publication boundary recovery is unexercised (P1, mandatory proof)

`apps/api/src/presentations.ts:49–59` introduces a complete encrypted-stage transaction, protected binding advance as commit point, final PG pointer transaction and `reconcileCommitted`/boot rollforward. Current native cases prove a parser failure before publication and an old DB snapshot missing a newer stage, but do not fail after protected advance and before the final pointer commit. Those are distinct failure windows required by ENTRY02-S3 and the contract.

Acceptance: inject a finite actual PostgreSQL pointer-write/commit failure after a complete staged version is protected, retain the complete stage, restart/reconcile and verify only that exact protected new version becomes readable with matching PNG hash, old URL denied, live stopped. Also retain the already passing missing-stage old-restore denial. A targeted DB trigger/fault is enough; no new product API or generalized fault framework is needed.

## Traceability and limits

PREZA-E01 / ENTRY02-S4: near-capacity BK2 data/framing/restore is positive; production writer-quiescence compatibility awaits ENG-02. PREZA-E02 / ENTRY02-S1/S2/S6: actual renderer isolation, hostile-descendant cleanup and resource configuration positive; ENG-01 closes the separately bounded HTTP source capture. PREZA-E03 / ENTRY02-S3: old-restore floors positive, protected publication recovery awaits ENG-03. PREZA-E04 / ENTRY02-S5: current18/host/member/room/Origin/CSRF, raw enqueue fences, live wrong-page409, stale/version/idempotency and cancellation/close checks positive; Games4s affected source/static evidence remains an orchestrator closure input.

Historical ADR/contract headers still say implementation pending and are not current acceptance status. A new acceptance/status overlay should point to final immutable proof rather than rewriting entry snapshots. The final static packet was announced but not imported when this round was sealed; this review does not claim to have verified a future packet. Known public advisory/toolchain/distribution, nativeP10/device and aggregateP07 holds remain separate and do not add work to these three remedies.
