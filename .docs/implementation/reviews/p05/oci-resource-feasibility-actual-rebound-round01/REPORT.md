# Actual bounded OCI resource feasibility — rebound historical snapshot

Verdict: **PASS_BOUNDED_RESOURCE_FEASIBILITY_ONLY**. One root-authorized attempt exited 0 in 10.328 seconds; all four finite controls passed. This is prerequisite feasibility for the exact restored source1274 snapshot and newly rebuilt image A29e39. It is not OCI14 functional acceptance, current live P04r3 qualification, full P05 PASS, statistics execution, or human card approval.

- Root ACK SHA256 `83ccceb139829a9266bfa94104f604af410822b8bb80da5d7af60497844790cd` binds exactly one attempt, probe, input manifest, accepted independent method/image reviews, source and image digests. Probe SHA256 `ad6af45e6db9fbe357708888726aea381524c90783d86abc49d744d74fc37dd7`; input manifest `c0fd9437805129dcd4cddfebf05ebaf9c7b766dde5bb8e5d11027f566b6e0fa2`.
- A `sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f`; PG `postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8`.
- Historical cwd `C:\.projects\venus\.artifacts\p05-recovery-source1274-01`; source `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad`, 1813 included files, checked by the executable before/after. Existing excluded host dependency junction was recorded in the cold rebind packet. Live source and old proofs were not changed.

## Actual results

1. Native reserve: actual Linux statfs free `1013199908864` bytes (above 10GiB); explicit Docker IPC none, no network or ports; captured actual mountinfo has no /dev/shm. Host free check runs before each bounded command/write.
2. PostgreSQL initialized on its own 248MiB tmpfs and 8MiB /dev/shm; actual mountinfo/statfs and `SELECT 1` passed. The first pg_isready returned expected startup exit2, then exit0; both raw attempts are retained. No limit was increased.
3. Keeper used all six expected mounts readonly, explicit IPC none and the accepted exact `ipc-keeper`/`ipc-policy` runtime checks. Actual exec write attempts returned EROFS/EACCES for all four destinations. No product server ran.
4. A helper filled only its own 2MiB quota tmpfs: exactly 2097152 bytes then ENOSPC, deleted its own prefix and confirmed empty. Host filesystem was not filled.

## Bounds and cleanup

Native reservation was 298MiB (248data+8SHM+32authority+8private+2quota), below authorized320MiB. Work130s+cleanup50s remained inside180s; each CLI operation had30s or PG-health60s cap. 49 command records, raw report 190345 bytes; own artifact tree 193219 bytes below2MiB. Four containers and three local tmpfs volumes were discovered under fresh owner `b458a306e3d644e887be92b27d278e53` / project `venus-oci-resource-7a2e9c9ef86a`. Finally cleanup re-inspected exact owner/name/image/IPC/network or volume driver/options immediately before deletion and ended with empty owner container/volume inventories. Root's retained R100 owner a2a6f0422ae6d811953ed137afa7b496 was outside every filter/name; no foreign-resource operation occurred. No networks, ports, image pulls/builds, full OCI switches, or statistics were performed.

## Provenance and limits

The executable's cold derivative was independently root-reviewed (single image constant replacement); accepted OCI02 method review789492... and independent rebuilt-image reviewc451... remain unchanged. This agent performed these independent actual controls against the OCI implementation; this resource probe is a narrow test harness, not a new acceptance of its own OCI03 operational author work. Raw actual records and an offline parser recheck are included. Overall P05 remains open; root reported separate METHOD08 tar-stage and browser observer failures, which this probe does not repair. Human470 HOLD remains unchanged. Prior blocked attempt packet and failed journal append (relative historical cwd, corrected immediately in the live own journal) remain preserved.
