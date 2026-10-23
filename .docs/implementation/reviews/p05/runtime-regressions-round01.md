# Fresh Games/lifecycle regressions — independent evidence audit

Result: **BOUNDED_FRESH_REGRESSION_EVIDENCE_PASS**. The new Games20 and lifecycle16 runs are bound to the current frozen source; no historical-source PASS is silently transferred. This audit is not full P05 or ordinary WebSocket/browser acceptance.

Shared source identity: `1d4de7ebb897bcd93f76e66f966650dfbc3b6d9c378da352dbb3a926faedf143`, **1803 files**. Both before/after inventories match one another and independently recompute that identity. All entries of the shared source ZIP are verified; ZIP SHA-256 `b7641a3c6d2351894089bcfb869e5d6d59911ea9a461d1b80d9a6540c15a3910`. A fresh current inventory also matches. [Selected producer/product pins](runtime-regressions-round01/pins.json) are captured from that ZIP.

| Fresh packet | Actual cases | Image | Owned project |
| --- | ---: | --- | --- |
| Games preflight06 | 20/20 PASS | `3e253902de3a3d1bf23f1f9c494fb7e970aa83f634d6e29ceb9debf1322e277a` | `venus-topic-games-87aaf0916327` |
| Lifecycle preflight03 | 16/16 PASS | `c13099f5d8ba967cc7a14d0d2b3a92c2358071098f345a2a325705614bfbb9d7` | `venus-topic-lifecycle-b951d60c37f2` |

All **19 + 19 indexed artifact hashes/sizes** and both packet index fingerprints are verified. Games index: `394274d21bdf01344145da21761a54647e325882bbba233011a63240248644c7`; lifecycle index: `f9ff2b05b82c10037407cf7045b9321884fd6c71ab58db616485400eeb5949ca`. Receipts record fresh terminal handles24648/81132, exit0 and cleanup completed. Reports require exactly the expected unique IDs; raw final summaries and orchestration gates agree. Live read-only image inspections confirm both retained image IDs.

Both are explicit **test-image integration commands**, `node tests/p05-topic-games/integration.mjs` and `node tests/p05-topic-lifecycle/integration.mjs`, not the ordinary production server CMD. Their image/command/user/1CPU/768MiB/read-only/internal-network settings match the packets; the sole API bind is the artifact output directory. Runtime producer scripts are included and pinned in the shared archive. Build caches do not change this binding: both builds expose the same application config/manifest with different attestation manifests, and the actual test commands ran in fresh distinct PostgreSQL projects.

## Scope and negative checks

Games20 retains declared synthetic content, safety/lifecycle and websocket-adapter fixtures. Its raw diagnostics contain only the expected guard-error classes observed in the named negative controls: stale conversation/offer, locked choice, missing topic consent, scoped idempotency conflicts, wrong mode, inactive round, actor/proposal/revision/credential denial and unavailable conversation. In particular seven `IDEMPOTENCY_CONFLICT` diagnostics correspond to exact-target/body/operation rejection controls; successful exact retries and unchanged stored state have their reviewed SQL assertions. The final report remains 20 PASS; expected exceptions are not mistaken for suite failures or ignored unexpected crashes.

Lifecycle16 uses actual PostgreSQL, HTTP, protected Linux allocator/lifecycle/registry and the real preference/planner safety provider. Synthetic content/card/topic source remains explicit; the harness also supplies its named policy pin, injected clock and SQL fault controls. It does not exercise the ordinary production release-profile factory. Reviewed negatives cover missing external birth without initialization, protocol immutability, old encrypted preference-row rollback, a real SQL failure after durable exclusion/revocation, legacy transport/AAD separation, restored stale member/session denial, corrupt/missing personal storage while retaining safety operations, preserved retirement timestamp and maintenance cleanup, isolated room/member/session row restoration, final credential wait/expiry before narrowing and private enqueue, and boot revocation with history/exclusions retained.

Lifecycle stdout deliberately contains only the final summary; it does not provide an individual raw exception trace for each negative. Its assertions, mandatory fixed case list, zero terminal exit and complete report support those named controls. The boot control invokes the real barrier against PostgreSQL; it explicitly does not simulate a process restart. Row rollback/restore controls explicitly do not claim full `pg_dump` restore or an unknown-COMMIT network fault. Presence preparation uses real HTTP tickets plus direct `Rooms.connect`; it is not ordinary websocket transport proof.

No product or producer files were edited by this reviewer. No Docker test/runtime rerun was performed for this audit; only read-only image/resource inspections supplemented source and artifact verification. Prior source-specific packets and reviews remain immutable.

## Cleanup and remaining gates

Archived cleanup inspections carry the correct distinct project labels. Fresh queries found no remaining containers, networks or volumes for either project; both generated secret files and their temporary parents are absent. Source equality and retained images permit exact follow-up checks without claiming newer code was tested by an older result.

No new blocking evidence finding was identified. These fresh regressions support the named current-source components after server/router/final-source-fence changes. They do not accept ordinary WS observation/cookie/browser behavior, already displayed content clearing, positive V2 serving with owner-approved content, a cross-mode semantic-family canary, full restore/rollback/old-volume upgrade, final full-quality/CI or the complete P05 gate. Human review450 remains HOLD.

Packets: [Games06](../../evidence/p05/topic-games-preflight-06/index.json), [lifecycle03](../../evidence/p05/topic-lifecycle-preflight-03/index.json). Own audit: [verification](runtime-regressions-round01/verification.json), [fresh current-state check](runtime-regressions-round01/current-state-verification.json), [index](runtime-regressions-round01/index.json). Journal: [reviewer journal](../../../../.history/agents/2026-10-19-p05-topic-games-review.md).
