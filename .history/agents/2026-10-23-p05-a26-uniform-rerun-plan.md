# P05 A26: план единого повторного прогона

Агент: `/root/p05_resume05_author`. Время: UTC. Задача получена 2026-10-22 после 21:45 UTC (23 октября Europe/Istanbul). Это подготовка метаданных, не реализация, запуск или независимая приёмка моей прежней статистики05.

## Границы и inputs

- A26 author INDEX `2d6e714ba4c8e6162803232f5be48fdf647d2e43d7036dd785fe0300ff3010f3`, source `27f5172a4d550017c801a15531d39f52aed120937f70e556dfbaae063b56a5bf`, 1881 файлов; `.docs/implementation/reviews/p05/public-exhaustion-focus-author-round01/`. Независимая source-проверка поручена другому агенту.
- ADR-030 сохраняет сериализуемое семейство `RE-1.P05-TOPIC-3`; отдельная идентичность выбора `RE-1.P05-TOPIC-3.PUBLIC-EMPTY-PRIVATE-1`. Нет миграции TOPIC4.
- Старые source A9 / image58 / producer02 / resume05 и их FAIL неизменяемы. Ни один старый prefix, COMPLETE или reducer не засчитывается новой версии.
- Правки только собственного журнала. APP, producer, manifests, runtime, ACK, Git, Docker и тесты не изменялись/не запускались.

## 2026-10-22T21:48:44Z — результаты чтения

Прочитаны existing prepare01, cost-ack01, host03, no-carry lanes02, producer02 binding/loader/prereg/worker/reducer/descriptor, pure-closure-check, reducer05 и старый static wrapper, Dockerfile.p05-tests, A26 HANDOFF/INDEX/ADR030 и предшествующий binding23. Чтения завершены; ошибочные запросы несуществующих `m3-inputs.mjs`, `m3-descriptors.mjs` и PowerShell glob-аргументов rg сохранены в tool history. Они не являются тестами приложения. Правильный descriptor найден как `m3/descriptor.mjs`.

1. Текущий Dockerfile.p05-tests runtime строит apps/packages в `/app`, Node24.22, USER1000. Host03 переопределяет entrypoint на worker, не поднимает браузер/API, использует network none/read-only/1 CPU/1536MiB/64pids/20min. Поэтому отдельный третий образ для статистики статически не требуется. Фактическую совместимость и новые хеши подтверждает ещё не полученный A26 image receipt; старые image/runtime pins использовать нельзя.
2. Loader проверяет **всю** runtime_files-карту до импортов четырёх entrypoints (catalog/index, engine/index, planner, API topic-game-model). Нужно обновить точные текущие runtime pins из нового receipt, а не только два изменившихся compiled-модуля. Pure closure должен заново связать эти entrypoints с текущими байтами; прежний результат A9 не переносится.
3. `pilot-loader.mjs` assert TOPIC3 остаётся правильным. Ревизию PATCH следует явно записать в новые binding/prereg/source qualification. Нет необходимости менять RNG, descriptors, модель, пороги или сериализованный формат. Runtime bytes и binding digest уже связывают фактический PATCH; добавление нового механизма контроля не предлагается.
4. `pure-closure-check.mjs` содержит литералы A9 receipt/source/image/count/freeze/status. Его новый экземпляр требует только замены этих pin/label/count/path на реальные A26 значения. Обход импортов, запрет APP/diagnostic, AJV lock-проверки и четыре entrypoints сохраняются. После изменения его hash обновляется в binding.method_files; затем новая binding/producer map связывается review/ACK. Старый экземпляр не переписывать.
5. Lanes02 уже выполняет свежие 2609 jobs без carry; lanes03/04/05 для нового полного прогона не нужны. Старый prepare01 — только шаблон, его жёсткие старые paths/reviews/Git/runner01 нельзя запускать как есть.
6. Reducer05 исключает c2-static с обоснованием старой принятой static-проверки. Это неприменимо к единому A26 прогону. Минимальный будущий successor существующего wrapper должен допустить c2-static и использовать тот же неизменный range-reduce.mjs `42769a3dff329acb64d2c54f64b286c760db268c6b38fc047f13b3428ba046bd`. Это изменение списка разрешённых секций, не алгоритма reducer. Отдельный новый framework или повторная реализация static не нужны.

