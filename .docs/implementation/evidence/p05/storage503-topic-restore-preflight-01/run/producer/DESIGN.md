# P05 full PostgreSQL restore — proposed component proof

Status: DESIGN / NOT_RUN. Author: root. This checks existing P05 recovery rules; it does not implement P06 update/export and does not accept the stage. Included source stays frozen at 895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04 /1808 inputs. Synthetic content only, real PG/HTTP/filesystem lifecycle. Owner450 HOLD unchanged.

## Boundaries

Use exact image sha256:00c46c7a5fd255dcebb43ec34decc1b27234a67f83ffead8d4828238fe96700a and pinned PostgreSQL16 image. The host controls its unique labelled Docker project, performs pg_dump/pg_restore through the DB container and writes only owned artifacts. API component runs nonroot/read-only/cap-drop, no Docker socket or host ports. Resource ceiling API1CPU/768MiB and DB1CPU/512MiB; deadline10min per phase. No source, production registry, general filesystem or external service mutation.

The fixture creates its own five protected monotonic roots and ephemeral keyring on its container tmpfs. A single controller keeps that container alive; distinct Node server children are reconstructed from a protected private configuration in tmpfs. Do not write key material, cookies, invite tokens, private text or decrypted personal settings into evidence. Final cleanup removes the container, DB volume/network and secret directory after checking ownership.

No in-memory row restoration is counted as full restore. Host executes pg_dump --format=custom --no-owner --no-acl of the entire isolated Venus DB, then pg_restore --clean --if-exists --no-owner --no-acl --single-transaction into it after all server connections stop. The raw dump stays in the owned DB container tmpfs; its SHA/size and pg_restore exit are recorded. It is synthetic and never presented as a production backup artifact or implementation of backup retention. Existing sealBackup/openBackup have separate tests; this proof does not replace them or claim an encrypted exported file.

## Ordered phases

1. Start first actual Node server with real Rooms, TopicGames, TopicRoomRegistry, TopicRoomLifecycle, PrivateTopicPreferences, source provider and createApp. Apply real migrations. Explicitly declare any derivative harness replacement; all imports and source pins remain exact. Admission, topic acceptance, chat and leave/close use protected HTTP. Presence may use actual Rooms.connect with HTTP ticket as an explicit transport fixture; no WS/browser claim.
2. Create active room A with bilateral private prompt/chat, active room B that will close, and room C with a member that will leave. Snapshot exact encrypted DB rows, identities, history and byte hashes for comparison. Record external root heads. Stop first server and all PG client pools before dump; controller signals READY_FOR_DUMP. Host performs full dump, obtains SHA/bytes and signals DUMP_COMPLETE.
3. Start a second real Node server from the same private config. Its boot barrier revokes old ephemeral grants; establish a fresh permitted private moment if needed before the narrowing. Add a durable topic exclusion in A; leave C's peer; close B. Verify positive receipts and external roots advance. Stop second server/pools. Record root tree hashes/heads; controller signals READY_FOR_RESTORE.
4. Host restores the full pre-mutation dump and signals RESTORE_COMPLETE. Before any third server boot, a read-only PG observer proves restored raw rows really contain the original open B/live C credential and old A encrypted data. Compare every scoped raw row to the dump snapshot; distinguish any unscoped DB metadata not compared. External roots remain byte-identical to the post-mutation roots. This demonstrates an actual rollback attempt, not an empty fixture.
5. Start a third distinct Node process. Run real topic bootGate, legacy reconciliation and Rooms.maintain before opening its listener, in the same ordering as server.ts where applicable to the synthetic composition. Verify stable active session identity/snapshot, durable exclusion union, no old invitation/topic/action/advice/chat grants, no old private references and denied old retired credentials/closed room. New identity with same display name gets no old settings/role. Do not seed authorization or declare unsupported production loader approval.
6. Inject one missing/corrupt required authority file in an owned fixture, verify read fails closed without rebuilding it, restore exact saved bytes and verify recovery. Record whether failure is per-room HTTP or startup; never conflate them. Stop all children, close pools and verify owned cleanup before PASS.

## Fixed controls (all required, no missing/duplicate IDs)

| ID | Required assertion |
|---|---|
| P05-RESTORE-01 | Actual migration/schema3, protected roots and distinct first child PID; admission positive. |
| P05-RESTORE-02 | Actual bilateral prompt plus HTTP chat canary before dump; ciphertext snapshots and original scope nonempty. |
| P05-RESTORE-03 | Quiescent entire-DB custom dump exit0, nonzero bytes/SHA, no server/pool connections. |
| P05-RESTORE-04 | Distinct second child and boot revokes old transient scopes; scope identity/history remain. |
| P05-RESTORE-05 | Actual HTTP exclusion in A plus member leave C and room close B, external monotonic evidence advances. |
| P05-RESTORE-06 | All pools stopped; full pg_restore exit0; original raw rows/ciphertexts/credentials demonstrably restored before boot. |
| P05-RESTORE-07 | External five-root tree/head bytes unchanged across DB restore; no root copied from old backup. |
| P05-RESTORE-08 | Third child PID distinct and boot barrier completes before listener; old private prompt/chat/action/advice/refs unavailable. |
| P05-RESTORE-09 | A identity/snapshot and applicable history retained; post-dump durable exclusion survives old DB preferences. |
| P05-RESTORE-10 | B remains inaccessible/closed and C retired credential denied despite restored old live DB rows; lifecycle convergence checked. |
| P05-RESTORE-11 | Same-name new anonymous identity cannot inherit old identity/settings/host role; separate current admission mandatory. |
| P05-RESTORE-12 | Missing/corrupt authority fails closed, read does not repair; exact restoration recovers scope; cleanup/pins mandatory. |

Source/producers before, after and after finally must match full maps; report pins image, project, actual PIDs, dump/restore logs, scoped SQL comparisons and explicit fixture seams. Preserve every failed attempt. Independent producer review precedes functional RUN, independent actual evidence review follows it.

## Separate remaining gates

This proof does not demonstrate a compatible previous production OCI rollback, a production-approved V2 source, host-file backup retention/deletion, all UI/browser engines, statistics, production deployment or full P05. Prior P04 reader cannot be assumed compatible with protocol2; a compatible-reader rollback/quiesce proof must be explicit and preserve external roots.
