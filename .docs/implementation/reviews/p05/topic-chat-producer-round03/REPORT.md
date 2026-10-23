# P05 chat producer — independent static round03

**STATIC_PRODUCER_PREFLIGHT_PASS — added GET_AND_POST_FINAL_FENCE scope.** No new findings. Reviewer `/root/p05_topics_ui` is independent of producer author `/root/p05_topics_ui_review`. Producer/product unchanged; Docker and actual PostgreSQL execution **NOT_RUN**. Static acceptance is readiness for the actual12-case run, not evidence that a PostgreSQL transaction has already rolled back and not full P05 PASS.

Exact frozen checkpoint03: integration `527e0d01d9716ae03e6352ae5481408e63c3b414026a621aba29af8f2b0eb01c`, runner `c77b72308b42dc3262c55015afa1793c31cdfc8d5396a03ec515627a4c6da8e4`, DESIGN `f62ac8532ac0e84099665e35740ab1bde6c1dc9726ebf4ea1844fb330294edb6`. Exact11 reviewed copies, including actual Rooms.finalAccessFence, are under `source/` and `inputs-before.json`; all11 equal at end. Root declared included freeze `895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04` /1808files; own final full inventory matches it. Prior reports remain immutable.

## Added POST obligation

The original GET race remains mandatory in case12. Only after it succeeds does case12 await `latePostRollback()` and include both GET and POST details. The POST helper creates a separate fresh actual online private room, obtains real accepted conversation and empty chat, and checks the exact new request has no receipt. It does not reuse the GET room or seed authorization/consent/chat/quota.

The POST query hook observes `INSERT INTO topic_game_requests` with exact room/member/requestID and operation `chat`, then selects the following final credential SELECT on that same underlying PoolClient with exact credential hash/room/member positions. BEGIN clears per-client attribution; wrong client/room/member/request/operation cannot identify the target. Actual current TopicGames.mutate inserts the receipt with these first four argument positions before awaited finalAuth; actual Rooms.finalAccessFence credential query uses those exact three positions. Harness invokes the hook on the underlying client and awaits each real query, so the marker precedes the actual INSERT execution and the selected subsequent query follows its completion. Advisory wait changes only the SELECT projection and preserves arguments.

The helper requires observed `pg_stat_activity` Lock wait for its distinct advisory key before switching the actual flag off. It then clears timer/hook, unlocks, releases blocker client and awaits the pending HTTP result. It rejects anything other than expected404/409 policy errors, rejects private error body text, requires authenticated stored round quota and chat messages equal their pre-write values, checks absent sent canary, exact room/member/request receipt count0, and self chat permission false. Flag is restored after result assertions; suite finally also restores hooks/flag and performs actual runtime cleanup. Runtime must still demonstrate these observations in PostgreSQL.

## Independent probes

- **24/24 added exact-AST probes PASS, exit0**:12POST-selector scenarios,11whole-helper control-flow scenarios and1required-case integration assertion. Correct selector accepts once and preserves SQL/args; no prior receipt, different client, BEGIN reset, wrong INSERT room/member/request/operation, wrong final room/member/credential and GET object-read marker all reject. Whole helper accepts valid rollback seam; rejects HTTP200/500, wrong policy, private error body, quota charge, stored message, canary outside messages, retained receipt and remaining self permission. Failed observed-wait seam still clears timer/hook, unlocks/releases and drains pending response. These use inert HTTP/SQL stubs, not PostgreSQL.
- **13/13 runner controls PASS, exit0**: previously closed final source/producer drift and missing/failed runtime cleanup remain rejected; valid fixed12-report remains accepted. Owned-resource/ownership/secret failure controls remain red as expected.
- **19/19 existing integration probes PASS, exit0**: GET selector remains selected separately from POST; denial and archived harness/quota/cleanup checks preserved.
- **14/14 capless controls PASS, exit0**: unique ordered20-round proof and its duplicate/no-op/partial/DB/terminal/snapshot negative cases remain enforced.
- Node24 syntax integration/runner both exit0; scoped ESLint exit0. Exact11 inputs unchanged; final whole-tree identity matches root freeze.

Own first whole-helper mock tried the wait predicate only once, before an awaited hook microtask had reached the inert SQL seam; its positive control failed. That reviewer-fixture failure and script/output are preserved. The reviewer corrected only its own bounded predicate polling, reran the positive control and all negatives, and attributed no producer defect to the initial failed mock. Producer bytes did not change.

Raw scripts/results/exit files are alongside this report. No Docker command or actual database was used by reviewer. The author-declared encrypted126quota fixture and all previous runtime/browser/full-stage boundaries remain unchanged. Root can coordinate actual corrected producer execution; browser producer remains separately authored and RUN HOLD pending that result/ACK. Human450 approval remains HOLD.

Completed2026-10-19T21:56+03:00. Any new producer bytes require a new review round.
