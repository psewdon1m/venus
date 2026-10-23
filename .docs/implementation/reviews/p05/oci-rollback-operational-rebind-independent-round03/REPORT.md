# OCI03 historical operational rebind — independent review

Verdict: **PASS_OPERATIONAL_REBIND_ONLY**, 2026-10-20 UTC. No actionable finding in the reviewed operational metadata/projection. Reviewer did not author OCI02/OCI03, the resource feasibility probe or image proof. No Docker, service, database, selector or browser operation, activation, ACK write or producer modification was performed.

## Exact bytes and inherited method

Author packet INDEX `45e7dc10d5a925b8da4939c543b8f422676ce6d6c925009a0a74e73c6735eecf` verifies with all 102 children. Working producer INDEX `552590591c8f255cc7963fc738da045731a6ce0fa060f709854c0ee72c2bf853` equals its durable author mirror, and its full 102-entry source map verifies. Parent OCI02 INDEX `f3e37a87d3a154302e9177d15031e39b8837575c41aa507410283ebff645914d` and complete source map remain unchanged.

All 29 executable/config files and eight pinned synthetic fixture files equal OCI02 byte-for-byte. The 14 mandatory controls, positive private checks and denial semantics, three boots/two image switches, compilation pins, policy/metadata profile, source identities, budgets and timeout equal the parent. Fixed limits remain 512 MiB total, 320 MiB native + 160 MiB admitted host + 32 MiB burst safety, 900 seconds and 10 GiB reserve. No DB restore or external authority rollback is introduced.

The existing independent OCI02 review INDEX `789492910f6cbaea7e7b936eae3bd803333fe0b14b64a240ff80e43d12a621b0` and all nine indexed children verify. This review accepts the new metadata binding to that method; it does not repeat or upgrade its functional claims.

## Source, images and actual resource inputs

The real readonly driver inventory succeeds against `C:\.projects\venus\.artifacts\p05-recovery-source1274-01`, exact 1813 files and source identity `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad`. Its existing excluded `.venv` junction resolves the original Python dependency runtime; no dependency link or source was added by this review. B remains the historical source `13b24714f3dd2d6e2ea08e911042defb4ce0161b956a9bcc74af533d3795120e`. Current live content/tooling revisions are outside this historical qualification.

Images are explicitly rebound to A `sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f` and B `sha256:b6f49831e1ca16dafdcd45707144f050f4e302d4709a51d59f9981ce7b67ed6b`. Image review INDEX `c451ddef9cec3ae0fadf1b9aa3d955c3ce7d5bffa60034cb9b91c9652e44db6c` and all eight children verify. Each fresh 81-file actual union includes the exact 73 receipt files and 74 runtime projection files. Runtime projections have the same keys and hashes as the parent; actual container IDs and image/source identities are consistently bound. Expanded-map SHA is `e8d4b25b79c55a1ce8e92b121b41248c8e6b3ed1ce61d6f94742aed668127ab4`. Metadata absence remains explicit; VersionDTO remains a synthetic fixture assertion.

Resource proof INDEX `e0eea2d1f15f65ae9eba2447616ec03b5cc466a749ade8ae55808174ead8e830` and all ten children verify. Its four actual checks cover native reserve/IPCnone, PG248 data + 8 MiB SHM initialization/health, six readonly keeper mounts/IPCnone and own 2 MiB ENOSPC. Cleanup completed with empty final owner-filtered container/volume inventories. One initial `pg_isready` poll returned 2/no response before a later poll returned 0; the preserved probe explicitly permits bounded readiness polling. This does not weaken an OCI14 assertion. It does not prove the full 512 MiB worst case, all failure paths, all 14 functional controls or 900-second execution. READY applies to the exact unchanged guard and these bounded inputs.

Every operational input copy equals its referenced original SHA/size. The resource guard module pin `30924872181c6f1fe15e657b4f031679207e9cbd16b9c64885a44514d23f05c9` remains exact. Continuous guard checks and final independently stopped/cleaned receipt requirements remain active; an active-only guard snapshot is rejected.

## Explicit activation projection

The present BINDING is author pending/root_run_ack false. Its included ROOT_RUN_ACK is NOT_AUTHORIZED. Both refuse execution. This review explicitly accepts only the following later root activation procedure:

1. After this review and root inspection, change only BINDING.status to `ROOT_FROZEN_INDEPENDENTLY_REVIEWED_READY` and BINDING.root_run_ack to true.
2. Derive a fresh producer INDEX/source_map from the actual resulting bytes. Preserve every executable, fixture, receipt, projection and the included false ACK template.
3. Issue a new external, one-attempt root ACK binding that final INDEX digest, exact expanded-map digest and guard digest, and record this independent operational review digest with the historical source/image scope.
4. Check the resulting exact bytes/ACK before any fresh actual run. This report does not itself activate or authorize Docker.

Twenty-six independent cold controls PASS. Pure authority controls reject pending producer/template, status-only ACK, projected producer without a fresh ACK, wrong final INDEX digest, attempts != 1, statistics flag, wrong/missing guard/map pins and unready binding. The matching two-field projection is accepted only by a pure synthetic check; that check is explicitly not a real refreeze or ACK. Final guard receipt controls reject active snapshot, wrong owner, pending cleanup, fault, unavailable persistence or deadline overrun. The live producer source map and exact readonly driver source check pass.

Commands, final exit 0:

- `.venv/Scripts/python.exe -B .docs/implementation/reviews/p05/oci-rollback-operational-rebind-independent-round03/verify-inputs.py`
- `C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/oci-rollback-operational-rebind-independent-round03/authority-controls.mjs`

Author records separately preserve 40 finite commands and 216 controls with their expected exits. This reviewer verifies those frozen records and runs the independent 26 controls above; it does not claim to rerun the author's 216. An initial verification harness wrongly expected every resource CLI invocation to exit 0; its failure is preserved, then corrected to check the precise allowed pg_isready readiness poll and subsequent success. One read-only exploratory inspection incorrectly indexed the image list as a dictionary and exited 1; corrected schema inspection succeeded. These are review harness/inspection errors, not hidden product passes.

## Limits and rollback

No actual OCI switch has been performed by this task. Root must record all 14 controls, real switch chronology, failure cleanup and exact evidence on the next authorized run. No current live source, production/TLS/DNS, human450/470 content, browser matrix, R100 or full P05 acceptance follows from this PASS. Existing METHOD08 FAIL remains independent and unchanged.

Before actual execution, rollback is to leave producer03 inactive and issue no ACK; no service state needs reversal. After a functional attempt, owner-scoped cleanup and the existing application rollback protocol apply, with failures retained. Do not rewrite old image IDs/proofs or restore older safety authority data.
