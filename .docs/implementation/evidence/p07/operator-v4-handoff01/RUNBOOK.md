# Current operator handoff — standalone profile v4

This additive handoff applies to local-pilot `standalone-local-presentations-v4`, candidate source `c2eeb9090d889d843ae6a458a27450d904af84d8`, implementation core `cde7f14637ca4319cb1e15f4b14e9fb481ac97fe7e39b330f47acc079c6d8310`, application version `0.0.2`, backup `VENUS-HOST-BACKUP-2` (magic `VENUSBK2`, below BK2). It preserves the historical [P06 v2/BK1 runbook](../../../P06_OPERATOR_RUNBOOK.md) and [P11 media-v3 addendum](../../../P11_OPERATOR_COMPATIBILITY.md). Their pending-stage statements describe those historical snapshots. This document supplies the current operational profile without rewriting their contracts or accepted evidence.

Current local image native/OCI index is `sha256:8ab88180197553a43c52e68a2e3be70164a3ecd6cca736d94dde13da347b0b64`; its platform configuration is a distinct `sha256:db6b261080b03efaf2d6744d5410254d9d55e8225ae3244d44d527566b4e35a9`. Exact local install02 exercised the unchanged real Driver, identities, 18+/V2 and all four module routes with fixture signing only. Its temporary loopback registry, reference and credentials were removed during scoped cleanup and are not user installation inputs. Genuine `venus-v0.0.2`, service signature, GHCR/release assets and anonymous checks are separate pending obligations. Immutable `venus-v0.0.1` must never be repacked or overwritten.

Hour02 is in progress when this handoff is written. No hour, final CI, final two-reviewer acceptance, signed release, production, physical-device or real-music success is claimed. Scope is local Docker/mobileWEB on one Venus host with its built-in media server. External Exocortex/updater/SFU hosts are not dependencies. The owner's host music library comes later. Public DNS/Cloudflare/certbot/TLS/WSS/ICE/NAT/UDP and real networks/devices remain future deployment checks.

## Inputs and authority

Operate from the exact accepted checkout on Linux, or inside the existing operator runtime with the same mounts and fixed UID. Before mutation record UTC, host, working directory, source/core, installed and candidate version/OCI/config/schema/profile, project label, local/host roots, job ID and backup receipt. Executor is UID1001:GID1002, operator UI UID1002, app/media UID1000; only initial provisioning is root. Dedicated/rootless Docker daemon and systemd isolation remain production-host prerequisites; Docker Desktop proof does not establish them.

Existing executor configuration names `project`, `local_root`, `host_root`, `port`, canonical loopback HTTPS `app_origin`, `compose_template`, `trust_file`, `socket`. Set `release_environment` exactly to `standalone-local-presentations-v4`, with `presentations_enabled` and `calls_enabled` explicit booleans. The template is the installed exact `infra/venus/compose.presentations.standalone.yml`, never an uploaded arbitrary YAML. `host_root` is the same installation directory in the Docker daemon filesystem; Docker Desktop volume mountpoints and Windows paths are not interchangeable. Do not overwrite operator configuration with example defaults.

Trust is independently provisioned from `infra/venus/release-trust.json`, service key ID `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb`. Public trust is nonsecret. Owner already approved this signing key and protected GitHub environment. Its private key stays outside Git and is not an installation credential. Never copy the drill's fixture trust into a service installation. Operator access bytes are explicitly chosen in a protected file and preserved exactly; DB/keyring/media secrets are generated once. Commands carry paths or IDs, never secret values. The operator credential directory is mounted and the key reread per request; database recovery must not restore old access credentials.

## Existing commands and exercised boundaries

These are existing CLI entrypoints, not new commands. Exact candidate-only Driver install exercised the actual installation/identity/ACL mechanisms; the historical real-v4 eleven-record reproduction separately exercised BK2/quiescence/restore. The human shell sequence below is an operational reference, not a newly executed shell receipt. Actual service release paths and IDs are not fabricated.

Only for an explicit brand-new installation, with a protected operator-input file, run as root from the installed checkout:

```sh
node tools/venus-operator/provision.mjs /var/lib/venus /secure/operator-input-file --presentations
```

This provisions media and presentation authorities and a public provisioning receipt. It refuses to overwrite existing protected/secrets/PostgreSQL/operator credentials. Never use provisioning as repair, restart, restore or replacement of missing authorities. Root-owned `/etc/venus/executor.json` and operator config are supplied separately with verified mounts/UID/trust. Initial root provision does not authorize a root executor.

As UID1001:GID1002 in that configured runtime, from the same installed checkout:

```sh
node tools/venus-operator/cli.mjs status /etc/venus/executor.json
node tools/venus-operator/cli.mjs import /etc/venus/executor.json /verified/venus-v0.0.2
```

`import` verifies independently trusted signature, canonical manifest, exact profile/schema/source/image metadata and the bounded installed-template contract, then returns `release_id`. It does not activate anything. `/verified/venus-v0.0.2` denotes the eventual real verified release directory, not a present signed receipt. Keep the separate `sources.tar`, `SOURCE-INDEX.json`, `THIRD-PARTY-NOTICES.md` assets with the release; fixed names/size/digests are committed by the bundle README hash under the signature. Import does not execute source archives or arbitrary archived code.

For initial installation only, substitute the actual returned release ID:

```sh
node tools/venus-operator/cli.mjs install /etc/venus/executor.json RELEASE_ID
```

