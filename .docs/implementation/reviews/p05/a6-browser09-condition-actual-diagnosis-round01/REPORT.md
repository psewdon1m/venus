# Independent actual A6 browser case09 diagnosis

Status: CONFIRMED_PRODUCT_DEFECT; not a method timer defect, not full-stage acceptance. Read-only audit, no Docker or application writes during diagnosis.

Actual source `f5578d3423f8444e091f3452a4815933d9600b8b31f1f1bb332926605ea649e1` (1844), image `sha256:cc7d0694429f269d3fbc71b82b72fe8344eddae2de858b4b89e20fcc5505cb63`. Source/producer before/after unchanged per actual runner. Cases01–08 PASS,09 FAIL,10–16 NOT_RUN, cleanup PASS. The original FAIL is preserved; the preceding truth/dare case08 correction now actually passes.

## Exact failure

`producer/browser.mjs:235` calls invite(condition:true); its first condition, not its later edit, fails at browser.mjs:116 → request-emission.mjs:43. The exact single POST `/condition` from the secondary Turkish actor received409 with allowlisted `RATE_LIMIT`. Readiness was complete, no pending observers/body errors/overflow, and a fresh2840.523238ms lease. POST emission325943.905583ms was inside328616.276683ms deadline. Second invitation accept emitted322485.658470ms (3458.247113ms earlier). No ticket diagnostic failure. The own-actions projection advertised propose_condition=true. A fresh lease does not waive a domain cooldown; nevertheless the advertised initial action is impossible at this point.

## Proven source cause and partial commit

Frozen `apps/api/src/topic-games.ts:158` begins the private conversation on the second invitation acknowledgement. `beginConversation:135` defers truth/dare until choice but does not defer YesBut until condition; `binding:130` permits the condition-less candidate. Its initial offer sets last_offer_at now.

`condition:160` then changes condition/content_revision, clears action, applies other_question, saves it, appends a content binding and calls offer_topic. Native `private-conversation.ts:245–247` rejects the new offer within unchanged5000ms. API returns a Deferred error after saveConversation/saveRound, so `mutation:81–82` RELEASEs the savepoint (only thrown errors roll back). Thus source establishes a partial condition/epoch/binding change despite409. Actual current game_rev37 versus earlier own rev36 corroborates a persisted change, but actual encrypted DB/state contents were not inspected and are not claimed beyond source behavior.

`selfActionsValue:228` has no offer restriction for propose_condition, unlike explicit offer_topic at:229. UI `topic-games-panel.tsx:91` correctly follows the capability; case09 correctly invokes the available control and rejects non200. This is an API lifecycle/capability defect, not a reason to lengthen test timeouts or ignore409.

## Minimal correction recommendation

First private YesBut condition is required input, analogous to truth/dare choice: defer initial conversation until it exists, then create the first offer. Existing condition edits must check the shared5s/3attempt restriction plus binding cap before changing content/action/epoch. Availability must use the same rule. Do not throttle safety stop/decline/other_question/exclusion; do not relax TTLs/attempts or add browser waiting. Each changed condition must require fresh topic and action acceptance; no previous acknowledgements survive. Public YesBut semantics remain outside this correction. No new states or planner change required.

Targeted regressions: no offer before first condition; immediate first condition succeeds with one offer; early edit/API denial preserves condition, revisions, bindings, history and acknowledgements; at exactly5s edit creates new empty consent; fourth attempt unavailable/refused; actor/public paths unchanged; finish/action remain closed before private topic approval.

## Scope and limits

Delivery ring retained1024HTTP/256WS and reports dropped174HTTP/605WS. Do not call it a complete event trace. No hidden response retry, source change, timestamp forcing or additional run was performed. Report pins exact raw files rather than rewriting them. Root owns durable actual archive and any rerun after independently accepted correction. This review establishes the specific defect and safe correction direction, not full P05 PASS.

Commands: two read-only Python JSON/source inspections exit0; initial rg Windows wildcard query exit2 and second query exit1 (literal wildcard/path mistakes), followed by exact-path reads. These query failures changed no source. Writes COMPLETE.
