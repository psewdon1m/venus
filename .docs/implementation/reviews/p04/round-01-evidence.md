# P04 · Независимая проверка доказательств, раунд 01

Время: 2026-10-19T03:30:51+03:00. Reviewer: `/root/p04_evidence_review`.

**Результат технической проверки: CHANGES_REQUESTED. EXIT-P04: NOT_PASSED.** Проверяется текущий незакоммиченный кандидат `feature/p04-catalog`, baseline HEAD `579ca40a9344fd0af841ff2e2883e394321dfbe7`; это не утверждение, что baseline содержит или прошёл P04. Implementation identity снимка: `080bc280997c9853515009a96a1c84cb44045ec38a65114e6fa13de0f242f523`. Параллельные изменения root после этого снимка требуют повторной проверки. Автор проверки не редактировал production, tests или validator.

## Выполнено самостоятельно

- Прочитаны план §8, CARD-1, P04 supplement/registry, authoring/review/coverage implementation, runtime withdrawal/pointer/migration и actual PG/HTTPS/WS suite; проверены границы заявлений в журнале/статусах.
- `npm test -- packages/card-catalog/src/catalog.test.ts`: **7 PASS / 1 FAIL**, exit 1, 2026-10-19 03:30 local. Тест durable reservations ожидает `BATCH_IDEMPOTENCY_CONFLICT`, но новый count=1 при сохранённых distributions sum=2 отвергается раньше как `BATCH_DISTRIBUTION_INVALID`.
- `node tools/card-catalog.mjs draft-check .docs/content/p04/cards C:/Temp/venus-p04-evidence-independent-001`: exit 0. Повторный coverage побайтно совпал с сохранённым `draft-coverage-001.json`: 5880 ячеек; 4214 sessions; 840 PASS (1…20 × 42 профиля), 3360 SAFE_REFUSAL (21…100 × 42), 14 ожидаемых all-X YesBut отказов; neutral20 PASS. Counts учитывают card IDs, а не перестановки акторов. Это проверка draft synthetic pack, не reviewed release.
- В сохранённом actual runtime report девять PASS proof records из восьми actual tests. По коду tests подтверждаются genuine pg_dump/pg_restore старой полной БД, deferred PostgreSQL commit fault после fsynced intent, cached WS projection race, private clears обоих прежних recipients, CAS concurrency, shortage до Start, отсутствие production ledger. Повторно runtime suite самостоятельно не запускался: общий `.artifacts/p04/` перезаписывается runner, поэтому не создавал гонку с запуском root.

## Замечания, требующие исправления

1. **P04-E01 / P1 — финальная привязка к исходникам отсутствует.** Runtime report содержит только baseline HEAD; runner честно отмечает `source_dirty=true`. Draft inputs фиксируют 60 raw-card hashes, но не исполняемый validator/planner/runtime. Следовательно, это exploratory доказательства. Перед technical PASS нужен frozen commit или полный source inventory/identity, новые runs на этих bytes и сохранённые raw results/logs; отчёт не должен представлять HEAD579ca как проверенную P04 реализацию.
2. **P04-E02 / P1 — P04 runtime не входит в CI.** На снимке package.json не содержит `test:p04`, workflow запускает только P02/P03 runtime. Новый code path не защищён повторным actual PostgreSQL/HTTPS/WS прогоном для PR. Добавить исполняемый P04 CI check с exact source и upload runtime report/runner/logs, сохранив все прежние required gates. Отсутствующий CI run пока не выдаётся за PASS.
3. **P04-E03 / P2 — независимый targeted unit run красный.** Для idempotency conflict нужно подать другой валидный request (например, изменить только request_sha256), либо согласовать count/distributions. Сохранить этот FAIL и выполнить повторный targeted/full required suite после исправления. Смысл проверки — достижение idempotency branch, а не произвольный отказ на невалидном входе.

## Обязательные оставшиеся условия EXIT-P04

