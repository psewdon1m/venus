# Own exclusion refresh03: consume successful draft handoff

AUTHOR_COMPLETE_PENDING_INDEPENDENT_AND_NATIVE. Source STOP, writes COMPLETE. Independent round02 identified a real additional P2: token reload restored unsaved b, then user removed b, Save failed, manual Refresh replayed the old preserved b. Exact counterexample now part of the existing TSX regression suite; RED1FAIL/11PASS is retained. Round02 and its FAIL review remain immutable.

Minimal source correction: after validation and current generation/identity checks, take preserved draft then clear preserved.current immediately before applying it to the fresh record. A failed read does not consume it; retry may still correctly restore unsaved own additions minus fresh permanent exclusions. A new token captures current unsaved draft again. No command/state/API/TTL/rate changes. Panel stays exact round02. Settings has exactly one extra assignment; test has one added exact nonauthor counterexample. Source revision03 is additive.

Final six relevant suites76PASS including12own-refresh controls; webtsc/lint0. Existing partial-commit409/network, no-dispatch, unchanged/new durableX draft merge, explicit submit filtering, failed-read recovery/identity/late GET/save tests remain. Actual A13 remains14PASS/15FAIL/16NOT_RUN, diagnostic COMPLETE0 and cleanup PASS. This packet is not a native/browser/stage acceptance. Root must freeze new UI/build and independently review before native proof. All1860other existing A13 paths incl API/engine/catalogue/storage remain byteexact; revision02 bytes and historical packets unchanged. No Docker or native allocation by author.

Rollback prior coherent frontend with server exclusions preserved; earlier versions retain documented UI flaws. Root owns next whole-source manifest.
