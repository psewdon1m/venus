# Statistics resume02 — independent infrastructure/WIP review

Verdict: **CHANGES_REQUIRED_INFRA_WIP**. Two concrete P2 component failure-path defects require a new revision and independent repeat. The finite subset below is coherent and verified; operational infrastructure, runtime84, statistical results and the P05 gate are **not accepted**. This review does not replace the final stage review.

Reviewer did not author this producer, its consumers or the original statistical infrastructure. Review on 2026-10-20 UTC used filesystem/source inspection and bounded artificial controls. No Docker, actual process kill, actual mutator session, runtime corpus, actual runtime84 or producer write occurred.

## Exact inputs and finite subset

Author INDEX `576148902c6cf09947f80364caee3d00dc7e06824d9799465ebbf8900be81ba4` and all 102 children verify. HANDOFF `d927366efa922134b45350bb585cec9543e872faad498780f8ad3c091e93af93` verifies. All 25 working files equal durable packet copies. Prior author resume01 INDEX `5b263330f76e6119b1dd765426704d97d4b1d4ab12a7bddc3de1ce91367d549b` matches; consumers, inference and protocol are byte-identical to that checkpoint.

The fixed workload remains imported from the unchanged captured workload SHA `05e87a4cb24c553bebabc4e48c428b9aacb75aa9820c76cd060773795a505fa4`; seeds/counts/axes are not replaced by this infrastructure. Ordered coverage rejects descriptor order, seed or axis changes and retained early termination is not complete coverage. No reduction of requested counts or thresholds is approved.

The normal-path sink provides synchronous gzip-member append, file fsync before its receipt, SHA chain, immutable segment hash/size checks, ordered sequence checks and bounded decompression. Cold replay detects tampered/hardlinked segments. Abort keeps an explicitly NOT_ACCEPTED prefix. These finite normal-path properties are accepted; they are not power-loss durability proof, filesystem quota, recovery/reopen acceptance or complete raw audit. The IO-fault defect below prevents general sink acceptance.

The ledger exactly sums to 32 GiB and is separate from the accepted 128/512 MiB consumers: 15 GiB payload, 15 GiB reserved archive, 256 MiB inputs, 64 MiB control, 512 MiB native reservation, 32 MiB active-write reservation, 1184 MiB safety, plus actual 10 GiB reserve. Pure tests reject physical partition overflow and low host/native free space. It is sampled accounting with conservative reservations. Actual resource containment, archive export and fault cleanup are not proven.

Cold dispatch refuses missing root authorization. Source check compares complete current inventory and preregistered fixture inputs; a clean source/tag/ACK and prerequisite PASS flags are required. This is a useful denial boundary, not evidence that prerequisites exist. Complete producer/runtime/dependency/build lineage binding remains explicitly missing. Historical image ff371 in the author checkpoint is not a new operational image acceptance; the currently changing live source/content is not frozen here.

## STATS-R02-R01-001 — P2: sink does not latch a failed write/fsync

File: `durable-sink.mjs`, `writeAll`, `append`, `seal` (lines 11, 15–20). A file write/fsync can throw after bytes reach the active file but before counters and head advance. No sink failure latch prevents subsequent append/finish from operating on that poisoned stream.

An exact-module VM control injects EIO on the first data fsync. First append throws after writing its member; the second append returns `{durable:true, sequence:1}` even though the first unaccounted member remains. Seal then rejects the physical byte length against its counters. This is a false positive component receipt after an IO fault, **not** a demonstrated full-stage PASS: the later seal refuses and no statistical run occurred.

Required fix: make the first write/fsync/rename/manifest error sticky, retain its cause and close the owned active handle safely. Subsequent append/replay/finish must refuse any positive durable/closed receipt; abort may report only the preserved NOT_ACCEPTED prefix. Keep failed bytes and never silently repair/drop the failed member. Add faults before/after partial write, fsync, seal rename and manifest write plus positive normal controls. Do not rewrite this checkpoint.

## STATS-R02-R01-002 — P2: worker stop can return while worker remains unconfirmed

File: `supervisor32.mjs`, `killWorker` and catch/finally. The Windows branch swallows taskkill failure with `.catch(()=>{})` and never verifies process termination or awaits worker close. The supervisor can continue into NOT_ACCEPTED terminal/probe cleanup while the separate host worker is still alive or unconfirmed. This is distinct from the already disclosed lack of hard CPU/RSS containment.

