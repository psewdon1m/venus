# P05 · Собственные темы: текущая реализация и границы

**Статус:** штатное server wiring реализовано и проходит typecheck; actual production-image startup и полный topic/private conversation сценарий ещё не приняты. Включение по умолчанию выключено; пустые approved registries запрещают protocol2 startup. [ADR-023](adr/ADR-023-p05-room-topic-safety-lifecycle.md), [проект функции](P05_TOPIC_ADVICE_DESIGN.md), [schema](contracts/private-topic-settings.v1.schema.json).

## Контракт

Все пути начинаются `/api/v1/rooms/:roomId/me/private-topics`. Room credential, CSRF, browser Origin/Fetch Metadata проверяются теми же guards, что private chat. Query string и лишний `owner_member_id` запрещены. GET показывает только собственные settings; host не читает настройки другого участника.

| Метод | Тело | Результат |
|---|---|---|
| GET | — | Собственные `rev`, `safety_revision`, taxonomy и allow/exclude sets |
| PUT | `request_id`, `expected_rev`, `taxonomy_digest`, `allow_topic_ids`, `exclude_topic_ids` | Явное изменение разрешённых тем с optimistic own revision; ранее исключённое не включается |
| POST `/exclusions` | `request_id`, `taxonomy_digest`, `topic_ids` | Только монотонное сужение без зависимости от прежней settings/game revision |

После mutation HTTP делает новый fenced GET текущего состояния. Idempotent replay не возвращает старый permissive receipt. Sets сортируются и шифруются в padded16KiB ciphertext; AAD связывает room/owner/incarnation/revision. Публичные room events не содержат topic settings. Request cache имеет предел4096 записей/комнату; исчерпание отказывает операции, а не ослабляет ограничения. Полное поведение при capacity/failure и зависимые private grants ещё требует интеграции.

Перед первым durable narrowing нужен текущий auth fence: поздний response fence не может отменить файловую запись. Перед выдачей ответа повторяются credential/acceptance/TTL, собственная safety revision и внешний lifecycle fence. Таймер или само наличие allow-set не являются согласием на prompt.

## Реализованные файлы

- `apps/api/src/private-topic-preferences.ts`: owner adapter, pin validation, encrypted settings, ledger union, request replay, fences и требуемые lifecycle hooks.
- `apps/api/private-topic-migrations/001_private_topics.sql` и migration runner: отдельная family, protocol classification, linked birth, preferences/requests. Нормальный UPDATE protocol запрещён; exact external descriptor остаётся обязательным даже при наличии DB constraints.
- `app.ts`/`room-routes.ts`: только явная инъекция adapter. `server.ts` собирает реальные directory/lifecycle/registry/preferences/source/Games dependencies; `topic-runtime.ts` выбирает только compiled release profile. Существующие protocol1 комнаты автоматически не обновляются.

## Доказательства

[Первый preflight](implementation/evidence/p05/topic-settings-preflight-01/index.json): identity `283afb9e842aaa5d561d55c05ad1bf2ba0c2135d6e8b17ecc424338403c0a806`, 34 focused и440 host tests PASS/43 platform skips; actual8/8 Linux ledger/PostgreSQL/loopback HTTP. [Независимый round01](implementation/reviews/p05/topic-settings-round01.md) нашёл TOPICSET001: сессия могла истечь до durable narrowing. Его CHANGES_REQUESTED и исходный FAIL сохранены.

[Исправленный preflight](implementation/evidence/p05/topic-settings-preflight-02/index.json): identity `62483f11349dadd121bedf3e6790fccb6a7402b8bcf2b435589df29424fe226f`, 35 focused иactual9/9 PASS, image `sha256:9ffff109ba5269f5a8ed2a7e74e1ee3548a97edd025dc3afeefd6b04ca441d41`, source unchanged, cleanup completed. SQL07 действительно ждёт fixture advisory lock внутри count-read; после expiry API даёт401, файловый ledger не изменён, DB preferences не опубликованы. SQL08 отдельно проверяет expiry во время final auth-read. [Независимый round02](implementation/reviews/p05/topic-settings-round02.md):22 собственные проверки и35 авторских rerun PASS; TOPICSET001 закрыт в пределах adapter. Lifecycle и полный P05 не приняты.

