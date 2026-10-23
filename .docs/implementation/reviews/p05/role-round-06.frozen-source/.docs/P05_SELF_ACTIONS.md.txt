# P05 · Recipient self-actions

Текущая реализация исправляет P05-ROLE-001/002. Статус при создании документа: implementation preflight, Docker и независимый review впереди. Полный P05, человеческий review450 и production не приняты. Контракт: [game-self-actions.v1](contracts/game-self-actions.v1.schema.json); решение: [ADR-022](adr/ADR-022-p05-recipient-self-actions.md).

GET `/api/v1/rooms/:roomId/game/self-actions` — персональные display boolean поля с фиксированной формой. Он не принимает member ID, не публикуется в shared snapshots/WS, не является bearer authority и не заменяет POST ACL. Собственные Stop/Pause и host Abort различны; чужой primary остаётся скрытым. Общие mutation/display assertions сохраняют прежние коды и идемпотентность. Серверный safety projection не зависит от доступности catalogue ledger. Финальный read-only enqueue повторяет auth/entry, selected presence/heartbeat/reservation и consent clock checks; ничего не записывает.

Клиент не сравнивает expires_at с локальными абсолютными часами: относительный срок ограничен 5000 ms от локального начала запроса. Старые identity/transport/room/session/round/revision и ABA ответы/обработчики отвергаются. Свежий false отменяет старое положительное safety знание. Краткая TTL или временная потеря сети сама по себе не лишает известного участника возможности запросить Stop/Pause: показывается явная неопределённость, успех подтверждается сервером. Обычный pending не блокирует safety.

Дополнение ROLE006: для конкретного отказа от раунда нужны одновременно свежий own boolean и аутентифицированные scoped offer/proposal/expiry. Только после этого клиент сохраняет минимальные данные отказа без текста, партнёра или разрешения accept. Локальная граница — начало исходного metadata запроса плюс относительный срок предложения, максимум30s pending/180s active. Позднее наблюдение не продлевает известную границу; первое наблюдение после5s display lease не создаёт разрешение. Private cache при потере связи скрывается, а новая generic кнопка отказа может отправить существующий authoritative POST в пределах собственного срока. Старые DOM handlers, новая revision/round/identity, изменившийся offer/proposal, explicit clear/false/removal/terminal отменяют возможность. Текущий аутентифицированный false, состарившийся в сети, применяется только как запрет, не как положительное разрешение. Никакое приватное содержимое из этого ресурса не восстанавливается.

## Проверки

Host tests: `npm test -- apps/api/src/game-self-actions.test.ts apps/api/src/self-actions-delivery.test.ts apps/web/src/game-controls.test.ts apps/web/src/game-controls-panel.test.ts`. Actual-module UI scheduler исполняет настоящий TSX и helpers, использует явные API/React doubles и не является браузерным proof.

Изолированный Docker: `npm run test:p05:self-actions -- --allow-dirty` для dirty preflight; без `--allow-dirty` — только clean-source proof. Runner и runtime hardening принадлежат общему P05 harness. Новый test entry — `tests/p05-self-actions/integration.mjs`. Он пишет `self-actions-report.json` с schema_version1, suite=P05_SELF_ACTIONS, exact check IDs, actual details, runtime_cleanup и PASS/FAIL; сам runner отдельно фиксирует inputs/image/cleanup. Не выдавать author suite за независимый gate.

Зафиксированные IDs фактического набора:

