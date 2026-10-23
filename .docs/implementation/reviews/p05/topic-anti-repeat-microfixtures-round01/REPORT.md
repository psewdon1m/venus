# TG-AR-001 — empty private opportunity loses previous-pair anti-repeat state

**P2 / OPEN product finding. CHANGES_REQUESTED.** Deterministic source-bound pure planner counterexample; no statistics, PostgreSQL/HTTP proof, Docker run or product edit. The reviewer has not authored or accepted a fix.

Current frozen source `895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04` /1808 inputs; topic-planner.ts SHA256 `cb68ba07f83492e7cebbdad7f0a7aa5f1a115773608d5d2f65315c942d1f6d17`. Exact source snapshots and isolated transpile inputs are indexed. The actual production selector, snapshot/history validators, hard eligibility and frozen map/pack execute in the isolated module namespace; no selector predicate or RNG is replaced. AJV imports resolve to the same workspace dependencies. Fixture/provider objects are explicitly machine-only; no approved registry or450 decision changes.

## Minimal counterexample

Run prepare.mjs, then probe.mjs --minimal from the repository root with Node24.22.0. Prepare exits0; minimal probe exits1 for the violated invariant. Exact literal seed `venus:P05-ANTI-REPEAT-DIAGNOSTIC-1:0`, SHA256 `49ff37ad20f9968aceee5676a4b17c7f44710cf84163db5a70c5d993a1edb509`.

N3, allfriendship, comfort4, questions/in_person, capabilities[], R40, current contextfixture2. Players have IDs ending0001/0002/0003; actual production baseline/mode/context guards remain in effect.

1. Start with empty own topic allow sets, exclusions empty, safety revision1. Disclose selected public rounds through the real recordTopicOutcome; no public planning rows are skipped or fabricated.
2. Round26 is the first private opportunity for actors0002/0003. It has a null candidate as required by empty allow. This still consumes a private round but appends no private_history record.
3. Before the next decision, expand all three own allow sets to creative/music/romance with safety/member revisions2; exclusions remain empty. This is an explicit validated pure safety-state update, not an HTTP/lifecycle authorization claim.
4. Public rounds27..31 intervene. Round32 selects actors0002/0003 again, now with Q-1112. Before this decision private_history remains empty, yet both alternative unordered pairs0001/0002 and0001/0003 each have25 allowed, hard-eligible, unused semantic families after public-history filtering. Private budget remains.

Expected strict original predicate: this selected private pair must differ from round26 because another effective unused admissible pair exists. Actual predicate sees previous=undefined and repeats it. The raw minimal result includes every preceding round, actor pair, candidate, safety revision and history count, plus alternative repertoire counts.

## Source and authority

P03-M3 protocol line168 defines previous pair as the most recent private round, even with public rounds in between, and requires zero repeats when another hard-eligible unused pair and budget remain. The sampler line28 and tests/p03/planner-diagnostics.mjs line11 retain the same rule.

Current topic-planner.ts line291 reads `history.private_history.at(-1)`; line312 records a private row only if a candidate exists. These distinct predicates coincide in nonempty legacy paths and diverge on empty V2 private opportunities. A card receipt/history row is not a complete opportunity log. The public schedule and later candidate acceptance need no corruption for this pure selector counterexample.

A predeclared fixed diagnostic grid0..15 retained all outcomes:9 strict invariant FAIL,6 no-repeat controls PASS,1 no-second-opportunity prefix. These counts are diagnostics only, without a random-sampling or population-rate claim. The minimal index0 run independently re-executes the first fixed input; it is not a replacement measurement seed. Initial own adapter dependency-resolution error is preserved separately; only the import resolver was fixed. Final independent alternative oracle explicitly checks map.allow, hard eligibility, public semantic history and full topic union under every actor's allow/exclude; there are no prior private records to subtract.

## Recommended versioned repair and verification

Retain the strict zero-violation rule. In a prospective algorithm/source revision, derive the preceding private opportunity from a validated complete opportunity history, including null candidates, declined/replaced attempts and intervening public rounds. Keep opportunity identity distinct from content/semantic records. Derive the alternative predicate from unused admissible candidates after topic/full-union/semantic/remaining-budget guards; retain baseline-only alternatives and last history-bearing pair as diagnostics, not normative substitutes. Preserve public schedule separation from secret exclusions/history.

Bind any changed scheduling algorithm to a new engine/protocol revision and ADR/compatibility record before measurements. Preserve old frozen inputs/proofs and historical snapshot bytes. Explicitly define whether old active snapshots continue under their pinned supported reader or are quiesced; unsupported revision must fail closed. Preserve room safety/semantic ledgers and monotonic exclusions. Do not reset old history into fresh grants or reinterpret snapshots under a new algorithm.

Rollback: stop new starts for the new revision, revoke its current private epochs/grants/advice, retain durable safety/history floors, and use only a reader explicitly compatible with the stored revision. A known defective older algorithm cannot be relabelled as satisfying the strict gate. Fresh starts may require operator-selected compatible rollback policy; no old private moment revives.

Required independent repeat after fix: this exact seed0 case; the full fixed16 grid with missing opportunity retained; unchanged nonempty and N2/no-alternative controls; empty-opportunity with public intervening rounds and own allow expansion; baseline/effective disagreement diagnostics; declined/replaced attempts; topic-empty and exclusion contexts; semantic prior-mode/session isolation; public counterfactual projection/seed independence. Then repeat affected source/unit, Games/lifecycle/runtime/chat/WS/browser components on the new exact source as applicable and only afterward freeze preregistered statistical inputs. No samples, thresholds or support are reduced to obtain PASS.

This packet proves an actual deterministic planner invariant violation at the stated inputs. It does not prove a consent leak, delivered private text, HTTP reachability, statistical fairness failure or full-stage outcome.
