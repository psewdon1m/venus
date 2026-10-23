# METHOD14 diagnostic-only — independent review

**CHANGES_REQUIRED_METHOD_ONLY: one confirmed P2.** Original METHOD13 actual409 remains unexplained; this review does not claim a functional fix or PASS. No Docker/browser/image or product/producer mutation occurred.

Author INDEX `e445a28a7aefbeb1e5ec0a4a3ad71189fb3bf208f8e48ff27f0f327c4f1d9d44`,23 files and9 runtime pins verified. Browser and all16 scenarios are byte-exact METHOD13; only request-emission changes, hash `b0610623f146ed5640e006afe5f5b6cdfc69bf788de49552dc5843244b16a49b`. [Exact inputs](inputs.json).

## METHOD14-R01-001 · P2 · rejected-response diagnostics are not tied to the observed request UUID

`request-emission.mjs` projects non200 domain_error_code before verifying `response.request().postDataJSON().request_id` equals the observed request UUID. That equality check is reached only after the HTTP200 assertion. Therefore a same-path/method/kind response for a different request can supply the diagnostic code attributed to the one observed click.

The [independent counterexample](controls.json) calls the exact helper with one observed offer_topic request, a same-path/kind409 response whose response request has another valid UUID, and code NOT_AVAILABLE. The helper records NOT_AVAILABLE as domain_error_code. It still throws409 and clicks only once; this is a diagnostic attribution failure, not a false functional PASS. Exact domain correlation is necessary to distinguish the actual rejected offer's cause in the next pipeline run.

Required minimal correction in a new immutable revision: validate the observed request UUID and response request UUID equality **before any response-domain projection**. On mismatch, retain status plus an explicit correlation-unavailable/mismatch flag and no attributed domain code; keep mandatory HTTP200 rejection and existing successful-receipt UUID/schema/revision checks. Do not change browser cases/TTL/seed/retry behavior. Add mismatched/missing/invalid response and observed UUID negative controls for non200, plus a matching positive diagnostic case. Another independent repeat must inspect the exact new bytes.

## Checks that passed in their limited scope

33 finite controls PASS, exit0:25 repeated author assertions with import/output path-only relocation, and8 additional independent checks. One separate exact-body counterexample confirms the P2. No successful assertion cancels that finding.

Additional checks cover allowlisted code/status without raw payload fields, unknown/private code canaries, malformed JSON preserving409 and one click, an actually awaited1s unresponsive metadata timeout preserving409 without retry, advice request text not projected, null/array/nonstring malformed code payloads, oversized/unknown topic arrays not copied, and detached whitelist topic arrays. The event stores only typed epoch/count and bounded whitelist fixture strings; no raw error body/message/token/cookie/private text is emitted by these tests. The1s bound is an asynchronous wait deadline; this review does not reinterpret it as a preparse response-byte cap or claim actual network behavior.

The unchanged strict HTTP200, one-click, private dispatch deadline and existing200 receipt validations remain visible in the exact helper. Success path and negative browser bodies are unchanged. These fake-page event tests are not an actual409 cause replay, HTTP authorization proof, application cache observation or full P05 acceptance.

## Source/provenance qualification

Historical author binding is source1274/1813 and intended imageff371. All1813 historical files still match their hashes, but the **current whole workspace is no longer1274**: the verification snapshot has2289 files, identity `d74b5f2a55e67870ce864700f8df4bb50b455cef50848f83621e4801bdb75819`, with476 additions under the parallel P04-r3 content/owner-document work and no changed/removed historical files. [Snapshot](source-drift.json) is evidence of concurrent writes, not a new source freeze. Runtime re-binding must follow completion of parallel writes. The exact excluded helper finding and finite controls are independent of those additions.

The initial whole-tree assertion correctly refused stale1274, and a dependent rerun command then failed because its adapted script was not yet created. Both attempts are retained. The corrected verifier explicitly verifies the unchanged historical subset and records current drift, then author assertions run sequentially. Current daemon/image recovery is root-owned; no image availability, clean-source or actual RUN claim is made here.

Next: root authors a new diagnostic correction, reruns finite controls, obtains independent repeat acceptance, then considers a separately bound actual run after external Docker recovery. Original actualFAILs and human content HOLD remain untouched.
