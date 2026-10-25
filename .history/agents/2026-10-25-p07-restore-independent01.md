# P07 independent restore reproduction

## 2026-10-25T15:08:49.7703507Z
Task: actual independent production-image profile4 reproduction and clean-project BK2 restore. Scope: own journal, .artifacts finite runner, reviews/p07/recovery-reproduction01 only. No product/framework edits. Inputs supplied: production source 14c5930bf6851e29ad885778b879a05240b5f1e5, image sha256:dee774f6a0b4009805c28fab297d3be0020d00c10baea99502a14c028385dfcd, core 1a76c7f5e6160af346155daec2269fe0dfd0a23fb3dc5c66141b8684e55ece61. Initial inspection read existing profile4 wrapper/helper; no tests yet.

## 2026-10-25T15:10:36.6519233Z
Prepared finite artifact-only runner/helper from existing profile4 helper. Adds one separate-project/state-volume/new-Postgres restore record; no product or tracked test edits. Root copy is explicit isolated operator provisioning after authenticated quiescence; copies only latest protected+secrets and exact BK2, never PostgreSQL files. Exact-byte and UID/GID/mode equality checked privately; only booleans/count emitted. Separate DB must have zero public tables before restore. Waiting stable clean harness/CPU window from parent before running.

## 2026-10-25T15:11:22.6601444Z
Parent authorized independent task-owned clone to avoid moving parent HEAD. git clone --no-hardlinks --no-checkout completed exit0; clone C:/.projects/venus/.artifacts/p07-restore-source01 checked out detached exact04a53507d6a3951da7a96d6d4d6a6759ef20792f. Artifact runner/helper copied unchanged into ignored .artifacts there. Both Node --check completed exit0. Actual production profile11record command launched session84247; no PASS claimed.

## 2026-10-25T15:12:11.5273250Z
Round01 FAIL exit1 before any product scenario: artifact runner's derived-helper Dockerfile used bare sha256 ImageId in FROM, which Docker interprets as repository sha256 rather than local image. Safe logs retained under owned clone .artifacts/p07-recovery-independent01/runs/venus-preza-ee5ef0fd80 (report SHA31f050be8e798fe0bac65b7d7d7bb735886790cc08040800dc9dc9cc43b2840d). Product image exact config verified a35afac8b06633beda800c90445987740438bc96c4d6a2eb2ea42967d1f8712a. No volumes created/no product change. Fixed artifact runner FROM to already-owned helper tag; round02 launched session70682.

## 2026-10-25T15:13:54.8751515Z
Round02 actual executor reached 8 PASS records: existing7 profile4 lifecycle scenarios and new P07-CLEAN-PROJECT-RESTORE. Recovery used distinct owned volume/project/Postgres, verified empty public schema before restore, exact BK2 ciphertext digest before admission, latest copied protected entries/floors, private exact key/protected UID/GID/mode/byte checks, kept PNG/settings, old/deleted denials. Original stopped before recovered project media ports started; clone stopped and original restarted afterward. Now actual120s renderer timeout negative running. Complete run still pending.
