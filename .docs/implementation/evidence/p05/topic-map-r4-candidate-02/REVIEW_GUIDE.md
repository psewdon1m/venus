# r4 semantic-operation candidate02

**AUTHOR_PENDING_INDEPENDENT_AND_HUMAN.** Исходный человеческий **HOLD**, `approved:false`, `runtime_eligible:false` и отсутствие registry activation сохранены. Авторская классификация данных завершена; независимая проверка и человеческое принятие ещё требуются. Полный P04/P05 PASS не заявлен.

Предыдущий candidate01 с INDEX `b3a62c3c9a97744010b50a95f575ca3f2a3f1d37800e6744c04ca65fbc482244` сохранён без изменений. Все470 r4card bytes, revisions, status, reviewer/provenance и13 определений taxonomy неизменны. Pack: `sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4`; catalog: `dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270`. Этот пакет привязан к данным r4, не к меняющемуся приложению; root сообщил aa1205/1823 отдельно, текущий application source здесь не сертифицируется.

## Завершённое чтение и покарточные решения

Прочитаны фактические393 остаточные карточки: Q136/TD131/YB126, поRU/EN/TR, обеим TDсторонам и proposal YB. Все150 YB имеют один точный responder-шаблон на каждом языке: каждый шаблон прочитан, равенство по всем карточкам проверено. Дополнительно прочитаны26 ранее concern-assigned карточек, не покрытых прежним чтением160/20. Объединение чтений покрывает все470. Машинное совпадение хешей не выдается за чтение или профессиональную компетенцию переводчика.

[SEMANTIC_AUDIT470.md](SEMANTIC_AUDIT470.md) — читаемый покарточный список операций и решений. [semantic-operation-audit470.json](semantic-operation-audit470.json) содержит ID/revision/raw/canonical SHA, все2340locale field hashes, фактические тексты всех сторон/языков, конкретную операцию, family membership, соседние операции и смысловой контраст. [reading-receipt.json](reading-receipt.json) фиксирует границы авторского чтения.

В [families.author.tsv](families.author.tsv) вручную заданы47 семейств повторяющихся операций по121 уникальному ID. Например: просьба робота о времени подумать; создание повторяющегося ритуала друзей; название воображаемого музыкального произведения; смена темы разговора; выбор ритма для шествия; краткая инструкция; просьба/отказ и конкретные способы образного представления звука. Присутствие одной темы или двух участников само по себе не образует семью. Для TD достаточно обоснованного пересечения одной стороны: другая сторона отдельно сохранена в audit.

[distinct.author.tsv](distinct.author.tsv) содержит349 **явных авторских решений** об отдельной операции. У каждого указаны как минимум две фактические соседние карточки и конкретное различие требуемого результата/направления/ограничения. Одноэлементные семьи создаются только из этих ручных строк; нет автоматического fallback «ID не найден → уникален». Идентификатор одноэлементной семьи — хеш авторского operation/contrast record, а не card ID. Это ограниченный содержательный аудит соседних операций, без утверждения абсолютного доказательства всех110215пар или отсутствия любых будущих редакторских возражений.

Итого396 explicit families:47 многокарточных и349 вручную обоснованных однооперационных. Один TD ID входит в два семейства из-за пересечения разных сторон/операций. `author_technical_unresolved_ids` пуст; независимое и человеческое принятие всех470 ещё pending. Одноэлементные семьи имеют `EXPLICIT_FAMILY`, а не `IDENTITY_ONLY`.

## Прежние concerns и одно исправление тегов

[CONCERN_DISPOSITIONS.md](CONCERN_DISPOSITIONS.md) и [concern-dispositions.json](concern-dispositions.json) сохраняют все21 историческое и17 предыдущее current concerns с точными прежними refs и новым обоснованным keep/split/removed решением. Например, три действия с будильником — просить разрешения прозвенеть, просить тихий режим, объявлять перерыв — разделены по направлению речи. «Комфорт посетителя» сохранён как операция; «наблюдать вместо участия» отделено от проектирования двух точек обзора. Неоднозначные широкие темы не превращены в семьи автоматически.

Пять удалённых старых mixed IDs (`TD-1005`, `YB-1005`, `YB-1113`, `YB-1126`, `YB-1133`) остаются только историей; на новые ID их семьи не перенесены.

Единственное изменение subject-тегов относительно candidate01: **YB-1175 + personal_boundaries**. Независимый pre-read06 указал, что сохранение маленького удовольствия без улучшения даже магией прямо соответствует прежнему определению personal enoughness. Исправление отражено в [topic-pre-read-disposition.json](topic-pre-read-disposition.json); taxonomy/card bytes не менялись, значения pool не использовались для подгонки классификации. Остальные469 наборов тегов точны относительно candidate01. Прежние flags сохранены как lineage; квалифицированные языковые/редакторские вопросы, включая TD-1132/TR, YB-1072/TR и вид альбома Q-1176, не считаются автоматически одобренными.

