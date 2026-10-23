# OCI12 missing location: independent narrow diagnosis

DIAGNOSTIC_OMISSION_MECHANISM_CONFIRMED_ORIGINAL_SITE_UNRESOLVED. Actual OCI12 retains native B2 AssertionError/ERR_ASSERTION without source_module/line/column after A1 completed; A3 did not run. The host wrapper separately has host-runner38:909. No exact original B2 assertion or original message/stack descriptor length was retained, so its precise cause/site remains unproven.

Source inspection finds no generated path mismatch: factory writes /private/modules-B2/replay-observations.mjs, observations.mjs, harness.mjs and the other generated names that safeError explicitly permits; direct producer module paths are relative to the same import.meta.url mount. There are deliberate omission branches for oversized native name/message, oversized or unavailable stack, unrecognized/changed formatter, no allowed frame and malformed coordinates. The actual safe projection does not report which branch occurred. Large deepEqual effects assertions are a source-consistent hypothesis, not observed actual message evidence.

One explicitly authorized tiny native noDB contract probe ran on the exact B4 image62602920, Nodev24.22.0. No network, root filesystem read-only, UID1000,128MiB/0.25CPU/PIDs32, no capabilities/private volumes/DB/listeners. It imports only exact producer12 safeError/scenarios and triggers synthetic assertions. Exit0, empty stderr; its uniquely named --rm container was confirmed absent afterward. It touched no old OCI09/10/11/12 retained resources or application rows.

Observed native contract:

| Synthetic assertion | Message chars | Stack chars/kind | Projected location |
|---|---:|---|---|
| Short | 51 | 402 / native getter | scenarios28:22 |
| Long | 6070 | 6421 / native getter | omitted |
| Same long error with temporary bounded synthetic own message | original descriptor restored | same native frames | scenarios28:22 |

The default Node formatter is recognized. The long stack is below16KiB, so the >2048 message guard alone explains omission in this exact native cold reproduction. The synthetic test synchronously restores its original own message descriptor; no raw message/stack was emitted. This confirms the failure mechanism and rules out a general exact-B4 Node/path incompatibility for the tested short case. It does not prove the original application had identical message length or formatter state.

A minimal prospective helper correction can format only a recognized native lazy stack with an explicitly safe bounded own message, restore the exact original data descriptor synchronously, and retain all existing proxy/getter/custom formatter/size/path filters. This needs new exact bytes and independent focused privacy/native controls; it must not change assertions or serialize private values. Root is authoring that diagnostic correction separately. This agent authored no OCI13 implementation, functional oracle change or STEP framework, and authorized no further whole OCI attempt. If still omitted, a bounded static omission reason may identify the diagnostic branch without raw values.

Actual FAIL and retained native private/DB resources remain unchanged. Source/input hashes and safe native output are frozen here. No actual failure location or full OCI/P05 PASS is claimed. Storage application review remains the next priority. Writes COMPLETE.
