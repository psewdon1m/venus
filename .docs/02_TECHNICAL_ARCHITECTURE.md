# Venus · Technical Architecture & Engineering Contracts

**Owner:** Architecture/Backend/RTC · **version:** 1.0.0 · **status:** `[PROPOSED]` stack; `[ACCEPTED]` product constraints · **date:** 2026-10-18.

## 1. Архитектурные инварианты

1. Одна комната (`room_id`) переживает переключение активного экрана/режима; внутри независимо существуют `cinema_state`, `music_state`, `game_state`, будущий `calls_state`. Не делать enum `active_mode`, который запрещает параллельность.
2. До **8 отдельных идентичностей в комнате**, включая владельца. Тот же участник после разрыва восстанавливает место, а не занимает новое. Ограничение проверяет сервер транзакционно.
3. Клиенты `ru/en/tr` показывают одну и ту же семантическую карточку (`card_id`, `revision`, `round_id`) в собственном переводе; имя и locale не источник полномочий.
4. Отношения каждого к каждому хранятся направленно и не выдаются наружу; session settings immutable после start, consent остаётся отзывным всегда.
5. Media publishing и общие мутации — только для владельца комнаты; `getDisplayMedia` всегда инициирует сам пользователь, повторное автоматическое разрешение невозможно.
6. Только **существующий Nginx** владеет публичным HTTPS/WebSocket ingress, без sidecar/nginx container; WebRTC UDP идёт по отдельно согласованным портам.
7. Сервер является источником истины для состояния и разрешений. События имеют монотонную `revision`; клиенты не «угадывают» успешную мутацию.
8. Кино не декодирует/перехватывает HTML сторонних сайтов, не входит в их аккаунты и не обходит DRM. Источник — захваченный медиа-поток с устройства host.
9. Нет записи разговоров, стримов, попыток согласия или отношений в обычных логах/аналитике. Данные автоматически удаляются по retention policy.
10. Все изменения конфигурации/релиза версионируются и допускают безопасный откат согласно 05/06 и нормативным Part 04/05/12.

## 2. Выбранный baseline stack (`[PROPOSED]`)

| Уровень | Выбор | Обоснование/граница |
|---|---|---|
| Web | TypeScript, React 19, Vite, React Router, TanStack Query, i18next | Быстрый SPA, изолированный state, удобные RU/EN/TR; точные версии фиксируются package lock и CI |
| Backend | Node.js LTS, TypeScript, Fastify, Zod, WebSocket (`@fastify/websocket`) | Детерминированный typed API и единый server authority |
| DB | PostgreSQL 16+, SQL migrations (Drizzle или эквивалент, закрепить ADR) | Транзакции участников, session snapshots, durable state, retention |
| Auth | Room-scoped HttpOnly session cookie + signed short-lived WebSocket ticket + hashed invite token | Гостевой вход без общей регистрации; разделение owner/guest полномочий |
| Media | Self-hosted LiveKit SFU как отдельно управляемая инфраструктурная зависимость; WebRTC SDK client | Host публикует поток один раз, до 7 зрителей; разрешения media token ограничены по room/role |
| Music | Лицензированные audio assets, HTTP Range, HTMLAudioElement/Web Audio, WS control | Синхронизация медиапозиции вместо ретрансляции звука через host |
| Deployment | OCI по digest + Compose v2 на host, shared system Nginx, Updater/profile при наличии нормативной инфраструктуры | Запрещён второй Nginx; поддержка signed release & rollback |
| Telemetry | Structured JSON logs + Prometheus/OpenTelemetry (без sensitive payloads) | Диагностика задержек, media health, availability, без раскрытия соцграфа |
| Tests | Vitest, Playwright, API integration, Postgres test instance, media E2E на реальных браузерах | Unit ≠ реальное качество A/V / NAT |

Это **техническое предложение**, не перечисление уже установленных компонентов. Обновление технической версии без проверки совместимости WebRTC, DB migrations и restore запрещено. Рекомендуемый начальный layout монорепозитория: `apps/web`, `apps/api`, `packages/contracts`, `packages/relationship-engine`, `packages/card-catalog`, `packages/i18n`, `infra/venus`, `tools`.

### 2.1. Границы деплоя

