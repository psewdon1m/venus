# Standalone pilot evidence · Independent review round 05

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T12:59:24.472447+00:00. **PREFLIGHT_PASS**, stage_acceptance=false. Scope: root-authored local-pilot command evidence hardening, successful-build stderr preservation and continued SG-001 cleanup fail-closed behavior. Current working candidate remains dirty.

## Actual isolated checks

The current unchanged run() helper was extracted and executed with controlled spawn results and in-memory file writes. All5 controls PASS: successful build retains combined stdout+stderr; build timeout retains both partial raw build log and bounded failed-command receipt before rethrow; ENOENT/spawn error, exit9 and SIGTERM/null exit all preserve accurate status/signal/error/stdout/stderr and throw. evidenceFile is removed before constructing spawnSync options. Receipts contain only the explicit command/operation/exit_code/signal/error_code/stdout/stderr keys; controlled argument and environment sentinels do not appear.

Reviewed actual call sites: no secret arguments or env are added to receipts. Production app inspection exposes secret file paths, not secret values. Python inventory output contains source hashes, app logs use existing safe structured request fields. Raw command stdout/stderr remains intentionally retained; callers must continue avoiding operations that print actual keys or private content.

Repeated actual-source finalizer controls4/4 PASS: normal success→PASS; failed Docker cleanup, failed owned-directory cleanup and test-body failure→durable FAIL. SG-001 remains resolved. Cleanup failures continue to cause nonzero termination and retained diagnostics.

## Limits and handoff

These are helper/finalizer fault injections; no real Docker resources or application sessions were created by this round. No actual final full suite is claimed. Root still needs coordinated clean-source freeze, exact final tests/source maps and derived-manifest refresh after agent writes finish. No full-stage acceptance, human card approval, production, media or mobile claims follow. Rounds01–04 and failed attempts are preserved. Reviewer finishes writes after this report/journal handoff until root follow-up.
