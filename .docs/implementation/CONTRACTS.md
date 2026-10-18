# P00 · Контракты реализации P00-2

**Статус:** замороженный кандидат для разработки и review; не production API. Основание — [02](../02_TECHNICAL_ARCHITECTURE.md), [08](../08_RELATIONSHIP_ENGINE.md), [09](../09_CARD_AUTHORING_AND_AUTOMATION.md). Уточнения оформлены в ADR-010/011; Прямые решения U-001…004 приняты; U-005 разрешает получение норм, но не исключение из них.

## 1. Состав и версии

| Контракт | Версия / источник истины |
|---|---|
| HTTP G1 | [OpenAPI 3.1](../contracts/api.v1.openapi.json), API major 1, candidate P00-2 |
| Public/self/private projections | [JSON Schema](../contracts/projections.v1.schema.json), schema 1, additionalProperties=false |
| WS | [JSON Schema](../contracts/events.v1.schema.json), schema 1; discriminator type определяет payload и audience |
| Автоматы | [Машинный реестр](../contracts/state-machines.v1.json), semantic guards этого документа |
| DB | таблица инвариантов §5; исполняемая миграция создаётся и проверяется в P02 |
| Карточки / policy | существующие CARD-1 / RE-1, без изменений; pack фиксируется digest |
| Эталон правил | `tools/p00_rules_reference.py`; проверяет guards/consent, не подменяет production planner P03 |

Изменение кандидата требует новой contract revision, impact review и повторных тестов. После появления клиентов breaking изменение — новая версия/совместимое окно по 05. Нельзя менять in-flight snapshot или пересобирать старый pack с тем же digest.

## 2. HTTP, identity и ошибки

Room/member/session/round IDs — server-generated UUID. Имя — plain text, до 48 grapheme, не ACL. RU/EN/TR выбирается каждым. Значение `name` при create и `display_name` при join сохраняет исходный контракт; сервер приводит их к одному доменному DisplayName, не переписывая текст имени.

Invite token имеет минимум 128 бит случайности, хранится как hash/HMAC; host capability в invite не входит. После join — room-scoped HttpOnly/Secure/SameSite cookie. Мутации cookie-auth требуют проверенных Origin и CSRF; create/join также проверяют Origin/rate/body limits. HTTP schemas не доказывают эти transport guards. Нет CORS `*` с credentials.

OpenAPI фиксирует G1 и необходимые additive routes: безопасный resolve приглашения, получение нового WS ticket, explicit neutral setup, изменение контекста вне игры, own scoped private prompt/consent и pair-text channel при capability. Resolve проверяет действительный invite, возвращает только opaque room ID/availability без имён и настроек; join повторно проверяет capacity под lock. Они требуют проверки на P02/P05. Music/Cinema остаются контрактами будущих этапов в 02; G1 возвращает `FEATURE_UNAVAILABLE`, не фиктивный успех.

При мутации обязательны idempotency key и expected revision там, где уже существует ресурс; создание имеет только key, start — `draft_rev` + key. `expected_rev` для room/context/profile/leave/close/prepare означает room revision, для preferences/explicit skip — self preference revision, для advance — game revision. Ответ `rev` относится к тому же ресурсу; OpenAPI дополнительно указывает `x-revision-scope`. Safety responses имеют собственный request ID и проверку текущего scope вместо обязательного stale room revision: устаревшее состояние не должно блокировать отказ. Idempotency scope = room + authenticated member + operation + key; сохраняется canonical request hash. Повтор того же тела возвращает прежний разрешённый результат, иного тела — 409. Replay выполняется до проверки устаревшей revision и новой capacity, но после текущей авторизации: отзыв доступа не позволяет повторно прочитать приватный результат. Срок записей должен покрывать жизнь операции; окончательный retention согласуется с ADR-005.

Ошибки — strict `{code,message,request_id}`. `message` — безопасное диагностическое сообщение, UI отображает локализованный текст по code; тело не содержит raw DB exception, invite, preferences или private prompt. 400 malformed, 401 no identity, 403 wrong scope, 404 inaccessible/unknown, 409 conflict/locked/full, 410 expired link для публично проверенного приглашения, 422 insufficient safe pool, 429 rate limit, 503 dependency unavailable. Различие 404/410 не выдаёт постороннему существование комнаты: доступ проверяется до подробной диагностики.

## 3. Публичные, собственные и парные данные

