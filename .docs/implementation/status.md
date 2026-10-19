# Venus · Состояние реализации

Текущий исправленный каталог: [450 draft-карточек p04-r2-full](../content/p04-r2-full/cards/), canonical catalog `5de601019fc8eae1c9491a610984e485e3fedce0d36d3d1326b8a589ee528bd4`. Он содержит 378 сохранённых активных карточек и 72 новые замены; 71 вынесенная в правила карточка и YB-1148 исключены. [Фиксация точных байтов](evidence/p04/review-450-full-coverage/final-card-map.json), [решения по 21 семантическому кластеру](evidence/p04/review-450-full-coverage/semantic-cluster-dispositions.json). Исправления проходят свежие проверки; reviewed registry остаётся пустым до отдельной контентной приёмки.

Обновлено: 2026-10-19. **Активный профиль — standalone-local-pilot-v2.** P00–P03 и P04-TECHNICAL-1 имеют исторические принятые source revisions. Новый план v2 и mock-entry проходят отдельную приёмку; старый PASS не переносится на новые байты. Владелец предоставил полный review450 с HOLD, исправления и новый полный draft-кандидат готовятся. Exocortex/Updater, настоящие legal документы и production-host больше не блокируют локальный scope. [Решения v2](user-decisions.v2.json), [план](../10_IMPLEMENTATION_PLAN.md), [локальный компонент](../LOCAL_PILOT.md), [журнал оркестратора](../../.history/2026-10-19-orchestrator.md).

Реализованы foundation, комнаты и приватные настройки, server-side relationship engine, immutable snapshot, rounds и actor-scoped consent с повторной проверкой перед HTTP/WS delivery. [P03 guide и rollback](../P03_DEVELOPMENT.md), [реестр](p03-registry.json), [ADR-015](../adr/ADR-015-p03-engine-and-measurements.md), [ADR-016](../adr/ADR-016-p03-progressive-evidence.md).

## Исторический P04 · Source4a7 до standalone v2

