# P05 registry and planner safety provider — independent round 01

**CHANGES_REQUESTED — SAFETY-GUARD-01 (P1).** Actual Linux controls reproduce a safety-path availability defect in the bridge between previously reviewed primitives. The reviewer changed no included implementation. Historical lifecycle component round02 remains valid for its exact bounded scope and bytes.

## Confirmed finding

`TopicRoomRegistry.guard` uses `storage.assertLive` and `storage.assertMember`. Both ultimately invoke `TopicRoomLifecycle.live`, which reads the personal chain/witness. Consequently, a corrupted or missing personal chain rejects **actual `Rooms.finalAccessFence(c, auth, true)`** with `TOPIC_LEDGER_INVALID` or `ENOENT`, despite valid session/entry rows, a live room and intact lifecycle authority. The safety flag does not bypass this dependency. Leave/Close/Stop paths that pass through this fence therefore cannot rely on being available when personal content storage fails.

The existing registry unit named “safety guard does not depend on personal preference file readability” only makes the mocked `storage.open` throw; mocked `assertLive/assertMember` never read the real personal ledger. It cannot substantiate the claimed boundary.

Required fix: expose and wire metadata-only room/member authority checks for safety admission/final fences and recovery classification, retaining birth/intent/terminal/membership validation and process floors. Keep full personal-ledger health checks for private content/settings. Do not implement a permissive missing-file fallback or bypass retirement. Add real Linux negative controls that keep safety available under personal corruption/missing files, while normal private reads remain denied and retired members/rooms remain denied. Repeat independent review on new exact inputs.

## Frozen scope

| Target file | SHA-256 |
| --- | --- |
| `topic-room-registry.ts` | `438c5da0de39fc75cd815492b1feaedeb291688bb8a306d896c17d13e3800907` |
| `topic-room-registry.test.ts` | `9c249558c61f2d23e33643977d1820d9bebf9f38fa734f6be2ab34928ad19c83` |
| `private-topic-preferences.ts` | `27fbaae01d684849bb5205820d3bb6cfd52602abc4bf5b13cbad24f2ccf130ff` |
| `private-topic-preferences.test.ts` | `b80e2e12b959917a2b210b1fb23123b7ee207d84e39c33e5b2ba375ccf046c77` |

All four are equal before/after review. Supporting frozen runtime copies: Rooms `bcd9094295d55bef75ae8483da7789bfbce299e36262689ffa326ed005663187`, lifecycle `5562b552e0f3d2fa113627bdd7dce14b7b406e13c66caf8e5c88fcf6b594748e`, ledger `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a`, security `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`. Other worktree files were allowed to change and are not part of this review's source claim.

## Independently executed controls

[Reviewer suite](registry-provider-round01/independent.test.ts), SHA-256 `d7414bbd794ca752ea301cba52e4db0cd061e43ea52cebe5cf88cd85b482cc4f`, actual Linux Docker **31PASS/2FAIL of33, exit1**. Both failures are SAFETY-GUARD-01, one corrupted and one missing personal chain. [Raw result](registry-provider-round01/tests.txt) includes exact in-container runtime input hashes. Earlier25-control run **23PASS/2FAIL**, exit1, is retained under [attempt01](registry-provider-round01/attempt01/tests.txt); adding registry recovery controls did not change implementation inputs or remove failing tests.

Passing controls establish these bounded facts:

- Real lifecycle/registry preserves original authenticated retirement time and operation UUID across unknown-commit retry and interrupted intent recovery. Cleanup uses the original closedAt and removes personal files before member-containing lifecycle files. Missing DB descriptor does not initialize a room.
- Actual member retirement is classified; missing admission, a plain Error carrying the same code, and corrupt lifecycle metadata cannot be converted into successful withdrawal.
- Planner observations and nested arrays/records are frozen, exact-object scoped and cannot be cloned into process proofs. Exclusion rejects another PG client, another room, unselected or forged peer actor. Exact selected SQL rows reject missing, extra or duplicate IDs; malformed/bounded membership rejects before ledger access.
- Simulated expiry during earlier count reads and during the last credential query prevents any durable narrowing. Locked exclusion uses the caller client without nesting a transaction, checks credentials before narrowing, revokes before DB publication and invalidates the old observation.
- One protected ledger sequence stride of65536 exceeds the full possible low-part rollback of eight selected DB revisions each≤4096. Independent eight-member boundary control verifies the remaining positive margin32768. Global and withdrawing-member revisions remain higher after DB preference rollback, with durable exclusions retained and allow not restored. DB revision4097 and unsafe numeric overflow reject.
- Revocation failure publishes neither preference nor request while durable exclusions stay stricter. Peer narrowing and room retirement invalidate old observations. Internal planner reads perform only SELECTs and no narrowing, revocation or public update calls.

Database, credentials and revocation in these tests are explicitly controlled seams. The safety failures, recovery, member retirement and cleanup use actual Linux files and real lifecycle/registry methods; `Rooms.finalAccessFence` is the real frozen implementation with mocked SQL rows. This is not an actual PostgreSQL transaction/lock, HTTP request, full application Stop/Leave/Close end-to-end test, backup restore or scheduler proof. Root's66 author unit PASS is context, not added to this review's count or independently rerun here.

Runtime: image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5, UID1000, network none, read-only root, seven read-only individual frozen source/probe binds, fresh owned labelled state volume, dropped capabilities/no-new-privileges, 1CPU/768MiB/PIDs96. No moving checkout mount or Docker socket. Both runs' inspected exits are1 and actual post-cleanup owned-label queries are EMPTY. Evidence is indexed in [index.json](registry-provider-round01/index.json).

The provider's transaction/advisory ownership is a trusted internal caller precondition; object/client binding does not authenticate a database transaction. Full PostgreSQL ordering, supported rollback/restore, final delivery epochs/session checks, provisioning, scheduler retention and stage gates remain open. No full-stage or production acceptance follows.
