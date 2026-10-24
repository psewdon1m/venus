# Independent P06 Security/Privacy — round04 source portion

Status SOURCE_ONLY_HOLD_ACTUAL_GATE_EVIDENCE_PENDING. Independent nonauthor. No new blocking source finding. Prior rounds unchanged; no pre-sign/stage PASS.

Exact C clone HEAD92b7f9d9c5dd5caa6a0953f28ed8e984e04393ba /corefe51759f0c5c3c605b260c14121ae60ed12e7999783b9dcc1c6aa3a2ea8f876d /1942files /freeze11. Bounded delta from prior reviewed c1823103. No tests, runtime/Docker/remote actions, source/Git mutations by reviewer.

Rooms.maintain fix accepted for source: read protected global deletion entries, acquire the existing per-room SQL transaction/advisory/row lock, then replay closeRoom before V2 recovery and cleanup. This invokes the existing durable private retirement path and game purge instead of changing SQL closed-state alone. First retirement uses original global ledger timestamp; an existing authenticated topic retirement keeps its original operation/time through retireRoom. Cleanup equality TOPIC_RETIREMENT_DB_MISMATCH remains strict; missing/corrupt/regressed authority still fails closed. No guard bypass, authority reset or automatic DB restore is introduced. Existing closed_at mismatch remains fail-closed rather than guessed away.

E06 accepted for source: before backup-based recovery, an interrupted nonterminal job without existing cause durably transitions FAILED with EXECUTOR_INTERRUPTED and interrupted_phase. Original errors are preserved; committed terminal jobs retain commit handling. Public job response now includes the safe phase. Relevant unit covers pre/post-backup interruption. Port preflight now checks actual NetworkSettings dynamic bindings alongside HostConfig declarations and rejects foreign project at the configured port.

Fixture deltas reviewed: worker init/reaping, real offline A removal/load with registry stopped, original-error export, count comparisons, real port negative and browser-edge502 after actual confirm. These are bounded coverage improvements, separate from production behavior. No source diagnostics shim was added; protected startup error logging remains unchanged.

Read fast-preflight04 INDEX15ab9f38c71534d20b9f0b7dc9958b0e731765742f3492591dfd82eeddc6d49d. Four exact unit input hashes and Rooms hash match frozen C; all12 indexed receipt hashes match. Unit09 reports28PASS0FAIL0SKIP exit0; lint12/13 and types02 exit0. Component proof does not replace actual old-backup/new-ledger replay.

Docker-round08 INDEX2bcecb303978f28ed22d8f5e0acd12d73e4e78bc5b60e63027f159efc566b0de is FAIL on oldcoref3c678de, with13 partial PASS (including9 real SIGKILL phases and offline A load) and11 count comparisons. It safely stops during monotonic recovery and cannot establish PLAN-P06-MONOTONIC, final commit or full local gate. Current-source actual09 and fullquality03 are pending exact evidence handoff; no final acceptance before them.

Consumer1000/operator1002/executor1001 trust separation, signed immutable release protocol and backup/ledger boundary remain as previously reviewed. Trusted Docker daemon TCB and production dedicated/rootless isolation limits remain explicit. Owner real key activation is pending; fixtures do not prove service signing. Production/DNS/TLS/mobile/external backup-copy deferred;470 temporary pilot acceptance/450HOLD unchanged; no P07.
