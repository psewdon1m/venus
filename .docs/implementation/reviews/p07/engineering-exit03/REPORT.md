# Independent engineering review03 — narrow application fixes

Verdict: SOURCE_ONLY_ACCEPTED. Aggregate P07 remains unaccepted until actual clean preflight/soak/final delivery. Reviewer did not author either fix. HEAD is dcf2d7088a7a30b586a8c6be10138d80dda51d5e with explicitly dirty reviewed changes; byte hashes are bound below. Prior engineering01/02 reports and sealed journals are preserved.

## Checked-out PostgreSQL client failure

The3added production lines attach one durable client error listener on the pool connect event. In the installed pg source, a dead client is marked nonqueryable and pending queries reject before the client error event. Pool checkout removes only its own idle listener; this new listener prevents an unhandled EventEmitter error while checked out. Pool release removes a nonqueryable connection. The listener does not catch or convert query/transaction failures to success and does not alter credentials, query deadlines, capacity, readiness or rollback.

Readonly review of actual regression artifacts corroborated original source exit1 / patched exit0, then finalLF exact module521bed6e... exit0. Actual pg_sleep backend termination rejects57P01; uncommitted INSERT absent; second termination between checked-out queries does not kill the worker; dead-client query rejects; new backend commits onlyid2. Both PG failure boundaries are real Linux PostgreSQL. These are dirty targeted module checks, not a clean compiled application or P07 PASS. No tests were rerun by this reviewer.

## socketView narrow optimization

The new skip decision reads current() under row/round FOR UPDATE and authenticates its encrypted data against exact room/session/round AAD and schema before looking at actor membership/conversation ID. It omits full planner/safety load only when no private projection can be needed by that member. Actual recipients still call loaded(), which retains fresh source, snapshot/history consistency, safety and presence checks, and recheck actor/conversation before prepareProjection. It adds no process cache and changes no deadline/capacity.

Member-bound exact private refs query and100event bound are unchanged. Existing refs do not bypass delivery: rooms.dispatchPrivate authenticates room/member/session/socket generation/current acceptance; privateDelivery repeats full loaded(), actor, prepared consent/version/epoch and content boundary checks; finalAccessFence and gameDeliveryFence run before synchronous enqueue. Public dispatch/view code is unchanged. Therefore the early no-work branch does not itself authorize private content or permit stale text delivery.

The two new existing-fixture unit cases correctly distinguish nonrecipient/no-conversation skipping and unreadable authenticated-round failure propagation. Existing recipient/load/prepare and private capacity/error tests remain. They are explicitly controlflow tests with mocked suboperations, not real consent/ACL/PG proof. Parent reports20impacted tests and ESLint0; actual clean combined retry is still necessary to corroborate the fix under load.

No further code changes requested. Existing product parity14c→DCF and14c production restore/source proof do not automatically cover these new2production file changes; final current-image/build/inputs must be explicit. Final aggregate and release acceptance remains separate.
