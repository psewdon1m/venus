# Independent P06 Engineering/QA — round05 final

**PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT** on exact frozen source. No remaining local technical blocker. **Full P06 stage remains HOLD**: real permanent-key owner approval, real service main/tag/image/signature and published/anonymous assets are not accepted. This individual nonauthor review is one of the two required independent reviews; it is not authorization to sign/publish or start P07.

## Exact source and independence

Reviewed normal clone `C:/.projects/venus/.artifacts/p06-clean-source01`, clean HEAD `92b7f9d9c5dd5caa6a0953f28ed8e984e04393ba`, core `fe51759f0c5c3c605b260c14121ae60ed12e7999783b9dcc1c6aa3a2ea8f876d`/1942. Independently matched every freeze11 source-file SHA256 twice, including final handoff; empty clone git status observed. Evolving root checkout is not claimed clean or used as clean-source runtime proof. Freeze11 INDEX: `dfeac0e3202a1415c035d28514f600891449221ade7969ef8a12b84314be19d5`.

P05 entry INDEX remains `58b680ef116bc2d1f652ea4c3862c1a00b23333100cc65d7bae88bfc7d4f1b81`. All118 unique historical Part12 IDs/source lines/exact row hashes match catalogue `7f356b724df80444c5cd00c15bd808046f4f5667afa2cabf87cf1acd196c86a9`; original snapshots/contracts and prior failed rounds were not changed by reviewer.

Reviewer authored no implementation and ran no tests, Docker, source/Git/remote mutations. Actions were source/evidence reads, independent file/hash/event/timing/count analysis and own review/journal writes. Earlier SOURCE_NOTE is a preserved interim HOLD; this completed handoff supersedes it without editing it.

## Accepted exact evidence

| Packet | Independently checked result | INDEX SHA256 |
| --- | --- | --- |
| quality-round03 |20 listed hashes/sizes match; exact source clean before/after, exit0, owned cleanup complete | `9f63c38ee28ded5ab322f38778af9027a579509603a9cd4925e0c8d4eee25d2f` |
| docker-round09 |41 listed hashes/sizes match; exact-source actual PASS,18 checks,37 host command receipts exit0, owned cleanup complete | `44614021cb6183da9b9b1c2bd2d4526b0742113e6b15b28006662d5d6398ff0b` |
| fast-preflight04 | Receipt hashes and exact unit/Rooms source pins match; unit09:28PASS/0FAIL/0SKIP, lint12/13 and types02 exit0 | `15ab9f38c71534d20b9f0b7dc9958b0e731765742f3492591dfd82eeddc6d49d` |
| recovery-measurements01 | Input hash matches; independently recomputed all17 job intervals, backed-up ages and7 recovery intervals, zero discrepancies | `0bd6dcce4ec528a9ed407fe58eb3e8cf80dddfd9504017ef9167bd8fc19bcc04` |
| owned-fixture-cleanup01 | Six exact failed-fixture volumes: nonce ownership/no attached containers recorded, removal exit0; no global prune/other-project mutation | `421b78ddc919eb5792eadc8d7091e1a7e7918e1d8a5468960dfc7a69ec4ddbda` |

Quality03 raw results:77 Vitest files,1315 PASS/3 SKIP; the3 are explicit unsupported-host branches skipped on Linux in lifecycle/ledger/directories suites, not unrun P06 obligations. Also44 Node checks PASS/0SKIP,124 Python tests PASS,14 catalogue history tests PASS; lint/types/schema/i18n/docs/build/catalogue/negative gates pass. Relevant P06 unit09 is separately bound28PASS/0SKIP. No unnecessary full P05 corpus/UI459 rerun was requested by reviewer.

Actual09 outer report SHA256 `12b908e1ce1ab50e8a5bdb8b76e279ddc7f1244eff33917ea99e7cae35cf9c0a`; DRILL SHA256 `f93fe8f2a8f4b7f0831d4ce8ba0afa2362af6a3c1587e81695ba9d803face94a`. Independently checked147 event hashes/sequences/previous links across17 jobs with zero chain errors. This verifies retained event integrity, not the omitted raw whole-job record_hash. Expected fixture faults are not mislabeled command success; their durable job outcomes are separately inspected.

## Eight gate decisions

