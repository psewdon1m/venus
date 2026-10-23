# Минимальный план V2 measurement / preregistration

Статус **PLAN_NOT_RUN / INDEPENDENT_METHOD_REVIEW_REQUIRED**. Это конкретный список следующей работы, не одобрение методики и не новый framework. Никакие измерения/тесты/Docker в этом задании не запускались. Приложение, thresholds и исторические proofs не изменены.

## 1. Зафиксировать входы один раз перед измерением

Текущая техническая база: source identity `b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4` /1819 (`.artifacts/p05-unified-source-freeze01.json`), API/UI/planner unified-chat, policy ROOM-TOPIC-2 по ADR025. Это dirty freeze, не final preregistration tag.

R4: `.docs/implementation/evidence/p04/review470-r4/candidate/cards`, catalog `dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270`, pack `sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4`. Пакет r4 содержит новые card revisions/hashes, но не готовую topic-map/release binding этих hashes; approved-topic-bundles registry пуст. Нужны отдельные точные map/taxonomy/semantic/repertoire bytes с покрытием всех470 revisions, правдоподобной RU/EN/TR разметкой и явной политикой mixed families. Старый map на450/старые hashes не переносится.

Перед final RUN root должен закончить записи исполнителей, перенести только выбранный небольшой измерительный adapter/fixtures/verifier в tracked tools/tests, freeze clean commit+новый preregistration tag. Descriptor пинит source/protocol/seed rules/pack/map/taxonomy/semantic/sampler/serializer/feature dictionary/счётчики/образ/toolchain, модель наблюдателя, точные команды, ресурсы и wall/storage limits. Независимый reviewer принимает метод **до результатов**. Прежние220M design и FAIL остаются неизменными; новая revision явно их не использует.

## 2. Что уже исполняется: точные команды и назначение

Команды ниже приведены для будущего согласованного checkout; в этом аудите они НЕ выполнялись. `$node` — Node24.22.0. На текущем host это `C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe`.

```powershell
& $node node_modules/vitest/vitest.mjs run packages/relationship-engine/src/topic-planner.test.ts packages/relationship-engine/src/topic-map.test.ts apps/api/src/topic-chat-guards.test.ts apps/api/src/topic-algorithm-compatibility.test.ts apps/api/src/topic-context-fixture.test.ts
& $node tools/card-catalog.mjs draft-check .docs/implementation/evidence/p04/review470-r4/candidate/cards .artifacts/p05-r4-new-draft-check
& $node .artifacts/p05-topic-games-runner.mjs
& $node .artifacts/p05-topic-lifecycle-runner.mjs
```

Первые тесты — готовые source/property/regression consumers: semantic/history/public projection, capless обеих contexts, frozen policy/snapshot/actor/final fences, RNG/recovery compatibility. Host PASS не является actual transport proof. Их Docker-исполнение использует штатный quality runner после freeze; не требуется писать новый универсальный supervisor. Draft-check — готовые analyze/dedupe/legacy-predicate C2, distinctID/private25/neutral20 и capability classification. Он **не** исполняет новый topic safety/map/history C2 и не меняет draft на reviewed. Output directory должен быть новым.

Games20 и lifecycle16 на source b244 уже фактически выполнены/независимо приняты: `.docs/implementation/reviews/p05/unified-chat-docker-actual-review-round01/INDEX.json`, `f0e206f86821dcc2b3b1e618297511ca280e73743827077db80d36d9c9dffce4`. Повторять их на неизменных байтах ради этого плана не нужно. TG05 закрывает actual online/in_person private channel/consent/flag-off; TG08/13/15/16/18 — union/replay/conditions/final enqueue/withdrawal; TLC05/06/09/13/14/15/16 — monotonic exclusions/restore/final authorization. Синтетический card source и fixture WS adapter отмечены в принятом отчёте. Новый ordinary WS10 packet передан root на отдельный аудит; пока этот документ не повышает его статус. Будущие browser/WS/P05 результаты здесь не предрешаются.

## 3. Исходные M3 объёмы и пороги сохранить без14-кратного расширения

Нормы: PLAN-P03 EXIT2/5, CI§5.2, `.docs/implementation/p03-measurement-protocol-v3.json`, дополнительные V2 свойства — `.docs/P05_TOPIC_ADVICE_DESIGN.md` §8 и ADR025. Новая narrow revision должна сохранить:

| Секция | Фиксированный корпус и gate | Готовое / недостающее |
|---|---|---|
| Invariants/progressive | 10,000/N2…8 =70,000 sessions; прежние seed strings, mode/context/profile derivation, R1…100;15 invariant rows,0violations, refusal seeds/prefix отдельно;168 stage rows, cap ceil(.25R), strict anti-repeat, no private stage1/2 | Переиспользовать P03 definitions/diagnostic counters и V2 sessionConsumer; нужен adapter actual V2 snapshot/history/planner/outcome, не legacy selectNextRound. I14/auth остаётся actual suites, не selector PASS |
| Fairness | Все42 N×mode×context cells;2000 sessions R20/cell; K pair offers,D=2K; session individual share≤.5, aggregate gap≤.02; late private eligibility+selection nondegenerate и reconciled168 stage rows | Формулы/счётчики готовы в P03/03b; нужна narrow descriptor enumeration ровно42 cells и корректный V2 outcome/history. Core corpus CHAT_ON, all-allow/common-support, не вымышленная production capability |
| G/F | 1,000,000 matched stage1 opportunities, прежний seed/profile N4/questions/in_person, paired2×2 counts; CI95 lower>1, нулевые denominators FAIL/N/A | pairedRatioCI готов. Можно один раз на V2 entrypoint, без14 profiles. Перенос legacy proof вместо actual V2 измерения допустим только после отдельного строгого equivalence review; проще выполнить тот же1M через V2 |
| Public inference | FG/FM/GM, все42 cells;100train+400holdout/class/cell, всего126,000 sessions; прежние R1…100/seeds; per-cell и separately-trained pooled LDA, upper95%CI≤.65, ties.5, structural deterministic decoder blocks | P03 trainLDA/aucCI и03b evaluateCell/evaluatePooled переиспользуются; нужны current V2 public serializer/features и exact dictionary, raw rows/splits. Старый P03 publicRound transcript не является V2 wire |

Это один исходный M3 корпус, не14 копий. Counts не сокращаются ради сроков. Значения 220,207,400 /14profiles /84×3 runtime sessions относятся к прежнему PROPOSED_PREREG; они не самостоятельные числовые нормы EXIT-P05. Ни03b `worker.mjs`, ни `section-runner.mjs` нельзя запустить с меньшими counts: они жёстко проверяют старые descriptors/counts/feature dictionary/authorization. Нужна новая узкая revision, а не параметр скрытого сокращения старой.

Историческая команда существует:

```powershell
& $node tools/p03-measurements.mjs --section=invariants --output=.artifacts/p03-new-invariants
# аналогично --section=fairness / gf / inference
```

Она строит fresh dist и проверяет historical M3 tag/input hashes. На изменённом current tree финальный режим должен отказать. `--probe` исполняет малый **legacy/non-gating** diagnostic и не решает ни одного V2 final gate. Команда не принимает r4/map и вызывает immutableSnapshot/selectNextRound с P03 synthetic pack. Поэтому готовой честной CLI «запусти V2 M3 r4» сейчас нет.

## 4. Минимальные дополнительные V2 strata/canaries — отдельная узкая revision

Не умножать весь M3 на capability×topic regimes. Разнести обязанности:

1. **Capability:** core M3 CHAT_ON. CHAT_OFF не обязан иметь private fairness denominator: новый policy исключает private для обоих contexts. Capless filter и API/frozen-cap truth table уже покрыты source tests; TG05 actual обеих contexts проверяет отключение действующей сессии. Для C2 все N2…8/modes/contexts/stages/R1…100 проверить правила OFF отдельно от content shortage. Positive ON не подменяется vacuous OFF PASS.
2. **Semantic/capacity C2:** один deterministic consumer на r4+exactmap для всех исходных C2 axes, allow-all, supported narrow topic, all-excluded, exclusion after offer, targeted change и mixed/public-private family policy. Проверить фактический unique card/family count, no same-pair semantic repeat через epoch/session/mode, публичный pool не зависит от private history, full union, no actor/stage/comfort/budget substitution. Negative all-excluded — safe-empty/refusal с prefix; не повторять seed, не объявлять COMPLETE. Сохранить отдельные baseline neutral20/private25 gates. Для фактического транспорта переиспользовать Games/TLC/WS tests; не строить84×3 новый runtime orchestrator.
3. **Exclusion/semantic inference strata:** §8 требует **новые измерения**, их нельзя снять одним unit-test или pooled FG/FM/GM. Предлагаемый минимальный pre-review вариант: добавить две matched public-channel comparisons E0/E1 и E0/E2 (одинаковые public snapshot/seed/history; E1 меняет только скрытый supported topic exclusion; E2 — скрытую private semantic-family history),42 cells, прежние100train/400holdout и upperCI≤.65/decoder gate. Полный M3 fairness/GF/invariants при этом не дублируется. Exact E0/E1/E2 fixtures обязаны иметь положительный common support; отказ не стирать и не ресэмплировать. Если строгий structural review докажет, что эти два влияния имеют один и тот же независимый public path, reviewer может до RUN принять ещё более узкий дизайн с явным equivalence обоснованием. Непроверенное сокращение здесь НЕ утверждено. Где реальные public fields зависят от capability/public eligibility, не обещать нулевую inferability: зафиксировать сравниваемую common-support границу.
4. **Wire parity:** current serializer/feature extraction сверить с фактическим registerRooms WS poll/barrier и HTTP snapshots на уже существующих canaries. Недостаточно сравнить два model DTO или synthetic fixture wire handler. Нужен небольшой source-bound parity capture/replayer для выбранных positive/negative transitions; source counters/coalescing/barrier и retained bytes должны быть видимы. Новые84×3 runtime sessions не требуются автоматически; заранее выбрать конечные traces, покрывающие каждую изменённую ветку, и независимо принять полноту.

