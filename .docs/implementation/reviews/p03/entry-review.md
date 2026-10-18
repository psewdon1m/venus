# P03 · Независимый входной review

Reviewer: `/root/p02_entry_review`. Дата: 2026-10-18. Проверенная база: `6efcb7d37d9fe4fc43db411e1e40052301a5175d` (main после P02); accepted P02 tag `p02-accepted-20261018` указывает на `12a028b`. Область: требования и дизайн начала P03; runtime, симуляции и итоговый гейт этим отчётом не принимаются. Изменён только этот review-файл.

Вывод: **IMPLEMENTATION MAY PROCEED WITH OBLIGATIONS**. RE-1 и P00 contracts позволяют реализовать реальный engine на синтетическом тестовом pack, сохраняя закрытым публичный Games. Перед измерениями необходимо зафиксировать отдельный protocol revision и хеш с формулами, seeds, наборами профилей и порогами. Аддитивный engine migration stream совместим с core generation1 только при отдельном readiness и проверенном quiescence/revocation перед возвратом к P02 image.

## Источники и порядок применения

Нормативная область — [08 Relationship Engine](../../../08_RELATIONSHIP_ENGINE.md), §§1–17; [план P03](../../../10_IMPLEMENTATION_PLAN.md), строки 132–150; immutable [RE-1 policy](../../../contracts/relationship-policy.v1.json); [API](../../../contracts/api.v1.openapi.json); [FSM](../../../contracts/state-machines.v1.json); [P00 CONTRACTS](../../CONTRACTS.md), §§2–8 и Review round2. Для публикации pack обязателен [09 Card pipeline](../../../09_CARD_AUTHORING_AND_AUTOMATION.md), строки 5, 14–17, 62, 154–159, 265–282. Алгоритмические baseline в 08/policy помечены PROPOSED: их реализация требует ADR и измерений, но не изменения immutable источников задним числом.

Более поздние уточнения P00-2 задают отдельные invitation/action scopes и точные сроки; общая фраза 08 §8 «extend only both explicitly» не разрешает реализовать несуществующий API продления. P03 сохраняет конечный budget180s без продления. Policy stage2 target private0.08 — мягкий ориентир, а min progression stage3 — hard guard; stage2 private остаётся0. Это приоритет ограничения, не изменение policy.

## Обязательства по каждому EXIT-P03

| Критерий | Что должно работать | Конкретное доказательство |
| --- | --- | --- |
| EXIT-P03.1 | Production engine exports Resolver/ComfortGuard/Progression/Planner/Eligibility/Consent/AuditProjection; RE-001…018; все36 directed combinations, comfort0…4 обоих, два context, N2…8, три режима, total rounds1…100 | Машиночитаемая RE-ID→test→evidence матрица; точные assertions поверх production engine, а не одного P00 reference; exhaustive pair/class/comfort/context/stage; границы progression N1,2,3,20,100, r1/last и четверти; default friendship explicit=false; X hard veto; IR↔IR только R |
| EXIT-P03.2 | Не менее10000 synthetic sessions на каждый N2…8, ноль нарушений всех15 инвариантов; невозможный профиль безопасно отказывает | Минимум70000 sessions; counts/seeds/profile IDs/mode/context coverage; проверка каждой реально выбранной карточки и affected actors; same hard filters для fallback; private/contact не авторизуются без consent; unknown pack/policy/metadata отвергаются |
| EXIT-P03.3 | Детерминированные snapshot/history/seed/policy/pack→одинаковый plan; idempotent start/advance; lock preferences при active/paused; safety доступна | Golden replay exact card@revision/actors/round ID scope; PostgreSQL concurrent start/advance; единственная active/paused session и round(session,index); same key replay до stale rev, но после текущей авторизации; different body conflict; encrypted pinned snapshot не меняется; API contract использует PUT preferences, проверять действующий route, а не добавлять PATCH ради формулировки плана |
| EXIT-P03.4 | Настоящие authenticated HTTP/WS + PostgreSQL; only own actor consent, decline wins, timeout не accept, revoke закрывает private prompt/chat | Два независимых actor, nonactor host, spectator, outsider, unauth client; forged member/offer/rev/room, expired/replayed ticket; обе serial race order и конкурентные calls; read/send сразу после revoke/end/expiry; private card ID/text/condition отсутствуют в room event/cache; private ciphertext/HMAC/padding/privacy regression P02 сохраняются |
| EXIT-P03.5 | Fairness/inference protocol принят до измерений; distributions/limitations; нет deterministic technical label channel | Датированный protocol+SHA до первого run; raw synthetic aggregate counts и формулы обоих denominators; отдельные holdout seeds; точные пороги ниже; фиксировать FAIL и новый revision при изменении, не подгонять порог под результат; независимый privacy review |
| EXIT-P03.6 | Pinning переживает pack/policy refresh, reconnect, locale/spectator; unknown version и empty safe pool дают явную ошибку | Active snapshot hash до/после каждого события и API restart; exact old pack retention; новая session получает новую seed/ID и не копирует consent; locale меняет только текст; no identity replacement для отсутствующего actor; old revision обслуживается совместимым engine или безопасно завершается |

