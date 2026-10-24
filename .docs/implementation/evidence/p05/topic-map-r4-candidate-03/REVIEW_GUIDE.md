# r4 semantic candidate03: три исправления после независимого review02

**AUTHOR_FIXED_PENDING_INDEPENDENT_REPEAT.** Человеческий HOLD и отсутствие runtime/registry activation сохранены. Это новая additive revision; candidate02 и его FAIL не переписаны. Полный P04/P05 PASS не заявлен.

Входной независимый отчёт: `.docs/implementation/reviews/p05/topic-map-r4-independent-final-round01/INDEX.json`, SHA `2d36d2bb5b333df7ad96c18608314be9ba59810bbf6f8ea7d97222fc05d87dd9`. Он прочитал фактические RU/EN/TR всех470 карточек,47 прежних multi families,349 контрастов и38 concern dispositions, подтвердил raw bindings/исправление YB-1175/draft fences и зафиксировал три P2 ложной уникальности. Этот автор не принимает своё исправление самостоятельно.

## Исправления

| Finding | Новое решение |
|---|---|
| P05-R4-SEM-CAPTION-001 | Q-1127 и YB-1127 объединены в `R4-OP-F-short-drawing-caption`: короткая подпись к рисунку; окно/ракушка и обмен без ранжирования не меняют центральный результат. |
| P05-R4-SEM-WELCOME-002 | YB-1055 добавлена к TD-1014/YB-1014 в `R4-OP-F-fictional-newcomer-welcome`: приветствие вымышленному посетителю; количество гостей, торжественный тон и выставка не дают новой операции. |
| P05-R4-SEM-CONCERT-003 | YB-1039 добавлена к TD-1044/YB-1049 в `R4-OP-F-concert-unexpected-attendee`: придумать необычного слушателя/гостя концерта; выбор места — дополнительная задача, которая не убирает повторяемую операцию. |

[round02-review-corrections.json](round02-review-corrections.json) связывает каждое авторское исправление с точным review/finding. [targeted-diff.json](targeted-diff.json) проверяет границы изменения: только4 покарточных `semantic_family_ids` изменены; остальные466 map entries точны относительно02. Все470topic sets и карточные тексты/revisions/status/reviewer/provenance неизменны. Ранее добавленный `personal_boundaries` у YB-1175 перенесён без нового изменения.13определений taxonomy, projection taxonomy и pack manifest побайтно прежние.

390 семейных records перенесены точно,2 прежних public-семейства расширены,1 caption-семейство создано,4 прежних одиночных решения сняты из текущей карты с сохранением в02. Теперь393explicit families:48multi по125уникальным ID и345вручную обоснованных одиночных операций. Автоматических singleton/ID=distinctness нет. Все470 source bindings/2340field hashes и прежний полный авторский аудит перенесены, технически неназначенных ID нет.38 исторических/current concern dispositions сохраняются; пять удалённых старых ID не возвращаются и не переназначаются.

Полные фактические RU/EN/TR и покарточные операции/соседи/контрасты находятся в [semantic-operation-audit470.json](semantic-operation-audit470.json); ручные решения — [families.author.tsv](families.author.tsv), [distinct.author.tsv](distinct.author.tsv). Эта ревизия повторно читает восемь затронутых действующих карточек/соседей по всем языкам и переносит остальное точными байтами/привязками; не заявляет нового независимого или профессионального языкового одобрения.

## Mixed policy и честные количества

Все три исправления затрагивают только public/solo refs.19 mixed families и59точных статических exclusions побайтно по множеству прежние; разрешённый draft-сценарий —411ID. [mixed-visibility-proposal.json](mixed-visibility-proposal.json) сохраняет безусловное исключение **всех участников** каждого смешанного кластера в будущем отдельно принятом repertoire. Production exclusions не применены; public pool не зависит от hidden private history.

Новые необходимые static bounds существующего `eligible()` после этих группировок:

| Режим | Private C1/F/S3, N2 | Порог25 | Neutral C0/F/S1 operation slots, N2 | Порог20 |
|---|---:|---:|---:|---:|
| Questions |41|25|96|20|
| Truth/Dare |42|25|98|20|
| YesBut |35|25|93|20|

Оба contexts совпадают; capability-off private0. YB neutral bound честно снизился95→93. Это raw necessary bounds без истории/персональных exclusions, не C2 PASS и не гарантия20/100round paths. Значения ниже100 могут быть реальным ограничением neutral R100; их нельзя скрыть повтором seed, ослаблением semantic history или добавлением неподтверждённых текстов. Карточки не добавлялись. Полный V2C2 и интерпретация supported/refusal profiles ещё предстоят после независимого data/method review.

## Draft-only export и проверки

[projection/EXPORT.json](projection/EXPORT.json) содержит точные raw paths/SHA. Три wrappers используют **SYNTHETIC_MACHINE_FIXTURE / false / false / SYNTHETIC_ONLY**; реальные470r4draft cards загружаются неизменёнными через существующий `FrozenPack.load(..., true)`, а map через `FrozenTopicMap.syntheticFixture` с настоящим branded test capability. Registry/APPROVED-reviews не создаются. Новый map revision `P05-R4-MAP-DRAFT-MACHINE-03`, semantic revision `P05-R4-OPS-DRAFT-MIXED-EXCLUDED-03`; taxonomy revision остаётся прежней02, поскольку её bytes не менялись.

[checks.json](checks.json) и [projection-validation.json](projection-validation.json): existing loader, точная упаковочная сверка, Node syntax/ESLint и Python compile — exit0.17 прежних typed negative controls сохранены. Ещё три контрпримера строят в памяти **структурно валидные**, но семантически ошибочные повторные splits этих групп: существующий loader закономерно принимает их schema, а новый конкретный semantic regression control отказывает с `ERR_ASSERTION`. Это не автоматическое доказательство языка: контроль сохраняет принятое основание трёх замечаний. Всего20 отрицательных контролей. C2/статистика/Docker не запускались.

[final-input-audit.json](final-input-audit.json) подтверждает37children candidate02 и666r4manifestchildren без изменений. R4pack `sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4`, catalog `dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270`. Application source не сертифицируется этой data-only работой. Старые FAIL, candidate01/02, человеческий139worksheet и языковые/editorial pending flags сохраняются. Откат — не использовать03/projection; runtime state или card source здесь не менялись. Следующий шаг — независимый targeted repeat03, затем root exactpin authorization для draft-V2C2.
