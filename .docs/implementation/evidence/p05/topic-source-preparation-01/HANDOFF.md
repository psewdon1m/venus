# Production topic source — author checkpoint

Status: **AUTHOR_COMPONENT_PREFLIGHT_PASS / INDEPENDENT_REVIEW_REQUIRED**. Author `/root/p05_targeted_review`; included writes stopped after final tests. No self-acceptance or full P05 gate claim.

`ReleaseTopicGameSource(catalog: GameCatalog, ledger: RevocationLedger)` implements the existing `TopicGameSource`. Constructor accepts no maps, packs, synthetic flag, URL or path. `active(c)` uses the actual catalog-selected reviewed release pack and its single explicitly active release map. No map or only inactive historical maps returns null. `pinned(c,pins)` resolves the exact full historical tuple and awaits the existing catalog pinned check. Both paths perform the synchronous actual revocation-file fence after their final catalog await. `assertCurrent` verifies release membership/map provenance/full pins and denies any matching card ID+revision anywhere in the pack, including cards excluded from the topic repertoire. Missing, partial, corrupt and process-observed regressed ledgers deny.

The existing global shared catalog transaction lock remains a caller precondition through final delivery; this provider does not take a nested transaction or pretend synchronous DB consistency. Final caller fences remain required. Root server must use the actual production provider with the actual catalog/ledger and compare room taxonomy/policy pins to source pins. No translation or automatic room upgrade is supplied. Historical inactive source tuples remain loadable; incompatible old rooms remain denied until a separate compatibility policy exists.

New `approved-topic-bundles.json` is **empty**. Existing `approved-bundles.json` remains unchanged at SHA256 `fa094d45f4185ff6956ed81ede212932e08c5a56fa599b6ba691c8bcb29add3e`. Future entries require exact `{trusted,bytes:{map,taxonomy,semantic},active:boolean}`. Canonical base64 preserves the trusted raw bytes; `FrozenTopicMap.load` validates all raw hashes, reviewed non-synthetic pack bindings and full map/taxonomy/semantic approval. At most one active map per pack; zero is valid. Exact historical tuples are retained. Production uses only the immutable imported release registries. The offline validator's authorized pack set is a trusted tooling input, never a consumer/API argument.

Tests use explicitly labelled **machine-only reviewed-format trust-boundary fixtures**, not genuine human approvals. API positive tests isolate the release module export; production has no equivalent dependency argument. Both real production registries stay empty and content450 stays HOLD.

Final author validation on Node24.22.0:

- **41/41 host tests PASS**, exit0: 33 new source/bundle tests plus 8 existing catalog tests.
- Focused ESLint exit0.
- `tsc -b packages/card-catalog` exit0 and `tsc -b apps/api` exit0. The latter is a momentary current-tree typecheck, not a freeze or API/runtime gate for other writers.
- Exact six owned files copied before first tests and again before final tests. Before/after final hashes match.

Initial focused runtime 32/32 PASS; initial lint failed on unused fixture binding and package typecheck failed on undeclared fixture `.mjs`. Both raw FAILs and exact first source snapshots remain. The owned package test now uses a typed `createRequire` without suppressing compiler errors. Added the whole-pack withdrawal regression for an excluded card, then reran final 41 tests and lint.

This checkpoint does not prove actual Catalog/PostgreSQL locking, server wiring, browser/WS delivery, full restore, operator ledger protection or room compatibility. No Docker runtime proof for these new bytes is claimed. Another agent must independently review them.
