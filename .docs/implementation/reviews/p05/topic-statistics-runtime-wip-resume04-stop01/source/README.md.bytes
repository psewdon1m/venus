# Statistics resume03 corrective checkpoint

Author correction of independent findings STATS-R02-R01-001/002 only; independent
repeat required. No complete infrastructure/runtime84/statistical/P05 acceptance.
Original resume02 and its failures remain immutable.

The sink now latches its first write/fsync/rename/manifest/replay failure, retains
that exact internal cause, closes its active owned handle and refuses every later
append/replay/finish. Failed bytes stay intact; abort reports a poisoned
NOT_ACCEPTED prefix. Closed normal indexes remain replayable, never silently fixed.
Eight injected I/O points and first-cause/secondary-failure controls exercise it.

The Windows host-helper/host-worker stop path now uses a named, private,
non-inheritable Job Object. The worker's inert stdin gate permits no worker import
or descendant creation until job assignment succeeds. Breakaway flags are absent;
process-count cap32 and KILL_ON_JOB_CLOSE apply. Native active-process count must
reach0 before confirmed termination. Manager crash/close fallback is independently
queried through the exact owner name; missing confirmation is STOP_FAILED, never
cleanup success. taskkill is not used. A failure signal also prevents main from
waiting indefinitely on an unresolved manager close. A typed stdout terminal
preserves first/secondary failures even if the disk receipt writer fails.

Two bounded actual tests stop only their own synthetic host trees (normal stop,
manager crash/job-close fallback); both verify nativeActiveProcesses0 and destroyed
owned Job. These are host control tests, NOT Docker acceptance or runtime84.
Native API basis: [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
and [native accounting](https://learn.microsoft.com/windows/win32/api/winnt/ns-winnt-jobobject_basic_accounting_information).

**Standalone host statistical sections are not the final authorized producer.**
Owner acceptance requires local Docker. Before full statistics, implement/bind the
actual Docker worker with1CPU/1536MiB, no network, read-only root, unprivileged UID,
source/image/runtime pins, actual cgroup inspection and ownership-checked container
stop/cleanup with retained artifacts. Killing a Docker CLI PID is not container
termination. Job controls cover only host helpers; they replace none of these
Docker requirements. Existing32GiB ledger/counts/seeds/thresholds are unchanged.
No Docker, PG/session or full statistical run occurs in this checkpoint.

Further inherited WIP details follow; all accepted-scope limitations still apply.


Scope: implemented finite infrastructure + explicit actual-adapter work in progress.
This checkpoint is NOT independently accepted, NOT a statistical run, NOT a runtime84
result, NOT a P05 gate PASS and does not change human content HOLD.

`supervisor32.mjs plan.json` launches the exact ordered statistical worker only after
clean-current-source, preregistered Git-tag inputs and explicit root authorization.
It uses a separate host worker and an owned inert read-only/no-mount/IPC-none native
free-space probe. It does not build/pull images or launch functional Docker fixtures.
There is no authorized plan/ACK in this checkpoint. `--describe` is safe/cold.

The new resource profile is explicitly separate from accepted128MiB/300s and
512MiB/900s consumers. The32GiB ledger is15GiB retained payload,15GiB reserved archive,
256MiB inputs,64MiB control,512MiB conservative native reservation,32MiB active-write
reservation and1184MiB safety; additional free reserve10GiB on actual host and native
filesystems. Filesystem scan/lease freshness failures retain a NOT_ACCEPTED prefix.
The accepted METHOD07 native NTFS scanner is copied byte-exact (7adcdaf51b40191ee5abf76def60292aa4a49364a62721968c68cd0ef7ebb4de).
This is sampled allocated-file accounting with conservative reservations, not a
filesystem quota or Docker VHD extent measurement. Repeated scans can fail closed
on active-file changes, a slow directory, stale native data or missing metrics.

`durable-sink.mjs` writes one gzip member per JSON row, fsyncs before returning
`durable:true`, chains SHA256 rows, seals bounded segments and verifies the exact
persisted chain on each replay. A crash prefix is preserved and cannot imply full
coverage. All fixed sections/counts/seeds/thresholds remain inherited byte-for-byte
in workload/consumer definitions. Full inference may require up to1075 repeated
raw-corpus passes; no claim is made that this is affordable.

Runtime adapter modules (`derive-runtime`, `actual-session`, `coalesced-observer`,
`pair-normalization`, `poll-registry`) are UNEXECUTED author code. The derivative
AST-selects only draftSnapshot seed, retains the actual production WS ticker body
under an explicit manual poll barrier, relocates imports, and uses the synthetic
4930-card fixture. It records complete original/derived source bytes and hashes.
Private UUIDs and explicit token fields may normalize bijectively; card digests,
candidate_ref, revisions, frame counts and other values must remain equal.
This fixture scheduler is never evidence for untouched production timing.

Actual runtime integration is incomplete: no runtime84 orchestration/receipt is
generated; real HTTP admission of all actors/extra observer, preStart history capture,
WS initial-drain ordering, bounded real heartbeat policy, actual outside-target
privacy audits and six persisted cross-session/cross-mode semantic assertions need
implementation and independent review. The public offline statistical session
adapter still uses the historical conservative uncoalesced METHOD06 observations.
It MUST be bound to a validated coalesced model or explicitly preregistered only
after real transport parity; a schema receipt or these finite controls is insufficient.

Remaining infrastructure prerequisites before operational acceptance: independent
source/raw review; host worker process CPU/RSS containment (current launch is host
process, no claimed1CPU/1536MiB hard cap), full supervisor/native-probe and sampled guard actual
fault tests, actual native probe inspection/cleanup, allocation scan scalability,
complete source/tag/producer/runtime evidence binding and force-build lineage.
The Docker side of the supervisor currently supervises only its own inert probe; it does not supervise
functional PG/API runtime containers and512MiB native reservation is not proof of
their actual quotas. The reserved archive partition is not an implemented export.

Further prerequisites: complete fixed exclusion support certificates; GF public
stage1 cross-profile structural-equivalence proof (including legitimate T5 public
history differences); complete independent raw recomputation; finite feasibility
qualification within unchanged32GiB and explicit wall budgets. Never shrink counts
or reinterpret a prefix as acceptance. Conditional R100 scaling is in FEASIBILITY.json.
Final source inventory can be frozen only after parallel P04-r3 writers stop and
root explicitly freezes final reviewed content/source and clean preregistered inputs.

Rollback: leave original resume01 and all original METHOD06/07/production sources
untouched; do not invoke resume02. Keep failed outputs and own immutable review
packet as evidence. Owned controls use temporary directories and remove them.