| ID | Требуемое реально исполняемое наблюдение |
|---|---|
| P05-SA-01 | HTTPS+PG: group Questions primary/selected nonactor/host outside selection/spectator; shared game WS не содержит own metadata или primary |
| P05-SA-02 | HTTPS: cookie+CSRF/Origin/Sec-Fetch-Site/query/foreign-session negatives; неизменность game revision при projection |
| P05-SA-03 | Приватный TD: после invitation выбор доступен primary; committed choice закрывает обе display кнопки; same-side POST разрешён, opposite-side CHOICE_LOCKED; публично generic; настоящий Chromium не показывает locked alternatives |
| P05-SA-04 | Quiet public: none/one/two invitation acknowledgements; отдельный action; condition только secondary; stale proposal запрещён; Finish после обоих action accepts |
| P05-SA-05 | Настоящее ожидание PostgreSQL table lock; переход 45s heartbeat границы во время await; normal false, Stop/Pause true |
| P05-SA-06 | Настоящий headless Chromium: UI primary Finish → host Next без прямой mutation/SQL замены этих кликов; наблюдатель и host controls/labels; UI reset наблюдателя не завершает игру |
| P05-SA-07 | Настоящий headless Chromium: stalled Finish, серверные часы +6 min, TTL expiry, потеря WS/metadata; явное unconfirmed состояние и подтверждённые сервером Stop и Pause в отдельных изолированных комнатах |
| P05-SA-08 | PostgreSQL row wait и отзыв session row до разблокировки: никакой recipient packet не уходит; это не доказательство owner remove API flow |
| P05-SA-09 | Фактический второй currentAcceptance SELECT блокируется изолированной SQL view/function; срок session истекает во время await; HTTP AUTH_REQUIRED, никакой metadata включая safety; fixture schema восстанавливается |
| P05-SA-10 | Headless Chromium: валидное quiet приглашение, stalled ordinary accept, HTTP metadata/invitation degraded после display TTL; generic Decline без приватного содержимого отправляет POST200, round stopped/session active, host может перейти дальше |
| P05-SA-11 | Fresh headless Chromium context: только Date.now клиента на 6 min впереди реального сервера; измеренное расхождение, private payload/Accept скрыты, HTTP metadata/invitation degraded после display TTL; generic Decline POST200 завершает только round, session active/host advance |

Идентичность inputs, выходы и FAIL→fix→retest раунды находятся в отдельном журнале автора и evidence/reviews. Нет утверждения all-browser/native/mobile coverage от этих функциональных Chromium сценариев. Предыдущие B001–4/UI001–3 регрессии и общий P05 browser matrix продолжают проверяться отдельно после source freeze.

Исторический dirty preflight59a18ec601b8 имеет9/9 PASS на identity e17a8befeb7a90051dd437f12dd1edd56e9a51dcb4d5716efda0a27a8e63b8f0. Он не включал ROLE006/SA10 и не закрывает их автоматически. Предыдущие две FAIL попытки26be4ab8f56b/707de2d2995c сохраняются. Новые исходники требуют отдельного bound10-case запуска и независимого review; этот документ не утверждает его результат заранее.

## Уточнение ROLE006: отстающие часы сервера

Исторический actual dirty preflight28cdc5621986 завершил SA01–SA10 PASS на identity11b47dd77b31ae9b257fb0240c79c01c24818c095a6806be83d6979ced62ebff, cleanup completed. Он покрывал положительный server offset412000ms и HTTP degraded SA10, а не отрицательное смещение или полную потерю WS. Независимый round05 выявил отдельный отрицательный offset: scopePrivate корректно скрывал absolute-expired private payload, но вместе с ним терялись данные для собственного отказа.

Теперь отдельный ownRefusalEvidence проверяет только аутентифицированные path-bound session/round/scope/offer/proposal/state/expiry primitives. Local absolute time при этой проверке не применяется; свежий own token и прежняя относительная граница от начала запроса остаются обязательными. Текст, actors, partner и Accept не возвращаются и не восстанавливаются; private payload TTL не ослаблен. Active prompt используется только как точная minimal binding с тем же expiry. Action v1 не имеет session_id в body и привязан к точному authenticated session path.

Before-fix actual-TSX matrix сохранил FAIL для -360000ms и PASS для0/+360000ms. После исправления74 focused cache/actual-TSX tests PASS, включая malformed/foreign scope, relative expiry/rewind, retained bounds и прежние callback/revision/clear negatives. Текущий producer требует ровно11 fixed SA01–SA11 IDs. SA11 сохраняет монотонные часы реального сервера и меняет только Date.now в новом браузерном контексте до navigation, сохраняя native Date.parse/timers; измеряет разницу с actual self-actions server_time. Новый запуск и независимый review ещё обязательны; предыдущие proof не переписываются.
