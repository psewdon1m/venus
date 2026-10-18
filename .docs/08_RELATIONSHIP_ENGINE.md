# Venus · Relationship Engine — Normative Gameplay Selection Specification

**Владелец:** Game Systems / Privacy / Safety · **редакция:** RE-1.0.0 · **дата:** 2026-10-18 · **статус:** утверждённые пользовательские правила + конкретизированный `[PROPOSED]` алгоритм до реализации/ADR. Распространяется **на каждый режим** `questions`, `truth_or_dare`, `yes_but`.

> **Цель движка — облегчать безопасное и постепенное сближение, а не вычислять реальные чувства или добиваться согласия.** Отношения — приватные субъективные отметки, комфорт — личная граница, игровые задания — только приглашения к действию. Ни один расчёт вероятности не является разрешением на физический контакт, разговор или раскрытие информации.

## 1. Термины и область применения

**Room:** долговременное виртуальное пространство (до 8 отдельных подключённых участников); **GameSession:** конечное выполнение 1–100 раундов с фиксированными настройками; **Round:** одна выбранная карточка/одно взаимодействие; **SessionSnapshot:** неизменяемый с момента начала набор участников и правил; **DirectedEdge(A,B):** личная классификация отношения игрока A к B; **Comfort(A):** один уровень комфорта A для всей игры (не отдельный ползунок на человека); **Progression:** позиция раунда в динамике сессии; **MeetingContext:** `online` или `in_person`; **PairMoment:** взаимодействие A/B в публичной комнате или настоящий отдельный разговор/задача; **CardPack:** проверенная версия коллекции карточек с SHA-256 и policy revision; **Consent:** отдельное добровольное решение конкретного человека, действующее на конкретный момент и отзывное в любое время.

**Логические компоненты** с изолированными тестами: `RelationshipResolver`, `ComfortGuard`, `ProgressionController`, `InteractionPlanner`, `CardEligibilityFilter`, `ConsentCoordinator`, `AuditProjection`. Движок не показывает чужие отношения, не публикует тексты конфиденциальных заданий в WS broadcast, не управляет медиасервером напрямую, не генерирует карточки на лету. Тексты приходят из [09 — Card pipeline](09_CARD_AUTHORING_AND_AUTOMATION.md) через server-side Card Registry.

**Контракт функции:**

```typescript
selectNextRound(
  immutableSnapshot: GameSessionSnapshot,
  previousRounds: ReadonlyArray<PublicOrPrivateRoundHistory>,
  verifiedPack: CardPackRevision,
  deterministicRng: SecureSeededRng
): RoundPlan | SafePoolExhausted
```

`RoundPlan` содержит `round_id`, `round_index`, `card_id`, `card_revision`, `primary_member_id`, `secondary_member_id?`, `interaction`, `required_consents`, `scope`, `preview_public`, `policy_revision`, `pack_digest` и **не содержит чужих raw edges**. Для личной стороны карточки данные доставляются **отдельно** и только целевым участникам.

## 2. Источники данных, право чтения и сохранение

