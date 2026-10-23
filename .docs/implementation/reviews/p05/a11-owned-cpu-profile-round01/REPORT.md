# A11 live owned application: bounded CPU sampling

Captured successfully: one requested7s profile, actual7053.062ms,6380 samples, sampled time7052.889ms. **Native fsync dominates this measured interval:5245.016ms /74.367% of sampled wall time.** This is a measured synchronous call-stack hotspot, not a claim that74% of CPU cycles were spent computing or that it alone explains the entire slow attempt. Blocking native I/O can retain that stack while sampled. No application change follows from this report alone.

Target was the already running root-owned `venus-pilot470-0426e2bb3223-app-1`, exact imagec0093244e5b617b68d1f5161ade213ffb52f39aa6ade20eb233389c70bc2b665, source label597f1a35ff33d1d242e889949445aa1320f9c0d9b1aa9a754b1115d13d131264. Compose project/service and normal CMD `node apps/api/dist/server.js` were checked before signaling. `/proc/1/cmdline` was verified again inside the control process before SIGUSR1. No new container or workload, reset, restart, kill, SQL or source edit.

SIGUSR1 enabled the Node PID1 inspector at container127.0.0.1 only. No9229 host binding was added; before/after inspect shows only the existing4300/tcp mapping. After capture, `/proc/net/tcp` shows listener0100007F:240D and no IPv6 listener. CDP used only Profiler.enable/setSamplingInterval/start/stop/disable; profiling was disabled and the control WebSocket closed. The unexposed diagnostic listener remains until the parent's existing owned-container teardown. No Runtime evaluation, heap snapshot, arguments, query data, request bodies, credentials, cookies, keys or private payloads were collected. Stored profile contains static callframes/child IDs/hit counts and sample times only; non-file/non-node URLs are redacted, query/fragment removed from file URLs.

| Aggregate | Inclusive sampled wall | Self sampled wall |
|---|---:|---:|
| native fsync |5245.016ms (74.367%)|5245.016ms|
| topic-room-lifecycle locked (compiled554) |6523.737ms (92.497%)|2.456ms|
| private-topic-preferences topicStorage (compiled8) |5164.866ms (73.231%)|0ms|
| private-topic-ledger read / locked (compiled250/400) |4846.834ms (68.721%)|read0ms /locked1.021ms|
| private-topic-ledger syncDirectory (compiled294) |3867.806ms (54.840%)|0ms|
| API security canonical (compiled17) |see retained aggregate|255.030ms (3.616%)|
| engine pack canonical (compiled7) |see retained aggregate|85.476ms (1.212%)|
| garbage collector |154.998ms (2.198%)|154.998ms|

Inclusive columns overlap ancestors and must not be added. Recursion of the same function is counted once per sampled stack in function totals. Full per-function and exact fsync leaf-to-root stacks are retained, including idle/native frames. Read-related stacks include `PrivateTopicLedger.read→locked→syncDirectory→fsyncSync`; callers include room lifecycle retirement/live/member and preferences loadOwner/assertPlannerCurrent/readForPlanner. Source `private-topic-ledger.ts:223–224,255–260,325,329` confirms reads enter the shared lock and synchronously fsync the directory around creating/removing its lock. This observation identifies concrete read-path work; it does **not** authorize removing durability or safety fences.

The7s profile is only one interval under this attempt's actual request/WS load. The attempt is now **instrumented**, including signal/debug listener/control process/profiler overhead. It cannot be presented as a clean uninstrumented latency comparison or certify absence of transport/queue delay elsewhere. Root's prior PostgreSQL SELECT1 observations are separate and are not remeasured here. Historical unknown500 remains unknown; A10 QUERY_TIMEOUT diagnostics and this A11 sample are distinct observations.

Raw CPU profile and compact aggregates are in this packet, no real private data. Capture exit0/empty stderr, no second capture. Exact bytes/pins in INDEX; no stage/gate PASS, no application or test-tool implementation. Parent retains teardown ownership. Writes COMPLETE.
