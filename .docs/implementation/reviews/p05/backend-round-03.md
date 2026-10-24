# P05 backend · Independent early review round03

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:46:16.880611+00:00. **PREFLIGHT_PASS within backend code/controlled-test scope**, stage_acceptance=false. Dirty working tree;22 scoped implementation files unchanged before/after the final targeted test runs and still match when report written.

## Findings resolved

B05-001: replayed public mutation receipts cannot re-expose an old/missing/terminal/private round; committed session/revision survives redaction.3/3 independent casesPASS.

B05-002: irreversible observed-expiry deletion and monotonic clock floor prevent grant resurrection after wall-clock regression. GET validates last_sent_at and filters future rows before decryption.2/2 original negatives plus3/3 actual whole Games/private-chat dispatch casesPASS: normal delivery, backwards clock during awaited message read, expiry during awaited message read. Failed timing cases never enqueue private data.

B05-003: featureAvailable catches domain/engine content failures as unavailable; actual Catalog now normalizes only ledger.read filesystem/parser/raw-ledger exceptions into sanitized CATALOG_LEDGER_UNAVAILABLE. Database queries remain outside that normalization. Independent9/9 controlsPASS through the actual Catalog class: missing file, invalid UTF8, partial raw ledger in both active/aborted states; actual ledger-head consistency mismatch in both states; actual pg.DatabaseError still propagates. Earlier simplified plain-error fake GameCatalog controls were expanded to traverse the newly added real typed boundary; original failures remain preserved.

## Other inspected behavior

Private chat has exact current room/session/round/two-actor membership, bilateral invitation and frozen online capability; ordinary room host has no access unless selected actor. Both actors' current entry, presence/heartbeat/reservation/session and caller session are checked; final time fence follows awaited reads and synchronously enqueues under room/catalogue locks. Ciphertext16KiB/AAD and keyed request HMAC avoid plaintext in SQL/outbox/idempotency/logs; independent rate/volume/buffer/expiry and restart/revocation boundaries remain intact.1024grant capacity aborts round creation instead of advertising an unavailable channel.

Quiet public pair hides pair/card/prompt until two independent invitation acknowledgements; separate action offer remains required where applicable, private prompt/chat does not open for public pair. Safety-neutral reset aborts only a snapshot participant's running/paused game, preserves snapshot bytes and cannot resume prior high-comfort permissions. Source catalogue/production admission remain fail-closed; no draft activation was introduced.

## Actual targeted results

Reviewer adversarial17/17PASS; independently rerun author suites46/46PASS.22 implementation file hashes match before/after both commands. Actual ledger file corruption probes used only owned temporary directories, removed after each case. No full Docker/browser suite was started by reviewer. This is stronger than test-count inspection: failed reproductions and corrected cases are retained under backend-preflight-artifacts and rounds01/02.

## Remaining gate work

Root still owes actual PostgreSQL/HTTP/WS regression for stale receipt replay, catalogue withdrawal/reconcile through Rooms.emit and safety actions during ledger failure, plus current clean Docker/backend/browser evidence and independent final review. These are not replaced by controlled adapters or temporary-file probes. Human content HOLD, full P04/P05, production/media/mobile/native-zoom/topic/advice/semantic acceptance remain excluded. Root updates derived manifest after all writes. Reviewer ends writes after this handoff until follow-up.
