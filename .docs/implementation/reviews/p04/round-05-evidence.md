# P04 · Проверка450-card C2, раунд05

Reviewer `/root/p04_evidence_review`. Этот отчёт сохраняет обнаруженное в dirty candidate замечание **до исправления E09**; записан после получения исправления, вместе с отдельным повторным раундом06. Это исторический **CHANGES_REQUESTED**, а не описание текущего результата после исправления. Production/tests/validator reviewer не менял.

## Независимая проверка actual450 evidence

Read-only helper `C:/Temp/venus-p04-review-450.py` проверил все450 текущих raw card SHA-256 против exact input index, уникальные IDs, draft/needs_review/null reviewer/date,150 карточек на mode, canonical hash manifest payload и hash каждой карточки в manifest. Проверены actual C2 reports для capability[] и conditional private_text_chat. Полный producer заново не запускался; самостоятельно проверены сохранённые данные и их привязка к текущим входам.

- Catalog digest `08b327efd3071608ec14b21de6ebeaf91793f61d43c1a71968921967944ba306`.
- Pack digest `sha256:33ea855f5d03e15143728928fa89607512e386d390627008d883de68543bb45c`.
- Каждый capability profile:5880 eligibility cells,4214 neutral/negative sessions,420 private simulation profiles; supported baseline минимум25.
- Capability[]:210 private PASS +210 CAPABILITY_UNAVAILABLE;3275 выбранных private rounds в поддерживаемых profiles. Conditional chat:420 private PASS;6551 private rounds. Conditional online не объявляется production capability.
- Повторный P04 Python run до исправления:8/8 PASS, включая real ZIP(A)/receipt(B) rejection. Это не заменяет полноценный quality/remote CI.

Прочитаны fixed-before-measurement C2 protocol, actual CLI snapshot/filename/ID/raw-hash mapping, authoring request revision CAS и gate artifact provenance. Новая CAS revision сохраняет прежние mode/ID range, пишет old/new request в audit и отклоняет конфликтующее ожидаемое request SHA; обычный retry не переписывает request.

## E09 / P2 — исключённое private взаимодействие может иметь ненулевой eligible count

До исправления `validate_private_coverage` проверял expected статус исключения и baseline>=25 для supported rows, но не требовал нулевых private counts для RULE_EXCLUDED_STAGE/COMFORT/CLASS и CAPABILITY_UNAVAILABLE.

Самостоятельный probe взял actual questions/in_person/F/comfort1/stage1 cell, изменил group100→99 и pair_private0→1, сохранил общий eligible count100, baseline0, статус RULE_EXCLUDED_STAGE, все размеры/tuple sets. Обе функции `validate_coverage` и `validate_private_coverage` приняли отчёт. Вывод probe: `unexpected_result=ACCEPTED`. Actual450 reports корректны; дефект относится к reject logic validator и не означает наличие private карточек в stage1 в настоящем planner.

Требуемое исправление: при expected!=SUPPORTED требовать pair_private==0 и baseline==0; negative regression должен сохранять aggregate count и проверять все четыре типа исключения. Root уведомлён и выполнил исправление. Его независимое подтверждение, новые hashes и текущий статус находятся в раунде06; этот первоначальный FAIL не стирается.

Финального source SHA/CI ещё нет. Ни technical source acceptance, ни human rights/locale approval, ни EXIT-P04 PASS этим раундом не утверждаются.
