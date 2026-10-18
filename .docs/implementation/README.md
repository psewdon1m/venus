# P00 · Реестры и зафиксированные контракты

**Дата:** 2026-10-18 · **ревизия:** P00-2 · **исполнитель:** Codex в текущем чате по поручению владельца проекта.

Рабочий комплект P00 подготовлен для проверки. Технические спецификации закреплены как кандидат `P00-2`; продуктовые решения приняты владельцем, независимые агенты проводят report/fix/retest по U-004; одни unit tests не закрывают гейт. Git/CI/runtime появятся в P01 и последующих этапах.

| Документ | Назначение |
|---|---|
| [Реестр требований](traceability.csv) | V/RE/CI/CARD/Part12 и дополнительные требования P00, задачи, этапы, тесты, доказательства |
| [Статус этапов](status.md) | фактический прогресс, владельцы, блокеры, следующий шаг |
| [Решения владельца](USER_DECISIONS.md) | конкретные варианты, рекомендация, влияние и последний рубеж решения |
| [Реестр ADR](../adr/README.md) | ADR-001…012, статус и связь с гейтами |
| [Контракты P00](CONTRACTS.md) | API/WS, права, атомарность, DB, privacy, state machines и совместимость |
| [Сценарии интерфейса](UI_FLOWS.md) | desktop/mobile, RU/EN/TR, normal/error/decline/reconnect |
| [Доказательства](evidence/README.md) | baseline receipt, локальные test results, gate report, хеши проверяемых файлов |

## Как обновлять

1. Requirement ID сохраняется. В CSV одна строка на требование; несколько test IDs и ADR разделяются `;`. `PLANNED` означает, что runtime-проверка ещё не выполнена; source-ссылка не доказывает реализацию.
2. `source_sha256` связывает требование с прочитанными байтами. При изменении источника проводится impact review; автоматическое обновление хеша не заменяет сверку смысла.
3. Задачи `TASK-*` — локальные стабильные IDs до создания issue tracker. Поля PR/commit пусты до появления реального Git. Будущие CI IDs нельзя выдавать за выполненные тесты.
4. Артефакты одного запуска хранятся в отдельном evidence-каталоге; успешный запуск не перезаписывается исправленным отчётом. Gate report отделяет local verification от product/human acceptance.
5. Новое решение фиксируется в ADR с причиной, последствиями, обратимостью и принимающим. Исходные normative snapshots остаются неизменными.

## Локальное воспроизведение

Использовать Python и зависимости из `tools/requirements.txt`. Команды из корня проекта:

```sh
python -B tools/check_p00.py
python -B -m unittest discover -s tools -p 'test_*.py' -v
python -B tools/validate_cards.py .docs/examples/cards
python -B tools/validate_card_batch.py .docs/examples/card-batch-request.json --catalog-manifest .docs/examples/pack-candidate-manifest.json
python -B tools/check_relationship_policy.py
python -B tools/check_docs.py
python -B tools/verify_manifest.py
```

`check_p00.py` проверяет полноту реестров и связность контрактов; unittest включает эталонные правила и отрицательные schema/privacy проверки. Ни одна команда не подтверждает HTTP/WS ACL, PostgreSQL contention, шифрование, UX или media на настоящем приложении. Их evidence остаётся `NOT_RUN` до соответствующих этапов.

## P00-2: выполненные решения и review

[Прямые решения владельца](user-decisions.v1.json) приняты; private chat входит в G1, retention24h/24h/7d, вход по текущей оферте+18+. [Центральные нормы](../source-snapshots/central-4449e65/provenance.json) закреплены; custom comfortable UI разрешён [DIV](DIV-20261018-01.md). Проверка выполняется отдельными агентами до зелёного результата; текущие отчёты — в reviews, полный scope этапа не включает runtime приложения.

[Матрица центральной применимости](central-applicability.csv) содержит 162 major sections и рубежи исполнения. CONDITIONAL не означает PASS или молчаливое N/A; unresolved operator/guest applicability должна быть решена до затронутого P02. Approved Venus host dependency declaration и реальный оператор требуются к P06. Чистый каркас P01 не решает эти вопросы заочно.