Оба прогона имеют recoverable exact included-source ZIP и raw outputs. Это dirty synthetic adapter proof: loopback HTTP не называется браузерным HTTPS, возврат старой encrypted row не называется full PostgreSQL backup restore. Epoch revoke и birth/retirement descriptor в этих тестах — явные fixture seams. Новые source bytes не наследуют глобальную source identity старого прогона; применимость component evidence определяется точными файлами.

## Что ещё требуется

Штатный production-image запуск, полный PostgreSQL restore/rollback и compatibility floor; topic picker и structured advice UI browser checks; C2/fairness/privacy и полный gate цикл. LIFE001–004 из [design review](implementation/reviews/p05/ledger-lifecycle-design-round01.md) не приняты целиком. Настоящий lifecycle/provider уже проверен отдельным actual PG/HTTP producer ниже; это не full restore. Каталог450 по-прежнему human HOLD.

## Интеграция V2 · текущий checkpoint

`TopicRoomRegistry` связывает PostgreSQL descriptor и настоящий Linux lifecycle. Host admission предшествует публикации DB birth; join admission предшествует выдаче session. Неизвестный COMMIT оставляет консервативные external metadata. Recovery повторяет исходные retirement UUID/closedAt и только подтверждённые member withdrawals. Personal cleanup предшествует удалению member-containing lifecycle files; room-only terminal сохраняет запрет воскрешения. Общая room advisory ordering должна применяться и при фактическом restore/cleanup. [Registry/provider round02](implementation/reviews/p05/registry-provider-round02.md) — bounded51 Linux PASS; [composition finding SAFETY-GUARD-02](implementation/reviews/p05/directory-authority-round01.md) проверяет отдельную границу allocator callback. [Actual lifecycle16/16](implementation/evidence/p05/topic-lifecycle-preflight-02/index.json) проверяет настоящие PG/HTTP admission, provider, protected roots и revoke; [независимый round01](implementation/reviews/p05/topic-lifecycle-round01.md) повторил предыдущий16-case source и добавил12 собственных actual controls. Row restore и same-process boot здесь не называются pg_dump/full restart.

Для нового транспорта добавлены явная `AppOptions.topicGames` инъекция, `POST /api/v2/rooms` и [собственный protocol DTO](contracts/private-room-protocol.v1.schema.json) на `GET /api/v1/rooms/:roomId/me/private-protocol`. GET требует session, CSRF, same-origin и финальной проверки прав. Старый RoomView не расширяется. V1 Rooms остаётся общим транспортом; V2 Games получает дополнительную узкую cookie path. Leave очищает обе paths. V1 Games на protocol2 отвечает `PRIVATE_TRANSPORT_UPGRADE_REQUIRED`; общий WS использует `RoomGames`, который не подставляет V1 при недоступном V2. Тесты Fastify с service doubles проверяют регистрацию и headers, а не поведение настоящего браузерного cookie jar.

Migration family расширена неизменённой `002_topic_games.sql` и новой `003_private_streams.sql`, generation3. Третья миграция сбрасывает только ephemeral private refs перед добавлением per-recipient stream revision; snapshot/history и exclusions этим не сбрасываются. Исторические actual generation1/2 proofs не выдаются за проверку generation3. Обычный `server.ts` теперь подключает V2 storage/source/provider; actual startup/rollback barrier этого entry point ещё требует проверки.

[Actual Games core11/11](implementation/evidence/p05/topic-games-preflight-03/index.json), identity `bdde63a684a99da87efbd8ea566e4ba520d024fe9dc42eea19e642a1296ac92a`, включает100 реальных HTTP rounds и encrypted chunk history, три режима, topic/advice/chat consent, replay и clock checks. Его lifecycle/source/safety — явные fixture seams; новая generation3 и последующие backend/UI bytes требуют свежего прогона. [Первый FAIL](implementation/evidence/p05/topic-games-preflight-01-fail/index.json) и [producer cleanup FAIL](implementation/evidence/p05/topic-games-preflight-02-fail/index.json) сохранены вместе с точными source ZIP. Эти результаты не закрывают полный P05, C2, restore или человеческую приёмку каталога.

Текущий [Games20/20](implementation/evidence/p05/topic-games-preflight-05/index.json) проверяет generation3, waiting draft, condition, bounded recipient streams, final PG-await expiry, distinct-process boot и URL-scoped idempotency; [независимый round02](implementation/reviews/p05/topic-games-round02.md) закрыл TG-REV-001. Явный fixture WS adapter в этом producer не доказывает ordinary browser WS route.

