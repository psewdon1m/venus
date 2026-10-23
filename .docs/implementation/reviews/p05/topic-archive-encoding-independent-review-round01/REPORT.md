# Exact archived Markdown encoding records — independent review

Verdict: **PASS_TOOLING_ONLY**, 2026-10-20 UTC. No actionable findings. Reviewer did not author the tooling change. Historical captured README bytes were read, never rewritten.

The implementation adds precisely two existing 4151-byte captures to the exact archive table: `oci-rollback-author-resume-round01/producer/README.md` and `oci-rollback-author-resume-round02/producer/README-resume01.md`, under the P05 review directory. Both have SHA256 `04490dd8f0f637247893af05132bc032a2338453e6e1dff7e182bfbc75084e51`, fail strict UTF-8 decoding, and decode through the declared cp1252 encoding. Each keeps its own directory as link base (`origin: null`).

Against the restored historical tooling, previous nine archive records are unchanged. The `read_markdown` and `archive_errors` function ASTs are identical; path/symlink/junction checks, exact size/hash enforcement, strict UTF-8 for unknown files, missing-capture errors and link bases retain their original behavior. The author test file differs only by expected archive count 9 → 11. Module documentation updates accurately describe eleven records, four cp1252 documents and seven source copies. No link-validation bypass or wildcard fallback was added.

Independent controls: **13 PASS**, exit 0. These cover exact additions and prior records, unchanged reader/checker functions and count-only test delta, both real captures and link bases, same-size corruption, valid UTF-8 replacement, deletion, unknown non-UTF8 rejection, and all eleven real captures. Repeated author suite: **7 tests PASS**, exit 0, including the actual ancestor-directory symlink rejection test. Full docs checker also passes; output and exact tool hashes are frozen in this packet.

Commands:

- `.venv/Scripts/python.exe -B .docs/implementation/reviews/p05/topic-archive-encoding-independent-review-round01/controls.py`
- `.venv/Scripts/python.exe -B -m unittest discover -s tools -p test_archived_markdown.py`
- `.venv/Scripts/python.exe -B tools/check_docs.py`

This accepts only the live documentation tooling fix. The earlier root docs-check failure and initial hardcoded-count test failure remain historical facts. The live source now includes these two changed tool files in addition to concurrent content work; it must not be represented as unchanged historical1274 source. The separately restored 1813-file historical snapshot and its operational review are unaffected. This is no functional, browser-matrix, card-approval or stage PASS.