**Venus web/API** — один самостоятельно выпускаемый сервис (несколько контейнеров в его Compose допустимы как одна application deployment boundary при согласованных миграциях и rollback). **LiveKit** — внешняя зависимость со своим управлением, версией, безопасностью, сетевыми портами и health. Venus installer её **не устанавливает неявно**. Host Updater/agents — из утверждённой Part 13 матрицы, тоже не «копируются» в Compose Venus. Это предотвращает нарушение независимых bootstrap/trust/config границ.

## 3. Логическая схема

```text
Browser / Android publisher / iOS publisher
          | HTTPS + WSS                     | WebRTC media UDP/TCP
          v                                 v
[Existing host-managed Nginx]             [LiveKit SFU]
       | loopback upstream                   | media-only
       v                                     |
[Venus Web static + Fastify API] -----------+ token issuance / server-side controls
       |
       +-- Room Core: identities/invitations/presence
       +-- Session/Game Orchestrator: rounds/snapshot
       +-- Relationship Engine: directed graph/comfort/progression/consent
       +-- Card Registry: localized revisioned packs
       +-- Music Control: playlist/epoch/position and output policy
       +-- Cinema Control: publisher lease & A/V health
       +-- Personal / private pair interactions
       |
   [PostgreSQL] -- durable authoritative data
       |
   [Licensed media assets / restricted read path]
```

Сервер веб-приложения НИКОГДА не принимает Docker socket. Для хоста действует отдельно зарегистрированный scope через локальный привилегированный update helper, если он утверждён организационной средой.

## 4. Domain model и реляционная схема

**Типы:** `room_id`, `member_id`, `session_id`, `round_id`, `card_id`, `music_track_id` — opaque UUID/ULID без персональных сведений. `member_id` создаёт сервер; человек не должен иметь возможность подставить имя другого как идентификатор.

Рекомендуемые таблицы и колонки (DDL, уточнить при миграциях):

```sql
CREATE TYPE meeting_context AS ENUM ('online','in_person');
CREATE TYPE relationship_type AS ENUM
 ('just_met','friendship','crush','situationship','in_relationships','not_a_friend');
CREATE TYPE game_mode AS ENUM ('questions','truth_or_dare','yes_but');
CREATE TYPE game_state AS ENUM ('draft','waiting','active','paused','completed','aborted');

CREATE TABLE rooms (
 id UUID PRIMARY KEY, invite_token_hash BYTEA NOT NULL,
 host_member_id UUID, meeting_context meeting_context NOT NULL,
 state TEXT NOT NULL CHECK (state IN ('open','closing','closed')),
 rev BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL,
 last_active_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE room_members (
 id UUID PRIMARY KEY, room_id UUID NOT NULL REFERENCES rooms(id),
 display_name VARCHAR(48) NOT NULL, locale VARCHAR(2) NOT NULL
   CHECK (locale IN ('ru','en','tr')),
 role TEXT NOT NULL CHECK (role IN ('host','member')),
 join_order SMALLINT NOT NULL, present_until TIMESTAMPTZ,
 session_verifier_hash BYTEA NOT NULL, removed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL,
 UNIQUE(room_id,join_order)
);
CREATE TABLE private_preferences (
 room_id UUID NOT NULL, owner_member_id UUID NOT NULL,
 comfort SMALLINT NOT NULL CHECK (comfort BETWEEN 0 AND 4),
 encrypted_edges BYTEA NOT NULL, crypto_key_version INTEGER NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL, PRIMARY KEY(room_id,owner_member_id)
);
CREATE TABLE game_sessions (
 id UUID PRIMARY KEY, room_id UUID NOT NULL REFERENCES rooms(id),
 mode game_mode NOT NULL, state game_state NOT NULL,
 total_rounds SMALLINT NOT NULL CHECK(total_rounds BETWEEN 1 AND 100),
 current_round SMALLINT NOT NULL DEFAULT 0,
 snapshot_schema SMALLINT NOT NULL, encrypted_snapshot BYTEA NOT NULL,
 selection_seed BYTEA NOT NULL, selected_pack_digest TEXT NOT NULL,
 rev BIGINT NOT NULL, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
);
CREATE TABLE game_rounds (
 id UUID PRIMARY KEY, session_id UUID NOT NULL REFERENCES game_sessions(id),
 round_index SMALLINT NOT NULL, card_id VARCHAR(20) NOT NULL,
 card_revision INTEGER NOT NULL, interaction_type TEXT NOT NULL,
 state TEXT NOT NULL, chosen_member_ids UUID[] NOT NULL,
 consent_state TEXT NOT NULL, started_at TIMESTAMPTZ,
 completed_at TIMESTAMPTZ,
 UNIQUE(session_id, round_index)
);
CREATE TABLE music_state (
 room_id UUID PRIMARY KEY REFERENCES rooms(id),
 track_id TEXT, status TEXT NOT NULL, position_ms BIGINT NOT NULL,
 effective_at TIMESTAMPTZ, rev BIGINT NOT NULL,
 queue_json JSONB NOT NULL DEFAULT '[]'
);
CREATE TABLE media_state (
 room_id UUID PRIMARY KEY REFERENCES rooms(id),
 publisher_id UUID, status TEXT NOT NULL, publication_id TEXT,
 rev BIGINT NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
```

