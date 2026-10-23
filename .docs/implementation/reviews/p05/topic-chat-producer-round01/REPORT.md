# P05 topic-chat producer — independent static round01

**CHANGES_REQUESTED — three P2 findings.** Reviewer `/root/p05_topics_ui` did not author the producer. No product or producer writes. Docker, PostgreSQL execution and the12 runtime cases were **NOT_RUN** in this review. This is a bounded static producer review, not P05 acceptance.

Reviewed frozen integration `1d7cb0c585899859eb4ccf1bc735545afc196322be2cbdcea854d05d912ac835`, runner `518984539bffcd3365e1e076747301f6423397c78970925edbbd74b60b223fd9`, DESIGN `6de6aa6e2ab20eb9f7fb5b90190a3a98d97814d4ea4df95f26e0459ed5268bfb`. Exact10 inputs and copies are in `inputs-before.json` / `source/`. All10 remained equal at the review's end. Author HANDOFF declares source4d99b11… /1806files; root subsequently lifted the included freeze for a fixture-only change. Current captured identity895fb30b… /1808files is recorded separately. Therefore this review does not assert a whole-tree unchanged freeze.

## TCP-PRODUCER-R01 — final input drift can still produce PASS (P2)

Location: frozen runner.mjs lines17,20–24. The main source/producer comparison rejects drift, but finally captures `inputs-after-finally.json` and `producer-pins-after-finally.json` without comparing either to the initial inputs. Thus a source or producer write between the main comparison and final capture is documented but leaves `status:'PASS'` and exit0. The final capture also precedes owned-resource cleanup, so it cannot establish inputs through the complete run.

Own exact runner control-flow probes `source_changed_at_final_capture` and `producer_changed_at_final_capture` both produced PASS/0 with different final inputs. The ordinary main-comparison drift control correctly failed. Fix by comparing final captured source and producer bytes against the initial pins at the end of the run; mismatch must set FAIL and nonzero exit while retaining cleanup. Recheck source and excluded producer drift independently, including the final capture path.

## TCP-PRODUCER-R02 — runtime cleanup is absent from fixed report gate (P2)

Location: frozen runner.mjs line17. The gate requires schema/suite/status and all12unique passing IDs, but does not require `runtime_cleanup === 'completed'`. Own exact runner control-flow probes accepted both a report with `runtime_cleanup:'failed'` and one without this field, with PASS/0.

The current integration itself sets process.exitCode and report status FAIL if its cleanup throws. This finding concerns the independent runner validator: the actual producer is not demonstrated to hit this false-PASS naturally. Require the cleanup field and add malformed/contradictory report rejection probes, preserving valid-report acceptance and cleanup-failure rejection.

## TCP-PRODUCER-R03 — capless20-round claim counts loop iterations (P2)

Location: frozen integration.mjs line22, `capless()`, cases04/05. `rounds++` records20 iterations; no unique round IDs/current-round indices or terminal completion are checked. A successful advancement response that leaves the same public round unchanged can therefore produce `actual_rounds:20` after observing only one round. This weakens the assertion that the immutable capability is honored across the actual20-round game.

Own exact helper probe with an inert successful no-op advancement returned `actual_rounds:20`,20calls,1distinct round ID. Its correct20distinct-round positive control accepted, and a private opportunity control rejected. This is evidence of a test assertion gap, not evidence that current production advancement is broken. Require observed20distinct scoped round identities, ordered expected indices and actual terminal state; reject duplicate/no-op advancement, early completion and missing rounds.

## Checks and limits

- `runner-static.mjs`:13inert scenarios,9expected controls matched,4false acceptances above; exit1 preserves findings. Exact runner body is parsed and imports removed for VM execution; all Docker/process/FS effects are inert stubs. No Docker command was executed.
- `integration-static.mjs`:19/19PASS, exit0. Exact AST-extracted denial helper rejects2xx/3xx/5xx, unrelated errors and synthetic private bodies; same-client SQL selector requires prior chat object, exact room/session/kind and final credential, resets on BEGIN, selects once and preserves SQL/parameters. Additional checks cover actual archived harness exports, quota-only declaration and late-wait cleanup structure. These do not execute the actual PostgreSQL race.
- `capless-static.mjs`:3scenarios,2expected controls matched and1false acceptance; exit1 preserves R03.
- Node24 `--check` integration and runner: both exit0. Exact10 input hashes remained equal.
- Manual source review:12case inventory/context/flag/host exclusion/idempotency/Unicode12-min/last32/128-round/late SQL are declared. Quota126 is explicitly synthetic metadata, under real room lock and scoped encrypted row update; only127/128 are natural accepted HTTP sends. No128-natural-send claim. Late SQL is actual GET delivery after chat-object load on the same PoolClient; final SQL wait selector and release/drain paths appear coherent. Runtime still needs execution after fixes and a new root freeze/image.

An initial reviewer inert resource-label mock used the wrong filter substring and made the positive baseline fail. Its script/output are retained as `runner-static-initial-fixture-error.mjs` / initial output files. The reviewer corrected only its own mock, reran the positive baseline, and attributed findings solely to the corrected run. No producer changes were made.

Reproduce using Node24: `node <this-directory>/probes/runner-static.mjs`, `node <this-directory>/probes/integration-static.mjs`, `node <this-directory>/probes/capless-static.mjs`. Raw outputs, exit files and JSON are alongside this report. Do not interpret expected exit1 defect demonstrations as an actual Docker test failure.

Created2026-10-19T21:49+03:00. Keep this failed round immutable; fixes and independent recheck belong to round02. Human450 HOLD, browser/TLS-cookie proof and full-stage gates remain separate.
