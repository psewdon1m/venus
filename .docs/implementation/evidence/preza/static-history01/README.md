# Targeted static history — prior rounds

Raw outputs retained, including failures. These are component/preflight receipts, not a full feature acceptance.

- Round01: clean e724073c, types exit2 and lint exit1/8 errors before corrections.
- Round02: working corrections, types/web/schema/i18n exit0;56 units55PASS/1FAIL; corrected HTTP409 expectation repeated3PASS. Root/UI focused lint repeats exit0. Dirty preflight, not clean stage proof.
- Round03: db10c91f clean same bytes as native-round01 inputs;56 units/types/lint/docs PASS. RESULT.json binds that baseline. Additional runner-lint-repeat.txt was a later working correction after native-round02; it is not part of that RESULT baseline.
- Round04: clean12f2956e implementation:56 units, types/lint/schema/i18n exit0. Native-round03 independently binds this candidate.
- Round05: root locale/scratch-control fixes; focused main/runner lint and web types exit0 before native-round04, which binds final31b4a57c application.

Current gate fixes and final clean static proof follow separately. Historical failures are not overwritten or relabelled PASS. No long P03 statistics or P07 aggregate run occurred.