**Важно:** SQL выше — базовая декларация, НЕ исполняемая первая миграция: требуется определить FK для `rooms.host_member_id` после создания обеих таблиц, encrypted edge serialization, индексы/индекс уникального активного game-session и row-level locking. Не выполнять этот блок напрямую как production schema. Дополнительно обязательны: `content_pack_releases`, `audit_events` без приватных полей, `private_pair_consents` с TTL, `music_tracks` с лицензией, `room_session_keys`/rotation и `idempotency_keys`.

Индексы: `room_members(room_id) WHERE removed_at IS NULL`, `game_sessions(room_id,state)`, `game_rounds(session_id,round_index)`, `rooms(expires_at)`, `audit_events(created_at)`; уникальность **не более одного active game session на комнату** и одной music_state row. Атомарность: `SELECT ... FOR UPDATE` на room/active session при join/round advance; DB transaction записывает rev + состояние, WS публикует событие после commit (outbox для надёжной доставки, если создаются несколько app replicas).

### 4.1. Retention

`[PROPOSED]` room soft expiry после 24 часов неактивности, reconnect reservation 90 секунд, host grace 10 минут. При explicit close: прекратить stream, revoke tokens, завершить раунды, поставить deletion job для всех отношений/snapshots/private chat; данные удаляются из primary в течение 24 часов, в backup — по отдельной конечной retention policy и шифрованию. Снимки игр не должны утекать в observability. Продлевать retention без пользовательского решения нельзя; ADR-005.

## 5. Room lifecycle / presence / авторизация

**Room FSM:** `open -> closing -> closed`; `closed` terminal. Host disconnect не равен закрытию комнаты. Участники могут продолжить игру, но host-only музыка/cinema control остаётся недоступным до reconnect. Не переизбирать host автоматически.

**Guest admission:** invitation URL несёт случайный >=128-битный invite token. На сервере хранится только HMAC/hash; guest URL не даёт host-role. После ввода locale/name выдаётся отдельная first-party HttpOnly+Secure+SameSite cookie для этой room identity. Для WSS выдаётся one-use ticket с TTL 60s; токен содержит room/member identity и scope, а не отношения. Мутации проверяют роль на сервере, происхождение `Origin`, CSRF и monotonically increasing revision. Названия в UI не используются как ACL.

**Presence:** heartbeat 20s, TTL 45s (initial tunables); краткий disconnect удерживает member slot до 90s. Дубликат с тем же valid participant-session заменяет старый socket, не создавая отдельное место. После TTL слот освобождается, но encrypted room preferences сохраняются до конца комнаты, если member имеет действующее право reconnect. События `joined/left` не включают relationship edges.

**State sequencing:** любая server mutation требует `expected_rev` или idempotency key. При конфликте 409/`REVISION_CONFLICT` и fresh snapshot; старое WS событие клиент отбрасывает по `(room_rev, stream_rev)`.

### 5.1. Permissions / access matrix

