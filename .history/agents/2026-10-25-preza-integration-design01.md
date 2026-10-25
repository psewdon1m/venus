# Presentations bounded integration design01

- Agent: /root/contract_review
- Started UTC: 2026-10-25T05:49:49.6940066+00:00
- Scope: read-onlysmallintegrationproposal from acceptedprezaentryE01..04, existingVenusauthority/crypto/operatorbackup/compose and pinnedPreza clone; no implementation/selfgateapproval.
- Owned: this journal only. No app/source/manifest/otherreports writes; no tests/build/install/Docker/heavywork duringP11quality. W9c710aa6, clone C:/.projects/venus/.artifacts/preza-source-audit01.

## Read-only findings and recommendation

- Completed selected source inspection, no tests/build/install/Docker/container or app/source writes. Two harmless exploratory reads failed: nonexistent apps/api/src/crypto.ts (actual crypto is security.ts), nonexistent tools/venus-operator/backup.mjs (actual backup is driver.mjs); an rg glob supplied as a literal path returned123. These are inspection failures, not product/test failures.
- Smallest deployment proposal: preserve the single signed Venus image identity and add pinned Python/Poppler plus one static converter service role, matching existing same-image media role. No API Docker access and no second image trust/archive mechanism. Additional package inventory/licenses and the new compose/profile are new release inputs; old accepted proofs remain unchanged. Reuse actual pinned Preza render_pdf behavior, not its FastAPI/admin/SQLite/public slug/updater.
- Preserve host room document library/title/settings/default scroll-or-slides/allow_switch; staged atomic replacement with fresh content identity, live=false and page0; host preview, live start/page/stop; room-member live reads restricted to exact active doc/version/page, with current snapshot on late join/reconnect. No raw PDF viewer route, URL imports, invented formats/animations, or SFU track for static pages.
- Store source PDF and page PNG as bounded encrypted bytea with metadata/pages/jobs in PostgreSQL. Existing Keyring padded-json-v1 is16KiB and json-v1 adds JSON/base64 inflation; add a narrow versioned binary AES-GCM envelope using the same managed keyring with room/doc/version/kind/page AAD, rather than putting blobs in json-v1. Server-readable encryption, not E2EE. Additive tables plus one final active-pointer/version CAS avoid replacing the existing private-channel framework.
- Reserve global and room ciphertext/source/PNG/staging bytes before accepting a job, including old active version until commit. Keep one running converter job, bounded metadata queue and no room/PG lock across Poppler. Stage hidden encrypted pages individually; publish pointer/settings/live reset atomically after reacquiring room-first then quota/authority locks. Recheck room/session/18+/offer/host, serving/protected state, job and expected content generation at commit. Stale conversion after delete/close/replace/restore never publishes. Final PNG output is at most one bounded page buffer; after all awaits obtain Rooms.finalAccessFence and synchronously compare current doc/version/live-page/protected floor immediately before enqueue. Private no-store, no stale304/Range shortcut or persisted browser cache; outbox carries references rather than private plaintext.
- Dedicated presentation protected state should reuse ProtectedAuthority atomic write, fsync, witness and fail-closed rollback/missing-state pattern. Current active-lease map/removal/epoch reset is not a document deletion ledger. Use bounded typed doc UUID records with room binding, monotonic generation/current binding, deleted marker and protected retirement time. Commit floor before DB visibility; a crash may deny visibility but must never reveal a retired version. Do not silently reinitialize a missing witness or clear it on feature disable/rollback. Retain tombstones beyond every usable7day backup; pruning must use protected time and verified backup expiry, never restored DB time. A hard bounded authority inventory may reject new writes instead of forgetting a floor. Existing room ledger continues handling room closure; no filesystem store of PDF/PNG is needed.

## Converter trust boundary (parent follow-up explicitly considered)

