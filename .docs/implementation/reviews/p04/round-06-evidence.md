# P04 · Повторная проверка E09, раунд06

**PASS — NOT_FINAL_SOURCE_ACCEPTANCE.** Reviewer `/root/p04_evidence_review`; 2026-10-19T04:07:58+03:00. Scope: исправление C2 exclusion-count validation и повторная проверка actual450 input/manifest/coverage mapping. Production/tests/validator reviewer не менял. Новых открытых конкретных замечаний к этому preflight scope нет; финальная source-bound приёмка ещё не выполнялась.

E09 из раунда05 закрыт: для каждого excluded/unavailable profile validator требует pair_private==0 и baseline==0. Самостоятельно выполнен `python -B -m unittest discover -s tools -p 'test_p04*.py' -v`: **9/9 PASS**. Новый negative test проверяет четыре случая RULE_EXCLUDED_STAGE/COMFORT/CLASS и CAPABILITY_UNAVAILABLE, сохраняя aggregate eligible count. Повторный собственный probe со stage1 private count1 теперь даёт `BLOCKED: excluded private interaction incorrectly eligible`.

Собственный450-card helper повторно подтвердил raw input/manifest hashes, draft-only boundary и оба actual C2 reports. Catalog/pack digests и результаты совпали с раундом05:150draft/mode;5880 cells/4214 neutral+negative/420 private profiles на capability profile; prod210 PASS+210 unavailable/3275private rounds; conditional420 PASS/6551private rounds; min supported baseline25. Это проверка существующего actual report, не заявление о повторном полном planner run.

E04–E08 остаются закрытыми в осмотренном коде, включая настоящие ZIP bytes и полный manifest. Protocol C2 фиксирован до final measurement, старые C1/300/375 evidence сохранены. Последующие source changes требуют повторного source-bound review; никаких signing/human approval records этот агент не создавал.

## SHA-256 inputs

| Путь | SHA-256 |
|---|---|
| `tools/p04_gate.py` | `931a77f0da5d8edb9d5940e3917dfc8afc056a0c4d15eab085e72823f1ec1580` |
| `tools/test_p04_gate.py` | `6f4fdf3997721bb28dfd228b9cc1c24c5748cecd47f495b8f9d182ffc8ad440c` |
| `.docs/implementation/p04-coverage-protocol-v2.json` | `2b0ff6bc73b853d030249e5ff5d00f76060edc31b721aafd7501a2a4e5e96b2a` |
| `packages/card-catalog/src/authoring.ts` | `4451d3260b0acef99a714d7fe7ef63641604841fa90e1eedc445c8532ee7a295` |
| `tools/card-catalog.mjs` | `926f4727949ebd404cc9e09764664a93a45a87cd23a8400f683514b6fb5ba6e6` |
| `.docs/implementation/evidence/p04/draft-author-450/analysis.json` | `e93539f68a63a57bc2866221b1292c87eb62c53efb9d3e1cec735e6c345dae78` |
| `.docs/implementation/evidence/p04/draft-author-450/coverage.json` | `6ffad26d3db4b72971e174b1697a47dab7ed7bdb5e6957b7b68a525e535e745c` |
| `.docs/implementation/evidence/p04/draft-author-450/coverage-private-chat.json` | `326cb4f43c8f6c4cdd56fcdcd73f4cf0ee1978f51c04eab11e4e6145bc96da49` |
| `.docs/implementation/evidence/p04/draft-author-450/input-index.json` | `9b242bbc1a14e43625b1df41f05ea6b11edbdfe312e5bdb6b48fb27d9fbae7a5` |

Dirty implementation identity снимка `9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77`; baseline HEAD579ca40a9344fd0af841ff2e2883e394321dfbe7 ещё не является source этой реализации. Требуются frozen commit, свежий exact-source CI и independent final artifact/packet review. EXIT-P04 остаётся NOT_PASSED до genuine human editorial/rights/RU/EN/TR approvals и остальных применимых условий; production approved bundle отсутствует.