| Действие | Host | Member | Observer not joined |
|---|---|---|---|
| Войти по приглашению / выбрать язык | Да | Да | Только join через valid invite |
| Изменить meeting_context | Только вне active game | Нет | Нет |
| Управлять глобальной музыкой | Да | Нет | Нет |
| Начать/закончить Cinema share | Да | Нет | Нет |
| Изменять свои отношения/комфорт | Да, свои | Да, свои | Нет |
| Читать чужие отношения | Нет | Нет | Нет |
| Начать игровую сессию/следующий раунд | Host или согласованная game moderator policy (`[PROPOSED]` host для MVP) | Нет | Нет |
| Отказ/пропуск собственного задания/личной пары | Всегда | Всегда | Нет |
| Читать приватный pair prompt/chat | Только если участник пары | Только если участник пары | Нет |
| Читать агрегированное состояние раунда | Да | Да | Нет |
| Закрыть комнату | Да | Нет | Нет |

Важно: « host owns cinema/music » не означает право совершать действие от имени человека в игре. Consent вводится только непосредственно заинтересованными участниками.

## 6. HTTP API v1 — минимальный внешний контракт

Все роуты JSON, UTC RFC3339 timestamps; идентификаторы opaque; body/query ограничены; `Content-Type: application/json`, RFC7807-like sanitized errors `{code,message,request_id}`, локализацию сообщений делает клиент по `code`. Responses для mutable endpoints несут `rev`, события — `event_id` и `server_time`. Ни один `/api/rooms` endpoint не отдаёт social graph другого участника.

| Метод | Путь | Payload / результат / авторизация |
|---|---|---|
| POST | `/api/v1/rooms` | `{meeting_context,locale,name}` → `{room_id,invite_url,me,room_rev}`; создаёт host room |
| POST | `/api/v1/rooms/:id/join` | `{invite_token,locale,display_name}` → `{me,room_view,ws_ticket}`; 8-member DB gate |
| POST | `/api/v1/rooms/:id/leave` | закрывает текущую live presence/optional membership; idempotent |
| GET | `/api/v1/rooms/:id` | public-within-room safe state, self preferences only |
| PATCH | `/api/v1/rooms/:id/me` | `{locale,display_name}`; не меняет game snapshot |
| PUT | `/api/v1/rooms/:id/me/preferences` | `{comfort,edges:{member_id:type}}`; только для себя и если нет active session; whole atomic replacement |
| GET | `/api/v1/rooms/:id/me/preferences` | возвращает только self edges/comfort после авторизации |
| POST | `/api/v1/rooms/:id/game/prepare` | `{mode,players,round_count}`; host; validates configuration |
| POST | `/api/v1/rooms/:id/game/start` | `{draft_rev,idempotency_key}` → `{session_id,game_rev}` immutable snapshot |
| POST | `/api/v1/rooms/:id/game/:session/round/advance` | `{expected_rev,idempotency_key}`; host, prevents double advance |
| POST | `/api/v1/rooms/:id/game/:session/round/:round/response` | `{kind:'accept'|'decline'|'skip'|'stop', request_id}`; own participant only |
| POST | `/api/v1/rooms/:id/game/:session/stop` | soft terminal stop; member safety override or host finish, audited without secrets |
| GET | `/api/v1/rooms/:id/game/current` | safe projections, localized card resolved separately by server for self |
| POST | `/api/v1/rooms/:id/music/actions` | `{play|pause|seek|next|select,track_id?,position_ms?,expected_rev}` host only |
| GET | `/api/v1/rooms/:id/music/state` | queue/track/epoch/rev + licensed metadata |
| GET | `/api/v1/music/tracks/:id/stream` | auth, HTTP Range `206`, small bounded response, no arbitrary path |
| POST | `/api/v1/rooms/:id/cinema/publish-token` | host, short-lived constrained LiveKit publisher grants |
| POST | `/api/v1/rooms/:id/cinema/subscribe-token` | member, short-lived LiveKit subscriber grants |
| POST | `/api/v1/rooms/:id/close` | host, idempotent, revokes published state |
| GET | `/health/live`, `/health/ready`, `/api/v1/version` | documented schemas, local and edge distinct; no secrets |

**Example (start session):**

```json
{"draft_rev":12,"idempotency_key":"b8532d91-3e1e-4cfe-a22d-a7af7bcd8c20"}
```

