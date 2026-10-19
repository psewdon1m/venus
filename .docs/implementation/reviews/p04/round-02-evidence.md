# P04 · Независимая проверка доказательств, раунд 02

Reviewer: `/root/p04_evidence_review`; время снимка 2026-10-19T03:47:13+03:00. Read-only implementation review; production/tests/validator не менялись этим reviewer. Проверена dirty ветка `feature/p04-catalog`, baseline HEAD579ca40a9344fd0af841ff2e2883e394321dfbe7. Identity снимка `fe5a7b71c1c2f1dfdef699d352f54bcdaaa2c69456dacaefcb576ba242d797d6` — предварительная, root продолжает исправления перед source freeze.

**Технический статус: CHANGES_REQUESTED. EXIT-P04: NOT_PASSED.** Этот раунд фиксирует проверку до freeze, а не финальную приёмку ещё не завершённого CI.

## Повторные проверки и закрытые замечания

- E03 из раунда01 закрыт: самостоятельно выполнен `npm test -- packages/card-catalog/src/catalog.test.ts`, 2026-10-19 03:44:40 local, **8/8 PASS**. Валидный изменённый request теперь достигает idempotency branch.
- E02 исправлен в конфигурации: существующий required job `p03-integration` выполняет блокирующий `npm run test:p04` и загружает отдельный `p04-integration` artifact. Все прежние восемь job contexts, immutable action pins и exact PR-head checkout сохранены. Фактический свежий remote CI остаётся необходимым условием финального evidence PASS.
- Количественный дефицит подготовки устранён: 300 draft, по100 на режим. Существующие12 examples и60 pilot не переобозначались reviewed. `p04_gate.py inspect` самостоятельно подтвердил reviewed0, production unavailable и единственный оставшийся внешний human-review blocker. Наличие draft100/mode не означает наличие reviewed100/mode.
- Самостоятельный полный `draft-check` в `C:/Temp/venus-p04-evidence-independent-300-001` завершился exit0. **analysis и coverage побайтно совпали** с `evidence/p04/draft-author-300/`. Coverage:5880 cells,4200 PASS neutral sessions по3mode×2context×7size×100roundcounts,14 ожидаемых all-X YesBut refusals, neutral20 PASS. Это actual planner на synthetic draft, без подмены количества карточек перестановками акторов. Human editorial/rights/tri-locale approval не утверждается.

## Замечания к новому gate validator до freeze

1. **E04 / P1 — не обеспечена независимость и согласованность reviewer records.** `technical()` требует только два различных reviewer_id. Допускается `/root`; не проверяются aggregate scopes implementation+evidence, structured `venus-review` header и совпадение narrative metadata с sidecar. `report_path` читается напрямую, вне безопасного evidence descriptor/path validation. Нужно перенести эквивалент проверок существующего stage_gate и добавить негативные проверки self-review, неправильных scope, narrative mismatch и unsafe path.
2. **E05 / P2 — размер coverage не доказывает полную матрицу.** Для5880 eligibility cells проверяется только длина. Для14 all-X записей — длина и status. Дублированные ячейки/профили могут скрыть отсутствующие segments, сохранив размеры и PASS. Требуются exact unique tuple sets mode/context/size/stage/comfort/resolved_class, числовые constraints eligible counts и exact tuple set отрицательных sessions; проверка reason для отказов. Синтетические uniform-class ограничения должны остаться явно видимыми.
3. **E06 / P1 — full human acceptance не связано с тем же набором исходных карточек.** `human.catalog_digest` сравнивается с draft analysis, но реконструкция approved bundle возвращает только pack digest/counts. Другой действительно подписанный bundle300 мог бы пройти проверку при ошибочно указанном acceptance текущих drafts. Helper должен возвращать canonical digest exact reconstructed draft input и full gate обязан сопоставить его с human acceptance и текущим draft analysis; другой pack/input должен блокироваться.
4. **E07 / P2 — дублированные/противоречивые runtime records не блокируются.** Сравнение set(PASS IDs) принимает полный набор PASS плюс повторный FAIL на обязательный ID; set(required) скрывает дубликаты. Нужны точное количество/уникальность IDs/all PASS; `inputs.source_sha` также должен совпадать с заявленным source. Сохранить негативные примеры.
5. **E08 / P1 — пока отсутствует автоматическая связь consumed evidence с реальным CI artifact.** Метаданные зелёных CI jobs сами по себе не связывают локальные runtime/coverage JSON с конкретным ZIP/job/attempt. Нужны exact artifact IDs из actual upload job logs, API ZIP digests, member path/size/hash manifests и проверка каждого consumed descriptor. Full300 draft-check на снимке ещё не выполняется producer CI: runtime suite использует fixtures. Каталоговый analysis/coverage должен реально измеряться в source-frozen CI либо оставаться явно локальным source-bound результатом с независимым воспроизведением; копирование development JSON в upload не превращает его в CI measurement.

Root уведомлён об этих замечаниях до freeze и сообщил, что исправления/negative cases готовятся. Здесь исправления не считаются завершёнными заранее. E01 из раунда01 остаётся открытым до frozen source, fresh runs и exact-source packet; факт dirty/source mismatch не переименовывается PASS.

## Human boundary и остаточный gate

Ни один агентский отчёт не утверждает существование компетентного human reviewer, проверку прав или переводов. Uncalibrated Jaccard .78/queue0 — только deterministic triage; смысловые перефразы, контентная уместность, права и RU/EN/TR должны проверить независимые люди по exact hashes. Production bundle registry пуст, public Games unavailable. Technical PASS в будущем допускается только для явно ограниченного технического scope, полный EXIT-P04 требует действительных human records и release-bound bundle.

## Хеши ключевых входов снимка (SHA-256)

| Путь | SHA-256 |
|---|---|
| `tools/p04_gate.py` | `4f4218d727edb2085e8291bcea7301b3e327015acf2865161cfcf4ca2cbc9604` |
| `tools/test_p04_gate.py` | `c7c3b605e3f3408e72d1b60658a46f918572b4d127c6c6f72d6112b1a53199d3` |
| `tools/p04-verify-reviewed.mjs` | `988d783265724e00dcd971528577e94cbd276e6bb83a6db6aabd24b4912b1c12` |
| `packages/card-catalog/src/catalog.test.ts` | `f789fad4821550bcc4e1b72ae24276c14b7169b37fa57e2a242732f7b47ae734` |
| `.github/workflows/ci.yml` | `6d6011e72f2ac0f6d7bffd05fab6c2395db0044d41572d27c9c01085994d6805` |
| `.docs/implementation/evidence/p04/draft-author-300/analysis.json` | `fa54ffcc7e733717ec4a33ab6e30e2c2ab02fc610f3aa26158a741f510cd6660` |
| `.docs/implementation/evidence/p04/draft-author-300/coverage.json` | `03c349a8c7c8ab0801ced212e04e162f50cb62d61bb8ba5961a2ca9bc2f88d6d` |
| `.docs/implementation/evidence/p04/draft-author-300/input-index.json` | `c5a65598f423a485f3e0f66565d8bef38c6718905c9a5e7c13001eeea00900dd` |

Полный raw-card input index содержит хеши всех300 файлов. Перечисленные analysis/coverage hashes подтверждены собственным выполнением команды; более поздние исправления root требуют отдельного fresh review.
