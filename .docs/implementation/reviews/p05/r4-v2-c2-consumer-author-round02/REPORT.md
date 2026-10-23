# C2 consumer02: исправление private counter oracle

**AUTHOR_ORACLE_FIXED_PENDING_INDEPENDENT_REPEAT. RUNTIME_REBIND_REQUIRED. Actual C2 NOT_RUN.**

Независимое замечание `P05-C2-PRIVATE-COUNT-ORACLE-001` из `.docs/implementation/reviews/p05/r4-v2-c2-consumer-independent-round01/INDEX.json` SHA `f51b268b4b17c118382923b1921bf6b9ccbd456d76ed9efd24e0e282ccc9ddb4` /15: consumer01 принимал фактическую private card=null как reported playable1/empty0. Это недостающая проверка измерителя; native preflightTopics правильно выводил счётчики из history. Product bug этим не доказан. Старый FAIL и consumer01 не переписаны.

## Узкая правка

`consumer.mjs` меняется только внутри `runPreflight`; остальное побайтно совпадает с01 (`targeted-diff.json`). Все три private counters обязаны быть безопасными неотрицательными целыми; private round.card должен быть явным null либо card reference; playable отдельно равен количеству non-null private cards, safe-empty — количеству null private cards. Только после этого выбирается status/результат. Старые суммы, caps, stages, full-union, consent/TTL boundaries, отсутствие retry и simulation-only ограничения сохранены. Никаких изменений приложения/движка.

66 finite controls PASS: прежние38 сохранены (positive-empty fake теперь также очищает private_history), formal empty→playable mismatch и обратный nonempty→empty mismatch, positive nonempty, missing card, по8 отрицательных значений каждого из3counters: negative/fractional/NaN/Infinity/unsafe/string/null/missing. Это author helper/fake controls, **0actualr4preflight calls**. Две syntax-проверки и ESLint — exit0.

## Привязка и фактический FAIL

`binding.json` намеренно побайтно прежний01; data03/CD877, synthetic wrappers/HOLD/approvalfalse и все source/runtime pins историческогоc454 не переименованы в current. Холодная проверка на текущем дереве **FAIL exit1**. `binding-drift01.json` фиксирует единственное тогдашнее отличие: `packages/relationship-engine/src/topic-planner.ts` SHA `229e2eb8480a9658462288e52d90c484b321e2ce0a8e12b8d5be9416613040bc` → `73f1cc9696665dd5c362cd471d832fbc81b04d105810322cf9103dfb720f3c35` в явной root-owned новой revision global exact-ID policy. Это ожидаемый fail-closed отказ старых pins. Исправление oracle можно независимо проверить без RUN; до любого фактического C2 нужен новый frozen source/dist rebind и его проверка. Root продолжает отдельную продуктовую правку; данные не подгоняются.

## Вызовы и неизменный объём

Cwd `C:\.projects\venus`, Node24.22.0. Доступны `consumer.mjs describe`, `check-binding`, и прежние single-cell `static|trajectory|canary <ordinal> --reviewed-draft`. Actual single-cell вызовы НЕ запускались. Все47040static/37072trajectory/336canary axes, исходные20/100boundaries, deferred positive-last-private и common-support prerequisites, prefix=null на preflight-refusal и отделение actual transport proof сохранены из01; новая revision не закрывает их старым helper PASS. Полный descriptor — `descriptor.json`. Предыдущая авторская история/проверки лежат в immutable `.docs/implementation/reviews/p05/r4-v2-c2-consumer-author-round01/`.

Не добавлены runner/supervisor/framework, не менялись seed/RNG/history/карточные тексты/registry/APPROVED status. Нужен независимый repeat замечания и точная runtime привязка. Human HOLD, actual C2/статистика/полныйP05 — pending. Откат: не использовать02; product state здесь не менялся.
