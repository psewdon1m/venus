# Standalone transition · Independent review round 01

Reviewer: `/root/standalone_gate_review`. Time UTC: 2026-10-19T12:37:31.667744+00:00. Outcome: **CHANGES_REQUESTED**. Scope: source supersession, owner-scope fidelity and mock local admission/fixture integration tooling. Working candidate on base `c5dac890fc32ea769971bc29cb468c5b1fa35c0e`; no frozen full-stage acceptance.

## SG-001 · P2 · Cleanup failure leaves durable smoke report PASS

`tools/local-pilot-smoke.mjs` assigns `report.status='PASS'` at the end of the test body. Its `finally` records cleanup failure and writes the JSON without reverting status. The final process exits unsuccessfully, but a later gate reading only the durable `status` could accept a dirty deployment.

Reproduction executes the unchanged actual finalizer extracted from the current file, with successful preceding tests and a forced `docker down` error. Actual JSON: `status=PASS`, `cleanup=FAILED`, `cleanup_errors=[docker-down]`. This is a controlled finalizer-level fault injection, not a claim that the actual Docker cleanup failed.

Required fix: durable status must be FAIL for any test-body failure or required cleanup failure. Preserve the cleanup diagnostics; final process should remain unsuccessful. Add/rerun a focused fault check and repeat actual Docker smoke after final source freeze.

## Checks and observations

- Independent rerun: 19/19 `test_source_revisions.py` tamper tests PASS; independent entry-profile suite 5/5 PASS. Outputs/hashes in sidecar.
- Source supersession is finite and explicit: original P00 archive/plan SHA, current owner/ADR/plan SHA, eight exact original requirement IDs, and original CSV/ADR-index byte equality. Arbitrary changed/rehashed normative files, wildcard rows or premature runtime PASS are rejected. No broad source drift exemption found.
- Entry defaults closed, only exact explicit profile enables mock terms, canonical loopback HTTPS only, strict 18+ acceptance retained in actual Rooms code. Synthetic terms are clearly marked in RU/EN/TR; no public legal approval inferred.
- New scope follows owner decisions: standalone one-host Docker, local tests, mock legal plus explicit 18+, unified embedded media transport for public/private/Cinema, music/mobile deferred. Distinct private namespaces and no host privilege inheritance are retained in design. This is design review, not media implementation acceptance.
- TLS proxy forwards HTTP/WS to the app; app remains nonroot/read-only with loopback publication and closed database networking. Fixture keys are existing public test material. No Docker socket or production certificate mount was added.

## Limits

Full local Docker smoke is running under root, not independently rerun here. Working candidate is dirty and other authors are active. No approved card pack or human editorial acceptance, full P04/P05/P06 gate, external deployment, public DNS/TLS, media implementation or real devices are accepted by this report. Full P04 remains HOLD. Reviewed file hashes bind this preflight only; final source/report must be frozen and measured separately.
