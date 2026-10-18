# EXIT-P01 · независимая проверка evidence · round 1

Статус: **FAIL**. Reviewer: `/root/p01_evidence_review`. Source SHA: `deaac55e693db7f27de2c7645e9bdb8aa1675ba5`. Source identity SHA256: `b06bcddb65f86955b01e1a965d57df0c5f0efe86502c0dbada60c2a73bec5cac`. Scope: evidence, traceability, CI trust, rollback. Код не изменялся.

Реальные доказательства просмотрены: PR run39143589394, exact SHA `deaac55e693db7f27de2c7645e9bdb8aa1675ba5`, оба job success; job.run_id/head_sha действительно совпадают. Локальный clean container report содержит семь PASS и image `sha256:465f6c25a18e2d3391b5ad8d205ec72027637f2d04f9ca0af6bb389a5ecbd314`. Live GitHub API подтвердил защиту main: strict required quality/container-smoke, enforce_admins, PR, запрет force/deletion, conversation resolution. На момент проверки app_id required checks был null; root уже сообщил о закреплении15368.

Выполнены семь Python regression tests `test_p01*.py`: PASS. Исторический P00 archive pinned SHA256, bytes и нормативные inputs защищены; unsafe member/digest/drift отвергаются. Developer guide содержит exact toolchain/commands, изоляцию среды, честный local image ID и откат через revert PR без снятия защиты. Ordinary CI только contents:read, pinned actions, persist-credentials=false, нет privileged PR event/signing/release workflow.

## Открытые замечания

1. **EV-P01-01 (P1):** gate принимает jobs от другого CI run/source: в положительной fixture всем jobs установлены run_id9/head_sha40×c, `validate` вернул `[]`. Проверка имён и conclusion недостаточна; required status checks сейчас также допускают произвольного publisher. Нужны exact run/source/repository/app bindings и отрицательные тесты.
2. **EV-P01-02 (P2):** health receipt с compose_sha25664×0 и любым корректно оформленным image_id принимается (`validate == []`). Rendered Compose/logs не входят в обязательные descriptors gate. Необходимо проверить compose hash и зафиксировать связи health → image inspect/version → image ID и сопутствующие файлы.
3. **EV-P01-03 (P2):** negative receipt принимает source_before=source_after=arbitrary (`validate == []`), а генератор не отклоняет dirty tree. Одного Git HEAD недостаточно, чтобы доказать, что тестировались именно его bytes. Нужна сравнимая inventory identity/clean-source proof в receipt с отрицательными тестами несовпадения.

Все три воспроизведения выполнены в TemporaryDirectory через существующую `test_p01_gate.P01EvidenceTests.fixture`; текущие source files не менялись. Исправления выполняет root; после них нужны новый exact source SHA, тесты и повторная независимая проверка.

4. **EV-P01-04 (P2):** полный revert единственного implementation commit удалит собственные `.github/workflows/ci.yml`, npm scripts и каркас, тогда как protected main требует quality/container-smoke. Такой rollback PR не сможет пройти заявленный обязательный CI. Для первого bootstrap нужен честный stop/reopen/fix path; последующие runtime rollback должны восстанавливать принятые runtime/dependency/config files с сохранением CI/tooling и повторной сборкой/проверками.
