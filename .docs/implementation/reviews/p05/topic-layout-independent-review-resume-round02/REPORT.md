# P05 layout459 — независимая повторная проверка resume02

**PASS_LAYOUT_PRODUCER_METHOD_ONLY.** Оба предыдущих P2 закрыты для точных bytes этого producer. Открытых P1/P2 в повторно проверенном scope нет. Это не фактический layout/functional/stage PASS и не разрешение на RUN.

Reviewer `/root/p05_oci_author_resume` не является автором layout. Проверены все132 файла author packet `b05997403da63a99fac19e33fc0a03ff42ff44b0d1b69167bbf051439cc8b394`, HANDOFF `29593149fb291c4e6eaf6991d873b38697f41fd3bc8cfba94d554691892c98b8`, их точная working copy и included source1274/1813. Принятая только как методика тройка:

- source identity `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad`;
- image `sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4`;
- actual producer runtime digest `d5aabd06dd1b6528d25b7574dc3503ad4c2f7f2a0476f49777b0aeda0dc510e1`.

## Предыдущие findings

**LAYOUT-R01-001 — CLOSED, method scope.** В [host runner](../topic-layout-author-resume02/producer/run.mjs) теперь source, image и обязательный64hex producer_runtime_digest из фактически прочитанного hash-checked review JSON сравниваются с actual binding/inventory/root ACK до inventory allocation и Docker. Независимый replay точного AST принимает совпадающий tuple, а contrary/missing image/runtime, contrary source, wrong review SHA и отрицательный verdict отвергает до Docker, secret/output allocation и source captures. Это повторение исходных counterexample, не только чтение новых author тестов.

**LAYOUT-R01-002 — CLOSED, method scope.** [DOM/focus oracles](../topic-layout-author-resume02/producer/dom-audit.mjs) теперь консервативно отклоняют неподдерживаемые paint contexts у узла и предков. Независимые fake-computed-style проверки точных функций повторяют brightness(0)/opacity(0), а также backdrop filter, blend, mask, clip, opacity и content visibility на узле/предке: DOM сообщает unresolved, focus не выдаёт visible/contrast PASS, строгие assertObservation/assertKeyboard отвергают результат. Обычный flat sRGB positive сохраняется. Порог контраста и доступности не понижен; это проверка оракула, а не реальных пикселей Venus.

## Проверки и сохранённые границы

Повторены130 исходных finite controls, exit0:28 contract,57 permission/deadline/DOM/PNG/ACK,14 exact keyboard VM и31 exact host-runner VM. Дополнительно выполнены13 независимых static/AST/binding проверок и27 independent correction controls. Все170 PASS в заявленном finite scope. [Повторные результаты](finite-repeat.json), [независимые bindings](static-bindings.json), [исходные контрпримеры после исправления](correction-controls.json).

31 helper теперь совпадает с exact accepted METHOD13 source `5b5e251c910ce1f27d7138723bc0bb2f4eccedd2e7d9cebc1405d559fda8f7d9`; проверены AST text/hash/extraction bytes и inclusion в новом scene-driver. Upstream independent review `d871a3b677939fdae7fff04ed9dc5254830f1ff3d6617a10728fbc3894d48f41` имеет PASS_METHOD_ONLY для того же source/image. Observer03 `891301…`, request module и source-bound frontend inputs остаются прежними; model-only не переименован в cache.accept/auth-generation proof. Принятие METHOD13 распространяется на код методики, а не на его последний реальный исход.

459 точных ID и состав360+45+54, nine51-cell shards, реальные primary/secondary/observer из plan, geometry/native safety-before-reset, физический X11 zoom/DPR/reflow, shared scene budgets, reduced motion/computed styles, screenshot limits/masking и aggregate closure сохранены. Runtime, matrix, X11 и жизненные сроки не подменены inert fixtures или новыми таймерами. Изменения сравнены с предыдущим independently reviewed scope; source/image/build receipt повторно закреплены. Чужие producer, source, journals и старые PASS/FAIL не редактировались.

**Остающийся actual blocker:** последний реальный METHOD13 run дал7 PASS, case08 `topic-new` HTTP409 и оставшиеся NOT_RUN; root проводит отдельную диагностику. Этот отчёт не исправляет и не стирает тот FAIL, не утверждает реальных459 cells/native keyboard/contrast/cleanup/resource feasibility и не создаёт root ACK. Human content470 HOLD и полный P04/P05 остаются открытыми.

После исправления browser base root должен проверить применимость точных helper bytes. Любая замена helper/source/runtime меняет принятый digest и требует новой binding revision и независимого решения; этот PASS нельзя переносить на другие bytes. Только после этого root рассматривает operational ACK и реальные shards. Итоговая actual459 union и полный EXIT-P05 проверяются отдельно.
