# Venus · Game Card Authoring, Agent Generation, Validation & Catalog Release

**Владелец:** Game Content / Relationship Systems / Localization / QA · **версия:** CARD-1.0.0 · **дата:** 2026-10-18 · **статус:** формальный гайд для людей и автоматизированных агентов. **Эта спецификация не является готовым контент-каталогом.**

> Входные правила допуска карточек — из [08 Relationship Engine](08_RELATIONSHIP_ENGINE.md). Форма JSON — [contracts/card.schema.json](contracts/card.schema.json); проверяемые образцы — [examples/cards](examples/cards). Никакой генеративный агент не имеет права публиковать карточки напрямую, минуя deterministic machine gates и human review.

## 1. Что такое карточка, режим, пакет, версия

- **Card:** неизменяемый на момент использования объект `card_id@revision`: текст RU/EN/TR и metadata, необходимая для машинного допуска.
- **Round:** ровно одна карточка + назначенные действующие участники, согласие и состояние; в `truth_or_dare` одна карточка содержит обе альтернативы truth/dare, которые должны быть безопасны для данного допуска **одновременно**.
- **Mode `questions`:** вопрос группе/одному участнику/паре; не требует выполнения опасного действия.
- **Mode `truth_or_dare`:** альтернативы `truth` и `dare`, выбор стороны принимает соответствующий участник; он всегда может отказаться/пропустить.
- **Mode `yes_but`:** строго P1/P2; стороне P1 показывается предложение; стороне P2 — формула «Да, но…» с возможностью придумать **своё** условие или сказать нет. Нельзя заранее прописать ограничение за B как обязательное.
- **Card pack:** набор reviewed карточек с version+SHA-256 manifest, опубликованный атомарно; active session ссылается на точный digest и revision, обновление каталога не мутирует уже выбранные раунды.
- **Review:** независимое подтверждение смысла, этики, качества переводов, безопасности, originality/licensing и metadata; автоматическая схема не является ревью.

**Минимум перед публичным Games:** >=100 **различимых и reviewed** карточек **на каждый режим**: 100 Questions, 100 двусторонних Truth or Dare, 100 Yes, But. Каждая обязана иметь три проверенных языка (RU/EN/TR). Это 300 записей и как минимум 400 разных функциональных текстовых сторон на язык (100 Q + 100 Truth +100 Dare +100 Proposal +100 Responder — фактически 500, если responder индивидуальный), а не 100 переводов и 100 перестановок имён. Сложные матричные комбинации могут потребовать намного больше 300 для непрерывных 20+ round сессий — отдельный coverage gate ниже.

## 2. Input contract для любого автоматизированного агента

Агент принимает **явно определённый batch request**, а не бесконечную инструкцию «нагенерируй всё». До запуска нужно прочитать exact `[policy_revision]`, schema, controlled vocabulary, загруженный активный каталог (чтобы проверять новизну), banned-content policy и требуемую матрицу контентного покрытия.

```json
{
  "batch_id": "B-20261018-Q-001",
  "pack_id": "venus-cards-core",
  "schema_version": 1,
  "policy_revision": "RE-1",
  "mode": "questions",
  "count": 12,
  "id_range": [101, 112],
  "meeting_contexts": ["online", "in_person"],
  "allowed_interactions": ["group", "solo", "pair_public"],
  "relationship_scope_distribution": {
    "none": 6,
    "acquaintance": 3,
    "friend_or_more": 3
  },
  "comfort_distribution": {"0": 6, "1": 4, "2": 2},
  "progression_distribution": {"1": 5, "2": 4, "3": 2, "4": 1},
  "languages": ["ru", "en", "tr"],
  "forbidden_categories": ["explicit_sex", "pressure", "humiliation", "unsafe_separation"],
  "source_catalog_digest": "sha256:MANIFEST_SHA256",
  "requested_by": "content-pipeline",
  "human_review_required": true
}
```

