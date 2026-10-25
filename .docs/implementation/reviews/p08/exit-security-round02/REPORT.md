# P08 Security/Privacy exit — round02

Independent non-author review: **PASS for the qualified local Music component** on `70ec9416c666483a198d79db21167ebad4ea58c5`, core `7e634af0fedaa1eb5f1a38082bca4b530f8ad3418b6d91cf7db0bff09a2dcdd9` (1971 files). No open concrete security finding remains in this bounded correction review. Round01 FAIL remains unchanged.

## Findings closed

| Finding | Exact corrected boundary | Independent assessment |
|---|---|---|
| S01 | `apps/api/src/music-routes.ts:9`, existing `http-delivery.ts:5–12` | State GET calls `enqueueFencedJson` inside Music dispatch's synchronous final fence. Serialization and raw header/end enqueue have no asynchronous Fastify onSend interval. Closed by exact source inspection and existing helper contract; no new delayed-hook test is claimed. |
| S02 | `apps/api/src/music.ts:44–84`, routes `:18–22` | Removed intermediate Readable. Each at-most-65536-byte raw write follows room/member/generation authorization, current catalogue/fd check and final access fence in the same room transaction. Headers begin synchronously at the first guarded delivery. Drain waits occur after COMMIT and lock release. Closed by source inspection plus actual production Music/PG/Node Writable backpressure-revoke case. |

The new integration case (`tests/p08/integration.mjs:47–54`) blocks the first Writable callback with highWaterMark1. Actual public room-close commits before drain is released. The subsequent delivery rechecks access, destroys the sink and asserts exactly one raw enqueue. This tests the prior prefetch failure boundary directly without holding a room transaction during client backpressure. It is an in-process actual Writable/PG test; the supplied browser cases exercise actual HTTPS/native audio separately.

The corrected lifecycle has a 30-second timer, target close/error cleanup, a single-use delivery guard, and idempotent fd/stream-count release. A second aborted/destroyed/fd check follows awaited authorization/fence work. HEAD authorizes and ends within the guarded transaction without a body; that conclusion is source inspection, not a separately claimed actual HEAD case. A failed check before headers propagates; after headers it destroys the transport. No second unfenced application buffer remains. Bytes already accepted by raw.write or the network are irrevocable; this does not provide DRM or erase browser audio buffers.

ENG001's associated local autoplay change is bounded to frontend retry/error handling and generation checks. Existing controls, shared tuple authority and native stream guards remain in place. Actual Firefox/WebKit denial-and-explicit-recovery cases support the correction; engineering UX acceptance is owned by the separate engineering reviewer.

## Exact evidence

Independently checked SHA256 and byte lengths of all16 files in targeted-round11 and all4 files in correction-preflight01: zero mismatches. Recomputed the sorted source-map identity, verified every1971 W file against it, verified raw inventory receipt hashes and equal before/after source maps, and compared the seven reviewed correction/contract files between ROOT and W. W HEAD is exact70ec. Current W has derived registry/journal/evidence changes; the earlier actual run's clean-source claim and unchanged core are independently bound by its raw inventories, not inferred from current Git status.

Actual targeted11: native exit0,12/12 cases PASS, cleanup completed. It includes host ACL, replay/conflict/Origin checks, Range and room boundary, pause/seek/restart/auto-next, Music with actual Games, catalogue revoke, retained-cookie leave denial, close/idle/schema guards and the new backpressure case. Eight Chromium contexts produced480 samples with p95=104.320ms under the declared local profile; actual Firefox/WebKit decoded own PCM and recovered from forced autoplay denial. Null audio output and synthetic fixtures are explicit. Actual PostgreSQL16 custom dump/restore returned five equal rows, table hash `82ac730311ef3558987303ffaf6d1c2a138db79f4a403179108c54b7a8bc100a`; external audio files were excluded.

Correction preflight reports four sync units PASS and impacted lint/API/Web types exit0. Its dirty-root provenance is retained; six exact source-file hashes match the reviewed clean-source implementation. The reviewer ran no tests, Docker, browser matrix, network or API calls. Unchanged catalogue/rights/deletion/read guards, migration and rollback mechanisms reuse the prior source review, rebound to the unchanged relevant bytes rather than claimed as new executions.

## Qualification and remaining scope

This is the P08 Security/Privacy exit gate for the accepted localhost/operator-files synthetic Music component. Professional third-party rights, physical devices and public production remain unaccepted. Rights metadata/hash enforcement does not establish ownership or a legal licence. Audio/registry files and rights evidence must be retained separately from the DB backup; a changed/revoked catalogue cannot be made playable by restoring old queue rows. Disable Music and preserve the additive schema/protected ledgers for rollback; no destructive downgrade is accepted.

Actual Cinema+Music integration remains P09 work; the internal pause hook is not that proof. Final P07 integration remains pending under U022/U023. Owner450 HOLD/current470 temporary local pilot acceptance is unchanged. Immutable signed0.0.1 has no Music feature claim. This gate grants no full-project, professional-rights, device or public-production PASS.

Inputs and machine-readable decision are adjacent. Only this review and this reviewer's own journal were written. COMPLETE_STOP after final hashing.
