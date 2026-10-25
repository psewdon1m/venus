# Independent engineering review07 — locale button busy state

Verdict: SOURCE_ONLY_ACCEPTED. Narrow readonly review of the single JSX disabled={busy} addition to language buttons. Current exactCRLF main.tsx SHA25657a1db353f6881615200e494766eb9dc6aafaf4cd98b6d6742f7fe264effd1e9; base4b050047c1285af9734f8eb5294930f21d69bfe2. No other implementation change in this review. Prior sealed reviews remain intact.

The existing perform action sets busy before awaiting its action and clears it in finally. The new native disabled property prevents pointer/keyboard activation of each language button while that existing flag is true. Thus a subsequent ordinary user or Playwright click cannot start another locale action before the previous busy state clears. It preserves control semantics, visible errors, native disabled behavior and eventual re-enablement on both success and failure. Outside-room locale selection stays local and unchanged.

The existing maximum2CAS attempts, definite-conflict-only revision/key refresh, transport exact-key replay, final-conflict visibility and manualRetry refresh-only behavior are unchanged. This is control-level serialization under the existing busy flag, not a claim of a new application-wide mutex or serialization of all module writes. No ACL, authority, deadline, assertion or test-wait relaxation was introduced.

Readonly preflight10 report still FAIL with actual setLocale waitForFunction timeout and runtimecleanup completed. Earlier first7records PASS are retained. Source demonstrates the previously enabled concurrent activation path; without runtime timing this report does not assert that it uniquely caused that failed run. The next clean combined preflight/mobile matrix remains mandatory. Root reports scoped lint0. The reviewer ran no tests, Docker or expensive operations and changed only own journal/report/input files.

SOURCE_ONLY_ACCEPTED is not P07/mobile runtime PASS. No additional implementation or test changes requested by reviewer.