| Projection | Получатель | Разрешено | Запрещено |
|---|---|---|---|
| RoomView / PublicRound | текущие члены этой комнаты | members/id/name/locale/role/presence/setup_ready; state/revisions; публичные actors/card/text для public round | чужие comfort/edges, encrypted snapshot/seed, weights/class/initiator, private card ID/text, кто/почему отказался |
| SelfPreferences | только authenticated owner | собственный comfort, outgoing edges + explicit flags, setup state | входящие edges, чужие preferences; host privilege не даёт исключения |
| PairInvitation | только два назначенных actor | offer ID, scope, нейтральный invitation, deadline и own consent state | raw отношения/объяснение выбора, содержимое приватного задания до двух accept |
| PrivatePrompt / PairMessage | только actor принятой активной пары | локализованный prompt / ephemeral текст | другие комнаты, неучастник-host, доступ после revoke/end/expiry |

PublicRound имеет вид `public` или `generic`. `generic` содержит только round ID/index/state и не допускает card ID, actors или текста. Публичное событие private phase никогда не доставляет секретный card ID: по нему также можно восстановить содержание. Privacy-тесты включают вложенные поля и payload cache; UI hiding не считается ACL.

SelfPreferences хранит outgoing edge как `{relation, explicit}`. Missing/skip → `friendship`, `explicit=false`, comfort0. API явного submit отмечает выбранные edges explicit; explicit skip — отдельная операция. Host видит ready boolean, не значения. Неявный timeout не является выбором игрока.

U-001 принят: минимальный private text chat входит в G1. До реализации/проверок capability unavailable, после P03/P05 включается сервером. При включении доступны только text/plain до 2000 Unicode code points, без вложений/HTML, только active consent scope, pagination с bounded page, server timestamp. Данные ephemeral, не логируются; при end/revoke удаляются из primary, backup policy определяется ADR-005. Это server ACL + encryption at rest, не E2EE.

## 4. WS, revision и атомарность

Одноразовый ticket выдаётся через authenticated POST, TTL 60s. Передача — первым auth frame по WSS, не URL/query/logs; до успешной auth нет snapshot и событий. Повтор/expiry/wrong origin отвергаются. При reconnect клиент запрашивает новый ticket и получает safe snapshot; replay допускается только из журнала с тем же ACL. При неизвестной истории — fresh snapshot. WS transport schema не заменяет membership ACL.

Envelope: `schema,event_id,room_id,room_rev,stream,stream_rev,type,server_time,audience,payload`. Для `audience=member` есть только текущий target member ID; фактический socket определяется сервером. Клиент не выбирает себе audience. Room events не содержат private payload. Revisions — неотрицательные safe integers до 2^53−1; сервер останавливает генерацию на переполнении, BIGINT из PostgreSQL не отдаётся непроверенным number. Клиент держит high-water mark каждого stream и сверяет room snapshot revision; запоздавшее событие не откатывает state.

Порядок каждой операции: authenticate/authorize → validate input → DB lock → повторная проверка текущего доступа → idempotency lookup/replay → для новой операции проверка scope/revision/capacity → изменение+rev+safe outbox в одной транзакции → commit → dispatch по целевым ACL. Перед отправкой private event проверить актуальное согласие/membership; в outbox не хранить raw private text/edges, только адресуемый reference и ограниченный TTL.

Join блокирует room row; считаются active + reconnect-reserved slots, максимум8 включая host. Same identity заменяет socket с generation fencing. Heartbeat20s, presence45s, reservation90s — предложенный baseline 02; освобождение слота отделено от права восстановить preferences. Возврат после освобождения места повторно проверяет capacity, не вытесняет нового участника. Host grace10min не означает автоматического избрания нового host или закрытия.

Start блокирует room и draft; проверяет selected 2…8 IDs, explicit setup/skip, context, pool, no active/paused session; создаёт encrypted snapshot, закреплённые pack/policy/seed и round1 атомарно. Advance блокирует active session; unique `(session_id,round_index)` + idempotency исключают второй round. Snapshot не меняется при join/spectator/locale/новом pack. Отсутствующего actor нельзя молча заменить; раунд безопасно пропускается/сессия паузится по state contract.

Consent endpoints проверяют authenticated actor, current offer, TTL и room/game scope. На один round допускается один immutable offer ID; завершённое/отклонённое предложение не переоткрывается, новое требует нового round ID. Поэтому запоздалый accept не применяется к новому предложению. Decline побеждает конкурентный accept: обработка сериализована, поздний decline отзывает уже активную пару. Timeout при `now >= expires_at` не согласие. Приватный prompt до обоих accept не отправляется. Stop разрешён любому game participant без права отвечать за другого.

