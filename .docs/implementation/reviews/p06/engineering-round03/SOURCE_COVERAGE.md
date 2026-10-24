# P06 Engineering/QA round03 — required coverage findings

Decision: **SOURCE_ONLY_HOLD / REQUIRED_COVERAGE_PENDING**. No runtime/test execution by reviewer. No pre-sign or stage PASS. Earlier rounds are immutable.

Exact reviewed clean clone: `C:/.projects/venus/.artifacts/p06-clean-source01`, HEAD `c1823103ef53ab4b926b7cf853a0c9bbd0644af4`, core `bda1f4a825edcda4d5f5c9b35226583be6f7afb8b0167ab19d005d41225ce05c`/1942. Every freeze07 manifest entry independently SHA256-matched (zero differences). Freeze07 INDEX SHA256 `44f78b5ff4899db2676ab7f3d6118c9e1d2ef5c341e62c74930b9e0502ff3d05`.

All118 historical Part12 IDs remain unique and exact source-line/row-hash matched, with unchanged source applicability. Since quality02 corebb7ed1, only five inventory paths differ: `tests/p06/docker-drill.mjs`, `tests/p06/operator.test.mjs`, `tools/p06-integration.mjs`, `tools/venus-operator/driver.mjs`, `tools/venus-operator/engine.mjs`. No app/domain/API TS source delta. Prior full quality must remain attributed to its actual core, with relevant new-delta tests bound separately; no unrelated P05 corpus/UI459 rerun requested.

## Prior fixes and current source

E01/E02 remain fixed. Driver now ensures the exact pinned PostgreSQL image from installed template before DB compose mutation, verifies RepoDigest and fails before DB start on pull failure. Unit source has a bounded regression for cache miss, pull, verify and failure-before-create. Install job now preserves safe failure metadata. Fixture harness transports required context and seeds completed snapshots through waiting/participant/completed in one DB transaction, respecting the actual trigger. No new concrete product bug identified in this source review.

## E03 — exercise operator API502/lost apply response (required coverage)

`tests/p06/operator-browser.mjs:6` currently creates/confirms, reloads/re-authenticates and cancels a job. It does not apply while a response is lost or replaced by502, reconnect to that executing durable job and prove no second mutation. The existing HTTP503 download unit concerns a different endpoint/state transition. PLAN-P06-UPDATE-ACL and Part12 OPS-11 explicitly require transport interruption to remain distinct from durable mutation state.

Minimal closure: extend the existing single-page browser drill with one bounded intercepted/lost operator apply response after the real request reaches the executor, recover observation by status/reload/re-auth of the same job UUID, and demonstrate one mutation/backup plus correct terminal state. No new test framework/stack is needed.

## E04 — force actual offline previous-image archive load (required coverage)

`tools/venus-operator/driver.mjs:41` immediately returns from loadPrevious when A remains in local image cache. `tests/p06/docker-drill.mjs:52-55` never removes that A cache; FakeDriver loadPrevious is only a no-op/fault hook. Existing faults therefore do not establish that the saved tar can restore missing A offline. PLAN-P06-FAULTS requires previous image availability offline.

Minimal closure: reuse one existing post-candidate fault phase. Remove only this owned fixture A container/cache as needed, establish A image is absent, avoid/disable registry pulling, recover with the retained tar, and record actual docker image load plus exact A image/runtime/data health afterward. Do not touch unrelated images/resources.

## E05 — trigger occupied-port preflight refusal (required coverage)

`driver.mjs:32` implements PORT_IN_USE, but no current unit/drill triggers it. PLAN-P06-INSTALL explicitly lists occupied port as a pre-mutation rejection. Existing disk/permissions/pull negatives cannot substitute.

Minimal closure: in the existing disposable drill use an already owned listener (e.g. operator host port) as the candidate app port, attempt B and require REJECTED/PORT_IN_USE with no QUIESCING/MUTATION_STARTED, exact A healthy/data unchanged, then restore trusted fixture config. No additional long-lived fixture or framework required.

## Restore measurement requirement

`docker-drill.mjs:30` computes counts; restore paths at52/54 assert preferences2 and snapshots1 while the report labels zero committed-record loss without retaining/comparing all counts. Preserve/compare restored counts to the measured backup baseline in the existing checkpoints so PLAN-P06-BACKUP/RECOVERY zero-loss conclusion is assessable. The later intentional ledger-driven room purge and explicit post-backup admin marker loss must remain separately accounted, not counted as unexplained backup loss.

## Eight-gate coverage state

| Gate | State in this source review |
| --- | --- |
| RELEASE | Signature/tag/OCI/source protocol and fixture/service distinction present. Real service trust owner approval/signature/publication/anonymous exact-byte smoke pending. |
| INSTALL | PG pin cache-miss source fix and bounded unit present. Actual04 install/ACL/reader partial results observed, whole run FAIL at fixture seed. E05 remains. |
| SCOPE |118 unique source-bound decisions preserved;81 applicable/34 narrow N/A/3 mixed deferred. No generic ACL/data/restore waiver. |
| BACKUP | Full quiesced PG framed backup/restore source present; actual restore evidence pending. Full counts/decryption/integrity measurements must support zero loss. |
| UPDATE-ACL | Narrow identity/API and reload/reauth source coverage present; E03 remains. |
| FAULTS | Existing durable phase/migration/health/pull/permissions scenarios present, actual05 pending. E04 remains. |
| MONOTONIC | Protected authority/startup barriers and old-backup/new-ledger scenario present; actual completion pending. |
| RECOVERY | Pre-fixed recovery profile retained; actual measured duration/backup age/write boundary/loss and cleanup receipt pending. |

Observed actual04 DRILL explicitly FAIL after install/ACL/reader component PASS; never reinterpret it as full stage PASS. Root reports actual05 running; final exact actual evidence handoff is not yet supplied. Quality02 raw report records clean corebb7ed1, actual exit0 and completed cleanup; it is not evidence of new driver/harness runtime success. Unit07/lint07/08 reported by root remain component receipts to bind at final handoff.

Production DNS/TLS/UDP/mobile and daemon isolation, external backup-copy and production RPO/RTO SLA remain outside local claims. P07 excluded.450 HOLD/current470 temporary local pilot acceptance preserved, no new human card approval.
