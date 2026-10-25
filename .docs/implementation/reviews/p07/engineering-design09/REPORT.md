# Independent engineering design09 — prepare a fresh final authority fence

Verdict: RECOMMEND_WITH_EXPLICIT_CONTRACT. This is readonly design review of the proposal against source475d2bfe76eff13930d1cb55b25fd40579c3fcff, not implemented-code, performance, stage or test acceptance. No code/tests/Docker/profiler runs by reviewer. Existing seals remain intact.

## Callsite audit

Reviewed production references to Rooms.finalAccessFence in Rooms, Calls, Media, Presentations and Music, plus TopicGames.finalAuth forwarding and its callers. No production caller found treats completion of the builder as authorization without invoking the returned closure. Most sites invoke immediately; captured variables such as final/fence/originalCredentialFence/safetyFence/normalFence are invoked before auth return, actual enqueue, binary delivery, irreversible presentation publication or protected mutation. The forwarding helper itself merely returns the closure and its production callers invoke it. Rooms.auth invokes before returning Auth. Socket originalCredentialFence is invoked before its updates and again after awaited child work, preserving original credential-expiry bounds. Late current grant/content/epoch fences remain separate.

The only new interval proposed is between validated birth preparation and the existing final credential/offer/socket metadata SELECT. That SELECT is readonly, scoped to the already identified room/member/session; it neither returns content to a caller nor publishes a grant or causes a durable external side effect. A physical room/member authority check is therefore not intrinsically required before that particular read if the returned closure performs it freshly before any permission/publication. Auth/service callers do not regain permission merely by obtaining a prepared closure.

## Conditions for the narrow implementation

- Optional trusted prepareGuard must validate/read the DB birth descriptor and return a synchronous function which freshly checks the real current room/member authority on every invocation. It must be documented as not performing authentication or granting permission. No successful physical check is cached.
- TopicRoomRegistry.guard must delegate to preparation, invoke the result immediately and return it, keeping eager semantics for existing invite/resolve/join/direct callers and tests.
- Only Rooms.finalAccessFence selects prepareGuard when actually implemented. Legacy/custom hooks retain their existing guard call unchanged. Preparation failures propagate; do not catch them and proceed with a missing fence. Preserve method this binding.
- Returned finalAccessFence closure still calls serving barrier and fresh physical authority before credential/time/socket/room/offer checks and before caller publication. Existing caller invocation sites, DB ordering, private-content checks, TTLs and no-unrelated-await contract remain.

Under those conditions this removes a redundant eager physical read inside a final-fence builder, rather than removing initial endpoint authorization or a final delivery check. It is preferable to adding a global request queue which cannot itself improve the measured throughput. No measured improvement is claimed here; clean current-source impacted tests and actual combined preflight/soak remain required. Direct eager guard compatibility, optional-hook fallback, no physical calls at preparation, and real withdrawal after preparation but before publication are the relevant bounded verification cases.

The observed CPU sample and later diagnostic cleanup crash are distinct from stage acceptance. Actual pool failures/Calls loss remain failures until corrected and rerun; this design recommendation does not mark them passed.