## Конкретный порядок после получения image pins (НЕ выполнен)

1. Root заканчивает source-independent review и clean A26/image receipt. Новый producer в отдельном каталоге, предлагается `.artifacts/p05-pilot-corpus-ranges03/`, копирует неизменные method bytes02; меняются binding/prereg/provenance и pin-литералы closure checker. Source27/PATCH/receipt/runtime map/все method hashes должны совпадать. Методический review обязан явно принимать текущую привязку, не старый A9 review как нынешнюю авторизацию.
2. Отдельная supplemental ACK через **существующий** host03 на `m3-inference start23999 count1 end24000`: тот же seed `venus:P03-M2:holdout:FG:G:5:yes_but:in_person:399`, N5/G/in_person/R100. Проверить COMPLETE100/no refusal, raw/export/cleanup. Это регрессия причины прежнего FAIL, **не кредит** оригинальной матрице и не основание исключить 23999 из последующего диапазона [23900,24000).
3. Metadata-successor cost-ack01 в новом каталоге, предлагается `.artifacts/p05-fixedrange-cost-acks02/`: семь новых owner/ACK на prefix [0,100), GF [0,1000). Все вместе1600 случаев. Root выдаёт разрешение/запускает; текущая задача не создаёт действующих ACK. Успешные текущие prefixes являются первыми диапазонами новой uniform-матрицы, не дополнительными выбранными примерами. Измеренный cost фиксируется без обещания времени полного R100.
4. Metadata-successor prepare01 формирует `.artifacts/p05-full-original-ranges06/MANIFEST.json` и новый `.artifacts/p05-full-original-execution06/`, с **неизменным** `.artifacts/p05-full-original-lanes02.mjs` / host03. Обновляются только текущие producer/reviews/source/image/Git witness, новые output/owner/ACK hashes и runner02 selfhash. Убирается устаревший label IMMUTABLE_A9, не меняется execution policy. Нужна отдельная независимая проверка, clean prereg/witness, затем root activation. 8 lanes, исходные chunks/counts/seed, zero retry/resampling, strict fairness/inference refusal STOP и finally неизменны. Root отдельно определяет ресурсный профиль; я его не расширяю.
5. Единственная матрица: c2-static47040; trajectory37072; canary336; M3 invariants70000; fairness84000; GF1000000; inference126000. Всего1364448 = fresh1600 +1362848 в2609 jobs. Совокупно2616 владельцев диапазонов: C2=386 (11static/371trajectory/4canary), M3=2230 (700/169/101/1260). Supplemental23999 отдельно, вне этих чисел.
6. После **всех2609 terminal normal PASS**, сохранения всех текущих section raw и материального размещения на E (C aliases не подходят для Docker cross-drive bind), новый metadata-successor reducer05 указывает новый manifest/hash/terminal/output и физический E rawroot. Оригинальные range-reduce/replay/model/math остаются byte-exact. Запустить существующую редукцию всех7 секций, не переиспользовать старый static/C2. Приёмка отдельно: runtime exit0 не равен статистическому PASS, typed refusals и coverage не скрывать.

Будущие существующие формы команд (PLACEHOLDER не является ACK/командой запуска):

```text
node .artifacts/p05-fixedrange-host03.mjs NEW_SUPPLEMENTAL_OR_PREFIX_ACK NEW_CONSUMER_REVIEW
node .artifacts/p05-full-original-lanes02.mjs NEW_FULL_MANIFEST NEW_ROOT_ACTIVATION
python -B NEW_METADATA_SUCCESSOR_OF_REDUCER05.py SECTION
```

## Передача / STOP

Нужны от root: фактические A26 image ID, receipt/freeze/runtime-map paths+hashes, независимый source-review INDEX, выбранные новые output names и ресурсное решение. До них active metadata/ACK не создаются. Нет новой модели, thresholds, count/seed changes, carry assembler, retry или третьего image. Авторство статистики05 моё; её независимую приёмку выполняет другой агент. P06 не начат.

Git index при чтении: `a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093`, изменений Git не было. Состояние: план подготовлен, запусков0; current A26 full C2/M3/P05 PASS не заявляется.