Значения демонстрационные. Реальный `source_catalog_digest` — хеш существующего каталога, а не строка `MANIFEST_SHA256`. Batch request валидируется [tools/validate_card_batch.py](../tools/validate_card_batch.py): count, непрерывный диапазон ID без коллизий, суммы всех распределений равны count, RU/EN/TR, digest исходного catalog manifest и запрет group/solo для Yes, But. Пример реального request: [examples/card-batch-request.json](examples/card-batch-request.json); источник каталога — [examples/pack-candidate-manifest.json](examples/pack-candidate-manifest.json). Агенту не передают реальные relationship preferences пользователей, аккаунты, chat history или приватные подробности; только синтетические персонажи и approved topics.

## 3. Строгая форма одной карточки — version 1

`contracts/card.schema.json` — **источник истины для формы**, а [contracts/card-batch.schema.json](contracts/card-batch.schema.json) — машинный контракт входного batch; если пример ниже расходится с JSON Schema, система отказывает и требует отдельной миграции схемы.

| Field | Тип / значения | Назначение / обязательность |
|---|---|---|
| `schema_version` | integer `1` | контракт формы |
| `id` | `Q-0001`, `TD-0001`, `YB-0001` | stable, unique, prefix строго по mode |
| `revision` | integer>=1 | изменение текста/metadata = новая revision, старый ID не переназначать |
| `pack_id` | stable slug | пакет |
| `mode` | questions / truth_or_dare / yes_but | gameplay logic |
| `status` | draft / reviewed / rejected | в runtime доступны только reviewed |
| `category` | controlled vocabulary | темы/редакторское разнообразие |
| `interaction` | group / solo / pair_public / pair_private | privacy и player assignments |
| `participants_required` | 0/1/2 | group=0, solo=1, pair=2 |
| `meeting_contexts` | nonempty subset online, in_person | физическая/удалённая совместимость |
| `relationship_scope` | none/acquaintance/friend_or_more/gentle_initiative/mutual_romantic/established_couple | profile permissions (RE §11) |
| `min_comfort` | 0..4 | нижний требуемый уровень **каждого затронутого игрока** |
| `min_progression_stage` | 1..4 | раньше этой стадии нельзя |
| `consent` | none/individual/bilateral | индивидуальная активация действия, не property relationship |
| `requires_physical_contact` | boolean | true -> context in_person, comfort4, bilateral |
| `requires_going_away` | boolean | true -> только in_person, private_pair, consent bilateral |
| `required_capabilities` | array from whitelist | например `private_text_chat` для online private pair |
| `safety_tags` | enum list | neutral/personal/romantic/affection/music/private/physical_contact |
| `expected_duration_seconds` | 15..300 integer | bounded UX duration, не hard deadline для consent |
| `text` | ru/en/tr localizations | **every** locale present, no fallback in reviewed pack |
| `authoring` | provenance, creator, reviewer, rights | traceability и review gate |

**Important:** `min_comfort` не назначает consent: `comfort4` только позволяет **предложить** определённую карточку при proper context. `relationship_scope` не хранит реальное чувство адресата, а обозначает минимально подходящий resolved class из 08. Если условие human-safety ограничительнее автоматической схемы, карточка запрещена.

## 4. Текст по трём игровым режимам

### 4.1. Questions

Поле каждой локали: `text.<lang>.question`. `group` ставит вопрос всей компании, `solo` обозначает `{P1}`, `pair_*` может содержать `{P1}` и `{P2}`. Один раунд = один понятный вопрос, без нескольких обязательных последующих подсказок. Пример нейтрального вопроса: «Какая песня лучше всего описывает сегодняшний вечер?» — `interaction=group`, `participants_required=0`, `relationship_scope=none`, `min_comfort=0`, stage=1, both contexts.

### 4.2. Truth or Dare

Поля каждой локали: `text.<lang>.truth`, `text.<lang>.dare`. Обе стороны должны иметь **одинаковую максимальную границу metadata**. Если `truth` — про семейные травмы, а `dare` — нейтральная шутка, общий metadata должен кодировать более чувствительную сторону; лучше вместо этого переписать/разделить карточку. Выбор стороны не должен внезапно сделать доступным действие, на которое получатель по ползунку не соглашался. Не давать задания с алкоголем, фальшивыми признаниями, рисковыми действиями, раскрытием личных данных, принудительными контактами.