Это кандидат методики до результатов, не самостоятельно принятые новые нормативы. Выбор strata/trace coverage утверждается независимым техническим review, не подгоняется после результатов. Владелец не должен выбирать seeds или статистические пороги.

## 5. Ровно какие consumers ещё отсутствуют

**A. Узкий current-V2 statistical adapter/CLI.** Взять существующие P03 fixed seeds/profile loops и статистические функции; V2 planner/history/outcome из03b consumer/session adapter; добавить маленький новый descriptor вместо14× workload. Нужны current pins, output/schema/report verifier и explicit final authorization.03b raw sink/privacy controls полезны как компоненты, но03b/04 целиком не author-ready final pipeline:04 остановлен, только syntax30, runtime/parity не исполнены. Новый final adapter не должен неявно импортировать METHOD06 old snapshot policy/4930 fixture/1075 dictionary. Для чистого preregistration нужен tracked entrypoint; его имени и runnable final command пока нет — их нельзя выдумать в инструкции запуска.

**B. R4 topic-map/C2 binding и consumer.** `draft-check` готов для обычного coverage, но не считает V2 exclusions/family history. До exact r4 map/repertoire fixture нечего честно измерять. Кандидат можно загрузить как **явно разрешённый draft machine fixture**, не менять authoring.status, reviewer/provenance или runtime registry. Необходимы map coverage/hash check и deterministic session/C2 adapter; актуальный approved-topic-bundles пуст.

**C. Runtime wire-parity replay.**04 содержит actual-session/coalesced observer WIP, не завершённый producer. Сначала закончить только adapter к существующему actual Games/WS harness для узких заранее выбранных traces и проверить конкретные semantics; не возобновлять общий runtime84 orchestrator.

**D. Минимальный Docker launch/receipt для A.** Offline worker1CPU/1536MiB, networknone/readonly/nonroot, ограниченный owned output/tmpfs, bounded wall/storage, stop настоящего owner-labelled контейнера и сохранённый prefix при отказе. Использовать штатные Docker lifecycle/cleanup паттерны; Windows Job Object/убийство CLI не заменяет container stop. Existing03b Windows32GiB supervisor не готовый Linux final wrapper; нужен короткий привязанный launcher, не новая абстрактная платформа. У statistical functions runtime/output необходимо сохранять raw features/counters для independent recomputation, не только PASS receipt. Старый p03_gate verifier жёстко P03-M3/legacy descriptor; новое V2 envelope нужно проверить отдельно, сами формулы verify_gf/verify_auc/progressive можно переиспользовать без изменения порогов.

## 6. Порядок запуска и остановки

1. Root закрывает r4 map/C2 binding и выбирает narrow method из§3–4; независимый review до данных. Existing component receipts связываются с exact current source, повтор только при новых measured-byte changes.
2. Реализовать только A–D, конечные negative controls для неверного source/tag/map/dictionary/seed/missingraw; без full RUN. Одобрить exact commands/entrypoint/image и freeze clean commit/tag. До этой точки **final RUN BLOCKED**, не «готово».
3. Один заранее выбранный bounded fixed-prefix diagnostic offline workload проверяет compute/encoding/fsync/storage на actual Docker worker. Его результат NOT_GATING; не менять counts/seeds/thresholds по результату. До него никто не знает вместимость/ETA. Accepted METHOD10 R100≈44s относится к одному дорогому профилю, не full workload estimate;571GB/1179days не использовать как предел.
4. Запустить только preregistered секции последовательно с retained raw; independent raw verifier/denominators/stage distributions/LDA/scores/CI и gate review. FAIL/timeout/resource shortage сохранять с exact prefix; исправление → новая reviewed revision до повторного измерения, не скрытый retry.
5. Technical draft results могут закрыть выполнение алгоритма/канала на pinned fixture. Полный EXIT-P04/P05 с reviewed pack остаётся HOLD до настоящих человеческих approvals/rights и актуальной content classification. После approval status/hash/map изменятся — только точная доказанная совместимость или новая привязка/затронутый rerun, а не автоматическая смена флага в старом отчёте.

Итог практического аудита: готовые source tests/draft-check/Games/TLC/WS используются напрямую. Новых универсальных механизмов не требуется. Честные оставшиеся блокеры — narrow V2 measured adapter+verifier/Docker command, r4 map/C2 и конкретная actual wire parity; исходные M3 counts/thresholds и human HOLD сохраняются.