- Комната содержит `room_id`, `meeting_context`, `members[2..8]`, owner `host_member_id`, `locale` каждого (`ru|en|tr`), и active game state.
- При входе каждый участник самостоятельно вводит свои **исходящие** edges к каждому другому активному члену. Для A/B/C это 6 отдельных пар: `A→B`, `A→C`, `B→A`, `B→C`, `C→A`, `C→B`. Никто не заполняет или исправляет чужое отношение от чужого имени.
- Незаполненный edge означает `friendship` **по умолчанию**. Его обязательно отличать от реально осознанного friendship через `explicit=false`, чтобы не считать умолчание доказательством реального доверия. Пропуск всей формы — все исходящие edges neutral-friendship, комфорт по умолчанию 0.
- `Comfort(A)` — одно число 0..4 на участника, а не матрица; оно интерпретируется совместно с обоими направленными edge и текущим этапом. Выбор языка не влияет на selection.
- Settings читаются/меняются **только своим member identity** до начала игры и после завершения; host видит `ready/not ready`, не значения. На старте создаётся **транзакционный encrypted SessionSnapshot**, фиксирующий graph, comforts, players, mode, context, counts, policy, cardpack digest, seed. Любое изменение подготовительных настроек при `active/paused` получает `409 GAME_SETTINGS_LOCKED`.
- Snapshot не пересоздаётся при reconnect, switch Music/Cinema, смене текста UI, join/leave spectators или поступлении нового cardpack. Незавершённая session сохраняет прежнюю логику до конца. Отказ/skip/stop **никогда не блокируется snapshot**.
- После `completed/aborted`, при повторном входе в Games, сервер предлагает `Resume previous setup` или `Edit`: draft edge/comfort/mode/counts остаются, каждый человек может исправить собственный comfort. Новая сессия всегда получает новую seed и новый immutable snapshot. После закрытия всей комнаты история/edges удаляются согласно privacy retention policy; долговременные account-level relations без отдельного согласия запрещены.
- `encrypted_edges` и encrypted snapshots хранятся at rest с версионированным защищённым ключом; в telemetry не пишутся, debugging с реальными данными запрещён. Сервер должен иметь возможность их расшифровать для подбора: **это не E2EE**.

## 3. Классификация directed edges — шесть исходных значений

| Значение | Семантика только для движка | Запрещённые выводы |
|---|---|---|
| `not_a_friend` | дистанция/конфликт/нежелание прямой пары | не объявлять публично причину, не «наказывать» |
| `just_met` | мало общего контекста; безопасное знакомство | не предполагать романтического интереса |
| `friendship` | дружеская связь либо **нейтральный default** | не предполагать доверия для интимного действия |
| `crush` | A испытывает романтическую симпатию к B | не говорить B об этом без решения A |
| `situationship` | A воспринимает связь романтически, но неопределённо | не считать автоматически парой |
| `in_relationships` | A считает связь романтической/устоявшейся | не принимать статус пары, если B не подтвердил свой |

Категории нельзя упорядочить одной арифметикой `0..5` и сопоставлять минимумы без контекста. `not_a_friend` — hard veto, `just_met` — осторожность, `friendship` — baseline, `crush/situationship/in_relationships` дают разные формы инициативы в зависимости от **взаимности** и текущего комфорта.

## 4. Resolver: матрица 36 направленных комбинаций

Матрица определяет **максимальный класс потенциально предлагаемого взаимодействия**, но не гарантирует его выдачу. Строка — A→B, столбец — B→A.

| A ↓ / B → | JM | FR | CR | SS | IR | NF |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **JM** | J | J | J | J | J | X |
| **FR** | J | F | G | G | G | X |
| **CR** | J | G | M | M | M | X |
| **SS** | J | G | M | S | S | X |
| **IR** | J | G | M | S | R | X |
| **NF** | X | X | X | X | X | X |

`JM=just_met`, `FR=friendship`, `CR=crush`, `SS=situationship`, `IR=in_relationships`, `NF=not_a_friend`.

- **X / Avoid Pair:** любые прямые pair/physical/private задания этой пары исключить, даже если другой испытывает crush. Вопросы *всей группе*, не адресованные им друг другу, остаются допустимыми.
- **J / Introductions:** лёгкие неинвазивные вопросы, нейтральный совместный разговор, нет флирта/physical/private separation по умолчанию.
- **F / Friends:** дружеские вопросы, общие воспоминания, забота, юмор; немного публичных парных сценариев, редкие необязательные приватные разговоры (если C и stage позволяют).
- **G / Gentle Initiative:** у одного больше интереса, другой менее романтически ориентирован; **намеренно** немного чаще появляются мягкие возможности для персональной инициативы. Отправитель интереса может предложить песню, разговор, комплимент без раскрытия своего `crush`; получатель не обязан отвечать романтически. Важно: G **не равно F** по распределению и репертуару.
- **M / Mutual Spark:** оба выразили явно совместимый романтический интерес (CR/SS/IR сочетания); больше необязательного парного флирта и тет-а-тет с отдельным согласием.
- **S / Developing Bond:** обе стороны указывают situationship/взаимно более устойчивую связь; допускает более глубокие разговоры и больше приватных возможностей.
- **R / Established Couple:** **только IR↔IR**; максимально широкий разрешённый диапазон заданий для уже существующей пары, но всё равно не сверх личного комфорта.

