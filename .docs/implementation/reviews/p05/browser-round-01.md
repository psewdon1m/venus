# P05 browser harness — independent round 01

Outcome: **CHANGES_REQUESTED**. This is a scoped harness review of a dirty candidate, not clean-source or full P05 acceptance. Reviewer authored no implementation under review. All findings were sent to the orchestrator before this report. No included source changed during the root's ongoing full preflight.

## Inputs and actual evidence

Reviewed `tools/p05-browser.mjs` SHA256 `c7a5b90df571233ff6ff461d4acfa4b2ce5fe13c1ad0fe9bd1c3eb650350b402`; `tests/p05/browser.mjs` `27207513c9e65ab8968b7d1a3bf86fa2415fbed03b85de1384619514ce067ca2`; `tests/p05/display.mjs` `c460654bee35dc3363aaa56ce10b74a871000d98680eccaca2f927810f92fc81`; `.docs/P05_TESTING.md` `d8d299fec7d3645c29fb779f7533a5cf5c12d980f3f79469d94dad02b0249fe0`. Also read runtime, native capability probe, fixture server, Dockerfile and Compose configuration. Author WRITES_FINISHED was received via root.

Read actual targeted Firefox attempt `.artifacts/p05/venus-p05-5735c76a8c65`: runner PASS, dirty/preflight, selected localized-game case, one Firefox157.0 record, 72 layout cells, 9 native observations, 10 keyboard traversals, no pageerrors/overflow, cleanup completed. Identity `bdd866566677b89fc313a7af4af4b1756a9d131676a117e0b5e53016a38c7ee4`, image `sha256:2783478897dcf9ef31a38864ef1e22a79ca7e285f458df69c42face9f243e316`. This proves targeted Firefox coverage only. It does not prove all three engines, clean source, production TLS, Safari/mobile, real content approval or full P05.

Independently inspected `firefox-ru-active-native-controls.png`: physical browser chrome shows 200%, full 640×1000 window, visible focused stop control. All nine native records report DPR1→2, CSS zoom1, own separate process, successful reset and unchanged main viewport. Actual-source inspection confirms X11 focus ownership, unique main actor window selection, separate browser server per native check, measured viewport shrink, ffmpeg window capture, actual Tab traversal after a neutral heading click, and no direct target focus/click bypass. These mechanisms are substantive; earlier capability experiments are explicitly not acceptance proof.

## Findings

### BR05-001 · P1 · Full-matrix receipt can describe a targeted execution

`tools/p05-browser.mjs` derives selected scope only from CLI, then spreads `process.env` and overrides P05_ENGINE/P05_CASE only when CLI selectors exist. Compose consumes inherited values. With host P05_ENGINE=firefox and P05_CASE=P05-EXPLICIT-18, a normal invocation executes the targeted inner selection while outer runner reports selected_engine=all, selected_case=null, full_browser_matrix=true and PASS.

The wrapper additionally accepts any inner report containing only status=PASS/runtime_cleanup=completed. It does not validate selected scope, engine identities, expected case IDs, record status/count, layout/native counts or display cleanup. An explicitly partial synthetic inner report is accepted as a full matrix by the isolated execution.

Reproduction: durable `browser-round-01-artifacts/harness-negative-controls-01.mjs`, controls 1–2. Actual wrapper bytes are evaluated with Docker/FS effects stubbed; this is a control-flow reproduction, not an actual Docker test. Process exit 0 means both defects were reproduced as asserted. Explicit env defaults plus an exact receipt contract should fail closed on missing/mismatched scope and counts. Preserve diagnostic selections as targeted.

### BR05-002 · P2 · Application errors and capture overflow allow inner PASS

`tests/p05/browser.mjs` collects bounded application pageerror diagnostics, but its final acceptance block checks only counts/nonempty versions and then assigns PASS. Isolated execution of that exact block with otherwise valid counts returns PASS for both a nonempty page_errors array and page_errors_overflow=true. These conditions require manual investigation per the testing document, yet the machine acceptance has no hold/fail condition. A background exception can therefore coexist with successful visible assertions and a green runner.

Reproduction: same durable control, controls 4–5. Require an empty error list and false overflow before PASS; retain diagnostics on failure. This finding does not claim that the actual targeted Firefox run had an application error: it recorded none.

### BR05-003 · P2 · Probe timeout claims cleanup without owning/removing its container

The --probe branch starts unnamed `docker run --rm`; wrapper timeout terminates the Docker client but does not establish container termination. The finally branch entirely skips Docker cleanup for probes and can write cleanup=completed. The normal browser path already names/inspects/removes its owned container, but this protection does not apply to probe mode.

Isolated actual-wrapper ETIMEDOUT control (control 3) returns status=FAIL, cleanup=completed, with no owned name and no inspect/remove command. This proves the absence of cleanup verification, not an observed Docker leak. Name the probe container, remove/verify only that owned name on every exit, and mark unconfirmed cleanup failed. Do not delete unrelated resources.

## Other review results and boundaries

Normal run logs are opened before spawn, so partial raw output survives command errors. Included-source inventory and Git identities are checked before/after. Container runtime is nonroot, read-only, capability-free with internal network and no Docker socket; output/secret paths are per-run. Browser/server/context operations have bounded waits; process cleanup escalates only owned processes and records failure. One host Docker command can run up to 20 minutes; runtime steps have shorter traceable limits. Final acceptance remains blocked by the findings above and pending actual full-matrix evidence after repairs.

No implementation changes were made. Fixes, tests and a fresh independent round must follow; this report and failed controls remain immutable.