### 4.3. Yes, But...

Поля каждой локали: `text.<lang>.proposal`, `text.<lang>.responder`. Строго два действующих игрока. P1 **предлагает**; P2 имеет три права: **да**, **да, но… (своё условие)**, **нет/пропустить**. Предложение не исполняется до фактического согласия.

Текст `responder` содержит нейтральное приглашение «Ты можешь согласиться, добавить своё условие или отказаться»; он НЕ заполняет условие за P2. Отсутствие ответа = отказ/expiry, никак не штраф. В online physical contacts/«выйти вдвоём» не допускаются; создать **смысловой online-вариант** (разговор один на один/видеосвязь позже), а не просто перевести физический текст на другой язык.

### 4.4. Localized placeholders

Разрешённые placeholder имён: только `{P1}`, `{P2}`. `group` может обойтись без placeholder; `solo` обязательно `{P1}` и не `{P2}`; `pair` использует ровно те же placeholder names во всех RU/EN/TR версиях соответствующего поля, без различий по роли. Не помещать HTML, Markdown links, URLs или JS в текст; renderer использует безопасный plain text.

Чтобы избежать согласования пола/падежа имён в русском и турецких суффиксов, пишите естественные грамматические конструкции: «{P1}, обратись к игроку {P2}» вместо «обними {P2}» (имя может требовать склонения); по-турецки `'{P2} adlı oyuncuya'`, если это лингвистически уместно. Не добавлять автоматически падежные окончания в строку имени. Все три языка редакционно проверяются на носителях либо компетентных переводчиках; механическая длина строк — дополнительная проверка, не замена редактуры.

## 5. Controlled vocabulary и маппинг темы на risk

| Значение | Что допускается | Требуемый минимум / предупреждение |
|---|---|---|
| `icebreaker` | погода, музыка, еда, смешные привычки | comfort0, stage1 |
| `memory` | общие воспоминания, первая встреча | comfort0/1 depending question |
| `music` | выбор песни, ассоциации, композиции | host controls playback; guest can suggest only |
| `friendship` | поддержка, доверие, забавные совместные идеи | comfort0/1 |
| `self_discovery` | предпочтения и осторожное самораскрытие | comfort1+ if genuinely personal |
| `affection` | доброжелательные комплименты, инициатива | comfort1–2, pair scope relevant |
| `romance` | признания/симпатии/отношения | comfort2/3, never forces confession |
| `together` | совместное дело или приватный разговор | contextual; private conditions |
| `boundaries` | уважительное обсуждение границ, право сказать нет | comfort0–2 if neutral wording |
| `humor` | неунижающий юмор | любые stage/comfort, без подставления/стыда |

`category` — ровно одна главная тема; `safety_tags` — многозначный набор реальных признаков. Если карточка предлагает физический контакт, tags включает `physical_contact` и physical boolean MUST true; если романтический текст — tag `romantic` и min comfort >=2; если приватный контекст — tag `private` и `pair_private`. Не использовать category `icebreaker`, чтобы замаскировать интимное действие.

**Категорически запрещено:** давление/унижение, опасные испытания, принуждение к поцелую/объятию/обнажению, сексуальные задания, обмен паролями/точными адресами, скрытая запись фото/аудио, публикация чужих сообщений, употребление алкоголя как задание, раскрытие реальных crush/not_a_friend, предложение небезопасной изоляции/ночной прогулки, любое действие при отсутствии согласия. Возрастная eligibility policy для романтических/physical категорий — отдельный blocker до публичного release (ADR-006). При неопределённости агент обязан отклонить карточку, а не выдать её с `reviewed`.

## 6. Специальный режим: pair_private

Тет-а-тет означает **реальный отдельный момент**, а не просто двоих, на которых смотрят остальные. `pair_private` требует:

1. `participants_required=2`, `consent=bilateral`, `min_progression_stage>=3`, `min_comfort>=1`, `interaction=pair_private`.
2. Предложение приватно отправляется обоим; только если оба согласны, они видят личный текст. Остальная комната видит нейтральную паузу, **не** чувство, отказ или причину выбора пары.
3. `online` — capability `private_text_chat` требуется для приватных предложений/диалогов; пока эта функция не реализована, такие карточки недоступны (не применять Public WS как обход). `in_person` — люди могут отойти физически без отслеживания/фото/доказательства действия.
4. Предельная длина `expected_duration_seconds <=300`, согласие явно подтверждается каждым, ни один текст не может требовать «пойди в безопасное от людей место», закрыть дверь/отложить телефон или оправдываться за отказ.
5. В `truth_or_dare` обе стороны проверяются; в `yes_but` P2 сам устанавливает условие либо отказывает.

## 7. Порядок генерации одного batch — автоматизируемый state machine

```text
REQUESTED
  -> INPUT_VALIDATED
  -> IDEAS_DRAFTED
  -> LOCALE_DRAFTED
  -> STRUCTURAL_VALIDATED
  -> SEMANTIC_VALIDATED (dedupe, policy tags, context, consent)
  -> SAFETY_AND_EDITORIAL_REVIEW
  -> TRI_LOCALE_REVIEW
  -> REVIEWED
  -> PACK_CANDIDATE_BUILT
  -> COVERAGE_TESTED
  -> PUBLISHED_IMMUTABLY

Any failure => REJECTED or QUARANTINED with precise code, no partial publish.
```

**Разделить ответственность по агентам (single-purpose, независимые входы/выходы):**

- **Planning agent:** по текущему coverage manifest выбирает mode/context/stage/class/comfort/category distribution и резервирует уникальные ID. Ничего не публикует.
- **Concept agent:** придумывает **оригинальные** карточные идеи в одном языке, проверяет отсутствие опасного действия до локализации; выдаёт `draft` JSON без reviewed flags.
- **Localization agent:** создаёт RU/EN/TR текст, сохраняет роль `{P1}/{P2}`, отношение тона и scope consent; не делает literal machine translation смыслоизменяющих формулировок. Не копирует чужие сценарии из защищённых коллекций.
- **Metadata agent:** проставляет metadata на основании **самого чувствительного** действия/стороны, не занижает comfort/stage/consent ради покрытия.
- **Validation agent:** запускает JSON Schema, semantic rules, duplicates, locale placeholder equality, length, engine dry-run against representative fixtures; выдаёт error report, не меняет оригинальный текст молча.
- **Safety/editorial reviewer (человек):** оценивает естественность, культурную уместность, риск неявного давления/дискриминации, юмор, романтическую инициативу и право отказа.
- **Release agent:** собирает из reviewed карточек exact immutable pack, манифест с digest и revision, создаёт CI evidence. Имеет право выставить готовность **только после** всех предыдущих gates и правил релиза [05](05_CI_QUALITY_AND_RELEASES.md).

Каждая стадия принимает `batch_id`, `schema_version`, `policy_revision`, `upstream_card_hashes`, `input_catalog_digest`, возвращает `new_file_ids`, `test_report`, status и errors. При частичном сбое повтор с тем же `batch_id` не создаёт новые ID; повтор на новом base catalog SHA — новая ревизия batch либо явный conflict.

## 8. Конкретные правила генерации — prompt для агента

Ниже рабочий **контракт-подсказка**, адаптируемый в workflow, не «просто пожелания». Встроенные части между `<<< >>>` подставляются автоматизатором из доверенного конфигурационного source:

```text
ROLE: Venus Card Draft Author (draft only; no publish permissions).
INPUTS:
- Relationship Engine rules: RE-1, full attached text.
- card.schema.json: current exact schema, full attached text.
- Accepted content and safety policy: full attached text.
- Batch JSON: <<<VALIDATED_BATCH_JSON>>>.
- Existing catalog IDs and normalized semantic signatures:
  <<<CURRENT_CATALOG_INDEX_AND_HASH>>>.
TASK:
1. Produce EXACTLY batch.count unique, original cards with unused IDs in reserved range.
2. Obey requested mode/context/interaction/relationship scope/comfort/stage distribution.
3. Escalation is gentle and optional; no physical online tasks; never use coercion or disclose secret relationships.
4. Provide ru/en/tr natural translations preserving exact role placeholders and the right to refuse.
5. For Yes But, let P2 invent the condition or decline; do not prewrite P2's condition.
6. For Truth or Dare, both sides must satisfy the SAME declared safety bounds.
7. For private_pair, require both consent; online needs private_text_chat capability.
8. Output one JSON file per card, ONLY JSON, exactly card.schema.json; status=draft.
9. Include provenance: batch_id, created_at, creator=agent, rights_status=needs_review.
10. If any requested combination cannot produce a safe, original item, return a
    structured rejection with code, NOT filler, repeated ideas or unsafe cards.
DO NOT:
- invent missing relation/comfort/private history of real people;
- weaken any rule to satisfy count; generate drinking/sexual/unsafe/secrecy dares;
- claim manual review, rights clearance or native translation proof.
```