`J<F<G<M<S<R` — порядок **приоритета pair moments**, а не автоматического права на интимность. Если A=CR, B=FR, `initiator_hint=A`: предложение адресовать от A к B, но B всегда вправе отказаться; запрещено транслировать hint группе. Если оба сообщили CR — никакая публичная подпись «mutual crush!» не показывается. Если комбинация несовместимых edge требует сомнений, выбирается консервативная строка. Matrix v1 фиксируется по `policy_revision=RE-1`; изменение — отдельный changelog/tests/ADR.

## 5. ComfortGuard — глобальный личный ползунок

| Level | Label RU | Допустимый верхний предел (содержательная категория) |
|---:|---|---|
| 0 | Нейтрально | безопасное знакомство, лёгкий юмор, повседневные вопросы |
| 1 | Открытость | личные предпочтения, дружеские воспоминания, доверительные темы без принуждения |
| 2 | Лёгкий флирт | необязательные комплименты, лёгкие романтические намёки/инициатива |
| 3 | Романтика | личные вопросы о чувствах и отношениях; privacy-sensitive, но без физического контакта |
| 4 | Близость | можно **предлагать** физическую близость/контакт в контексте `in_person` при отдельном согласии обеих сторон |

Default = `0`, optional wizard step may be skipped; slider is stepped, not free continuous float. **Нет отдельного comfort для каждой пары.** Eligibility guard должен проверять **каждого действующего участника карточки**: для пары `card.min_comfort <= min(comfort[A], comfort[B])`; для solo — только самого primary; для whole-group — min comfort всех, кого прямо касается карточка, либо текст должен быть безопасен для любого уровня 0.

Изменение slider до/после session допускается только самим участником. Пока session активна — зафиксировано. Пользователь всё же всегда имеет возможность отказа от конкретного задания, запрета обсуждения темы и выхода/остановки; это не «повышение/понижение comfort» в snapshot.

Даже `level=4` **не согласие** на конкретный объятие/прикосновение. Любое действие с касанием требует explicit per-action consent, `in_person`, real in-person presence and safe context. Предложения, требующие изоляции в опасном месте, обнажения, алкоголя, давления, унижения, обмена приватными/чужими данными или сексуального контакта, запрещены генератором карточек независимо от comfort. Возрастная/юридическая политика чувствительных категорий должна быть закрыта до публичного релиза; эстетика 18–25 не заменяет возрастную проверку.

## 6. ProgressionController — близость нарастает по этапам

**Invariant:** progression — ожидание более содержательных моментов, не механизм усиления давления. `max_allowed_depth = min(stage_ceiling, comfort_caps, relationship_profile_limit, contextual/safety constraints)`. После сильного задания разрешён мягкий «отдых»; никакая карточка не обязана быть романтической в финале.

Для `N` раундов и 1-based `r` вычислять `progress = (r-1)/max(1,N-1)`, присваивать stage:

```text
stage 1 (Icebreaker): 0.00 <= progress < 0.25
stage 2 (Connection): 0.25 <= progress < 0.50
stage 3 (Closer):     0.50 <= progress < 0.75
stage 4 (Afterglow):  0.75 <= progress <= 1.00
```

