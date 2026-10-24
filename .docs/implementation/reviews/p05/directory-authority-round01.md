# P05 directory allocator and metadata authority composition — independent round 01

**CHANGES_REQUESTED — SAFETY-GUARD-02 (P1).** The allocator callback reintroduces a personal-parent dependency into metadata-only safety. This is a separate composition finding; historical `registry-provider-round02` remains valid for its bounded inputs and static directory callback. The reviewer changed no included implementation.

## Confirmed behavior

Actual composition in the reviewer probe is `TopicRoomDirectories` with five protected operator parents → real `registry.birth` (exclusive directory provisioning, actual lifecycle initialization/admission and mocked birth INSERT) → `TopicRoomLifecycle({directories:id=>store.directories(id)})` → registry hooks → actual `Rooms.finalAccessFence(...,true)`.

After successful birth, rename away, chmod0750 or symlink **only the personal-chain parent root**. Birth and lifecycle roots, room metadata and valid credential rows remain intact. All three safety-fence calls fail. The missing-parent trace is `TopicRoomDirectories.openRoot → withRoots → directories → lifecycle.locked → assertRoomAuthority → registry.guard`; the callback validates all five root parents before metadata mode can select its three authority directories. Thus metadata-only file operations alone do not isolate availability in this actual callback composition.

The healthy composition and corruption confined to the personal room child both pass. Missing/unsafe/symlinked lifecycle-parent roots correctly deny safety and recovery. This distinguishes the new parent-root boundary from the already fixed personal-child dependency.

Required fix: provide a scope-aware allocator/lookup contract so metadata authority validates and retains identity floors for its birth/lifecycle roots without accessing personal roots. Preserve full five-root validation for provisioning/content, immutable path/configuration/disjointness, authority root owner/mode/identity/ancestor checks, no initialization on read and no permissive retirement fallback. Do not solve this by removing root identity protection or silently following replacements. Repeat the same three failing expectations plus withdrawal/close/content-denial/root-floor regressions on exact new source bytes.

## Evidence and exact inputs

[Independent probe](directory-authority-round01/independent.test.ts), SHA-256 `ea1877bf5549390184e57ebb99abe58de6280545fbae9b631ebcba5b209976d8`: **5PASS/3FAIL of8, actual Linux exit1**. [Raw output](directory-authority-round01/tests.txt), individual frozen source copies, runtime inspections and actual cleanup are retained in [index](directory-authority-round01/index.json).

| Runtime source | SHA-256 |
| --- | --- |
| `topic-room-directories.ts` | `91ff6dc131409e74746ffad6fccc5af895fd20563ecf4181559591d8ef9b7af9` |
| `topic-room-lifecycle.ts` | `60c8f41b2409f23b7969d11067266ffdf651dbc648c99905111ad7dfc6a9cef4` |
| `topic-room-registry.ts` | `23de303a222dc9e30c6b50f86219662c9735076468ac7db4303cb8ac1b1a659e` |
| `private-topic-preferences.ts` | `27fbaae01d684849bb5205820d3bb6cfd52602abc4bf5b13cbad24f2ccf130ff` |
| `rooms.ts` | `bcd9094295d55bef75ae8483da7789bfbce299e36262689ffa326ed005663187` |
| `private-topic-ledger.ts` | `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a` |
| `security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

Runtime image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5, UID1000, network none, read-only root, eight individual read-only frozen source/probe binds, fresh owned labelled writable state volume, dropped capabilities/no-new-privileges, 1CPU/768MiB/PIDs96. No moving checkout or Docker socket. Actual inspected exit1 is retained; actual post-cleanup owned-label container/volume queries are EMPTY.

SQL, credentials and the externally supplied topicsChanged callback are explicit seams. This proves the named code/file composition failure, not deployed production wiring, an actual PostgreSQL transaction or end-to-end HTTP safety operation. Whole-stage/provisioner acceptance, scheduler/backup/restore and production gates remain open.
