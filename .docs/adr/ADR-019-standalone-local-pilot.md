# ADR-019 · Самостоятельный Venus и локальный Docker-пилот

**Дата:** 2026-10-19. **Статус:** `ACCEPTED_SCOPE / IMPLEMENTATION_PENDING`.
**Решение:** прямое сообщение владельца проекта от 2026-10-19, пункты 1–10. **Применимость:** `standalone-local-pilot-v2`, план v2.0.0. **Принимающие реализации:** отдельные независимые агенты по U-004; автор не принимает собственные изменения.

## Контекст

План v1 переносил central Exocortex/Updater требования на Venus, ожидал внешний SFU и реальный target host. Владелец явно изменил продуктовую/операторскую границу: Venus самостоятельный, один хост, локальные Docker-тесты, приглашённые друзья. Сохранение прежних интеграций как обязательных блокеров противоречило бы прямому поручению.

Новые решения не доказывают готовность реализации. Ранее подготовленный P06 external-Updater verifier и предложения внешним проектам — исторические исследования, не принятая новая архитектура и не релиз Venus. Их тесты сохраняют исходную область действия.

## Принятые решения

1. Venus не включён в Exocortex и не зависит от внешнего Updater/Neptune/Gryphon/Wyvern/Window. Полезные механизмы реализуются внутри проекта с собственными contracts, versions, health и журналом.
2. Встроенное обновление имеет operator UI/API, подписанные bounded artifacts, backup-before-mutation и durable recovery. Веб-процесс не получает Docker socket или произвольный shell. Нужен отдельный узкий Venus-owned исполнитель; его конкретная модель ещё требует ADR/tested privilege boundary.
3. Venus атомарно сохраняет полный согласованный backup в файл на хосте. Внешний механизм копирования этого файла находится вне Venus. Проверки restore, целостности, encrypted preferences и независимого восстановления ключей обязательны. Принятые ранее сроки хранения не отменены: файлы Venus имеют срок/удаление ≤7 дней; фактическое соблюдение срока внешними копиями нельзя утверждать без внешнего evidence.
4. Metadata-only deletion/withdrawal ledgers сохраняются на отдельном защищённом volume вне DB-backup rollback. Старый backup не возвращает отозванный контент или истёкшие отношения; missing/corrupt/regressed ledger даёт fail-closed.
5. Весь принимаемый сейчас стенд — локальная Docker-инфраструктура одного хоста. Real production server/DNS/TLS не нужны для local EXIT. Planned domain `venus.shmoza.net`, Cloudflare и certbot default paths не означают их фактическую настройку. Public-network/support claims требуют будущих испытаний.
6. Для приглашённых друзей legal documents временно используют явные mock values. Отдельное явное подтверждение 18+ обязательно при входе; отсутствие/отказ не открывает admission. Mock notice не превращается в реальную оферту и не подтверждает legal readiness.
7. Внешний SFU не требуется. В отдельном прямом ответе чата 2026-10-19 владелец выбрал «Встроенный медиасервер на том же хосте». Это отдельный hardened process/service внутри Venus Docker deployment, с version/digest pins, compatibility matrix и собственной local media readiness. Конкретный сервер/реализация определяется source/license/security audit и prototype. Hermes рассматривается как двухсторонний reference, не как доказательство 8-party готовности.
8. Calls включает общий комнатный звонок и приватные pair calls. Обязательны независимые ACL, минимальные grants, явные mic/camera permissions и доказанный отзыв доступа, включая старые tokens/rejoin.
9. Music ждёт решения владельца по материалам, mobile отложен по приоритету: оба `DEFERRED_OWNER`, не PASS. Их отключение не блокирует независимые Cinema/Calls в локальном scope.
10. Предоставленную владельцем полную рецензию450 принять как фактический вход: её итог **HOLD**. Обработать все индивидуальные и глобальные замечания, сохранить исходный документ, увеличить revisions изменённых карточек, повторить hash-bound review/coverage. Нельзя трактовать предоставление документа как APPROVE текущего набора.

## Что заменено и что сохранено

В пределах нового scope superseded обязательность внешних central agents/Part13 enrollment, external Updater handoff и отдельно обслуживаемого SFU из ADR-001/008 и плана v1. Импортированные нормативные snapshots, исходные P00 contracts, исторические ID и evidence не редактируются. Применимость 118 Part12 problem IDs переоценивается по каждому ID; общие security/recovery требования сохраняются независимо от происхождения.

U-001–U-005 остаются историческими решениями. Retention room-only/idle24h/primary≤24h/backup≤7d, настоящие consent/privacy ACL и независимый gate review сохраняются. U-003 дополнен временными mock legal для закрытого тестового scope, 18+ не ослаблен. Будущий public launch имеет отдельный readiness gate.

## Миграция и совместимость

План v2 и [standalone profile](../STANDALONE_PILOT.md) задают новые локальные check IDs. Реализация должна дополнить текущие API/entry/release contracts новой revision и совместимостью; молчаливая смена смысла старых signed artifacts запрещена. Старые approved P01–P03 proof проверяются на своих исходных SHA, а новые изменения — на свежем source identity. P04 технический PASS остаётся историческим техническим evidence; изменённые карточки требуют нового pack/C2 и content acceptance.

Отчёт всегда различает scope decision, implementation PASS, external NOT_RUN и DEFERRED_OWNER. Прежние FAIL/HOLD не переписываются. Local browser contexts не называются физическими устройствами, WebKit engine не называется проверкой iOS Safari.

## Единый media transport · уточнение владельца 2026-10-19

Для Cinema, общих Calls до восьми участников и приватных pair Calls применяется один Venus-owned встроенный SFU/media server на том же хосте. Отдельная P2P-ветка и P2P fallback не реализуются. Это прямое уточнение владельца и согласованное техническое решение текущего scope; конкретная SFU-реализация ещё проходит аудит/выбор.

Приватный звонок имеет отдельный media-room namespace, ACL и точный состав из двух участников; хозяин основной комнаты не получает доступ автоматически. Общие Calls разрешают каждому вступившему участнику публиковать только свои mic/camera после явного согласия и минимального grant. Cinema использует отдельный host-only publisher lease. Общий transport не объединяет эти namespaces, permissions или recipients. Negatives должны доказать отсутствие cross-room/cross-pair подписки и публикации, а также запрет stale token/rejoin после revoke во всех трёх сценариях.

## Проверка и принятие реализации

Нужны: docs/link/snapshot/contract checks; actual Docker install/update/backup/full restore/fault-injection; operator-vs-room-host negatives; stale artifact/job/token replay; preserved monotonic ledgers; local E2E/network/media/load/soak; два независимых source-bound review с сохранением всех раундов. Условия подробно перечислены в [плане](../10_IMPLEMENTATION_PLAN.md).

## Откат

Документальный rollback возвращает прежнюю ревизию scope только по новому прямому решению владельца; он не включает внешние зависимости автоматически. Runtime rollback допускается между проверенными совместимыми Venus bundles с отдельной DB migration boundary. Deletion/withdrawal/trust revocation не откатываются вместе с image/БД. Если предыдущая версия не понимает новые ledgers/contracts, quiesce и закрытие serving обязательны; никакого blind downgrade. Отложенные production/mobile/music claims не появляются после отката.
