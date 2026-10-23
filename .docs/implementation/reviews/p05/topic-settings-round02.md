# P05 private topic settings adapter — independent round 02

**PREFLIGHT_COMPONENT_PASS**, bounded inactive adapter only. Reviewer `/root/p05_topic_planner_review`; author `/root`. Original round01 remains immutable **CHANGES_REQUESTED** with reproduced TOPICSET001; this round closes that finding for new exact source. No included writes by reviewer.

## Exact source and fix

Frozen included identity `62483f11349dadd121bedf3e6790fccb6a7402b8bcf2b435589df29424fe226f`,1744 files. Archive SHA256 `03146d3c55a75e5c76a24a44c9ecca8d1655d0c9a7a4781b559e99b092d13149`; index SHA256 `cc84e8b75999da0c3270bc56d84a063e7d6ebb747e1b8e071721d8d5cd41047a`. Ten source/dependency files were snapshotted before subsequent root documentation writes. New adapter SHA256 `4c22cf0c93eae92f5411c69a2f379b36700aabe5e3343ac0147fd4808194e7f5`; focused test SHA256 `ef3b0eb523fcae4a8cb456d11225cb292f3d62c44ade09ca0b587b486cb7afa0`.

`change()` now awaits the existing complete final fence after all earlier awaited reads and before the first `ledger.narrow`, revoke hook or SQL publication. It retains the later response fence. Thus credential expiry during earlier count SQL cannot authorize irreversible narrowing; expiry during later awaited work still prevents delivery and rolls back SQL while preserving already-authorized stricter ledger state. TOPICSET001 is **CLOSED within this adapter component scope**.

## Independent execution

- **22/22 independent probes PASS**, exit0, directly importing frozen round02 adapter dependencies. The original001 regression is now green. All fifteen earlier passing controls remain. Six added checks deny session revocation, entry-version mismatch and external retirement during count-await before any mutation; expired allow expansion; synchronous external-fence latency crossing expiry; and delivery expiry during an awaited revoke after an authorized durable exclusion. The last case correctly keeps ledger strict while SQL state/receipts roll back.
- **35/35 author focused tests independently rerun PASS**, exit0. Scoped ESLint PASS, exit0. Ten current source/dependency hashes still match frozen bytes after tests. Raw results are saved with round02 prefixes. No claim that earlier host440PASS was rerun or applies to this new included identity.
- Original actual Docker nine-check suite was **inspected, not re-executed by this reviewer**: run a66a426e0ce1, image `sha256:9ffff109ba5269f5a8ed2a7e74e1ee3548a97edd025dc3afeefd6b04ca441d41`, source-before/source-after equal, cleanup completed. All21 indexed hashes and1744 archive entries independently verified. Ten actual image filesystem hashes matched via an owned read-only networkless reader. Original project containers/networks/volumes are absent.
- New actual SQL07 waits inside a real PostgreSQL count query using an explicit fixture advisory-lock expression; `pg_stat_activity` confirms that wait. Clock crosses credential expiry; response401, actual Linux ledger exclusions remain empty and preference SQL row count remains zero. SQL08 retains separate final-auth awaited-query expiry/no-enqueue evidence. Descriptor and epoch revocation hooks remain explicit fixture seams. This is loopback HTTP, not browser/TLS/production evidence.

The unchanged migration SHA256 `14e5ed99556460653bcce4dc2c7661ebf6144d9739cecaf11f61372ecc4de011` retains round01's independently executed real PostgreSQL proof: ten negative constraints reject and room cascade succeeds. No redundant rerun or broader SQL claim is made. **Deferred DELETE+INSERT replacing a birth incarnation within one transaction remains permitted by the database existence guard**; the required authenticated external descriptor must reject that mismatch. Do not describe this as universal database birth immutability.

## Remaining acceptance boundary

No open confirmed code finding in this bounded adapter review. This is dirty-tree preflight, not clean-source or full P05/stage PASS. `server.ts` still does not activate/migrate this service; no V2 birth factory is accepted. Lifecycle LIFE001–004, authenticated descriptors, host/DB restore safety, old workers, actual dependent epoch/chat/advice revocation and delivery integration remain OPEN obligations. Interface requirements and fixture seams are not implementations or trust proofs. Human450 HOLD remains unchanged. No new C2, fairness or public inference acceptance is implied.
