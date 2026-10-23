# P05 private-conversation kernel — independent round 01

**CHANGES_REQUESTED · pure-module dirty-tree preflight · 2026-10-19.** Reviewer did not author or change the implementation. Scope: the two exact files below; this is not an accepted integrated feature, clean-source proof or stage gate.

| Input | SHA256 |
| --- | --- |
| `packages/relationship-engine/src/private-conversation.ts` | `fbb3715c6d6c78999594bad1324d372d6e30c89d0e79b147799f1500dac3dbf4` |
| `packages/relationship-engine/src/private-conversation.test.ts` | `490829fc144a7c3f21c889a1bb089ac74efb317ec685b65bc89f71176bd8cda9` |
| `.docs/P05_TOPIC_ADVICE_DESIGN.md` | `581c97fc564ff1a57739f563027b442a12161a044d57bb434007985838165782` |

Actual input hashes matched before and after execution. AGENTS.md and the entire design were read. Other implementation writers were active elsewhere; no unified source identity is claimed.

## Finding P05-KERNEL-001 — P1: stale withdrawal excludes a different new topic

The `other_question` command (module line 53, handler line 264) carries only `exclude_current_topics`. It lacks the intended epoch or offer reference. A delayed content-specific withdrawal is therefore evaluated against whichever offer happens to be current when the command executes.

Independent `K30-stale-other-question-must-not-exclude-new-topic` reproduces:

1. Both actors explicitly allow music and food, then bilaterally accept music.
2. Hold an old `{kind:'other_question', exclude_current_topics:true}` command from that music offer.
3. Clear the music moment, propose food, and obtain both new accepts.
4. Execute the held music command against the new state at its valid current clock.
5. Actual: success; food is added to the actor's monotonic exclusions. Expected: the stale intent cannot exclude food.

This irreversibly changes a person's room preferences for content they did not ask to exclude. It conflicts with the design's `other-question` endpoint requiring `expected_epoch` and the exact-intent consent principle. Bind content-specific `other_question` to the intended epoch/offer and reject stale or missing references before touching current preferences. A separate unconditional current/global stop can remain available for immediate safety. Add a regression covering old request arrival after a new offer receives both accepts, and preserve the original failing evidence.

Root and author were notified promptly. The author must wait for root to release the concurrent actual Docker test's source freeze before editing.

## Executed checks

- Independent actual-module Node probes: **40 PASS / 1 FAIL**, process exit **1**; the failure is the finding above. [Probe source](kernel-round-01.probes.mjs), [machine results](kernel-round-01.probes.json), [raw output](kernel-round-01.probes-raw.txt).
- Author test rerun via `npm.cmd test -- packages/relationship-engine/src/private-conversation.test.ts`: **59/59 PASS**, exit **0**. [Raw output](kernel-round-01.author-tests-raw.txt).
- Scoped ESLint of source and tests: exit **0**, empty successful [raw output](kernel-round-01.lint-raw.txt).
- Strict `tsc --ignoreConfig --noEmit` of both files with ES2023/NodeNext/strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes: exit **0**, empty successful [raw output](kernel-round-01.typecheck-raw.txt).

Independent probes include empty/default deny, one profile/ack insufficient, exact ordered actors including reversed-pair denial, room/session/round substitutions, third-actor denial, exact offer/epoch/revision/token binding, pending JSON absence of candidate/card/hash/prompt/preview/length, terminal decline, multitag monotonic exclusions, preference-change revocation, rate and attempt budgets, stale IDs/tokens/candidate reuse, advice recipient-only opt-in, delayed advice blocked across a newly accepted topic, editing/revocation, independent directional budgets, malformed Unicode/control/bidi rejection, 1000-scalar boundary, exact expiry, invalid/future/rewound clock, failed-action clock advancement, pinned content/map drift and deep input/output immutability. The two earlier author-fixed issues (reversed pair and delayed advice missing epoch) pass independent regressions.

## Integration obligations and limits

The module is additive and unexported from the package index. It does not activate any runtime route or change legacy selector/snapshot bytes. Its comments correctly require the caller to commit every returned state, including errors and projections, because discarding an advanced clock fence permits callers to discard its protection. Internal state contains private candidate and advice data and must never be serialized as a response; only the view is a client projection.

Before the full feature can pass, integration must still provide authentication and presence/current-round checks; authoritative approved pack/map and verified candidate classification; deterministic V2 selection/history/C2/fairness; room-wide durable encrypted exclusion ledger with restore reconciliation; unpredictable content-independent opaque IDs/tokens generated at the service boundary; encrypted persistence and delivery; final synchronous dispatch fencing after awaited work; epoch-bound chat upgrade and client clearing; HTTP/WS/SQL/browser races and full UX proofs. Per-moment preference seeds do not by themselves prove exclusions persist across pairs, modes or sessions. Caller state commit and restart revocation must be proven separately.

This review makes no claim about human content approval, full450 semantic review, API authorization, durable restore, free-chat semantic moderation, production, devices or full P05. The original content HOLD remains unchanged.

## Evidence integrity

| Artifact | SHA256 |
| --- | --- |
| probe source | `0c5909801cd3bec8ee5fe03988ca6cab152ccd4d30bc2301affa0561dab6d753` |
| probe JSON | `713a29b5bdd1b7498fc64acc96065de09402aa1d7deabaf9ffc204fdb55524bd` |
| probe raw | `f9c2325f6c525d0e8d600cb6c1e958260590a8191e960ba5218ed25098ed6917` |
| author tests raw | `abe2f6c51d1d8390bdd9bb251f1a204399fdb857d5c0dcd7974f5d46b690fe15` |
| lint/typecheck raw, each | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

**WRITES_FINISHED for this review round.** No implementation, manifest or other agent journal was edited.
