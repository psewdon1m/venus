# Independent security design review — deferred finalAccessFence builder

**APPROVE_AS_NARROW_DESIGN. No concrete privacy/security blocker.** This is a preimplementation design decision against `475d2bfe76eff13930d1cb55b25fd40579c3fcff`, not acceptance of implemented bytes, tests, performance, P07 or delivery. Read-only code/callsite review; no test, Docker/build, implementation, ROOT/C, Git, old seal or manifest changes.

## Why the initial physical pass is redundant here

Current finalAccessFence awaits guard, which obtains a validated DB birth, synchronously checks protected room/member authority, and returns a closure that repeats the physical check. finalAccessFence then reads only the caller's credential/member/entry-offer metadata and returns its combined fence. The proposal removes the first physical execution only in that preparation path. That intervening SELECT grants no permission, returns no private payload to a caller, performs no durable mutation and enqueues nothing. A revoked/corrupt/retired protected scope still fails at the mandatory closure before an Auth is returned or the existing authorized operation/publication milestone is crossed. A DB read error or invalid metadata also fails closed. Consequently checking external physical authority before this metadata-only await is not necessary to prevent private disclosure.

The authenticated expected birth must still be loaded and validated on each preparation. It is an expected scope, not proof that protected authority is live. The physical closure must read protected state afresh every time it is invoked; no earlier success, member admission, retirement status, file bytes or permission may be cached. Current assertRoomAuthority/assertMemberAuthority validate protected root/birth/retirement/admission/member-retirement under their unchanged metadata lock. They do not become readiness or private-topic grants.

## Callsite audit

Production finalAccessFence consumers are Rooms, TopicGames through its finalAuth forwarding helper, Calls, Media, Music and Presentations. No production caller that obtains the returned closure and simply discards it was found.

- Rooms.auth immediately invokes the returned fence before returning Auth. Mutation/reaccept/ticket/admission/current-read paths invoke their existing fences; private/public dispatch invokes before enqueue and preserves child gameDeliveryFence. socketState invokes originalCredentialFence before heartbeat/child work and again after its new final fence, preserving the original credential expiry across renewal.
- TopicGames.finalAuth deliberately forwards the closure. Its mutation/replay/current/http/receipt/availability/target/conversation/chat and self/round bundle consumers invoke it. The safetyFence/normalFence pair is prepared across metadata-only awaits, then both are used synchronously before publishing the relevant result; safety and ordinary acceptance remain distinct. Captured view check closures repeat their own source/consent/epoch/deadline checks.
- Calls/Media invoke the room fence before current grants/views/lease publication, retaining call-scope and lease-specific final checks.
- Music invokes before streaming headers or each synchronous chunk write. It retains catalog fd/asset/deadline checks and does not await between the final fence and output.
- Presentations invokes before state/job/page publication, protected publication/deletion and source/worker authority milestones. Document/epoch/job/serving checks remain separate; no binary publication is authorized by preparing a closure.

Some existing operations perform awaited work after an *earlier* fence and then execute a later fence; this design changes neither the order nor placement of those milestones. It must not be used to justify dropping any existing invocation or moving private/durable work into the new preparation interval.

## Approved implementation boundary

Add optional trusted server-internal prepareGuard to the hook contract. It must be clearly documented as a builder only, with **no successful access grant or initial physical check promised**. It validates DB birth and returns a fresh synchronous physical authority closure. Do not provision, mutate protected files, memoize authority or accept externally supplied hook/closure data.

Existing TopicRegistry.guard must call prepareGuard, immediately invoke its returned closure and return that same closure. This preserves immediate-check compatibility for invite/join and every old guard caller. Other hook implementations without prepareGuard retain old guard fallback exactly. Invoke the chosen method with its original receiver; a thrown preparation/physical error must propagate, with no catch-and-fallback, swallowed failure or permissive default. Only Rooms.finalAccessFence adopts the new builder.

The combined returned fence must retain unchanged servingBarrier → fresh physical room/member authority → current deletion/offer/time/credential/socket generation/room-idle checks. It remains mandatory at current Auth-return, authorization/mutation and final synchronous enqueue milestones. Existing topic/source/private consent/capability/epoch/TTL, protected backup/lifecycle/retention, worker/media fences and all defaults remain unchanged. No permission cache, queue, deadline/poll/resource increase or retry is part of this approval.

This approves the proposed removal of duplicate physical passes, not the numerical performance claim. The expected4→2 count applies only to the stated auth-plus-final-publication request path; some existing paths legitimately invoke additional safety/final fences. Read-only audit establishes no throughput or pool-starvation recovery result. Exact implemented bytes and appropriately affected existing checks still require normal independent review before runtime acceptance. Current actual mobile21-cell success does not make later Calls failure or aggregate P07 green.

## Result

Proceed with the narrow implementation as proposed. No broader optimization or added test framework is requested. Parent waits for the second independent design decision before implementation. No new finding requires weakening guards. Full P07/signing remains unaccepted. Own journal preserves the audit and input hashes; COMPLETE_STOP after this packet INDEX.
