# Venus P02 · Разработка и восстановление

Статус: IMPLEMENTING, независимый гейт ещё не принят. База: accepted P01 `934d9a1efcccfb4380e708a8f5143a43efbc3a71`, сохранённая immutable tag `p01-accepted-20261018`; merge main — `b964ab231972dfd44185c90c21ae283eca2866fd`. Ветка `feature/p02-rooms`. Нормативные P00 inputs сохранены; аддитивные consumer endpoints — `contracts/p02.additions.openapi.json`, surface overlay — `implementation/p02-central-applicability.csv`.

## Проверка

Нужны pinned Node24.22.0/npm11.19.1/Python3.12.14, hash-locked Python deps и Linux Docker/Compose. Выполнить `npm ci`, `npm run quality`, `npm run browsers:install`, `npm run test:p02`, `npm run test:container`. Для предварительного OCI smoke изменённого дерева разрешён только `node tools/container-smoke.mjs --allow-dirty`; такой результат не принимается гейтом. Playwright использует отдельный `.artifacts/playwright-browsers` со skip-GC; системные браузеры/кеши не очищаются.

`test:p02` собирает exact accepted P01 в отдельном временном checkout, поднимает собственную PostgreSQL16.14 с loopback random port, отдельный API process и локальный HTTPS/WSS proxy с явно тестовым self-signed certificate. `tests/fixtures/p02-test-key.pem` — публичный тестовый ключ, исключён из runtime image; не credential сервиса. Synthetic offer есть только в `tests/p02/server.mjs`; production server всегда возвращает unavailable до P05. Тесты используют UUID/синтетические настройки и управляемые clocks. Закрываются только свои процессы/Compose volumes/networks. Local image IDs остаются для осмотра. Артефакты — `.artifacts/p02`, `.artifacts/container`, `.artifacts/negative-gates.json`; clean Git SHA и source identity обязательны для приёмки.

Новая схема generation1 применяется одним transaction/advisory lock, checksummed001. Readiness сверяет generation и наличие10 обязательных таблиц; неизвестная generation/checksum mismatch останавливают запуск до serving. После приёмки migration001 immutable: следующие изменения только следующими миграциями. До P03 games/context locks для active sessions отсутствуют, Games unavailable.

## Runtime и данные

Нужен внешний `VENUS_DB_PASSWORD_FILE` и `VENUS_KEYRING_FILE` с JSON `{ "current":"v1", "keys": { "v1":"<base64 random32 bytes>" } }`. Это операторские secrets вне checkout/образа/DB. Передавайте их через environment с file paths, не inline command secrets. Compose монтирует их readonly и отдельный owned state volume `/var/lib/venus` для durable deletion ledger. `VENUS_APP_ORIGIN` — точный HTTPS origin; cookie Secure/HttpOnly/Strict, room-scoped. Локальный HTTP порт Compose только127.0.0.1; обычный HTTP браузер не является рабочим consumer входом. Production reverse proxy/host ещё не настроены.

Room host не operator. Operator routes отсутствуют. Own preferences расшифровываются только для self; room stream показывает лишь readiness. AES-GCM AAD привязывает room/member/schema; fixed16KiB envelope скрывает private value length в prefs и operation replies. Versioned keyed fingerprints позволяют replay/conflict без offline dictionary leak. Новый authoritative prefs rev заменяет несохранённый draft только после явного refresh с предупреждением. Смена оферты требует нового unchecked offer+18+ внутри комнаты; safety leave/neutral skip остаются доступны.

Audit/outbox содержат безопасные metadata/projections, не private values. Hard caps10000/64MiB; audit30d/outbox24h, room primary delete23h после close имеет приоритет. Heartbeat не отменяет idle24h. Ключи старых key versions нужны до удаления всех связанных данных и истечения7-дневных backup; молчаливое удаление ключа не считается recovery.

## Backup scope и recovery drill

P02 реализует disposable encrypted pg_dump/pg_restore primitive; scheduling, operator Access Key, ZIP/export/key recovery и production RPO/RTO — P06.

| Данные | В disposable backup | Recovery правило |
|---|---|---|
| Schema/checksums/room/member IDs/roles/consent timestamps | Да, весь dump шифруется внешним keyring | Exact identities и row scope сравниваются, migrations повторно проверяются |
| Preferences/operation replies | Только AEAD padded ciphertext внутри encrypted dump | Self-only decrypt; replies могут содержать encrypted bearer для authorized replay, plaintext token columns отсутствуют |
| Session/invite/ticket verifiers | Только hashes; никаких plaintext bearer columns | Membership/session/room/ledger перепроверяются перед выдачей/consume/replay |
| Audit/outbox/rate counters | Да, безопасные metadata/projections | Bounds и retention применяются до serving |
| Keyring, DB password, environment, Docker secrets | Нет | Вне DB; отдельное восстановление ключей обязательно, процедура P06 |
| Deletion ledger | Вне DB rollback domain | Актуальный durable ledger сохраняется и применяется до serving; его потеря блокирует безопасный restore |

Envelope защищает schema/time/digest header AAD; expiry ровно7d, `now>=expires_at` отвергается, продление timestamp не обходит GCM. Закрытие немедленно отзывает доступ и удаляет preferences; primary room rows удаляются через23h. Restore не продлевает closed_at и не оживляет закрытую комнату. После7d старые ledger entries могут удаляться, потому что все соответствующие backups уже недопустимы. На стенде сравниваются exact IDs/roles/slots/ciphertext/revisions/session verifiers открытой комнаты и непустые comfort/edges после restore, отдельно — closed-room revocation.

## Допустимый откат P02

1. Остановить новые admissions и P02 API. Сохранить текущую DB, внешний keyring и актуальный deletion ledger; не удалять volumes и не исполнять down migrations.
2. Запустить **проверенный accepted P01 image** с прежним DB secret на существующей generation1 DB. Exact previous image ID из rollback evidence обязателен; пересборка произвольной ветки не заменяет доказательство. Совместимость проверена лишь для P01→P02 schema1.
3. Проверить foundation liveness/readiness/version и сохранность scoped rows. У P01 нет Room API:404 и отсутствие игровых/room функций — явное временное ограничение отката. Consumer access остаётся закрыт; старый UI не выдаётся за продолжение room sessions.
4. Для возврата к исправленному P02 остановить P01, запустить совместимый P02 image с прежними secrets/ledger, выполнить migrations/checksum/revocation reconciliation до listen. Проверить восстановление own preferences и identities.
5. Если данные несовместимы/повреждены, использовать только ещё действующий encrypted backup на изолированном стенде, с текущим ledger и отдельными ключами; сначала сравнить identities/private values/row scope. Потеря room data не скрывается; слепой downgrade, повтор apply и удаление volumes запрещены.

CI имеет quality/container-smoke/p02-integration с read-only permissions, pinned actions и полным Git history для accepted tags. Гейт проверяется `python -B tools/stage_gate.py verify` после сохранения clean-source evidence и минимум двух независимых PASS; `freeze` фиксирует implementation inventory, не означает PASS. Журнал P02 и старые FAIL reports сохраняются.
