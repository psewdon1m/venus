# Independent downloader review14

Verdict: SOURCE_ONLY_ACCEPTED. No blocking finding. This accepts the isolated REL-11 operator downloader fix and its bounded component evidence, not full P07, signing or publication.

Exact source is tools/venus-operator/fetch-release.mjs SHA256b1844673f81a7ef29784832551d8d3edc4f17b2e30738f889e62099ee215cad5, LF21/CRLF0. Author final STOP/journalbe64e042... and INDEXd3675fc3... were verified. Read-only stage_inventory independently yields2102files/core36de10a9ac7b5ccbe789fae840a69227e84a8392e4a81d5c463dffbab4140929. Full inventory comparison against exact hour02 inputs identifies only this one changed file. Current commit metadata may be rebound by root after this source review; code/core applicability is exact.

## Code review

Built-in crypto.randomInt supplies bounded equal jitter: the three actual retry waits without a positive numeric Retry-After are125–250,250–500,500–1000ms inclusive. A finite positive numeric header adds0..existing exponential interval before applying the unchanged3000ms cap. A cap-saturated header remains3000ms; the existing capped-header policy is preserved. Invalid/zero/date header behavior continues through numeric conversion/default handling. No public API or injected randomness/test seam was introduced.

Both network failures and existing transient HTTP429/502/503/504 paths use this helper. Four attempts and no final-attempt delay remain. Per-file waits remain at most1750ms without a positive header, or9000ms with capped headers. Fetch timeout15000ms, exact qualified tag/origin, body limits, response cancellation, partial staging/interrupted cleanup, signature/digest/environment/schema/tag verification and final rename are untouched. The downloader does not activate or mutate the healthy service. No catch/retry surrounds validation or installation. Rollback is the inverse of this one-file tool change; no service data changed.

## Actual evidence and bounds

Author's existing Linux P06-DOWNLOAD named case actually executes1PASS/0FAIL,1435.363ms; unmatched cases are not executed. Raw output and unchanged test hash were verified. This case mocks503/Retry-After0 and confirms4requests, unpublished destination, retained partial staging, explicit interrupted-download refusal, healthyA open and0starts. It exercises the new default jitter path; it does not establish positive-header integration, a statistical randomness result, real GitHub transport or full operator-suite PASS. Those bounds are recorded rather than implying broader coverage. Scoped ESLint exit0 is recorded by author. No new tests/build/Docker were run by this reviewer.

## Runtime and delivery inheritance

Consumer Dockerfile build inputs copy apps/packages; final explicitly named tool copies exclude tools/venus-operator. The operator Dockerfile does copy this directory. Thus the new downloader is an operator payload change and is not in the consumer image or hour runtime. The exact complete inventory delta corroborates this source boundary. Existing hour02, source06 native/dependency evidence and install02 consumer behavior retain their original c2eeb909/corecde7 scopes; the hour did not test the new downloader.

All indexed children rehash: fix14(3),hour02(29),source06(11),install02(15). Hour02 remains actual local strict-hour component PASS; install02 remains actual local exact-image fixture-trust PASS. This narrow review does not substitute for their independent final audits. Additive soak-classification-correction02 is separately verified: the post-marker alert is MONITOR_UNAVAILABLE; the sole post-marker health sample is200. Original prose/seal is preserved; no in-hour acceptance changes.

The final Venus own-source archive, SOURCE-INDEX/source_revision and signed release manifest must be generated/rebound for the final new tag/core. Source06's oldc2ee Venus archive must not be labelled new exact downloader source. Root explicitly confirms existing release workflow will regenerate final assets. Future build-metadata/image identities may differ even though application inputs are unchanged; no digest equality is asserted.

Final118 decisions, two independent final pre-sign gates, exact final source/assets/CI/signature/public round trip and stage declaration remain root-owned. No production/device/network/native/content/legal acceptance is inferred. Immutable0.0.1 is unchanged.

## Preserved review attempts

A targeted path search returned exit1/no match before exact directory lookup. Initial index rehash treated install02 repository-relative file paths as packet-relative and raised FileNotFoundError; corrected path resolution rehashed all58children, exit0. No input or product changed. Author's initial wrong EOL assumption is preserved in its journal; it stopped before source write and final LF bytes were independently checked. All own writes stop after INDEX.
