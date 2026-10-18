# P02 · Независимая проверка входных требований

Дата: 2026-10-18. Reviewer: `/root/p02_entry_review`. Область: read-only анализ принятого P00/P01 и условий начала P02. Проверенная Git-база: `934d9a1efcccfb4380e708a8f5143a43efbc3a71`. Центральный источник: `general.git@4449e65d732ca44b91cec5a6f3ca16c2c618578f`.

Результат: **ENTRY SCOPE RESOLVED WITH OBLIGATIONS**. Это не EXIT-P02 PASS и не проверка работающего API. Исходники не изменялись; создан только этот отчёт. Новое решение владельца для локальной реализации P02 не требуется при перечисленных ниже границах. Публичный вход остаётся закрыт до утверждения текста оферты.

## Основания и предел вывода

[План P02](../../../10_IMPLEMENTATION_PLAN.md), строки 111–132, требует guest admission, room-scoped права, real PostgreSQL, reconnect, encryption и локализованный room shell. Он не требует операторского login/settings/backup/update UI на P02. [CONTRACTS](../../CONTRACTS.md), строки 21–29, 46–58, 90–92 и 113–121, различает guest room sessions и operator Access Key, но оставляет surface applicability к разрешению перед P02.

[Part00](../../../source-snapshots/central-4449e65/PART_00_SYSTEM_UNIFICATION_SPECIFICATION.md), строки 170–184, говорит именно о browser-based **operator applications** и защите **operator data**. [Part07](../../../source-snapshots/central-4449e65/PART_07_SECURITY_AND_EXPOSURE_CONTROL.md), строки 399–424, задаёт route-specific exposure и Access Key для browser operator profile. [Part01](../../../source-snapshots/central-4449e65/PART_01_INTERFACE_AND_INTERACTION_UNIFICATION.md), строки 487–501, помещает single-operator/Access Key в Login View. Поэтому технически обосновано отнести этот login к операторскому интерфейсу, а consumer guest-комнаты — к отдельной модели capabilities, уже требуемой архитектурой и принятыми HTTP security schemes. Это вывод по области действия, а не исключение из центральной нормы.

До identity реализации исполнитель должен зафиксировать это в ADR/surface registry и уточнить CONDITIONAL запись Part01 §4 в [central-applicability](../../central-applicability.csv), строка 11. Нельзя объявлять весь §4 неприменимым: Access Key и операторская авторизация остаются обязательными до появления соответствующих функций на P06. Custom comfortable style уже разрешён DIV-20261018-01 и не даёт исключения из auth/security.

## Матрица identity и поверхностей

| Поверхность / действие | Неавторизованный посетитель | Room member | Room host | Operator / machine |
| --- | --- | --- | --- | --- |
| Consumer shell и текущая оферта | Только публичные безопасные тексты; без room/member данных | Те же тексты | Те же тексты | Операторская identity не нужна |
| Create room | Только current offer + explicit18+, Origin, body/rate limits, idempotency; создаётся новая server identity | То же создание новой room identity; без переноса чужих прав | Создатель получает host только новой комнаты | Access Key не даёт неявной room identity |
| Resolve invite | Действительный opaque invite + current EntryAcceptance; только opaque room ID/availability, без имён | Нет дополнительных данных | Нет дополнительных данных | Не операторская функция |
| Join | Invite даёт право admission, не host; room lock/capacity + acceptance | Existing valid identity восстанавливается без второго слота | Только прежняя host identity сохраняет host | Нет универсального операторского join bypass |
| RoomView / snapshot / WS room stream | Отказ | Только текущая собственная комната, safe projection | Та же projection; чужие setup values недоступны | Access Key не является room cookie/WS ticket |
| Own profile, locale, preferences, explicit skip | Отказ | Только self, room-scoped session; mutation CSRF/Origin/revision/idempotency | Только self, без чтения чужих comfort/edges | Нет операторского decrypt/self bypass |
| Context / close и будущие host game controls | Отказ | Отказ | Только текущий host этой комнаты; context вне active/paused game | Операторский доступ не означает host |
| Leave / будущие decline, stop | Отказ без identity | Только authenticated own/participant scope; актуальность оферты не блокирует safety exit | Те же safety права; close отдельно host-only | Не механизм машинного управления |
| Logs / export / restore / update / shared-agent configuration | Отказ / маршрут отсутствует | Отказ / маршрут отсутствует | Отказ / маршрут отсутствует | До P06 поверхность отсутствует; при появлении Access Key-derived operator session + own authorization/CSRF; host не operator |
| Host-agent enrollment/control | Нет | Нет | Нет | Только отдельно scoped machine credential; operator cookie/Access Key не заменяет его |

