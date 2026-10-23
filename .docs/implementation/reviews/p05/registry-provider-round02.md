# P05 registry and planner safety provider — independent round 02

**COMPONENT_PREFLIGHT_PASS. SAFETY-GUARD-01 closed within this exact component integration scope.** No included implementation was changed by the reviewer. Actual PostgreSQL/HTTP/scheduler/backup/restore and complete P05/P06 gates remain open.

## Exact reviewed inputs

Six author-controlled files were frozen before testing and matched included files after review:

| File | SHA-256 |
| --- | --- |
| `topic-room-registry.ts` | `23de303a222dc9e30c6b50f86219662c9735076468ac7db4303cb8ac1b1a659e` |
| `topic-room-registry.test.ts` | `593cc5998d742c613a68ae4d2a5567dcb489d86452f65faa1378a57e2c331138` |
| `private-topic-preferences.ts` | `27fbaae01d684849bb5205820d3bb6cfd52602abc4bf5b13cbad24f2ccf130ff` |
| `private-topic-preferences.test.ts` | `b80e2e12b959917a2b210b1fb23123b7ee207d84e39c33e5b2ba375ccf046c77` |
| `topic-room-lifecycle.ts` | `60c8f41b2409f23b7969d11067266ffdf651dbc648c99905111ad7dfc6a9cef4` |
| `topic-room-lifecycle.test.ts` | `cd2375ce3f463690cb3918dc5d7ddb4f4b0a18402e93e1b530c3fb85aa92d9f6` |

Supporting frozen runtime copies: Rooms `bcd9094295d55bef75ae8483da7789bfbce299e36262689ffa326ed005663187`, ledger `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a`, security `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`. Other worktree files could change and are outside this evidence's source scope. Historical round01 and lifecycle02 reports/proofs are unchanged.

## Fresh independent execution

[Reviewer probe](registry-provider-round02/independent.test.ts), SHA-256 `cd565ffb58bc4dc324422c7e00b114b119d95f9d9552309942367b8f1027d3b4`: **51PASS/0FAIL/0SKIP, actual Linux exit0**. [Raw output](registry-provider-round02/tests.txt), exact input copies and [indexed evidence](registry-provider-round02/index.json) are retained.

All33 round01 logical controls remain, including both originally failing corrupt/missing personal-chain tests with unchanged expected safety availability. The injected missing-admission/plain-error control now spies on `assertMemberAuthority`, the new actual recovery boundary, instead of the old full-health `assertMember`; the denied error types and expected behavior are unchanged. No failing expectation was removed or weakened. No new failed attempt occurred in round02.

The18 added controls establish:

- Nine paired real-filesystem cases cover corrupted/missing personal chain, missing witness, unsafe file mode, hardlinked witness, missing/unsafe/symlinked personal directories and unknown personal encryption key. In every case, actual `Rooms.finalAccessFence(...,true)` returns a synchronously usable fence and registry recovery works. Full `registry.assertLive` and old wrapped content read/narrow still deny. Authenticated member retirement works, invalidates a captured fence and is classified on recovery; room-only safety remains available until real room retirement. Original close time survives later retry.
- Seven real metadata-negative cases cover corrupted/missing lifecycle chain, missing lifecycle witness, missing/corrupted birth, unknown lifecycle key and wrong DB birth incarnation. Valid credential-row seams do not bypass these failures: safety fence and recovery both deny.
- A retained metadata process floor rejects restoring the lifecycle files from before member retirement. A captured post-SQL safety closure rechecks real room retirement synchronously and denies even though its earlier SQL row was valid.

The33 retained controls also pass: authenticated original intent recovery/unknown-commit close timestamp, real cleanup ordering, exact retirement error classification and no read initialization; frozen observation/client/member binding; earlier/final-query simulated credential expiry before narrowing; no nested transaction; revocation-before-publication; durable exclusions after rollback/revocation failure; eight-member65536 stride versus8×4096 low-part bound; invalid bounds and read-only/no-public-write behavior.

## Why the finding is closed

Registry `guard` now invokes separate `assertRoomAuthority`/`assertMemberAuthority`; `recovery` uses the same metadata-only checks. Lifecycle metadata lock mode does not open personal files/directories. It still authenticates protected birth, intent/terminal, lifecycle chain/witness, exact member admission/withdrawal and process floors. Full `assertLive`, `assertMember`, admission and wrapped content methods retain personal-ledger validation. The paired independent tests prove both safety availability and continued content denial, rather than inferring one from mocked methods.

Metadata-only success is not a content, admission, cookie/session or transaction-ownership grant. The real Rooms final credential query and returned closure are executed here, but query rows are controlled mocks. Registry mutation methods still depend on trusted authenticated callers holding the real room ordering.

## Runtime and separately inspected author evidence

Image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5, UID1000, network none, read-only root, seven individual read-only frozen source/probe binds, a fresh owned labelled state volume, capabilities dropped/no-new-privileges, 1CPU/768MiB/PIDs96. No moving checkout mount or Docker socket. Actual container exit0 and post-cleanup owned-label container/volume queries EMPTY are retained in inspections/audit.

All20 indexed author files in lifecycle03/linux-round02 match sizes and hashes. Inspected author raw result is **210PASS/2Windows-onlySKIP**, exit0, on the stated exact image/source copies; actual author label cleanup is EMPTY. This is inspected author evidence, not a second independent210-test rerun or part of the reviewer's51 count. Root's79 author unit PASS remains context, not this review's execution. The author preserves its previous209PASS/1FAIL assertion-error attempt separately; prior independent31PASS/2FAIL before-fix proof also remains intact.

Actual PostgreSQL advisory/transaction ownership, HTTP Stop/Leave/Close, full source/runtime activation, provisioner, scheduler deadlines, bounded metadata pruning, backup/restore, old-worker quiescence and final full-stage acceptance remain unproved. Local Docker file integration is not production/DNS/TLS evidence and does not approve450 content cards.