Если N=1, stage=1. При N=20 получаются условно раунды 1–5 / 6–10 / 11–15 / 16–20 (краевые значения именно как выше по округлению). Любое правило карт с `min_progression_stage` не выше текущей стадии; `stage 4` не делает уровень комфорта 4, если у игроков 0.

**Ramp policy `[PROPOSED]`:** целевой состав на stage 1 — преимущественно `question`/group/solo, stage 2 — дружеские pair-public, stage 3 — допускаются больше pair-public/мягкий private invite, stage 4 — больше глубины при разрешающих отношениях. «Больше» определяется статистической частотой в синтетических тестах, а не гарантией личного раунда для конкретной пары. Механизм включает `recovery_slot` после интенсивного задания (с вероятностью ~35% выбирать карточку интенсивностью на 1 ниже разрешённой; seed повторяем); не привязывать вероятность к фамилии/языку/статусу A.

## 7. ContextGuard — онлайн / совместное физическое присутствие

| Контекст | Можно | Нельзя / требование |
|---|---|---|
| `online` | чат, общие вопросы, предложения выбрать трек, диалог/личный text-room, передача экрана | обниматься физически, отойти вместе из одной квартиры, требовать приватный видеозвонок если Calls не реализован |
| `in_person` | все неопасные устные и физические совместные задания при действительном присутствии и согласии; отойти вдвоём | предполагать, что два человека физически могут выполнить задание, если один ушёл; приводить в небезопасное или изолированное место |

Контекст выбирает **создатель комнаты** при создании, и он один для всей комнаты; изменение возможно только вне активной сессии и создаёт новую revision. В обеих средах участники подключены к интернету и используют собственные телефоны, поэтому режим `in_person` не означает offline network mode.

Карточка маркируется `meeting_contexts: ["online"]`, `["in_person"]` или обеими. Если требует `physical_contact`/`requires_going_away=true`, доступна **только** `in_person`. Для online private_pair MVP требует реализованного защищённого приватного текстового взаимодействия; если private communication capability отсутствует, такие карточки не выбираются. Позже можно расширить на call breakout с явным согласием; UI не обещает функцию до готовности.

## 8. InteractionPlanner: типы раундов и real tête-à-tête

| `interaction` | Участники | Визуализация | Consent и пользовательский смысл |
|---|---|---|---|
| `group` | все | одна общая карточка, возможно приватные персональные строки отсутствуют | добровольные ответы; no targeted negative pair |
| `solo` | 1 | вопрос адресован primary; все видят нейтральный prompt | игрок может skip |
| `pair_public` | 2 | общий публичный раунд, стороны с собственными именами | принятие задания личное, физический контакт — отдельное согласие обоих |
| `pair_private` | строго 2 | **обоим** приходит private invitation; остальным показывать только generic `private moment in progress` без раскрытия мотивов | bilateral accept before private content, stop любой стороной в любой момент |

**Настоящее тет-а-тет**, а не только «двое на одной карточке»: `in_person` — добровольно отойти в комфортное/безопасное место, поговорить без публики, сделать безобидное совместное задание; `online` — отдельный закрытый текстовый мини-диалог внутри Games, позднее аудио breakout после G5. Нельзя предлагать выйти за пределы безопасного пространства, уединиться вопреки желанию, сфотографировать/записать разговор, раскрыть чужой секрет, поставить физическую близость как условие продолжения игры.

**Pair-private FSM:**

```text
selected (visible only to pair as invitation)
  -> consent_pending(A,B) [TTL 30s proposed]
  -> if both accept: active [budget 180s proposed, extend only both explicitly]
  -> completed | stopped_by_pair | expired
  -> if any decline/timeout: skipped_private [public generic outcome]
```

Для offline участники физически уходят по желанию, Venus **не отслеживает GPS/микрофон/положение** и не утверждает, что произошло действие. `complete` = участники подтвердили завершение или закрыли prompt, а не доказательство физического контакта. При online private chat текст приватен для пары (server-side ACL, encrypted at rest if stored), TTL и отсутствие переписок в логе; нельзя объявлять E2EE. Участник может отказаться после предварительного accept без штрафа, даже если раунд ещё не завершился. При исчезновении одного/revoke: завершить private session и скрыть доступ.

