# Catalog receipt semantics · Independent review round 07

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:03:53.763581+00:00. **CHANGES_REQUESTED**, stage_acceptance=false. Scope: newly added semantic validation of mechanical catalog receipts. Reviewed defect-source helper SHA256 `24282cc1061fba0355858b424009a9a1861ef524119180ab3e2335b2118e07ca`.

## SG-003 · P2 · Malformed test count / skip shape can receive PASS

The new check `tests.tests_run<14` does not require an integer. JavaScript accepts absent tests_run and non-numeric string because comparisons to undefined/NaN are false; string14 is coerced. The skipped.length check accepts empty string or an object with length0. Thus malformed receipts falsely satisfy the intended minimum14-tests/no-skips criterion.

Independent unchanged-source reproduction supplies all7 required files and three zero-exit subprocess results, varying semantic report fields. Five malformed cases falsely PASS: missing tests_run, nonnumeric tests_run, string14, skipped empty string, skipped object length0. Valid receipt correctly PASS;13tests, failures1, errors1, actual nonempty skip array, schemaFAIL and parsed449 correctly FAIL. This is a controlled malformed-receipt test, not an assertion that the current author report itself is malformed.

Required fix: Number.isInteger(tests.tests_run) and tests_run>=14; Array.isArray(tests.skipped) and length0. Validate any other required report shape explicitly before acceptance. Retest malformed cases plus previous subprocess timeout/log controls against final helper bytes.

## Previous report coverage correction

Root added semantic checks while round06 was being prepared. Its earlier6 isolated producer controls covered the prior helper; round06 file-hash sampling observed newer helper bytes. Consequently round06 must not be used as evidence that the new semantic guard was exercised. Round06 is retained as historical preflight, superseded by this round and a required fresh retest. Its4 mandatory-receipt and previous wrapper/source guards remain applicable to their unchanged files.

## Limits

Sources remain dirty and author active. No actual full catalog/Docker quality execution or stage acceptance occurs here. P04 human approval remains separate/HOLD. No implementation modified by reviewer; report and own journal only.
