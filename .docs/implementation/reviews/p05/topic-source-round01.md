# P05 release topic source — independent round 01

Verdict: **COMPONENT_PREFLIGHT_PASS**. Reviewer `/root/p05_topic_source_review` did not author the six source files. This is a bounded dirty-tree component review, not clean-source evidence, complete P05 acceptance or content approval.

The exact six inputs, copies and before/after hashes are retained in [review evidence](../../evidence/p05/topic-source-review-01/source-before.json). All six match the author's frozen checkpoint and remain unchanged after review. The author evidence index was independently checked for exact size and SHA256 of every indexed file; the original failures remain preserved.

## Evidence and findings

- Independently written adversarial probes: **38/38 PASS**, exit 0. Shared fixture construction was copied from the author's tests and explicitly remains machine-only reviewed-format material; the production registries were never altered. Probe behavior and assertions are the reviewer's own.
- Author component and existing catalog tests rerun: **41/41 PASS**, exit 0. Focused ESLint: exit 0. Raw outputs are in [review evidence](../../evidence/p05/topic-source-review-01/index.json).
- Real `Catalog` and real file-backed `RevocationLedger`, with a controlled SQL responder, reject withdrawals appended during the last awaited catalog SELECT in both `active` and `pinned`. These tests do not use PostgreSQL and prove no database isolation or lock behavior.
- All ten full pin fields reject mutations. A JSON clone of exact historical pins selects the historical inactive map without upgrading it. Deeply frozen nested pins and labels remain immutable.
- Final synchronous source checks cover every card in the pack, including cards excluded from mapped repertoire. Wrong card revisions and unrelated card IDs do not withdraw this pack. Missing, partial, invalid UTF-8, altered observed prefix and truncated ledgers deny delivery.
- Release registry validation requires an explicit boolean `active`, permits inactive historical tuples, rejects multiple active maps for one pack, and validates raw hashes for map, taxonomy and semantic documents. Rehashing a HOLD document does not approve it. Empty actual pack registry cannot authorize reviewed-format machine fixtures.
- Static inspection confirms production construction accepts only catalog and ledger. There is no source URL/path/environment loader or synthetic bypass. The module-owned immutable release arrays remain the runtime authority. Offline validator authorization arrays are trusted tooling inputs, not consumer API input.

**No actionable product defect was found within the reviewed scope.** Both actual release registries remain empty; owner review450 stays HOLD. Imported historical exact tuples are supported by code but no genuine approved tuple is present in this release.

## Scope conditions and remaining integration gates

Callers must hold the existing shared catalog transaction lock and execute a fresh synchronous `assertCurrent` at final delivery after awaited work. The source does not provide these transaction or delivery guarantees by itself. Room taxonomy/policy pins must match the source exactly; room migration/translation and old-worker compatibility remain separate, fail-closed integration work. Startup wiring, real Catalog/PostgreSQL locking, HTTP/WS delivery, full restore and operator protection of the ledger were not proven by this review. A simultaneous rollback of the external authority and all process floors is outside this component's detection guarantee.

## Review harness attempts and cleanup

An initial preparation attempt failed because Python used a legacy Windows encoding; it made only partial excluded evidence copies and no included writes. It was repeated with UTF-8. A later cleanup verification invocation failed because that fresh shell lacked Python on PATH; the corrected invocation passed.

The first custom Vitest config mistakenly used `mergeConfig`, concatenating include arrays and starting a wider host suite. The exact owned handle `17619` was stopped with Ctrl+C, exit 1, and its raw output retained. No full-suite verdict is inferred. The config was corrected with an explicit include override and one worker: first 24 probes passed; then the extended 38 probes passed. No product change was made to obtain these results.

All temporary fixture directories were removed (verified count zero); no Docker resources were created. No included source file or another agent's journal was edited. The reviewer made no derived manifest change.
