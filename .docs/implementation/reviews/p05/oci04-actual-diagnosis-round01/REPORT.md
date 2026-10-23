# OCI04 actual failure — independent diagnosis and retained-owner cleanup plan

Verdict: **ACTUAL_FAIL_CONFIRMED / CHANGES_REQUIRED**. Three P2 failure-path findings below require a new producer revision. The successful host-startup review did not promise actual OCI14 behavior. This actual run got past the former cycle, provisioned resources and attempted A1, then failed. B2/A3/browser controls did not complete and there is no14-control PASS report.

Run root is `.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-p05-oci-ffaaeef4fe2b`, owner `2bae434a9f866273ef7e1bfeaee54dc1`. Root stdout exits1 with `NOT_ACCEPTED_BEFORE_OR_DURING_AUTHORIZED_PLAN`. Exact ACK, activated producer INDEX/map, image/map/guard pins and real restored source1274/1813 verify in evidence-verification.json. Current live source/content is outside that scope. No failed-prefix write, start, new container, cleanup, private database, keyring or password read occurred in this review.

## OCI04-ACTUAL-R01-001 — P2: generated harness loses the image package-resolution anchor

A1 terminal has FAIL, `Error / ERR_MODULE_NOT_FOUND`, empty chronology and elapsed525.881233ms. Its original error message was not retained. The generated module lives at `/private/modules-A1/harness.mjs`; factory relocates relative app/engine/fixture imports but leaves `import pg from 'pg'` bare.

After verifying exact keeper owner/name/image, IPCnone, networknone, read-only root and all six readonly mounts, an **import-only** reproduction on the retained exact generated module reports:

`Cannot find package 'pg' imported from /private/modules-A1/harness.mjs`

The exported harness/composition/listen functions were never called. The same image's `/app/package.json` anchored require resolves pg to `/app/node_modules/pg/lib/index.js`; pg exists in the image. This isolates package lookup from the generated `/private` location as the failure. Source SHA, static import list, exact typed reproduction and allowlisted container metadata are frozen in owner-forensics.json. This is separately recorded post-run reproduction, not a rewrite of the original truncated error.

Required correction: mechanically anchor the allowlisted bare package import(s) to the pinned image dependency root, with exact source/adaptation checks. Do not install packages into private volumes, change product source or replace actual modules with mocks. Add an image-bound import-only test for the complete generated graph from its real `/private/...` location before another full attempt. Retain exact generated-source/import provenance and reject unaccounted package seams.

`pool_closed:false` is a failed phase marker, not proof of a leaked application pool: the failure occurs while linking the module before exported harness invocation. No DB inspection is needed to resolve this import error.

## OCI04-ACTUAL-R01-002 — P2: live-control rename fails on the actual Windows path

Both actual guard-failure.json and guard-stop.json retain the same explicit `EPERM: operation not permitted, rename .../control/guard.json.next -> .../control/guard.json`. Guard-stop is NOT_ACCEPTED, native-probe cleanup completed, elapsed76430.1243ms. This error is now actual recorded OCI04 evidence; it does **not** retroactively identify the missing original R100 METHOD08 exception.

Seven cold native/source controls PASS. Holding the exact scanner's real FindFirstStreamW enumeration handle on a separate Windows fixture blocks replacement with EPERM and leaves the temporary file; the same rename succeeds after handle close. Exact allocation accounting then succeeds, and ADS/hardlink rejection controls still refuse invalid files. This confirms a platform sharing/rename causal class.

**The actual lock holder is UNKNOWN.** The exact scanner does lstat, stream enumeration and FileStandardInfo accounting, not JSON-content reading/hashing. Its allocation handle uses share7. The supervisor awaits its own scanner subprocess before publishing that sample. Consequently, this sequential source path does not prove that the same scanner overlapped its own guard rename. Other actual readers include ResourceLease inside bound runtime containers; no specific reader/antivirus/other holder was observed or attributed.

Required correction: treat Windows publication/reader sharing as a real operational failure class, preserve first and secondary errors and remain fail-closed. Splitting live controls from immutable allocation walks is reasonable, but is not by itself evidence that every rename conflict is removed. Any publication strategy must also be tested against actual reader/share behavior. If a narrowly bounded sharing-error retry is chosen, it must reuse the same owned temp bytes, preserve capacity/freshness/deadline checks and terminate NOT_ACCEPTED on exhaustion; it is not a retry of the functional run or permission to widen a lease.

