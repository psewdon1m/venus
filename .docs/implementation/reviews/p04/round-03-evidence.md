# P04 · Независимая проверка исправлений gate, раунд03

Reviewer `/root/p04_evidence_review`, 2026-10-19T03:50:45+03:00. Проверка до source freeze; production/tests/validator этим reviewer не менялись. **CHANGES_REQUESTED:** E08 остаётся воспроизводимым. Полный EXIT-P04 по-прежнему NOT_PASSED из-за отсутствия действительных human review/rights/tri-locale records; этот технический раунд их не заменяет.

Самостоятельно выполнено `python -B -m unittest discover -s tools -p test_p04_gate.py -v`: **5/5 PASS**. Прочитаны новые `p04_gate.py`, gate negatives, reviewed reconstruction helper и actual P04 producer.

## Закрыто по новому коду

- E04: sidecar проверяет nonroot reviewer, два различных ID, aggregate implementation/evidence scope; narrative читается безопасным descriptor, проверяется structured header и равенство метаданных.
- E05: exact5880 eligibility tuple set, exact neutral1…100 и14 all-X profile sets, count constraints и причины отказов проверяются.
- E06: reviewed helper реконструирует подписанный bundle, возвращает digest его exact draft input; full gate сравнивает с human/current draft digest и повторяет actual reviewed coverage.
- E07: runtime required/records имеют точные длину, unique ID set/all PASS; source inputs SHA сравнивается с заявленным tested SHA.
- E08 частично: producer действительно запускает full300 draft-check после actual runtime, в отдельный run-scoped каталог. Validator проверяет9 artifacts/8 upload job logs, mappings, descriptors и member metadata. Эти улучшения сохраняются, но ниже остаётся разрыв.

## E08 / P1 — receipt manifest пока не привязан к bytes реального ZIP

`validate_ci_artifacts` сравнивает API.digest с `receipt.archive_sha256`, а copied bytes — с `receipt.files`. Реальные archive bytes не читаются; `receipt.files` не пересчитывается из ZIP. Изменение manifest и copied file с пересчётом descriptor hashes проходит при неизменном правильном API ZIP digest. Это позволяет фактическому ZIP содержать FAIL, а принятому copied report — PASS.

**Воспроизведено самостоятельно**, вне рабочего дерева: `python -B C:/Temp/venus-p04-ci-member-tamper-probe.py`. Probe создаёт9 настоящих ZIP и8 правильно сопоставленных job logs, точные SHA-256 ZIP в API metadata и receipt. В настоящем `p04-integration` ZIP `runtime-report.json` содержит status FAIL/memberA; в receipt manifest и copied file — status PASS/memberB. Все остальные поля/required mappings согласованы. `validate_ci_artifacts` завершился без ошибки:

```json
{"unexpected_result":"ACCEPTED","validator_sha256":"8c0c866be12c06d6cc7666d4ea86b5092cf9512632d66ec9664bd53841b0f603","source_unchanged_during_probe":true,"production_modified":false}
```

Исправление: потреблять настоящий ZIP из проверяемого raw cache/download, сверять его actual SHA с API.digest/receipt; безопасно и полностью перечислять реальные ZIP members(path,size,hash), сравнивать с receipt manifest, затем проверять каждый consumed copied member. Хранить ZIP в versioned source не требуется; внешний cache допустим при обязательной проверке его bytes. Негативный тест должен передавать существующий ZIP(A), manifest/copied(B), тот же корректный archive SHA — результат BLOCK. Пустая проверка строки digest недостаточна.

E01 остаётся ожидаемо открытым до freeze/fresh exact-source CI/packet и независимой финальной проверки. Предварительные dirty local runs не переобозначены CI PASS.

## Дополнение к negative-test coverage

Тест `test_root_self_review_and_missing_required_scopes_are_rejected` на снимке отвергает первого reviewer `/root` раньше aggregate-scope branch. Для доказательства второй части нужен отдельный fixture с двумя nonroot reviewer и только evidence scope. Полезны изолированные negatives narrative mismatch/unsafe path и runtime duplicate PASS+FAIL. Это замечание о достигнутой ветке теста; соответствующий код проверки по чтению корректен.

## SHA-256 просмотренного исправленного кода

| Путь | SHA-256 |
|---|---|
| `tools/p04_gate.py` | `8c0c866be12c06d6cc7666d4ea86b5092cf9512632d66ec9664bd53841b0f603` |
| `tools/test_p04_gate.py` | `6a45f2a88605fe80ac4477a3c2cc4ff3bea79b8632a41118a8fa04391c80dfa8` |
| `tools/p04-verify-reviewed.mjs` | `427c9a795cbf78a97f16ecb724c4ad29608b8ba654c3ae71b89d94657aa245d3` |
| `tools/p04-integration.mjs` | `272d09b69d42d3c16e1af8c1ffb7278f0e6e7e9b149f69e84f5f063770821a36` |

Более поздние исправления требуют нового раунда. Предыдущие FAIL/reports сохранены.
