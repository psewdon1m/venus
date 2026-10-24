# Independent P06 Engineering/QA — approved signing-source rebind

Decision: **PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT**. Owner approval and configured signing environment are accepted for exact key `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb`. No new local blocker. **Full P06 remains HOLD for actual qualified service CI/main/tag/digest/signature/published/anonymous asset proof**. P07 and production deployment are not approved by this review.

## Exact current source and review boundary

Clean clone `C:/.projects/venus/.artifacts/p06-clean-source01`: HEAD `c9ecc8cd484b28d4c21705ebf08274807663883c`, core `a1c9947e6d8f29ebf8fe17bd1e5935ebc5448ad9769d2f2e0b598b785a01d072`/1944. All1944 inventory SHA256s independently match, no removals, clean git status observed. Current freeze INDEX `140db4413cfd8906cca1f395c6b10971705ce6de0e7f210f983b9c5dfaddb4ea`.

Exactly six source paths differ from accepted `92b7f9d9c5dd5caa6a0953f28ed8e984e04393ba` / core `fe51759f0c5c3c605b260c14121ae60ed12e7999783b9dcc1c6aa3a2ea8f876d`: AGENTS.md, current ADR index, release workflow and public trust modified; ADR032 and user-decisions.v5 added.1938 existing files are byte-identical. App/API/DB/operator code, release tools, tests, compose and Dockerfiles are unchanged. Exact before/after hashes are in SOURCE_REBIND.json.

Reviewer is a nonauthor and ran no tests/Docker/Git/remote mutations, read no private key or GitHub credential values, and wrote only own new review/journal. Old review/test packets remain immutable.

## Owner authority and safe signing receipts

U020/ADR032 records direct approval of this exact key, repository `psewdon1m/venus`, Environment `venus-release` and secret `VENUS_RELEASE_PRIVATE_KEY`. It waives no technical gate. v4 is preserved; v5 adds authority rather than rewriting history. Trust changes only owner_approved false→true; PEM and key_id are unchanged. Independently decoding the public SPKI and hashing DER reproduces the key_id.

signing-environment01 INDEX `2b308655d2db96e5e474487135557436fc999238da07f96763992cb78aff6e8a`: all6 listed hashes/sizes match. Final configuration receipt has required owner reviewer and one custom tag-only `venus-v*` policy. The safe producer receipt reports exact-key challenge verification, sealed-box encrypted upload HTTP201 and secret metadata; producer source asserts metadata GET200. These are inspected producer receipts/code, not secret operations reenacted by this reviewer. Earlier remote-read environment404 is retained historical preflight, not the final environment result. Configuration receipts are bound to exact approved public identity; they are not labeled as a Git test run.

The modified workflow still verifies exact qualified tag/main, existing quality/P06 tests, source-bound two-review/all118 gate, immutable image and exact-image install before signing. Pre-sign input changes to acceptance02. Pinned upload-artifact step allows only designated public drill/release/candidate/image/download output paths; private signing PEM remains RUNNER_TEMP with trap deletion and secret value scoped to signing step. Candidate JSON exposes a file path, not key bytes. No new consumer/operator privilege or arbitrary executable/path input is introduced.

## Evidence provenance and targeted checks

Current service-preflight01 INDEX `7c84be43204aa5a9637b188bbea2f89ac8f3880e668d503d3078300a046428f1`: all4 raw file hashes/sizes match. Raw Linux Docker unit10:28 PASS/0 FAIL/0 SKIP, exit0 on current clean source. Docs03:1914 Markdown,0 errors, exit0. No source edits occurred after this freeze per handoff; current exact source independently matched.

Prior quality03 INDEX `9f63c38ee28ded5ab322f38778af9027a579509603a9cd4925e0c8d4eee25d2f`, actual09 INDEX `44614021cb6183da9b9b1c2bd2d4526b0742113e6b15b28006662d5d6398ff0b`, recovery-measurements01 INDEX `0bd6dcce4ec528a9ed407fe58eb3e8cf80dddfd9504017ef9167bd8fc19bcc04` and Engineering round05 INDEX `7b1517a7f029ac89cebb39bc2f8d1f82e2193a2e45b2522e5e98c1e6115d44e9` are unchanged and verified by hash. They remain executions/review on92b7f9/corefe517, accepted for unchanged exercised runtime components through the explicit six-path compatibility audit. They are not called new runs on c9ecc8cd. New docs/workflow/trust approval receive this separate source review and current targeted unit/docs proof. No broad P05 corpus/UI rerun is needed for this delta.

## Eight gates and all118

| Gate | Current pre-sign conclusion |
| --- | --- |
| RELEASE | PASS for approved trust/configuration and reviewed gated workflow; actual real qualified service CI/main/tag/OCI/signature/published assets remain pending. |
| INSTALL | PASS by unchanged exact app/PG/operator/template pins and accepted actual09 clean install/UID/reader/no-mutation negatives; targeted units repeat on current source. |
| SCOPE | PASS:118 unique historical IDs/check IDs/row hashes preserved;67 local PASS,34 narrow external N_A,7 final-artifact pending,10 production deferred. No generic ACL/data/restore waiver. |
| BACKUP | PASS by unchanged quiesced complete PG/framed host-file implementation and accepted actual decrypt/count/integrity restore proof. |
| UPDATE-ACL | PASS by unchanged narrow identity/Host/Origin/UDS implementation and actual native502/reload/reauth, single job/apply proof. |
| FAULTS | PASS by unchanged durable journal, offline A removal/load, migration/health/pull/permissions and nine SIGKILL proof; original causes and outcomes remain separate. |
| MONOTONIC | PASS by unchanged protected ledger/private lifecycle replay, old-backup/new-ledger, missing/regressed authority and no-auto-restore proof. |
| RECOVERY | PASS local measured profile only: unchanged six-count/zero unexpected loss proof and explicitly labeled UTC event intervals; no SLA or external backup-copy claim. |

DECISION.json rebinds all118 to current source while retaining the original historical rows and evidence provenance. Only BST03 changes pending→PASS because approval and independent pinned anchor/configuration are now proved. Remaining pending IDs are REL03/04/05/06/07/09 and TRUST06; no actual published service bytes are invented. All ten production-only effective systemd/network checks remain DEFERRED_PRODUCTION_NOT_LOCAL_PASS. N_A remains limited to named absent external components.

E01–E06 retain accepted closures; no runtime byte changed here. Prior measured recovery event intervals2.578–8.792s and backup age at terminal3.498–36.311s remain the old actual09 single-host wall-clock measurements, not new observations or engine stopwatch/SLA. Policy-driven preference purge and deliberate post-backup external write loss remain separately recorded.

## Remaining release phase and stop

This is a fresh source-bound pre-sign review, not full stage PASS or proof that CI has signed/published anything. Future final audit must bind actual main/tag to service source, one real OCI/config digest, exact canonical manifest/signature/bundle, protected-environment execution and anonymous published-byte smoke. Any further core change needs an exact rebind; derived review/evidence/manifest changes alone stay outside core.

Production DNS/TLS/UDP/mobile, dedicated/rootless daemon isolation, effective production systemd deployment, external backup copy and SLA remain unclaimed. P07 is excluded. Original450 HOLD/current470 temporary pilot card approval remains unchanged; no new human content/legal/language approval.

COMPLETE_STOP after final INDEX publication; no additional source/runtime/test writes. Orchestrator may produce derived manifest/pre-sign acceptance only after both independent reviewers stop.