Другие участники остаются в комнате. Для G1 предлагается пауза общего раунда на срок private moment с кнопкой host `Продолжить` после завершения/тайм-аута; music играет дальше. Позднее фоновая параллельная мини-игра возможна отдельным ADR, не смешивать в G1 с общим счётчиком раундов. Не публиковать `reason=declined_by_B`, если это позволяет социально давить на B.

## 9. Weights: отношения влияют на частоту, не только eligibility

Пример baseline для **относительного веса выбора данной пары** при соблюдении guards (`[PROPOSED]`, тестируется на 2–8 участниках):

| Профиль | Weight | Уместная инициатива | Private moment |
|---|---:|---|---|
| X not_a_friend | 0.00 | запрет targeted pair | запрещён |
| J just met | 0.50 | знакомство | выключен в стартовой политике |
| F friendship | 1.00 | дружеский разговор | доступен c>=1 на поздних стадиях, редко |
| G unilateral crush/situationship vs friendship | 1.25 | деликатный шаг навстречу, с учётом initiator | по приглашению и соответствующему c, реже mutual |
| M mutual romantic indicators | 1.70 | лёгкий флирт / приватный диалог | доступен при c>=required |
| S mutual situationship / deeper | 1.95 | более личные темы | допускается чаще |
| R confirmed couple | 2.20 | устойчивые парные моменты | допускается чаще в конце |

Weights — **только приоритеты**, никогда не проценты или автоматическое назначение; по всей группе применяется fairness/anti-inference. `J/F/G` при `comfort 0` не могут выдавать романтическую/card min_comfort2+, но G может дать некомпрометирующий дружеский шаг и вес чуть выше F. При `N=2` пара присутствует в большинстве paired раундов по определению — inequality guard основан на возможностях, не невозможном обещании равного количества партнёров.

**Target private frequency, предложено:** ориентир ~0%, 8%, 22%, 40% по stage 1–4 **от всех раундов при группе 3–8**, с мягкой верхней границей не более `ceil(0.25*N)` private rounds за session. При двух участниках этот cap может меняться по отдельному policy profile (практически всё — pair, но не всё должно быть private). Если safe eligible private cards нет или согласие не получено — пропускаем, не форсируем quota. Ограничить в компании 3–8 участников повтор одной пары в двух consecutive private moments, не давать одному игроку более половины всех pair invitations, когда есть безопасные альтернативы; исключение при фактически единственной допустимой паре документируется.

**Инференс-защита:** публичный план не сообщает class/weight/comfort; количество парных моментов по одному вечеру должно перекрываться между классами из-за перемешивания и fairness. Нельзя гарантировать невозможность догадок по наблюдаемым социальным действиям; QA проводит privacy inference simulation и корректирует веса до acceptable leakage baseline, без сбора реальных эмоциональных данных.

## 10. Planner: конкретный порядок выбора следующего раунда

