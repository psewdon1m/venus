# P04 · Gate preflight, раунд04

**PASS — NOT_FINAL_SOURCE_ACCEPTANCE.** Reviewer `/root/p04_evidence_review`; 2026-10-19T03:55:45+03:00. Scope: исправления evidence validator/actual ZIP binding и предварительная проверка C2 private-coverage logic. Это не source-bound acceptance, не technical packet PASS и не EXIT-P04 PASSED. Production/tests/validator reviewer не редактировал.

## Проверено самостоятельно

`python -B -m unittest discover -s tools -p 'test_p04*.py' -v` завершился **8/8 PASS**. В частности:

- Согласованные настоящий ZIP/member/manifest принимаются.
- При настоящем ZIP(A), неизменном правильном API ZIP digest и подменённых receipt/copied member(B) verifier теперь отвергает расхождение actual ZIP members. Это именно воспроизведённый в раунде03 E08, а не другой отказ из-за отсутствующего raw archive.
- Duplicate/missing coverage tuples, boolean eligible count, root self-review, недостаточные aggregate scopes и public-only pool вместо supported private baseline блокируются.
- Draft100/mode не превращается в human approval; wrong gate scope и branch-name вместо exact source отвергаются.

E08 закрыт по коду и исполняемому negative regression: validator обязательно читает все9 actual raw ZIP descriptors, сверяет их actual bytes SHA с API/receipt, ограничивает compressed/uncompressed/member budgets, проверяет безопасные уникальные member paths, заново вычисляет полный `(path,bytes,sha256)` manifest и сравнивает с receipt. Затем consumed copied files и producer mappings проверяются относительно этих реальных members. Versioned raw ZIP evidence не зависит от истекающего локального cache. Upload job logs/IDs, точный source/run и все прежние required checks сохраняются.

E04–E07 остаются исправленными по повторному чтению. В тест reviewer scopes добавлен второй fixture с двумя nonroot reviewers; эта ветка теперь действительно достигается. В осмотренном коде новых конкретных дефектов не обнаружено.

## C2 и границы этого PASS

Прочитан новый C2 code: per-interaction eligible counts, отдельный friend-or-more private baseline25 для100-round budget, явное разделение запрещённых stage/comfort/class, unavailable online capability и настоящего content gap,420 private simulation profiles. Actual capability[] и условная `private_text_chat` проверяются раздельно; публичные100 карточек не заменяют обязательный supported private baseline. Full reviewed helper также выполняет actual neutral/private coverage на реконструированном bundle.

Создание150 дополнительных private drafts/root final measurements продолжается; этот reviewer не утверждает, что новый450-card C2 catalogue уже прошёл полный source-frozen run. Ранее самостоятельно воспроизведённый300-card C1 report остаётся историческим результатом и не переименовывается C2.

Следующая обязательная проверка: stable commit/source inventory, полные свежие C2 actual measurements и PostgreSQL/HTTPS/WS tests, реальный exact-source remote CI, все raw archives/job logs/API metadata и финальный packet. Только после их проверки возможен отдельный source-bound technical PASS. Human editorial/rights/RU/EN/TR approvals по-прежнему отсутствуют; public catalogue unavailable, EXIT-P04 NOT_PASSED.

## SHA-256 осмотренных входов

| Путь | SHA-256 |
|---|---|
| `tools/p04_gate.py` | `d7351211e76e1aceae0a2795f1d926bab559b3b4b5c52f00d5206e380d33ab88` |
| `tools/test_p04_ci_members.py` | `61fae6bbc735fc39337dfa6900121e067aa3d12cf08779986023d6990e5ea4d9` |
| `tools/test_p04_gate.py` | `4af8cc63dd1ba4b3b0e0c3516912d1afdb0d066a96d0e287b906ab67faf0af64` |
| `packages/card-catalog/src/coverage.ts` | `43775e747447da32a34bc3fea6f6eb7a0811f9104d28fe1e4e0b613ca79366cc` |
| `tools/p04-integration.mjs` | `272d09b69d42d3c16e1af8c1ffb7278f0e6e7e9b149f69e84f5f063770821a36` |
| `tools/p04-verify-reviewed.mjs` | `70eebb8bcb317df172cf44dbfd72c4c062d76fbb5dd0cc8b022352c1c51ca321` |

Dirty implementation identity снимка `1976b74fd290e15b7a1fda6335e385c5b29771d1e2173ee42ffcff6194fddade`; baseline HEAD579ca40a9344fd0af841ff2e2883e394321dfbe7 не содержит эту реализацию. Меняющиеся authoring files намеренно не объявлены frozen. Предыдущие FAIL и сообщения сохранены.
