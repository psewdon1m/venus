```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"4a7d5877b7e860d152c8c49ae768b646f3cb163f","source_identity_sha256":"9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77","scopes":["evidence"],"status":"PASS","open_findings":[]}
```

# P04 · Финальная независимая проверка доказательств

**PASS только для evidence scope P04-TECHNICAL-1.** Полный EXIT-P04 остаётся NOT_PASSED: genuine human editorial/rights/RU/EN/TR reviews отсутствуют, 450 карточек остаются DRAFT, approved production catalogue отсутствует. Этот отчёт — независимый вход для финального technical packet; отдельный реальный запуск полного technical validator после сборки пакета выполняет root. Сам reviewer не редактировал production/tests/validator и не создавал human approvals.

## Точный источник и способ проверки

Frozen implementation commit `4a7d5877b7e860d152c8c49ae768b646f3cb163f`, inventory identity `9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77`, 744 included files. Независимая сверка exact Git archive с текущими input bytes и CI source-inputs прошла; derived evidence/journal commits не подменяют этот implementation source. Все 19 durable local receipts проверены по фактическим bytes/SHA-256.

Самостоятельно выполнены read-only helpers `C:/Temp/venus-p04-review-frozen-source.py`, `venus-p04-review-partial-ci.py` (финальная сверка уже9 ZIP/8 completed jobs), `venus-p04-final-evidence-independent.py`, `venus-p04-final-regression-reports.py`. Полный mathematical validator P03-M3 получил четыре настоящих unmodified report.json непосредственно из retained raw ZIP; адаптер чтения только выбирал эти проверенные member bytes, source/protocol/preregistration checks выполнялись штатно. Итоговых PASS reviews в этой проверке не подставлялось. Дополнительно самостоятельно повторно выполнены девять P04 Python gate negative/unit tests:9/9 PASS.

## Настоящий CI и provenance