Источники: 08 §§4–7, 9–17; CONTRACTS строки 27, 48–58, 65–76, 94–119; FSM game/consent guards; plan EXIT-P03. Технический гейт требует source-bound report и отдельных итоговых агентов после реализации, не только этот entry review.

## Consent и privacy: точные условия

- Invitation pending deadline = proposal server time +30s. Только два назначенных distinct actor принимают независимо; до обоих accept нельзя раскрывать private card ID/text. При `now >= deadline` accept запрещён.
- После второго invitation accept active_until = server activation time +180s. Приглашение открывает только prompt/channel, не согласие на само действие. До **каждого** private read/message send/dispatch проверять current room membership, invitation state и часы.
- Отдельный action offer после раскрытия имеет собственные immutable offer ID/revision; deadline `min(action_created_at+30s, invitation.active_until)`. Две новые независимые action acknowledgements; текущая authorization bounded invitation.active_until. `now` до последнего ack не считается разрешённым. Action accept не фиксирует выполнение физического действия.
- Только P2 задаёт Yes, But condition≤2000 Unicode code points; изменение pending condition отзывает все старые action acknowledgements, старый request не принимает новую revision. Condition доставляется только P1/P2, даже для публичного раунда. Truth or Dare side выбирает только designated actor, фиксируется один раз под lock; противоположная side при replay conflict, eligibility обеих сторон до выбора одинакова.
- Decline/stop побеждает accept: сериализация под session/offer locks, поздний decline переводит уже active offer в stopped; terminal offer не переоткрывается. Отзыв/timeout/end закрывает оба scope. Нельзя перепредлагать тот же immutable offer до согласия после отказа.
- Safety pause participant и transport pause различаются server pause_reason. Reconnect разрешает auto-resume только transport pause той же identity после consent reconciliation; safety pause снимает host явным resume. Пауза не продлевает сроки; stop/leave/decline доступны при stale room rev или новой версии оферты после scope auth.
- Contact всегда in_person +comfort4 обоих +separate action bilateral consent +safe context. Going-away требует in_person и bilateral consent; без GPS/microphone/location/proof. Online pair_private требует фактического защищённого pair text capability; до него карточки маскируются недоступными. Calls/music/cinema controls остаются unavailable.

Источники: 08 строки 130–142, §§11–15; policy consent; CONTRACTS строки 58, 94–119; state-machines consent scopes/guards. Encryption/keyring/room-only retention остаются из принятого P02: snapshot/seed/condition/message/idempotent reply не попадают в public audit/outbox/logs; bounded opaque reference допускается после проверки актуального ACL. Не заявлять E2EE.

## Разрешение denominator max50% invitations

В 08 строка160 и RE-1 fairness field `max_share_pair_invitations_per_member_when_safe_alternatives=0.5` denominator явно не задан. При K парных предложениях суммарное число individual appearances равно2K. Если применить `appearances_i/K <=0.5` ко всем N=3 участникам, сумма даст `2K <=1.5K`, что невозможно при K>0. Вообще такой критерий требует N≥4 независимо от planner и seed; объявлять его выполненным для N3 нельзя.

Рекомендуемая семантика ADR: **одно pair offer создаёт две individual invitations**; D=2K, `individual_share_i = appearances_i/(2K) <=0.5`, когда есть безопасные альтернативы. K=0 → показатель N/A с нулевыми counts. Публиковать также `pair_offer_participation_i=appearances_i/K`, чтобы не скрыть выбранное определение. N2 закономерно даёт participation1 и individual_share0.5; разнообразие партнёров невозможно и не обещается. Для rejected/expired invitations считать факт committed proposal, а не только accepted, чтобы отказ не поощрял давление повторным выбором.