The proposed live-control reservation is coherent only with an exact finite filename set, each<=64KiB, explicit aggregate allocation/headroom reservation charged **inside existing host160/global512**, rejection of extra names/oversize/ADS/reparse/symlink/hardlink and strict ownership/path checks. Measure immutable owned allocations separately. Do not merely exclude all control files or drop allocation/security checks. A new reviewed module/policy must state which live states may mutate and how bounds remain enforced. This review supplies no implementation or quota acceptance.

## OCI04-ACTUAL-R01-003 — P2: guard failure interrupts the final audit record

runner.json is absent and is not synthesized by this review. Host-runner writes source/producer/final report through a guard that has already latched the rename failure; adapter terminalReport rejects the fault. Final guard.finish can also reject before detailed stdout is emitted. The CLI catch then retains only `error_name: Error`. Actual guard-stop exists, but does not replace a complete root terminal/cleanup disposition.

Required correction: a bounded terminal channel independent of the failed guarded writer, preserving primary A1 error, secondary guard/finalization errors, cleanup disposition and missing-receipt flags. A failed guard must never permit further ordinary guarded filesystem writes or a PASS. Keep retained resources explicit and record stop failure rather than dropping final status. Add IO/terminal/IPC/overflow/finalization fault tests. Never backfill this failed prefix after its supervisor has stopped.

## Scope for corrective OCI05

Use a new immutable revision with five reviewable changes: anchored generated-package imports; bounded live-control accounting within unchanged budgets; tested Windows-safe publication/reader behavior; exception-safe first-error and terminal transport; source/activation/failure controls plus independent review before one fresh root ACK. Preserve the14-control protocol, actual fixtures, privacy assertions, TTLs,512MiB/900s/10GiB limits and held human content. No change here justifies reducing assertions or continuing this failed prefix.

## Retained state and safe cleanup plan

Readonly owner inspection found four exact-owned containers: A1 stopped, TLS stopped, DB stopped, keeper running. Keeper has networknone and readonly mounts. Three owner tmpfs volumes remain: db248MiB, authority32MiB, private8MiB. One exact-owned isolated network remains. The separately labeled resource-probe inventory is empty, matching guard-stop's cleanup claim. Full safe IDs, names, labels, images, mounts and volume options are in owner-forensics.json and CLEANUP_PLAN.json; no secret values are present.

Cleanup is **planned, not executed**. After root freezes/verifies the actual failure archive and this diagnosis, root may execute a new bounded, exact-owner cleanup:

1. Re-inspect the recorded IDs/names/labels/images and exact local/tmpfs options. Refuse mismatches or extra owner resources; never enumerate another owner. Confirm no writer remains and the required nonsecret forensic evidence is safely frozen. If more native data must be retained, arrange protected verified export before deletion; do not print DB/keyring/password data.
2. Stop the recorded keeper ID with a bounded5-second graceful stop, then verify stopped. Confirm A1/TLS/DB remain stopped. Do not restart anything.
3. Remove only those four verified container IDs. Remove only the three verified owner volume names after confirming no remaining attachment. Their removal destroys ephemeral test DB/authority/private state; no rollback of product safety data is performed.
4. Re-inspect and remove only the recorded network ID/name/owner. Verify owner-filtered container/volume/network inventories and resource-probe inventory are empty. Preserve the host failed prefix/archive and record cleanup separately from the failed functional result.

Any mismatch, stop/delete failure or unverifiable export leaves an explicit retained/manual-cleanup result. No global prune, broad deletion, host-prefix rewrite or other-owner operation is allowed. This plan is not a cleanup completion receipt or authorization to resume the failed run.

Verification commands all exit0: owner-forensics.py (bounded owner inspect + inert generated import/anchored resolution), native-controls.py (7 cold controls on disposable fixtures) and verify-evidence.py (actual failure/ACK/map/1813 source pins). No own failed attempts occurred. The final stage remains open; no content approval, production/current-source, OCI14 or P05 PASS is claimed.