Source `4a7d5877b7e860d152c8c49ae768b646f3cb163f`, identity `9e75a7d70a591b38dafcf40c8dbea6a7383fc97d561bd5b739d9513c70062f77` (744 included files). [Actual CI8/8](https://github.com/psewdon1m/venus/actions/runs/39183818433), [технический пакет](evidence/p04/ci/technical-gate.json), [фактические результаты обоих валидаторов](evidence/p04/ci/gate-evaluation.json), [независимый implementation PASS](reviews/p04/final-implementation.md), [независимый evidence PASS](reviews/p04/final-evidence.md), [процедура повторной проверки](evidence/p04/ci/reproduction/README.md).

Clean quality52JS/98Python/4negative, OCI9/9, P02 actual20tests/22proofs, P03 actual19tests и P04 actual11tests/13proofs — PASS. Все9 raw CI ZIP сохранены с API digest, полными member receipts и8 producer job logs. Полный M3 regression относится к прежнему зарегистрированному synthetic pack; отдельные actual/conditional C2 reports проверяют450draft и private availability. Это не доказательство редакционной, языковой или правовой пригодности.

Полный validator фактически возвращает BLOCK/exit1 до genuine human approvals и реконструкции reviewed pack. [Пакет для реальных редакторов](evidence/p04/human-handoff/README.md) готов; approved registry пуст, reviewed0/450, public entry закрыт. После изменения каталога/approved registry требуются новая source identity и актуальные tests/reviews. [Draft PR4](https://github.com/psewdon1m/venus/pull/4) остаётся техническим кандидатом; merge/accepted tag/full stage PASS не выполнены. Возврат: оставить main579ca40; проверенная live withdrawal/revocation ledger продолжает запрещать отозванный контент при смене pointer или restore БД.

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
| P04 | IN_PROGRESS | Предоставлен owner review450 HOLD;450dispositions/71MOVE→UX, отдельные r2 corrections и72новых ID восстанавливают coverage. Новый reviewed pack ещё не принят |
| P05 | IN_PROGRESS_COMPONENT | Mock legal разрешён; отдельный18+ обязателен. Entry5unit/24independent/9DockerpreflightPASS; fullGames/privatechatE2E и reviewed pack ещё не приняты |
| P06 | REDESIGN_IN_PROGRESS | Venus-owned updater и host-file backup по ADR019. ExternalUpdater/Part13 не нужны; старая отдельная подготовка сохранена исторически |
| P07 | NOT_STARTED_LOCAL_SCOPE | После P05/P06: локальныйDocker install/restore/load/soak. Production target/DNS/TLS отложены и не блокируют localEXIT |
| P08 | DEFERRED_OWNER | Владелец отложил выбор музыки; G2 не объявлен PASS |
| P09 | DESIGN_IN_PROGRESS | Один встроенный media server вDocker на том же хосте дляCinema/Calls; Hermes audited какpairP2P reference. Media implementation/E2E ещё NOT_RUN |
| P10 | DEFERRED_OWNER | Мобильная публикация отложена владельцем; G4 не объявлен PASS |
| P11 | SCOPE_ACCEPTED_NOT_IMPLEMENTED | Общие8 и приватные2 Calls используют один media-server transport; разныеACL/rooms/grants, отдельнойP2Pветки нет |

P03 принят технически по fresh8f CI и двум независимым PASS; фактические protected proof CI/merge удостоверяются terminal receipt в accepted tag. Доставка P03 завершена: main579ca40, terminal receipt в accepted tag. Новое поручение возобновляет P04–P11; P04 начат. [Журнал P03](../../.history/2026-10-18-p03.md). P02 влит в main6efcb7d37d9fe4fc43db411e1e40052301a5175d, accepted history сохранена tagp02-accepted-20261018. Guest/operator scope зафиксирован отдельным overlay; room host не operator. Production offer отсутствует, public entry закрыт. Публичный release блокируется дальнейшими гейтами; source snapshots не подменяют проверки production host, auth, age/legal и media.

Журнал работы: [P01 · 2026-10-18](../../.history/2026-10-18-p01.md). Локальный образец из другого проекта не включён в Git, source inventory или image.

Текущий P04: [журнал](../../.history/2026-10-19-p04.md), [реестр](p04-registry.json), [human handoff450](evidence/p04/human-handoff/README.md), [чистые локальные evidence](evidence/p04/local-4a7d587/local-check-index.json), [final implementation](reviews/p04/final-implementation.md), [draft PR4](https://github.com/psewdon1m/venus/pull/4). [Конкретные внешние входы оставшихся этапов](evidence/future-preparation/operator-inputs.json) не являются согласованиями. Ранние исследования/аудит зависимостей имеют отдельные журналы [P05](../../.history/2026-10-19-p05.md), [P07](../../.history/2026-10-19-p07.md), [P08](../../.history/2026-10-19-p08.md), [P09](../../.history/2026-10-19-p09.md), [P10](../../.history/2026-10-19-p10.md), [P11](../../.history/2026-10-19-p11.md). Журнал подготовки P06 находится в её отдельном managed checkout; окончательный release gate не заявлен.

## Передача новой ревизии

[Owner review450](evidence/Venus_P04_FULL_REVIEW_450_2026-10-19.md) сохранён неизменным. [Обработка450решений](../content/p04-r2/dispositions.json) и [независимый content round01](reviews/p04-r2/round-01-review450-validation.md) показывают конкретные исправления/оставшиеся findings; human approval изменённых/new карточек не выдан. [Новая применимость входов](operator-inputs.v2.json) заменяет прежние внешние блокеры.

[ADR019](../adr/ADR-019-standalone-local-pilot.md), [Hermes audit](evidence/hermes-audit-20261019.md), [строгая новая source revision](source-revisions.v2.json). Независимые проверки сохраняются в reviews/standalone; каждый агент ведёт `.history/agents/`.