## Штатная конфигурация и восстановление

`VENUS_PRIVATE_TOPICS` принимает только `true`, `false` или отсутствие; default — `false`. Публичный same-origin `GET /api/v1/runtime-capabilities` возвращает [creation protocol](contracts/runtime-capabilities.v1.schema.json). Клиент фиксирует выбранный endpoint для повторного create и не переключается на legacy при ошибке. Уже созданная комната использует свой immutable authenticated protocol независимо от текущего флага.

При `true` либо наличии в БД хотя бы одной protocol2-комнаты (включая закрытые) startup требует compiled reviewed topic profile и operator-provisioned revocation ledger. Ни URL, ни environment JSON не могут добавить карточки/одобрения. Пустые release registries вызывают закрытый startup; текущий450 HOLD не обходится. Все historical release maps должны иметь один exact taxonomy digest и одинаковые локализованные topics. Несовместимая taxonomy или DB birth policy останавливает запуск; автоматического перевода старых exclusions нет. Политика связывает `ROOM-TOPIC-1`, taxonomy digest и sorted vocabulary.

Compose передаёт `CATALOG_REVOCATION_LEDGER_FILE` без default file: оператор явно задаёт `/var/lib/venus/catalog-revocations.jsonl`, предварительно provisioned UID1000/mode0600. Этот путь находится в `venus-state`, отдельно от `postgres-data`; PostgreSQL backup/restore не откатывает его. Первичная публикация выполняется явным `RevocationLedger.provision(path)` с exclusive create, никогда обычным server startup. Потерянный ledger не заменяется пустым. Внешние host paths требуют отдельного явного protected mount в operator override; передать host path в environment без mount недостаточно.

Пять абсолютных root paths задаются отдельно:

| Environment | Default |
|---|---|
| `TOPIC_BIRTH_DIRECTORY` | `/var/lib/venus/topic-births` |
| `TOPIC_PERSONAL_CHAIN_DIRECTORY` | `/var/lib/venus/topic-personal` |
| `TOPIC_PERSONAL_WITNESS_DIRECTORY` | `/var/lib/venus/topic-personal-witness` |
| `TOPIC_LIFECYCLE_CHAIN_DIRECTORY` | `/var/lib/venus/topic-lifecycle` |
| `TOPIC_LIFECYCLE_WITNESS_DIRECTORY` | `/var/lib/venus/topic-lifecycle-witness` |

Roots заранее создаются оператором: Linux UID1000, mode0700, разные неналоженные paths/inodes, без symlinks в ancestors. Image содержит fresh-volume roots; существующий volume без roots автоматически не ремонтируется. Constructor требует исправности всех пяти; после запуска отказ personal roots запрещает private content, но целая metadata authority сохраняет Stop/Leave/Close. Callback передаётся bound method, включая `metadataOnly`.

Перед первым включением на старом protocol1 volume: закрыть admission/остановить app, сохранить state и согласованный DB backup, проверить отсутствие всех protocol2 rows и orphan/partial allocations, затем явно provision five empty roots и первый ledger под UID1000. Если protocol2 уже был создан, отсутствие root/ledger — отказ восстановления, а не основание выполнить provisioning заново. Не изменять mode/owner повреждённого существующего authority для получения зелёного readiness. Конкретный upgrade/recovery drill старого volume остаётся OPEN; свежий image volume не доказывает его выполнение.

Startup выполняет migrations → проверку profile/roots → сборку компонентов → `TopicGames.bootGate()` → catalog reconciliation → room maintenance → listen. BootGate удаляет volatile private grants/refs/advice/chat, сохраняя snapshots/history/exclusions. При выключенном флаге старый V2 reader не заменяется V1; для восстановленных V2 всё равно нужен совместимый профиль. Флаг сам по себе не является проверенным rollback: сохранить authority roots/keys/revocations, закрыть новые starts, quiesce совместимым V2 reader и лишь затем менять image. Возврат на legacy binary без external compatibility barrier остаётся запрещённым и непроверенным.

Словарь для собственного picker доступен только через `GET /api/v1/rooms/:roomId/me/private-topic-taxonomy`: [DTO](contracts/private-topic-taxonomy.v1.schema.json), тот же CSRF/session/current lifecycle fence. Это vocabulary, не список чьих-либо permissions; settings allow по умолчанию пусты. Полный runtime/browser/restore gate пока открыт.
