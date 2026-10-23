# P05 backend · Independent early review round01

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:39:15.698932+00:00. **CHANGES_REQUESTED**, stage_acceptance=false. Early dirty-source code review: private chat SQL/routes/final fence, quiet public pair and safety-neutral abort. No implementation edits by reviewer. Frontend/full P05/P04 content acceptance excluded.

## B05-001 · P1 · Stale public-pair mutation receipt bypasses quiet-consent gate

Original dispatchHttpReceipt checked invitation only when actual current round ID matched receipt round ID. After advancement or missing current round it sent old pair actors/text without current consent validation. Actual implementation repro used only persistence adapters as fakes: original3cases had2FAIL (different/missing current round),1PASS (matching revoked invitation). Original Games source SHA `1a7f16a1d60adbcec0f917484dbba8b14748fa35a9f4e7d14a21e8e69baeabcc`.

Root fixed current projection to require active game, exact current round/card/revision and nonprivate pending/active state before enqueue. Fresh run of the same3cases nowPASS, preserving committed session/revision while redacting optional current_round. This finding is resolved in current dirty code; requires eventual real HTTP/idempotent replay regression and clean-source proof.

## B05-002 · P2 · Clock regression can revive observed-expired grants and read future messages

Actual PrivateChat.eligible does not consume expiry or record a clock floor: register at1000, observe false at301000, rewind to2000 → true. Before maintenance prunes it, the process retains a usable grant. Consent and membership absolute timestamps likewise may become current again when wall clock regresses. Expiry should not become a reversible authorization decision.

Separate actual PrivateChat.view repro supplies a scope with last_sent_at2000 and message sent_at2000 at clock1000. Read succeeds/decrypts, whereas send explicitly rejects future last_sent_at. GET lacks corresponding temporal validation. Both reviewer tests currently FAIL. This is controlled clock/persistence input testing, not an assertion that a production clock was changed.

Required: monotonic authorization clock/floor or equivalent irreversible observed-expiry handling, and fail-closed GET clock validation including after awaited reads. Add regression covering expiry→rewind and future send history without private enqueue; repeat actual clock/HTTP Docker checks after fixes.

## Positive source observations

Exact room/game/round/current pair actors, bilateral invitation, frozen online capability, room/session membership, both actors presence/heartbeat/reservation/session and current entry acceptance are checked for chat. FinalFence runs again after awaited storage reads before synchronous enqueue under room/catalogue locks. SQL payload is AES-GCM padded ciphertext with scoped AAD; request fingerprints are keyed HMAC and receipts have no plaintext. No chat mutation/outbox/public game revision introduced. Bound128total/12actor-minute/32messagebuffer are explicit.

Capacity fix re-read: register returnsfalse at1024 and Games.newRound aborts transaction instead of publishing a chat-capable round without grant. Existing grant reuse does not refresh expiry/crossscope. SQL migrations are additive and wipe ephemeral scopes on boot; revoked volatile map is not reconstructed by SQL restore. Safety-neutral clear aborts only an immutable participant's current session; original snapshot remains unchanged and resume requires paused state, so aborted sessions cannot resume.

## Limits

Author's actual Docker runs remain in progress and are not accepted by this round. Existing P03 selector/snapshot core is not modified by these changes; new serving protocol needs its own checks. No human content approval, topic/advice/semantic/mobile/native-zoom implementation, production or full-stage PASS inferred. Reports/fault controls retained for fix/retest loop.
