# Directory allocator — independent review, round 01

Verdict: **CHANGES_REQUESTED**. Reviewer `/root/p05_targeted_review` made no included source edits. This is a Linux filesystem component review of frozen snapshots, not a P05 stage gate.

## DIRECTORY-001 — late ancestor symlink is accepted (P2)

`openRoot` checks each ancestor before opening a root. After the operation, `withRoots` checks only `lstat(root.path)` and the root inode identity. An ancestor can change after the last root's ancestor check while the leaf roots retain their original identities.

The independent Linux reproducer intercepts the actual `openSync` for the fifth root after its ancestor traversal. It renames the common directory to `.old` and creates a symlink at the old common path pointing to that original tree. The real root directories retain their original device/inode values. **`provision(room)` returns successfully instead of denying the symlinked namespace.** The failing assertion is in [the independent test](../../evidence/p05/directory-allocator-review-01/independent.test.ts), final test, lines 112–116; raw [FAIL output](../../evidence/p05/directory-allocator-review-01/tests-01.txt) is retained.

The mocked boundary changes only the timing of real Linux rename/symlink system calls immediately before the real open. It does not return forged stat data or replace the implementation. Anchored writes remain inside the original opened roots; **no write to a foreign root and no data disclosure was demonstrated**. The defect is successful acceptance of a namespace that violates the promised no-symlink invariant.

Required correction: before successful return, revalidate every ancestor's no-symlink condition and the required root ownership, permissions and identity. Preserve anchored operations, failure on changed roots, and denial of reuse after any partial birth. Add the late-ancestor case to author regressions, then rerun Linux tests and obtain a fresh independent review against the corrected bytes.

## Inputs and evidence

| Exact input | SHA256 |
| --- | --- |
| `topic-room-directories.ts` | `5ebf06da8e9c882d60ef8d54ae6ea783bc841f50a1e2b69f14b4a608aac9ab81` |
| `topic-room-directories.test.ts` | `100cfcd0012688a35ddcd9a165e99c2022ae34a3191f23c6b00de3e2ca911307` |
| `security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

All three files were copied before the run and remain equal to the tested author snapshots. The author evidence index SHA256 is `ed9aa6819cc806d3039fe8eaf523ac110e830719c4ca6005257ae4868cdf482d`; all **35 indexed artifacts** were verified. Two retained startup/cache failures precede the final author 14 PASS / 1 Windows-only SKIP. Fresh Docker label queries independently confirm all three author containers are absent; the missing original empty-pipeline `remaining.txt` is not treated as an original proof file.

The independent run used exact image `sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472`, Linux UID 1000, read-only root filesystem, network none, all capabilities dropped, no-new-privileges, 1 CPU and 768 MiB. Its unique container was inspected, removed after ownership verification, and its fresh label query returned no containers.

Results: **23 independent PASS / 1 FAIL**, plus **14 author PASS / 1 Windows-only SKIP**, combined process exit **1**. Successful controls cover no implicit read initialization, frozen paths, all destination preflight, missing operator parents, normalized aliases, existing partial files/directories/dangling symlinks, root deletion/replacement, unsafe ownership/modes, restrictive umask, exact child-then-parent fsync order, exclusive mkdir races, O_NOFOLLOW on a child swap, and anchored writes on a root replacement.

All **10 fsync boundaries** were separately fault-injected with EIO against the actual Linux filesystem. Each failed birth leaves a conservative partial set and a retry is denied. These are deterministic syscall fault injections; they do not prove power-loss durability or a SIGKILL crash/restore scenario.

No PostgreSQL registry integration, host root provisioning, independent rollback domain, backup restore, full source freeze, production deployment or stage acceptance is proved. Content450 HOLD remains unchanged.

Machine report: [JSON](directory-allocator-round01.json). Evidence: [input verification](../../evidence/p05/directory-allocator-review-01/input-verification.json), [runner](../../evidence/p05/directory-allocator-review-01/runner.ps1), [container inspection](../../evidence/p05/directory-allocator-review-01/inspect-01.json).