Это разрешение неопределённого термина, сохраняющее значение policy0.5, допустимо как технический ADR до реализации. Оно **не** доказывает равномерность: одна постоянная пара тоже имеет share0.5 каждому. Поэтому независимо обязательны downweight recent participants, no consecutive identical private pair при реальной альтернативе и balanced-profile measurements. Если владелец имел в виду долю именно pair offers, потребуется отдельное продуктовое изменение для N3; данный review не утверждает математически невозможный вариант и не меняет immutable policy.

Safe alternative означает candidate, проходящий все hard guards, available membership/capabilities и unused-card availability **в момент принятия решения**. Нельзя обосновывать исключение одной «безопасной» карточкой, уже использованной/недоступной по context/consent. Исключения записывать агрегированными reason counts с synthetic profile ID; production logs не содержат social graph.

## Предварительная методика fairness/inference

Следующие численные пороги — независимая рекомендация **для фиксации до первого измерения**, не выполненные результаты и не уже принятое изменение policy. Исполнитель должен закрепить принятый набор в отдельном protocol/ADR; если выбраны иные допуски, повторить входной review до запуска simulation.

| Измерение | Предлагаемый заранее фиксируемый порог / дизайн |
| --- | --- |
| Safety / hard guards | Ноль нарушений15 инвариантов на всех≥70000 sessions и exhaustive cases; один fail блокирует |
| Individual invitation share | ≤0.5 по D=2K, когда есть safe alternatives; K=0 отдельно; N2 ограничения указаны |
| Private anti-repeat | Ноль consecutive identical private-pair proposals при наличии хотя бы одной admissible unused alternative; исключения отдельно |
| Exchangeable fairness | На симметричных synthetic graphs с равными comfort/capabilities, полный balanced catalog, агрегированная разница max−min individual shares≤0.02 для каждого N/mode/context с достаточным pair count; не требовать равенства на asymmetric/veto graphs |
| G отличается от F | Matched eligible pools и отдельный controlled conditional-pair opportunity experiment: G/F sample rate ratio>1 с95% CI lower>1. Иначе веса формально есть, но не влияют. Не ослаблять fairness/hard filters ради этого теста |
| Progression | min private stage3 соблюдается точно; stage1/2 private0; private rounds≤ceil(0.25*total_rounds), включая declined proposals; stage4 не обязан быть романтическим. Fully eligible balanced profile late-stage private frequency выше early; unsafe profile quota не форсируется |
| Recovery / no-repeat | p0.35 recovery применяется только после intense card и при существовании безопасного softer pool; отчёт conditional trials/CI. Ноль повторов card@revision при достаточном unused eligible pool; нехватка safe fallback/error, не downgrade safety |
| Inference structural | Ноль public fields/recursive values/URLs/cache/raw error channels, детерминированно декодирующих class, weight, initiator, чужой comfort/edges, private offer actors/card ID/condition или кто отказал |
| Inference statistical | Предварительно выбрать F/G, F/M, G/M matched-profile binary experiments с одинаковыми public confounders; train/test seeds disjoint; фиксированные features только доступного observer transcript; AUC95% CI upper≤0.65 на holdout. Если классы различаются по допустимым публичным карточкам, отдельно проверять catalog/card-ID semantics как канал, не скрывать его удалением feature из attacker model |

Зафиксировать до запуска: протокол generator и profile mix, sample count, round-count distribution1…100, class balance, context/mode mix, synthetic pack digest, policy/engine revision, seed derivation, classifier/CI algorithm, paired experiment, fail/N/A rules. Утверждение «перекрытие есть» без численной методики недостаточно. Отчёт должен показывать per-stage eligible counts, distribution overlap, exceptions, confidence intervals и pair-invitation denominators. Не публиковать реальные user graph или per-member production frequency metrics.

Нельзя обещать нулевую социальную выводимость: 08 §12 признаёт наблюдаемые реальные действия и пары. При этом неизбежность social side-channel не оправдывает direct technical deterministic label channel. Если публичная карточка разрешена только R и её ID/текст однозначно раскрывает R, это finding; убрать label поле недостаточно.

## Synthetic pack и human review P04