Для переводческого агента заменить TASK пунктами «не изменять смысл/согласие/роли/метаданные» и «отдельно отчёт локальных linguistic ambiguities»; его output — patch only to `text` fields и explicit review flags, не новая identity.

## 9. Машинная валидация: два слоя

### Layer A — structural JSON Schema

- `additionalProperties:false`; required fields, enums/types/ranges; exact locales, mode-dependent required text fields, ID prefixes, valid `format:date-time`.
- Inputs are UTF-8 JSON, normalized NFC; invalid Unicode or duplicate JSON keys rejected. JSON parser MUST reject nonfinite numbers/oversized payloads; cap total text lengths, per-side lengths, file bytes.
- Card ID format/pack/revision/schema compatibility checked before runtime access.

### Layer B — semantic and cross-file validator

`tools/validate_cards.py` (негативные regression fixtures: `python -m unittest discover -s tools -p 'test_*.py' -v`) проверяет примерный реестр и предназначен как начальный локальный baseline:

| Check code | Условие |
|---|---|
| CARD-001 | card prefix matches mode, ID globally unique; same ID cannot appear twice within same candidate pack |
| CARD-002 | correct fields by mode: Q.question, TD.truth+dare, YB.proposal+responder; no irrelevant fields |
| CARD-003 | `group->0`, `solo->1`, `pair_public/private->2`, `yes_but` must be pair |
| CARD-004 | `relationship_scope=none` for group/solo, targeted pair cannot be `none` |
| CARD-005 | private pair bilateral, stage>=3, comfort>=1, `private` safety tag |
| CARD-006 | contact bilateral, in_person-only, comfort>=4, `physical_contact` tag |
| CARD-007 | going away in_person-only, private pair, bilateral |
| CARD-008 | online private pair requires `private_text_chat` capability |
| CARD-009 | romantic safety tag/romance category implies comfort>=2; metadata does not deliberately understate risk |
| CARD-010 | same placeholder sets per corresponding locale field, only P1/P2, appropriate roles |
| CARD-011 | content length bounded, no HTML/URLs, unsafe lexeme heuristics flag for review not automatic safety guarantee |
| CARD-012 | reviewed requires reviewer identity/date and original_verified rights_status; draft cannot masquerade as release-ready |
| CARD-013 | no missing tri-locale field, no duplicate normalized text across IDs/modes in candidate set |
| CARD-014 | statuses/revisions/provenance consistent with batch ID and pack policy |
| CARD-015 | per-mode/cardpack coverage and capability gating at publication stage |

`python tools/validate_cards.py .docs/examples/cards` проверяет только образцы; a true release runs against **the full pack**, plus duplicate/coverage/review metadata. Не выдавать прохождение `CARD-001..014` за человеческую проверку сюжета и лицензии.

## 10. Similarity and diversity controls

Проблема 100 карточек — слишком легко собрать 80 перефразировок одного вопроса. Проверять:

1. Unicode normalize NFC, trim whitespace, lowercase/casefold, punctuation removal для метрик дубликатов; оригинальные UX строки не изменять. Русская/турецкая семантика требует language-aware tokenization.
2. Exact duplicates are hard fail; near duplicates via embedding/cosine and n-grams are **review queue**, не автоудаление без человека. Предложенные пороги `cosine>=0.90` или token Jaccard `>=0.78` (не доказаны; калибровать на вручную размеченной выборке).
3. Category distribution: не более ~20% одинаковой категории в одном минимальном 100-card mode pack без ADR; variation across online/in_person, solo/group/pair, stage1..4, comfort0..4, friendships and unilateral/mutual crush profiles.
4. Do not optimize for intimacy so early levels become empty; rooms with 2/8 people and comfort0 must always offer enough safe neutral cards.
5. Measure `effective_eligible_card_count` by synthetic profile, not raw total. One card used with 1,000 placeholder name permutations is **одна** идея, not 1,000 cards.
6. Test on real RU/EN/TR line wraps and cultural relevance; Turkish `İ/ı` cases and natural equivalents of romance/intimacy reviewed independently.

## 11. Pre-publication coverage matrix and pack budget

Planner must generate coverage report for all supported `(mode, context, game size 2..8, stage 1..4, comfort minimum 0..4, resolved class J/F/G/M/S/R)`. `X` is negative test only for pairs; group and solo remain possible. Count reachable cards by actual engine predicate. Product may not claim 20-round continuous play for every profile with only 100 cards if eligible pool has 8.

**Initial target `[PROPOSED]`:** for all 2..8 player configurations with **all comfort0**, 20-round game must complete using approved stage1 neutral-safe cards with no repeats whenever possible; for mixed relationships/comfortable late games, targeted candidate pool should have at least `2×expected rounds in that category` to avoid excessive repetition. Record coverage shortfall by segment, generate additional safe content, or reduce maximum allowed rounds per session with explicit UI message; never loosen filters.

Sample machine report:

```json
{
  "pack_id":"venus-cards-core",
  "pack_revision":1,
  "mode":"yes_but",
  "context":"online",
  "players":4,
  "min_comfort":0,
  "stage":1,
  "relationship_profile":"F",
  "eligible_count":0,
  "minimum_required":20,
  "status":"BLOCKED_INSUFFICIENT_SAFE_CARDS"
}
```

Агент делает следующую генерацию **по дыркам в coverage**, а не по случайному вдохновению. При нехватке безопасного `yes_but` для c0 имеет смысл генерировать вежливые нейтральные предложения, не вводя флирт. `private_pair` невозможны stage1 по определению; coverage для них проверяется только на соответствующей стадии.

## 12. Editorial review: чек-лист на каждую карточку

- [ ] Действие/вопрос естественны для компании 2–8, не звучат как психологический допрос или рекламный слоган.
- [ ] Текст не принуждает к признанию симпатии, касанию, выходу из комнаты, употреблению алкоголя, показу переписки, записи изображения или раскрытию личной информации.
- [ ] Желаемая степень intimacy/interaction разумно соответствует отношениям, stage, ползунку; при сомнении метаданные ограничить/контент переписать.
- [ ] Второй участник имеет реальный выбор «да», «да, но…» и «нет». Отказ не оценивается и не требует оправдания.
- [ ] Онлайн/вживую отличается **физическим** сценарием, а не названием; задачи для онлайн реально выполняются имеющимися функциями Venus.
- [ ] В приватных сценах нет давления на секретность или изоляцию; согласие обеих сторон проверяется отдельно.
- [ ] RU/EN/TR версии одинаковы по ролям, риску и смыслу; не калька, не глухой машинный перевод.
- [ ] Текст правильно вписывается в UI при 320px и 200% zoom; нет непонятных двусмысленных placeholder.
- [ ] Card ID оригинален; нет дубликата/перефраза известной карточки; источник/создатель и права указаны.
- [ ] Reviewer установлен явно и отличается от автоматического автора; дата/решение/причина остаются в audit trail.

Для карточек о романтических/физических взаимодействиях обязателен отдельный qualified safety reviewer и готовая возрастная policy; review identity не подменять строкой `AI approved`.

## 13. Версии, сборка, безопасность и откат каталога

