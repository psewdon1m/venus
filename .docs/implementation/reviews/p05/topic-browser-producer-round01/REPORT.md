# P05 topic browser producer — independent round01

**CHANGES_REQUESTED: four P2 producer findings. Docker/browser NOT_RUN.** Review is limited to the advertised first16 functional cases.

Exact refreshed-static02 source895fb30/1808, browser238d2dfa/runtimec3b056f0/runner5f3fd2bf, included harness06fb5638 and exact-two-replacement derivativecbe7371b verified before/after. Full pins/copies in report.json/source. Root image00c46c7a source binding is referenced in topic-games-preflight07; no new image or browser execution occurred.

## TB-PRODUCER-R01 — case15 raw stored candidates

Actual saveConversation omits topics/candidates from StoredConversation.state and persists bindings separately. Browser case15 reads state.state.candidates.find. Exact AST probe with this persisted shape throws TypeError. Read the authenticated own offer.topics or verified binding/map instead; production persistence must not be altered to fit this producer.

## TB-PRODUCER-R02 — full union assertion

acceptTopics checks only that topic-offer-labels container is visible. Its exact helper passes with zero rendered labels while the required offer union has two topics. Compare exact current full offered labels/count for each actor and locale before acceptance. Existing zero/one accept no-prompt assertions should remain.

## TB-PRODUCER-R03 — Resume residue

Case10 runs cleared() before Resume, then checks only active state and takes screenshots, returning private_not_resurrected=true. Exact AST probe passes when Resume restores private content. Assert old private prompt/advice/chat/accept state remains cleared after Resume and a fresh UI sync/observation.

## TB-PRODUCER-R04 — stale private read identity

Runtime buffers every game GET; panel polls /current before reaching private conversation. Case14 requires only heldCount>0 and does not establish any held body contains private prompt/epoch. Exact case probe passes with one metadata response and zero private prompt responses held. Target a real successful selected-actor conversation response with old prompt/epoch, retain safe metadata/hash, clear into newer epoch, then release it and assert old controlled content never returns. Clock hold preconditions should keep WS/error state explicit so local lease expiry is distinguished from transport-error clearing.

## Other checks

Eleven independent inert VM runner cases pass: valid baseline, missing/duplicate/failed IDs, report/cleanup/page errors/overflow, source/producer drift and secret cleanup failure are handled as expected. Runner requires16 unique PASS IDs, browser cleanup PASS, no pageerrors, full source identity and final source/producer equality after cleanup. Three syntax checks exit0. Own initial semantic-probe syntax error and correction are preserved.

Semantic probes execute exact source AST with explicit doubles. They establish producer assertion weaknesses/shape error, not actual product leakage or a completed browser run. No product/producer edits. Full P05/browser/layout/device/production/TLS/restore/human450 acceptance remains unproven and outside this bounded review.
