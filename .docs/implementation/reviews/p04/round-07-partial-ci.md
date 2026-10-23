```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"4a7d5877b7e860d152c8c49ae768b646f3cb163f","source_identity_sha256":"9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77","scopes":["evidence"],"status":"IN_REVIEW","open_findings":[]}
```

# P04 · Независимая промежуточная проверка actual CI

**PARTIAL_CI_REVIEW_NOT_FINAL_ACCEPTANCE.** Четыре полных M3 measurement jobs ещё выполняются; final technical PASS не выдан. Этот файл нельзя использовать вместо финального PASS review/sidecar. Источник frozen4a7/identity9e75; implementation source не менялся, reviewer не редактировал production/tests/validator.

Самостоятельно выполнен read-only helper `C:/Temp/venus-p04-review-partial-ci.py` на настоящих downloaded CI files. Дополнительно сделаны независимые live GitHub API GET run/artifacts/jobs для39183818433: подтверждены exact source SHA, pull_request, attempt1; run пока in_progress/conclusion null.

Проверены все пять уже завершённых artifacts против live API metadata, actual ZIP SHA-256, полного actual member path/size/hash manifest, download receipt и извлечённых bytes. Проверены четыре completed job logs: actual upload IDs, log hashes, current API job ID/name/run/source/conclusion success. Никакие ZIP/API/лог данные не пересобирались и не редактировались.

| Artifact | Actual ID |
|---|---|
| container-smoke | 12156329251 |
| p03-integration | 12156893012 |
| p04-integration | 12157002605 |
| p02-integration | 12157387151 |
| negative-gates | 12157496586 |

Actual P04 ZIP SHA256 `aa135e49640ad719827cf73aeea985b67ec71301bffd25c266bd64d9c1143417`; producer — required p03-integration job117841956398, run39183818433/attempt1. Он реально выполнил P03 regression и отдельный P04 runtime/full-catalogue producer.

## P04 actual results

- Runtime13/13 обязательных proof records PASS; source exact4a7, synthetic. Присутствуют real CAS, read-only/auth/mutation compatibility, delayed actual HTTPS/WS withdrawal fences, private clears, fsynced intent после настоящего deferred PostgreSQL commit fault, full pg_dump/pg_restore с replay внешнего ledger, отсутствие ledger failclosed.
- Runner: source_dirty=false, forced_runtime_build=true, source identity before/after9e75, unchanged=true, cleanup completed. Source input inventory всех744 included files совпадает с текущим frozen source.
- Captured catalogue input index привязан к4a7, source_dirty=false, snapshot_directory_unchanged=true; все450 raw-card hashes совпадают с текущими файлами.
- Оба настоящих CI C2 reports прошли собственные calls exact coverage/private validators. Каждый содержит5880 cells/4214 neutral+negative/420 private profiles. Capability[]:210 private PASS+210 unavailable,3275private rounds; conditional chat:420PASS,6551private rounds.
- SHA256 actual coverage `6ffad26d3db4b72971e174b1697a47dab7ed7bdb5e6957b7b68a525e535e745c`; conditional `326cb4f43c8f6c4cdd56fcdcd73f4cf0ee1978f51c04eab11e4e6145bc96da49`. Они совпадают с ранее inspected450 development results, но их текущее происхождение — свежий actual CI ZIP, а не переименование старых данных.
- Отдельно проверены19 descriptors из durable local-4a7d587/local-check-index.json: actual сохранённые logs/reports/catalogue data соответствуют указанным hashes. Локальные проверки не подменяют незавершённые CI jobs.

Новых конкретных замечаний в проверенных bytes нет. Для завершения необходимы все девять artifacts, четыре completed M3 jobs, full packet/API/joblogs и финальный independent source-bound review. Даже после technical PASS полный EXIT-P04 остаётся заблокирован действительными человеческими editorial/safety/rights/RU/EN/TR approvals; source registry approved bundles пуст, production availability не утверждается.
