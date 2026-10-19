# Venus · Состояние реализации

Обновлено: 2026-10-19. **EXIT-P00 = PASSED, EXIT-P01 = PASSED, EXIT-P02 = PASSED, EXIT-P03 = PASSED.** Технический P03 принят двумя независимыми агентами по свежему exact-source CI. [PR #3](https://github.com/psewdon1m/venus/pull/3) проходит защищённую доставку; фактические CI/merge/main удостоверяются аннотацией immutable tag `p03-accepted-20261019` — заключительной записью журнала. Новое поручение владельца возобновляет автономные P04–P11. P04 IN_PROGRESS, [реестр](p04-registry.json) и [журнал](../../.history/2026-10-19-p04.md).

Реализованы foundation, комнаты и приватные настройки, server-side relationship engine, immutable snapshot, rounds и actor-scoped consent с повторной проверкой перед HTTP/WS delivery. [P03 guide и rollback](../P03_DEVELOPMENT.md), [реестр](p03-registry.json), [ADR-015](../adr/ADR-015-p03-engine-and-measurements.md), [ADR-016](../adr/ADR-016-p03-progressive-evidence.md).

## EXIT-P03

Measured source `8f3405d9ef1397c6adcd9f7aba42a5fd7382ef9b`, implementation identity `63a3b972c49214e52c6136204506969c4b35e99bb13b98887e7517fa5e47678a`. [Bound gate](evidence/p03/gate-report.json), [результаты и ограничения](evidence/p03/measurement-summary.md), [implementation PASS](reviews/p03/final-implementation.md), [evidence PASS](reviews/p03/final-evidence.md), [свежий CI8/8](https://github.com/psewdon1m/venus/actions/runs/39166967939), [происхождение и хеши артефактов](evidence/p03/ci-artifact-index.json), [журнал](../../.history/2026-10-18-p03.md).

Свежий Linux CI: quality42JS/89Python, четыре negative controls, OCI9/9, P02regression20tests/22proofs, P03 PostgreSQL/HTTP/WS19/19. Проверены consent/ACL/expiry/dispatch fence, stale clears, restart/pinning, encrypted restore/ledger и exact previous P02 OCI rollback с quiesce. Source8b и proofbc55 сохранены в immutable tag `p03-m3-proof-timeout-20261019`; его inference был остановлен лимитом60мин после125/126cells. Единственное последующее изменение включённых исходников — CI ceiling60→120. Все15preregistered inputs, seeds, samples, classifiers и thresholds неизменны; текущие данные получены заново на8f, прежние отчёты не переименованы.

Полный preregistered M3:70000sessions (10000/N2..8),3467600selected rounds, zero invariant violations;1836safe refusals сохранены с seeds/prefixes. Fairness42cells/84000sessions: max gap0.006601145≤0.02/max session share0.5. GF1000000paired opportunities: ratio1.010119735,95%CI[1.009027905;1.011212746]. Inference126cells/3pooled models: worst upper95%CI0.605316319≤0.65, zero declared deterministic decoder. По168progressive rows/section, early private0, cap/conditional anti-repeat проверены независимо.

Пределы: синтетический draft pack не разрешён production loader; human review каталога остаётся P04. Inference ограничен зарегистрированным observer/classifier и этими входами. Production offer отсутствует, public entry fail-closed; полный G1 UX/chat остаётся P05. Этот технический гейт не разрешает публичную эксплуатацию.

Фактическое завершение защищённой доставки записывается в JSON-аннотации `p03-accepted-20261019` на merged main: `git cat-file tag p03-accepted-20261019`. Эта запись продолжает журнал без изменения проверенного дерева. Original proof HEAD и его measured8f ancestry сохраняются отдельным тегом `p03-proof-20261019`; для существующего clone явно выполнить `git fetch origin tag p03-proof-20261019`. Standalone tree ZIP не содержит Git history: проверка требует Git clone/доступного Git object database. На момент данного proof commit финальные proof CI/merge ещё не утверждаются состоявшимися. На тот момент после receipt действовал STOP; новым поручением владельца работа возобновлена с P04.

## EXIT-P02

Source `8313ddd6453bd6f01fd73e272e0ac483807456c4`, implementation identity `2cd73ce9a52af8e13484fb05536a06f7eb36ca5890563a8de5700b55323a437a`. [Gate report](evidence/p02/gate-report.json), [security PASS](reviews/p02/security-final.md), [quality PASS](reviews/p02/quality-final.md), [реальный CI exact SHA](https://github.com/psewdon1m/venus/actions/runs/39149965285), [registry с requirement overrides](p02-registry.json), [журнал](../../.history/2026-10-18-p02.md). Предыдущие FAIL/CHANGES_REQUESTED сохранены.

Clean-source локально и CI: quality PASS (83 Python и8 JS tests,4 negative controls),20 actual PostgreSQL/HTTP/WS/browser tests и22 proof records, включая100 admission races; OCI9/9 PASS. Проверены private-free atomic bounded audit, HMAC fingerprints, padded preferences/replies, текущая acceptance, ACL, lifecycle boundaries, encrypted restore с identity/private-value/row-scope comparison и exact previous P01 OCI на generation1. Runtime image ID `sha256:3bef4edb2286052628887e18b5fa6a52b2e3d9c07e46259fa2dad4ceeb27898a`. Main требует quality/container-smoke/p02-integration от GitHub Actions app15368; signing/public release ещё P06/P07.

Public offer отсутствует: production admission fail-closed; доказательства входа только synthetic. Room host не operator. Игра/consent API относятся к P03; исходный автоматический P00 stage assignment сохранён исторически и уточнён явными overrides. Ни public legal readiness, ни игровые функции не отмечены выполненными.

## Исторический EXIT-P01

Проверенный source SHA: `224fd40ffdc0696c5eb292848be63fc3bb99a3fe`. Source identity: `3383fb6fbb3fd9adf4be6af039d81e3a06a6487a6deb1b1180905f87138031f8`. Последующие изменения содержат только status/registry/proofs/reviews/журнал/consistency manifest; validator сверяет весь остальной source inventory с проверенной Git-ревизией. Derived evidence не выдаётся за новый runtime build.

[PR #1](https://github.com/psewdon1m/venus/pull/1), [реальный PR CI](https://github.com/psewdon1m/venus/actions/runs/39144700647), [итоговый gate report](evidence/p01/gate-report.json), [implementation round3](reviews/p01/implementation-round3.md), [evidence round3](reviews/p01/evidence-round3.md). Два отдельных агента: PASS, 0 open findings. Round1 FAIL и его evidence сохранены; исправлены malformed URL, связь CI jobs/run/source, snapshot negative checks, Compose/image/log proofs и процедура rollback без удаления CI.

Локально и в GitHub Actions: lint/types/schema/i18n/docs/build PASS; 71 Python +3 JS unit tests PASS; четыре negative fixtures отвергнуты по ожидаемой причине на неизменённых исходниках. Clean-source OCI smoke:7 checks PASS, реальная PostgreSQL остановлена/восстановлена, readiness503 при сохранённой liveness200. App nonroot1000, read-only rootfs, cap_dropALL, no-new-privileges, без Docker socket; app port только127.0.0.1, DB не опубликована. Образ и логи прошли secret/canary checks.

Локальный OCI config image ID: `sha256:bd73addfd96407dd5de7baae77b97209c04b34b75c2022f9a37e56757b0b99c5`; registry manifest/signature ещё не созданы. Main требует quality/container-smoke от GitHub Actions app15368, strict up-to-date, PR, закрытых обсуждений; enforce admins=true, force push/deletion=false. Signing/release credentials отсутствуют в обычном CI; protected release реализуется P06.

Проверка связанной приёмки: `python -B tools/p01_gate.py verify`. Три P01 API requirement statuses VERIFIED записаны как overrides в P01 registry; исходный P00 CSV сохранён как исторический baseline.

## Исторический EXIT-P00

P00-2:253 trace rows,12 исходных ADR,33 API operations,162 центральных sections applicability; 63 исторических unit tests и9 checks, два независимых PASS round3. [P00 gate](evidence/p00-2-candidate-r3/gate-report.json), [контрактный review](reviews/contracts-round3.md), [evidence review](reviews/evidence-round3.md) сохранены. Byte archive проверяется переносимо; текущие нормативные inputs P00 не изменены. Приёмка P01 добавляет ADR-013, не переписывая принятые 12 ADR.

## Этапы

| Этап | Статус | Следующий результат |
|---|---|---|
| P00 | PASSED | Исторический P00-2, original inputs/reviews сохранены |
| P01 | PASSED | Foundation в main; прежние FAIL/PASS proof сохранены |
| P02 | PASSED | Rooms/private settings/retention/recovery, два независимых PASS |
| P03 | PASSED | Fresh exact-source CI8/8 и два независимых PASS; delivery receipt в accepted tag |
| P04 | IN_PROGRESS | Authoring/review pipeline; human RU/EN/TR/rights review обязателен |
| P05 | NOT_STARTED | Полный G1 UX/E2E, текст оферты/version, entry18+ |
| P06 | NOT_STARTED | Protected signing/release, host dependencies/operator, restore/rollback |
| P07 | NOT_STARTED | Реальный target host и ограниченный запуск |
| P08 | NOT_STARTED | Лицензированная Music |
| P09 | NOT_STARTED | Desktop Cinema |
| P10 | NOT_STARTED | Android/iOS publisher |
| P11 | NOT_STARTED | Calls |

P03 принят технически по fresh8f CI и двум независимым PASS; фактические protected proof CI/merge удостоверяются terminal receipt в accepted tag. Доставка P03 завершена: main579ca40, terminal receipt в accepted tag. Новое поручение возобновляет P04–P11; P04 начат. [Журнал P03](../../.history/2026-10-18-p03.md). P02 влит в main6efcb7d37d9fe4fc43db411e1e40052301a5175d, accepted history сохранена tagp02-accepted-20261018. Guest/operator scope зафиксирован отдельным overlay; room host не operator. Production offer отсутствует, public entry закрыт. Публичный release блокируется дальнейшими гейтами; source snapshots не подменяют проверки production host, auth, age/legal и media.

Журнал работы: [P01 · 2026-10-18](../../.history/2026-10-18-p01.md). Локальный образец из другого проекта не включён в Git, source inventory или image.
