# Unified private channel: независимая проверка coverage

**PASS_SCOPED_COVERAGE_CODE_ONLY.** Findings нет в проверенной области. Reviewer не автор изменений. Это приёмка точных изменений `coverage.ts`/`catalog.test.ts` и их целевых тестов, не принятие карточек, V2 runtime, C2 каталога или EXIT-P04/P05.

Норма — ADR025/U018v3: один private text chat для V2 online/in_person, сохранённый backend flag/frozen capability/consent/ACL/TTL и baseline25 без actor multiplication. HistoricalV1/legacy C2 не превращается в V2 доказательство. Шесть точных входов закреплены в `inputs-before.json`/`results.json`; source bytes и собственный diff сохранены. В конце проверки все шесть hashes неизменны, глобальная source identity не заявляется: API/UI автор меняет отдельные файлы параллельно.

`coverage.ts:31–33` вычисляет private channel gate отдельно для текущих mode/context: без capability online сохраняет прежний отказ; in_person становится CAPABILITY_UNAVAILABLE лишь при непустом private pool, где **каждая** карточка явно требует chat. Пустой pool не проходит vacuous-every; одна legacy карточка без требования chat не маскирует реальную нехватку. Тот же predicate применяется к cells и private_sessions. При enabled capability baseline<25 остаётся CONTENT_GAP. Existing stage/comfort/X/J приоритеты, `eligible`/`preflight`, seeded snapshot, R100/private≤25/early-stage/no-repeat assertions и подсчёт stablecardIDs не изменены. Вынос modeCards за внутренний цикл не меняет его фильтр.

Повторён существующий meaningful9-test файл, **9PASS**, exit0. Собственные независимые4 теста в том же установленном Vitest5.0.5, **4PASS**, exit0:

- Empty in_person private pool остаётся CONTENT_GAP; online-off прежний CAPABILITY_UNAVAILABLE.
- Mixed required-chat+legacy-no-chat pool off не маскируется capability статусом, baseline1 и private_sessions не CAPABILITY_UNAVAILABLE.
- Online-only required card не меняет in_person legacy pool; полностью required pool off недоступен; stage/comfort/X/J rule precedence сохранён.
-24stableIDs дают gap,25 — supported и count25 как дляN2, так иN8; actor permutations не умножают контент, пороги25/R100 прежние.

Изменённые два файла прошли scoped ESLint exit0. Команды/сырые логи/реальные результаты записаны в `results.json`, `existing-tests.txt`, `independent-controls.txt`, `scoped-lint.txt`. Node24.22.0 — существующий закреплённый runtime. Независимые controls — обычный исключённый leaf test/config для существующего Vitest, без собственного framework. Globaltsc координирует авторAPI/UI; я его не запускал и fullsuite не заявляю.

Первоначальные authorunit01/02 FAIL fixture semantics/placeholder не переписывались; их hashes и исправленный author03 сохранены как references в results. На моей целевой проверке ошибок не было; первое чтение угаданного имениADR было read-only missingpath, исправлено на действующийADR025.

Границы: r3/r4 metadata, реальные470карточек, human HOLD и полный coverage report здесь не выполнялись и не одобрялись. Capability-disabled profile нельзя использовать как замену enabled-content25. Этот adapter остаётся P04 legacy coverageReport; новый V2 planner/C2 и API/UI eligibility/transport требуют собственных actual source-bound проверок. Нельзя наследовать этот PASS изменённым bytes или объявить общий private_coverage PASS без действительного результата нового каталога.

Записи source/test implementation не менялись. Собственный packet и journal завершены; root обновляет общий manifest после остальных авторов.
