# P05 room topic safety ledger — implementation preparation

2026-10-19, root. **DESIGN ONLY.** No runtime, migration, fsync, backup/restore, or readiness acceptance follows from this document. This is the necessary persistence boundary for the already independently reviewed pure conversation kernel and forthcoming versioned planner. The current 450-card candidate remains HOLD.

## Required behavior

An explicit topic exclusion applies to this member throughout this room, across pairs, game modes, and sessions. A database restore must never resurrect permission for an excluded topic. Allow-set expansion is an explicit owner action in the database; it cannot remove a ledger exclusion. Missing or invalid required ledger state closes admission and private delivery. Cold boot never restores prior private offers, acknowledgements, advice, or chat grants.

Store the ledger and its monotonic witness on a dedicated protected host volume outside database backup/rollback. Keep its encryption/authentication key material out of the database backup and release image. Neither an application backup nor an image downgrade may replace this volume. The model does not claim detection of an adversary restoring the entire machine and all independent witnesses together; this boundary must be explicit in restore tooling and tests.

## Proposed small boundary

The implementation will own new `apps/api/src/private-topic-ledger.ts` and tests without changing the historical DeletionLedger, Keyring, migrations, or accepted contracts. Existing Keyring encryption/fingerprints may be reused with explicit topic-ledger domain separation, versioned AAD, fixed padded plaintext, and retained old key versions. A typed caller or HMAC alone does not prove the current database owner/room; authenticated integration must provide that check.

Prefer a bounded append-only encrypted chain plus a separately authenticated high-water witness. Bind an unpredictable ledger incarnation, schema, sequence, previous digest, room, owner, taxonomy/policy, exclusion revision, and sorted cumulative exclusions. Do not store reasons, prompt text, advice, partner identities, or plaintext topic IDs. File names and sizes must not encode which topic was excluded. All reads verify complete bounded records, authentication, exact chain/witness binding, owner scope, and monotonic cumulative exclusions before exposing a union to the planner.

Initialization must be explicit for a new installation, before admission. A normal constructor/open does not create a missing empty ledger or witness. A database marker pins the required incarnation and minimum committed safety revision; an older database can accept a newer valid ledger, never a lower ledger than its required minimum. Keep a process high-water fence as well. File-only rollback is detected by the independent witness; database-only rollback retains the newer exclusion union. Missing required files or unknown keys fail closed.

## Durable update and recovery

1. Acquire a narrow exclusive lock and re-read the chain and witness under that lock. A busy/stale lock fails closed; no process guesses a lock stale from its age alone.
2. Validate exact expected owner exclusion revision, vocabulary/pins, bounded new IDs, and monotonic union. Replaying the same committed operation returns its existing receipt; a mismatched reused operation ID fails.
3. Append the encrypted/authenticated record and fsync the file. Write a new authenticated witness to an exclusive owner-only temporary file, fsync it, atomically rename, then fsync its directory before acknowledging success.
4. Only after durable narrowing may the database transaction publish the updated preference revision. If the database commit fails, retain the stricter ledger; it is not rolled back.
5. A crash after a complete authenticated append but before witness replacement can leave a valid tail extending the exact witnessed prefix. Recovery may adopt that stricter tail only after full validation and durable witness advancement. A truncated/corrupt tail, regressed or divergent chain, or witness ahead of the chain denies readiness; it is never silently truncated into permission.

On any write/fsync/rename failure, do not return a success receipt or continue from cached permissive state. Reopening must revalidate durable state. Linux directory durability and owner-only/no-symlink rules require actual Linux Docker tests; Windows-host unit doubles are not that evidence. Bound record size, entry count and disk usage; exhaustion refuses mutation without relaxing existing exclusions. Compaction/pruning requires its own safe transaction and room/deletion-retention proof rather than being added casually to the first implementation.

## Integration and direct tests

The database adapter takes the union of valid ledger exclusions and stored exclusions, removes those topics from any allow-set, and revokes the current conversation epoch before further delivery. If database state is stricter than the chain without a supported recovery path, deny admission rather than repairing toward permission. The final HTTP/WS fence checks current room/member/epoch, ledger incarnation/revision, exact pins, and approved catalogue after awaited IO. No new endpoint is activated by this foundation alone.

Required meaningful tests: real Linux append/reopen and owner permissions; plaintext absence/padding; wrong key/AAD/room/owner/pins; duplicate/reordered/truncated/tampered records; missing chain/witness; lower chain versus newer witness; database minimum versus older chain; process high-water rewind; exact replay versus changed-body replay; concurrent writers; disk/full, short write, fsync and rename faults; crash after every durable phase; valid stricter-tail recovery; old database with newer exclusions; encrypted synthetic preferences after actual restore; unavailable ledger prevents admission/delivery. Preserve every failure and distinguish injected syscall controls from real crash/restore evidence.

The current standalone P06 restore executor is not implemented. Its future path must preserve this volume and replay applicable room deletion/withdrawal ledgers before serving. This preparation does not close P05 topic boundaries, P06 monotonic restore, or any full stage gate.
