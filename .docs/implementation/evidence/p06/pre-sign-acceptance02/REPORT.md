# P06 — owner-approved signing pre-sign acceptance02

**PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT** на source identity `a1c9947e6d8f29ebf8fe17bd1e5935ebc5448ad9769d2f2e0b598b785a01d072`, 1944 файла; clean исходная ревизия `c9ecc8cd484b28d4c21705ebf08274807663883c`. Поздние closing metadata исключены из implementation identity; это не новый запуск прежних тестов.

U-020/ADR-032 подтверждает точный Ed25519 public key `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb` и GitHub environment secret. Private part остаётся вне Git/image/логов, передана LibSodium sealed box; HTTP upload201 и metadataGET200 сохранены. Environment требует owner review и допускает только tags `venus-v*`. Реальная эффективность ключа в signing runner подтверждается позднейшим выпуском, не одним secret metadata.

Два независимых nonauthor review — Engineering/QA и Security — PASS_PRE_SIGN, открытых локальных замечаний нет. Шесть source delta: четыре изменения AGENTS/current ADR index/public trust/release workflow, два новых ADR032/user-decisionsv5. Runtime/API/DB/operator/tools/tests/Docker/compose не менялись. В workflow добавлены новая pre-sign02 revision и public-only artifact export, без RUNNER_TEMP и private key.

Профильные Linux Docker unit10:28PASS/0FAIL/0SKIP,1CPU512MiB; docs03:1914Markdown0errors. Старые quality03(1315JS+124Python)/actual09(18checks,9SIGKILL,fullPGrestore,ledger replay) сохраняют прежние Git92b7f9/corefe517. Они применены только к побайтно неизменным компонентам через отдельный независимый SOURCE_REBIND; не объявлены новым RUN на approved-source.

Все118 ID:67PASS,34narrowN_A,7pending final signed artifacts,10production deferred. BST-03 подтверждён реальным одобренным anchor. Публичные assets, exact OCI/signature, main/tag/CI и anonymous GHCR pull ещё не исполнены; полный EXIT-P06 HOLD до фактических receipts. Production/DNS/TLS/устройства и P07 не принимаются. Protected deletion/withdrawal history при совместимом восстановлении не откатывается. Исторический pre-sign01 не переписан.

[Решение и точные pins](DECISION.json) · [Engineering](../../../reviews/p06/engineering-signing-round01/REPORT.md) · [Security](../../../reviews/p06/security-signing-round01/REPORT.md) · [Targeted tests](../service-preflight01/INDEX.json) · [Environment](../signing-environment01/INDEX.json).