```text
INPUT snapshot, previous_rounds, card_pack, reproducible session PRNG
1. ASSERT snapshot immutable, policy version & pack digest match; active state;
   participants 2..8; round count valid; no already committed next round.
2. stage <- progressionStage(round_index,total_rounds).
3. available actors <- snapshot participants who are eligible/connected by membership policy;
   absent actor: do not silently replace target; pause/reassign safely according to FSM.
4. Build eligible interaction types by mode/context/stage and feature capabilities.
   For each possible pair (A,B): resolve 2 directed edges; X -> remove;
   min(Comfort[A],Comfort[B]); allowed class/capabilities/consent type.
5. Apply safety hard filters (context, comfort, relationship scope, stage, features,
   consent, reviewed status, three locale completeness, no unsafe tags).
6. Apply fairness: downweight recent participants/pairs, cap consecutive
   spotlight, avoid leaking sensitive edge via deterministic pair sequence.
7. Weighted select interaction class then candidate actors (seeded randomness).
8. Query eligible unused card variants from exact pinned pack; fail-closed if none.
   A verified neutral fallback may be used ONLY if it passes same hard filters.
9. Allocate card@revision + actors, store RoundPlan in one DB transaction with
   event rev and idempotency key; private edges NEVER in public state.
10. If consent pending, issue scoped ephemeral proposals to relevant actors,
    do not execute action; response FSM follows separate signed/authenticated endpoint.
11. Dispatch localized projections (ru/en/tr from same card ID) and generic
    public round state; update anti-repeat/fairness history only on committed round.
12. Mark completed/declined/skipped/aborted with safe state and go next on host
    action; player may refuse or stop anytime without modifying snapshot.
```

**Correctness:** `selectNext` must not mutate graph, comfort, card pack, locale, room context or seed; interactions only after transaction commit. `idempotency_key` repeated with same scope returns **existing** round, not new random card. If WS disconnects after DB commit, reconnect replays current projection rather than creating another round. Reference policy must record algorithm and seed/version without logging private relation values.

## 11. Card matching contract (with document 09)

Реестр карточек публикует строго типизированные metadata, не «угадывает» риск по тексту:

```typescript
type CardMode = 'questions'|'truth_or_dare'|'yes_but';
type Interaction = 'group'|'solo'|'pair_public'|'pair_private';
type RelationshipScope =
   'none'|'acquaintance'|'friend_or_more'|'gentle_initiative'|
   'mutual_romantic'|'established_couple';
interface CardEligibility {
  meeting_contexts: Array<'online'|'in_person'>;
  interaction: Interaction;
  relationship_scope: RelationshipScope;
  min_comfort: 0|1|2|3|4;
  min_progression_stage: 1|2|3|4;
  requires_physical_contact: boolean;
  requires_going_away: boolean;
  required_capabilities: string[];
  consent: 'none'|'individual'|'bilateral';
  expected_duration_seconds: number;
}
```

- `none` используется `group/solo`; targeted pair требует `acquaintance`+ с соответствующим profile. `gentle_initiative` разрешено G/M/S/R, `mutual_romantic` — M/S/R, `established_couple` — только R; `friend_or_more` — F/G/M/S/R. `acquaintance` — J и выше. `X` всегда fail hard для targeted pair.
- `pair_private` **обязательно** `consent='bilateral'`, `min_comfort>=1`, `min_progression_stage>=3`, scoped delivery. `requires_going_away` → `in_person`. `requires_physical_contact` → `in_person`, `consent=bilateral`, `min_comfort=4` и отдельное согласие независимо от relationship.
- `yes_but` обязательно pair_public или pair_private, два участника, инициатор/получатель; ответ B («Да, но…», «Да», «Нет») **не** заготовленное обязательное ограничение — B придумывает условие или отказывает. `truth_or_dare` содержит безопасные для выбранного уровня **обе** стороны; выбирающий сторону не получает более интенсивное скрытое задание.
- Форма карточки и уникальность IDs/три локали/placeholder parity проверяются machine validator; человек утверждает семантику/согласие и реальные ограничения.

## 12. Публичная и приватная доставка, угрозы выводимости

Общий WS payload может содержать: `session_id`, `round_index`, `card_id`, `interaction`, публичные имена выбранных участников **только для публичного раунда**, таймер/статус/тип действия, безопасный локализованный вопрос. **Не содержит** directed edges, comfort, `initiator_hint`, numeric weights, private prompt, список приглашённых в private stage до их согласия, consent decline reason.