P03 тестирует production engine code на **явно synthetic pack**; fixture ID/provenance/manifest подтверждают только автоматическую тестовую область. Не переводить12 исходных draft карточек в reviewed, не вписывать agent как human reviewer, не включать такой pack в production/default public Games. Допустим изолированный synthetic runtime/profile, fail-closed при отсутствии публичного approved pack и действующей оферты. Public release требует P04 human safety/editorial/RU-EN-TR/rights review и≥100 reviewed оригинальных карточек каждого режима; P03 engine PASS не заменяет этого.

Синтетический fixture должен использовать ту же metadata/schema/eligibility ветку production engine; отдельный небезопасный selector под testmode не доказывает correctness. Synthetic permission принимается только из server-controlled test environment/profile, не query/header/поля браузера. Нужны negatives для forged reviewed status, неполных локалей, mismatch pack digest, unknown policy и unsolicited synthetic pack injection. P03 public capability остаётся unavailable вне разрешённого synthetic profile.

## Engine migrations и возврат к P02

Принятый [core migrations.ts](../../../../apps/api/src/migrations.ts) имеет schemaGeneration1 и fail-closed `max(generation)!==1`; его schemaProbe проверяет10 основных таблиц, дополнительные игнорирует. Это технически позволяет **аддитивную** extension schema с отдельной `venus_engine_schema_migrations` и checksums, сохранив неизменными core migration001/checksum и `venus_schema_migrations`.

Условия допуска stream:

1. Engine migration имеет собственные monotonic generation/checksum/известный набор, transaction+advisory lock, явно определённый порядок core→engine. Unknown future engine generation/checksum mismatch → API readiness unavailable и engine operations fail-closed, не ready по одному core probe. Core generation1 в version/health не выдаётся за доказательство engine готовности; extension revision отражается в отдельном совместимом manifest/diagnostic contract.
2. Только новые engine tables/indexes/constraints; room/member scope FK, room deletion cascade на snapshots/rounds/offers/messages/idempotent engine results. Не менять core row layouts/constraints/таймеры так, что old image больше не исполняет принятый P02 scope. Не использовать P02 schemaGeneration1 для молчаливого изменения уже принятой core schema.
3. Upgrade из точного P02 DB и повтор migrate проверяются реально; concurrent migration/ошибка посередине/checksum tamper/future generation отказ и откат транзакции. Existing room identities/preferences/retention и restore сохраняются. Disposable backup включает extension state по явному include/exclude contract; decryption key отдельно; restore применяет expiry/revocations до доступа.
4. **Rollback — не просто запуск old image.** Old P02 не знает active engine sessions, поэтому без quiescence может менять preferences/context в active snapshot, не отзывать private consent при membership change и не обслуживать engine endpoints. Перед переключением: заблокировать новые starts; текущие sessions довести совместимым engine либо безопасно terminalize; revoke invitation/action/message access; прекратить private dispatch; подтвердить это транзакционно; затем включить P02 image с Games unavailable. Snapshot не пересчитать, старый consent не оживлять.
5. Проверить сценарий P03→P02→P03 на реальной PostgreSQL с активной synthetic session перед rollback: P02 rooms/self/leave/close работают; нет private access; room close cascade удаляет extension rows в срок; при возврате P03 terminal sessions/consents не resume, новая session получает новые ID/seed. Оставшиеся encrypted historical engine rows допускаются лишь в пределах U-002 retention, не как продолжающийся session.

Отдельный stream при этих условиях — explicit compatibility contract, а не обход core fail-closed: старый core остаётся совместимым с **безопасно выключенной** extension. Если невозможно безопасно quiesce или engine меняет core-инварианты, нужен иной upgrade/rollback дизайн; объявлять прежний image совместимым нельзя.

## Addendum: public common-support repertoire

До реализации и первого simulation исполнитель предложил дополнительный privacy guard: public cards только с `min_comfort=0` и `relationship_scope=none|acquaintance`, а sensitive class/positive-comfort/physical cards — только если их исходный interaction уже `pair_private` и выполняются все его hard guards. Это допустимое консервативное ограничение capabilities/repertoire, соответствующее 08 §§11–12 и EXIT-P03 privacy, при фиксации ADR. Нового решения владельца для такой local/synthetic реализации не требуется: спецификация не гарантирует публичную выдачу deep/physical cards каждому профилю.