```json
{"session_id":"d9fe7955-cdc7-4856-b6ba-8fbdc8db9421","state":"active","game_rev":1,"snapshot_schema":1}
```

**Validation:** 400 malformed, 401 no identity, 403 wrong scope, 404 room inaccessible (avoid leaking validity), 409 stale rev/active session, 410 room expired, 422 unsafe/insufficient cards, 429 rate limit, 503 dependency not ready. Все ошибки имеют machine `code`, `request_id` и краткий локализуемый diagnostic summary без токенов.

## 7. WebSocket event contract

Endpoint `/api/v1/rooms/:id/events` через Nginx `Upgrade`. При соединении одноразовый ticket, server snapshot по авторитетной revision; reconnect получает snapshot и events >= known revision, а при неизвестной истории — полный state. `client_action` всегда подтверждается ACK/idempotency, `round_selected` высылается только после транзакционного commit.

```json
{
  "schema":1,
  "event_id":"01JKEXAMPLE000000000000001",
  "room_id":"6f76d0f6-a541-4edc-a42d-7ab0178aa210",
  "room_rev":19,
  "stream":"game",
  "stream_rev":6,
  "type":"game.round_started",
  "server_time":"2026-10-18T12:00:00Z",
  "payload":{"session_id":"...","round_index":4,"interaction":"pair_private","visibility":"public_status_only"}
}
```

**Event types:** `room.member_joined`, `room.member_left`, `room.closed`, `music.state_changed`, `cinema.publisher_changed`, `game.session_started`, `game.round_started`, `game.round_completed`, `game.session_completed`, `game.private_prompt` (ONLY target participant), `game.consent_requested` (ONLY target), `game.consent_resolved` (public generic outcome without reason), `error.authorization`. No raw directed edges, comfort levels, full private texts or reasons for refusal in public events. `WebSocket` и HTTP используют общий ACL module.

## 8. Cinema / WebRTC media flow

**Capture:** desktop primary profile = browser tab capture with video/audio via `getDisplayMedia({video:true,audio:true})` / LiveKit screenshare helpers. Пользователь выбирает конкретную вкладку и разрешает audio. Треков 0 audio => `AUDIO_NOT_CAPTURED`, UI советует выбрать «вкладка + поделиться звуком». Захват protected/DRM content может быть запрещён, обход невозможен.

**Media security:** host получает publish grant только на свой media room, guest — subscribe only. Media identities привязаны к room_member_id; сервер отзывает доступ/отключает participant при closed/removed/lease expiry. Не публиковать токены в URLs/logs. Raw stream не проходит через Fastify/Nginx. В REST/WS идёт только signaling/control, media — WebRTC через LiveKit UDP/optional TCP; host publisher lease = один активный screen_source.

**Ports:** LiveKit signaling `127.0.0.1:7880` → host-managed Nginx HTTPS/WSS vhost; media **UDP 7882** при настроенном `rtc.udp_port`; резервный ICE/TCP **7881** только после security review. Не создавать coturn по умолчанию; если сеть требует TURN, пройти отдельное network/exposure decision (встроенный relay/отдельная управляющая компонента по policy). Существует альтернатива широкому UDP range 50000–60000, но не открывать одновременно без причины. Проверить ICE candidate advertised public IP.

**Mobile publisher:** Android MediaProjection + разрешённый AudioPlaybackCapture; iOS ScreenCaptureKit/ReplayKit и реальный capture pipeline. Нельзя гарантировать системный звук каждого приложения или браузера; отдельная release readiness table по OS/device/source и permissions, вердикт `[SUPPORTED]` только после A/V smoke. Viewer остаётся веб-клиентом на телефоне.

**Measurements (initial quality targets, not established results):** p95 audiovisual offset <=120ms; p95 viewer-to-viewer skew <=500ms в согласованной обычной сети; p95 glass-to-glass <=2s при хорошей сети; каждое измерение маркируется средой, браузером, аудио output, samples и percentile. При недостижении — DEGRADED и metric-backed ADR, не ложное «без задержки». Видео 720p/30 FPS начальный ориентир с adaptive layers; при слабой сети корректно падает качество, но не синхронность звука.

## 9. Music synchronization and acoustic policy

