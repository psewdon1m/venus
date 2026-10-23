# Standalone · Independent entry candidate review

**Reviewer:** `/root/standalone_scope`; **time:** 2026-10-19T12:33:47+00:00 / 2026-10-19T15:33:47+03:00 Europe/Istanbul. **Outcome:** `ENTRY_CANDIDATE_PASS`, **scope:** new local pilot entry profile and wiring only. **Base HEAD:** `c5dac890fc32ea769971bc29cb468c5b1fa35c0e`; working tree has uncommitted candidate changes, exact reviewed file hashes are in the JSON sidecar. This is not a full stage acceptance or production readiness report.

The reviewer did not author entry-profile.ts, its production wiring, Compose config, Rooms admission code or UI. The reviewer authored the new plan/ADR019/profile and therefore gives those documents no independent approval here.

## Findings

No actionable implementation defects found in the reviewed entry delta. Default/closed mode returns no offer; invented profile fails before database migration. Only canonical HTTPS localhost/127.0.0.1/[::1] origins enable the explicit mock profile. Each locale clearly identifies test/mock scope; synthetic flag remains visible in the existing UI. Room entry still requires exact boolean adult18 and accept_offer plus current version/digest, persists separate adult timestamp and invalidates old-policy acceptance. UI starts with both controls unchecked and disables create/join until both are selected. Room-host privileges were not expanded, catalog providers remain fail-closed.

## Actual checks

- Author suite rerun independently: 5/5 PASS for entry-profile.ts.
- Reviewer-only adversarial harness: 24/24 PASS against actual entryProfile and Rooms.assertAcceptance. Includes missing/false/string/number/null adult and offer booleans; stale version/digest; closed offer; all three loopback forms; public/deceptive/noncanonical/HTTP origins.
- First harness attempt expected protocol code in Error.message and failed assertions while actual code denied correctly. Protocol intentionally stores public-safe generic message and separate code. Harness corrected to check error.code; original attempt preserved, implementation unchanged.
- Read-only inspection of create/resolve/join/reaccept/currentAcceptance and the existing UI: strict booleans/current policy, separate initial unchecked controls, safe actions preserved.
- check_docs.py PASS after authored scope edits, 144 markdown / 0 errors; this is integrity evidence, not independent approval of authored documents.

## Limits and handoff

No Docker integration, browser E2E or source-frozen full quality suite was rerun in this narrow review. Root must bind final reports to the frozen source and run actual production-entry Docker paths with new mock profile before claiming the P05 local gate. Existing historical synthetic-profile P02 tests do not alone prove the new production server wiring. New plan/ADR019/profile and P00 validator changes need other independent reviewers.

Raw reviewer harness and both attempt reports reside in `.artifacts/review-standalone-entry/`; durable public report contains their hashes. No real legal approval, signing key, domain binding or human content approval is inferred.
