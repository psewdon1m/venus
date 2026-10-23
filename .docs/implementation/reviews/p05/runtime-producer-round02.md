# Ordinary runtime producer — independent preflight round 02

Result: **PRODUCER_PREFLIGHT_PASS**. RP-001 is closed for the reviewed producer logic. This permits the planned actual eight-case run; it does not establish that the runtime has executed or passed.

Exact runner SHA-256 `7e051c3b6c65b5d6f9561cef3573f48db3cd229177df72b8c30c7e83fd032ad9`; monitor SHA-256 `71579f66621eba2a973777a70244586b7c5dfc1765b81ade9a0fb7b03ac1daf2`. HTTP/SQL/FS probe and ordinary Dockerfile retain the round01 hashes. [Four exact captures](runtime-producer-round02/pins.json). No included producer/product file was edited by the reviewer.

`negative()` now retains the pre-start observation, validates the actual app start/finish interval, and waits boundedly for five additional same-phase samples plus an observation at/after process exit. It then inspects the owned monitor container and requires a live process/PID. The case detail preserves pre/post counts and times, the app interval, liveness and actual maximum sampling gap. Monitor gap measurement uses monotonic elapsed time. Sampling remains explicitly non-absolute no-listen evidence.

The corrected function independently passed **13/13** extracted-function controls, exit 0, no skips: stale pre-start report; progress ending before app exit; wrong phase; insufficient new observations; invalid times; late-established pre-observer; missing gap; observed listener; stopped monitor; zero PID; wrong project ownership; invalid app interval; and a positive advancing observer. Negative controls require the intended `AssertionError`, preventing an undefined fixture helper from being mistaken for successful regression rejection. [Probe](runtime-producer-round02/probe.mjs), [raw output](runtime-producer-round02/probe-raw-01.txt).

These tests execute the exact captured function with explicit Docker/file/clock doubles. No Docker, real monitor process, application startup or runtime case was executed by this review. All four source files remained unchanged during the independent probes. The original stale-monitor acceptance and round01 report remain immutable.

The state-preservation claim is now accurately narrowed to `sampled_state_unchanged`, with `full_database_equality_proof:false`. No new blocking producer defect was found in this recheck. Root's first lint failure and later corrected syntax/lint results are author evidence, not counted as independent tests here.

Next acceptance must inspect the actual image/CMD, source before/after identity, all eight unique cases, per-phase pre/post monitor evidence and live observer identity, raw exits/logs, secret-free output, label-bound cleanup and final resource absence. TCP sampling resolution/gaps must remain visible. Default/HOLD-negative runtime results must not be promoted to positive V2 serving, real admission/restore, browser/TLS, full P05 or human review450 approval.

Index: [round02 evidence](runtime-producer-round02/index.json). Journal: [reviewer journal](../../../../.history/agents/2026-10-19-p05-topic-games-review.md).
