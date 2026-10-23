# Независимый actual audit ordinary WS10

**PASS_ACTUAL_DIRTY_DOCKER_ORDINARY_WS10_ONLY**, 0 findings. Записи COMPLETE. Проверяющий не является автором проверяемого WS producer.

Вход INDEX `.docs/implementation/evidence/p05/unified-ordinary-ws10-docker-round01/INDEX.json` SHA `9080137d70049c1f2fd85f9a9c58b13f64babdd7e6e38a7e17bc636b67c030bb` /21. Проверены все21 дочерних SHA/размеров и18 run-файлов RECORD. Реальные P05-OWS-01…10 — ровно10 PASS без дубликатов/пропусков, stdout10 ID+terminal PASS/10/cleanup. Wrapper отклоняет ошибочный Docker exit/report/changed source и требует завершённый cleanup; сохранённые runner/report/stdout согласованы с exit0. Функциональный RUN проверяющим не повторялся.

Source `b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4` /1819: raw before/after побайтно одинаковы, совпадают с frozen map и текущим inventory до/после аудита. Producer в ignored .artifacts отдельно закреплён3 хешами: integration `d8c7f822034d35dc654e285c6c0a930cae27ec23e5cc5afa1a4310666b52b453`, runner `d9ce62373b7255854c28909be15f9a811f7504b1809b455a27b554dcec9b7abe`, observation `1432face15dcb683cdbc73e9face3c41f80fd98df0eeb5ffa8f163e799d22a7a`. Их before/after/current exact; readonly bind mounts соответствуют этим файлам. Не полагались только на included source identity, исключающую .artifacts.

Образ `sha256:3cb6a5e518911df05f61ba4f5d76c08fe7d9037642751a3916470a75fd3d55c8`: совпадают image-id/inspect/build export/compose/runner/RECORD. Сохранённый root image probe exit0/auto removed и200 source pins проверены против frozen/current source, включая actual harness. Это source pins из образа, а не200 compiled-dist hashes; проверяющий повторный image probe не запускал.

## Фактическая реализация и результаты

Прочитаны3 producer файла, full raw report и actual lifecycle harness. Harness использует createApp/registerRooms; client — настоящий `ws.WebSocket` к HTTP room route, реальный POST ws-ticket, cookie+Origin и auth frame; затем реальный room.snapshot. Private authority/admission/retirement/exclusion ledger и PostgreSQL настоящие. Нет отдельного fake websocket route и нет замены Rooms.connect для установления этого WS. Синтетические cards/topic source, mock offer, явные server clock и SQL wait/fault controls остаются именованными fixtures.

| ID | Подтверждённое поведение |
|---|---|
|01|HTTP18+ отказ без декларации,3 настоящих admitted members/ordinary WS presence, protected authority, immutable protocol|
|02|Pending private envelopes только адресатам, до topic consent нет prompt, spectator private frames0|
|03|Один accept не открывает prompt ни HTTP, ни ordinary WS; WS ping/pong жив|
|04|Два accept открывают prompt только двум акторам; публичный private round generic|
|05|CATALOG_LEDGER_UNAVAILABLE503 не создаёт новые private enqueues; full transition observer, WS/PG heartbeat жив|
|06|Feature-disabled503 при сохранённой active game прекращает private enqueue; ordinary room WS жив|
|07|Реальный leave/retirement закрывает WS4401, старый credential запрещён|
|08|Фактический PG session expiry + server clock tick закрывает WS4401, post-expiry private frames0|
|09|Реальный owner exclusion с successful durable-narrow boundary; epoch растёт, old refs не enqueue. Один точно matched pre-boundary queued frame допустим,8 новых pending без старого prompt допустимы|
|10|Реальный parent ordinary privateDelivery выбирает final credential SQL, advisory lock wait виден в pg_stat_activity. Source outage вводится до unlock; после ожидания private frames0, обычный WS жив|

OWS05/06/09 observer оборачивает настоящий dispatchPrivate и только наблюдает разрешённый enqueue, сохраняет payload SHA/ACL headers без текста. Начинает наблюдение до перехода, activation привязан к source/flag transition либо успешному durable ledger narrow. Exact fingerprint включает schema/stream/room/audience/member/revisions/event/type/payload. Каждый полученный frame расходует уникальный enqueue; старый event_id не оправдывает replay. OWS09 намеренно допускает легитимный до-границы enqueue и новый pending epoch, при этом запрещает старый prompt. Поэтому9 полученных private frames после начала окна не являются9 утечками.

OWS10 не приписывает глобальные active/pinned/assertCurrent fault counters конкретному child-call: `specific_child_assertion_attribution=false`. Он доказывает actual selected parent SQL wait/source outage/no later private frame, а не отдельный вызов assertCurrent в конкретном child и не прямой dispatch adjunct. Эта граница сохранена.

## Независимые finite counterexamples

Повторно исполнены существующие `window-regressions.mjs` и `fingerprint-regressions.mjs`:15+16 checks PASS, оба process exit0, без Docker/продукта. Чтобы не переписать авторские artifacts, выполнены копии только с перенаправлением output в этот packet и точными absolute import specifiers на исходные observer модули. Assertion bodies не менялись; source/copy pins в controls-copy-binding.json. Старые ложноположительные observer результаты воспроизводятся как исторические counterexamples; текущий observer отвергает active callback/unknown frame, подмену private payload/ACL/revisions и reuse одного enqueue. Legitimate delayed frame, JSON undefined omission и два enqueue для двух кадров допускаются. Это проверка оракулов с doubles, не дополнительный actual transport PASS.

## Ресурсы и границы

Compose internal network без host ports, pinned postgres16.14; API UID1000 readonly/capdropALL/no-new-privileges/CPU1/768m/PIDs96, PG512m/CPU1. Дополнительные readonly mounts — только два exact test producer файла. Это конфигурационный аудит функционального прогона, не заявка на actual cgroup resource gate: удалённый --rm API inspect отсутствует. Running PG реально inspected с exact image/owner label.

Cleanup inspect содержит1 owned container,1network,1volume с точной `venus-ordinary-ws-c5c65b7728aa` label; wrapper проверяет owner до down --volumes --remove-orphans. Saved after-cleanup пуст; новые3 read-only owner inventories тоже пусты. Functional Docker runs проверяющего0, Docker allocations0.

Принимается ordinary registerRooms WS component на этом dirty source и synthetic content. Это не browser cookie jar/реальный браузер, не production server CMD, не обе contexts во всех WS cases, не performance/statistical proof, не whole P05. Актуальный API оба contexts отдельно подтверждён GamesTG05; здесь это не расширялось. Human450/470 HOLD и r4 status не меняются. Clean commit/tag, browser/layout/rollback и прочие финальные критерии остаются самостоятельными. Приложение, frozen producer и старые proofs не изменены.
