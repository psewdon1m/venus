# Independent Engineering/QA — E07 GitHub execution follow-up

**PASS_E07_EXACT_GITHUB_NONZERO_GID_EXECUTION**. E07 is closed for exact PR head `d3f7f60c63321fa17d2dd34b02d23144adff63c0`, implementation core `5a917292b99797afaaf58c7f41e21a1a24cf3358d923da071cad782a96f5f087` (unchanged implementation from911ac077). This is a bounded historical P06 proof, not full CI, stage, publication or new CI-policy approval.

Input packet github-pr-p06-pass02 INDEX SHA256 `5609b39bc9f850b7794c0fd398116279bf3bf6157c5267287a914c8f2ca4aaeb`: all49 indexed file hashes/sizes independently match. Raw report SHA256 `12a1c5770a535b6c26ac95fb798ff2c7df67069fed1b888bdf61ef3c95cedd77`.

Saved GitHub HTTP200 job metadata identifies run40134933732/job120994336366, p06-release-integration, head d3f7f60, completed/success. Unit, integration and upload steps all completed/success. Artifact12576792661 has the same run/head. Its GitHub digest exactly matches the download receipt archive SHA256 `5b457912be0fbbdbd72cb5204068364ebf2a1b6472e87332ffa49139fd879e3d`. Receipt records safe extraction without forwarding API credentials to artifact storage or logging signed storage URL. Reviewer made no API call and read no credential/private-key values.

Raw report independently matches exact head/core, clean source, actual fixture PASS,18 checks,45 native command exits0,17 jobs,11 equal six-table count comparisons, completed owned cleanup and no cleanup errors. All18 checks pass, including clean install/ACL/reader/native502/reload, occupied-port/disk/pull/permissions, migration/health, offline image removal/load, nine SIGKILL recovery phases, current protected-ledger replay/negatives/no-auto-restore and exact B/idempotence. This is the actual GitHub nonzero-GID environment previously absent from local GID0 proof.

Direct retained Docker inspect evidence confirms:

| Identity | Actual permission boundary |
| --- | --- |
| Executor | User1001:1002, GroupAdd118, mounted Docker socket. Reported measured socket GID118 agrees. |
| Operator | User1002:1002, GroupAddnull, no Docker socket mount. |
| Consumer | User1000:1000, GroupAddnull, no Docker socket/operator credential mount, read-only rootfs. |

Thus the measured supplementary group correction enables the intended trusted executor in GitHub without extending daemon authority to UI/consumer. No socket chmod, new runtime privilege or app/DB source change was introduced. Original E07 FAIL on358a/corea1c/job120990563939 and signing-round02's earlier pending verdict remain immutable; this new proof closes only their missing execution condition.

At the original handoff four P03 statistics were still pending under the then-current d3f CI policy; this review makes no full-CI conclusion. Subsequent direct owner steering to change CI/statistics policy and publish a GHCR preview concerns a later source/action and is outside this historical E07 review. No large rerun or new test framework was requested. Actual qualified signed service main/tag/digest/manifest/signature/assets and anonymous verification remain separate future proof; a package preview is not inferred to satisfy them.

Local/production, daemon isolation, DNS/TLS/UDP/mobile and SLA boundaries remain as previously recorded. P07 and new human card approval are not granted. No source, Git, Docker, runtime test, API or external mutation was performed by reviewer; only own new review/journal files were written.

COMPLETE_STOP after this packet. Later CI-policy and final release reviews require their own exact handoff.