An exact-body control supplies an inert worker with exitCode null and a taskkill rejection. `await killWorker()` returns successfully; the worker remains null and no fallback or close/ownership confirmation occurs. No actual process is killed. The already-exited positive control correctly performs no kill.

Required fix: bounded, ownership-bound stop with explicit worker/descendant termination confirmation and a separate STOP_FAILED/worker_unconfirmed result on failure. Do not swallow taskkill errors or emit a successful cleanup claim. Ensure every exception/overflow/timeout path reaches this stop policy, and preserve first plus secondary failures through a terminal channel independent of a failed disk writer. Add taskkill failure, delayed close, timeout, descendant survival and supervisor write failure controls before actual bounded fault tests. Hard host CPU/RSS containment remains a separate prerequisite.

## Raw/inference review

Consumers retain pair denominators D=2K, invitation sums, requested/completed counts, retained refusal handling, private caps, ordered descriptor coverage and 15 invariant rows. GF remains conditional on its separate stage1 equivalence proof. Private invariant runtime evidence is explicitly separate.

Per-cell inference requires 100 train and 400 holdout observations per class, independently trains the fixed diagonal LDA, applies unchanged AUC CI/decoder tests and preserves raw features. Pooled inference trains fresh coefficients from replayed training features, not pooled cell scores; it retains separate training/holdout denominators and exact feature decoder checks. The repeated raw passes and memory/IO cost are explicit, with no feasibility acceptance.

Two new bounded artificial 1000-row fixtures check both cell and pooled paths: identical classes yield tied AUC 0.5 with 100/400 denominators and PASS; a deterministic class feature yields AUC 1/exact decoder and FAIL. Pooled coefficients and heldout scores equal the separately invoked cell evaluator for the same single-cell fixture. At most five replay passes occur in each control. These checks verify finite math/plumbing, not an independent recomputation of a real corpus, real raw coverage, support certificates or model parity.

The seed derivative, paired actual-session and coalesced observer are accurately marked unexecuted. Their method84 receipts or schema assertions do not establish actual PG/HTTP/WS origin, initial-drain correctness, production natural timing or private boundaries. The normalizer cannot hide candidate_ref, revision or frame-count changes in finite controls. The active statistical session adapter still uses conservative uncoalesced METHOD06; connecting it to validated real transport remains mandatory.

## Tests and scope limits

Repeated unchanged author suites: 30 inherited + 20 infrastructure + 6 support controls = **56 PASS**, all exit 0. New independent tests: **15 PASS**, including the two explicit counterexamples above, plus exact input verification exit 0. No own harness failures occurred. Commands and full results are frozen in this packet:

- Node v24.22.0: producer `finite-controls.mjs`, `infrastructure-controls.mjs`, `eligibility-controls.mjs`.
- Same Node: this packet `independent-controls.mjs`.
- `.venv/Scripts/python.exe -B .docs/implementation/reviews/p05/topic-statistics-independent-resume02-round01/verify-inputs.py`.

Feasibility hashes for the historical single-profile R100 report/inventory verify. Its uniform scaling is explicitly **neither ETA nor lower/upper bound**. The measured expensive profile, gzip layout and fsync changes cannot establish affordability, fit, duration or representative performance. That is an accepted qualification, not a reason to shrink counts.

Outstanding before operational/full acceptance:

- Correct both findings; review the new exact bytes independently.
- Demonstrate bounded guard/probe/stop/tree-kill/scan failure paths and scalability; establish host CPU/RSS and functional runtime-container containment.
- Implement runtime84 orchestration, authenticated actors/observer, preStart history, WS initial drain, real heartbeat, semantic cases and private-boundary evidence; independently audit actual raw traces/parity.
- Bind offline observation to the validated coalesced model; complete fixed exclusion support certificates and GF stage1 cross-profile structural equivalence.
- Freeze final owner-reviewed content/source after writers stop; complete clean preregistered commit/tag, producer/runtime/dependency/image/build lineage and explicit root ACK.
- Qualify full unchanged workload feasibility under fixed artifact/wall budgets, then perform full sections and independent raw coverage, AUC and denominator recomputation.

Held content is not human-approved by this review. No runtime84, full statistics or P05 acceptance is inferred. Rollback is to leave this excluded WIP producer unused and preserve its checkpoint/failures; source and previous proof stay unchanged.