Приватные данные доступны через auth endpoint `/me/preferences` и target-scoped `game.private_prompt` только лично, при room membership и round-scope. Даже host не читает чужой social graph/comfort. Админская DB диагностика не превращает raw contents в журналы/таблицы analytics. Short-lived scoped tokens, server-side ACL, encrypted at rest, TLS и отдельные allowlisted API. Static export/screenshots/carousel UI MUST NOT раскрывать чужие настройки. Пользователь может добровольно сообщить свои чувства — это его право, не действие движка.

Существует неустранимый социальный side-channel: другие могут заметить выбранную пару, публичное приглашение, реальные действия людей вживую. Поэтому «полная невидимость симпатий» не обещается. Минимизируются технически создаваемые утечки, нельзя выдавать `pair_type=mutual_crush` или персональную статистику парной частоты.

## 13. ConsentCoordinator: состояния, сроки и запреты

| Переход | Допускается | Запрещено |
|---|---|---|
| `proposed -> accepted_A` | только A from authenticated member session | host accepts for A |
| `proposed -> accepted_B` | только B | A accepts for B |
| `accepted_A+B -> active` | after both confirmations and context check | auto-start from comfort/relationship |
| `pending -> declined/expired` | any decline, 30s TTL | exposing who/why in public |
| `active -> stopped` | **любая** сторона в любой момент | penalty, asking explanation, endless retry |
| `active -> completed` | scope-limited explicit end or timeout | assuming action performed, recording audio/video |

For nonphysical individual questions the user can answer or skip without a separate handshake; any physical/true-private card requires per-event action-specific bilateral consent. Молчание, бездействие, отсутствие ответа — **не согласие**. Изменение отношения или локального comfort после сессии не делает задним числом согласие/отзыв в прошлой игре.

## 14. Game state, invariants and lifecycle

```text
DRAFT --host prepare--> WAITING_FOR_PERSONAL_SETUP
  --all present OR allowed neutral defaults--> SNAPSHOTTING
  --transaction committed--> ACTIVE ROUND 1
  --advance--> ... --> COMPLETED
  --host abort or participant safety stop--> ABORTED
  --disconnect--> PAUSED (frozen snapshot)
  --reconnect validated--> ACTIVE (same snapshot)

COMPLETED/ABORTED -> NEW DRAFT PREFILLED WITH PRIOR SETTINGS
```

Edge input and comfort edits only when no active/paused session. Host may choose total rounds; users select own relationships and comfort; host can freeze/start with neutral defaults after explicitly confirming skipped settings, but **не** видит каких именно edges люди ввели. Reconnect with same identity replaces socket; a new person with same display name MUST NOT inherit someone else's edges. A member leaving active session cannot be silently replaced as A/B; if not reconnecting within timeout, round becomes skipped and game pauses or ends by host decision; never assign a random person's sensitive card to newcomer.

Session history includes card ID/revision, participants (pseudonymous), consent outcome state (without personal reasons), timestamps and engine version. Last session rerun with same settings does not copy card sequence or old consents; new PRNG seed. **No card repeats within a session when enough eligible cards; if shortage, use safe fallback/error, not relax policy.**

## 15. Formal invariants (fail closed)

1. `not_a_friend(A,B) OR not_a_friend(B,A) => no targeted pair(A,B)`.
2. `card.min_comfort <= min(comfort of all affected actors)`.
3. `card.min_progression_stage <= current_stage`.
4. `online => !requires_physical_contact && !requires_going_away`.
5. `physical_contact => context=in_person && bilateral per-action consent && min_comfort=4`.
6. `pair_private => stage>=3 && comfort>=1 for both && both approve && private delivery`.
7. `relationship_scope` allowed by resolved class; unconfirmed `in_relationships` never treated as couple.
8. `snapshot_after_start == snapshot_at_start` except immutable new audit metadata; user can still refuse/stop.
9. `locale` affects **text only**, not selected card, actors, eligibility or stage.
10. `host role` does not confer right to accept for other actors or read their edges.
11. No real-world physical action treated as performed just because timer ran out.
12. No unreviewed/unauthorized card reaches production round.
13. Pair invitation must not leak relationship label or refusal reason to group.
14. Room closing revokes all round/private delivery and wipes sensitive state per retention.
15. Safe fallback must satisfy **all** the same invariant checks as ordinary selected card.

