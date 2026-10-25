# P08: независимый входной гейт, round 01

**PASS для начала разработки; полный EXIT-P08 не принят.** Прочитан exact managed HEAD `4954c85f778309142ea5e01b413bd120b7ab1a9a`. Это проверка документации/кода и целостности входных proof, без тестов, сборок, установки и внешних вызовов. SHA256 и размеры всех входов находятся в DECISION.json.

## Основание и границы

P02 имеет независимый Security PASS. P05 final acceptance подтверждает локальную Rooms/Games/private-chat основу и временную owner-приёмку карточек; P06 final acceptance подтверждает подписанный выпуск и восстановление только Linux Docker classic. Хеши трёх вложенных файлов каждого P05/P06 accepted INDEX совпали. Их принятие здесь не расширено: Docker Desktop export FAIL сохранён, production/DNS/TLS/реальные устройства не приняты. Implementation core D44/1951 приведён из принятого P06, новый full-source inventory данным агентом не вычислялся.

План §12 разрешает разработку P08 после EXIT-P02, а P07 требует для включения в пилот. Новое прямое распоряжение владельца переносит общий P07 прогон на конец после функций. Поэтому P07 не препятствует реализации Music, но остаётся NOT PASS. В v6 этого нового решения ещё нет; оркестратору требуется новая source revision/ADR с совместимостью и откатом, без изменения исторического плана/traceability/принятых proof.

## Что можно реализовывать сейчас

Полный Music control и UI с собственными/synthetic fixtures: registry и revoke, room queue, authoritative tuple/clock, ограниченные HTTP Range, host transport, local volume, единственный default output в очной комнате, autoplay/reconnect/drift. Все изменения этапа вносятся до первого теста. Затем только затронутые механизмы и независимые гейты; четыре больших игровых статистических suite не нужны.

ADR-004 пока DEFERRED. Рекомендация локального файлового каталога не является решением владельца. До ответа нельзя подключать реальные сторонние tracks или выдавать агентскую проверку за rights acceptance. Отсутствие каталога не запрещает изолированную реализацию/fixtures, но блокирует настоящий каталоговый EXIT. Mock legal значения локального пилота не заменяют track-specific решение об источнике.

## Конкретные требования к реализации

1. Исторический `/api/v1/music/tracks/:id/stream` не получит комнатную cookie: она сейчас scoped на `/api/v1/rooms/<id>` и v2 эквивалент. Нужен room-scoped URL. Не расширять cookie на весь сайт и не использовать reusable URL credentials. Это integration requirement будущей функции, не обнаруженный дефект текущей unavailable Music.
2. Native audio GET/Range не умеет передавать `x-csrf-token`. Нужен отдельный bounded same-origin read guard, с действующей session/room/member admission; mutation сохраняет Origin+CSRF+host ACL. Запретить произвольные URL/пути, корректно ограничить Range/HEAD и ответы на ошибочные диапазоны.
3. Использовать `Rooms.access` и `finalAccessFence`, current entry acceptance18+, ledger/room/session/member checks. Первоначальной авторизации длинного stream недостаточно: close/revoke/idle expiry должны прекращать дальнейшую выдачу. Room queue/state очищаются по lifecycle и не становятся межкомнатным профилем; restore не возвращает отозванный доступ/трек.
4. Host-only queue/transport с revisions/idempotency; volume остаётся локальным состоянием. In_person по умолчанию один speaker; передача output явная с generation fence/остановкой старого.
5. Drift profile/пороги фиксируются до первого измерения. Предложенные планом 15 минут/8 клиентов/p95<=300ms — целевой Music прогон, а не длинная статистика игровых сессий; нельзя незаметно заменить его мгновенным unit PASS. Если иной bounded профиль принимается новой ревизией, сохранить исходный target и честное сопоставление. Реальные восемь телефонов не доказаны восемью browser contexts.
6. Additive schema/API и совместимый rollback должны сохранять Rooms/Games/private-chat и deletion authority. Отзыв прав переживает откат кода; CI-M001…004 и затронутый Music+Games путь требуют реальных доказательств.
7. Cinema pause hook допускается реализовать сейчас; совместный actual Music+Cinema прогон остаётся pending до P09, а не объявляется PASS по stub.

## Что удерживает EXIT

- Owner source/catalogue и применимый registry для реальных треков.
- Реализация и targeted proof CI-M001…004, drift, ACL/retention/revoke/restore, autoplay и output policy.
- Затронутые backup/release/rollback доказательства и финальная интеграция P07 в новой очередности. Допустим отдельный технический module verdict до общего P07; он не называется публичной готовностью.

Изменены только собственные журнал и три файла этого round. Git mutations, тесты/build/lint/compiler/install/browser/API отсутствуют. Предыдущие попытки чтения по неверно угаданным путям и слишком широкий список с усечением отражены в журнале; выводы основаны на затем прочитанных конкретных файлах.

**COMPLETE_STOP: записи агента завершены.**
