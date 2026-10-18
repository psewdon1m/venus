# Discovery центральных норм Exocortex

**Дата:** 2026-10-18 (Europe/Istanbul). **Исполнитель:** отдельный агент `central_norms`. **Тип:** read-only discovery источника; не подтверждение runtime conformance и не приёмка EXIT-P00.

## 1. Результат и происхождение

Найдены все Parts 00–13 в `C:\.projects\exocortex\.docs`. Каталог `.docs` — самостоятельный Git repository, а `C:\.projects\exocortex` — integration workspace; это прямо указано в его `README.md`. На доступных корнях/внутри workspace `AGENTS.md` поиском `rg --files --hidden -g AGENTS.md C:\.projects` не найден.

- Remote `origin`: `https://github.com/psewdon1m-exocortex/general.git`.
- Local HEAD: `4449e65d732ca44b91cec5a6f3ca16c2c618578f`.
- Последний commit: `2026-10-11T22:43:29+03:00`, `docs: align storage paths with layout v3`.
- `git status --porcelain=v1 --untracked-files=normal`: пустой вывод, working tree clean.
- Read-only `git ls-remote origin HEAD refs/heads/main refs/heads/master`: remote HEAD и `refs/heads/main` совпадают с local HEAD; `master` не возвращён.
- Parts 00/13 являются tracked файлами этой ревизии. Сравнение SHA-256 Parts 04/05/12 с уже предоставленными пользователем Venus snapshots показало полное побайтовое совпадение всех трёх.