## 16. Регрессионные тесты и метрики

Golden deterministic fixtures (synthetic, never real users) must include:

| Test ID | Given | Expected |
|---|---|---|
| RE-001 | A→B=crush, B→A=friendship, both comfort=1 | G-class gentle initiative may be sampled, **not** romantic intensity>=2; receiver can refuse |
| RE-002 | CR↔CR comfort=2 | M-class light flirt eligible at sufficiently late stage, not sexual/physical |
| RE-003 | IR↔IR comfort=4 + in_person stage4 | approved R-class physical card **may** be invited, never auto-executed |
| RE-004 | A→B=not_a_friend, B→A=IR | no pair_public/private A,B, group general safe |
| RE-005 | B=just_met, A=crush | conservative J class, no surprise flirt |
| RE-006 | A/B comfort0, stage4 | final remains level0 with richer neutral questions, no coercion |
| RE-007 | A/B comfort4, stage1 | no stage3/4 card selection even when relationship strong |
| RE-008 | online with physical-only cards | no physical card; pool exhausted if no safe fallback |
| RE-009 | in_person with `requires_going_away=true` | bilateral consent; no tracking/proof of stepping aside |
| RE-010 | session changes preferred edges mid-way | 409; snapshot unchanged; skip/stop still works |
| RE-011 | decline/timeout B in private pair | not started, public state generic without actor/reason |
| RE-012 | room reopen/game rerun same settings | edges+comfort retained while room alive; new snapshot/seed; no inherited consents |
| RE-013 | single repeated idempotency key | same round ID, same card, same revision |
| RE-014 | RU/EN/TR participants | same `card_id@rev` + localized text, placeholder roles preserved |
| RE-015 | invited player leaves mid-round, new name collision | no identity substitution, no private leak |
| RE-016 | 2..8 players, statistical 10k synthetic sessions by stage/relationships | rising personal moments where eligible, fairness caps, no safety violation |
| RE-017 | malicious client changes target or forges consent | backend 403/409, state unchanged |
| RE-018 | negative/inferential analysis of public event history | no raw edges, weights, consent reasons; no deterministic public label of pair class |

**Metrics:** percent eligible candidate pool by mode/context/stage/comfort (aggregated, no raw edge); skipped/declined private invitations **aggregated without personal identifiers**; 2–8 participation imbalance; relative pair invitation count by synthetic classes; progressive distribution; `SAFE_POOL_EXHAUSTED`; validation/locale mismatch; repeated request id. Production analytics must not include real social graph or intimate content.

## 17. Versioning, change process, open decisions

`engine_version=RE-1.x`, `policy_revision=1`, `cardpack_digest=sha256:...`, `snapshot_schema=1` are immutable per session. New edge semantics, change in 36-cell matrix, new comfort bucket, new interaction type, weight policy and new sensitive category require ADR, golden dataset, replay/backward compatibility and migration plan. In-flight sessions either safely run their pinned policy or stop with explicit restart if protocol can no longer support it; never silently re-evaluate with new rules.

**Unresolved but tracked:** age/content policy (before romantic+physical public content), persistence of relationships beyond room, whether online private text chat ships with G1 (default exclude cards until supported), measured fairness weights, host moderation/abuse reporting, safe offline separation guidelines. Это не основания менять формулу в обход проверки; explicit feature gate masks unsupported combinations.

**Соседние документы:** [01 Product](01_PRODUCT_VISION.md) · [02 Architecture](02_TECHNICAL_ARCHITECTURE.md) · [04 UX](04_UI_UX_AND_INTERACTIONS.md) · [09 Cards](09_CARD_AUTHORING_AND_AUTOMATION.md).