## 5. DB: обязательные ограничения и миграции

SQL-пример из 02 не применяется как миграция. Первая реальная SQL migration в P02 должна реализовать эти ограничения и пройти PostgreSQL integration; локальный P00 не утверждает наличие БД.

| Таблицы / данные | Ограничения / транзакции |
|---|---|
| rooms, room_members | room FK; composite unique `(room_id,id)` для ссылок внутри комнаты; host FK `(room_id,host_member_id)` на member той же комнаты, deferrable для создания; room lock при admission; role guard; закрытая комната terminal |
| active slots / presence | уникальный slot 1…8 на room для active/reserved; reservation и socket generation обновляются атомарно; historical join_order не переиспользуется как identity |
| private_preferences | unique room+owner; FK на члена той же комнаты; comfort0…4; encrypted edges, explicit flags, key version + уникальный nonce; AAD room/member/schema; plaintext edges не отдельная SQL column |
| game_sessions | partial unique room WHERE state IN active/paused; immutable encrypted snapshot, seed, schema, engine/policy/pack digest; round_count1…100; session participant FKs/проверки room membership |
| game_rounds, round_actors | unique session+index; card ID/revision pinned; actor FK на snapshot participant; не хранить actor IDs только непроверенным UUID array; round update под session lock |
| private_pair_consents / messages | offer+actor unique; exactly two distinct authorized actors; expires_at/state; transaction locks и отзыв; private content encrypted при хранении; TTL deletion |
| idempotency_keys | unique operation scope/key, request hash, committed result; conflict при другом body; operation identity не задаётся display name |
| content_pack_releases | unique immutable digest, reviewed provenance; atomic active pointer; active snapshots удерживают нужные revisions; отзыв безопасности имеет приоритет |
| outbox / audit_events | commit-same-transaction; unique event ID; scoped routing; audit только allowlisted metadata; sensitive fields отсутствуют |
| session keys / tokens | только verifier/hash и key version references, grants short-lived; серверные encryption keys отдельно от БД/backup ZIP |
| music/media state | отдельные модули и миграции P08/P09, без единственного exclusive `active_mode` |

Для каждого изменения schema: expand → compatible deployment/backfill → validation → отдельный contract cleanup после поддержки rollback window. Проверяются upgrade, constraint negatives, crash/rollback и старый клиент. DB down не считается достаточным доказательством обратимости. Restore сверяет scope/checksum/keys и применяет deletions/revocations до открытия доступа. RPO/RTO и backup expiry до production требуют владельца/оператора.

## 6. UI, domain и compatibility boundaries

Веб — React/Vite/TS, API — Fastify/TS, DB — PostgreSQL; SQL migrations явные и версионированные, schema generation monotonic. ADR-010 фиксирует этот технический кандидат; exact runtime/library versions/lock устанавливаются в P01 после проверки поддерживаемости. Production engine/server ACL не импортируются в browser bundle; frontend получает только projection types.

Locale меняет только текст; все участники видят один card ID/revision/round. Пароль/регистрация не требуются для гостевой комнаты. Переключение main focus не завершает независимые module states. Нет глобального overflow:hidden, делающего отказ недоступным; reduced motion/keyboard/reflow обязательны. Перечень проверяемых сценариев — [UI_FLOWS](UI_FLOWS.md).

Кандидатные автоматики, schema tests и эталон правил — evidence спецификации. Доказательство реального encryption, ACID, transport ACL, browser accessibility и consent race возможно только на P02/P03/P05. Публичный G1 требует >=100 reviewed карточек/режим и G1/release/deployment gates; 12 drafts и P00-тесты эту границу не снимают.

## 7. Принятые уточнения P00-2

U-002: room-only, idle24h, primary delete<=24h after close, backup<=7d. Restore до открытия доступа повторяет expiry/deletion/revocation. Это обязательные сроки реализации и проверок, а не уже работающий процесс.

U-003: на первом открытии — прочитать действующую оферту, явно принять её и подтвердить18+. Create/join/invite resolve передают strict EntryAcceptance; сервер сверяет version+digest с утверждённым документом и ставит собственные timestamps, привязанные к identity. Отказ/неподтверждённый возраст не дают входа; checkbox не отмечен заранее. Повторный вход с действующим room session проверяет актуальность серверной записи; смена offer version требует own reacceptance до новых non-safety действий. Decline/skip/stop/leave и завершение приватного доступа остаются доступны в authenticated scope. Нет сбора даты рождения, документов или биометрии и обещания проверки возраста. Сам текст/версия оферты ещё не опубликованы; public entry при отсутствии утверждённого текста blocked. См. service-entry-policy.v1.json.

