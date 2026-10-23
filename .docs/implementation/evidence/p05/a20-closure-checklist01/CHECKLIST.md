# P05 A20 — обязательный остаток до закрытия

Статус этого пакета: **AUTHOR_CHECKLIST_ONLY, не PASS**. Однократный рабочий список по действующему плану v2 и неизменяемому draft03. Приложение: A20 `4d6022…e928fa`,1874 файла; ядро Git `81b1a85…`; test image `5d976ff…`. P06 не начинать. Работающие задания/новые ревизии не считаются завершёнными от наличия этой записки.

## 1. Выполнить только оставшиеся обязательные гейты

| Порядок | Остаток | Критерий окончания |
|---|---|---|
| 1 | Исходная статистика05 | `execution05/BATCH_TERMINAL.json`: исходные2609 записей, все `ok`, статус `ALL_FIXED_RANGES_EXECUTED_NOT_STATISTICAL_ACCEPTANCE`;1600 prefix cases учитываются отдельно. Manifest05 `beacb365…ccd5a`,987 normal carry +1622 оставшихся при активации. Реальный текущий счётчик брать из нового snapshot, а не этой записки. |
| 2 | Физическое размещение raw для reducer | Все требуемые для конкретной секции owner/prefix физически находятся на `E:/.venus-artifacts/venus-p05-20261022/raw/{owner}/export`, байты/хеши/полный набор файлов совпадают с исходными proof. C-пути могут оставаться junction-алиасами. Перенесённые1018 owner — промежуточный набор, не все будущие inputs. Допуск переноса/очистки даёт его отдельная независимая проверка. |
| 3 | Четыре исходных M3 reducer | Invariants70000, fairness84000, GF1000000, inference126000; полный replay/hashchain/ordinal/footer/descriptor/feature parity, исходные статистические критерии и строгие отказы; native exit0, producer unchanged, cleanup COMPLETE, независимый приёмочный отчёт. Сам завершённый batch/reducer ещё не полный M3/P05 PASS. |
| 4 | Оставшаяся локальная UI-матрица | Всего459 cells/324 typography/135 genuine actions, все исходные engine×RU/EN/TR. WebKit/RU03 уже независимо принят51/36 (`c7694b5f…`). Свежий Firefox/RU03: FAIL первого foreground/deadline, cleanup PASS; требуется минимальное исправление метода и независимое принятие. Не повторять прошедший WebKit без связанного изменения. Любые иные завершённые shard учитывать только по actual proof. |
| 5 | Финальная сборка обязательств P04/P05 | Новая текущая ревизия closure-таблицы:44 требований,19 UX-обязательств и72 retired trigger отдельно;5 EXIT-P05,10 E2E и9 CI-R/I/P. Соединить принятые component proof с A20-квалификацией, закрыть P04 техническую часть/retention/privacy/18+ и threat review. Ссылки PENDING в историческом draft03 не требуют заново запускать уже принятые компоненты. |
| 6 | Чистая локальная quality | После статистики/UI/reducers и остановки всех core-writers: обычный clean clone с каталогом `.git`, freeze/manifest/commit Q, один существующий `quality:docker` в тихом окне. Не `--allow-dirty`; сохранить Q, core identity, образ, все receipts, inputs before/after и cleanup. |
| 7 | Закрывающие гейты и точный финальный head | Независимые неавторы принимают engineering/QA и privacy/security с44/5/10/9 reconciliation. Findings → минимальная правка → релевантная повторная проверка. Производные отчёты/журналы заканчиваются, manifest обновляется последним; `check:docs`, clean commit F и обязательные GitHub CI на **точном F**. Лишь затем P04/P05 registry/status=`PASSED`; P06 остаётся `NOT_STARTED`. |

## 2. Что уже принято и повторять без причины не требуется

- C2: все84448 исходных cases и обязательные baselines приняты (`9e5be60d…`); conditional canary dispositions и ограничения остаются, новых позитивных seed не подбирать.
- API42/840 completions +2 YB negatives, browser16 covered logic, N4, finite wire и constructive matched domain42/42 имеют принятые component proof, квалифицированные к неизменённому backend A20 через `0c0afacc…`. Это не current raw geometry и не замена M3 inference/AUC/cadence/privacy assembly.
- OCI31 current A20:14/14, независимый отчёт `9a7789fb…`; не повторять без связанного изменения APP/контракта/образа.
- Карточки470: временный local-friends-pilot PASS U-019/ADR-026/029 действует; исходный450 HOLD,72 retired и19 UX не переписываются. Новое профессиональное/юридическое/production approval не является входом локального P05.
- Host1104 PASS/207 platform SKIP, lint/typecheck — component preflight; Linux clean quality/финальный CI ещё нужны. Music/mobile/Cinema later-stage части E2E-02/07/08 явно отложены, применимые Rooms/Games/keyboard/privacy части остаются.

## 3. Минимальная адаптация существующего reducer wrapper — только описание

Основа: `.artifacts/p05-reduce-original-section03.py`. Будущая копия05 **пока не создана/не запущена**. Разрешённый delta:

1. Manifest original02/hash9b107… → manifest05/hash`beacb3659d04aa39299afd2e06f1811f0191974e44f621a85a35c205be4ccd5a`.
2. Terminal `execution03` → `execution05`; исходные2609/all-ok/terminal-status проверки сохраняются. Хеш окончательного terminal появится только после завершения.
3. Output prefix `p05-reduce-original03-` → новый `p05-reduce-original05-`, чтобы не перезаписывать доказательства.
4. **Только Docker bind source** `/raw`: физический `E:/.venus-artifacts/venus-p05-20261022/raw` вместо C rawroot. Host-side чтение C alias допустимо; перед запуском проверить наличие всех физически размещённых E inputs с исходными pins. Само `/raw/{owner}/export` и input schema сохраняются.

Остальное неизменно: `range-reduce.mjs` SHA `42769a3dff329acb64d2c54f64b286c760db268c6b38fc047f13b3428ba046bd`, его зависимости/модели/replay/statistical thresholds/sourceA9/image58/cgroups/сроки/owned cleanup/защита no-overwrite. Не менять алгоритм, числа cases, семена или отсекать отказы. Для четырёх M3 секций нужно2230 owner inputs с prefixes:700/169/101/1260 соответственно. Не менять существующий32GiB reserve без отдельной необходимости/решения.

После узкой проверки metadata delta и готовности inputs — **четыре последовательных вызова будущей копии05**, не четыре повторных симуляции:

```powershell
# ПЛАН; файл05 сейчас не создан. Исполнять только после перечисленных гейтов.
.venv/Scripts/python.exe -X utf8 -B .artifacts/p05-reduce-original-section05.py m3-invariants
.venv/Scripts/python.exe -X utf8 -B .artifacts/p05-reduce-original-section05.py m3-fairness
.venv/Scripts/python.exe -X utf8 -B .artifacts/p05-reduce-original-section05.py m3-gf
.venv/Scripts/python.exe -X utf8 -B .artifacts/p05-reduce-original-section05.py m3-inference
```

## 4. Финальная UI-сборка: сохранить каждый исходный runtime

Существующий `source17/.artifacts/p05-v2-layout-producer-a20-03/aggregate.mjs` уже проверяет9 distinct shards,51 each, одинаковые source/image/**runtime**, оригинальные `assertShard`/`assertMatrix`/`assertTextRows`, PNG pins и135 действий. При одинаковом runtime всех9 используется без изменения:

```powershell
# $shards —9 точных завершённых actual-директорий, без FAIL/старых замен.
& $node .artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-03/aggregate.mjs .artifacts/p05-layout-a20-full-aggregate01.json @shards
```

Но ожидаемое исправление Firefox-only foreground может дать новый runtime04. Тогда исходный aggregate намеренно отвергнет смешанный набор. **Не редактировать его equality и не переписывать03/04 raw digests.** Нужна однократная явно проверенная сборка доказательств с точной таблицей `actual directory → raw runtime → compatibility review`; неизменённые WK/Chromium ветки квалифицируются независимым byte-diff review. Сборка вызывает исходные validators и сохраняет все их проверки,9 distinct keys/459/324/135/PNG/source/image. Пока04 не заморожен, не создавать этот тонкий assembly launcher и не придумывать его hash/команду. Прошедший WK03 не превращается в native04; он остаётся WK03 с узкой совместимостью.

## 5. Финальная quality и упаковка — существующие команды

Рабочий каталог — подготовленный обычный clean clone, не dirty root и не managed `.git` pointer. Все включённые core-файлы заранее закончены, root `.git/index` остаётся нетронутым.

```powershell
python -B tools/update_manifest.py
# Проверить manifest diff, commit Q, clean Git; выполнять git-шаги оркестратору.
npm run quality:docker
```

Это включает существующие lint/typecheck/JS/reporter/schema/i18n/Python/docs/build/catalog/negative проверки. Build и capture helpers не имеют общего2CPU cap; тихое окно уже принято (`1c6f2044…`), инструмент не усложнять. После Q разрешены только предусмотренные stage_inventory derived exclusions; неизменность core подтвердить. После завершения **всех** последних writers:

```powershell
python -B tools/update_manifest.py
npm run check:docs
# Commit F, clean Git, push/PR и required CI на F — оркестратору.
```

Remote workflow `.github/workflows/ci.yml`: `quality`, `container-smoke`, `p02-integration`, `p03-integration` (включает P04),4 `p03-measurements` sections. Нужны8 required contexts на точном F; local Q whole-Git не выдавать за F whole-Git. После последнего manifest не дописывать упакованные журналы; последующий write снова делает manifest stale.

## 6. Кто принимает и где честно остаются границы

Я **автор** continuation05 (`ce5c1d6a…`), не его независимый приёмщик; независимое принятие05 — другой агент, `5a51ab01…`. Мои независимые оценки layout03 method (`80f6abae…`) и WK/RU actual (`c7694b5f…`) относятся к компонентам другого автора. Этот checklist ничего не принимает.

Обновление current registry/status должно исправить устаревшие selectors (в частности top-level closing statistics SHA04 при активном05,18 observed cells рядом с51 PASS, pending metrology рядом с принятой03), сохранив исторические snapshots. Новый closure revision заменяет draft03 только как текущий указатель, не перезаписывает его.

Публичный DNS/TLS, production server, внешний backup, реальные устройства, профессиональная языковая/юридическая приёмка — отложенные claims. Откат при фактическом дефекте: остановить новые сессии проблемного модуля, сохранить безопасный выход/завершение активных и вернуть согласованный проверенный UI/API/engine/pack; catalog revocation/pack rollback учитывать отдельно от image rollback. Полный P05 PASS выдаётся только после перечисленных фактических результатов и независимых гейтов.