Нельзя автоматически менять `solo/group/pair_public` на `pair_private`: class/comfort-sensitive карточка с публичным interaction становится недоступной, а при отсутствии другой подходящей карточки возвращается safe pool error. Публичный neutral fallback проходит все прежние hard guards. P04 должен честно измерить coverage именно этого профиля и подготовить соответствующие private cards; ограниченный профиль не выдаётся за покрытие произвольного pack. Метаданные min_comfort0 не заменяют человеческий семантический review текста.

Class сохраняет мягкое влияние на sampler: предложенная смесь90–95%uniform и5–10%RE-1 numeric prior допустима как PROPOSED algorithm baseline, но до измерений требуется выбрать **одно точное значение** epsilon, закрепить формулу нормирования, область uniform support, replay version и CI доказательство G/F difference. Нельзя подбирать epsilon после просмотра holdout AUC и скрывать предыдущий FAIL. Original RE-1 weights/матрица остаются immutable входами; эффективные веса нового algorithm profile описываются отдельно, не выдаются за исходные1.0/1.25 напрямую.

Общий public support для всех non-X классов устраняет однозначное декодирование M/S/R из public card ID, но не превращает наблюдаемую историю в математически независимую от графа. Hard X veto обязан исключать directed pair, а отношения предписано сохранять влияющими на вероятности; потенциальные социальные/статистические ограничения отражаются в inference report. Обещание — отсутствие direct deterministic secret/class/comfort label channel и измеренная bounded leakage по заранее заданной методике; нельзя заявлять zero inference для любого возможного наблюдателя. У private generic дополнительно проверяются вложенные поля, WS recipients, host projection, payload size, message counters, error/timeout paths и доступность private card через catalog endpoint.

## Findings и остаточные рубежи

| ID | Severity | Обязательство |
| --- | --- | --- |
| P03-ENTRY-01 | Required before simulations | Зафиксировать fairness denominator и prereg protocol+SHA; immutable RE-1 не менять; no retrospective threshold fitting |
| P03-ENTRY-02 | Required before runtime integration | Два независимых consent scopes, deadlines30/180/30, decline precedence, current ACL/time на каждом private read/send/dispatch |
| P03-ENTRY-03 | Required before migration acceptance | Separate checksummed stream +engine readiness +реальный safe rollback, запрещён rollback active engine без quiescence |
| P03-ENTRY-04 | Public Games blocker until P04/P05 | Human-reviewed pack/rights/locales отсутствует; synthetic-only code/test scope и fail-closed public default |
| P03-ENTRY-05 | Required before EXIT-P03 | Actual≥70000 session report, production engine RE-001…018, real HTTP/WS/DB races/restart/privacy и два independent final reviews; этот report не является runtime PASS |

Нового решения владельца для локальной P03 реализации в этих границах не требуется. Human editorial approval остаётся внешним действием P04, действующая публичная оферта — P05. Автономное поручение не заменяет их фиктивной отметкой.

## Хеши проверенных inputs

| Input | SHA256 |
| --- | --- |
| `08_RELATIONSHIP_ENGINE.md` | `579095425bf4f261c44700f898e2349d7632472f20930c838f4bb83a81d4c384` |
| `10_IMPLEMENTATION_PLAN.md` | `d3b423ca33d9a4f5a63335ae5bd4309536f69b0ffc9c6276257e2cf16a98640d` |
| `contracts/relationship-policy.v1.json` | `6c5ae5a82cb9419668342c7fdce5d72c0c85e14759bcc4acb0f44829889c726f` |
| `contracts/api.v1.openapi.json` | `77d4e7eeed862ac26bbd48ec96c47b62fd48c7647af4f5ea4cd930fddac410f9` |
| `contracts/state-machines.v1.json` | `d9653e7fe7bee7e5deb3697968f2af818cd8fef7d0fa2c2e547853604fc0cf8e` |
| `implementation/CONTRACTS.md` | `1e5fdce8fa8f766c85175324ce0c43b6fa6dc5c484ea77e266b7e18630520e77` |
| `apps/api/src/migrations.ts` | `15edd903f76744a1555e1f7ec80d40cfa5ecc1a4d25919b0099b2231cb45614d` |
| `apps/api/src/rooms.ts` | `a31df17f7b50e7d57b3f7a9beda5a728913a2ada1f873536760a1830da48b399` |
| `apps/api/src/backup.ts` | `7d0a56ca82abbdc96ab7a0939d53eef4eba7c0765c23e8bb2d152160e6ae503d` |