**Что доказано:** локальный источник согласуется с источниками, уже принятыми проектом Venus; Exocortex root README явно называет numbered `.docs` workspace-wide source of truth, Part00 подтверждает authority/precedence, Git remote подтверждает ту же опубликованную ревизию. Для воспроизводимого чтения: [immutable repository tree](https://github.com/psewdon1m-exocortex/general/tree/4449e65d732ca44b91cec5a6f3ca16c2c618578f), [Part00](https://github.com/psewdon1m-exocortex/general/blob/4449e65d732ca44b91cec5a6f3ca16c2c618578f/PART_00_SYSTEM_UNIFICATION_SPECIFICATION.md), [Part13](https://github.com/psewdon1m-exocortex/general/blob/4449e65d732ca44b91cec5a6f3ca16c2c618578f/PART_13_HOST_DEPENDENCIES_AND_EXTENSION_GUIDE.md).

**Что не доказано:** личность владельца central policy, его полномочия на исключения для Venus, подпись commit/tag и издательская provenance не проверялись. SHA-256 обеспечивает целостность, но сам по себе не доказывает publisher authentication. Нельзя утверждать, что пользователь уже утвердил конкретное исключение или host dependency row: U-005 разрешает получить документы и закрепить хеши.

Исходный Exocortex repository не менялся; secrets, `.env` и приватные ключи не читались. Исходные Venus snapshots также не менялись. По поручению parent agent все 14 Parts и реально существующий `service_update_mechanism.md` импортированы побайтово в [central-4449e65](../../source-snapshots/central-4449e65/); источник, SHA, clean/remote evidence и пофайловые хеши — в [provenance.json](../../source-snapshots/central-4449e65/provenance.json). Хеш каждого destination сопоставлен с source после копирования.

## 2. Зафиксированные байтовые хеши

Все пути относительно `C:\.projects\exocortex\.docs`, одна Git revision выше. `SHA256` вычислен через `Get-FileHash -Algorithm SHA256`; bytes — фактический размер локального tracked файла.

| Part / файл | Bytes | SHA-256 |
|---|---:|---|
| `PART_00_SYSTEM_UNIFICATION_SPECIFICATION.md` | 28515 | `8732e5aa53b8ecff08aff8fce52b0936d48e18d83d3518fb974b86339378131f` |
| `PART_01_INTERFACE_AND_INTERACTION_UNIFICATION.md` | 219442 | `f7a8cfbb0d7ac46e7028576709c755e66458aa62f01ff8f5d810d37dd54e6bb4` |
| `PART_02_OBSERVABILITY_AUDIT_AND_LOG_EXPORT.md` | 13476 | `eda0ece0f3d5744821a50cd74fd1ccfd17a7e02595bc5fcab2355c5a2a199d51` |
| `PART_03_BACKUP_AND_RECOVERY.md` | 26519 | `9db379ff504133a656057028d78cc1c0faea1b7cc9df67ac3a0d0cf737cf3b9f` |
| `PART_04_BOOTSTRAP_AND_DEPLOYMENT.md` | 18430 | `40130fa4f5c73950883eba7d2853b4eae470d00c813ff8b9645dc1cced38bb8c` |
| `PART_05_CI_RELEASES_AND_LOCAL_UPDATES.md` | 48604 | `8003893bb4af8c185c63dd3be3fb65c51ce4b81b2ba6f5ad5632232ab82de3f2` |
| `PART_06_UNIFIED_ACCEPTANCE_CHECKLIST.md` | 42233 | `e33decefccbc3a0068c9d6257c87e55fdc539d324c3eeb9e3d8d586e380e2dfc` |
| `PART_07_SECURITY_AND_EXPOSURE_CONTROL.md` | 38763 | `8fa2b2d881caa066a393eef6e85fe2f4a83925c0bdd6862a3f44db16e03a5e9f` |
| `PART_08_SEO_AND_GEO.md` | 91531 | `d7f962c739f40544dfb0ac604c42f3c4f2ff128e8b4a4d35933eaed4ce860a09` |
| `PART_09_SERVICE_AGENTS_DEPLOYMENT_AND_LIFECYCLE.md` | 40913 | `2c75f110fc3d024155efcfbaf18f04bfe39edf5bd3532f923eeeed702dafba21` |
| `PART_10_SERVICE_AGENTS_UI_AND_OPERATOR_WORKFLOWS.md` | 35669 | `8823d84be64b3a36bd431c8475262323979b925d2392221bc7555249dafd99ea` |
| `PART_11_INITIAL_MULTI_SERVICE_DEPLOYMENT.md` | 11192 | `a9bb6db62db45ae65446144cf32f18077453a15129eb1198f5150f928624e1c5` |
| `PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md` | 89181 | `7f356b724df80444c5cd00c15bd808046f4f5667afa2cabf87cf1acd196c86a9` |
| `PART_13_HOST_DEPENDENCIES_AND_EXTENSION_GUIDE.md` | 12798 | `faa7e0cfe26927570a8230e835e7b8ac08815bc8450467fcab69d398f425d909` |

Дополнительно сохранён `service_update_mechanism.md`, SHA-256 `9cf1a3f6c76494ba3d7d8d4c6613f4b320209b4a3eb3a03efaaefc1e062106e1`. Он описывает проверенные на 2026-10-01 конкретные update flows, явно отсылая нормативную authority к Parts05/13; его список сервисов не включает Venus. Поэтому это operational source evidence для P06, а не автоматически принятый готовый Venus protocol.

Это snapshot основных Parts и update mechanism, а не полный standalone offline archive. В них есть нормативные ссылки на `decisions/` и `src/`; перед реализацией соответствующей функции следует закрепить используемые transitive resources из той же ревизии. Существующий Git tree позволяет восстановить их без придумывания отсутствующего текста.

## 3. Первичная применимость и ближайшие рубежи

Это матрица уровня Part; она не подменяет требуемую Part00 §4.1 матрицу каждой применимой major section с owner/evidence.

| Part | Применимость Venus | Рубеж и действие |
|---|---|---|
| 00 | applicable: authority, scope, DIV, evidence, handoff | Уже P00; разобрать ближайшие material differences до затронутого кода |
| 01 | applicable для operator UI; применимость всех конкретных операторских layout/auth правил к guest UI требует решения | Контракты/UX P00; затронутые UI/auth действия P01/P02/P05 до решения не объявлять принятыми |
| 02 | applicable для logs/audit/errors | P01 baseline redaction/limits; P02/P06 runtime enforcement |
| 03 | applicable: authoritative room/config state, backup/restore | P02 schema/retention; полный restore/update proof P06 |
| 04 | applicable для deploy/install | P06; каркас P01 не должен вносить несовместимый ingress/trust contract |
| 05 | applicable: CI/releases/updates | P01 CI trust separation; P06 signed release/update/rollback |
| 06 | applicable всегда | P00 evidence; P01 reproducible pre-push command; каждая публикация/push по семи областям |
| 07 | applicable security baseline всегда | P01 CI и зависимости; P02 identity/exposure; external-vantage проверки до deployment |
| 08 | conditional: intentionally indexable public content | Не назначать всему продукту N/A; route/page-type registry должен определить landing/legal/public vs room/operator surfaces |
| 09 | conditional для shared agents; Updater/dependency lifecycle затронет deployment | ADR-008/P06; agent consumption определять явно |
| 10 | conditional для shared-agent controls | P06 operator surface; не переносить service cards автоматически в guest room |
| 11 | N/A для текущего Venus deployment scope как отдельного app, пока не выбран именно initial Kernel/Volt/Saturn topology | Part11 прямо называет свой profile product-scoped; generic requirements брать из 00/04/05/07/13; пересмотреть при расширении topology |
| 12 | applicable для service-qualified releases | P01 можно подготовить report schema; exact per-ID PASS/N/A, bound candidate/central revision/catalog digest — перед P06 release |
| 13 | applicable: adding a new application/dependency edge | ADR-008; reviewed Venus dependency declaration, central matrix и Updater capability map до install/release |

Part13 не содержит строки Venus. По generic contract каждый новый application service обеспечивает Updater; дополнительные Neptune/Gryphon/Wyvern нельзя назначить по аналогии с другим приложением. §5 — пример приложения, которое **уже нуждается** в Neptune; это не универсальное требование Neptune для каждого нового приложения. Нельзя объявить Venus готовым к production, пока согласованный dependency contract не отражён в центральной матрице/Updater. LiveKit и возможный coturn остаются отдельным проектным RTC решением; отсутствие их в matrix не означает неявной установки Venus bootstrap.

## 4. Guest rooms, single operator и DIV

### Обнаруженные точные правила

- Part00 §2: Part01 применяется, когда система имеет `operator or end-user interface`.
- Part00 §3: `Browser-based operator applications use the public authenticated profile`; Access Key и app sessions защищают operator data.
- Part01 §4.1, lines 490–491: `The service is single-operator: authentication uses one Access Key field`.
- Part01 §§1–2: operational UI с true-black surface, одним accent, Space Grotesk/Consolas, rectangular geometry; decorative textures запрещены. §1.1 считает departure from linked template material UI/UX difference.
- Venus `.docs/README.md` §6 и `.docs/06_DEPLOYMENT_AND_OPERATIONS.md` §4 уже отделяют operator Access Key от guest invite/room sessions. Venus `.docs/03_VISUAL_DIRECTION.md` §§1/5/6 задаёт иной consumer visual language: late-night interior/textures, несколько цветов, Manrope/Cormorant; UI_FLOWS использует game room/mobile navigation.

**Вывод:** требования operator authentication не дают доказательства, что каждый guest обязан вводить один общий операторский Access Key. Отдельная операторская поверхность совместима с guest capability model как архитектурное предложение. Но считать весь Part01 неприменимым к guest UI без обоснования тоже нельзя: Part00 явно включает end-user interfaces, а Part01 сформулирован шире только operator dashboard.

Нужен scope/DIV record для guest UI/auth applicability, с особым вниманием к визуальным нормам. Ранее принятое пользователем продуктовое направление — evidence существующего намерения, но не явный ответ на только что обнаруженный конфликт центральной authority. Согласие U-005 получить нормы не разрешает молча изменить central docs или убрать их приоритет.

### Подготовленный материал для DIV-VENUS-001

- **Rule:** Part00 §§1–3, Part01 §§1–2/4.1 и области applicability из Part00 §2.
- **Observed:** документационный baseline guest rooms/room capabilities и отдельный operator Access Key; runtime ещё нет. Атмосфера/цвета/шрифты Venus отличаются от central operational visual language.
- **Materiality:** affects end-user identity boundary, UX/visual policy and architecture; guest access нельзя случайно связать с operator privileges.
- **Options:** (1) применить central UI/auth полностью к гостевой поверхности после согласования scope; (2) staged path с отдельным operator UI и ограниченным guest prototype до решения; (3) central clarification/approved exception: Part01 operator auth/layout/tokens относятся к operator surface, consumer room имеет принятый Venus visual contract, общие accessibility/security остаются.
- **Recommendation:** вариант 3 как явная central applicability clarification/exception, сохраняя полный operator security и общие accessibility/consent правила. Если авторитетный владелец считает это уже прямым смыслом Parts, закрепить доказанное scope interpretation вместо фиктивного waiver.
- **Migration/rollback:** до решения не реализовывать затронутый public guest/auth/theme contract; после решения версия ADR/DIV и tests привязаны к принятой policy; откат документов/каркаса без удаления evidence. Реальные данные и deployment отсутствуют.
- **Verification:** separate guest/operator route/ACL tests, no operator capability via invite, operator login exact-key semantics, UI visual fixtures и keyboard/a11y проверка обеих поверхностей, route exposure classification.
- **Decision still required:** какая область Part01 применима к guest experience и кто вправе закрепить central clarification/exception. Не считать её принятой только на основании U-001 или U-005.

## 5. Что блокирует сейчас, а что позже

1. **P00:** отсутствие Parts00/13 как файлов устранено discovery. Но full EXIT-P00 требует актуальной section applicability/requirement traceability, evidence независимого review и явного статуса guest/UI scope decision. Нельзя закрыть гейт фразой «центральные документы найдены» и сохранить старое «не предоставлены». Если guest/theme contract входит в принимаемые P00 contracts и решение остаётся неизвестным, соответствующий acceptance item остаётся открытым.
2. **P01:** разрешены независимые reversible scaffold/tooling/type/schema/CI работы, которые не предрешают guest/UI/auth DIV. По текущему плану вход P01 — EXIT-P00; обход этой зависимости требует явной новой записи о разрешённом независимом scope. К P01 уже относятся secret-safe CI, versioning/tag namespaces, reproducible gate command, route/exposure registry и возможность восстановить baseline. Запуск приложения с real guest identity/theme до выяснения applicability предрешает вопрос.
3. **P02/P05:** до реализации затронутой identity/projection/surface нужно закрыть guest/operator applicability; новые U-002 retention и U-003 service entry должны отразиться в contract/schema/tests. Real runtime privacy/consent tests нельзя заменить review документов.
4. **P06/release:** approved dependency contract/central matrix + Updater map, exact agent pins/scopes/health, signed publisher chain, realistic backup+restore/update rollback, target-host identity/ingress/external tests, known-problems-report per active Part12 ID. Отсутствие реального host/credentials не блокирует discovery или синтетический P01, но блокирует deployment readiness.
5. **Public launch:** user-approved 18+ и принятие оферты не означают готовый юридический текст, определённую юрисдикцию, production consent UX или автоматическое одобрение чувствительных карточек. Технические и контентные гейты остаются проверяемыми отдельно. Агентный review выполняет одобренный U-004 процесс, но не заменяет отсутствующее продуктовое/инфраструктурное решение.

## 6. Выполненная проверка

Read-only source commands: `rg --files --hidden -g AGENTS.md`, чтение root README и применимых Parts/локальных Venus документов; `git status --porcelain=v1`, `git remote -v`, `git rev-parse HEAD`, `git log -1`, `git ls-files`, `git ls-remote`; SHA-256/byte inventory всех 14 Parts; comparison Parts04/05/12 с source-hashes Venus. Перед импортом повторно проверены source SHA, clean state и remote refs. 15 файлов скопированы в новый Venus snapshot, source/destination SHA-256 равны; provenance JSON сохранён. Все source identity/hash операции завершились успешно. Runtime/CI/deployment тесты в этой узкой discovery задаче не выполнялись; parent agent проводит тесты изменённого P00 комплекта отдельно.