- В pilot только20 draft на mode, ни одной реальной reviewed карточки. Требование ≥100 reviewed originals/mode не выполнено. Подготовка оставшихся240 draft является доступной внутренней работой; отсутствие человека не превращает количественный дефицит текущего pilot во внешний blocker. Полный контентный gate требует самостоятельных оригинальных идей, не numeric/permutation filler.
- Идентифицированные компетентные независимые люди должны проверить exact hashes: editorial, RU/EN/TR, rights, substantial similarity/diversity; sensitive content требует qualified safety и принятой возрастной политики. Подписанный synthetic reviewer в unit fixture доказывает механику, а не существование реального человека. Не заменять human records агентскими отчётами.
- Token Jaccard .78 пока не калиброван на human-labelled выборке; queue0 не доказывает semantic originality. Эта граница честно указана в analysis/журнале; остаётся human review и calibration evidence.
- Coverage использует uniform resolved-class profiles и реальные P03 predicates; не доказывает все смешанные directed graphs. Нулевые supported cells и правило запрещённых interactions должны оставаться видимыми. Возможность21…100 раундов на текущем pilot корректно отказывает, не обещает отсутствующий контент.
- Реальные review/rights records, reviewed manifest/release validator, exact source CI и release-bound bundle отсутствуют. Production provider остаётся unavailable, public gate не закрыт. Partial technical PASS впоследствии не должен называться EXIT-P04 PASSED.

## Хеши просмотренных входов (SHA-256)

| Путь | SHA-256 |
|---|---|
| `.docs/10_IMPLEMENTATION_PLAN.md` | `d3b423ca33d9a4f5a63335ae5bd4309536f69b0ffc9c6276257e2cf16a98640d` |
| `.docs/09_CARD_AUTHORING_AND_AUTOMATION.md` | `82c1ddf4db23deef280281ac797db6be792b3fdf83d0839e6294ed778f14e408` |
| `.docs/implementation/p04-registry.json` | `b19395cf1f8a9f19a7c105b98c44fd48c1b6eea8fe16c978db164e48293680e1` |
| `.docs/contracts/p04-catalog-supplement.v1.json` | `f90127de98ec134ad5d85c16a870fdc136bb8fb0660ce051d06f5d2314e3dc23` |
| `packages/card-catalog/src/catalog.ts` | `dfd6d6f19ca05e2eaa526cdbf0afc2bf65e5d9d02c8407c6b04bf4858c7daf71` |
| `packages/card-catalog/src/authoring.ts` | `bdf911d3c7e81b2e1fb66aca74f834ce9bd24365b0f28ea72d0c63ea002e9a8d` |
| `packages/card-catalog/src/coverage.ts` | `8bfc148bc35be47b184460f0ce0b977ee2ddd1d21c9716cda112153134f7f713` |
| `packages/card-catalog/src/catalog.test.ts` | `88339905c786b1e6eaf1d2f96cdf8968dc80ae3d41b3f4d75d692fd28d699d6d` |
| `apps/api/src/catalog.ts` | `6793451a01ef59c70eff7051ba6c1e0dc9cf897c02a90df7b0ddb3b6afe97878` |
| `tests/p04/runtime.integration.test.mjs` | `acc80b8d8e09f1885b77ba26fe7540c8ea2332eeb9448e833a262d17fdc6e13f` |
| `tools/p04-integration.mjs` | `093e15a87bbca01661593fe4216843d436f12623bd710fb38765aae8c4173a20` |
| `tools/card-catalog.mjs` | `f77c30d37fe9cbf818151b1773826985dd1078e0c93d7cb6ea1f3e0ad75c5272` |
| `.artifacts/p04/runtime-report.json` | `e0971ffdae09abcae0ffa30fd4bca903101b7768305525a1f70c7982b7ee47a7` |
| `.artifacts/p04/runtime-runner.json` | `fb104b92e5e7b54e6afe57b95fefbe138e513eb9b4648b0a5851f10b597f1d83` |
| `.docs/implementation/evidence/p04/draft-inputs-001.json` | `b7d10699b630270bc833834528a7915c3bc0776a1e81cdb2511a267938707104` |
| `.docs/implementation/evidence/p04/draft-analysis-001.json` | `d5ac6672654bf1501f791984122e6a0cd5697199e3464264d8d1c8ec973650d1` |
| `.docs/implementation/evidence/p04/draft-coverage-001.json` | `3c958e0064aabcb673332d4bdfb3f0c26163eae9b11da361879408fd6733a81c` |
| `.github/workflows/ci.yml` | `d684ff5f69b816ca751ed634919cac221ec2713acd8bf78a9745dcceb69dfb66` |
| `package.json` | `2decd6876ab7e929b9f50f6731e6dc7f587856d97ad69bacf92a9c820548c97c` |

Каждый последующий раунд сохраняется новым файлом; текущие FAIL и границы scope не переписываются.
