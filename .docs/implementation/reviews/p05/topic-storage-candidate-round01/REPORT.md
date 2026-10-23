# Scoped storage availability candidate01 — independent review

**CHANGES_REQUESTED_DOMAINERROR_PRECEDENCE.** Candidate01 is narrow and79 prospective tests independently pass, but one stated error-preservation contract is incomplete.

## STORAGE-CANDIDATE-R01-DOMAIN_PRECEDENCE — P2

topicStorage checks native errno/syscall fields before explicitly preserving DomainError. Exact counterexample: Object.assign(new DomainError('ENOENT',409),{syscall:'open'}) becomes a new503 instead of the same409 object. This is a contract edge, not an observed endpoint exploit. Put the DomainError identity guard first and add this regression; do not weaken native-error503 or unknown-error behavior.

Eight other own helper controls pass. Finite source comparison confirms only seven synchronous storage-call wrappers; after unwrapping them and normalizing CRLF/LF, the existing class is unchanged. SQL/auth/enqueue/revoke remain outside classification. Raw SyntaxError, TypeError and nonfilesystem syscalls remain unmapped; no blanket corruption or other-endpoint fix is claimed. All113 actual-trigger hashes and candidate/sourceef009 pins were verified before/after.

The own VM initially had an Error-realm mismatch, and a finite text check initially compared CRLF toLF; both failed attempts and corrections are retained. No product/candidate edits, integration or functional Docker/restore run occurred. Preserve candidate01, repeat review on corrected exact bytes, then new source/build/actual503 restore proof. Full P05/human450 remain separate.
