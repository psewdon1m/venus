# P08 — локальный каталог музыки

Контракт и реализация подготовлены до первого теста; текущий результат этапа — в p08-registry.json. Источник выбран владельцем: локальные файлы на хосте Venus; собственное synthetic audio разрешено для разработки, реальные треки подключаются отдельно. Реальная музыка не получает rights approval от тестов. Вход: accepted P02/P05 и P08 entry-round01; общий P07 перенесён по U-022. Предыдущие receipts не переписываются.

## Источник и хранение

При отсутствии VENUS_MUSIC_CATALOG_FILE Music unavailable. Файл конфигурации — operator-owned каталог JSON schema_version1 с массивом tracks до128. Для трека обязательны id, title{ru,en,tr}, duration_ms, sha256, file=SHA.wav/mp3/ogg, active и rights{kind,reference,territories,uses,valid_until}. Uses включает room-stream/with-games. Содержимое проверяется по SHA256, размеру и magic; symlinks/hardlinks не принимаются. Размер трека≤128MiB, каталога≤256KiB, общий проверяемый объём≤2GiB. Rights — запись оператора, не автоматически выданное юридическое заключение. Synthetic допустим только local-pilot.

Исходные аудиофайлы и registry остаются на хосте, монтируются read-only. Они не входят в image или DB backup. Их сохранность, как и keyring, обеспечивается отдельно. БД хранит только room-scoped очередь, anchor/revision/позицию и digest каталога; таблица additive с FK cascade, удаление комнаты очищает её. Host-file PostgreSQL backup P06 включает новую таблицу без отдельного формата архива. Восстановление очереди с другим/отозванным каталогом не возобновляет аудио: хозяин явно устанавливает новую очередь.

## Протокол и клиент

GET/POST /api/v1/rooms/:roomId/music используют существующие room cookie, entry18+ и Origin/CSRF. Только host меняет очередь/play/pause/seek/next/previous, с expected_rev и idempotency_key. Auto-next вычисляет сервер из anchor без зависимости от присутствия UI хозяина. Идемпотентный повтор не создаёт второй update; музыка не выдаёт private preferences. Очередь закреплена digest каталога; любая его ревизия останавливает старую выдачу до явного host выбора.

Native audio использует room-scoped /music/tracks/:trackId/stream, действующую cookie, same-origin Sec-Fetch-Site/Dest, без URL token и глобальной cookie. Каждый64KiB chunk проверяется заново через room/member/entry/expiry/deletion/serving fence и актуальный registry/fd identity. Range только single, suffix/open/overshoot поддержаны, один диапазон≤1MiB; full GET200 bounded asset≤128MiB. Backpressure≤64KiB, global64/per-member2 streams и idle30s. Уже доставленные браузеру bytes нельзя отозвать; UI опрашивает authority каждую секунду, закрывает audio при потере доступа и при unmount. Не заявляется DRM.

UI не включает звук без явного локального действия. Play/pause/queue общие, громкость локальная и не вызывает mutation. В очной комнате default speaker — host; личное слушание других устройств требует явного opt-in. Клиент использует midpoint monotonic RTT, каждые250ms корректирует отклонение>150ms, общий wall clock клиента не используется. Cinema получает внутренний pauseForCinema; actual Cinema совместимость проверяется на P09, не считается уже PASS.

## Подготовка запуска и откат

Явная необязательная команда `node tools/music-demo.mjs ABSOLUTE_NEW_DIRECTORY` создаёт два оригинальных synthetic WAV и registry. Никогда не запускается автоматически. Для совместимого нового dev image подключается compose.music.yml поверх compose.standalone.yml, VENUS_MUSIC_DIRECTORY — абсолютный host path. Этот overlay не расширяет доверие уже подписанного venus-v0.0.1 и не активируется произвольным операторским HTTP-запросом. Утверждённый полный signed deployment нового набора модулей и общий restore проверяются перед финальным P07.

Отключение: прекратить выдачу каталога/stream, закрыть active audio, убрать optional overlay/env. При code rollback additive таблицу не удалять, protected ledgers не откатывать, registry/revoked assets не возвращать. P06 Desktop export FAIL сохранён. Production/DNS/реальные audio devices не заявлены.

## Заранее выбранные проверки

Только impacted lint/typecheck и узкие Music unit/API/browser checks. Нет длинных статистических suites. Проверить host-only/replay/conflict/18+/foreign room/origin, Range/inflight revoke, catalog pin/hash/expiry, restart/pause/seek/queue auto-next, local volume/in-person default, RU/EN/TR. Быстрый drift-профиль:8 Chromium contexts на local Docker,60s после2s warmup, sample1s, p95≤300ms в обычной локальной сети;8contexts не означают8устройств. Firefox/WebKit — отдельные короткие decode/UI smokes, не device support. Network disruption/reconnect и точный объём samples фиксируются как отдельные cases. Этот профиль принят до первого теста как ограниченная локальная компонентная проверка; общий нагрузочный/soak P07 остаётся впереди. Ни намерение ни наличие этого документа не означает PASS.