| Gate | Local pre-sign decision and evidence |
| --- | --- |
| PLAN-P06-RELEASE | PASS for fixture cryptography/runtime identity and release-pipeline readiness only. Real `venus-v0.0.1`, exact remote main/tag/service OCI, permanent signature and published assets remain PENDING_FINAL_SIGNED_ARTIFACT_ONLY. |
| PLAN-P06-INSTALL | PASS. Actual clean A install with pinned PG/app, UIDs1001/1002/1000, read-only consumer/no daemon socket, loopback ports/no DB host port. Independent UID1003 reader cannot reach DB or mounted keys. Occupied dynamic port/disk/pull/permissions negatives preserve exact A without mutation. Signature/version/schema/env/digest/archive negatives pass bounded units. |
| PLAN-P06-SCOPE | PASS for complete standalone decisions. DECISION.json retains all118 IDs/check IDs/row hashes/reasons/evidence:66 local PASS,34 narrow external N_A,8 final signed-artifact pending,10 production deferred. No universal ACL/data/restore waiver; no production-deferred row counts as local PASS. |
| PLAN-P06-BACKUP | PASS. Quiesced complete PG custom dump in bounded owner600 VENUSBK1 host file, durable framing/hash checks and corruption/truncation/link/oversize negatives. Actual fresh DB restores decrypt2 preferences/1 completed snapshot, with six business-table counts equal in11 rounds. No keyring/env/raw tokens included; protected authority and keyring are separate prerequisites. |
| PLAN-P06-UPDATE-ACL | PASS. Separate exact operator identity/Host/Origin, room-host/foreign-origin/command-field refusal. Native Chromium actual confirm executes server-side then only response is replaced502; UI shows unconfirmed error, reload/reauth observes same UUID/CONFIRMED, then cancel. Separate actual apply/duplicate apply and executor restarts prove durable one-job mutation. |
| PLAN-P06-FAULTS | PASS. Real pull, permissions, failing migration/health and9 durable-phase SIGKILL cases recover predetermined exact A outcomes; COMMITTED interruption resumes verified B. Offline A cache is proven absent, owned registry stopped, archive hash checked, then exact A loaded/recovered while registry stays stopped. Original cause and separate recovery outcome retained; failed-restore unit stays gated closed. |
| PLAN-P06-MONOTONIC | PASS. Actual old DB/new global deletion and catalogue ledgers close the revoked room and keep withdrawn card unavailable before serving. Protected floor hash stays equal, missing witness is not recreated, regressed catalogue blocks startup. Ordinary restart preserves a new post-backup admin marker rather than auto-restoring DB. |
| PLAN-P06-RECOVERY | PASS for fixed local profile and measured event intervals/write boundary/counts only. Backup-committed unexpected loss0; required policy purge and one deliberately post-backup external admin write lost on restore are stated separately. No production RPO/RTO SLA or external backup-copy success. |

Fixture A/B values and test Ed25519 keys remain explicitly nonservice. Fixture image transport is exact local built cache with push only if needed; this does not prove real registry OCI/service publication. That distinction is material to the pending RELEASE decision.

## Review findings and corrections

E01 runtime identity: normal candidate and terminal recovery now bind expected signed manifest before serving. Relevant wrong-runtime negative and actual exact A/B pass.

E02 interrupted temporary backup cleanup: only safe exact job `.dump.tmp`/`.vbackup.tmp` are removed under exclusive recover lock; no unrelated/path/link target cleanup. Relevant unit passes.

E03 API502/reload: accepted real CONFIRM/lost ACK scenario exercises shared request/status behavior; no requirement mandated502 specifically on apply. Actual separate apply/idempotence/restart proofs complete the obligation.

E04 offline image: actual removal and offline archive load closes earlier cache-only coverage gap. E05 occupied-port: actual dynamic listener regression exposed and corrected NetworkSettings.Ports handling; no mutation and equal counts verified.

E06 interrupted cause: durable FAILED/EXECUTOR_INTERRUPTED plus interrupted_phase precede backed-up explicit recovery, preserving existing errors and terminal outcomes. Actual all9 interruption jobs retain the observable cause without pretending production executor knows it was SIGKILL.

Clean-install PG image omission and old-backup private retirement mismatch were caught by actual author-run drills. PG pin now pulls/verifies before DB creation. Rooms.maintain replays validated global deletion through existing closeRoom under room locks, using original ledger timestamp and authenticated private intent before private recovery/cleanup. Same-source quality03 and actual09 now prove the corrected path. Failed rounds remain retained rather than overwritten.

## Measured recovery and loss accounting

Seven RECOVERED_A jobs expose original FAILED and RECOVERED_A UTC events and backup created_at. Independently recomputed FAILED-to-RECOVERED_A wall-clock intervals are2578–8792ms (2.578–8.792s); backup ages at terminal are3498–36311ms (3.498–36.311s). Original timestamp precision is1ms on one local host; no clock step was observed. Intervals include journal-boundary overhead and are not the unexported engine recovery_ms stopwatch or monotonic-clock/SLA measurements. Job-created-to-terminal values include confirmation/waits and are labeled separately.

Initial restored counts: rooms2, room_members2, preferences2, game_sessions1, game_participants1, catalogue withdrawals0. All11 pre-policy count comparisons match. Dedicated newer-ledger restore intentionally changes preferences2→1 and withdrawals0→1, leaving completed snapshot1 and other counts intact. One external post-backup admin marker was not restored; its subsequent ordinary-restart marker was preserved. These policy/admin changes are not hidden as backup-committed loss.

## Remaining hold and exact-byte rule

`infra/venus/release-trust.json` remains environment service, owner_approved false, key_id `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb`. No actual owner approval, real signature, qualified remote main/tag equality, published signed assets/anonymous smoke or production deployment is claimed by this review. A trust-file approval edit changes source identity: rebind independent acceptance to those final exact bytes before the release-gate can authorize signing.

Production effective systemd sandbox/unit activation, public DNS/TLS/SNI/UDP, physical/mobile devices, dedicated/rootless daemon isolation, external storage/copy and production SLA remain deferred. Local Docker using a shared daemon is not proof of those properties. P07 has not started. Original450 HOLD and current470 owner-provisional local-pilot acceptance remain unchanged; no new human language/legal/card approval is granted.

COMPLETE_STOP after packet publication. Orchestrator may build the final derived manifest only after both reviewers stop; reviewer will not mutate source, registries or manifest.
