# P08 Security/Privacy exit — round01

**CHANGES_REQUIRED. P08 exit/security PASS is withheld.** Independent non-author review of frozen HEAD8600fe2f7c80a9b6cbf8c72507b869f55f71cbd0/core3ca43ec1112e618e4a1212b14769fa1d270faa349d57207b30936983ae966c4f, compared with accepted4954c85f778309142ea5e01b413bd120b7ab1a9a.

All1971 source hashes in W match the raw before/after inventories; the canonical inventory hash was independently recomputed. All29 changed implementation/test component files match ROOT. Round10 INDEX8e347ba02206ea408f0195330a71c31f82bf57eab54017adca6a522a8e8b7e0b and all16 indexed hashes/lengths match. The11 PASS cases/native0/cleanup and real PostgreSQL restore of5 rows remain valid bounded evidence. They do not test the two final-delivery gaps below. No general matrix, Docker, API, root Git, source or secret operations were performed by this reviewer. One standalone Node buffering probe was executed as described in INPUTS.json.

## S01 — JSON state response escapes the final enqueue fence [P2]

Location: apps/api/src/music-routes.ts:8; Music.dispatch invokes the callback after finalAccessFence, but the callback calls reply.send(view).

Trigger: an asynchronous Fastify onSend chain delays response delivery; the room/session/entry/catalog authority changes after the transaction/fence releases and before raw response enqueue. Queue/track/state metadata selected under the earlier authority can still be sent. The repository's http-delivery.ts explicitly documents this gap and existing Games/private routes use enqueueFencedJson to avoid it. A synchronous call to reply.send is not the final synchronous transport enqueue contract.

Minimal fix: reuse existing enqueueFencedJson in Music GET, keeping dispatch's final fence adjacent to raw enqueue and normal guarded error handling. Add one narrow regression for the async-onSend/final-delivery boundary; no broader framework or full60-second drift rerun is required for this finding.

## S02 — Readable prefetch can deliver an authorized old chunk after revoke [P2]

Location: apps/api/src/music.ts:53–59, particularly finalAccessFence/catalog check followed by readable.push(bytes) at57; music-routes.ts:19 later pipes the Readable through Fastify.

Trigger: destination backpressure pauses piping while the next64KiB chunk is prefetched into the Readable buffer. Revocation can complete before that buffered chunk reaches the actual HTTP write; resuming the pipe drains it without another room/generation/catalog fence. The room transaction protects buffer insertion, not the later transport enqueue. Header hooks alone do not prove an audio leak because the first read starts after piping; this finding is specifically the prefetched-data path.

A standalone Node Readable/Writable probe with the same async-authorize/push pattern and a slow destination exited0: chunks0 and1 were authorized before revoke, but destination.write for chunk1 occurred after revoked=true. This confirms buffering mechanics; no actual P08 endpoint exploit is claimed.

Minimal fix: remove the unfenced Readable prefetch stage and synchronously write each bounded chunk to the HTTP transport immediately after the current room/generation/catalog/fd fence while its transaction is held. If write returns false, await drain only after COMMIT/lock release; reauthorize before every subsequent read/write. Preserve one in-flight chunk, stream counters,30-second idle and close/error/fd cleanup. HEAD must authorize/send headers/end and release without starting a body pump. Already raw-enqueued/network/browser bytes cannot be recalled; buffered-but-not-yet-transport-enqueued data must not bypass the fence.

The author has accepted S01/S02 and proposed exactly this narrow correction. Required next proof is the relevant JSON enqueue and actual HTTPS/backpressure-revoke behavior on the new frozen bytes, including bounded cleanup/HEAD handling. Neither implementation nor corrected execution is accepted in this round.

## Scope and handoff

Reviewed room-cookie path, native same-origin/Range read guards, existing18+/session/generation fences, host/revision/idempotency serialization, catalogue digest/asset hash/rights expiry checks, bounded assets/streams, additive schema and backup/rollback caveats. There is no further concluded finding in this stopped round; remaining focused validation belongs to round02 after the concrete fixes.

U024 resolves the old source-choice hold with host files and own synthetic development audio. It does not approve third-party track rights. Additive Music data and audit actions remain separated from externally retained audio files/registry/keyring; restoring revoked/different catalogue must not reactivate a pinned queue. The original signed0.0.1 is immutable and has no Music feature claim.

Eight browser contexts, null audio sink and Firefox/WebKit decode are local synthetic evidence, not professional rights, physical-device or public-production acceptance. P09 actual Cinema+Music and final P07 remain pending. Original450 HOLD/current470 temporary local-pilot approval is unchanged. Prior FAIL01–09 and round10 are preserved. No shared registry/plan/status/manifest/root index or another journal was edited.

**COMPLETE_STOP.** Preserve this round; author fixes and relevant tests precede independent round02.

