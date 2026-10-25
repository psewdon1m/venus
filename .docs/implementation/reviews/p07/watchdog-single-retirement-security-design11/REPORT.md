# Security design11 — watchdog boot retirement with one lease UPDATE

**APPROVE_NARROW_DESIGN. No new authorization-window or retirement-persistence blocker identified.** This is a preimplementation security design audit against5de418d7ffb6a0198616a78c6774d54beb0b2437. It is not implemented-byte/runtime/deadlock-causation/P07 acceptance. Reviewer ran no tests, Docker or build and changes no application, ROOT/C, Git, old seal or manifest.

## Exact retirement semantics to preserve

On SFU boot mismatch, capture all leases with `revoked_at IS NULL OR cutoff_pending` into boot retirement IDs rather than updating them immediately. Preserve existing early Calls.boot, protected authority clear and Cinema transport-unavailable transition. Merge captured IDs unconditionally into existing allIds together with ordinary retired/expired/pending IDs. Do not filter these captured retirees by new boot, API epoch, expiry, kind or actor. Existing whole-scope peer expansion remains. Existing valid filtering must exclude every allIds entry before returning any authority lease.

The existing final lease UPDATE, after removeBackend result, then writes `revoked_at=COALESCE(revoked_at, now)` and `cutoff_pending=!confirmed` for the complete selected set. This preserves an already recorded retirement timestamp, commits durable retry receipts on unconfirmed cutoff, and clears a pending receipt only after backend removal/quiescence is confirmed. Previously revoked/nonpending rows need no new write: their retirement/cutoff is already terminal. This is the same semantic pending set as the old earlyUPDATE followed by expired/pending selection, with one write per lease in this transaction.

## Authorization and failure-path assessment

| Path | Security conclusion |
|---|---|
| Boot mismatch while backend removal awaits | Protected authority has already been physically cleared before the await. Existing gateway/frame finalLeaseFence requires a fresh protected binding; unrevoked DB row alone cannot authorize a token/frame. Concurrent new grants/renewals/retirements retain the existing media advisory lock. No new grant appears during delayed DB retirement. |
| Successful backend removal or confirmed fallback quiesce | Final UPDATE sets persistent revoked timestamp and pending=false. Returned valid leases exclude all captured retirees; Calls scopes/Cinema stop state remain invalid. No old JWT or cached DB state can reconstruct protected authority. |
| Admin removal fails and quiesce fails | removeBackend returnsfalse. Final UPDATE still commits revoked+pending=true; watchdog returns no retired lease, future watchdog/admit reconciliation sees the pending receipt and retries. Do not throw before persisting merely to present an error, or report confirmed success. |
| Exception/SQL error/rollback before final commit | Protected authority clear is monotonic outside DB rollback, so old DB unrevoked rows do not regain access. Runtime SFU epoch/state remains old because transaction rolled back; next mismatch/pending/expiry pass recollects the same unrevoked/pending IDs. API failure is not cutoff confirmation; supervisor still has existing bounded authority/reconcile expiry/quiesce behavior. No pending state is silently reset tosuccess. |
| No boot mismatch | Boot ID set is empty; existing expired/protected-retired/pending selection, scope expansion, backend reconciliation and final publication checks remain unchanged. |
| No leases / only already-revoked confirmed rows | No cutoff work is owed; old terminal timestamps remain. Early protected clear and scope/Cinema invalidation still run on mismatch. |

The local state snapshot captured before authority clear can still contain old entry IDs. It must not confer grants: the captured boot retirement set participates in allIds removal, and final synchronous finalLeaseFence reads the fresh protected file. This is why the union and existing valid.filter are essential, not optional cleanup details.

The early Calls.boot and Cinema state writes remain within the original transaction. Later Calls ended/empty-general and Cinema cleanup predicates exclude already ended/transport-unavailable states; the proposal does not broaden cross-room operations or change room/media lock order. No broad lock weakening, generic database retry, larger deadline/pool/resource or mapping a real500 into503 is approved here. The separately reported duplicateUPDATE/FK-ownxmin deadlock explanation must be supported by engineering's actual PostgreSQL proof; this source audit makes no independent measured causation claim.

## Boundaries

Only the watchdog mismatch path changes. Other bootGate/operator prepare/retireLocked flows are not implicitly rewritten. Credential, offer18+, member/socket/session, scope/epoch/lease TTL, protected authority binding, whole-peer cutoff and supervisor admin failure behavior remain. Backup/restore/Driver/schema formats are unchanged; however current parity04 was sealed for5de and does not automatically accept new media.ts bytes. Future narrow source/runtime rebind must name the final implemented change and existing affected Cinema/Calls/restart/cutoff evidence. No automatic full recovery drill follows from this design alone.

Concrete outcome: proceed with the proposed single-retirement-write design using the full captured pending/unrevoked set and unchanged fail-closed final fences. No additional security implementation mechanism or test framework requested. Exact byte review and affected existing checks remain necessary. Stage/signing remain unaccepted. Read-only inspection commands exit0; no raw secrets/private content inspected. Own journal/input pins recorded; COMPLETE_STOP after INDEX.
