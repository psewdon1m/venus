# Native storage test recovery oracle correction

AUTHOR COMPLETE, TEST ONLY; independent review and new-image native rerun pending.

Root Linux runner03 on immutable A12 cd96a063/1862 and image ffafc290 completed218 PASS/1FAIL/2platformSKIP. Lifecycle141 PASS/1SKIP, portable10 PASS; sole ledger failure is generic fsync case expecting empty while actual authenticated recovery returns music. Raw receipt/log preserved byte-for-byte. Earlier runner01/02 infrastructure attempts remain root evidence; no historical FAIL overwritten.

Before the parent fix, the first sync failure was temporary lock directory fsync, before append. After removal, it is the real chain data fsync after a complete successful write. Narrow still throws and never acknowledges success. Reopen authenticates the complete frame, repairs durability/witness and must retain the stricter exclusion. ENOSPC throws before write, remains empty. Short-write remains corrupt and rejected without repair. Rename still retains the valid append. Existing ordinal1..4 data barrier tests and actual SIGKILL after-append already independently observed that same recovery behavior and passed in root runner03.

Only that generic expected-value expression changes, plus two explanatory comment lines and additive revision02. Both production module hashes remain exact A12, as do all other source paths. No durability or lock fence changes. Host36 PASS/185 LinuxSKIP; changed-test lint0. This cannot prove the changed Linux expectation passes: root must run the same three native suites on the rebuilt exact test image. No native or Docker run by this author, no latency/improvement claim. Full current source identity is in HANDOFF; root coordinates freeze/materialization.
