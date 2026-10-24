# Independent P06 Security/Privacy review — round01 source findings

Status: HOLD_SOURCE_FINDINGS_AND_ACTUAL_PROOFS_PENDING. Independent nonauthor review; P06 standalone-local-pilot-v2 only. No source changes, tests, Docker operations or remote actions by this reviewer.

Input: frozen normal clone C:/.projects/venus/.artifacts/p06-clean-source01, HEAD c1e69ff61baed3524ae63f082453f81b33ac2c44, declared core 064e266006cb6a2b732a0498ce70836cdda83d83b7f1d03b0d6ee7eb0b81b596 /1939 files. Initial source reads completed against that clone. Final test/source binding awaits orchestrator handoff.

## Findings

### SEC01 / P2 — Reapply preflight to initial-install recovery

`tools/venus-operator/engine.mjs:38`: install recovery calls ensureImage, initialize and start without preflight. `install():26` persists an install job before running preflight. A rejected initial install remains recoverable. For example, an install rejected for insufficient free disk can immediately be recovered while the same unsafe condition persists; recovery then changes database/container state without the original disk/permissions/port/environment gates. Explicit recovery authorizes an attempt, not bypass of validated safety conditions. Reapply initial-install preflight before recovery mutations and add a bounded regression proving persistent failure leaves initialize/start uncalled, then corrected conditions allow recovery. Original source remains HOLD pending fix and relevant test proof.

### SEC02 / P2 — Correct published manifest version/tag schema patterns

`.docs/contracts/venus-standalone-release.v1.schema.json:12-13` encodes four backslashes before the dot in JSON. Decoded regex has two backslashes and expects a literal backslash plus wildcard. Standard versions and qualified tags accepted by runtime fail this public schema. Encode one regex escape per dot (two backslashes in JSON source). Verify a normal fixture/service manifest against the schema and runtime with a bounded relevant check.

## Review coverage and limits

Read ADR-031, EXIT-P06 eight gates, recovery profile, operator runbook, applicability118 structure, new schemas; release/files/create/fetch/verify/context/gate helpers; engine/driver/HTTP/CLI/provision/UI; ProtectedRuntime/server/Rooms/DeletionLedger/RevocationLedger; standalone compose, executor/operator systemd units and release workflow; related unit/drill/browser source. No additional blocking source finding confirmed in the reviewed scope at this point.

Consumer1000 has no Docker socket or operator credential in fixed compose. Operator1002 authenticates exact credential bytes and exact Host/Origin; worker API is narrow UDS and accepts fixed identities/actions. Executor1001 with daemon socket is trusted daemon-power TCB; rootless/dedicated production daemon remains unproved by Desktop. Signed canonical Ed25519 manifest, distinct service/fixture trust, bounded non-executed archive and installed-template equality are enforced. Backup is quiesced PG custom stream, bounded atomic owner-only host file; restore preserves separate protected ledgers and checks matching source/hash before DB mutation. Durable global witness, topic metadata and boot/reconcile barriers are distinct from database rollback. No automatic restore is performed on normal consumer restart. These are source observations, not execution PASS claims.

Actual local Docker A/B/restore/fault/ledger/UI and full-quality receipts are pending. No pre-sign PASS or signed/published service PASS is granted. Real service key owner approval remains separate; fixture key cannot establish service signing readiness. Production/DNS/TLS/mobile/external-copy remain deferred. Card470 temporary pilot acceptance and450 HOLD are unchanged. P07 has not been reviewed or started here.
