# Prospective boot/history source review round01

**CHANGES_REQUESTED_PROSPECTIVE_PRIOR_GUARD.** Root author; independent reviewer `/root/p05_topic_games_review`. Exact excluded candidate697b92e0a165452f88d40d2f9e9a531367972fc267626bc92d2f7352820be457 plus isolated engine2 ef1e1122. Product895 was not modified; no current global inventory proof, Docker, actual PostgreSQL or ordinary startup acceptance.

The candidate and six API inputs were copied and independently transpiled in an isolated namespace. Real copied Keyring/AAD code performs AEAD decrypt/encrypt; full bootGate/prior bodies are unchanged. SQL rows, transaction behavior and prior snapshot/history readers are explicit unit doubles. No source/safety provider is allowed to answer; attempted calls throw. This separation is not production composition or real SQL evaluation.

## Passed bounded controls

37 source controls PASS, prepare0/probe0: active/paused engine1, wrongprivate/recoverypolicy, wrongroom/session/schema/baselineschema/pins; authenticated null/string/array header; corrupt AEAD; missing historicalkey conservativeabort withcipherpreservation; unsupported activecurrent_round0 checked before earlyskip; supportedactive/pausedpair revocation featureoff; corrupt round abort; missinground/SQLerrorpropagation with modeledtransactionrollback; waiting/completed/aborted transient cleanup; selected startednullsnapshot503 before reader; unsupported reader failure notskipped; valid prior sessionfilter/contiguoussequence;301capacity; emptyneverstartedquery; exactqueryroom/session ORguard binding; four altered SQL guard controls rejected.

Supported pairs clear invitation/action acknowledgements/condition, replace bootID and retain snapshot/history model bytes. Unsupported/corrupt headers abort without catalogue or round decode; conversation/chat/projection/private refs are removed in exact room/session scope. History kind is excluded from deletion. No external authority provision/reset function is called. Unknown key is currently treated as unsupported/corrupt for conservative abort while keeping ciphertext; subsequent unreadable same-room history must remain unavailable.

These tests prove source and real crypto behavior under the stated doubles. Transaction rollback is simulated; per-kind history bytes use an explicit model fixture, not actual encrypted PG chunks. Prior SQL shape/scoping checks are static; supplied rows are not PostgreSQL query results. Ordinary early profile/catalog refusal still proves no-listen only, never successful cleanup.

## ADR024-D02-REFINE — defensive prior selection gap

**P2 OPEN prospective boundary**, not a reproduced normal live-data bug. The new WHERE selects snapshotnonnull OR current_round>0 OR scoped rounds/participants/history EXISTS. This fixes the originally identified missing-snapshot/history-bearing case, but still does not prove an omitted row was neverstarted.

Two SQL-schema-valid partial-restore/damaged metadata cases remain omitted: aborted+pack_digestnonnull with snapshotNULL/current_round0/nochild rows, and completed state with allthose fields lost. A nonnull pack_digest is set by actual start, not prepare; completed is terminal started-state evidence. The exact source WHERE is false for both rows, silently omitting them before require(snapshot). Treat these as incomplete/corrupt prior and deny a new same-room start; do not use missing child rows as proof of a clean draft.

selection-counterexample.mjs records the exact pinned WHERE anchor and its static relational truth-table:2 expected-selection FAIL, exit1. This is not a PostgreSQL execute plan or a runtime corruption reproduction. Immutable001_game_state.sql permits such aborted/completed metadata; it separately forbids snapshotNULL for active/paused, so activeNULL is not used as a normal reachable case.

Recommended prospective fix: include `g.pack_digest IS NOT NULL` and completed-state evidence in the guarded selection, or inspect all prior rows and explicitly establish the only skippable neverstarted draft condition. Keep room/session bindings, capacity limit and fail503 before reader. Preserve immutable history/ciphertext/external floors, no nullification or blanket skip. Root should fix candidate first, then repeat these exact cases plus37 controls on a new exact hash. Included implementation/startup/new SQL indexes and realPG restart/restore remain separate reviews.

Full-stage, production-approved boot, real restore/rollback and owner450 HOLD remain outside this packet. No current proof is promoted by a prospective source result.