## Смешанная видимость и последствия

[mixed-visibility-proposal.json](mixed-visibility-proposal.json) предлагает новый отдельный репертуар:19 смешанных public/private семей, **все59 точных участников** которых исключаются целиком и безусловно. В production это предложение не применено. Публичный pool никогда не фильтруется в зависимости от скрытой приватной истории. Авторские решения о семействах приняты до вычисления количеств; ради порогов они не ослаблялись.

В отдельной synthetic-machine projection ниже этот сценарий исключений задан явно; в исходном pack остаются470 неизменённых карточек, разрешённый репертуар сценария —411. Существующие `eligible()`/`coverageSnapshot()` дали только необходимые статические количества для N2, без истории и персональных topic exclusions:

| Режим | Private baseline C1/F/S3 | Порог25 | Neutral C0/F/S1 operation slots | Порог20 |
|---|---:|---:|---:|---:|
| Questions |41|25|96|20|
| Truth/Dare |42|25|98|20|
| YesBut |35|25|95|20|

Результат одинаков для online/in_person; без chat capability приватно допустимых ID —0. Это **raw necessary bounds**, не C2 PASS, не20/100round trajectory, не N2–8/mixed-graph/fairness/privacy proof. Семантическая история, размер комнаты, directed graph, произвольные пользовательские exclusions и dynamic safety могут уменьшить доступность; truthful safe refusal сохраняется. Фактический текущий V2C2 после независимой проверки ещё нужен, пороги25/20 не изменены.

## Конкретный export для draft-only V2C2

Готовые точные пути и SHA перечислены в [projection/EXPORT.json](projection/EXPORT.json):

- [projection/map.json](projection/map.json) —470 точных refs/field hashes и13тем.
- [projection/taxonomy.json](projection/taxonomy.json) — формат существующего loader с теми же13topic IDs/labels; определения неизменны в [taxonomy.candidate.v1.json](taxonomy.candidate.v1.json).
- [projection/semantic.json](projection/semantic.json) —396полностью назначенных семейств, mixed-кластеры целиком `repertoire:exclude`.
- [projection/pack-manifest.json](projection/pack-manifest.json) — illustrative draft manifest revision1 для тех же реальных470r4draft bytes.

Все три map/taxonomy/semantic wrappers: **SYNTHETIC_MACHINE_FIXTURE / approved:false / runtime_eligible:false / SYNTHETIC_ONLY**. Это честный test-only machine projection реальных draft-текстов, а не новые искусственные тексты и не APPROVED-релиз. Карточные status/reviewers/provenance не подменяются; исходный author candidate02 и человеческий HOLD остаются.

Путь загрузки уже существующий: `FrozenPack.load(realR4DraftCards, illustrativeManifest, true)`; затем `FrozenTopicMap.syntheticFixture(exactBytes, pack, syntheticTopicFixtureCapability())` через прямой test-only импорт модуля topic-map. Factory capability обязателен; plain object отказывается. Production loader отказывается принимать synthetic pack. Export guard отказывается при любом технически неразобранном ID или пустом membership. Использование для фактического C2 требует сначала независимого review точных данных и разрешения root на эти pins; **C2 здесь не запускался**.

## Проверки, сохранённые FAIL и откат

[checks.json](checks.json): read-only точная перепаковочная сверка, existing FrozenPack/FrozenTopicMap loader, Node syntax/ESLint и Python compile — exit0. [projection-validation.json](projection-validation.json) содержит17 отрицательных контролей с точными ожидаемыми error codes: unresolved export, unbranded capability, production admission/forged approval, неверные revision/hash/locale/topic/family, отсутствующий membership, частичное mixed-исключение/ложная mixed-метка, duplicate и multi-member IDENTITY_ONLY. Loader pins проверены по реальным raw bytes файлов export, а не альтернативной сериализации.

[author-failures.json](author-failures.json) сохраняет неудачи: guessed `eligibility.js` вместо существующего engine.js, начальные4lint-ошибки unqualified structuredClone, а также исправленную до freeze разницу compact/raw export pins. Никакие прежние proof не переписаны. [final-input-audit.json](final-input-audit.json) подтвердил неизменность29children candidate01,666r4manifestchildren и450старых card files; application source не сертифицировался.

Откат: не использовать новый candidate02/projection. Runtime state, registries, тексты, прежние карточные ревизии и source history здесь не менялись. При дальнейшей активации требуется отдельно принятая версия данных и совместимый rollback с сохранением privacy/monotonic history. Старый139-карточный owner worksheet остаётся применимым: этот аудит не добавляет человеческих approvals.