- A persistent worker and hostile Poppler under the same UID are inadequate: the child can stop/kill the worker, escape its process group with setsid and survive to observe later jobs. Existing same-UID media supervision is not a proven hostile-document sandbox. No equally safe existing pattern was found. Do not claim a per-process timeout or killpg closes this boundary.
- Recommend explicit new ADR exception to the entry nonroot-container preference: private PID namespace, tini PID1 and tiny trusted root guardian with only SETUID/SETGID/KILL; renderer child65534, supplementary groups removed, all effective/permitted/inheritable/ambient capabilities cleared, no_new_privs and no way to gain privileges. Guardian is not a parser and consumes only fixed bounded job descriptors. No host PID namespace/network/ports/API/DB/admin/keyring/secret/Docker mounts; readonly image; no SYS_ADMIN/ptrace/DAC_OVERRIDE. CAP_KILL must operate only in this private namespace.
- Guardian invokes kill(-1,SIGKILL) before and after each job, then reaps and verifies no renderer survives before accepting another job. This catches setsid descendants; Linux excludes namespace PID1 and caller from kill(-1). Kernel namespace-init exit kills all namespace processes. These mechanics are documented but are not local isolation proof. Resource exhaustion or cleanup failure must stop processing/restart the converter namespace; never proceed optimistically to another job.
- Root without DAC_OVERRIDE/FOWNER does not imply arbitrary cleanup of child-owned chmod000 directories in an API-owned1777 spool. Separate API-owned immutable input/result handoff from child-owned bounded scratch; trusted cleanup under childUID after all hostile processes are dead can remove child-owned trees, with descriptor-relative NOFOLLOW paths. Missing/unsafe cleanup remains fail-closed. Do not solve cleanup by adding broad filesystem capability or mounting private state.
- Use a real shared bounded tmpfs volume, not two independent service-local tmpfs mounts. Input/result names are server UUIDs; enforce regular files, no symlink/hardlink/traversal, exact expected list, bounded manifest/diagnostics. Spool is not authority. Verify PDF/PNG signatures, output dimensions/count, per-page and cumulative bytes and digests in API. Only expose a job input after previous namespace cleanup; do not preload queued future documents into converter-readable spool.
- Retain entry candidate bounds unless a new source revision explicitly changes them: PDF16MiB,100pages,120DPI, PNG4MiB/page and64MiB/document ceiling; finite geometry<=8192px per side and<=8M pixels/page; one running job, CPU1/RAM512MiB/PID32, aggregate tmpfs128MiB, NOFILE64, core0, bounded per-file RLIMIT_FSIZE plus aggregate filesystem quota, metadata30s/whole120s/child CPU90s and bounded diagnostics. Render incrementally per page and check limits before parsing/render and before accepting output. Actual resource/isolation evidence is mandatory before enable; this task supplies none.

## Backup, restore and rollback decision

- Prefer new versioned256MiB whole-dump/read/restore envelope and global64MiB presentation pool (source+ciphertext PNG+staging+reservation) over silently reducing render behavior to96DPI/8MiB source. Keep room128MiB and per-document64MiB PNG as upper ceilings, not promised simultaneous capacity. Effective job output allowance=min(64MiB, remaining global/room pool after PDF/envelope/old active); reserve it before conversion. A16+64MiB maximum document does not fit global64, nor does atomic replacement of two maximum documents; reject with clear quota failure while preserving old content. Do not describe ceilings as guaranteed acceptance.
- This is a bounded candidate, not a proof that bytea fits pg_dump. Split command stdout cap from dump cap; update actual streamed producer/temp cap, VENUSBK1 framing, reader/archive length and restore validation consistently, preserving old128MiB input compatibility and exact old proof bytes. Set temp/final-backup/WAL/database/spool disk reserves. pg_database_size is only an early conservative admission guard. Freeze a whole accepted baseline including other room data; actual largest accepted incompressible multiroom/library+staged replacement fixture must produce a bounded single backup file and restore its intact nonretired blobs/settings, while deleted/replaced generations remain denied. If it fails, lower admission pool or revise the bounded envelope, not remove limits.
- Operator currently quiesces/starts/checks only app and media. Extend lifecycle to converter and cancel current conversion epoch before backup/restore; serving closes before stop, no converter job/result survives as publishable authority after reopen. Spool is ephemeral and excluded, PostgreSQL owns durable data, floors/keyring remain excluded from DB backup as today. On restore reconcile protected floor before ready/admission, cancel unfinished jobs, live=false/page0. Include converter/package/profile changes in exact source/image/backup parity proof. Feature-off rollback cancels jobs/live and disables routes but retains additive data and protected floors; never roll protected state backward with the DB.

## Remaining inputs and status

- No new owner policy answer is necessary for the bounded scope already authorized by U023/entry. Before implementation freeze, parent must record engineering decisions: guardian-root ADR exception and isolation contract; binary-envelope/schema/API revision; precise job/queue/quota/authority bounds;256MiB backup profile compatibility; exact Python/Poppler/base/package pins and license inventory. These are unimplemented technical inputs, not approvals granted by this memo.
- Later checks must explicitly cover escaped/suspended renderer cleanup, quota and geometry failures, conversion-vs-close/delete/replace/restore, latejoin/live wrong-page backend denial, protected-floor failclosed, atomic old-version availability on failure, and actual largest-accepted singlefile backup/restore. No feature/stage/public release PASS is asserted here.
- Primary Linux documentation accessed2026-10-25: https://man7.org/linux/man-pages/man2/kill.2.html (Linux kill(-1) exclusions and signal permissions); https://man7.org/linux/man-pages/man7/pid_namespaces.7.html (namespace-init termination and descendant visibility). These support mechanism only, not a tested sandbox.