`RELEASE_ID` is a named substitution, not a literal executable value. Install rejects an initialized installation; verifies reference/OCI/config/source/version before mutation; uses fixed Compose; waits for DB/application/media/renderer readiness and opens serving only after exact identity/health. Room admission still requires explicit offer acceptance and 18+, including the mock local-pilot policy.

Updates use the existing separate loopback operator UI/API: choose imported release, create job, confirm explicitly, then apply. Browser payloads cannot select shell/path/URL/template/capability. Preserve the immutable displayed job UUID (also in the URL hash) across reconnect/502/re-login; read that existing job before retrying mutation. A transport interruption does not prove terminal operation failure. Exact credential input supports a file; it is not persisted in browser storage.

For inspection or explicit recovery, as executor UID in the same configured runtime:

```sh
node tools/venus-operator/cli.mjs status /etc/venus/executor.json JOB_ID
node tools/venus-operator/cli.mjs recover /etc/venus/executor.json JOB_ID
```

`JOB_ID` is the actual preserved UUID substitution. First diagnose `original_error`, safe `failure_details`, durable phase and separate `recovery_outcome`. Recovery is a mutation, not a blind status probe. Never delete a live lock/job/active record or edit its hashes. The engine checks active job identity, validates durable records, repeats preflight on interrupted initial install and leaves serving closed if recovery cannot be proven.

## Backup and restore

An update creates an owner-only host `backups/<job_id>.vbackup` only after authenticated presentation quiescence, stop of app/media/renderer, verified stopped writers and spool purge. BK2 contains bounded custom PostgreSQL dump (maximum256MiB), canonical header, source/core/schema/profile, job/timestamps and digests. The reader verifies the entire frame and file, not existence alone. Unfinished temporary files are not successful copies. Retention expires eligible files within seven days; corrupt files remain for explicit investigation. Venus creates the local file; an external host mechanism copies it. Venus does not claim that external backup succeeded.

BK2 excludes credentials, keyring, protected authorities/ledgers/witnesses and volatile plaintext spool. Fresh-installation recovery needs separately secured keyring/required secrets and the **latest complete protected state**: deletions/catalog high-water, topic birth/personal/lifecycle chains and witnesses, media and presentation authorities. Copy these before opening admissions against restored old DB. Missing/corrupt/regressed authority fails closed; never regenerate it to make an old database healthy. Do not replace newer consent/exclusion/deletion floors with older copies. Accepted separate-empty-PostgreSQL recovery copied dependencies before admission and preserved settings/cipher assets while denying retired access and old live sessions.

Supported automatic failed-update recovery is the existing engine transaction: validate recorded BK2/current predecessor; stop/quiesce writers; restore only the owned PostgreSQL target in a transaction; load exact saved compatible predecessor image; perform protected boot/reconcile/retirement/readiness; then open serving. There is no generic standalone `restore` CLI command. Cross-host/manual recovery must follow the accepted dependency order with reviewed inputs; this handoff invents no unexercised one-line restore procedure.

The predecessor must support v4/BK2, presentation module generation1 and current module schemas. Primary generation1 alone does not imply all modules are compatible. Historical v2/v3 and immutable0.0.1 are not generic v4 rollback targets. `PROFILE4-REJECT-OLD-PROFILE` rejected the old profile before restart of a healthy v4 instance. Metadata-derived A/B restore was synthetic/local, not a signed public old-to-new upgrade. Feature rollback uses the owner-controlled capability false in a compatible profile/image; it preserves safety leave/revoke, tables and latest protected floors.

## Verification, failure and publication

App HTTP4300/operator4310 are loopback-only; PostgreSQL has no host port. Built-in LiveKit uses the explicitly published media TCP7881/UDP7882 transport ports. These are not public-edge/TLS qualification; do not state all media-profile ports bind loopback. Health separates `/health/live`, fresh dependency/schema `/health/ready`, exact `/api/v1/version`, renderer health and eventual public edge. Current readiness uses one existing pool client for the same eight ordered fresh probes, disposing incomplete chains; it does not cache or turn failures into success. Actual21PostgreSQL component and install02 do not substitute hour02.

Post-change checks cover fixed config/mounts, exact image/source/config/version, readiness, affected authenticated mechanisms and compatible rollback metadata. Closed serving requires inspection of actual containers/data/DB/protected state; process-green alone is insufficient. Preserve fault and rollback outcomes separately. Incident evidence contains UTC, release/job IDs, safe codes/statuses, scoped resources and report paths. Exclude credentials/cookies/private content/SDP/JWT and arbitrary upstream bodies. Cleanup requires verified owned labels; never global prune or delete installation data to pass a check.

**REL-11 pending technical item:** current downloader has four bounded attempts with capped exponential delay/numeric Retry-After for429/502/503/504, bounded staged files and verification before activation; it lacks jitter required by the original prevention. Root will make that narrow downloader change after hour02 and run the existing targeted `P06-DOWNLOAD` check plus independent diff review. It is not waived as single-operator/N_A, implemented here or marked passed. Downloader changes are outside consumer hour runtime, but final exact source/image/release binding remains mandatory.

Real service workflow is fail closed: exact qualified tag/main/clean checkout; required quality/unit/integration and source-bound118/two-reviewer pre-sign decision; immutable-release refusal; one exact image; current sources/notices and Poppler boundary; exact published-image installation before private key exposure; signature; draft byte roundtrip; anonymous verification. Final mandatory five-job CI runs once on final docs/review head. No future CI/signature/publication is marked passed here. Root must link this additive handoff from current status/registry and bind final reports before genuine0.0.2 publication.
