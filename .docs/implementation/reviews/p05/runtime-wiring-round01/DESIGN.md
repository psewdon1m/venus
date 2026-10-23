# Independent runtime-wiring preflight design

Scope: root server assembly, released profile selection, directory allocation, registry/lifecycle bridge, migration and startup ordering, feature-off recovery, catalogue source authority, protocol dispatch and deployment configuration. This is a new review; the prior Topic Games component PASS does not accept server wiring.

Inputs: 21 captured files in `exact-source/`, hashes and capture timestamp in `pins.json`. Files were captured individually on a concurrently changing worktree, not as a global frozen release. All findings refer to those exact captures. No product files are edited by this reviewer.

Method: static control-flow review first; one supporting direct-method Node probe uses the exact captured Topic Games TypeScript, compiler-only transpilation and explicit SQL rows/doubles. No Docker, PostgreSQL server, HTTP listener or real websocket was run for this task. Actual runtime producer and later immutable-source tests remain required.

Required invariants:

- Approved release data exclusively supplies cards/maps; empty registry and incompatible taxonomy cannot silently fabricate a profile or activate synthetic content.
- Old and V2 codecs/maintenance remain separated by immutable room protocol, including feature-off restart.
- Migration checksums are immutable; game schema precedes V2 foreign keys; required startup revocation and reconciliation complete before listen.
- Missing external lifecycle authority is not recreated during a read/restore; auth/safety fences remain outside source-degraded fallback.
- A content outage cannot disclose revoked text and should leave basic room presence/retained safety operations usable.
- Supported compose configuration must actually forward required external ledger settings; a missing ledger never triggers empty auto-provisioning.
- Existing state volumes require an explicit reviewed cold upgrade; image-added directories are not sufficient proof that older mounted volumes contain new roots.

Questions/proof obligations for the next runtime producer:

1. Cold launch default/closed with empty approved registries; enabled + unapproved profile fails before listen with generic safe diagnostics.
2. Existing protocol2 + feature off: retain compatible profile and authoritative roots/keys, revoke ephemeral private state before listening, deny starts/content, keep normal room websocket alive with generic/null game projection, allow Stop/Leave/Close.
3. Missing/corrupt roots/birth/intent/witness must deny admission, not auto-initialize; missing personal chain may retain metadata-only safety path.
4. Catalogue ledger absent/corrupt/unreconciled/withdrawn denies content; final enqueue cannot leak pre-withdrawal prepared payload.
5. Fresh volume and existing pre-P05 volume upgrade paths must be distinguished; restore never repairs a missing protocol2 authority by creating empty roots.
6. Compile-time profile compatibility across retained map revisions is an explicit release constraint, not a filesystem hotload or automatic taxonomy migration.

Findings from this round are recorded separately in `../runtime-wiring-round01.md`. Root-owned corrections require new source captures and independent round02; original failures and snapshots remain immutable.
