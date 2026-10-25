# P07 CI refusal fix15 — bounded single-test diagnosis

- 2026-10-25T20:26:56Z — Parent authorized diagnosis/fix of finalCI fef quality1FAIL/1378: late negative display lease aged in flight wrongly leaves refusal enabled/POSTdecline. Scope relevant GamesPanel/control existing tests/scheduler as cause requires; report diagnosis BEFORE application edits if test-boundary cause possible. New ownjournal+evidencep07/ci-refusal-fix15. Preserve lease/assertion semantics, oldproofs/ROOT/C/manifest/Git untouched, no framework/fullhour/fullsuite changes. Need exact initialCIlog/source hashes, finite affected test+lint and independent delta review later.

- 2026-10-25T20:27:30Z — Concrete test-only cause reported to parent BEFORE changing application: actual GamesPanel sync poll4000ms, two existing tests select1500ms (lines46/93), hence execute zero timer callbacks. Failed scenario never issues heldself-actions request; resolving negative does nothing. Previously authenticated refusal remains valid until40000, so decline at16001 is correct. ClockDate/performance scheduler and explicit Date10000/15000 constructors are coherent here, not cause. Parent independently confirmed and authorized only affected existing testfile correction; original CI failure is sufficient baseline, no baseline rerun.

- 2026-10-25T20:28:20Z — Completed all test-only code BEFORE checks. Both selectors4000ms and assert exactlyone actual sync timer. Shared-frame case asserts newerOwnReads1 before inspecting old-rendered revision controls; late-negative case asserts heldReads1 BEFORE clock16001 and negative reply release. Existing expected enabledfalse/posts[] unchanged. No GamesPanel/OwnControls/sharedscheduler/TopicGames change; no framework/helper/seam. Preserved original101CRLF/101LF.

- 2026-10-25T20:28:38Z — ONE affected existing file Node24.22.1/Vitest5.0.5 Windows run exit0:16testsPASS/0fail/0skip,1.58s. Actual file count16, not parent estimated17. Targeted ESLint samefile exit0. No fullsuite/statistics/browser/runtime/hour rerun. Application/control/scheduler hashes unchanged below. This proves corrected scenarios execute intended async request and original lease/refusal assertions pass; not a fresh complete CI/stage acceptance claim. No source changes after checks.

- 2026-10-25T20:29:54Z — New evidence .docs/implementation/evidence/p07/ci-refusal-fix15 includes REPORT,INPUTS,affected-test rawoutput, original-CI relevant excerpt and INDEX. Original quality-fail01 fullhash22c0637d3caa29937f43389c07fe72efe75199bcb98970e2906fb2e782e3f70e preserved; excerpt strips ANSI codes for readability, explicitly recorded. First exact-literal FAIL extraction missed ANSI escapes (StopIteration before evidence writes), then selected distinct FAIL/path substrings and retained readable excerpt. Read-only guessed private-presentation.ts absent; rg found actual presentation-clock.ts. No app defect invented from those discovery errors.

Exact source hashes:
- affectedtest beforea64f4a69ef9b83f4f64bbf784042b04be394e0d2623a8d8d914578e7e1642ec3 → aftercae9b2b19863176a7ef6d72a24f9628ec11d9018f6a286da618d1713a9a32de3
- unchanged GamesPanel6cf7aa802c4702040fbaa3f5be440781fb92b8a84138955212a505e2ccb6b46d
- unchanged OwnControls21dfe368314c6a56a801c2ecf02b43f6b6a6ba3ca107343a87ba408139a51a9c
- unchanged shared game-races schedulerecec41c70871d59be1b1cb54c9e9a2fa44a93535927f6d37994403b71331e003
- evidence INDEX.json4ba8e71129ce6e1be7ff40ac1334c60ccc3454db258ee5db5b861f89f72dcf96

- 2026-10-25T20:29:54Z — FINAL STOP. Only game-controls-panel.test.ts +ownnewjournal/newevidence changed. No Git/ROOT/C/manifest/oldcanonical/oldsealedreviews edits. Runtime consumer code unchanged; old hour/reviews retain exact old inputs and are not relabeled as testing this delta. Orchestrator must independently review/rebind source/core/canonical proofs additively; no blanket stagePASS or final CI green claimed. Rollback inverse one testfile diff changes no application/data state.
