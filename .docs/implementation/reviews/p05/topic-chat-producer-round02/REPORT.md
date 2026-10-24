# P05 topic-chat producer — independent static round02

**STATIC_PRODUCER_PREFLIGHT_PASS. TCP-PRODUCER-R01/R02/R03 closed within this bounded scope.** Reviewer `/root/p05_topics_ui` is independent of producer author `/root/p05_topics_ui_review`. No producer/product writes. Docker and actual PostgreSQL12-case runtime **NOT_RUN**. This is not full P05 acceptance.

Author paused integration `a3d9bd5751a0136e1bb0e19ed3209ec6cfd24ddaa3c980bb6ae8c23dedc1b790`, runner `c77b72308b42dc3262c55015afa1793c31cdfc8d5396a03ec515627a4c6da8e4`, DESIGN `43ebc5f037ff048725fc887c0c32528697717bfac368294f70a7bcfec1de69a6`. Exact10 input copies/pins are under `after/source` and `inputs-before.json`; all10 unchanged at end. Root-declared included freeze and own final full inventory both identify `895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04`,1808files. Round01 remains immutable; its exact source copies were copied into `before/source` to rerun old counterexamples without writing the old report directory.

## Closure evidence

| Finding | Before exact source | After exact source |
|---|---|---|
| R01 final source/producer drift | Both accepted PASS/0 | Both rejected FAIL/1; final capture/comparison occurs after resource and secret cleanup |
| R02 absent/failed runtime cleanup | Both accepted PASS/0 | Both rejected FAIL/1; valid completed report remains accepted |
| R03 twenty-round loopcount | No-op advancement accepted20calls/1identity | Rejected after first duplicate/index failure; valid20identities/indices accepted |

Own exact runner VM control-flow probes: **before9/13matched, after13/13matched**. Baseline PASS preserved; missing/duplicate/failed case, failed report, missing/failed runtime cleanup, main/final source drift, final producer drift, owned-resource cleanup failure, ownership mismatch and secret cleanup failure all have expected outcomes. All process/Docker/FS effects in these probes are inert stubs; no Docker executed.

Own exact `capless()` helper probes: **before3/14matched, after14/14matched**. After source accepts valid20rounds and rejects successful no-op, repeated round ID, index jump, early completion, wrong final current index, nonterminal final round, DBcount19, DBdistinctIDs19, DBdistinctindices19, DBfirst0, DBlast19, private opportunity and changed immutable snapshot. The helper now observes20distinct IDs, ordered1..20indices, finalround20terminal and scoped database count/distinct/min/max. It does not demand the enclosing game be inactive immediately after final skip; that lifecycle detail is outside this assertion.

Exact AST integration checks **19/19PASS on both sources**: denial helper's4xx/code/body behavior, SQL selector's prior chat object/exact room/session/kind/samePoolClient/final credential/BEGIN reset/one-shot selection/preserved parameters, archived real harness exports, declared quota-only seed and wait cleanup structure. Manual source review confirms no unrelated changes to cases01–12, actual auth/storage/provider replacements or quota fixture scope. The explicit encrypted126quota seed is retained;127/128are natural accepted HTTP sends and129is expected denied. This is not128natural-send evidence.

Node24 syntax integration/runner both exit0; scoped ESLint exit0. Runner after probes exit0, integration before/after exit0, capless before/after script exit0 because all after assertions match. Expected old runner exit1 is retained as counterexample evidence, not an actual runtime failure. Raw outputs, exact scripts and JSON are present. The initial round01 reviewer fixture mistake remains only in immutable round01; corrected scripts are reused here.

## Remaining gate

Root may now execute the corrected producer against a frozen image and PostgreSQL and independently evaluate actual12-case results/cleanup/source pins. Browser-cookie/TLS/native-elapsed proof, full browser/layout matrix, clean-source/full P05 gates and human450 HOLD remain separate. The reviewer's subsequent work on its own browser producer is an **AUTHOR** role and does not self-accept that producer.

Created2026-10-19T21:54+03:00. Keep this completed review immutable; new producer changes need a new round.
