# CI refusal case — author fix15

**PASS targeted author checks; test-only change. Independent delta review remains required.**

Original GitHub CI fef failed the late-negative refusal case: expected disabled/no POST, received enabled/decline POST. The original failure is preserved by its full-log hash and relevant copied excerpt (ANSI colors removed for readability).

Actual GamesPanel sync interval is4000ms. Two scheduler scenarios selected1500ms, which matched no timer. The held self-actions request was never issued; resolving its negative promise delivered nothing. Already observed decline evidence remained valid until40000 at clock16001. Explicit timestamp constructors and simulated clocks were not the cause.

Only game-controls-panel.test.ts changed: both selectors use4000ms, assert exactly one timer exists and assert the newer/held metadata request was actually issued. The late-negative request must be in flight BEFORE clock advancement and negative reply. Existing enabled:false/posts:[] assertions and all lease/revocation requirements remain. Actual GamesPanel, OwnControls and shared scheduler are unchanged. No framework/helper/seam or other module interval change.

Node24.22.1/Vitest5.0.5 Windows affected-file run:16executed/16PASS/0FAIL/0skip,1.58s; targeted ESLint exit0. No baseline recreation/full quality/browser/runtime/hour rerun. Actual file count16, not estimated17.

Runtime/scheduler hashes equal their pre-diagnosis values. No product behavior change is claimed. Build-context/source identity and final proof binding still require orchestrator rebinding. Original hour and sealed reviews remain pinned to their original inputs; they are not rewritten or represented as testing this new test file. Independent additive delta review is still required.

Rollback: inverse single test-file diff, restoring obsolete timer selection. No application/data state was mutated. Exact source/log/input hashes and actual executed counts are in INPUTS.json, sealed by INDEX.json.
