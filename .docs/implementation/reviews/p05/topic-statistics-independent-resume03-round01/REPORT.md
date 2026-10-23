# Statistics03 corrective repeat — independent infrastructure/WIP review

Verdict: **two prior P2 CLOSED; one new P2 OPEN — CHANGES_REQUIRED_INFRA_WIP**. The original sticky-IO and unconfirmed-worker-stop findings are corrected within the reviewed finite/owned-host-helper scope. The privacy projection finding below prevents accepting the whole corrective packet. This review does not accept a final Docker statistical producer, runtime84, statistical results or the stage gate.

Reviewer did not author statistics03. Author INDEX `093b03d831bac208680dfdea56d3842bb48b062d5a9fc76bae027cdb6844aaac`, all100 children and HANDOFF `d1a8d9d3d0a0122154fb81638341878aedd5a37cf30d37dbaacaa17cba2f9cb7` verify. All33 working files match frozen copies. Consumers, inference, protocol, ledger limits, worker, prerequisites and unexecuted runtime adapters remain exact02. Dispatch differs only in three explicit RESUME02→RESUME03 revision labels; counts, seeds, coverage and thresholds are unchanged.

## STATS-R02-R01-001 CLOSED: sticky sink IO failure

Repeating the original exact-source fsync counterexample now retains the original cause and closes the active handle. Every later append, replay and finish refuses with the original cause; failed member bytes remain unchanged and abort marks a poisoned NOT_ACCEPTED prefix. A normal closed sink remains replayable. Repeated author fault controls cover write-before/partial/after, data/seal fsync, segment/manifest rename before/after and final-index failure. No positive durable/closed receipt follows an injected error. This closes the original finite component finding; it is not power-loss durability or corpus-recovery acceptance.

## STATS-R02-R01-002 CLOSED: confirmed own host-job stop

The swallowed taskkill branch is removed. The source-bound controller starts an inert stdin-gated entrypoint, assigns the child to its owner-named non-inheritable Windows Job and only then releases target import. Flags are KILL_ON_JOB_CLOSE + active-process limit32, with no breakaway flag. It accepts only a successful matching-owner terminal with native active-process count0, rejecting STOP_FAILED, unknown/mismatched owner, nonzero manager result or surviving/unconfirmed descendants. Manager-loss fallback independently queries the same owner-named job and confirms0; it exposes no arbitrary PID/taskkill interface.

The repeated actual tests create only their own random-owner synthetic host worker+descendant trees. Both normal stop and manager-crash/job-close fallback reach native active_processes0 and job_destroyed true. They finish in bounded time and remove their own fixtures. Four new entrypoint subprocess controls show wrong-owner handshake, stdin closure and oversize handshake prevent target import; an explicit finite valid handshake permits only the test module. No other-owner resource was touched.

This closes the original host-helper stop finding. It does not prove Docker container termination,1CPU/1536MiB cgroups, final statistical worker containment or functional supervisor/probe failure cleanup. These remain explicitly WIP, as the author correctly states.

## STATS-R03-R01-001 OPEN — P2: unprojected stop/error fields bypass typed privacy metadata

`failure-ledger.mjs` filters first/secondary error name/code, but `emit(status,workerStop)` places the entire caller-supplied workerStop object into the stdout terminal. The owned controller's failure/fallback paths retain `errors` and `first_stop_failure` messages. Those fields bypass the ledger's safe error projection and could contain parser/protocol/error text. A bounded synthetic negative demonstrates `PRIVATE_WORKER_STOP_CANARY` and `PRIVATE_FIRST_STOP_CANARY` appearing verbatim in the purported typed terminal. This is a component counterexample, not evidence of any real private data exposure.

The sink's `errorInfo` likewise copies any string-valued name/code into `abort()` rather than using a whitelist. A synthetic guard exception with private-name/private-code canaries is copied verbatim into the abort receipt. This is an additional instance of the same missing error projection boundary; the original internal-cause preservation must remain intact.

Required new immutable correction: project worker_stop through a fixed key/status/type/range allowlist; expose only bounded confirmation/ownership/count/failure-category metadata. Never copy raw messages, arbitrary extra keys, nested errors or first_stop_failure text. Use the same bounded safe error-name/code projection for sink abort metadata, while retaining the exact original Error object privately for cause equality. Unknown metadata should become an explicit unavailable/unlisted flag, not raw text. Preserve stop failure and first/secondary failure ordering; do not hide the fault to satisfy privacy.

Add canary tests for worker-stop raw messages/nested errors/unknown keys, arbitrary sink error name/code, oversize/malformed stop fields and normal native terminal fields. Confirm the valid owner, zero-process and STOP_FAILED semantics still survive projection. Repeat source/fault/privacy review before accepting that revision. Do not rewrite03 or this failing proof.

## Tests and remaining scope

All final commands exit0:73 repeated finite controls (30 inherited +20 infrastructure +6 support +17 faults), two repeated actual own-host-tree stop controls,15 independent controls, and exact input verification. The independent15 include the two deliberately confirmed privacy counterexamples; their test PASS is not implementation/privacy acceptance. Original host tree results and native confirmation records are frozen in owned-host-stop-stdout.txt.

Commands use Node24.22.0 with producer finite-controls.mjs, infrastructure-controls.mjs, eligibility-controls.mjs, fault-controls.mjs and host-stop-controls.mjs, plus this packet's independent-controls.mjs. Original `.venv/Scripts/python.exe -B` runs verify-inputs.py. One initial input harness assertion expected section-runner to be byte-identical02; its FAIL is preserved. After inspecting the exact three revision-label substitutions, the harness checks that exact diff and passes. No producer was changed by this reviewer.

No Docker, PG/HTTP/WS session, full corpus or runtime84 ran. The owned synthetic host tests and native job count are not statistical evidence or a substitute for the required Docker profile. Inherited remaining work stays open: final Docker worker/resource/failure/cleanup proof, source/runtime/dependency/build/prereg binding, allocation scalability and archive export, runtime84 admission/history/WS/heartbeat/private/semantic traces, offline coalesced-observer binding, exclusion support and GF equivalence, unchanged workload feasibility and full sections with independent raw coverage/AUC/denominator audit. Conditional single-profile R100 scaling remains neither ETA nor a bound. Human content HOLD and final stage review are unchanged.

Rollback: leave03 unused and preserve its checkpoint; implement the privacy correction as a new revision. All review writes are complete before INDEX freeze.
