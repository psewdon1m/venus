# P10 bounded preparation — independent engineering review01

**PASS for bounded preparation only.** Source `0ca608bb4e2a17fc3346e015014fef8a6b08cc87`, core `e244432c0d0919f8b78090a8b56cd97995c3da688adff4874ae327c1b14e0120`. No blocking engineering finding. Android/iOS native capture pipelines remain **NOT_IMPLEMENTED**; fullP10/G4, device and distribution acceptance remain **HOLD/NOT_RUN**.

## Code and entry fences

ADR037, P10_MOBILE and the additive schema consistently define unavailable native publication. Schema/type/actual capability value fix enabled=false, accepted_protocols=[] and device_qualified=false. Authenticated native/start always ends in409NATIVE_PUBLICATION_UNAVAILABLE without calling grant, token or native capture. It shares existing member Origin/CSRF guards and current room/access/final fence; capability reads share private-read guards/no-store/current final delivery fence. The code does not authenticate application provenance from a version string or claim browser-protocol impersonation is impossible. No direct SFU access, native SDK stub, secret handling, schema migration or Origin/CORS exception was added.

Browser preflight distinguishes insecure context from missing getDisplayMedia; NotSupportedError maps unsupported, NotReadable/NotFound maps capture_blocked and NotAllowed maps denied. RU/EN/TR have matching guidance. API presence is explicitly not device qualification. Capture remains a user gesture; actual live video+audio checking, generation-owned teardown and absence of microphone fallback remain in place. View/watch is not conditioned on publication API availability. This is code/source review with focused helper and route tests, not a real mobile/browser-device interaction acceptance.

Entry E01–E04 are satisfied or preserved for the chosen preparation scope: versioned closed contract, existing authority, browser failure guidance and native publication unavailable. E05–E07 remain explicit external holds for trusted device network, native provenance/lifecycle/rollback and both-platform device/distribution evidence. Preparing no native adapters is honest here; these are not waived obligations or fake implemented pipelines. P11 may proceed independently after its own entry.

## Exact evidence

Preparation-checks01 INDEX SHA `da291f0504b488e88a8173466d03d44609755339876b45b205e5672b3ff58176` and all11 listed file hashes match. Source.txt binds exact source above; before/after core matches and post-run Git status is empty. ROOT/W reviewed file bytes are equal; committed bytes are hashed separately because checkout line endings may differ.

Recorded native Docker build exit0; final types/lint/focused tests exit0;2focused test files/2tests pass; schemas andi18n exit0. Fixture has no network,2CPU/1GiB/128pids, readonly ESLint config and16MiB UID1000tmpfs testcache. Build export manifest `sha256:3a12bd098817eaeed07599bb3cada95a553110adc84d69869a599f73a51fd470`, config `sha256:471a4d3ee662d080481b207be93be9b2d406f8f81dca9accc87d25b4ee3c7a03`, manifest-list `sha256:3d055afad182c06c96152e7ea45c96226944d8d315ec1f9175f0e621f442a881` are preserved in build log. This is an unpublished build/check fixture, not a signed native artifact or running deployment proof.

The API test reuses real route registration and Media.publicationCapabilities with controlled Rooms/guards: unauthenticated and missingOrigin/CSRF denials, no native token/lease issuance for arbitrary build strings, final-fence retirement and no-store are checked. This does not independently retest the whole real18+/PG/session boundary; its unchanged shared implementation and prior acceptance are retained. The browser test exercises helper error/preflight classification, not rendered UI/device capture. These bounded tests are appropriate to the additive closed route and simple guidance change; no broader framework/statistical suite was required.

Earlier Docker missing ESLint configuration and cache EACCES attempts are retained as failed fixture rounds; final corrections only mount the exact config and bounded writable cache. RESULT also records earlier Windows stale-dist/lint corrections. None is reclassified as an app/device PASS. Build's chunk-size warning is not a failed check.

## Nonblocking traceability note

P10-ENG-N01 (P3): P10_MOBILE reuses external labels P10-X04/X05 differently from entry INPUTS (entry X04=iOSfloor/route, X05=distribution; doc X04=distribution/floors, X05=credentialhandoff). The actual obligations are present and native remains closed, so this is nonblocking for preparation. Preserve the original label meanings or add an explicit mapping/new handoff ID when updating the registry.

## Limits and rollback

No native project/compiler/physical capture, iOS signing, AppGroup/ScreenCaptureKit/ReplayKit qualification, Android foreground/playback capture, thermal/battery/network-change device run, trusted phoneLAN or distribution path is accepted. ADR002/003 and P09's desktop limits are not closed by this change. OriginalG4/P07/public/mobile release remain NOT_PASS. Preparation rollback removes the additive routes/UI/helper as a compatible source change while native publication remains unavailable; there are no data migrations or protected-ledger changes to reverse.

Reviewer performed read-only source/proof/hash inspection, no tests/build/install/Docker/framework execution. One initial ADR filename read was absent and immediately corrected to actual ADR037 path. Only own journal/packet were written. Full exact hashes, entry-fence dispositions and P3 note are in INPUTS/DECISION. COMPLETE_STOP after sealing.
