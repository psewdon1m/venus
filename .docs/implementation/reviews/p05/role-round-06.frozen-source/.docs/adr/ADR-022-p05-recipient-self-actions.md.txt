# ADR-022 · Собственные игровые действия без раскрытия скрытых ролей

Дата: 2026-10-19. Статус: реализация требует привязанных Docker proof и независимой проверки. Основание: P05-ROLE-001/002 в [независимой рецензии](../implementation/reviews/p05/role-round-01.md). Это не полный P05 PASS и не человеческое одобрение карточек.

## Решение

Общая видимость задания не даёт права его завершать. В Questions group публичный `actors=[]` сохраняется: серверный primary остаётся скрытым. Новый `GET /api/v1/rooms/{roomId}/game/self-actions` возвращает только собственные фиксированные boolean разрешения аутентифицированному получателю. Ответ содержит room/member/session/round/revisions и короткую относительную свежесть. В нём нет чужих ролей, primary, пар, карточек, причин запрета или матрицы разрешений комнаты. Старые GameView/PublicRound, snapshot, P00 schemas и публичный WS не меняются.

Общие assert helpers применяются в существующих авторитетных POST и в display policy. GET не исполняет пробные мутации, не сохраняет состояние, не создаёт audit/outbox/revision. Он использует cookie+CSRF, профиль Origin/Sec-Fetch-Site как приватный GET, запрещает query и синхронно передаёт JSON внутри room/catalogue transaction fence. После всех awaited чтений повторяются аутентификация, entry policy, проверка времени/доступности. Отсутствующий каталог выключает обычные действия, сохраняя собственные safety-попытки; неожиданные SQL ошибки не маскируются. Неполучатель не получает срок скрытого предложения через `expires_at`.

На клиенте пакет привязан к AuthBoundary identity/transport, room revision, game/session/round revision. Поздний ответ, ABA, смена получателя или устаревший DOM callback не восстанавливает действия. Свежесть ограничена локально от начала запроса: `min(5000 ms, expires_at-server_time)`. Часы сервера, включая сдвиг на шесть минут, не продлевают локальный срок. Обычные разрешения после reconnect нужно получить заново.

Ранее подтверждённое право собственной остановки, паузы или host Abort хранится отдельно от краткого display lease. Потеря сети/истечение metadata показывает явное «результат не подтверждён», сохраняя возможность отправить safety POST без ожидания обычного pending. Новое явное false, отзыв, удаление, смена identity/session или terminal game уничтожает прежнее право в клиентском кеше. Это разрешение попытки запроса, а не подтверждение успеха: результат подтверждает сервер. Host вне selected имеет Abort, но не получает участнические Pause/Stop или приватную роль. Наблюдатель сбрасывает собственные настройки; кнопка не обещает завершить чужую игру.

Оба приватных Truth/Dare выбора исчезают после committed choice. Same-side идемпотентный POST остаётся разрешён, opposite-side сохраняет `CHOICE_LOCKED`. Finish, Skip, Choice, condition и отдельные согласия показываются по собственным разрешениям, а POST каждый раз повторяет ACL/consent/state checks.

### Дополнение ROLE006 · Конкретный отказ в degraded режиме

Короткий display lease не заменяет фактический срок уже известного собственного предложения. После свежего own boolean и аутентифицированного scoped offer/proposal клиент сохраняет только minimal refusal metadata, ограниченную точными identity/session/round/game revision и локальной относительной границей предложения (максимум30s pending/180s active, от начала исходного metadata запроса). Повторные наблюдения/clock skew не продлевают эту границу. Первое поступление offer после истечения display lease не создаёт разрешение; требуется новый свежий цикл. Ни текст/партнёр, ни accept/choice/Finish не переходят в retained ресурс.

При скрытии private cache показывается generic own Decline/Withdraw и при подтверждённом праве Skip; новый обработчик использует существующий server-authoritative POST. Старый callback после transport generation не работает. Явный false, включая deny-only поздний аутентифицированный отрицательный ответ, clear/new revision/offer/proposal/removal/terminal отзывает ресурс. Обычный stalled запрос не блокирует этот отказ. Это завершает текущий раунд; полная остановка остаётся отдельным действием. Shared contract/API и исторические9-case proof не меняются; новый SA10 и независимая проверка обязательны.

## Проверка и откат

Матрица policy/actual-module tests и актуальный набор фактических Docker сценариев определены в [P05_SELF_ACTIONS](../P05_SELF_ACTIONS.md). Browser completion требует реальных UI кликов primary Finish → host Next; HTTP helper/SQL не выполняют эти два действия в этом сценарии. Native zoom, все браузеры, реальные устройства, production и полный этап отдельны.

Откат возможен согласованным образом API/UI после остановки новых игр. Additive route/type можно игнорировать старым читателем, но несовместимый новый UI должен закрывать обычные affected controls и сохранять самостоятельные safety endpoints. Откат не разрешает раскрыть primary в общем snapshot, ослабить POST ACL или возобновить отозванные согласия. Исторические proof и рецензии не переписываются.

### Уточнение ROLE006 · Отстающие часы сервера

Проверка minimal refusal evidence отделена от private payload TTL. Raw authenticated own response проверяется по точным session/round/scope/offer/proposal/state/expiry; сравнение с локальными абсолютными часами применяется к приватному тексту, но не должно уничтожать ещё действительную относительную возможность отказа. Сохранение требует свежего captured own token и ограничено прежним request-start-relative deadline/caps. Text/actors/partner и Accept не сохраняются. Active prompt даёт только minimal exact binding с тем же expiry; action body v1 session-bound точным authenticated request path. SA11 добавляет измеренный behind-server-clock сценарий в новом реальном Chromium context, меняя только client Date.now и не перематывая сервер. Исторический10-case PASS этого случая не покрывает.
