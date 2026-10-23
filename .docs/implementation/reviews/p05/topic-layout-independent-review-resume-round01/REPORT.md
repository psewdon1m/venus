# P05 layout459 — независимая проверка resume01

**CHANGES_REQUIRED_PRODUCER_ONLY. Два P2. Actual layout RUN не разрешён этим отчётом.**

Проверял `/root/p05_oci_author_resume`, не автор layout producer. Вход — author packet `5c4f69fea4090523b335793ba6a9e1037591ff71e9feba589910c6cd475c6690`,87 файлов; полная рабочая копия совпала до и после проверки. Included source `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad` /1813 сохранён. Профиль изображения — точный `ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4`, build receipt закреплён. Никакие чужие producer/source/history не редактировались.

## Findings

**LAYOUT-R01-001 · P2 · независимый review не связывается с запускаемыми runtime bytes/image.** В [run.mjs:13](../topic-layout-author-resume01/producer/run.mjs) из настоящего hash-checked review JSON проверяются только verdict и source identity. Следующая строка сравнивает текущий runtime digest исключительно с root ACK; значения producer runtime digest и image, которые принял независимый reviewer, не проверяются. Сохранены два воспроизводимых counterexample на точном AST host runner: review JSON содержит другой digest либо другой image, его настоящий SHA соответствует ACK, остальные условия корректны — runner проходит fence, вызывает mocked Docker и завершает inert PASS. Реального Docker не было. Это допускает ссылку на review других executable bytes того же source; отдельный root ACK не заменяет независимую приёмку этих bytes.

Исправление: durable review должен явно принимать точные producer runtime digest, source identity и image; host runner проверяет равенство всех трёх с operational ACK/actual inventory/binding до allocation и Docker. Добавить отрицательные проверки отсутствующих и несовпадающих полей review. Новая code revision должна получить новое независимое решение; существующий отчёт не переименовывать в PASS.

**LAYOUT-R01-002 · P2 · unsupported CSS compositing может получить ложный contrast/visibility PASS.** [dom-audit.mjs:8](../topic-layout-author-resume01/producer/dom-audit.mjs) вычисляет фон по backgroundColor/backgroundImage/opacity; `filter` и другие не поддерживаемые контексты окрашивания не учитываются. Аналогичная неполнота есть в focus oracle на строке28. Два сохранённых counterexample вызывают точный domAudit с computed `filter: brightness(0)` либо `filter: opacity(0)` у кнопки: возвращаются `contrast_failures=0`, `contrast_unresolved=0`, `assertObservation` принимает результат. По заявленному DESIGN unsupported compositing обязан быть FAIL/UNRESOLVED. При brightness(0) модель из computed black/white цветов уже не описывает итоговую окраску; opacity(0) скрывает сам контроль. Это дефект методики, а не утверждение, что данный filter сейчас имеется в Venus или что реальный браузер был запущен.

Исправление: явно распознавать неподдерживаемые paint/filter contexts у самого узла и предков в text/control/focus visibility/contrast проверках; возвращать unresolved/failure вместо положительного значения. Сохранить строгие пороги и добавить отрицательные проверки для filter на узле/предке и согласованности focus. Разрешается точный ограниченный whitelist корректно поддерживаемых CSS contexts; необработанные contexts не могут быть PASS.

## Что проверено

Независимо повторены126 исходных finite controls, все exit0:28 matrix-contract,57 permissions/deadline/DOM/PNG/ACK,14 exact keyboard helper VM и27 exact host runner VM. Выполнены13 дополнительных независимых static/AST/binding проверок; все PASS в их ограниченном scope. Дополнительно4 counterexample подтвердили указанные2 findings. [Результаты](finite-repeat.json), [bindings](static-bindings.json), [counterexamples](counterexamples.json).

459 ID действительно формируются как360 core normal +45 core native +54 supplements;9 engine/locale shard по51. Все31 METHOD12 helper AST text и extraction bytes совпали; observer03 имеет точный принятый hash и остаётся model-only, а не cache.accept evidence. Сам producer вызывает настоящий runtime/composition, UI admission, protected mutation receipts, собственные current/self projections и source-bound synthetic fixture; inert fixtures не используются actual worker entrypoint. Primary/secondary/observer берутся из фактического round plan. Публичные и приватные роли различаются явно.

Статически прослежены реальные geometry resize, reduced-motion query и computed animation/transition проверки, DOM measurements, Tab/focus oracle, exact successful safety receipts. X11 native200 действительно использует physical Ctrl+zoom и measured DPR/reflow; native safety activation стоит до reset/cell PASS. Снимки нормальных и native ролей, masking, per-file/whole-matrix budgets,459 union и source/producer before/after fences присутствуют. Это проверка кода и finite oracles, не доказательство реальных459 cells, contrast, native keyboard, resource feasibility или cleanup.

Независимо просмотрены finally paths scene/context/observer/browser/runtime/display и host worker/DB/network/volume cleanup. Принудительная очистка помечает FAIL. У host runner отдельный false ACK по умолчанию; исходный126-й набор включает реальный cold ACKfalse отказ до allocation/Docker. Это положительные ограниченные результаты; finding001 блокирует приёмку полного review fence.

В ходе настройки собственного static control ошибочно предполагалась array-форма expected-cells.json вместо object.cells. Review attempt01 exit1 и stderr сохранены; исправлен только собственный reviewer script, затем13 controls PASS. Ошибки read-path/PowerShell wildcard при первоначальном чтении исправлены без изменения producer. Они не классифицированы как дефекты автора.

## Граница результата

Actual METHOD12 case08 FAIL остаётся исходным самостоятельным runtime blocker; этот review его не заменяет и не исправляет. Перед RUN может понадобиться новая source-bound helper revision после диагностики root. Human content HOLD остаётся; reviewed pack и полный P04/P05 не приняты. Docker functional RUN, браузер, X11, selector и контентная активация здесь не выполнялись.

Следующее действие: автор исправляет findings новой ревизией, выполняет тесты и передаёт точный новый checkpoint на независимую повторную проверку. Только после исправлений и PASS_PRODUCER_ONLY root может рассматривать operational ACK/feasibility/реальный layout RUN. Полный stage PASS остаётся отдельным гейтом.
