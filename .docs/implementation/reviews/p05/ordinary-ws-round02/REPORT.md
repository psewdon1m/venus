# Ordinary WS independent round02 — FAIL before Docker

**OWS-REV-002 (P2 assertion false-negative).** Exact corrected producer/observer/runner are copied and pinned in report.json. No Docker was run against this checkpoint.

OWS-REV-001 has a substantive boundary fix: observation begins before transitions; the actual dispatch callback observer delegates unchanged real methods; successful durable narrow triggers exclusion boundary synchronously. Author15 assertion regressions independently reran exit0. Acceptance remains pending because the new frame attribution is too weak.

## Confirmed counterexample

`observation.mjs` compares only event ID/type/conversation/epoch/prompt-present and the receiving actor's ID. It does not hash complete payload or validate actual received room_id/target_member_id/audience. Own exact-helper explicit-double probes record a legitimate pre-boundary enqueue, activate deny-all, then receive a frame with matching partial metadata. Four altered variants all return PASS: changed prompt text, foreign target, foreign room and audience=room. The unchanged late-prequeued positive case also returns PASS. Raw probes/results preserved. No actual Venus leak is claimed.

Record SHA256 of the entire JSON-transmitted payload without keeping raw private text; compare that digest and exact mandatory ACL envelope fields/revisions to the recorded enqueue. Keep the primary post-boundary callback assertion, including duplicate IDs. Then rerun independent counterexamples, author regressions and actual Docker composition.

Root attempt01 archive28 artifacts/10PASS/cleanup is independently verified, but remains changes-requested under immutable round01. Its later reference-correction addendum is acknowledged; original bytes were not rewritten. This round does not establish full P05, browser cookie jar/TLS, production CMD or restore/rollback acceptance. Product and producer were not edited by reviewer.