- На черновой стадии `status=draft`, `authoring.rights_status=needs_review`, `reviewed_by=null`. После ревью отдельный approval operation пишет `status=reviewed`, `rights_status=original_verified`, named reviewer/time; JSON content frozen при publication.
- Одна карточка с изменённым текстом получает `revision+1`; старую ревизию хранить, пока живы sessions, использующие старый digest. Не использовать старый card ID для нового смысла.
- Pack manifest связывает `pack_id`, `pack_revision`, schema, policy, curated list `(id,rev,file_sha256)`, exact full digest, reviewer count, locale coverage, distribution/coverage evidence, source revision, published_at. Build deterministic canonical JSON and SHA-256; avoid environment-specific sort order and Unicode normalization mismatch.
- В первой реализации pack является частью подписанного application release OCI/bundle. Никакие внешние CDN JSON не становятся активными без утверждённой подписанной схемы контентного update; pack update не должен обходить main release gates, особенно safety review.
- Staging/production rollout атомарный, feature flag points at one pack digest; rollback switches to previous verified pack, **не** пересчитывая незавершённые sessions. Audit records who approved, exact digest, reason, test IDs and rollback identifier.
- Rights: generated copy original only after review for substantial similarity/copyright; citations/credits tracked separately for explicit source if allowed. Uncertain rights => cannot publish.

## 14. Запуск локальных инструментов и ожидаемый результат

```sh
# Working directory: repository root
python -m pip install -r tools/requirements.txt
python tools/validate_cards.py .docs/examples/cards
python tools/check_relationship_policy.py
python tools/test_contracts.py
python tools/check_docs.py
# Сборка ТОЛЬКО демонстрационного manifest, без публикации:
python tools/build_card_pack.py .docs/examples/cards --out /tmp/venus-pack-candidate.json
# Валидация входного batch для следующей агентской генерации:
python tools/validate_card_batch.py .docs/examples/card-batch-request.json \
  --catalog-manifest .docs/examples/pack-candidate-manifest.json \
  --existing-cards .docs/examples/cards
```

При ошибке скрипт завершается кодом !=0, печатает `CARD-###`, путь карточки и понятное описание (без каких-либо пользовательских preferences). При успехе возвращает counts/errors=0; это **не** заменяет реальную проверку G1 catalog quantity/rights.

### Negative fixtures, которые обязательно добавить в codebase tests

1. `TD-0001` with 3 locales but missing Turkish `dare` => CARD-002/010.
2. `YB-0002` `interaction=pair_private` `consent=none` => CARD-005.
3. Online hug (`requires_physical_contact=true`) => CARD-006.
4. `{P2}` in RU and `{P1}` in EN for same field => CARD-010.
5. Card with `not_a_friend` disclosed explicitly in proposal or slur => safety human review flag and banned-text heuristic.
6. `status=reviewed` but no human identity/date => CARD-012.
7. Duplicate normalized question under a different ID => CARD-013.
8. `yes_but` responder imposes fixed limitation rather than player-defined choice => editorial review fail.
9. `truth` neutral but `dare` suggests physical contact at min_comfort0 => semantic review + CARD-006 if properly flagged.
10. A correct reviewed neutral card selected for synthetic c0 online stage1 without leaking edges => engine positive test.

## 15. Release acceptance / definition of complete card pipeline

- [ ] Signed service release pins validated card schema, exact policy revision and catalog digest.
- [ ] 100 reviewed unique cards **per mode**, all RU/EN/TR, `truth`+`dare` and Yes But two sides complete.
- [ ] Every card passes structural and semantic machine validation, including negative regressions.
- [ ] Human linguistic+editorial+safety review done, sensitive categories approved under age/legal policy.
- [ ] 2..8 players, context, comfort and progression coverage report complete; shortfall treated as block/restricted scope.
- [ ] Active sessions pin old pack and engine policy; new sessions may use new pack, rollback safe.
- [ ] No card from an AI agent can enter production by setting `reviewed=true` itself; separate approval identity enforced.
- [ ] Traceable ID/version, batch input digest, stable output digest, diff/review logs and release job evidence are retained without user-private data.

**Связанные документы:** [01 Vision](01_PRODUCT_VISION.md), [04 UI](04_UI_UX_AND_INTERACTIONS.md), [05 CI](05_CI_QUALITY_AND_RELEASES.md), [07 Risks](07_KNOWN_AND_EXPECTED_PROBLEMS.md), [08 Relationship](08_RELATIONSHIP_ENGINE.md).