Truth or Dare: own designated actor вызывает round/choice с side truth|dare. Выбор сериализован под round lock и фиксируется один раз; duplicate request возвращает прежний side, конфликтующий side даёт409. Round projection содержит choice/response_state, один side во всех локалях; сервер не меняет metadata eligibility выбранной стороны.

Yes, But: только P2 вызывает round/condition с собственным непустым текстом до2000 code points; текст доставляется только P1/P2 scoped event game.pair_condition, не public broadcast. Condition — предложение ограничения, не согласие P1 вместо него. Оба подтверждают конкретную версию предложения; изменение условия отзывает прежние accept, новая независимая пара подтверждений нужна до действия. Старый request не принимает изменённый текст. В общем статусе только response_state; condition не публикуется автоматически.

Private moment: finish командой round/finish (или kind finish) завершает доступ; обе формы имеют одинаковую scoped идемпотентность. Invitation expires_at30s отделён от active_until=момент второго accept+180s. На границе now>=active_until prompt/chat недоступны, даже если фоновый cleanup ещё не сработал. Новый offer/new round не наследует старые accept. Продление G1 не реализуется молча: нужен отдельный bilateral protocol/ADR.


## 8. Независимые consent scopes и pause

Согласие на нейтральное приватное приглашение (`scope=invitation`) открывает только текст/канал. Оно **не** является согласием на ещё не раскрытое физическое/YesBut действие. После reveal создаётся отдельный immutable action offer (`scope=action`, свой offer_id и proposal_revision). Accept в HTTP обязан передать scope/offer_id/proposal_revision; сервер проверяет их против текущей роли/round/offer. ActionConsentRequest scoped event доставляется действующим actor, не всей комнате. Старый accept invitation никогда не засчитывается как action accept.

Пока invitation active, P2 может изменить pending action condition через round/condition с текущими offer_id/proposal_revision. Это очищает обе action acks и повышает revision; invitation/channel остаётся active. Изменение уже active action запрещено409 — новое действие требует нового round. Новая версия условия требует fresh accept P1 и P2. Public pair использует тот же action-consent протокол без приватной invitation; текст condition всё равно scoped только паре. Decline/stop без scope безопасно прекращает текущий round/private context; scoped action decline не раскрывает причину группе.

Invitation имеет pending TTL30s, после двух accept private budget180s. Отдельный action pending TTL30s ограничен оставшимся временем private budget. Чтение проверяет текущее время до каждого доступа. Action authorization не живёт дольше invitation и не означает, что физическое действие было выполнено. Finish private context отзывает оба scope. Пауза не продлевает ни один deadline и не меняет snapshot.

Участник игры может вызвать game/pause (safety pause), host — game/resume после повторной проверки membership и текущего consent scope. Переходы включены в state-machines; reconnect сам не оживляет истёкшее private action. Кнопки stop/leave доступны независимо от паузы и новой версии оферты.

Visual DIV разрешён прямым решением владельца: [DIV-20261018-01](DIV-20261018-01.md). Custom comfortable UI Venus сохраняется; upstream файлы не изменены, security/a11y/release/recovery остаются применимыми.

Для reconnect actor получает own action state через round/action-consent и ранее заданное condition через scoped GET round/condition (404 если условия нет). Они не возвращаются в RoomView. PrivatePrompt.state=active означает active invitation/channel, а не согласие на конкретное действие. Обе consent revisions/offer IDs серверные и закреплены на раунд; повтор/переподключение не продлевает сроки.

Candidate freeze фиксирует room-scoped guest sessions отдельно от operator Access Key. Полная применимость single-operator разделов к consumer guest surfaces остаётся CONDITIONAL в central-applicability.csv и решается до затронутой реализации P02; P00/P01 не выдают это за доказанное runtime соответствие. Визуальное направление уже явно решено пользователем и не требует повторного согласования.

## Review round2: pause causes и время авторизации

GameView/SessionStatus включают pause_reason=null|transport|safety; причина фиксируется сервером. Автоматический reconnect-resume разрешён только transport pause для той же проверенной identity и после membership/consent reconciliation. Safety pause снимает только host явной resume командой; reconnect её не обходит. Resume очищает pause_reason и не продлевает сроки. Expired scopes закрываются/раунд безопасно пропускается до resume; старые accept не оживают. Проверка action consent требует now>=max(invitation.last_at,action.last_at), поэтому момент до последнего ack не авторизован.
