# P07 fix10 author — prepare late authority fence without an eager duplicate physical pass

- 2026-10-25T17:33:29Z — Approved scope: Rooms.finalAccessFence, TopicRoomRegistry, optional trusted RoomPrivateProtocolHooks.prepareGuard, and existing room-private-protocol/registry/Linux lifecycle tests. Preserve eager guard default and all final publication checks; no FIFO/cache/pool/timeouts/poll/resources/schema/API changes. All code/tests before checks; preserve original file EOL and pin exact final hashes. No C/ROOT/Git/manifest/oldproof edits. Actual8client clean repeat remains mandatory; no promised gate PASS.

- 2026-10-25T17:34:35Z — All source and direct existing-test edits completed before any checks. TopicRoomRegistry.prepareGuard performs validated DB birth lookup only, returns fresh synchronous physical room/member closure, no initial physical permission/read/provision/cache side effect. Default guard awaits it, executes closure immediately, returns same closure, retaining eager invite/join/normal callers. Trusted optional interface documents builder success grants no access. Rooms.finalAccessFence prefers builder ONLY when supplied, awaits existing own credential metadata SQL, then retains unchanged synchronous external/serving/deletion/clock/socket/room/offer checks. Missing optional builder uses old guard; a builder error propagates without fallback. No FIFO, pool/resources/timeout/poll/JSON schema/API options changed.

- 2026-10-25T17:34:35Z — Existing tests extended: prepared builder does no physical checks and is not permission; invalid DB birth builder rejects; default eager guard immediately rejects already withdrawn member. FinalAccessFence trace prepare→credentialSQL→physical only at invocation; simulated withdrawal during final metadata SQL is rejected; builder failure does not call legacy guard or credential SQL; explicit legacy fallback remains fresh. Existing real Linux registry+protected lifecycle cases now cover eager and prepared member guards, held final closure and newly requested guard, both member withdrawal and room retirement. Original all-boundary existing tests retained.

- 2026-10-25T17:35:10Z — Targeted ESLint all6editedfiles exit0. Actual scoped Linux Vitest3existingfiles via exact prior clean fixture image sha256:9a3fc807d0c45c5b27d21d445217f403a5afa6c98e4007d93a7b464dded5c2b1 plus6read-only TS bind mounts:3filesPASS,193testsPASS,1expectedLinux unsupported-host skip,5.10s,exit0. Isolated --network none,nonroot,readonly root,2CPU/1GiB/128PID,tmpfs only /tmp,/home/node,.vite,.vitest-cache. No PG/media/browser/wholeimage build/CPUprofile/statistics/fullbackup. --rm container absent afterward; no volumes or credentials created. This is finite impacted dirty-source proof, not clean aggregate or stage acceptance. No failures in code/checks this round. Read-only discovery error retained: initial rg wildcard operand rooms*.test.ts rejected Windows OS123; exact discovered room-private-protocol.test.ts then read successfully.

Exact final hashes, same before and after checks; original EOL preserved:
- apps/api/src/rooms.ts ee4f9d3752c8912c5a79b9b6317d3cd3b8900dd6bb71b2f2a8987bb7fe3dde33 (490CRLF/490LF)
- apps/api/src/topic-room-registry.ts f4c08b77b9d4b0fae443953817b908fea19e448a0b6985c9e49af2dd428f1cd7 (0CRLF/102LF)
- apps/api/src/room-private-protocol.ts ebc3fc6d4135bfc1c63dd818d8706498a2588676e81349b86ebe77d04d5e6b62 (0CRLF/23LF)
- apps/api/src/room-private-protocol.test.ts ca03cad8ab81784a56d0e66a3245222d562f7673a383e7b6583fe8108d326962 (0CRLF/98LF)
- apps/api/src/topic-room-registry.test.ts e89a38eeeeb10889ef23918b54bbf31a54b7a43dbfcd967c732ebab0122d2f01 (0CRLF/121LF)
- apps/api/src/topic-room-lifecycle.test.ts 5991da6b23d3d607f7c0efcbe04e382c14b89d2454823584b9370f58d0597205 (523CRLF/523LF)

Own ignored artifacts .artifacts/p07-prepare-guard-fix10:
- linux-targeted.txt c44dbae1f0b9b84060af5d6a687a03456fa34b0771fdce511d0b713b1e7972e3
- receipt.json e2574d5413392d0c68c29292b5f9a1919ee2ed1da6d984005668f1df455585ba (exactimage/files/EOL/checkresults)

- 2026-10-25T17:35:10Z — Handoff parent: implementation and impacted checks complete. No promised latency/aggregate PASS; real8client clean repeat and independent nonauthor engineering/security gate required. STOP, no further improvements/tests. Scope only6source/directtestfiles +ownjournal/artifacts; no C/ROOT/Git/manifest/oldseals/status/other journals edits.
