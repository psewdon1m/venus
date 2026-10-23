# Targeted private topic replacement — design checkpoint

2026-10-19; `/root/p05_topic_planner`. Preparation only, before included writes.

Existing accepted planner source SHA256: `83f4b5e4bd96d3ad7d2bb00b533693fdee240a628123d983b6491bd2fc77775a`; tests `f607f9e322fefce248753ebd3b340b2977890ea93f07ceca6bf8a193ebc91992`. Topic-map files remain read-only. New ownership, after root approval: only `topic-planner.ts`, `topic-planner.test.ts` and own journal. Existing selection/replacement behavior, snapshot/attempt/history readers and old proof identity stay historical.

## Proposed API and semantics

Add `replaceTopicCandidateForTopics` with exported operation revision `RE-1.P05-TARGET-1`. Request: `{operation_revision, expected_history_revision, round_id, offer_epoch, candidate_counter, target_topic_ids[]}`. Revision must match exactly. Epoch must be strictly newer than the latest actual attempt, counter exactly +1, history/safety revisions current, private scope/pair fixed, maximum three attempts and terminal decline unchanged. Same-epoch invocation, even identical request, returns STALE; caller handles authenticated idempotency through separately encrypted exact request records. No target fields are silently added to existing attempt/history schemas.

**Targets are mandatory included subjects:** sorted unique nonempty known `target_topic_ids` must all occur in a chosen candidate's topic union. A candidate may additionally contain other subjects, but **every** candidate subject must be permitted by both actual current allow sets and absent from either room exclusion set. The subsequent offer must display the complete candidate topic union, never only the requested subset, and require new bilateral exact acceptance. For example, target music may yield music+creative if both allowed creative, and the offer discloses both; it cannot bypass an excluded creative tag.

Known targets that are not jointly permitted produce the same generic safe-empty internal planning result as a genuinely exhausted admissible target pool. No peer-specific refusal/excluded-topic error is exposed. Malformed/empty/duplicate/unknown target input is invalid request. Backend must project empty outcomes generically and not expose which actor or filter denied eligibility.

The new operation scans the complete baseline-eligible repertoire for the existing exact actor order/stage/context/comfort/class/capability, applying unconditional mixed-family exclusions, all existing exact-card/semantic room-public and pair-private history filters, actual current safety sets, then the mandatory target predicate. It never samples an arbitrary candidate and mistakes a target mismatch for exhaustion. Private soft recovery may prefer a softer nonempty subset of this full target-admissible pool; it may not change target semantics or fall back outside that pool. Empty is truthful only when the complete target-admissible pool is empty.

Use a new private RNG domain including operation revision, sorted targets, room/session/round/actors, new epoch/counter, actual safety revision/digest and existing pins. Public schedule/RNG/history, baseline max-intensity recovery and private pair scheduling stay unchanged. Selected actual candidate and old replaced disposition are committed through the same immutable exact history mechanism. No fake SafetyState, pack rewrite, public fallback or implicit consent. A no-candidate attempt is still an actual new epoch with zero consent; backend/kernel coordinates revocation before selection. No loader/HOLD activation.

## Meaningful verification

- Target only admissible candidate not equal to old arbitrary replacement; prove full-pool selection rather than arbitrary-rotate/false-empty.
- All requested tags present; secondary union tags obey both actors and are available for full offer display.
- Known disallowed peer tag, empty target pool, semantic/card-exhausted target pool => safe-empty without public fallback or safety mutation.
- Unknown/duplicate/empty target IDs, wrong operation revision, stale epoch/counter/history/safety, wrong round, public round and terminal decline => deny.
- Identical already-applied targeted request cannot replay via old same-epoch shortcut; new function strictly denies old epoch. Existing old replace replay remains read-only unchanged.
- Deterministic exact repeat from identical prestate, sorted target order canonicalization, immutable inputs, scope/stage/actors stable.
- Compare future public choices/history after different targeted choices and empty outcomes; no target/pool information in public projection.
- All three modes and both contexts, while preserving existing accepted unit suite and historical engine bytes. Actual API/PG/idempotency/final-dispatch and new targeted independent gate remain separate.

## Evidence limitation clarified

Initial earlier six FAIL/corrected PASS author raw outputs exist only as original tool outputs, not on-disk raw files. Reviewer was told explicitly; no raw logs will be reconstructed as originals. This new operation's author test outputs will be saved as new raw files under excluded targeted evidence after root approves that evidence path.
