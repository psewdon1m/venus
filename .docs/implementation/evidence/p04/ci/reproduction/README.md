# P04 · Повторная проверка доказательств

Основная read-only проверка из корня checkout на закреплённом toolchain:

```text
python -B tools/p04_gate.py verify-technical --packet .docs/implementation/evidence/p04/ci/technical-gate.json
python -B tools/p04_gate.py verify --packet .docs/implementation/evidence/p04/ci/technical-gate.json
```

Первая команда проверяет технический пакет. Вторая дополнительно требует настоящий human-reviewed каталог; её ожидаемый текущий результат — BLOCK с exit1. Оба фактических результата записываются в `../gate-evaluation.json`. Source identity исключает производные журналы/доказательства и сравнивает все остальные байты с реальным Git commit.

Здесь сохранены фактически использованные вспомогательные скрипты. Это процедуры сбора конкретного CI, не релизные инструменты приложения:

- `collect-ci.py RUN_ID SOURCE_SHA TEMP_DIRECTORY [ATTEMPT]` получает actual API/run/jobs/artifacts, raw ZIP и producer logs. Нужен собственный GitHub credential через Git credential helper; он используется в памяти. Собирать в отдельный временный каталог, не поверх versioned evidence.
- `assemble-evidence.py COLLECTED_DIRECTORY WORKSPACE_ROOT` копирует неизменённые байты только после completed/success и наличия всех9 artifacts. Существующие несовпадающие файлы отвергаются. Полные статистические отчёты остаются внутри сохранённых ZIP.
- `finalize-proof.py WORKSPACE_ROOT` связывает уже существующие настоящие независимые отчёты и fresh main protection, затем выполняет обе команды выше. Он не создаёт reviewer approval. Выходные файлы создаются эксклюзивно; повторный запуск не перезаписывает предыдущую проверку.

Для новой ревизии нужны новый каталог evidence, фактический CI и новые независимые решения. Нельзя менять SOURCE_SHA или переименовывать результаты этой ревизии для другого каталога/приложения. Проверка хешей и actual GitHub artifact digest подтверждает целостность данного набора; production release/signing/host trust относятся к P06/P07.
