# P05 targeted planner — independent review, round 01

Verdict: **PREFLIGHT_COMPONENT_PASS**. Reviewer `/root/p05_targeted_review` did not author or edit the included implementation. This accepts the additive pure planner operation at the exact source pins below on the dirty worktree. It does not accept P05 as a whole.

## Exact inputs and compatibility

| Input | SHA256 |
| --- | --- |
| `topic-planner.ts` | `cb68ba07f83492e7cebbdad7f0a7aa5f1a115773608d5d2f65315c942d1f6d17` |
| `topic-planner.test.ts` | `a4b28af5ef527b1293c2cb46b116448c0739bb7b47a88d8971680ef1b9583800` |
| `topic-map.ts` | `1ffd16c7c6b307ba7e92adefc45915966c916ba72d3958c1f5bad16aec10bfc4` |
| `topic-map.test.ts` | `e973118bde7d8dc45084091fb9e7a114111c329e4992e2fd9f6f30713db0ce3c` |

Sixteen exact source/fixture files were copied before executing the isolated tests. Subsequent verification found every copied byte equal to the current corresponding source. The evidence verifier also checked all 17 indexed author artifacts, including the retained initial author fixture FAIL and final 91-test receipt. Removing exactly the new targeted-operation block reproduces the previous accepted planner **byte for byte**, SHA256 `83f4b5e4bd96d3ad7d2bb00b533693fdee240a628123d983b6491bd2fc77775a`. Existing selector, replacement/replay, history readers and public scheduling code are unchanged.

## Verification performed

- **42/42 independent tests PASS**, exit 0. Independent synthetic taxonomy differs from the author fixture and includes a valid absent topic, additional mandatory secondary tags, cross-mode private semantic families, and an excluded mixed public/private family.
- Full target-pool oracle and a sole surviving candidate prove selection scans the admissible repertoire before drawing. Prior-session records from other modes eliminate semantic siblings; genuinely exhausted target pools return safe-empty. Another pair's private history does not consume the selected pair's pool.
- All requested tags must be present together. Both actors' actual exclusions apply to the full union, including secondary tags; spectator settings do not block the pair. Known unavailable targets, absent targets and missing actor preferences give safe-empty without public fallback or actor-specific reason fields.
- Six mode/context combinations preserve baseline eligibility, actor order, stage, round identity and required action consent. Six corresponding different-target/empty branches preserve every subsequent public choice, actual public release projection and released public history through session completion. This is deterministic unit differential coverage, not a statistical inference or C2 gate.
- An independent HMAC calculation checks the versioned private RNG domain, canonical sorted targets, exact scope, safety digest and pins. Input history/safety remain unchanged and returned records are frozen. No forged/narrowed replacement safety state is constructed by the implementation.
- Malformed target lists/fields/version, stale or unsafe revisions/epochs/counters, safety rollback or same-revision substitution, untrusted snapshot clones, same-epoch replay, changed-target replay, fourth attempt and terminal decline are denied. The historical untargeted exact replay remains read-only.
- **91/91 author/legacy regressions independently rerun on snapshots PASS**, exit 0. Isolated strict TypeScript check and focused ESLint both exit 0.

No open implementation finding in this component scope. Initial reviewer harness runs failed **before tests** because copied sources could not resolve workspace-local AJV and the index dependencies had not yet been copied. Both raw FAIL outputs remain. The corrected harness resolves the installed AJV explicitly and copies its actual required source dependencies; planner bytes were unchanged.

## Scope still requiring integration proof

The caller must authenticate source/history/safety, persist every returned state transactionally, bind target sets to exact encrypted authenticated idempotency records, coordinate new epochs with the conversation FSM, disclose the **complete** candidate topic union before new bilateral acceptance, and repeat consent/credential/lifecycle/TTL checks at final delivery. None of those API, PostgreSQL, lifecycle, UI or transport guarantees is established by this pure planner review. Generic public projections alone do not prove all backend error/timing/payload channels are safe.

No Docker/browser/restore test, full current-source freeze, stage acceptance, production claim, content approval or new C2/fairness claim is made. Owner review450 remains **HOLD**. The test fixture capability is synthetic only.

Evidence: [packet](../../evidence/p05/planner-targeted-review-01/input-verification.json), [independent raw PASS](../../evidence/p05/planner-targeted-review-01/independent-tests-02.txt), [91-test rerun](../../evidence/p05/planner-targeted-review-01/author-regressions-02.txt). Machine report: [JSON](planner-targeted-round01.json).
