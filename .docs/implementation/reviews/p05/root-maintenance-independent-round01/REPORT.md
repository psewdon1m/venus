# Root maintenance — independent review

Verdict: **PASS_MAINTENANCE_ONLY**. No implementation or stage acceptance follows. Both bounded operations were independently checked on 2026-10-20 UTC; reviewer performed only four exact-owner readonly Docker inventory queries per control invocation, own temporary negative fixtures and reads. No cleanup/mutation, new container, start, product/tooling edit or captured README rewrite was performed.

## A. OCI04 FAIL preservation and exact-owner cleanup

Actual archive INDEX `37e937593908062706da60b8ca312765699f4433c28672c612cb8b2dec1413fe` and all158 children verify. All150 original host files (1916313 logical bytes) match both the durable run mirror and the still-retained original prefix. Its Markdown capture `.bytes` mapping preserves original bytes. Real restored source1274/1813 is unchanged. runner.json remains absent; actual functional FAIL is not synthesized into PASS.

Cleanup01 INDEX `76659391447d6c685c4f231cdd4dd82e9d9965d59eaccfd8628f3b93f3ed84fa` and all3 children verify. It failed at strict Mounts-array comparison after six readonly commands, **before any mutation**. Historical REPORT.md contains generic completed-action cleanup wording; its actual FAIL record/command trace is authoritative, and this report explicitly qualifies that no keeper stop or deletion occurred in01. Historical bytes were not edited.

Cleanup02 INDEX `888f7c5a59e591f5c3f02b29922c65c97da54c82fc4ec008ba3853713ec02302` and all3 children verify. Its source differs from01 only in operation/output names and sorting Mounts by Destination before comparing complete mount dictionaries. Every other field and ownership/image/name/role/state/volume-option condition remains enforced. A finite control accepts permutation alone and rejects an RW-field change. Raw failed01 inspect responses were not archived, so this reviewer does not reconstruct their exact array ordering; the corrected02 comparison and successful trace are verified directly.

All42 commands exited0 and match the independent diagnosis/f112 cleanup allowlist. The only nine mutations were the bounded5-second stop of the exact keeper ID, removal of the four verified container IDs, three exact tmpfs volume names and one exact network ID. There was no start, create, exec, global prune, other-owner operation or host-prefix deletion. Before each mutation the script checks the matching owner/name/image or full local/tmpfs options and absence of attachments. The final four recorded inventory outputs are empty. Fresh independent queries also confirm empty exact-owner container, volume, network and separately labeled resource-probe inventories.

The ephemeral native state has been destroyed according to the plan; no private DB/keyring/password data was exported. All host failure bytes stay unchanged. This is cleanup PASS only: OCI04 remains a failed partial A1 attempt, not14-control acceptance.

## B. Twelfth exact archived Markdown record

Relative to accepted review66391dc1, tools/archived_markdown.py adds precisely one record: `.docs/implementation/reviews/p05/oci-rollback-operational-rebind-author-round03/producer/README-resume01.md`. Its original4151 bytes and SHA `04490dd8f0f637247893af05132bc032a2338453e6e1dff7e182bfbc75084e51` are intact; declared encoding is cp1252 and link base remains its own producer directory. Previous11 records and both reader/checker function ASTs are unchanged. The existing test file changes only its expected count11→12; the module documentation reflects the new count.

Independent temporary controls confirm same-size corruption fails the exact hash pin, unknown nonUTF8 still raises UnicodeDecodeError, and deleting just the newly declared capture produces exactly its missing-record error when the other11 are present. All12 actual captures validate. The existing seven archive tests pass, including symlink/junction path protection. No new production tests or fallback encoding policy was implemented.

Commands, final exit0:

- `.venv/Scripts/python.exe -B .docs/implementation/reviews/p05/root-maintenance-independent-round01/controls.py` — indexes/host/source/cleanup trace/fresh inventories and encoding negatives.
- `.venv/Scripts/python.exe -B -m unittest discover -s tools -p test_archived_markdown.py` — seven existing tests PASS.

There were no own failed control attempts. Full documentation checking was not repeated by this bounded review; root's evolving live-doc count is separate. The live tool change is not part of restored historical1274 proof and does not establish a clean current-source stage. Content HOLD, statistical/runtime prerequisites, production and final P05 acceptance remain open.
