# P06 independent Engineering/QA — round01

Decision: **CHANGES_REQUIRED — NOT A PRE-SIGN PASS**. This is a source/applicability review of the first frozen candidate; actual author-run service/drill evidence has not yet been handed off. No test was executed by this reviewer, and no final signed/published service result is asserted.

## Exact inputs and independence

- Reviewed frozen normal clone: `C:/.projects/venus/.artifacts/p06-clean-source01`, HEAD `c1e69ff61baed3524ae63f082453f81b33ac2c44`; observed empty `git status --porcelain`.
- Core identity: `064e266006cb6a2b732a0498ce70836cdda83d83b7f1d03b0d6ee7eb0b81b596`, 1939 files. Independently SHA256-checked every entry of freeze02 SOURCE_FILES: zero missing/hash mismatches.
- P05 final-stage entry INDEX actual SHA256: `58b680ef116bc2d1f652ea4c3862c1a00b23333100cc65d7bae88bfc7d4f1b81`.
- Historical Part12 catalogue actual SHA256: `7f356b724df80444c5cd00c15bd808046f4f5667afa2cabf87cf1acd196c86a9`. All118 unique IDs, source lines and source-row SHA256s match independently. First regex attempt missed bold Markdown ID markers and falsely flagged every line; corrected content/hash audit passed, retained in reviewer journal.
- Reviewer did not author implementation and wrote only own journal and this new review packet. No Docker, test suite, remote, registry, manifest, code or other-agent-journal mutations.

## Findings requiring correction

### P06-E01 — Bind candidate health to signed runtime identity (P1)

Location: `tools/venus-operator/engine.mjs:31`; related terminal recovery branch `:38`; verifier `tools/venus-operator/driver.mjs:46`.

Trigger: an image has the signed config digest, expected OCI labels and functioning readiness, but its version endpoint reports stale/wrong runtime service/version/source/image identity. The ordinary update path calls `healthy()` without the signed candidate manifest. DockerDriver deliberately validates those identity fields only when `expected` is supplied, so the path commits `current.json` and opens serving without detecting the disagreement. Finished-job recovery also calls unbound health before reopening serving.

Impact: signed byte identity is not the same as verified runtime release identity. This violates PLAN-P06-RELEASE/INSTALL and applicable REL-04. Initial install and rollback already demonstrate the intended bound call.

Minimal correction: pass `release.manifest` for candidate health, and the authoritative committed/recovered manifest for terminal recover. Add a bounded mismatch regression that proves no commit/open for wrong runtime identity and compatible A recovery. Re-review exact changed bytes after relevant checks; no unrelated P05 million-corpus/UI459 rerun is requested.

### P06-E02 — Clean owned interrupted backup temporaries (P2)

Location: `tools/venus-operator/driver.mjs:47,51-58`; pre-backup interrupted recovery path `tools/venus-operator/engine.mjs:38`.

Trigger: SIGKILL or executor loss during pg_dump streaming or VENUSBK1 framing, before BACKUP_DURABLE. `finally` cannot run; `<job>.dump.tmp` and/or `<job>.vbackup.tmp` remain. `expireBackups` only scans UUID `.vbackup` files, and explicit recovery without a recorded backup simply starts A. Every subsequent attempt creates a new UUID, so these old DB-containing temporary files have no eventual cleanup path.

Impact: repeated interrupted jobs accumulate staging disk use and stale database material indefinitely; this defeats applicable DATA-03 and the bounded staging/resource expectation. Incomplete files are correctly never declared successful, but that does not satisfy cleanup.

Minimal correction: remove only exact owned interrupted temporary names while an exclusive executor lock establishes that no active backup writer exists (safe recovery/startup cleanup or equivalent bounded mechanism). Preserve completed `.vbackup` files and unrecognized paths. Add a bounded interrupted-temp regression, including safe file type handling and lock protection; no expanded framework or unrelated P05 rerun is requested.

## Eight exit gates

| Gate | Round01 decision | Reason |
| --- | --- | --- |
| PLAN-P06-RELEASE | HOLD | E01; permanent trust owner approval and actual signed/published service remain pending. Fixture keys never count as service readiness. |
| PLAN-P06-INSTALL | HOLD | Source has fixed compose, UID separation and verified import, but actual clean install/reader/negative evidence pending; E01 affects update runtime identity. |
| PLAN-P06-SCOPE | SOURCE_TRACEABILITY_PASS_EVIDENCE_PENDING | All118 rows preserved, source-bound and narrowly scoped. Per-ID execution decisions remain in separate file; no generic data/ACL/restore waiver. |
| PLAN-P06-BACKUP | HOLD | Streaming/framed/durable backup and restore path present; E02; actual clean-DB decrypted synthetic restore/count/foreign-key evidence pending. |
| PLAN-P06-UPDATE-ACL | HOLD | Narrow API and Origin/Host/separate credential boundaries present; actual UID/reader/browser/idempotency evidence pending. |
| PLAN-P06-FAULTS | HOLD | Journal/offline image/explicit recovery present; E01/E02; actual durable-phase interruption and failed recovery evidence pending. |
| PLAN-P06-MONOTONIC | HOLD | Separate protected floor/ledgers, startup reconcile and no ledger-prune profile present; actual old-backup/new-ledger and negatives pending. |
| PLAN-P06-RECOVERY | HOLD | Recovery profile fixed before test; measured age/duration/write boundary and zero backup-committed loss evidence pending. |

The reviewed applicability contains81 applicable rows,34 external-only N/A rows and3 mixed/deferred rows. N/A conclusions cover only the named absent external component. Local equivalents (operator key rotation, private namespaces, bounded writes, backups, ACL, restore and authoritative ledgers) stay applicable under the plan and listed checks.

## Evidence limits and handoff

Author-reported unit04 22PASS0FAIL, lint02/types01/docs01 are acknowledged as pending evidence inputs, not accepted source-bound stage results here. Full Docker quality, A/B/fault/restore/ledger/operator browser results were still running or pending at assignment and have not been bound by this round. Actual results must be evaluated against the corrected source revision, not retroactively applied to these failed bytes.

Do not sign/publish on this report. Preserve this round, correct E01/E02, run only relevant checks plus required P06 exit evidence, and request independent re-review of the next frozen candidate. Final signed/published-service PASS requires real permanent-key approval, exact service image and manifest bytes, remote main/tag consistency, anonymously fetched assets and final service smoke. Local Docker cannot imply production DNS/TLS/UDP/device acceptance, daemon isolation, RPO/RTO SLA or external backup-copy success. P07 is excluded. Original450 HOLD and current470 temporary pilot acceptance remain unchanged; no new human card approval is granted.
