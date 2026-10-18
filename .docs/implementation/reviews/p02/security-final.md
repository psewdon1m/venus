```venus-review
{
  "reviewer_id": "/root/p02_security_review",
  "source_sha": "8313ddd6453bd6f01fd73e272e0ac483807456c4",
  "source_identity_sha256": "2cd73ce9a52af8e13484fb05536a06f7eb36ca5890563a8de5700b55323a437a",
  "scopes": ["implementation", "security"],
  "status": "PASS",
  "open_findings": []
}
```

# P02 · Independent implementation/security final review

Date: 2026-10-18. Result: **PASS for the frozen P02 implementation/security scope**. Earlier round-1 and round-2 CHANGES_REQUESTED reports are retained. The reviewer changed no implementation, gate, status or manifest files.

## Source and evidence actually checked

HEAD and the independently recomputed implementation inventory match the exact SHA and identity above. The reviewer verified the input inventory against current source bytes, ten companion artifact hashes, all three screenshot hashes, the clean-source flags on the integration/container proofs, and the three successful exact-SHA jobs in CI run [39149965285](https://github.com/psewdon1m/venus/actions/runs/39149965285). Those jobs are quality, container-smoke and p02-integration.

The inspected local quality output records lint/type/build/schema/locale/document checks, eight JavaScript unit tests, 83 Python tests and four effective negative fixtures passing. The PostgreSQL/process/HTTPS/WS/browser execution output records 20 passing tests producing 22 PASS proof records, including 100 admission races. The disposable runner completed cleanup. OCI smoke records nine PASS checks, including user1000, read-only root filesystem, no capabilities/socket, loopback exposure, database outage/recovery, absent approved policy and sanitized logs/startup failures. The tested image is `sha256:3bef4edb2286052628887e18b5fa6a52b2e3d9c07e46259fa2dad4ceeb27898a`.

Independently executed on the final frozen source: `vitest run apps/api/src/security.test.ts apps/web/src/api.test.ts`, **5/5 PASS**; HEAD and implementation identity remained unchanged afterwards. Earlier independent synthetic attacks established the original fingerprint and ciphertext-length leaks; the corrected implementation was then separately exercised to confirm no unkeyed fingerprint match, uniform 16,384-byte private/settings reply ciphertext, valid old-key replay after rotation and rejection of changed input. The EN mobile screenshot was visually inspected: safe literal XSS fixture text, readable room/settings/exit controls, no horizontal overflow or false module availability.

## Closed findings

| Finding | Closure checked in final source and regression evidence |
| --- | --- |
| SEC-01 · reaccept and stream recovery | A shared error handler refreshes the actual policy and clears both explicit controls, including automatic WS reconnect errors. The in-room panel persists while reaccept is needed. Successful acceptance and manual Retry advance the connection epoch. The browser regression requires current offer text, unchecked controls, connected status after ticket outage and after reaccept, then delivery of a newly joined peer snapshot without reloading the page for acceptance. |
| SEC-02 · stale preference form | The form is keyed by authoritative owner/revision; refresh replaces the stale draft with a visible explanation. A browser test performs a second-tab mutation, conflict, refresh and successful subsequent save. |
| SEC-03 · late heartbeat presence | A valid generation/session heartbeat restores online presence and emits a revision when needed. Deadline tests cover presence and reservation boundaries, host grace and heartbeat not extending room idle activity. |
| SEC-04 · mutation audit and bounds | Allowlisted actor/action/request UUID metadata is recorded transactionally. Audit failure rolls back the mutation. Serialized insertion/pruning enforces 10,000-event, 64MiB and age bounds for persistent audit/outbox. Room deletion cascades to the metadata and preserves the shorter room retention rule. |
| SEC-05 · low-entropy request fingerprint oracle | Fingerprints are domain-separated externally keyed HMACs carrying their key version. Supported older keys continue to verify replay after changing the current key. Version syntax and own-key validation reject ambiguous/prototype configurations. Private request values are not stored as public dictionary-checkable hashes. |
| SEC-06 · ciphertext length oracle | Preferences and every stored idempotent reply use an authenticated fixed-size padded envelope; both primary and secondary private-value records are covered. Bulk database backup uses separately authenticated AAD/format. Unit coverage spans all six relations, comfort0…4 and zero through seven edges. |

## Security and recovery conclusions

Room row locks and SQL slot constraints limit admission to eight identities including the host. ACL checks use current room-scoped sessions/member IDs; names, invites, other-room cookies and tickets grant no host capability. Authentication is rechecked under lock before idempotent replay and WS delivery; one-use ticket consumption, expiry and generation fencing prevent replay and duplicate stale socket authority. Origin/CSRF, schema/body/rate checks, escaped names and safe room projections preserve the reviewed browser boundary. Host views expose readiness without decrypting another member's preferences.

Restart and synthetic encrypted restore preserve open-room identities, nondefault private settings and exact room-scoped rows. External revocations are reapplied before restored data becomes available. Idle expiry, close and primary deletion are exercised with accelerated clocks. A real previous P01 image runs against the upgraded schema without changing scoped rows; its room API remains unavailable, and the P02 candidate resumes successfully. This is an explicitly degraded rollback behavior, not a claim that the previous image implements rooms.

P02 acceptance remains scoped to this implementation: the actual approved public offer is still absent and production entry stays fail-closed. Operator access/update/backup workflows remain P06 work under ADR-014 and the central applicability matrix. These declared stage boundaries are not unresolved P02 findings. No open implementation/security findings remain for the frozen source.