## Exact selected input bytes

Parent supplied W revision9c710aa6 and Preza pin aeca0de85a54ca8c30ff9c7143f9352fdddfdecf. The following hashes bind the bytes actually inspected; no claim is made that a dirty/current worktree equals a clean commit.
[
  {
    "path": "C:\\.projects\\venus\\.docs\\implementation\\reviews\\preza\\entry-round01\\REPORT.md",
    "bytes": 20134,
    "sha256": "91e3aa481949df14e355bdea8b8f564fa17d3c50ff537edbbf3ab57ddb8ada3c"
  },
  {
    "path": "C:\\.projects\\venus\\.docs\\implementation\\reviews\\preza\\entry-round01\\DECISION.json",
    "bytes": 1829,
    "sha256": "32968c73f6caed3b19836b6bd301ae153a210307774e00d0813c4c8de46a7d1d"
  },
  {
    "path": "C:\\.projects\\venus\\.docs\\implementation\\reviews\\preza\\entry-round01\\INPUTS.json",
    "bytes": 5729,
    "sha256": "d7e19e31e5f4a4dbc6d1a2bfc0eff14e38c3ce155c68406bbf357d944bfaed47"
  },
  {
    "path": "C:\\.projects\\venus\\.docs\\implementation\\evidence\\preza\\source-audit01\\INDEX.json",
    "bytes": 618,
    "sha256": "da780a1650c872645efe21a45fde24b3285973f5ef2b8776569f145bdc90f8a0"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\apps\\api\\src\\security.ts",
    "bytes": 5723,
    "sha256": "5ce48de8027bc5eccbd8ff619f15768f14fff209ef74be4fb478ed896214183b"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\apps\\api\\src\\protected-authority.ts",
    "bytes": 4514,
    "sha256": "3fc2c39dedc589316fc2e10c0635692dcbafc7ae3289748601010ca494ee3c7b"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\apps\\api\\src\\rooms.ts",
    "bytes": 45946,
    "sha256": "8e0c5ebe49f1db70c0c5256f133c113414a5d8a32689a795fea7abed493d94e1"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\tools\\venus-operator\\driver.mjs",
    "bytes": 20926,
    "sha256": "51ed60cf963dd0365643e1fecef918506093ae58d5cbe1419b5590ae0f915708"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\tools\\venus-operator\\engine.mjs",
    "bytes": 12996,
    "sha256": "cdd712f4215073dbdb1799c4d1972e422b73a8d7a7ee2a9dd84f069646897ab6"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\tools\\venus-operator\\provision.mjs",
    "bytes": 3381,
    "sha256": "652129f579532aad44e177f71b3edb1e504dbd93ac64c0e57a2757d6a1c3745e"
  },
  {
    "path": "C:\\Users\\pc\\.codex\\worktrees\\p06-standalone-release\\venus\\infra\\venus\\compose.media.standalone.yml",
    "bytes": 3777,
    "sha256": "a5857c681d0a0884baf0429a553179b32dbab16f959917857f1790ac2e7ba1aa"
  },
  {
    "path": "C:\\.projects\\venus\\.artifacts\\preza-source-audit01\\api\\app\\storage.py",
    "bytes": 7360,
    "sha256": "afe324d09b00282f597817b0e811648d1e8569cb579b8d351d406debac213662"
  },
  {
    "path": "C:\\.projects\\venus\\.artifacts\\preza-source-audit01\\api\\app\\main.py",
    "bytes": 25947,
    "sha256": "26f61c6aaa4d79a3be14b7f31eb26943278a09a285e459b39b4f351fd386b063"
  },
  {
    "path": "C:\\.projects\\venus\\.artifacts\\preza-source-audit01\\api\\Dockerfile",
    "bytes": 1212,
    "sha256": "40e5fbb5b21b4bfd97e6b93b3840313109105564146d63207e0ce846d3885a01"
  },
  {
    "path": "C:\\.projects\\venus\\.artifacts\\preza-source-audit01\\api\\requirements.txt",
    "bytes": 69,
    "sha256": "214aa63140407aa97ce6a37420f2049b7a153dc9bb160a603db3900db4d69853"
  }
]

Completed UTC: 2026-10-25T05:56:51.1870367+00:00
Result: DESIGN_PROPOSAL_ONLY; no implementation, tests, runtime isolation or stage acceptance. COMPLETE_STOP.
