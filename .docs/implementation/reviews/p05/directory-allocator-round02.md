# Directory allocator — independent review, round 02

Verdict: **PREFLIGHT_COMPONENT_PASS**. **DIRECTORY-001 is closed for the exact corrected component bytes below.** Reviewer `/root/p05_targeted_review` made no included edits. The [round 01 CHANGES_REQUESTED report](directory-allocator-round01.md), its source snapshots and raw failing regression remain unchanged.

## Correction and verification

`withRoots` now reopens every root through `openRoot` after the operation and before successful return. This repeats ancestor no-symlink checks, required root UID/mode checks, and retained device/inode checks while the original anchored descriptors remain open. Newly opened check descriptors are closed even on failure. The author suite adds the late-ancestor real-filesystem regression.

The original **24 independent controls were copied byte for byte**, SHA256 `7838f28515b421fae6fc0001f8577b5ed04837fee72a7a88245befcfbb892d58`, and all now pass. The exact regression that failed in round 01 now denies the introduced ancestor symlink. Two additional independent controls introduce a root chmod to mode0755 or an ancestor symlink during a child fsync; final publication is denied without repairing permissions, reinitializing partial state, or following a different root for writes.

Actual Linux result: **26 independent PASS + 15 author PASS / 1 Windows-only SKIP**, combined exit **0**. Focused ESLint exits **0**. The inherited controls still cover all ten injected fsync failures, conservative nonreuse of partial births, exclusive anchored mkdir, O_NOFOLLOW on child swaps, inode replacement, aliases, ownership/mode denial and no implicit read initialization.

## Exact inputs

| Input | SHA256 |
| --- | --- |
| `topic-room-directories.ts` | `91ff6dc131409e74746ffad6fccc5af895fd20563ecf4181559591d8ef9b7af9` |
| `topic-room-directories.test.ts` | `62b894dca66fe05c739a7d6504d6d330f911d11435d642b0b3ad3162357b1c05` |
| `security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

Three source files were copied before the run. Their hashes match the current paused source and the author's new Linux checkpoint. Old review report hashes were independently checked unchanged.

The independent run used pinned image `sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472`, UID1000, network none, read-only rootfs, dropped capabilities, no-new-privileges, 1 CPU and 768 MiB. Container inspection confirms exit0 and those restrictions. Ownership-checked removal and fresh label queries confirm both this reviewer container and the author's new checkpoint container are absent. Source mounts were read-only. Author checkpoint receipts/inspection/raw output were copied into the durable review packet separately from the root's future archive.

No open component finding. This accepts the observed substitution/fault controls under the protected-root/operator preconditions. It does not prove atomic namespace control against an arbitrary host administrator or continuing filesystem mutation, actual power-loss/SIGKILL durability, operator root provisioning, PostgreSQL registry integration, independent rollback domains, full backup restore, production deployment, full P05 acceptance or content approval. Owner content450 remains **HOLD**.

Evidence: [raw Linux result](../../evidence/p05/directory-allocator-review-02/tests-01.txt), [input and cleanup verification](../../evidence/p05/directory-allocator-review-02/input-verification.json), [runner](../../evidence/p05/directory-allocator-review-02/runner.ps1). Machine report: [JSON](directory-allocator-round02.json).
