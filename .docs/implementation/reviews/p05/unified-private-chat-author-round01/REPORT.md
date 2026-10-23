# Unified private text chat — V2 author handoff

**IMPLEMENTED_HOST_CHECKS_PASS; INDEPENDENT_REVIEW_AND_ACTUAL_DOCKER_PENDING.** Author is not an accepting reviewer. Owner authorized one private text chat in online and in-person rooms; root records U-018/ADR-025 and explicitly authorized the narrow V2 planner policy change. No P04/P05 stage or production acceptance is claimed.

Exactly nine included source/test files changed. `source-pins.json` contains exact before/after SHA256, byte sizes and line-ending counts; `source-diff.patch` and byte-identical `source/` copies make the change reviewable. Previous current input identity was ccdd40b5/1816. The orchestrator must calculate the new whole-source identity after all writers finish; this packet does not manufacture one from a subset.

## Behavior

- New V2 snapshots receive `private_text_chat` when the operator backend flag is true, for either real meeting context. Existing snapshots are never expanded or rewritten.
- Every V2 `pair_private` now requires both that frozen capability and the currently enabled backend. The in-person bypass is removed from the shared transport guard, including the start and final delivery paths. Chat also requires equality of the actual room and frozen snapshot contexts. Actor/consent/epoch/presence/source/TTL/quota/final enqueue checks remain in place.
- V2 planner options exclude private opportunities without the frozen capability before preflight/Start/advance. Public safe cards remain selectable. This closes the otherwise possible in-person flag-off availability-success followed by a random private-round503. Legacy `engine.ts` eligibility is unchanged.
- Snapshot private policy is explicitly `ROOM-TOPIC-2`; algorithm remains `RE-1.P05-TOPIC-2`, recovery35% and random functions/seed/consent30/180s remain unchanged. Existing immutable snapshot validation and startup boot gate reject unsupported former policy. Boot revokes transient private objects before processing headers; old snapshot ciphertext/history is not upgraded or erased. A room containing an incompatible started prior session can refuse a new start; using a new room is the explicit safe path, not resetting prior history.
- UI reads and renders the same existing V2 private chat in either context, keeps the in-person/online marker visible, and uses the same captured conversation/epoch POST and safety/clear handlers. No room context is renamed or inferred.

The external personal preference authority digest in `topic-runtime.ts` still uses its existing `ROOM-TOPIC-1` policy. It describes the unchanged allowance/exclusion ledger, a different binding from the snapshot transport policy. This author did not reset/reprovision room authorities or change their monotonic safety rules.

Legacy V1, cards/texts/IDs, fixtures, ADR/history/registry, message formats, retention and capability filters were not edited by this author. The context-fixture unit suite was relabelled to clarify that its historical raw card eligibility is not V2 transport permission; its assertions and synthetic card bytes remain unchanged.

## Tests and preserved attempts

Pinned Node24.22.0. Initial targeted run: exit1,143 PASS/one FAIL caused by the author's new UI test expecting `conversation` while the existing fixture correctly returns `c-s`. Corrected that expectation only; raw FAIL retained. Corrected five-suite run: exit0,152 PASS. A subsequent prior-history refusal assertion is included in the final full-suite result.

Final full existing host suite with explicit absolute PYTHON: **exit0,57 files/846 PASS/208 Windows platform SKIP**. Full TypeScript API/engine build plus web typecheck exit0. Final lint over all nine changed files exit0/zero warnings. First lint exit0 had one now-removed unnecessary React callback dependency warning; both logs retained. Existing Docker integration JS syntax check exit0. Exact commands/results and raw logs are included; no Docker or browser execution was performed.

Meaningful checks include both-context chat receipt/retry positive controls; both-context flag/capability/current-context/actor/invitation/topic/expiry/preference/boot/epoch negatives; final awaited credential rechecks; new-round pre-write refusal and post-write flag-off fence; old in-person capless snapshot non-expansion; six capless20-round preflights across modes/contexts; positive declared in-person fixture; explicit former-policy rejection/boot behavior and prior-error propagation without replacing history; in-person UI send/context marker/disconnect clear.

Existing `tests/p05-topic-games/cases.mjs` TG05 now executes both contexts with actual snapshot capability assertions, one-topic-ack denial, outsider GET/POST denial, advice opt-in/edit/revoke, actor chat projection, stale epoch rejection, operator-off permission/replay denial, re-enable non-resurrection and unchanged snapshot ciphertext. Its real PG/HTTP execution is **NOT_RUN** here. The suite retains exactly20 fixed TG IDs. Lifecycle16 source/harness is unchanged: it already creates current V2 policy snapshots with backend true; no obsolete in-person-unavailable or former-policy expectation was found in that included suite. Runtime execution remains pending.

## Root execution and review handoff

After independent source review and final source freeze, build the one new pinned Docker image, then run the existing isolated Linux producers with their existing ownership/resource/cleanup wrapper:

1. `node tests/p05-topic-games/integration.mjs` — Games20, updated TG05 both-context parity.
2. `node tests/p05-topic-lifecycle/integration.mjs` — lifecycle16 with real external safety authority and current snapshot policy.
3. Rebind the ordinary WS producer to these exact current source/image pins and execute its affected ACL/final-fence controls. Its manual Cookie/synthetic source qualifications remain explicit.

The two included producers require `VENUS_P05_ISOLATED_FIXTURE=1`, `DB_HOST`, `DB_PASSWORD_FILE` and `P05_ARTIFACT_DIRECTORY` in their existing Linux Docker profile. Password is read from the mounted secret file; never copy it into reports. They create the TopicGames backend with an explicit enabled flag as a named test seam. This is not proof of the ordinary production CMD with a human-approved release pack. Inspect exact reported IDs/counts/status/exit and owned cleanup; do not accept process exit alone. Root owns the container profile and actual RUN authorization; this handoff supplies no ACK or cleanup instruction for another attempt.

Historical excluded producer `.artifacts/p05-topic-chat-policy/integration.mjs` TCP02/03 asserts the former in-person-unavailable policy. Do not mutate its old proof or execute it unchanged as a new-policy acceptance test. Root elected to use the updated included Games20 parity instead of manufacturing another12-check label. Historical METHOD17 3PASS/04FAIL/12NOT_RUN, old OCI/R100 runs and proposed statistics/layout producers remain their own scopes; this code change does not accept them. Any later run needs a newly reviewed current binding. No additional test framework, full-corpus workload or seed search was introduced.

Root/another agent must independently review these exact nine files and execute the appropriate actual local Docker checks. Human content HOLD, final P04 candidate/C2, V2 three-engine UI/layout proof and final EXIT-P05 acceptance remain outside this author PASS.
