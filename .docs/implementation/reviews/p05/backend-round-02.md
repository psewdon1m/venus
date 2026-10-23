# P05 backend · Independent early review round02

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:43:46.473247+00:00. **CHANGES_REQUESTED**, stage_acceptance=false. Current dirty candidate; scope unchanged plus newly added room Games feature indicator.

## B05-001 and B05-002 · Resolved in dirty source

Stale public mutation receipts now retain original session/revision but redact current_round unless exact current active round/card/consent remains valid. Same3 reviewer casesPASS. Chat now has monotonic clock floor and irreversible observed-expiry deletion; current2 original clock negativesPASS. Whole Games dispatch exercised with real PrivateChat.view and mocked only persistence adapters: normal clock returns decrypted synthetic message; backward clock and consent expiry during awaited message query both reject with no enqueue. All3 whole-dispatch controlsPASS.

## B05-003 · P1 · Feature indicator can abort safety and catalogue reconciliation

New Rooms.view awaits Games.featureAvailable from emit. That helper is reached inside Games.bump/save and every room mutation. Its uncaught content-availability failures therefore roll back stop/setup-clear/leave rather than merely indicating unavailable Games. During actual Catalog.reconcileLocked, withdrawPacks→bump→emit occurs before catalogue state ledger_head is advanced; checking catalogue consistency there observes intentionally temporary old-DB/new-ledger mismatch and can abort reconciliation itself.

Initial reviewer active/aborted DomainError controls bothFAIL. Root added catch DomainError/EngineError, after which those2PASS. Broader actual ledger errors remain uncovered: RevocationLedger.read throws plain Error from requireCatalog (CATALOG_LEDGER_*), filesystem ENOENT/EACCES, and TypeError for invalid UTF8. Reviewer controls for plain partial-ledger Error, ENOENT and fatal UTF8 TypeError currently3FAIL. Real pg.DatabaseError control correctly propagates; swallowing transaction-aborting SQL errors would be wrong.

Required: feature projection must convert catalogue/trust/file failures to unavailable without weakening actual start/pack/dispatch authorization; actual database transaction errors must remain errors. Independently repeat all6 feature controls and verify a real PostgreSQL withdrawal/reconcile plus safety mutation when catalogue consistency fails. Root is preparing actual PG regression; not yet accepted here.

## Evidence and limits

Author targeted suites independently rerun44/44PASS before this latest feature addition; they did not cover identified negatives. Current reviewer suite has11PASS/3FAIL solely for remaining actual-ledger error classes. Original FAIL attempts and implementation fixes remain preserved. No actual full Docker/final clean source proof or P04/P05 acceptance. Content HOLD, not-implemented topic/advice/semantic/native-zoom/mobile boundaries retained.
