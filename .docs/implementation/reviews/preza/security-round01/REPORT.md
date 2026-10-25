# Independent security/privacy exit review — presentations round01

**FAIL — three actionable findings.** Reviewed application source `31b4a57c5cfc6d78d311df9a892e49cb84a8efc8`, portable core `bd08b803cc55090fd346a2ece5b38eadb94eb93f505e2e078eed5068c9f43b1a`. Reviewer did not author the implementation, alter application files, run application tests, or execute builds/Docker. Read-only hash verification returned exit0: exact core matches; all40 indexed native/production evidence files match, zero integrity errors. This decision does not replace the independent engineering gate.

## Findings requiring correction or targeted evidence

### SEC-PREZA-03 — P2: raw upload has an inactivity timeout instead of an absolute capture deadline

`apps/api/src/presentation-routes.ts:19` admits the single global raw body slot, then calls `request.raw.setTimeout(60000, ...)`. This delegates to a socket inactivity timer. A client sending small chunks before that idle period can keep the body and global rawClaim occupied past the contractual60s source-capture lease. Expiring the database job does not release that in-memory claim: only response/error/abort hooks do. Consequently one admitted host upload can block subsequent imports across rooms beyond its lease. Other upstream timeouts may eventually intervene, but this module does not enforce its stated deadline.

Add a per-admission absolute timer, clear it on every release/abort/error/response, destroy the unfinished input and release its exact claim when the deadline expires. Tie it to the remaining job lease as appropriate; retain exact length/digest checks and pre-parser admission. Verify the slow/trickling-body case using a finite controlled timer/clock test and prove a later import can acquire the slot. No minute-long statistical run is required. Primary semantics: [IncomingMessage.setTimeout](https://nodejs.org/docs/latest-v24.x/api/http.html#messagesettimeoutmsecs-callback) delegates to [socket.setTimeout](https://nodejs.org/docs/latest-v24.x/api/net.html#socketsettimeouttimeout-callback), which measures inactivity. Source analysis, not a reproduced production incident.

### SEC-PREZA-01 — P2: actual profile4 operator quiescence/rollback path is unproved

The native capacity drill `tests/presentations/backup-capacity.mjs` calls the real BK2 producer/reader with an adapter and restores to a temporary PostgreSQL database. It proves bounded BK2 framing, real dump/restore and ciphertext equality. Its adapter overrides `requireQuiesced` and `purgePresentationSpool`; it does not execute `DockerDriver.stop()`, the authenticated quiescence endpoint, exact owned-volume purge, `DockerDriver.restore()` or compatible profile4 restart/rollback. `PREZA-FEATURE-OFF` restarts the fixture API, which also does not prove those operator paths. These are explicit PRESENTATIONS/entry02 exit obligations, not optional public-release work.

Supply one bounded owned local profile4 drill through the actual driver paths: active/in-flight work, serving closed, authenticated quiescence or fail-closed stop, all app/media/converter writers confirmed stopped, owned ephemeral spool purged, compatible profile4 restart/rollback with preserved protected bindings and no live auto-resume. Include actual driver BK2 restore rather than representing the adapter drill as that proof. Wrong/old profile must remain rejected. No full P06 release series or P07 run is requested.

### SEC-PREZA-02 — P2: converter timeout and failed-cleanup closed admission negative paths are unproved

The actual hostile probe uses the real credential drop, verifies CapEff/Prm/Amb0 and NNP1, obtains EPERM signalling guardian, leaves a double-fork/setsid orphan and chmod000/symlink/FIFO junk, then proves namespace reaping/clean scratch/idle health and successful next PDF. This is meaningful positive isolation proof. Actual Docker inspection also records configured CPU/memory/PID limits. It does not exercise the separate required stalled-child deadline or cleanup-failure branch: current tests do not drive `PDF_TIMEOUT`, `GUARDIAN_CLEANUP_FAILED` or equivalent failed-cleanup closed-worker behavior.

Supply a finite host-controlled isolated converter drill that exercises the actual deadline path and a bounded uncleanable tree or equivalent cleanup failure. Demonstrate no surviving untrusted reader, closed/unavailable worker after failure, and refusal of another room's plaintext until a clean owned restart. Preserve the failed/closed outcome as successful enforcement evidence, rather than requiring a healthy conversion after an intentional cleanup failure. Existing mechanisms suffice; no new general testing framework is needed.

## Reviewed controls supported by source and actual evidence

Room/current cookie/member/slot/current18+/Origin/CSRF and host-only mutation guards are retained. A global claim is taken before raw PDF parsing; source length/digest and16MiB bounds are explicit. Metadata/PNG acquire room ordering and presentation mutation lock, then use the current final-access closure and synchronous raw enqueue with no async serializer/onSend gap. Live wrong-page requests return409, including host requests. Source PDF, Range and304 delivery shortcuts are absent. Per-member/global page admission and bounded no-store PNG responses remain enforced.

Encrypted source/PNG bytea uses room/doc/version/page AAD; protected document bindings are separate from PostgreSQL and media authority. Complete encrypted stage precedes the durable protected publication point. Old-DB restore proof keeps external floors unchanged, omits/denies replaced/deleted generations at the latest revision and preserves unaffected PNG bytes/current room cookie. The engineering gate separately considers the post-floor pointer-commit fault branch; this review does not infer that unexercised branch from old-DB restore.

Guardian is immutable trusted PID1/root in a private PID namespace with SETUID/SETGID/KILL only. Parser/helper drops credentials/groups/capabilities before execution, no_new_privs is retained. Network none, read-only root, no Docker socket/secrets/DB mount, bounded scratch/spool and process resources are specified and inspected. Guardian never parses PDF; fixed file names, single-link owner/mode/fd validation, correlated nonce/epochs and independent bounded API output validation are present. Namespace-wide kill/reap and trusted cleanup precede result publication/new plaintext.

UI uses owned Blob URLs, at most3 cached pages/2 pending transfers, scoped epoch/document/version checks after awaits, monotonic<=5s expiry, offline/visibility/identity cleanup and no browser persistence. Actual browser evidence covers RU/EN/TR layouts, import/live start/stop, offline URL revocation and real PNG decoding. Retention proof denies closed-room delivery immediately and verifies actual FK cascade after accelerated existing23h maintenance.

Capacity proof actually accepted66,325,926 ciphertext bytes across4rooms after a successful replacement while old assets were counted; actual BK2 dump75,937,032bytes restored equal metadata/ciphertext aggregate into a temporary DB. This bounds that admitted fixture; it does not prove unbounded room data fits a finite backup.

## Scope and retained limitations

Native-round04 index `afae1c79ab13c323ec06fd1a745dbbc6b448a3de4220e3f036b75cd72a6f0f0b` reports46tests/12presentation cases, exit0, exact clean unchanged source and completed cleanup. Production-build01 index `e1ed04947f1de66e2ef14b50a0a011a546fc3f4486643c36e44a8c06f107103e` proves unsigned local image build and actual package pins/copyright presence only. Earlier failed rounds remain historical evidence.

Known Poppler CVE disposition, Node patch24.22.1, full license/corresponding-source/advisory readiness and signed/public delivery remain explicit HOLD. This review does not establish parser memory safety, zero CVEs, public DNS/TLS, real devices, full P10 or aggregate P07. No new public-scope work is required to fix the three local mandatory findings above.

Required next cycle: corrections/evidence -> affected tests -> independent round02 review, preserving this round unchanged.
