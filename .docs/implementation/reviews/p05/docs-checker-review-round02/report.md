# P05 prospective documentation checker · independent round02

**PROSPECTIVE_COMPONENT_PASS ONLY. P05-DOCS-001 CLOSED for the exact candidate02 helper.** No integrated-source, manifest, full quality or full P05 acceptance is asserted. Reviewer `/root/p04_gate_preflight` did not author the correction; old round01 CHANGES_REQUESTED and its actual failing counterexample remain unchanged.

Candidate02 descriptor index SHA `e4ca0e88247e1aff821aa5e4caaa80df4c23f48961fb516f3b29c547d5e17da4`; HANDOFF `2571790904c842740767a16128b4225fdccf3b2e885d4e31839ce0d97aeb2b86`; helper `4d4eb6ff0d2f7be37f2a5fef6194f06fa238af92d473d31d1f6a849cf5ecd5e5`. Checker remains byte-identical to candidate01, SHA `dcc25a4a2020bee8378154992bb8d05e1f966b07e4e3efbb9b03325028aa832a`; all eight raw path/size/hash/codec/origin records remain identical. Every candidate indexed descriptor, durable copy and actual capture raw byte pin was checked independently again.

The helper now checks each registered path component from the final file to the trusted root: symlink or Windows junction denies; regular-file/directory expectations deny missing/nonregular ancestors before capture bytes are accepted. This closes the demonstrated source-walk omission without broadening codecs or excluding historical documents from validation. The root itself remains the caller's explicitly trusted root.

Independent executions against candidate02:

- All seven author tests rerun with the declared original repository root:7PASS.
- All38 prior independent controls rerun unchanged in meaning, including the real ancestor-directory symlink:38PASS. Every missing/tampered/same-size/final-file symlink, unknown bad UTF8, current broken link, root escape and explicit escaped-origin validator-constant mutation still rejects.
- **Actual Windows ancestor junction**, created with `_winapi.CreateJunction` inside an owned temporary tree: identified by `is_junction()==true` and `is_symlink()==false`, rejected by the prospective full checker. This is not a simulated junction.
- After replacing the link with the original regular ancestor directory, the positive checker fixture passes. Total independent controls: **40PASS/0FAIL**.
- Candidate checker prospectively executed over actual current repository under the original checker `__file__`/root context:exit0. Raw output is [prospective-actual-root.txt](prospective-actual-root.txt). It is prospective code execution only; the real included `tools/check_docs.py` was not replaced or claimed green.

[probe.py](probe.py), [probes.json](probes.json), [candidate-diff.txt](candidate-diff.txt) and [author-tests-independent-rerun.txt](author-tests-independent-rerun.txt) preserve exact operations and results. The origin-escape control mutates a trusted validator constant explicitly; no untrusted runtime origin-input API is invented. Normal current Markdown remains strict UTF8, every registered historical capture remains pinned, and normal link/root-escape/asset/snapshot checks are retained.

Included identity before/after remains `ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571` /1811. All changes were to this excluded review directory, owned temporary fixtures and the reviewer's own journal. No historical capture, included source/test/validator, foreign report, registry or FILE_MANIFEST changed. No Docker, product request, statistical run, human approval or later-stage work occurred.

Root owns integration into a new included-source identity, complete tests/negative controls/docs/manifest checks and renewed source-bound gate acceptance. Candidate PASS must not be transferred automatically to changed integrated bytes.