Основания: [OpenAPI](../../../contracts/api.v1.openapi.json), RoomSession security scheme строки 1952–1955, operation-specific `x-authorization`, create/join/resolve/close/self endpoints; [CONTRACTS](../../CONTRACTS.md), §§2–5; [Part02](../../../source-snapshots/central-4449e65/PART_02_OBSERVABILITY_AUDIT_AND_LOG_EXPORT.md), строки 230–245 (operator export); [Part13](../../../source-snapshots/central-4449e65/PART_13_HOST_DEPENDENCIES_AND_EXTENSION_GUIDE.md), строки 96–104 (machine principal); [Part10](../../../source-snapshots/central-4449e65/PART_10_SERVICE_AGENTS_UI_AND_OPERATOR_WORKFLOWS.md), строки 49–72, 163–170 (scoped panels и owning operator API).

## Численные обязательства и lifecycle

| Значение | Требуемое поведение / граница |
| --- | --- |
| Capacity 8 включая host | Считать active + reconnect-reserved слоты; room row lock; повторить race минимум 100 раз на PostgreSQL; девятая identity отвергается |
| Invite entropy ≥128 bits | Криптографический random; в БД hash/HMAC; invite никогда не содержит host capability |
| WS ticket TTL 60s | Одноразовый server grant, atomic consume; `now >= expires_at` запрещено; первый auth frame, не URL/query; before auth нет данных; Origin проверяется |
| Heartbeat 20s, presence TTL 45s | Параметры принятого технического baseline; stale socket не вправе менять presence после generation replacement |
| Reservation 90s | Задать однозначный server timestamp начала и boundary `now >= reserved_until`; освобождение слота не удаляет preferences и не гарантирует последующий admission при full room |
| Host grace 10min | Фиксировать и проверять отдельно от reservation; не закрывать комнату и не переизбирать host автоматически после disconnect или grace |
| Room idle 24h | Принято владельцем U-002; технически определить meaningful activity и проверить границу synthetic clock. Рекомендуется не считать служебный heartbeat активностью пользователя, иначе открытая вкладка отменит idle expiry |
| Primary delete ≤24h после close | Access немедленно отзывается при закрытии; удаляются room private preferences, sessions/grants, private content/snapshots, operation results/outbox references. Retention не продлевается replay/restore |
| Backup ≤7d | Удаление/expiry/revocation повторно применяются до открытия восстановленной копии; backup не содержит runtime bearer tokens, plaintext keys или `.env` |
| Revision 0…2^53−1 | Монотонная scoped revision; overflow fail-closed; stale conflict; high-water mark на клиенте; snapshot при reconnect |
| Имена ≤48 grapheme | Plain text, не identity/ACL; серверные UUID; XSS не должен становиться HTML |
| Preferences comfort 0…4 | Missing/skip = friendship, explicit=false, comfort0; явный submit/skip отличается от timeout |
| Future consent 30s / 180s / 30s | Invitation pending30s; после двух accept private budget180s; отдельный action pending30s не дольше invitation. P02 не выдаёт их за реализованные; P03 должен сохранить эти значения |

Источники: [архитектура](../../../02_TECHNICAL_ARCHITECTURE.md), строки 137–145, 260–265; [CONTRACTS](../../CONTRACTS.md), строки 23–29, 40–58, 67–75, 90–107. Heartbeat/presence/reservation/grace первоначально названы baseline/tunables; принятие этих конкретных технических параметров в P02 ADR и boundary tests достаточно, нового продуктового решения не требуется. Точный срок room-cookie отдельно не установлен: выбрать явно в ADR, ограничить room lifecycle/действительностью identity и не превращать его в cross-room профиль.

## Consent, приватность и отказ по умолчанию

