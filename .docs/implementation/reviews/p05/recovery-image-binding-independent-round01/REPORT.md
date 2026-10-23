# Rebuilt historical A/B image bindings — independent actual PASS

**PASS_EXACT_REBUILT_HISTORICAL_IMAGE_BINDING_NOT_CURRENT_STAGE.** Independent read-only Docker probes confirm that new A/B images contain the exact expected historical source/compiled/UI/migration bytes. This is image rebinding evidence for restored source1274 and13b; it does not certify the evolving live P04-r3 tree, functional tests or fullP05.

| Role | New actual image | Historical source |
|---|---|---|
| A |sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f |1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad |
| B |sha256:b6f49831e1ca16dafdcd45707144f050f4e302d4709a51d59f9981ce7b67ed6b |13b24714f3dd2d6e2ea08e911042defb4ce0161b956a9bcc74af533d3795120e |

Root receipts A SHA256 `eb994713042617b6e9bcc567062e502b18e5330b54759ee85b33ab1459ae0f7c` and B `eead495908593a27644d096cb94df8cc54e7db2e722e9fdd26178eddcf9c5b77` verify unchanged. Build-log byte hashes match their receipts. Builds/PG pull were performed by root, not this reviewer. Both restored1813-file inventories equal their original archive maps before/after; all64 copied host compiled pins match. B context preparation was separately repeated by root, preserving author/acceptor separation for the restore.

Each image was probed independently through a fresh owner-labelled container with no network/ports, explicit IPCnone, read-only root, no mounts, unprivileged user1000, all capabilities dropped, no-new-privileges,1CPU/256MiB and a bounded capture. The probe computed **81 union hashes per image**: all73 receipt source/compiled/frontend pins plus all74 expanded OCI compiled/UI/migration pins, deduplicating identical overlaps. Every expected byte hash matched. Actual Node/Playwright/OS values and production metadata absence are captured in [actual-image-review.json](actual-image-review.json); metadata absence is not a fabricated production version claim.

Both actual container exits were0. The reviewer immediately rechecked owner/name/image before deletion and confirmed an empty exact owner inventory. Two probe containers were removed; no volume/network was created. The PG pinned repository reference was independently inspected and its RepoDigest64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8 confirmed. No build/pull, application start, PG initialization, resource exhaustion, R100 or OCI switch was executed by this review.

An initial reviewer script had a Python ternary whitespace parse error before any Docker action. Its exact failed bytes are retained. After correction, AST parse and actual probe exited0. This was a reviewer harness issue, not an image/source finding.

The old ff371/5e304 proof histories and failed attempts remain bound to their original image IDs. New operational revisions must explicitly bind these new image IDs, receipts, source contexts, producer/fixture/helper pins and separate root ACKs. A historical source byte match does not prove identical whole native environment or current-source behavior. Next work is bounded resource feasibility under new A, then independently reviewed new operational bindings and applicable tests; human470 HOLD/fullP05 remain open.