**Authoritative music tuple:** `(track_id, queue_revision, state, base_position_ms, effective_at_server_utc, music_rev)`. Backend обновляет tuple транзакционно; play/seek/next — только host; присоединённый клиент вычисляет target position от калиброванных clock samples (NTP-like RTT median): `target_ms = base_position_ms + max(0,client_estimated_server_now - effective_at)`, если playing.

**Join:** media preload/HTTP Range, user interaction to unlock autoplay, local `play()` с обработкой `NotAllowedError`; playback blocked => явный «Включить звук» без ошибочного статуса «играет». `local_volume` 0..1 остаётся исключительно client state, не WS. `track_id` резолвится только на лицензированный asset; произвольные URL host вводить нельзя в music library.

**Drift control:** каждые ~3–5 секунд измерять `target - currentTime`; до ~80ms ничего, 80–300ms корректировать мягкой регулировкой playbackRate 0.98–1.02 с restore, свыше ~300ms после seek/buffer perform bounded seek и показывать re-sync. Это предлагаемые пороги; тесты по браузерам обязательны. Не «гонять» seek во время буферизации. Все действия host idempotent; при stale music_rev клиент запрашивает state.

**In person:** `primary_output_member_id` = host по умолчанию, физически **только одно устройство транслирует в общую колонку**. Другим отображается текущий трек и локальная кнопка «Воспроизводить у себя» только для наушников; массовое включение колонок предупреждается. Индивидуальная громкость общего динамика для разных людей физически не реализуема; интерфейс не обещает обратного. Смена primary output — host-only явная операция с fade/stop old, then start new и проверкой generation token.

**Audio focus policy:** при старте Cinema music ставится на паузу по умолчанию; возобновление — после cinema stop или host подтверждения. В будущих Calls локальный audio ducking опционален, но не должен автоматически записывать/mix чужие голоса. Наушники могут дать индивидуальное смешивание Cinema, music и call без побочных глобальных изменений.

## 10. Game & Relationship contract overview

Формальный алгоритм в [08](08_RELATIONSHIP_ENGINE.md). `RelationshipEngine.selectNext(snapshot, history, cardPack, entropy)` работает на сервере и возвращает `round_plan` с назначенными игроками, типом public/private interaction, `card_id@revision`, требуемым согласием и immutable provenance (`engine_version`, `pack_digest`, `policy_rev`) без raw edges в публичном payload. Игровая система никогда не читает строки карточек, чтобы сделать вывод о допустимости — применяются строгие метаданные.

Snapshot фиксируется в БД до round 1 и включает selected 2–8 active member IDs, directed graph, comfort каждого, meeting context, game mode, round count, policy version, card pack digest. Все значения приватных отношений зашифрованы и не включаются в web-visible snapshot. При возвращении в Games после выхода сохраняются draft preferences, но не «замораживают» все будущие новые sessions.

**Offline-compatible tasks:** физические действия доступны лишь в `in_person`; online использует действия дистанционно через Venus. При приватной паре обе стороны подтверждают готовность; дальнейшее возражение немедленно прекращает private moment. Уход физически возможен только в `in_person`; online private room/chat — отдельный безопасный функционал в составе Games (см. ADR-007).

## 11. Privacy, data protection and secrets

- Предпочтения каждого: encrypted-at-rest поле (AES-256-GCM с уникальным nonce на запись и versioned key, ключ в secret boundary, **не** в DB и не в HTML). AAD включает room_id+member_id+schema. Изолированная функция decrypt доступна только engine/session setup и self-auth endpoint.
- До запуска автор видит только **готовность** индивидуальных настроек участников, не их значения. После запуска не передавать `comfort` и social edge в публичном stream.
- Consent decisions/priv chat: target-scoped доступ, TTL, отсутствие content telemetry; не делать E2EE-заявление, пока криптографический протокол не внедрён/проверен. TLS/DB encryption защищает другие границы.
- Удаление комнаты должно каскадно удалять отношения, снимки, приватные сообщения; бэкап шифруется, `.env` исключён (Part 04). Нужен процедурный канал удаления/revoke.
- Threats: stolen invite link, XSS, WS origin bypass, repeated brute force join, forged host token, CSRF, leaked stream grants, malicious content generated cards, screenshots, inference attacks on crush, bad locale placeholders, playlist licensing.
- Use CSP, HTTP-only cookies, `Strict-Transport-Security` at ingress, rate limits, body caps, origin verification, content escaping (`<`, `&`), no raw HTML card render, dependency scanning. Access-control tests must use **two** independent authenticated users and unauth attacker.
- GDPR/прочие применимые требования требуют отдельной legal assessment до обработки личных отношений в реальном продукте; документация не заменяет правовой анализ.

