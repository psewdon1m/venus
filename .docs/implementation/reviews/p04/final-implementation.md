```venus-review
{
  "reviewer_id": "/root/p04_gate_preflight",
  "source_sha": "4a7d5877b7e860d152c8c49ae768b646f3cb163f",
  "source_identity_sha256": "9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77",
  "scopes": ["implementation"],
  "status": "PASS",
  "open_findings": []
}
```
# P04 final independent implementation review

Date: 2026-10-19T04:15:30+03:00. Result: **PASS for the implementation scope of P04-TECHNICAL-1** on the exact source identified above. This does **not** accept the full human/editorial EXIT-P04 gate or enable public Games.

## Independence and exact source

Reviewer authored no production code, cards, tests, validator or contracts. Earlier review findings and their correction rounds are retained separately; this is a fresh assessment of the frozen candidate rather than a relabelled dirty-tree report. Reviewer only authored review reports and independently ran existing checks.

Independently read `git archive --format=tar 4a7d5877b7e860d152c8c49ae768b646f3cb163f` in memory, hashed every included regular file using the project's stage_inventory inclusion rules, and compared the resulting map with the actual workspace. All **744 included files** matched byte-for-byte. Independently recomputed identity **9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77**. Later journal/evidence/review changes are derived and do not alter this implementation identity.

Checked the accepted-P03→candidate diff: production relationship-engine source, original P00 contracts/card schema/policy and twelve supplied examples are unchanged. The P04 contract supplement is additive. Catalogue SQL uses its own checksummed migration stream; core/game migration bytes remain intact. No implementation/test/validator edits were made during this review.

## Implementation conclusions

- **Authoring/provenance:** durable SQLite BEGIN IMMEDIATE/FULL transactions reserve IDs, preserve immutable sequential card revisions and retain hash-chain events. Ordinary retries cannot rewrite requests; explicit revise compares the prior request SHA, preserves mode/range/count and records old/new requests. Record validates the retained constraints/distributions. CLI request/manifest/card inputs are captured before validation; stored request SHA comes from the exact captured bytes. Temporary validation snapshots are exclusively created and cleanup is confined to the verified owned directory.
- **Content/review boundary:** full-catalogue checks use the actual strict FrozenPack loader plus cross-mode/cross-functional-side exact dedupe in RU/EN/TR, a visible similarity queue and category distribution checks. Draft metadata cannot become approval through a count change. Reviewed candidates require independent registered Ed25519 signatures bound to complete draft/catalogue hashes, required safety/editorial/locale/rights/similarity/diversity checks and additional qualified safety where applicable. Packaged bundle reconstruction verifies the complete draft→reviewed cards/manifest mapping. Personhood, competence, originality and rights remain external human facts, not cryptographic conclusions.
- **Coverage/availability:** real P03 eligible/preflight logic drives C2 reports, unique-card counts, neutral requested1…100 sessions, all-X Yes-But refusals and private baseline/budget simulations. Supported private content is distinguished from rule exclusions and unavailable capabilities; the conditional chat report does not enable production chat. Host-only pre-start availability returns a generic result without edges, classes, eligible counts or card IDs; Start constructs/rechecks the committed setup again.
- **Atomic activation/rollback:** active digest changes are CAS operations under the exclusive catalogue fence and accept only compatible application-bundled, non-withdrawn packs. Safe active sessions retain exact pinned pack/revision. Rollback cannot resurrect a withdrawn revision. Production without an attached validated catalogue fails closed for retained pinned games as well as new Start.
- **Withdrawal/restore:** fsynced external metadata-only intent precedes DB commit. Serving compares both ledger head and exact withdrawal-row/hash correspondence. Failed commit leaves serving blocked until reconciliation; old-backup recovery reapplies the current external ledger, aborts affected games, removes unsafe consent/snapshot access and preserves monotonic clears for prior private recipients. Old-image rollback explicitly requires stopped serving/quiescing and preserved ledgers.
- **Final HTTP/WS fences:** serving rechecks committed catalogue/room/session/generation/actor/entry/consent state under the shared catalogue fence and room lock through synchronous enqueue. Public final projection and final HTTP authorization do not reconcile, reserve, bump or queue transaction-local state. Expiry suppresses stale text without phantom revisions. Raw HTTP enqueue preserves security headers. Stop/abort keep their scalar acknowledgement; advance/pause/resume preserve the stored original session/revision, with the documented transport-only nullable current_round redaction when text cannot safely be returned. Terminal action-state retrieval remains authorized and separate from private prompt delivery.
- **CI/regression integration:** feature-push duplicate execution is removed while PR(main)/push(main), pinned actions, exact-head checkout and all eight required context names remain. P04 runtime/coverage runs inside the existing required integration job and uploads a distinct artifact. The implementation does not bypass branch protection or replace cancelled history with fabricated success.

