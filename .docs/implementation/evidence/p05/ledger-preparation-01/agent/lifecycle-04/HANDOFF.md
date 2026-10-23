# SAFETYGUARD02: directory resolver mode forwarding

WRITES_FINISHED. Only the two owned lifecycle source/test files changed. Historical60c8/210PASS proof and independent composition FAIL remain immutable and source-bound.

`TopicRoomOptions.directories` now accepts `(roomId,metadataOnly?)`; `locked` forwards its actual mode as the second argument. No authority/content checks change. Root's concrete DirectoryStore must honor this selection and pass its bound method rather than a one-argument adapter that drops the flag.

Three new actual Linux callback cases validate missing, unsafe-mode and symlink **personal parent roots**. The callback deliberately rejects those roots unless it receives `true`; room/member authority, retirement status, member withdrawal and room retirement now forward `true`. Normal open/admit/full asserts/wrapper read+narrow and cleanup forward `false` and remain denied. This models the resolver boundary and does not import or verify the separately owned concrete DirectoryStore/Rooms/registry composition.

Before-negative on old60c8 + new tests: **3FAIL/212 filtered SKIP**, exit1. After the exact two-line source change: full actual Linux **213PASS/2Windows-onlySKIP**, exit0, retaining prior210 cases. Both runs archived all five input copies before launch, in-container hashes, runner/configuration/inspect/raw outputs and label-checked EMPTY cleanup receipts. Same image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, four individual read-only source/test binds, UID1000/read-only/networknone/capdrop/1CPU/768MiB/PIDs96 and fresh owned disposable volume; no moving checkout mount/build. Passing bytes equal installed files.

- Module: `ed7694aa3f5dbab2238d0518d153c12c24332206ce90de338814e4b561ec688c`.
- Test: `813c03d31775d7f8bd89e84bfce8a212ab489091714a95cf9235bd6572be8fb3`.
- Foundation/count/security unchanged (`cae3…`, `241d…`, `5782…`).

Included strict TypeScript and ESLint exit0. Windows included **26PASS/189Linux-onlySKIP**, exit0; skips are not Linux evidence. Root must finish real bound-method DirectoryStore wiring and obtain a fresh independent composition gate before closing SAFETYGUARD02. No HTTP/PG/backup/production/full-stage claim follows from this component proof.
