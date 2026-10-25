# Presentation renderer IPC v1 (ADR042)

This is source contract, not an executed isolation or feature proof. Static
service name `presentation-renderer`, same exact Venus image; command
`/usr/bin/python3 -I -B /app/infra/venus/presentation-guardian.py` is actual
PID1/root with only SETUID/SETGID/KILL. Renderer65534, empty groups/caps,
private PID namespace, no network/socket/secrets/DB/host mounts. No TINI.

Fixed paths: shared API-owned1000:1000 mode1777 tmpfs
`/run/venus-presentations/spool`64MiB/1024inodes; private scratch65534:65534
mode0700 `/run/venus-presentations/scratch`64MiB/1024inodes. Both noexec,
nosuid,nodev. One job globally, no future plaintext while busy or closed.
The API environment is `VENUS_PRESENTATIONS_SPOOL`,
`VENUS_PRESENTATIONS_AUTHORITY_DIRECTORY`, `VENUS_PRESENTATIONS_ENABLED`.
Feature-off still requires provisioned protected floors and static guardian.

Every control JSON has schema_version1. Identity is four canonical UUIDv4
strings: job_id,nonce,api_epoch,guardian_epoch. Guardian epoch changes on
guardian restart, not between jobs. API publishes immutable regular,
single-link files owned1000 mode0444 via atomic rename, source first and
request last. Guardian never parses PDF/PNG; parser output is untrusted.

- `health.json`: root-owned0444, guardian_epoch,state(idle|busy|closed),
  job_id/api_epoch/nonce null when idle, updated_at UTC. Atomic heartbeat
  every0.5s, including trusted cleanup; API requires mtime freshness5s.
- `source.pdf`: exact source_bytes<=16MiB, source_sha256 declared by request.
- `request.json`: identity,source_bytes,source_sha256,output_budget_bytes
  (positive<=64MiB). Source hash/size/owner/mode verified before child exec;
  readonly descriptor inherited, no renderer-chosen input paths.
- `cancel.json`: schema_version+exact identity only; cancellation is bounded
  and never permission to publish stale output.
- `page-N.png`: root-owned0444, sequential N=0..count-1, regular single-link,
  each<=4MiB. API independently checks actual PNG dimensions/digests/count.
- `result.json`: root-owned0444, identity,status(ready|failed|cancelled),
  error(null or fixed PDF_* code),pages[{index,file,bytes,sha256,width,height}],
  total_bytes. No parser diagnostic/source/path/title in results/logs.
- `ack.json`: schema_version+exact identity only. Guardian remains busy
  through result until ack;60s absent ack closes, never silently accepts
  another job. API restart acknowledges old result or cancels old busy job.

Guardian kills every other process in its own namespace, reaps orphaned
setsid descendants, normalizes only expected output with trusted UID65534
helper, copies checked fixed files into root-owned spool files, and cleans
all scratch and consumed input before publishing result. API source/request
may disappear before result. UID65534 helper cleans child-owned scratch/
spool junk including chmod000 directories, links/FIFOs without following
them; UID1000 helper owns sticky spool directory and unlinks remaining
API/root regular entries. Depth32/inodes2048/helper8s limits fail closed.
After ack repeat namespace kill/reap/cleanup before health becomes idle.
No root DAC_OVERRIDE/FOWNER is added. Unsafe/cross-owner cleanup stays closed.

Render profile: source16MiB,100pages120DPI,finite geometry8192px/8Mpixels,
page4MiB, total<=effective allocation<=64MiB. Source/control/result share
64MiB spool; guardian also reserves128KiB framing/control margin, so actual
output cap is min(request allocation,64MiB-source_bytes-128KiB). Scratch
separately64MiB. Independent ceilings are not promised combined capacity.
Metadata budget30s, whole render120s, childCPU90s/NOFILE64/core0/FSIZE16MiB,
pdftoppm childFSIZE4MiB, aggregate stdout+stderr256KiB; cgroup.5CPU/512MiB/
32pids. Unknown/malformed PDF fails normally; unsafe renderer behavior may
close the converter until explicit operator restart.

Operator profile `standalone-local-presentations-v4` is explicit signed
module1/converter/quiescence/BK2 envelope; PostgreSQL generation remains1.
Close serving -> POST `/internal/v1/presentations/quiesce` authenticated
with existing media HMAC -> stop API/renderer/media -> verify all stopped
-> purge only verified project-owned tmpfs spool -> dump/restore. Feature
off compatible profile4 rollback preserves all floors. No gen3 downgrade.
BK2 producer/read/framing/restore<=256MiB dump+65536header+12prefix; BK1
strict128MiB remains readable and is never restored into profile4. New
dependency/public release/source/license readiness and aggregate P07 HOLD.