I01–I10 are resolved on this candidate; no additional actionable implementation defect was found. This does not claim that token similarity proves semantic diversity, that every mixed graph was sampled, or that a conditional capability exists in production.

## Independently checked verification

After freeze, independently reran the existing request-snapshot race test with pinned Node24.22.0 and workspace Python: **1/1 PASS, exit0**. Actual Python validation accepted captured valid bytes and rejected the subsequently changed original request. No test source was authored or modified by reviewer.

Inspected the fresh durable local packet at `.docs/implementation/evidence/p04/local-4a7d587/`. Independently verified **all19 indexed byte hashes**: fourteen durable raw/log/report files and five measured catalogue outputs. The index SHA256 is `9e4b313e37df7d7367cb876f1278d304252db0a17bef44e3c5995dc826d3b959`. Source inputs equal the archive/workspace inventory and exact identity. P04 runner records forced runtime build, clean start, unchanged before/after identity and completed owned cleanup. Checked actual logs against their reports:

| Fresh local check | Result |
|---|---|
| Quality | 52 JavaScript tests,98 Python tests; lint/types/contracts/locales/docs/build and accepted historical P01/P02/P03 gates PASS |
| Corruption controls | Schema, locale, type and unit negative controls reject corruption; positive exits0, negative exits nonzero, clean exact source unchanged |
| OCI/runtime isolation | 9/9 checks PASS, including real DB outage/recovery, fail-closed entry, isolation/logging/startup sanitization |
| P02 actual integration | 20 tests /22 proofs PASS on candidate; owned cleanup completed |
| P03 actual integration | 19 tests PASS on candidate; owned cleanup completed |
| P04 actual PostgreSQL/HTTPS/WS | 11 tests /13 required proofs PASS on candidate, including CAS/pinned rollback, pre-start shortage/ACL, actual delayed public/private HTTP/WS withdrawal, both private clears, read-only expiry/auth, original mutation replay after another session, real deferred commit failure and genuine older pg_dump/pg_restore recovery |

Independently loaded both fresh full450 draft C2 reports and applied the coverage validators: **5,880 predicate cells,4,200 neutral sessions,14 expected all-X refusals and420 private profiles per capability input**. Both current and conditional capability reports pass the required private baseline/profile checks. Mode counts are150 each; these remain draft counts. The measured paths and hashes are recorded in the verified local-check index rather than substituted with historical development outputs.

This review did not independently execute every long integration scenario; it inspected their actual implementation, fresh source-bound logs/reports, hashes, cleanup and proof structure. Actual CI39183818433 has separate evidence review responsibilities. Its long M3 measurements/artifact audit and protected delivery are not asserted completed by this implementation-only report and remain mandatory for the combined technical gate.

## Acceptance boundary

Independent `tools/p04_gate.py inspect` reports **EXIT-P04 NOT_PASSED**:450 drafts, zero reviewed production cards, empty approved bundle registry and missing genuine human review. No human review/rights/locale/safety approval is supplied by this agent. Public catalogue remains unavailable and production capabilities remain restricted. Full EXIT-P04 and dependent public stages cannot be accepted from this implementation PASS alone.

Final implementation finding count: **0**. Scope is exactly `implementation`; evidence/CI/protected-delivery acceptance and external human approval remain independently enforced.
