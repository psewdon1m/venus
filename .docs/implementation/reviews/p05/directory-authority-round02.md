# P05 scoped directory allocator and metadata authority — independent round 02

**COMPONENT_PREFLIGHT_PASS. SAFETY-GUARD-02 closed for the reviewed running-process bound-method composition.** No included code was changed by the reviewer. Cold bootstrap, actual PostgreSQL/HTTP, scheduler/backup/restore and full-stage acceptance remain outside this result.

## Exact source scope

All11 frozen included source/test/support copies match current files after review. Relevant new inputs:

| File | SHA-256 |
| --- | --- |
| `topic-room-directories.ts` | `1bee0233980c965f722bd5a7d3fa0ffd1bdcbd90b2617645bd6da484842b3e10` |
| `topic-room-directories.test.ts` | `4c9567419c52aae1b47fbc0a7ef43c92ad8515dc72971737aead4732a973da25` |
| `topic-room-lifecycle.ts` | `ed7694aa3f5dbab2238d0518d153c12c24332206ce90de338814e4b561ec688c` |
| `topic-room-lifecycle.test.ts` | `813c03d31775d7f8bd89e84bfce8a212ab489091714a95cf9235bd6572be8fb3` |
| `topic-room-registry.ts` | `23de303a222dc9e30c6b50f86219662c9735076468ac7db4303cb8ac1b1a659e` |
| `rooms.ts` | `ff222a1b790e5931a36aaa5040a0f7fbd45a99582dc107cdef468ba11c7d8831` |

Unchanged provider `27fbaae01d684849bb5205820d3bb6cfd52602abc4bf5b13cbad24f2ccf130ff`, ledger `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a`, security `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`; all further test pins appear in [current input audit](directory-authority-round02/current-inputs-after.json). Historical SG02 round01 and registry/provider reports remain immutable.

## Independently executed proof

[Reviewer probe](directory-authority-round02/independent.test.ts), SHA-256 `613aa27732ddf7c067baa3377b2999d1835bd845b06715e66152416718899c2f`: **19PASS/0FAIL/0SKIP, actual Linux exit0**. [Raw result](directory-authority-round02/tests.txt), runner, inspections, exact source copies and cleanup are [indexed](directory-authority-round02/index.json).

The actual composition uses five protected parents → real `registry.birth`/provisioning/lifecycle initialization/admission → `TopicRoomLifecycle({directories:store.directories.bind(store)})` → registry → actual `Rooms.finalAccessFence(...,true)`. The bound callback forwards the newly added `metadataOnly` argument. SQL/credential rows and topicsChanged remain controlled seams; actual filesystem and named implementations execute.

All8 prior control expectations remain, including the three formerly failing personal-parent missing/mode/symlink safety tests. Only the callback wiring changed to the supported bound method; none of those failure expectations were removed or relaxed. Eleven additional controls establish:

- Four paired personal-parent faults (missing, unsafe mode, symlink and replaced inode) permit metadata safety, recovery, member withdrawal and room retirement. Full private content read/narrow/assertLive and new provisioning remain denied. A captured safety closure denies withdrawn member; room-only authority remains until room retirement, after which the captured closure denies. Original close time is retained on recovery.
- Replacing each of birth, lifecycle-chain or lifecycle-witness parent with a new safe-mode inode still rejects with `TOPIC_ROOT_REPLACED`. Missing/unsafe/symlinked lifecycle roots also deny, as in the prior controls.
- An actual rename plus ancestor symlink injected during the last authority-root open preserves every leaf inode but still rejects with `TOPIC_ROOT_SYMLINK` on namespace revalidation. The injection selects timing only; real filesystem operations and all validation execute.
- Metadata-only lookup of a missing room creates nothing. A replaced personal parent is ignored only for metadata scope; full lookup/provision still enforce the retained personal-root identity floor.
- Cold-constructor and dropped-flag cases are explicitly observed as limits below. They are negative controls, not silent success or acceptance of degraded bootstrap.

No new failed attempt occurred in round02. The prior5PASS/3FAIL actual run stays in round01 with its exact old source/callback proof.

## Fix boundary and limits

Lifecycle forwards its true metadata lock mode to the directory resolver. In that scope the allocator validates only protected birth/lifecycle parent roots and retains their owner/mode/identity/ancestor protection. Regular lookup and provisioning retain all-five-root checks. Constructor still validates all five at initial bootstrap.

**Cold bootstrap with unavailable personal parents is not supported by this constructor.** The independent test proves construction rejects after a personal root is removed. This PASS covers continued safety in an already initialized running instance; it does not claim restart availability or completed degraded server startup. Operator provisioning/recovery and any required degraded-bootstrap path remain an explicit integration obligation.

A one-argument callback `id=>store.directories(id)` drops the scope flag and remains an unsupported composition. The independent negative test proves it still denies under personal-parent failure while the bound method succeeds. Actual server construction must use scope-preserving wiring; this review verifies the explicit fixture composition, not an activated server deployment.

## Runtime and separately inspected author evidence

Image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5; UID1000, network none, read-only root, eight individual frozen read-only source/probe binds, fresh owned labelled state volume, capabilities dropped/no-new-privileges, 1CPU/768MiB/PIDs96. No Docker socket or moving checkout mount. Actual inspected exit0 and actual post-cleanup container/volume label queries EMPTY are retained.

All20 indexed lifecycle04 author artifacts match hashes/sizes. Inspected author execution: **213PASS/2Windows-onlySKIP**, exit0, exact new module/test, original3FAIL callback-model before-proof retained separately; owned author cleanup EMPTY. Root's allocator author evidence was copied into this packet and its three source pins verified: **19PASS/1Windows-onlySKIP**, inspected exit0 and no remaining labelled container. These are inspected author runs, not reruns or part of the independent19 count. Windows skips do not prove Linux behavior.

Real PostgreSQL auth/order/commit recovery, HTTP/WS safety delivery, source/runtime activation, full backup/restore, finite retention/pruning, old-worker quiescence and full P05/P06 gates remain open. No production/DNS/TLS or human450-card approval follows.
