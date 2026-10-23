# Browser metadata checkpoint05 — independent round01

**CHANGES_REQUESTED: three P2 diagnostic producer issues. No browser/Docker run or product finding.** Exact authorHANDOFF667c5512/snapshot60468ff6 and all listed files verified before/after. Frontend validators and harness06fb pins remain exact. Whole source is under root edits; old895 image/runner binding cannot authorize the next run.

## METADATA-R01 — observed UI scope is overwritten

makeScope substitutes route session/round for the observed UI tuple. With a stale prior-session/round UI tuple at the same revision, the original validator correctly rejects, but validators.request_ui reports true while the separate tuple comparator reports false. Preserve exact observed tuple in request_ui/response_ui validators; label route/body self-consistency separately. Identity/transport placeholders must remain explicitly unobserved.

## METADATA-R02 — pending observers are unbounded

The completed HTTP/WS rings are bounded, but response.json jobs in pending and conversation promises are not. Five never-settling bodies with declared HTTP limit2 leave pending5. Add a separate in-flight cap and bounded conversation-observer lifecycle. Drop only diagnostic work on overflow, with counters; do not alter/cancel app responses. Resolve/forget entries on completion, cycle eviction and close, and prevent late diagnostic callback resurrection. Keep flush bounded and unfinished observations visible.

## METADATA-R03 — actual V2 frame type is lost

The dot-only type regex logs actual private_conversation_v2 as null. Use a bounded explicit known type enum including the real V2 type and applicable room/game/clear types; unknown markers/counters must not serialize arbitrary raw strings. No private payload is needed.

## Other checks and limits

Readonly loader pins and transpiles exact original topic-state.ts/presentation-clock.ts in a dependency-restricted VM and does not claim cache.accept or React auth/effect visibility. All16 original case ASTs and21 flow helpers are unchanged. Fifteen copied author delivery/privacy/timing/shape controls rerun PASS, but do not cover the three independent counterexamples above. Safe whitelist metadata and explicit observation/timing limitations are otherwise appropriate. Screenshot masking remains passive.

Old checkpoints/reports remain immutable. Fixes need new paused bytes and author-disjoint repeat review. Final source/image/runner binding requires separate fresh freeze verification; no old895 promotion, browser05 diagnosis, full16 PASS, full P05, human450 or production approval is claimed.
