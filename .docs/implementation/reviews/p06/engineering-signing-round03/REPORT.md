# P06 Engineering signing round03 — failed source round E08

**CHANGES_REQUIRED_E08_NOT_PRE_SIGN_PASS** on clean frozen `195e2302899687e11cecde1920d64a040714745e`, core `3a4eae5c3aef4ff8acf9a6cdb3ba6c0321614d8eabd0b61a632db850c2f9b3f6`/1948. All1948 source inventory hashes independently matched; no removals, clean status observed. This failed round is preserved unchanged for the next corrected freeze/re-review.

## E08 / P1 — mandatory CI policy unit still requires removed automatic statistics

`tools/ci-policy.test.ts:8-10` still expects p03-measurements in ci.yml jobs, then accesses its strategy.matrix.section and timeout. New ci.yml has only the approved five automatic jobs. The first jobs assertion therefore fails deterministically; subsequent statistics dereference is also incompatible. Focused YAML/permissions receipt PASS does not cover this existing mandatory quality unit.

Impact: exact source195e cannot pass mandatory quality or aggregate pre-sign readiness. This is a test/CI-policy alignment defect, not an application runtime failure. U021 legitimately authorizes optional manual statistics; it does not make an inconsistent mandatory unit pass.

Minimal correction already sent to author: change the existing unit to expect five automatic jobs and inspect separate p03-statistics.yml for workflow_dispatch-only, unchanged four-section matrix/120-minute budget and action pins. No new framework, proxy, application change or P05 corpus run is required. Root accepted the finding and reports this existing targeted unit now1PASS on the forthcoming corrected source. Root also reports actual quality job120997017109 FAIL and stale-job cancellation202; those later receipts were not independently audited here and are not used to relabel original bytes.

## Bounded source observations

Exactly eight paths differ from prior1944-file core5a917: four existing policy/decision/workflow files modified, four added ADR033/v6/manual-statistics/preview files. App/API/DB/operator/release tools/compose/Dockerfile and statistical implementation/sample/threshold bytes are unchanged. Stats matrix and commands moved to workflow_dispatch-only; preview uses version0.0.0/SHA tag, packages write, no signing environment/secret or qualified release assets. Qualified workflow advances only pre-sign03→04 reference. New authority U021/ADR033 retains old decisions and cancelled statistics as CANCELLED, never PASS.

These positive bounded observations do not override E08. Previous67PASS/34N_A/7artifactpending/10productiondeferred component decisions are historical; no new all118/eight-gate pre-sign PASS is issued on failing CI-policy bytes. Current/new CI5 and preview/public-access proofs need their own exact handoff. Owner-authorized preview publication is separate and is not held by this qualified pre-sign review; root reports it already published/Public/anonymous exact-digest pulled, but that proof is not audited here.

No tests/Docker/restarts/API/private-key/source/Git/remote mutations by reviewer. Only this own new failed review and own journal were written. P07 and full stage/service release are not accepted.

COMPLETE_STOP. Author may freeze corrected existing-unit source and request focused re-review; no further review of failed195e is needed.
