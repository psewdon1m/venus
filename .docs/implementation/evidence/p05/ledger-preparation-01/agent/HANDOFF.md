# P05 room topic safety ledger foundation — author handoff

**Scoped component implementation; inactive.** No API/readiness/DB adapter, migration, restore executor or stage acceptance is installed. Only two new included files were written; other artifacts are excluded evidence and the author's own journal.

## Exact current inputs and evidence

- `apps/api/src/private-topic-ledger.ts`: `52655c6ed3f3754bc403e8f4c9d7610e1c487d2a4c8ccab175f958612622a284`.
- `apps/api/src/private-topic-ledger.test.ts`: `6fe653ed0478361ca4184c82bd6cef1d782ff298d52dd2e61e5c74dd7241275b`.
- Existing `security.ts`: `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`, unchanged.
- Exact Docker image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`.
- `linux-round-03/` contains actual tested module/test/security copies, runner descriptor, before/after hashes, actual image/container/volume configurations, raw output, and label-checked cleanup. These bytes equal the included files after installation. No moving checkout build was used.
- Current Linux: **67 passed /1 Windows-only skipped**, exit0. Current included host: **25 passed /43 Linux-only skipped**, exit0. Included strict TypeScript and scoped ESLint exit0 (`included-typecheck-01.txt`, `included-lint-01.txt`).
- `linux-round-01` startup FAIL remains immutable (Vitest tried read-only HOME; zero tests). `linux-round-02` 65PASS/1SKIP is historical. Its source/test were not copied before later scratch changes; historical source hashes are recorded but those old exact source bytes are not archived in this handoff. Current proof is round03, not a renamed old run.

## Driver / codec boundary

`TopicLedgerCodec` is bounded authenticated parsing/sealing; it proves no durability. It uses unchanged Keyring fixed 16KiB encrypted plaintext, domain-separated versioned AAD/fingerprints, fixed 24KiB outer frames, and a fixed 1KiB authenticated witness. Room/member, topic IDs and operation IDs are encrypted. Header scope is keyed, not a plaintext identifier. Genesis pins exact policy/taxonomy/vocabulary for the incarnation. Key rotation retains old encryption/MAC keys; pin migration is intentionally not implemented.

`PrivateTopicLedger.initialize(options)` explicitly initializes two distinct pre-provisioned protected 0700 directories, returning `{ledger, required:{incarnation,minimumSequence:1}}`. Normal `open(options,required)` creates neither missing chain nor witness. Linux is the only supported durable platform; Windows throws explicitly. Directory descriptors anchor operations; symlinks, wrong owner/modes, nonregular/multilink files, bounds, malformed/truncated/authentication/chain/pin/required-floor regressions deny.

`ledger.narrow({roomId,ownerId,operationId,expectedRevision,exclude})` does an under-exclusive-lock re-read, exact per-scope revision, monotonic cumulative union, append+fsync, witness temp+fsync+rename+directory fsync. It returns only after the final lock removal/directory fsync also succeeds. No stale lock is guessed away. Bounded exhaustion refuses narrowing; there is no pruning/compaction or automatic reset.

The same committed operation/body replays idempotently even after later narrowing; its receipt contains the **current stricter union/current revision**, plus original `operationSequence` and `operationRevision`. Same operation ID with changed scope/body denies. `read(scope,minimumRevision)` validates again and returns only that room/member's immutable exclusion state with current global sequence.

A complete authenticated stricter tail can recover only from the exact witnessed prefix. Recovery re-fsyncs chain before durable witness advancement. Corrupt/partial tails are never truncated into permission. Instance process floor additionally rejects rollback/divergence after this instance observed stricter state. Callers must retain the instance, not re-create it to bypass its process floor.

## Integration obligations / limitations

The DB adapter must authenticate owner/room and validate its stored marker, pass required incarnation/minimum sequence and minimum owner revision, union ledger exclusions with stored exclusions, remove them from allow sets, revoke epochs before further delivery, and use final HTTP/WS fences after awaited IO. A typed caller object is not authenticated proof. Narrowing must durably precede DB publication; a failed DB commit leaves stricter ledger state intact. Unsupported pin/key/mixed-version recovery must deny, not create a new permissive incarnation.

Host-file chain, witness and key material must be protected from DB/image rollback. Witness must be independently preserved from chain rollback. Two directories on one host do not themselves establish the operator's backup/rollback boundary. Replaying the entire host, keys and all independent witnesses plus trusted required floors is undetectable; the test explicitly demonstrates this limitation. These files contain room-local personal safety state; deletion/retention-aware compaction remains a necessary later design and is not silently added here.

Actual Linux tests include real filesystem append/reopen/mode/hardlink/symlink/bounds checks, independent witness rollback, process floor, seven real child SIGKILL phases, and a live second-process lock denial. SIGKILL leaves a stale lock: tests first prove denial, then their disposable operator removes that known terminated child's lock to inspect recovery. This is not automated driver recovery or hardware power-loss proof. Injected ENOSPC, short write, rename and six fsync-call failures are separately named controls, not actual full-disk hardware tests. No actual PostgreSQL encrypted restore/admission/delivery proof follows from them.

`controls` is an explicit trusted syscall/fault test seam, not a configurable request surface. Production integration must use default syscalls. No endpoint is activated by this module.
