# P05 chat producer — independent static round04

**STATIC_PRODUCER_PREFLIGHT_PASS. No new findings.** Reviewer `/root/p05_topics_ui` is independent of producer author `/root/p05_topics_ui_review`. Product/producer untouched. Docker/PostgreSQL execution **NOT_RUN** by reviewer. This accepts the corrected producer for another actual run; it does not overwrite the prior actual failure or prove full P05 acceptance.

Frozen checkpoint04: integration `3716f7da3c17bfae46f4ba1b011ec287edeb5b2d0037a1c1452c7ec25bd373fb`, runner unchanged `c77b72308b42dc3262c55015afa1793c31cdfc8d5396a03ec515627a4c6da8e4`, DESIGN `516651c7855b8936c816bf4538f048b3f318a61b677b62a2ec483be31f656f75`. Author HANDOFF hash `26a6dddfdb705e779c27a783611e06c425f8d839759181c66e370af58dd02459`. Exact11 copies/pins in `source/` / `inputs-before.json` remained equal through review. Final full inventory equals root freeze `895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04`,1808files.

## Corrected runtime precondition

Root's first actual run reached cases01–09PASS and failed case10 when the legitimate30-second pending action deadline expired across calendar-minute advancement; cleanup completed and the failed packet remains archived separately (`858cf94…`). This is a producer precondition correction. Current product TTL/authorization/lifecycle bytes are unchanged.

Only cases09/10 call `acceptClockWindowAction()`. It requires an action-consent round, reads each actual actor's current `/target`, requires live pending/active offer and future server-relative ISO expiry, and posts fresh requestID plus that actor's current exact offerID/proposalRevision to `/response` with kindaccept/scopeaction. It requires two real accept posts, then active action deadline and both actors' accepted current projections. No TTL assignment, SQL auth/lifecycle seed, direct acceptance or hidden fixture grant appears in these helpers.

Both cases capture action/server-clock/invitation/actual encrypted conversation-parent expiry metadata before and after the calendar boundary. They require action still active and unexpired; action/invitation/conversation-parent deadlines must be exactly unchanged. Case10 captures game/room revision baseline **after** the explicit action accepts, so later stability assertions refer only to chat. Case01 and its fresh/private-admission path are byte-identical AST to checkpoint03 and do not call this helper; the intended positive chat path with pending action is preserved. The upcoming runtime must substantiate these paths; static VM probes do not replace real HTTP/PG observations.

## Independent checks

- **29/29 new exact-AST probes PASS, exit0**.13action-helper controls cover fresh bilateral accept, missing/expired/malformed offer, wrong offer/revision propagated HTTP refusal, second-actor failure, already accepted actor, non-action fixture, inactive/expired post-accept state and incorrect own accepted projection. The success control observes two distinct current actor POSTs/fresh requestIDs and four target reads. Metadata helper observes actual stored fields without mutating input. Both exact case09/10 functions accept valid clock windows and reject pending/expired action or extension of action/invitation/parent deadlines. AST comparison verifies only09/10 call the helper, every prior unrelated helper/case remains equal, and baseline10 follows acceptance.
- **13/13 unchanged runner controls PASS**, including final source/producer drift and missing/failed cleanup rejection.
- **19/19 existing GET/integration checks PASS**; **24/24 GET+POST selector/rollback-assertion checks PASS**; **14/14 capless20-round controls PASS**. These are exact-source inert control-flow checks, not actual database runs.
- Node24 syntax integration/runner both exit0; scoped ESLint exit0. Exact11 input hashes unchanged; final source identity matches root freeze.

Own initial case10 positive fixture returned a native-realm message array to a VM-realm deepStrictEqual comparison; the positive baseline failed despite equal values. Its exact initial script/raw/JSON are retained. Reviewer corrected only the inert fixture to parse its synthetic response in the same VM realm, then reran all positives/negatives. No producer defect was attributed to that reviewer-fixture failure.

Raw scripts/results/exit files are included. Previous static rounds and actual failed evidence remain immutable. Root may now coordinate the corrected actual12-case run and assess cleanup/source binding; browser producer's separate AUTHOR fixes still need their own independent acceptance and RUN ACK. Browser/TLS cookie, production/DNS/TLS, clean-source/full P05 and human450 approval remain outside this review.
