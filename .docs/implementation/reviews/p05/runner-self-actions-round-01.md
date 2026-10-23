# Self-actions host runner — independent round 01

Outcome: **CHANGES_REQUESTED**, limited to a minor explicit-selector contract mismatch. API/UI implementation remains outside this review and no service Docker acceptance is inferred.

Inputs: wrapper SHA256 `d3e68167b5fff310288b2e32860b1bf06393c7bf0d35d304a3641e0572856f50`, report contract `b603a4cc579339b86c257dfc1c6181e1d2947dadfb6434778d7e0d81e6daa7f9`, reporter tests `18aa128190851e1b36a8e6c33a7faf8d8aabad5427d3471c9f38385152ca9d4d`, preload `5b6698f778078d067f3cada4463b8a08742edfb0952410249b82d564189a7356`, package `93ee273b20a2416637e3ccc641504a4ed2cb9d655d0f494f07e91a5930c5e839`, testing docs `67c2a2223864ab73e1dafbd5732be08137e98f0bc77e2d8a4a67c74d2c9ce6a0`.

## SA-RUN-001 · P3 · Explicit neutral browser selector bypasses documented exclusion

The runner rejects self-actions when the effective engine differs from all or a case is selected. Therefore `--self-actions --engine=all` is accepted and can return PASS, despite the stated strict contract excluding browser selectors from this component mode. Isolated execution of actual wrapper bytes reproduced this acceptance. This does not falsely claim a browser matrix: self_actions_only remains true and full_browser_matrix remains false.

Root chose the strict contract after receiving the finding: reject any explicit --engine=/--case= flag, including neutral all, before resource creation. Add this case to the existing pre-resource conflict controls and independently recheck repaired bytes. Original witness retained in `runner-self-actions-round-01-artifacts/explicit-all-control.*`.

## Other verification

Independently reran all reporter tests: **44/44 PASS** (including previous 39 regressions). Own actual-wrapper VM controls: **30/30 PASS** for fixed suite path/metadata, inherited environment reset, malformed/missing/empty/null/wrong-scope/error/duplicate/skipped component receipts, process exit1/timeout overriding PASS, partial raw retention, source change and cleanup/inspect/ownership failures, plus five pre-resource mode/selector conflicts. An additional diagnostic control reproduces SA-RUN-001 (31 total diagnostic controls). These use isolated external-command/filesystem stubs and are explicitly not actual Docker/service evidence.

The component receipt validator intentionally requires nonempty unique P05-SA-* checks, not a normative complete test matrix. Documentation correctly reserves coverage sufficiency for independent service review. `quality` still invokes reporter controls; `test:p05:self-actions` selects the fixed component mode. Build/source identity/owned cleanup metadata remain unchanged in purpose.

First own control attempt failed solely because Node deepStrictEqual compared VM realm array prototypes despite identical values. Corrected harness with Array.from; original attempt script/raw retained. No implementation change was made by reviewer. Browser round02 remains immutable. Await strict-selector repair and source/control round02; full P05 and actual self-actions execution remain unaccepted.
