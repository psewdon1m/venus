# Compatibility6 producer independent static round02

STATIC_PRODUCER_PREFLIGHT_PASS, before actual RUN. Reviewer /root/p05_topic_games_review; producer author /root. Exact source ef009b7c /1811; four producer pins are in source-pins.json.

COMPAT-PR-001 closed: exact cases04/05 now execute protected POST/start, assert exact error code/status, waiting state/revision/snapshot/pack/current_round equality and zero receipt for the new request. Independent extracted-helper controls reject successful start, wrong status/code, each changed row field and receipt publication. Exact handler controls require the start call in both cases. This is inert AST execution, not HTTP/PostgreSQL evidence.

The old reviewer recommendation of POST503 for unsupported snapshot was overbroad. Frozen product mutation catches EngineError into deferred409, whereas read mapped() uses503. ADR024 requires denial, and prescribes503 for missing prior. Corrected case04 is GET503/POST409 TOPIC_SNAPSHOT_VERSION_UNSUPPORTED; case05 is503 TOPIC_HISTORY_UNAVAILABLE. No product defect or relaxed contract is claimed.

COMPAT-PR-002 closed: exact case01 requires nonzero projection and private-reference baselines before case03 purge. Independent exact case01 handler accepts positive baseline and rejects either zero baseline. COMPAT-PR-003 closed: DESIGN accurately discloses temporary host DB-password file; cleanup remains checked.

14 independent inert full-runner controls PASS: exact six IDs/schema/runtime cleanup, before/after/finally source and producer drift, ownership, remaining resources and secret cleanup. Producer AST controls17 PASS; syntax three exit0. Resource limits, readonly integration-only mount, included harness, finally drift checks and no reset/skip remain unchanged. Case06 proves20 planned rounds and start, not20 completed rounds. Boot is a source-unavailable method call, not process restart/ordinary production bootstrap; partial SQL row fixture is not full restore.

No Docker or product/producer writes by reviewer. Historical round01 remains immutable. This review authorizes no statistical RUN, human content approval or full P05 PASS. Actual compatibility6 execution is a separate gate.