## 12. Error contract and observability

**Levels:** `live` (process), `ready` (DB/migrations/core), `media_ready` (LiveKit/token/UDP path), `music_ready` (licensed library), `public_edge` (TLS+WS), `game_ready` (pack counts/locales/engine). `media_ready` failure не должна делать ложное «полностью готов»; если отдельный модуль недоступен — UI показывает `DEGRADED` с конкретным отключённым модулем.

Metrics: active rooms/members, join rejection rate, WebSocket reconnects, per-track buffering, median/p95 playback drift, WebRTC RTT/jitter/loss, A/V offset/skew measurements (без кадров/аудио), card pool coverage by policy class (агрегировано), consent refusal **не связывать с идентифицируемыми отношениями**. Логи: UTC, request_id, service_version, image_digest, stage, sanitized error code, no relation/comfort/text/tokens. Тесты error taxonomy для 400/401/403/404/409/422/429/5xx и dependency timeouts.

## 13. Нефункциональные критерии и тест-профили

| Параметр | Приёмочный профиль |
|---|---|
| Concurrent members | 8 in room, one active host, duplicate socket rejoin, 9th reject; multi-room load separate measured gate |
| API | p95 <300ms для CRUD под целевой нагрузкой (proposed), exclude live media |
| WS | idempotent duplicate requests, out-of-order events, reconnect snapshot, no private leak |
| Media | реальный 1 publisher + 7 subscribers, audio & video, 3 сети: нормальная, throttled, UDP-blocked |
| Music | 8 online listeners, pause/seek/next/join, locked autoplay recovery, clock drift measured |
| Games | 2..8, all six categories, each comfort 0..4, progression 1..4, context × modes |
| UI | 320/375/768/1024/1440/1920px, zoom 200%, RU EN TR, pointer+keyboard |
| Reliability | after process restart: durable rooms/preferences and state truth; no phantom active publisher |
| Security | URL guess failure, revoked member, XSS in names/card content, privacy inference checks |

### 13.1. Physical capacity estimate (not guaranteed VPS performance)

720p stream 1.5–3Mbps from publisher × up to 7 egress receivers => roughly 10.5–21Mbps media egress before protocol overhead. Music 192kbps ×8 => ~1.54Mbps additional when active, plus websocket overhead. Нужны фактические burst/CPU/RAM/storage/egress measurements и выбор допустимых нагрузочных лимитов; нельзя объявлять план пригодным без VPS benchmark.

## 14. Upstream technical sources (проверено 2026-10-18)

- MDN screen capture: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia — user gesture, HTTPS, необязательный аудиотрек.
- MDN autoplay: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — `play()` может быть заблокирован без взаимодействия.
- LiveKit screenshare audio: https://docs.livekit.io/transport/media/screenshare/ — tab + share audio зависит от браузера.
- LiveKit network ports: https://docs.livekit.io/transport/self-hosting/ports-firewall/ — 7880 signaling, 7881 ICE/TCP, 7882 UDP mux optional.
- Android playback capture: https://developer.android.com/media/platform/av-capture — playback audio доступен только при соответствующих разрешениях и правилах источника.
- Apple ScreenCaptureKit: https://developer.apple.com/documentation/screencapturekit ; ReplayKit: https://developer.apple.com/documentation/replaykit — без обещания захвата каждого источника.
- Spotify Developer Policy: https://developer.spotify.com/policy — запрещённые сценарии noninteractive broadcasting/games/AV sync.

## 15. Не готово без исследования

`SPIKE-MobileAndroidAudio`, `SPIKE-MobileIOSAudio`, `SPIKE-DRM`, `SPIKE-VPS-SFU`, `ADR-007-private-online-channel`, `ADR-004-license`, `ADR-005-retention`. Это блокеры точных обещаний, а не разрешение пропустить тесты.
