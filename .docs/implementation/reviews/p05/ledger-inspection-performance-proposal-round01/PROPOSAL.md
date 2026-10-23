# A15 protected-ledger inspection: narrow performance proposal

PROPOSAL_ONLY_NO_APP_WRITES. Main source remains A15 `658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de`/1869. Root GO and independent implementation review are required. Existing in_person/questions06 process39980 remains instrumented diagnosis and untouched.

Root's single7s profile reports lifecycle.locked86.2%, ledger.reload59.8%/inspect55.6% inclusive, canonical22.56% self, HMAC/update11.9%, lstat10.16%, idle6%. Inclusive percentages overlap. These samples motivate reducing repeated inspection; they do not identify every lock holder, prove a sole cause, or guarantee the original600s profile goal. No new native profiling, DB query or benchmark was performed by this proposal author.

## Recommended boundary

Memoize only the pure full `TopicLedgerCodec.inspect(chainBytes,witnessBytes)` result inside `PrivateTopicLedger.reload` at296-307. Keep the codec API/validation body unchanged. It repeatedly parses canonical fixed24KiB frames, authenticates each MAC/AES/AAD, validates monotonic scope/operations and hashes the whole chain even when the exact protected bytes/key material have not changed. Lifecycle retains the personal/lifecycle ledger objects, so a bounded per-ledger inspection slot can serve repeated reads without memoizing room/member/grant results.

Before EVERY lookup, execute the existing `locked`/directory/withFile/readFile sequence in full: O_EXCL mutex, anchored directories, owner/mode/nlink/type/nofollow checks, descriptor/named inode identity, fresh complete bounded chain and witness bytes, pre/post size/mtime/ctime/EOF validation. No stat-only/mtime/filepath cache. Hash exact fresh bytes using domain-separated SHA256 including lengths; no retained raw buffer shortcut.

Entry identity is the ledger object plus fresh chain/witness digests, frozen pins and maximumRecords, and a fresh opaque identity of ALL current Keyring version names/material/current. A tiny internal Keyring method may derive this from its actual current backing key map on each lookup, returning only a process-internal digest. No canonical implementation rewrite, HTTP API, key exposure or key logging. Same-object old/current key deletion/replacement and current-version rotation must immediately change/miss the entry. A per-used-key fingerprint alternative avoids a method addition but does not meet the stronger all-key invalidation requirement as directly; the all-key identity is recommended.

Only a fully successful inspect result is stored, deeply frozen, and remains private to reload. Never retain a failed validation or return cached consumer grants. `latest`, `replay` and `append` continue using the internal verified state; public latest/receipt methods already return frozen copies. The exported codec remains uncached, so its existing caller semantics and test fixtures need not change. No authorization/source/membership/presence/room retirement/safety/clock/query result is cached.

After EVERY hit or miss, run the existing required incarnation/minimumSequence, process high-water digest and witnessSequence logic in the same order. Keep process floors outside memo entries and never evict/reset them. A valid complete newer tail must still perform the original chain fsync/witness publish/file+directory barriers. Narrow writes, crash handling, replay checks and witness repair are unchanged. Changed raw bytes miss; old exact bytes still fail newer process/required floors even if they match an older memo. Any IO/key/inspection/floor/publication exception clears that ledger's memo and propagates the same failure. No retries, repair-on-corruption or fallback empty state.

## Retention and minimal integration

One shared bounded store, at most32 latest ledger entries and16MiB encoded retained Inspection weight, with absolute30s process-monotonic TTL and one unref expiry timer. Hits do not extend expiry. Oversize states validate normally without retention. Eviction removes only inspection plaintext, never trusted lifecycle context/process floors. Encoded bytes are a cache accounting limit, not a JS/OS heap hard limit. Do not retain raw chain/witness buffers or actual keys.

A clear hook can be invoked by existing `TopicGames.clearSnapshotCache()` (already called by bootGate and server onClose) and `purge()`; a global memo clear is safe and simpler than inferring a room from a genesis frame. These hooks change cache retention only. Existing lifecycle retirement/filesystem checks remain fresh. Proposed source paths: private-topic-ledger.ts, tiny internal security.ts method, a narrowly scoped bounded memo helper/test if needed, two clear calls/import in topic-games.ts, meaningful focused tests and an additive source revision. No lifecycle protocol, storage layout/schema, crypto format, MAC/AAD domain, durability, timer/pool/rate/consent/deadline change.

## Required implementation checks using existing runners

- Same exact freshly read bytes/key/pins reuse one immutable Inspection while read/floor guards still run; deep caller mutation cannot influence later state.
- Same-length/in-place chain or witness corruption, trailing/short/reordered/duplicate records, valid changed append and valid authenticated regression miss or fail as before.
- Same Keyring backing map old/current key deletion, same-version replacement, current rotation; changed pins/max-record limits, foreign ledger identity and bad AAD all miss/fail.
- Required/process floor regression on a memo hit still fails; stale witness complete-tail recovery still performs every real barrier; a publish failure cannot create successful retained state.
- Missing files, symlink/inode/link/owner/mode swap still fail after a warm memo; lock exclusion/stale lock and crash tests unchanged.
- Absolute TTL/no touch-extension,32-entry/16MiB eviction, oversize uncached, one unref timer, boot/purge/close clearing; clock injection only in helper tests with default performance.now, no application clock platform.
- Existing portable codec/security tests on host and mandatory Linux ledger/lifecycle/portable storage suites after coherent freeze/image; independent review before exact same original600s native N4/high-N measurement. Do not infer latency improvement from unit hit counts.

Existing codec tests cover isolation/replay, rotation/missing/wrong keys/pins, malformed/tampered/trailing/reordered/witness cases, authenticated invalid operations and bounds. Native ledger tests cover required/process floors, rollback/tail repair, symlinks, exclusivity, complete-write recovery/durability and barriers. Those suites should be retained rather than replaced with a new framework. Changed implementation must preserve the Linux219PASS/2explicitSKIP baseline and retain all new red/green evidence.