1. [service-entry-policy](../../../contracts/service-entry-policy.v1.json), строки 1–33: approved version/digest/text сейчас `null`, readiness `NOT_PREPARED`. Отсюда public create/join/resolve должны отвергаться; нельзя заменить null самопринятой production офертой. Интеграционным тестам допустим явно synthetic fixture с отдельным digest и изолированным test profile. Страница обязана показывать фактическую недоступность публичного входа. Реальный юридический текст требует владельца до P05/public admission.
2. Unchecked consent18+/offer; сервер сверяет version+digest и сохраняет собственные UTC timestamps/member. Смена версии требует own reacceptance до новых non-safety действий. Не собирать DOB/documents/biometrics и не называть self-declaration проверкой возраста. Источник: [CONTRACTS](../../CONTRACTS.md), строка 92; [ADR-006](../../../adr/ADR-006-age-content.md), принятое решение P00-2.
3. Cookie HttpOnly/Secure/SameSite и room scope; strict Origin + CSRF для cookie mutations, Origin/rate/body checks для unauth create/join/resolve; no credentialed wildcard CORS. Authn/authz перед idempotent replay, под lock повторная проверка; один key с иным body = conflict. Reconnect не переиспользует WS ticket и не наследует role по имени/invite.
4. AES-256-GCM, unique nonce, key version, AAD room/member/schema; ключ вне БД и стандартного backup, encrypted edges без plaintext SQL columns. Self-only decrypt; host видит только readiness. Room projection/event additionalProperties=false; nested payload/cache/browser bundle не содержат чужих comfort/edges/seed/snapshot или private card ID. Источники: [CONTRACTS](../../CONTRACTS.md), §§3–5; [projections](../../../contracts/projections.v1.schema.json), строки 29–73, 116–228; [events](../../../contracts/events.v1.schema.json), envelope/audience contract.
5. Audit mutation metadata записывается в той же транзакции, без private payload. Safe outbox references и bounded TTL; structured logs не содержат cookies/tickets/invites/body/private preferences/error stack secrets. [Part02](../../../source-snapshots/central-4449e65/PART_02_OBSERVABILITY_AUDIT_AND_LOG_EXPORT.md), строки 17–81 и 83–120, требует также count/age/bytes bounds; исходный baseline audit 10,000 events /30d /64MiB не является разрешением хранить room private data 30d. U-002 private deletion имеет собственный более короткий срок.
6. [Part03](../../../source-snapshots/central-4449e65/PART_03_BACKUP_AND_RECOVERY.md), строки 28–47, 136–214, 372–404: до state schema обязателен include/exclude/compatibility/key recovery scope audit. P02 нужен реальный synthetic backup/restore/identity checksum + retention reapply и обратимость upgrade совместимым image; полный operator ZIP/update workflow остаётся P06.

## Findings / обязательства до EXIT-P02

| ID | Severity | Наблюдение | Закрытие |
| --- | --- | --- | --- |
| ENTRY-01 | Implementation obligation | CONDITIONAL guest/operator scope до P02 ещё требует явной фиксации | ADR + route/surface registry + applicable section update; negative test запрещает room-host доступ к operator routes; не менять immutable snapshots |
| ENTRY-02 | Public-entry blocker | Реальная оферта не утверждена и отсутствует | Fail-closed runtime при unapproved policy, synthetic-only test policy; реальный текст и утверждение владельцем перед public admission P05 |
| ENTRY-03 | Implementation obligation | Для baseline timers не определены исходные timestamps и точные границы | P02 ADR с 20s/45s/90s/10min, test clock на deadline±1ms, ясная active/reserved accounting; no auto host promotion/close |
| ENTRY-04 | Implementation obligation | Persistence вводит новые recoverability и deletion границы | SQL constraints/migration upgrade/backward compatibility/real restart+restore+deletion tests, secrets absent from DB/backup; key separate |
| ENTRY-05 | Deferred P06 external dependency | Нет утверждённой Venus dependency row/операторского deployment profile | Не добавлять агенты или «ready» controls по аналогии. [ADR-008](../../../adr/ADR-008-central-agents.md), Part09 §§1–3, Part13 §§2,5 остаются открыты до P06; локальную P02 работу не блокируют |

EXIT-P02 нельзя объявить зелёным на основании этого отчёта: обязательны актуальные runtime/DB/browser/ACL доказательства и отдельная независимая итоговая проверка с input hashes. Изменение scope, разрешающее room-host операторские функции или публикующее вход без действующей оферты, отменяет этот вывод и требует нового review; материальное отклонение центральной auth нормы требует DIV по Part00 §1.

## Хеши ключевых входов

| Файл | SHA256 |
| --- | --- |
| `10_IMPLEMENTATION_PLAN.md` | `d3b423ca33d9a4f5a63335ae5bd4309536f69b0ffc9c6276257e2cf16a98640d` |
| `implementation/CONTRACTS.md` | `1e5fdce8fa8f766c85175324ce0c43b6fa6dc5c484ea77e266b7e18630520e77` |
| `contracts/state-machines.v1.json` | `d9653e7fe7bee7e5deb3697968f2af818cd8fef7d0fa2c2e547853604fc0cf8e` |
| `contracts/service-entry-policy.v1.json` | `51eac6362bd95e3df6655d4d83c08a6280a980f312861d0162ea652477660377` |
| `implementation/central-applicability.csv` | `0d8796eb772ba119e0a190dd9ad398fc30dccab2d889d36a33bb0fd195fd3d57` |

Центральные пофайловые SHA сверены с pinned provenance; scope вывода ограничен перечисленными источниками и принятыми пользовательскими решениями, не утверждает фактическую production соответствующесть.