Actual GitHub Actions [run39183818433](https://github.com/psewdon1m/venus/actions/runs/39183818433), pull_request, attempt1, exact source SHA выше, workflow `.github/workflows/ci.yml`, Venus CI, same head/base repository `psewdon1m/venus`: completed/success,8/8 required jobs. Независимые свежие live API GET run/jobs/artifacts совпали с сохранёнными ID/name/digest/source/conclusion. Проверены9 actual ZIP,9 download receipts, полные unique/safe actual member manifests,26 copied members,8 actual producer job logs и реальные upload Artifact IDs. Каждый ZIP SHA совпал с live API digest; каждый receipt/member и copied byte связан с этим ZIP. Полные M3 reports остаются внутри versioned raw archives и не зависят от истечения GitHub cache.

P04 actual producer — блокирующий шаг существующего required `p03-integration` job117841956398; он загрузил отдельный p04-integration artifact12157002605. Успех соседнего job или локальный copied report не использовался вместо фактического P04 запуска.

| Artifact | Actual ID | SHA-256 оригинального ZIP |
|---|---|---|
| p03-measurements-invariants | 12158572156 | `c5157657cb213df437b780b43d08541acb43a503af289b66e8dc343bff15eac0` |
| p03-measurements-inference | 12158519263 | `5a213564950cb7d2f43ab3838d7f5812efbbe4e3419c147295805dde4babc9b1` |
| p03-measurements-gf | 12157848050 | `e6eb8e90d8d527ce38eefc3acf8631dad72f50058ddb30aeb2b0477155c57210` |
| p03-measurements-fairness | 12157777553 | `55b0778c2b9aa3e274ddb207b0a691fc9897f7e67c6d500d62f831efef7b8794` |
| negative-gates | 12157496586 | `163b46016bf603c8e9b0075bc2978d69650b8ddae8d61d9eae8a761e5c68cb8b` |
| p02-integration | 12157387151 | `5e3e5df939442d4d6e5ceb1dc1058253af9062e66aba97260e27d57c75c11b18` |
| p04-integration | 12157002605 | `aa135e49640ad719827cf73aeea985b67ec71301bffd25c266bd64d9c1143417` |
| p03-integration | 12156893012 | `7f890439a7d6d301ab910666dd551c7f41c4f7866ec41c8742f4c9ec87f413d3` |
| container-smoke | 12156329251 | `ded41f297a79bc6cde280cf9016f3c96381a8c643c59fd9144de6d659da6c830` |

Actual quality log подтверждает52 JS/98 Python tests PASS, schema/i18n/docs/build/historical gates и4 corruption controls. Negative controls schema/locale/type/unit имеют positive_exit0 и настоящий nonzero negative_exit; exact clean SHA/identity, source_before==source_after. Cache save contention в логе не менял вывод тестов и job conclusion.

Свежий live GET main protection равен сохранённому `main-protection.json` (`ce491d36d351acb6794473ed141ab6dd454983fcbeda199ece336e6a5e48b67a`): strict=true,8 точных required contexts с app_id15368, enforce_admins, PR workflow, linear history, conversation resolution; force pushes/deletions запрещены. Protection не ослаблялась. `ci-artifact-index.json` SHA `c78958b6bec8dd05b6fca80196da46e2d0d996dc716345788904781ec4cfb449`.

## Runtime и регрессии

Actual P04 runtime13/13 required proof records PASS, source clean/synthetic; runner forced fresh build, source before/after unchanged identity, cleanup completed. Проверены точные уникальные required/record sets, не только число записей. Покрыты atomic pointer/CAS, shortage ACL, pinned rollback, mutation receipts, readonly/auth/public HTTP compatibility, delayed HTTP/WS revoke fences, private revoke clears, фактический deferred PostgreSQL commit failure после fsynced external withdrawal intent, реальный pg_dump/pg_restore и withdrawal-ledger replay, отсутствие ledger failclosed. Это тестовые изолированные PG/HTTPS/WS сценарии; production rollout не выполнялся.

Actual source-bound regression reports: container9/9 proof records, P02 22/22, P03 19/19; каждый exact4a7, source_dirty=false и все proof IDs уникальны/полны/PASS. P02/P03 runners завершили cleanup. Локальный clean-source пакет отдельно подтверждает quality52JS/98Python/4negative, container9, P02/P03/P04; его19 receipts проверены, локальный результат не заменял CI.

## Полные M3 статистические результаты

Все15 preregistered raw inputs совпали с текущими bytes и immutable preregistration tag. Во всех четырёх actual reports source4a7/identity9e75 clean, before/after unchanged, forced build до runtime import, полный protocol/pack digest, gating=true/probe=false. P03-M3 размеры/пороги не уменьшались; top-level PASS проверен против raw counters, progressive strata/seeds, heldout scores и пересчитанных доверительных границ.

- Invariants:70,000 sessions,15 invariant records,0 violations;1,836 документированных safe refusals, включая prefixes, без подмены completed sessions.
- Fairness:42 Cartesian strata,84,000 sessions; progressive168 stage rows, invitations/denominators пересчитаны; максимальный aggregate share gap0.006601144198327691 при пороге0.02.
- G/F:1,000,000 paired opportunities, ratio1.010119735002735;95% CI[1.0090279052580886,1.0112127461737674], нижняя граница>1; raw paired counts/covariance согласованы.
- Inference:3 comparisons FG/FM/GM,126 strata,100 train+400 holdout/class/stratum и pooled16800 holdout/class. Raw heldout scores пересчитаны штатным validator: max pooled95% upper0.5109033592443676, max stratum upper0.6053163182047094 при пороге0.65; structural deterministic decoder lists пусты. Это конечная preregistered public-transcript диагностика, не универсальное доказательство отсутствия всех возможных inference атак.

| Actual ZIP member report | SHA-256 |
|---|---|
| invariants | `6ee962619b94cf280aa9b0cccec50ad80dfb1303020945b770e50823cd9bcadf` |
| inference | `9ac7106e613029dccc91e5da9233c93f2c5146c857ed08630021b5bc12db20d1` |
| gf | `35662c0669b9f586ce1fcbb25ca0f236a22877c40446705bfc1680be4ac09cd5` |
| fairness | `f574a1dc3407301563b63f079e062d053544125019fa1acc465d87a28f528ff4` |

## Каталог450 и C2

Actual runtime producer после runtime выполнил full draft catalogue check из frozen raw450 inputs; input-index source clean4a7, snapshot unchanged, hashes всех450 файлов совпали с source inventory. Анализ:150/mode (100public+25private in_person+25private online), exact_duplicates0. Все карточки DRAFT/needs_review с пустыми human reviewer/date; ни агент, ни подпись fixture не считаются human review.

Catalog digest `08b327efd3071608ec14b21de6ebeaf91793f61d43c1a71968921967944ba306`; pack digest `sha256:33ea855f5d03e15143728928fa89607512e386d390627008d883de68543bb45c`. C2 protocol фиксирован до final measurements. На каждом capability profile проверены5880 точных eligibility tuples,4200 neutral sessions1…100 и14 expected all-X refusals,420 private profiles; отсутствие/duplicate/relabel tuple не скрывается общим count.

Actual capabilities[]:210 private PASS+210 CAPABILITY_UNAVAILABLE,3275 private rounds. Conditional private_text_chat:420 private PASS,6551 private rounds. Supported private baseline>=25; stage1/2,comfort0,X/J и unavailable online имеют private eligible=baseline0. Каждый100-round private session соблюдает cap<=25, anti-repeat; conditional online fixture не утверждает наличие production private chat capability. Uniform synthetic class profiles не покрывают все смешанные графы; exact duplicate/Jaccard checks не подтверждают семантическую оригинальность и качество переводов.

Actual CI coverage SHA `6ffad26d3db4b72971e174b1697a47dab7ed7bdb5e6957b7b68a525e535e745c`; conditional SHA `326cb4f43c8f6c4cdd56fcdcd73f4cf0ee1978f51c04eab11e4e6145bc96da49`; analysis SHA `e93539f68a63a57bc2866221b1292c87eb62c53efb9d3e1cec735e6c345dae78`; runtime SHA `3d330ca705677eaf0cef13e268eb1491546a0fb32fc79e9494334eed15043544`.

## Заключение и границы

Новых открытых замечаний к замороженному evidence scope нет. Ранее выявленные E01–E09 исправления сохранены; собственный повторный запуск9 P04 gate tests подтвердил reject для receipt substitution/actualZIP mismatch, count-only coverage, false private baselines/exclusions, fabricated self-review/scope и human-vs-technical boundary. Старые dirty60/300/375/preflight evidence сохранены как исторические и не выдаются за финальный clean run.

Evidence scope **PASS**, open_findings[]. Human reviews не подменены, approved production pack не создан. EXIT-P04 **NOT_PASSED**, последующий production stage/rollout этим отчётом не разрешён. Root должен завершить отдельную сборку двух независимых review descriptors и фактический `verify-technical`; полный `verify` обязан оставаться заблокирован на genuine human acceptance.
