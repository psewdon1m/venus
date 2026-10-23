# P05 backend · Independent actual PG/HTTP evidence review round04

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:57:01.690230+00:00. **PREFLIGHT_EVIDENCE_PASS**, stage_acceptance=false. Scope: B05-003 real PostgreSQL/filesystem regression and B05-001 internal HTTP replay. Latest measured dirty-source identity `c84d449d1b91a5bedc02929c0f755811133fc829d5c5e3814ae045dc796c7467`, base HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70`. This is not clean-source/full-stage acceptance.

## Actual attempts and implementation binding

First catalogue attempt venus-p05-36047ab17e5a has6PASS/1FAIL: its withdrawal mutation committed, but test wrongly expected aborted public dispatch to throw. The actual contract returns an aborted clear-only view. Root corrected that assertion; second attempt venus-p05-a99542353ce1 has7/7PASS. Both original FAIL and correction are preserved. Root then added a distinct eighth actual HTTP case; latest venus-p05-a0f200908fa2 has8/8PASS with zero skipped/cancelled. Old7-case proof is not used as proof of the new case.

All3 attempts have matching before/after included maps, recomputed identities, source_unchanged=true and cleanup completed; all explicitly dirty/preflight. Reviewer inspected actual test bodies and raw reports/logs. Seven relevant source files independently read from retained latest image `sha256:b1dc0fa22f8b91bf253bb7938815f6dd03c327058a355b6a1179ee12b48fed56` match latest measured input hashes and current bytes, including production Rooms/Games/Catalog/private-chat and exact8-case test. The image audit used an owned nonroot/read-only/network-none --rm container; absence confirmed. All3 original test projects' containers, volumes and networks independently absent; no foreign resources removed.

## B05-003 actual coverage

Production service classes execute against actual PostgreSQL and owned ledger files. Missing file, invalidUTF8 and partial ledger do not roll back emergency stop; room outbox commits Games unavailable, while actual Catalog.active still rejects. Neutral clear commits abort, neutral preference and unchanged original snapshot. Leave commits removed membership and denies old socket grant. Withdrawal performs actual durable ledger append and commits affected-game abort/snapshot clear through the temporary old-DB/new-ledger head mismatch. Public dispatch returns only aborted/null-round state. Restart-style reconciliation applies externally appended durable intent, synchronizes ledger head and repeated reconcile does not revive the game.

The boolean catalog_new_start_fail_closed in the3 stop records is backed by direct Catalog.active rejection. These cases do not invoke a separate new HTTP game start while the ledger is broken; this precise boundary is retained.

## B05-001 actual HTTP coverage

The eighth case starts real Fastify on internal loopback plainHTTP with real PostgreSQL/encrypted idempotency. A controlled group-only synthetic pack guarantees an original public advance receipt. After committed stop, replaying the same advance request returns the original session/revision with current_round=null. This closes the actual transport/idempotency lifecycle regression gap. It does not itself exercise quiet public-pair two-accept presentation, TLS, browser cookie policy or WS byte privacy; earlier independent pair-specific controlled regressions and later browser/transport cases retain their separate scopes.

## Other results and remaining gates

Reviewer independently reran durable actual-ledger feature unit suite7/7PASS. Root raw complete JS log reports127/127PASS and lint log contains no lint errors; reviewer inspected these as root-produced evidence, not an independent rerun of all127. New reviewed inputs still match the latest8-case run hashes when this report was written.

No new actionable implementation finding. B05-001/002/003 fixes remain resolved in current component preflight. Final clean Docker/backend/browser matrix, exact source freeze/manifest and final independent gate review remain pending. Full P04/P05, human card approval, production, media/mobile/native zoom and not-implemented topic/advice/semantic scope are not accepted. All failed attempts and newer results are preserved under backend-round04-artifacts. Reviewer ends writes after handoff until follow-up.
