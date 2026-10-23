# Actual Restore06 HTTP500 — independent product boundary diagnosis

**CONFIRMED_PRODUCT_STORAGE_HTTP_BOUNDARY_FINDING — TG-STORAGE-HTTP-001 P2.** Unlike the first UNKNOWN-status failure, actual02 records HTTP500 INTERNAL_ERROR against required503, with the owned personal-chain path absent before/after. Cleanup passes and all source/producer maps match ef009/1811.

PrivateTopicPreferences directly calls external lifecycle.open/assertLive and ledger.read/narrow. Their typed storage errors and native filesystem failures are ordinary Error subclasses; app.ts preserves only DomainError statuses and otherwise returns500. Eleven exact-source inert controls reproduce this mapping, including failures at open, initial read, late read and assertLive with zero enqueued private views. Existing DomainError401/409/503 survives unchanged and unknown programmer errors remain500. The precise internal exception from actual02 was not retained; source-bound classification failure is independently reproduced.

Smallest proper repair: translate explicit storage error classes and recognized native filesystem errno only around the adapter's owned storage calls, to sanitized DomainError503. Preserve DomainError and unknown exceptions; keep auth/SQL/enqueue outside this classifier. No global FS policy, empty/cache fallback, initialization, grant renewal or durable-exclusion rollback. Initial/final/planner/taxonomy and irreversible-narrowing paths need coverage, not only the observed GET.

Raw JSON.parse in ledger/lifecycle parsers can separately throw SyntaxError. Broad adapter SyntaxError mapping could hide programmer faults; any claim covering all malformed storage needs normalization at the actual parser boundary and dedicated tests. The missing-chain repair alone does not establish that broader result.

Keep the503 test unchanged. Root's excluded candidate needs independent exact review, fresh source/build/test gates and actual restore rerun. Both failed runs remain immutable. No product/producer writes or functional Docker run occurred here; no full P05/human450 acceptance follows.
