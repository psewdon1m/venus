# P06 signing round05: corrected CI policy and exact-expiry fixture

Result: PASS for the bounded source review, CONDITIONAL pre-sign readiness until the current head completes its five mandatory CI checks. Full stage remains HOLD for those results and the actual qualified main/tag/image digest/signature/downloaded assets. This review does not authorize P07 or production.

Reviewed clean source supplied as Gitcf2d61958fbe43e02ce746d272862d8e78aa3825, coree87d9b1bf15741cfd87a837711c5c17383d0f12092d9cf7e8416d369dc243a66/1948. Independently hashed all1948 current core files against service-source-freeze05/SOURCE_FILES.json: zero mismatches. Freeze INDEX SHA25684a992927a46903184e45ab77c3606a46e7a300e513b0c33f24da3a09f07f4c3 and both indexed file hashes/lengths checked. No new source finding. No reviewer tests, Docker/runtime/API/Git/source mutations or secret access.

## Corrections and source delta

Against708c796e/coreffbe freeze04, only tests/p04/runtime.integration.test.mjs changed. Against195e/core3a freeze03, the second changed file is the existing tools/ci-policy.test.ts. Against accepted core5a freeze02, the complete ten-path delta additionally consists of ADR033, user-decisions.v6, ADR index, AGENTS, automatic/manual/preview workflows and the qualified-release pre-sign03→04 pointer. No app, operator, database, Dockerfile, compose, release tool, P06 drill fixture or statistical implementation changed. Exact before/after hashes are in SOURCE_REBIND.json.

E08 source correction is accepted: the existing unit now asserts exactly five automatic jobs, the separate manual-only four-section statistics matrix, its120-minute minimum budget, pinned actions, exact PR-head checkouts and retained P04 execution/artifact step. The author unit receipt shows1PASS/201ms (SHA256244f70a67b132d0c584076099a2e2750ad0f3d534f00fcfd2c58c27d2db75d13); it is not a reviewer execution or a replacement for current mandatory quality. Failed round03 remains preserved.

The P04 race correction at lines123–139 is accepted by source review. The separate read-write transaction takes catalog shared lock then the actual rooms row FOR UPDATE before baseline revision and clock jump. The actual publicDelivery still runs in a separate BEGIN READ ONLY transaction; exact-expiry current_round null, projected revision and stored revision assertions remain. Stored revision is checked while the gate is held. Finally restores the shared clock before rollback/release; no HTTP/WS completion is awaited under the lock. This excludes the real V1 socket/maintenance writers, which do not use the proposed advisory-only fence, without product changes, retries, sleeps or weakened assertions. The old encrypted round is read before the gate while the original clock is still active; the measured revision is captured under the gate, and the consent deadline itself is unchanged. Projector reads do not take the held row lock. The retained bounded diagnosis records both CI failures and the causal limitation that logs do not identify a particular background transaction. The author's empty lint receipt plus reported exit0 is a lint preflight, not actual corrected-P04 PASS. Relevant actual P04/current CI is pending.

## Owner policy and release boundary

U021/ADR033 directly authorizes removing the four heavy statistics jobs from automatic/required CI. The unchanged matrix [invariants,fairness,gf,inference] remains workflow_dispatch-only with120-minute budget; no algorithm/sample/threshold was changed. Automatic jobs and required contexts are exactly quality, container-smoke, p02-integration, p03-integration and p06-release-integration. All seven ci-policy-u02101 indexed files match hashes and lengths. Saved GitHub before/after protection shows strict=true and those five contexts; after removing required_status_checks, all remaining protection fields compare equal. Cancelled old measurements remain CANCELLED, never PASS.

The preview workflow is repository-scoped, packages:write plus contents:read, immutable action pins, unsigned version0.0.0 and SHA tag on the owner-authorized bootstrap branch workflow change/manual dispatch. It has no release environment or service signing secret and creates no qualified release assets. The owner-public publication/anonymous pull is separate; the parent reports it completed, but this bounded source review neither independently audits that packet nor uses it to satisfy the seven signed-service checks. Preview publication does not depend on this stage gate.

The qualified release still checks exact main/tag, runs its own quality/P06 gates, requires pre-sign-acceptance04, builds one image, checks exact image install before signing and verifies published assets. Real-key U020 approval/configuration is retained unchanged; no private key or GitHub credential was read. Missing future pre-sign04 metadata is an explicitly planned derived result after reviewer STOP, not an already executed release gate.

## Component proof and all118

Prior accepted reports and source inputs remain immutable. The new review rebinds unchanged runtime components; it does not rename old executions as the new Git. Historical quality03 is92b7/corefe517, local actual10 is911ac/core5a, unit10/docs03 isc9ecc/corea1c. Actual10 retains18checks/9SIGKILL/11counts/17jobs; original timestamp recovery event intervals2545–9198ms are measurements, not an engine stopwatch or SLA. Changed policy/P04 test execution remains the explicit current-head CI condition.

E07 remains CLOSED: independently accepted exactd3f7/core5a GitHub run40134933732/job120994336366 measured socketGID118,18checks and45 native exit0 commands with owned cleanup. The P06 fixture and product pins are byte-identical now. This proves that historical nonzero-GID execution and unchanged-component applicability, not a cf2d6195 CI run. Prior review INDEX hashes/contents were rechecked for signing-round02, github-round01 and p04-race-round01 with zero mismatches.

All118 per-ID records, original source-row hashes and scope restrictions are retained in DECISION.json:67PASS,34specific N_A,7PENDING_FINAL_SIGNED_ARTIFACT_ONLY,10DEFERRED_PRODUCTION_NOT_LOCAL_PASS. BST03 remains PASS for owner-approved trust. Pending IDs are REL03/04/05/06/07/09 and TRUST06. No generic local ACL/data/restore waiver was introduced. U021 changes future CI policy only, not historical P03 acceptance or statistical evidence.

| Mandatory P06 gate | Accepted component evidence | Current conclusion |
| --- | --- | --- |
| RELEASE | Approved trust and gated source pipeline | Source ready; current CI and actual signed publication pending |
| INSTALL | Actual10 and accepted GitHub P06 | Unchanged local component PASS; no new-head run claimed |
| SCOPE | Standalone contracts and all118 applicability | PASS, specific external-only N_A and production deferrals retained |
| BACKUP | Actual10 full backup/restore and count evidence | Unchanged local component PASS |
| UPDATE-ACL | Actual10 and GitHub worker/consumer isolation | Unchanged local component PASS; E07 closed |
| FAULTS | Actual10 nine SIGKILL phases/offline cache load/API502 | Unchanged local component PASS |
| MONOTONIC | Accepted restore/current ledger replay and exact counts | Unchanged local component PASS |
| RECOVERY | Actual10 recovery and raw UTC measurement02 | Unchanged local component PASS, no SLA inferred |

Production DNS/TLS/UDP/mobile/real-device checks remain deferred. Original450 owner HOLD and current470 temporary local-pilot card approval are unchanged. Final signed service acceptance requires a separate actual release handoff. COMPLETE_STOP after these reports and own journal are saved; the orchestrator may then create derived metadata/freeze and run the already planned relevant checks.