# P02 · Independent implementation/security review · round 2

Reviewer: `/root/p02_security_review`. Date: 2026-10-18. Scope: implementation, security.

Status: **CHANGES_REQUESTED — mutable pre-freeze source**. This document preserves the round-1 findings and records the follow-up review; it does not assert final source identity or EXIT-P02 acceptance.

## Verified fixes

- SEC-02: the preference form is keyed by authoritative owner/revision and stale drafts are explicitly replaced on refresh; the room and socket remain mounted.
- SEC-03: a valid heartbeat restores online presence and emits an updated safe room revision when presence changes.
- SEC-04: logical room mutations now record allowlisted actor/action/request ID metadata in the same transaction; audit and outbox insertions enforce serialized age/count/byte caps. Room deletion cascades to audit records. Full PostgreSQL regression evidence remains to be assessed after the implementation runner finishes.
- SEC-05: request fingerprints use externally keyed HMAC with a domain prefix and recorded key version. Retaining v1 while switching current to v2 preserves verification of v1 fingerprints and decryption of existing private records; changed inputs fail comparison.
- SEC-06: private settings and stored replies use authenticated padded envelopes of exactly 16,384 ciphertext bytes. Bulk backup encryption uses a separate authenticated format and AAD.

The reviewer independently ran `vitest run apps/api/src/security.test.ts`: **4/4 PASS**. A separate synthetic execution of the original fingerprint/length attack against the rebuilt modules produced `old_attack_matches: 0`, `cipher_sizes: [16384]` for settings and stored reply shapes, supported old-key verification/decryption after rotation, and rejection of a changed input. No real key or user data was accessed.

## Remaining SEC-01 path

The in-room panel fixes the manual mutation path, but errors from `RoomShell.connect()` call `onErrorRef.current(error)` → `main.setError` directly. The policy refresh and resetting of unchecked acceptance controls exist only inside `perform()`'s catch handler.

After changing the offer and restarting the API, automatic socket reconnection can obtain `ENTRY_REACCEPT_REQUIRED` from `ws-ticket`. The panel then renders the previously cached policy and checked consent values. Clicking its acceptance button submits the old policy, receives `ENTRY_ACCEPTANCE_REQUIRED`, and hides the panel again because the panel is conditioned only on `ENTRY_REACCEPT_REQUIRED`.

Required closure: route all reaccept-required errors through a common handler which fetches the actual current policy and resets both controls, including socket/reconnect errors; verify automatic socket recovery without a preceding manual Save or page reload.

Final review must bind a frozen commit/inventory identity and inspect current PostgreSQL/browser/OCI evidence before acceptance.
