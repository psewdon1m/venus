# P05 private-conversation kernel — independent round 02

**PREFLIGHT_PASS · pure-module correction review only · 2026-10-19.** No open findings in the reviewed kernel scope. Reviewer did not author or edit implementation. This does not accept an integrated topic/advice feature or the full P05 stage.

| Input | SHA256 |
| --- | --- |
| `packages/relationship-engine/src/private-conversation.ts` | `57d33ce1af14b4a3a69979a004a7c7122e529f2420ce99cb678089361120ccfd` |
| `packages/relationship-engine/src/private-conversation.test.ts` | `cb77d6b23143e75f5df10bdb10f303f80e2871f40c9c7097b5be64104e9dc1db` |
| `.docs/P05_TOPIC_ADVICE_DESIGN.md` | `581c97fc564ff1a57739f563027b442a12161a044d57bb434007985838165782` |

Both implementation/test identities matched before and after execution. The author correction journal was read. Comparison with the SHA-verified old module in the archived self-actions preflight source shows exactly the intended change: `other_question` intersects `OfferReference`, and its handler checks intended offer ID, epoch, proposal revision and opaque token before changing the current topic. No other kernel logic changed. Review writes stayed in excluded review artifacts and the reviewer's own journal during the unrelated diagnostic Docker source freeze.

## P05-KERNEL-001 — closed for these exact kernel bytes

The original [round01 CHANGES_REQUESTED](kernel-round-01.md), [failing probe JSON](kernel-round-01.probes.json) and [raw failure](kernel-round-01.probes-raw.txt) remain intact. Their SHA256 values still match the original handoff.

An old music `other_question` can no longer exclude or clear a new food offer. Both `exclude_current_topics=true` and `false` require exact intended references. A missing reference or a mismatch in any of the four fields returns `STALE`. Tests compare complete serialized state at the same current time: new preferences, acknowledgements and both pending/accepted advice remain unchanged. Time advancement can still update the clock fence and expire grants before a stale action is rejected; that fail-closed behavior is intentional.

The same protection holds while the replacement is pending, has one acknowledgement, or is active with pending/accepted advice; after old-offer expiry and a later new bilateral acceptance; and for the original missing-reference request shape. Correct current references still clear the old prompt/advice and, when requested, exclude only its actual topics. An independent unconditional `stop` still closes the current moment without requiring an offer reference.

## Executed evidence

- Independent actual-module Node probes: **86/86 PASS**, process exit **0**. [Source](kernel-round-02.probes.mjs), [JSON](kernel-round-02.probes.json), [raw output](kernel-round-02.probes-raw.txt). This includes all 41 round01 controls adapted only where positive requests require the corrected exact-intent contract, plus 45 new correction controls.
- Author unit rerun: **68/68 PASS**, exit **0**. [Raw output](kernel-round-02.author-tests-raw.txt).
- Source/test scoped ESLint: exit **0**, [empty successful raw output](kernel-round-02.lint-raw.txt).
- Source/test strict ES2023/NodeNext `tsc --ignoreConfig --noEmit`, including noUncheckedIndexedAccess and exactOptionalPropertyTypes: exit **0**, [empty successful raw output](kernel-round-02.typecheck-raw.txt).

The broader independent controls still pass: default deny and empty choices; one profile/ack insufficient; exact ordered pair/room/session/round and outsider denial; exact candidate/pins/offer/epoch/revision/token binding; no pending card/hash/prompt/preview/length; terminal decline and immutable exclusions; attempt/rate budgets; advice recipient-only opt-in, old-epoch denial, editing/revocation and directional limits; Unicode/control/bidi boundaries; exact expiry and clock rewind/future denial; defensive copying and deep freezing. Source audit found no additional confirmed defect in this pure-module scope.

## Scope still requiring integration

The module remains unexported and unintegrated. Acceptance here proves only the pinned pure state machine and projection behavior. It does not prove authentication/presence/current-round ACL; approved content/map classification; durable room-wide exclusion ledger or restore; V2 planner/history/C2/fairness/public inference; encrypted persistence; final synchronous HTTP/WS delivery after awaited operations; chat epoch upgrade; or UI/DOM/browser races. The caller must commit every returned advanced state, serialize only client views, generate opaque content-independent service IDs/tokens and seed exact current safety preferences. New runtime routes must preserve these constraints under real concurrency. Legacy snapshots/engine remain unchanged. Human content HOLD and the full feature's pending status remain unchanged.

## Artifact integrity

| Artifact | SHA256 |
| --- | --- |
| probe source | `fd317038cd7bba938f7b8ead753aeac6f3295b07f376304d3116b91a1ac4fc26` |
| probe JSON | `9c1253c2054b7cdf922db23d0f5dde4d8cd2ee8304b6d509e8d1132ff759fb74` |
| probe raw | `f563869f49db2c26694c906b857ed17c481184ecd2ef1d9b42088e3a784000f7` |
| author tests raw | `3b5cae9c7d8b499314de5b221e8313b165ec0aa09807f951d6d5ced97b87d40b` |
| lint/typecheck raw, each | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

**WRITES_FINISHED.** No implementation, manifest, original report or other agent journal was changed.
