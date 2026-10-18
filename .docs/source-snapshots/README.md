# Unmodified upstream source snapshots

These three Markdown files are **exact, unmodified** snapshots of the three user-supplied Exocortex normative/operational parts. Their byte hashes are recorded in `source-hashes.json` and checked by `tools/check_docs.py`.

## Important scope limitation

The original documents refer to other source files, including **Part 00, Part 01, Part 03, Part 06, Part 07, Part 09, Part 11, Part 13**, and `service_update_mechanism.md`. Those files were not supplied and **are not fabricated** here. Their links remain unresolved in these unmodified snapshots on purpose. Prior to a production release, obtain the authoritative immutable revisions from the central documentation and complete the material-divergence, backup-scope, host dependency and release gates.

These snapshots are **source evidence**, not locally editable Venus specifications. To update source policy, add a new separately hashed revision following central authority and approval.

Files:

- `PART_04_BOOTSTRAP_AND_DEPLOYMENT.md` — bootstrap, installer and server-managed Nginx.
- `PART_05_CI_RELEASES_AND_LOCAL_UPDATES.md` — CI tags, protected signing, updater and rollback.
- `PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md` — normative per-ID regression gate and issue catalog.
