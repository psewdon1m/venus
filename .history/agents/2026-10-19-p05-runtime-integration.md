# P05 ordinary production runtime integration producer

## 2026-10-19T20:50:47.2813788+03:00 — author start
- Role changed: author of runtime integration tests, not independent gate of these tests. AGENTS.md reread. Allowed included files tests/p05-runtime/** and tools/p05-runtime.mjs; own excluded preparation/evidence/journal. No server/topic-runtime/infra edits and no Docker execution before root freeze authorization.
- Inspected current apps/api/src/server.ts, topic-runtime.ts, infra/venus/Dockerfile and tools/local-pilot-smoke.mjs. Current bundled profile absent implies no positive V2 runtime acceptance. Preparing DESIGN for root approval before included writes.
- Intended actual production image/default server CMD, PostgreSQL, explicit local-pilot mock18+, migration/root/protocol/fail-closed checks. No fixture approval or arbitrary source injection.

## 2026-10-19T20:52:21.5107238+03:00 — DESIGN checkpoint
- DESIGN saved runtime-preparation-01/DESIGN.md SHA256 dd1ba930f405838263064c256604a1866468df91aed24a1c417bfa0cad6e8f60; root notified for ACK. No included writes and no Docker run.
- Refined monitor approach: monitor service starts first and retains internal network namespace; production app network_mode service:monitor keeps unchanged server CMD. TCP sampling supplements static guarded startup order and nonzero container exit, never an absolute temporal proof by itself.
- Read compose/database/entry-profile/room routes and source inventory. Production local-pilot requires HTTPS localhost origin; internal HTTP probe with explicit matching Origin/manual cookies must not claim browser/TLS proof. Source profile currently absent; only negative V2 startup is in scope.
- Read attempt for guessed 003_prior_history.sql failed because filename not present; use rg --files actual path next. This did not run tests or mutate product files.


## 2026-10-19T20:57:10.0459948+03:00 — WRITES_FINISHED, runtime NOT_RUN
- Root approved DESIGN and unchanged app CMD/shared monitor namespace. Implemented only tests/p05-runtime/probe.mjs, monitor.mjs and tools/p05-runtime.mjs; no server/topic-runtime/infra/approval edits.
- 8 fixed controls: fresh production-image roots owner1000/group1000/mode0700; ordinary default absent-flag readiness and actual migration1–3 checksum/8-table proof; mock offer explicit18+/P1, immutable protocol and unavailable V2; P1 read-no-root-repair under explicit test-only faults; invalid flag fail closed; true+empty approved sources fail closed; explicit SQL restored-V2 metadata fixture; false+existingV2 fail closed. No positive V2/real restore/browser claims.
- App uses image default CMD, no test mounts/ports/socket, non-root readonly/capdrop1CPU768MiB. Observer starts first and records nominal poll pause/connection timeout, readiness ack, sampled connections; source ordering and generic startup log/nonzero exit are separate evidence. No swallowed runtime/test failure intended. Unique project resource ownership/cleanup and exact included inventory/test pins captured by future run.
- Four independent static commands (three node --check + scoped ESLint) terminal exit0. HANDOFF.json contains exact owned-file SHA256 and static results. Docker/runtime NOT_RUN: root must freeze writers and authorize launch. Runtime PASS and clean/stage acceptance not claimed. Independent reviewer required after actual run.

