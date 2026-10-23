# Независимая проверка фактических Docker Games20 / lifecycle16

Статус: **PASS_ACTUAL_DIRTY_DOCKER_GAMES20_LIFECYCLE16_ONLY**. Замечаний, требующих исправления этих двух прогонов, не найдено. Записи завершены. Проверяющий не являлся автором API/UI/planner unified-chat; прежнее авторство metadata r4 и OCI не используется для принятия карточек или OCI.

## Точные входы и проверка исполнения

| Компонент | Фактический результат | Образ |
|---|---|---|
| Games | P05-TG-01…20: 20/20 PASS, exit0 по fail-closed wrapper и терминальному отчёту, cleanup completed | sha256:e081feba66118113f5deb6bd2e19ee977de3d5e0389d0d6726c9b13006a56c82 |
| Lifecycle | P05-TLC-01…16: 16/16 PASS, exit0 по fail-closed wrapper и терминальному отчёту, cleanup completed | sha256:83ee9a0977d1236aca10e5af3020f903a4c7356f911def9c60dfdc9128e6e868 |

Games INDEX `91ccb357e69afea78ce1f5c22cc393b98be45ae5163d68ec24b5d40cc737a619`; lifecycle INDEX `f293dfab697a1eef7c3f6f45620061d1c846fab1659bfa2e827b5bfaaa5881e9`. Проверены все 19+19 дочерних файлов по SHA256 и размеру, RECORD и его 16 run-пинов для каждого прогона. Полные сырые отчёты прочитаны, последовательности фиксированных ID независимым аудитом сверены без SKIP/дубликатов/пропусков. `check(id, fn)` записывает PASS только после выполнения async-проверки; исключение даёт FAIL и ненулевой exit. Отчёт и терминальная строка каждого прогона согласованы с wrapper, который отклоняет ненулевой Docker exit и неполный отчёт.

Оба `inputs-before.json` и `inputs-after.json` побайтно одинаковы и совпадают с frozen map `.artifacts/p05-unified-source-freeze01.json`: identity `b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4`, 1819 файлов. Текущий inventory проверен до/после аудита: тот же exact map. API/UI/planner и новые TG05 assertions тем самым привязаны к ранее независимо принятым байтам, а не к историческому source1274.

Оба image-id, image-inspect Id, compose image и runner image совпадают с образами выше. Build-логи заканчиваются экспортом соответствующего digest. Dockerfile копирует apps/packages/tests и выполняет `npm run build` перед UID1000 runtime; показанный build cache допустим и не выдан за повторную не-кэшированную компиляцию. Два image-source-map содержат одинаковые 200 app/package/test хешей, каждый сверяется с frozen/current map. Это аудит сохранённых root-результатов чтения исходников из фактических образов; проверяющий не выполнял второй image probe. Эти 200 записей — source map, а не заявление о 200 хешах compiled dist.

## Что подтверждают сценарии

TG05 (`tests/p05-topic-games/cases.mjs`, 7–28) исполняет отдельные online/in_person циклы через реальные HTTP и PostgreSQL. В каждом расшифровывает сохранённый snapshot и проверяет точный context, frozen private_text_chat и private_policy_revision ROOM-TOPIC-2. Реальные отрицательные assertions: одно согласие не выдаёт prompt/chat; outsider GET/POST получают 4xx без SYNTHETIC payload; pending advice скрыто; edit требует нового согласия; revoke очищает; stale epoch отклоняется. Положительный V2 chat доставляется второму актору. После выключения operator flag чтение и точный replay запретны; повторное включение не оживляет conversation. Snapshot ciphertext остаётся побайтно прежним. Все 14 флагов деталей подтверждены соответствующим кодом, не одним декларативным DTO. Свободный чат не объявляется семантически фильтрованным по теме.

Остальные TG01–04/06–20 подтверждают миграции, три режима, 100 реальных PG/HTTP раундов и сохранение history, invitation/topic/action consent, TD-lock и YesBut epoch, union/exclusions/replay, session prior, clock rewind, fail-closed source outage, latest refs и адресацию, final credential fence, новый Node process startup barrier, withdrawal и идемпотентность. Все точные детали 20 случаев сохранены в `audit-results.json`. Синтетические error JSON строки Games — ожидаемые отрицательные ответы (включая CONVERSATION_STALE/ROUND_ACTOR_REQUIRED), а не упавший suite; последняя строка PASS/20/cleanup.

TLC01–16 используют реальную Linux PostgreSQL/HTTP инфраструктуру, внешний private authority/admission/retirement и локальные цепочки: 18+ при создании, неизменность протокола при V1 join в P2, личные encrypted preferences, rollback-safe exclusions, legacy P1, bilateral release, leave/close под отказами, row snapshot resurrection denial, финальные credential waits до публикации/enqueue и boot quiescence. Полные фактические детали 16 случаев сохранены рядом.

## Изоляция и очистка

Compose задаёт internal сеть без опубликованных портов, pinned postgres16.14, отдельные secrets/volume и owned output bind. API UID1000:1000, readonly, cap_drop ALL, no-new-privileges, CPU1/768m/PIDs96; PG CPU1/512m. Это проверка конфигурации функционального прогона, не отдельное доказательство фактических cgroup bounds: завершившийся `run --rm` API не имеет сохранённого inspect. DB фактически Running и pinned, с точной owner label.

До cleanup сохранены inspect ровно одного контейнера, одной сети и одного volume каждого проекта; все с точной compose owner label. Wrapper проверяет ownership до down --volumes --remove-orphans и требует пустые после-cleanup inventory. Сохранённые два after-cleanup JSON пусты. Дополнительно выполнены только read-only owner-filtered inventories: оба проекта пусты. Аудит дважды выполнен после исправления собственного счётчика логов: всего 12 Docker read-only inventory calls, 0 функциональных запусков и 0 аллокаций. Последний batch записан в `fresh-owned-inventories.json`.

## Границы принятия

- Это current frozen **dirty-source component** proof; clean commit/tag и полный P05 этим не заявляются.
- Games использует synthetic cards/topic source и fixture safety/admission; lifecycle отдельно проверяет реальную authority/admission. Реальные r4 карточки этими synthetic suites не принимаются и не активируются; human HOLD неизменён.
- TG15 использует реальные WS bytes и Rooms ticket/dispatch, но отдельный wire fixture adapter. TLC08 presence — HTTP ws-ticket + Rooms.connect. Это не замена оставшемуся актуальному WS/browser gate.
- PG faults/clock controls названы явно. TLC05/13 восстанавливают выбранные rows, не pg_dump restore; TLC12 не неизвестный commit/network fault. TLC16 — boot barrier, не restart процесса; отдельный TG17 запускает новый Node process, но с fixture external safety.
- Бounded privateRound до 4×20 opportunities — существующая функциональная fixture. Она не доказывает no-reroll/statistical canary84 и не подменяет статистический финальный критерий.
- Full runtime/UI browser, production/DNS/TLS/устройства, full statistical acceptance, полный restore/OCI и разрешение human content HOLD остаются за пределами этого отчёта. Пакет не меняет предыдущие FAIL/HOLD и не утверждает будущий PASS.

Сам аудит: исправленная конечная проверка exit0. Первая ошибочная reviewer-попытка с encoding typo сохранена, не приписана продукту. Код проекта, карточки и исходные доказательства не изменены.
