# P05 prospective documentation checker · independent round01

**CHANGES_REQUESTED — CANDIDATE ONLY.** No integrated source acceptance or full P05 PASS. Reviewer `/root/p04_gate_preflight` did not author the candidate. Included source remains frozen at identity `ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571` /1811 files.

## Exact candidate and preserved historical bytes

Candidate descriptor index SHA256 `e0adf36ce172ed60abe68107032070181eee5e53b92fa50dd2a555da23dbe216`; HANDOFF `a06078073d1450198686d8924b17c9fb21b35980e742ddeea2f14b6fe3b2a13e`. I verified every indexed byte length/hash and equality of the actual excluded candidate files to their durable copies. Helper SHA `3c024a18ca142726558f4af2b856b789e90d9589a8b1c99dabd6a80e7794fac8`; checker SHA `dcc25a4a2020bee8378154992bb8d05e1f966b07e4e3efbb9b03325028aa832a`. The current included checker remains `1e394deda73045a720c4cdf1864e2a918e0ae693dee82a59df648297fd82ce0d`.

The exact eight path/size/hash/encoding/origin records match the candidate JSON and all eight captured raw files. Two CP1252 records preserve identical7550-byte originals with SHA `f62ac8532ac0e84099665e35740ab1bde6c1dc9726ebf4ea1844fb330294edb6`; there is no fallback for arbitrary current/evidence Markdown. Six flattened UTF8 captured sources retain declared original relative-link bases. No original capture, old FAIL, source copy, journal or included file was rewritten.

The [exact checker diff](candidate-diff.txt) retains normal required-file/asset/snapshot/link/root-escape checks and adds the reader plus explicit archive inventory. It does not blanket-skip review/evidence trees. The pre-existing normative source-snapshot exception remains separate and unchanged.

## P05-DOCS-001 · P2 · ancestor symlink silently removes registered documents from link validation

Location: candidate `archived_markdown.py`, `archive_errors()` checks only `path.is_symlink()` for the final file; candidate `check_docs.py` enumerates Markdown with existing `source_inventory.source_files()`, whose `os.walk` does not follow directory symlinks.

Independent reproduction used only owned disposable fixture files and a **real directory symlink**. With all eight raw byte pins unchanged, replace the parent `topic-measurement-design-review-round01/source` directory with a symlink to the same captured files in an owned sibling directory. The helper returns `archive_errors == []`. Four registered Markdown files disappear from the source walk, so their links/root escapes are not checked at all. The prospective full checker returns exit0/0errors. This violates the explicit archive-inventory/symlink and retained-link-validation boundary; it is not merely a mocked reader result.

The exact counterexample is `ACTUAL-ANCESTOR-DIRECTORY-SYMLINK` in [probes.json](probes.json). The new negative expects rejection and **fails** against this candidate. Its reproduction is in [probe.py](probe.py). Windows file and directory symlink creation actually succeeded; no unavailable-platform substitution is claimed.

Required correction: reject symlink/junction/reparse ancestors for each registered capture, through the intended trusted root, before accepting the capture; ensure registered documents cannot disappear from effective link validation. Preserve all exact byte pins, strict normal UTF8 and existing link/root-escape checks. Add an actual ancestor-directory symlink negative; consider the equivalent Windows junction boundary explicitly. No candidate fix was authored by this reviewer.

## Executed checks and scope

- Independently reran all six author tests against candidate bytes with the original repository `__file__` context:6PASS.
- Executed candidate prospectively over the actual repository using the original checker root/filename context: exit0. This is recorded in [prospective-actual-root.txt](prospective-actual-root.txt), **not** an actual integrated-source checker PASS.
- Constructed an isolated positive checker fixture satisfying unchanged required asset/snapshot counts, then ran38 independent controls: **37PASS /1FAIL**. All eight missing-capture, eight changed-valid-UTF8, eight same-size corruption and eight actual final-file symlink controls reject. Undeclared bad UTF8, a current broken link, a current root escape and an explicit escaped-origin validator-constant mutation reject. The positive fixture passes. Only the actual ancestor-directory symlink is incorrectly accepted.
- The wrong-origin control explicitly mutates the candidate's trusted constant to exercise root-escape checks; it is not claimed to be a real untrusted runtime metadata interface. Input origin records are source-reviewed constants, not authenticated by their own mutable values.

No Docker, network/product request or production/test/validator integration was performed. The included inventory was unchanged before/after. Parent owns the candidate correction, renewed independent review and any later integrated-source freeze/testing. The old raw2codec/54broken-source-copy diagnostics remain preserved; this report does not relabel them.
