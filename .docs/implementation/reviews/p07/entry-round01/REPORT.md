# P07 independent entry review — round01

Result: **PASS_ENTRY_FOR_IMPLEMENTATION**, not P07 PASS and not permission to begin checks before the initial implementation freeze.

Reviewed 2026-10-25T14:30:00Z, nonauthor `/root/p07_entry_audit01`, source `f8c77b755d716a114c29db6f3900f4709ad5ad61`. Read-only inspection only; no test/build/lint/install/container command executed. File hashes in INPUTS.json bind this review; later implementation requires new frozen inputs.

## Entry basis

P05 and P06 accepted packets exist, with P06 explicitly qualified Linux classic only. Local functional acceptances for P08 Music, P09 Cinema, P11 Calls and presentations include independent reviews; presentation acceptance has zero remaining blocking findings in its component scope. These historical component proofs permit aggregate implementation; they do not establish combined P07 performance or acceptance of a changed toolchain/image. Old Docker Desktop pulled-image export FAIL must remain visible.

The latest direct owner instruction permits P07, defers real music to a later owner catalogue, defers physical-device/external-network testing until deployment, and replaces native-app P10 with responsive mobile web. Root must record a new decision/ADR and compatibility overlay: current P07 preparation, P10 documentation and historical acceptance still describe native capture and HOLD. Preserve their historical bytes; append or version active contracts explicitly. No native app, Mac or distribution credential is an input to the revised mobile-web stage.

## Existing reusable mechanisms

- `tools/p05-browser.mjs`: clean-source inventory and before/after checks, isolated Compose namespace, browser dependency caching, browser/PG fixtures, narrow parent-owned fault controls, cleanup receipts. P05 scenarios cover 8 slots, ninth rejection, explicit 18+, locales, modes, consent, private ACL, reconnect/restart and completed games.
- `tests/p05/server.mjs`: optional Music, Media and Presentations already construct real application services. Reuse construction rather than duplicate product logic. `tests/p05/runtime.mjs` currently classifies media and presentations by mutually different server names; joint mode needs explicit controlled wiring.
- `tests/p09/integration.mjs` and `tests/p11/integration.mjs`: actual 8-browser RTP/AV and cgroup/SFU metric measurement, real Postgres restore, token revocation, fixed parent-owned network controls. Their short quality thresholds remain valid component evidence, not 60-minute combined proof.
- `tests/presentations/profile4-smoke.mjs` / `tools/presentation-profile-smoke.mjs`: actual production-image DockerDriver, authenticated quiescence, BK2, compatible A/B recovery, protected floors and safe disabled restart. Reuse the restore lifecycle; avoid rebuilding a generalized fault framework.
- Existing operator preflight `statfs`/free-space check, app live/DB readiness and structured safe logs, immutable/protected authority files, production standalone Compose profiles, actual image identity and export readers.
- `tools/local-pilot-smoke.mjs` is deliberately mock-entry-only, not aggregate P05/P07. It proves a real production-image basic admission/restart, not full game/media soak.

## Mandatory implementation/proof gaps before exit

| ID | Finding / bounded action |
|---|---|
| P07-ENTRY-01 | No joint aggregate executor exists. The existing browser wrapper accepts exactly one mode and includes media Compose only for Cinema/Calls, separate renderer Compose for presentations. Sequential component PASS cannot be labelled simultaneous Music+Cinema+Calls+Presentations+Games proof. Add one bounded mode/runner using these fixtures, fixed parent controls and the union of the owned Compose services. |
| P07-ENTRY-02 | No actual 60-minute, 8-concurrent-client, at least 10-completed-game report exists. Implement one real-monotonic-time soak, no fast-forward clock, counter from actual completed server sessions, periodic authenticated browser activity and measured resource samples. Retain error records and safe cleanup. A 10-session batch followed by idle is insufficient combined functional observation. |
| P07-ENTRY-03 | Saturation evidence needs explicit bounds. Rooms enforce 8 occupied slots and rate limiting; Games enforces one active/paused game per room. No global open-room/session cap was found in Rooms.create/Games.prepare. Define which local admission cap is being qualified; if a global cap is claimed, implement and exercise it atomically. Do not conflate ninth participant with global room/session exhaustion. |
| P07-ENTRY-04 | No bounded host-local disk canary and local alert scenario was found. Existing operator preflight checks space; app readiness probes DB. Add the smallest appropriate durable writable/fsync disk canary and local monitor/alert output, with a narrowly injected actual failure, no real disk fill or new monitoring stack. DB outage must be a real owned DB failure, then readiness503 and recovery; an HTTP edge502 fixture alone is not DB failure proof. |
| P07-ENTRY-05 | Restore must be reproduced independently on the final candidate. Use actual host backup into a separate clean environment, keys restored via separate path, newer protected ledgers retained, no pre-serving resurrected consent/deletions, compatible previous-image recovery and first-install safe stop. Earlier component BK2 proof is reusable context, not a substitute for final independent reproduction. |
| P07-ENTRY-06 | Newly authorized technical completion (Node/security/dependency/licence/signed media-presentation release) is outstanding product/release work. Fix/version it before final freeze, then affected checks and updated image inventory. Do not waive findings as owner blockers, silently amend released 0.0.1 or use unsigned fixture signatures as real release acceptance. |

## Finite proposed execution plan

1. Root records revised owner scope, implements mobile-web fixes, outstanding technical fixes and the narrow P07 executor/monitor changes. Finish all initial code before any checks. Freeze one clean source, lock/toolchain, exact image digest/config digest, profiles/modules, catalogue/pack/policy and resource budgets.
2. REPRO/E2E short admission/negative/feature interactions on the same candidate. Use three locales and three game modes, private-channel outsider denials, 18+ default/refusal, eight clients/ninth rejection, live presentation page fencing and actual synthetic media playback. Mobile browser emulation is responsive-web evidence, not physical-device certification.
3. One 60-minute joint soak, 8 continuously present client contexts, at least 10 genuinely completed sessions spanning three modes, bounded churn/reconnect. Exercise Music, Cinema/Calls and live slides during the interval, including meaningful concurrent intervals and safe mic/screen lifecycle. Record real wall and monotonic start/end, completed session IDs/states/counts, current module configuration and client count over time.
4. Collect fixed-interval (e.g. 5 seconds) CPU/RAM/network bytes, DB/storage size/free bytes, health samples and local alert transitions. Predeclare host-specific ceilings and tolerances before running. Preserve existing component quality thresholds; choose aggregate host thresholds from fixed Compose budgets rather than inventing production SLA. Maximum one 60-minute baseline run per unchanged successful candidate; repeat only after relevant failure/change.
5. Separate bounded saturation, actual DB-stop/restart, disk-canary failure/recovery and owned container recreate scenarios. Preserve healthy data and safe exits; no host-wide disk fill, prune or unrelated workload changes.
6. Actual clean-environment restore/recovery and independent runbook reproduction on exact final inputs. Then nonauthor engineering/security reports, mandatory findings fix→affected retest→repeat review. Stop all writers before final source binding and manifest.

No P03 statistical G/F suites, external DNS/TLS, physical devices or friends-as-fake-participants are part of this automated local claim. Public delivery requires its separately authorized technical release checks; real external conditions remain after deployment per owner.

## Exit decision

Implementation may proceed with the mandatory items above. Aggregate P07 is **NOT_RUN**. No test was run by this reviewer; no application defect beyond the identified missing capabilities is claimed as empirically reproduced. All required work is engineering work under existing authorization, not a request for more owner approval.
