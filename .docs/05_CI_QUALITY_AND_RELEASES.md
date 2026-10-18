# Venus · CI, Quality Control, Release Management & Updates

**Владелец контракта:** Engineering / Release / QA · **ревизия:** 1.0.0 · **дата:** 2026-10-18 · **статус:** дизайн CI, не сообщение о настроенной инфраструктуре.

> **Нормативный источник:** неизменённая копия [Part 05](source-snapshots/PART_05_CI_RELEASES_AND_LOCAL_UPDATES.md); для bootstrap, ingress и проверки известных проблем также [Part 04](source-snapshots/PART_04_BOOTSTRAP_AND_DEPLOYMENT.md) и [Part 12](source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md). Эти части **сами указывают на старшинство центральной Part 00**, которой нет в предоставленных исходниках. Перед production-release нужно получить и закрепить SHA всех применимых центральных правил; это явный gate, а не молчаливое предположение о совместимости.

## 1. Словарь, роли и неизменные свойства

- **Commit revision:** полный Git SHA исходников. **Build identity:** service-qualified tag плюс immutable OCI image digest. **Release:** одна опубликованная неизменяемая группа артефактов, manifest, подпись, evidence. **Deployment:** конкретно запущенная версия на VPS; успешно опубликованный release не означает успешный deployment.
- **Service slug:** `venus`. Первый выпускаемый тег: `venus-v0.0.1`. `v0.0.1` — только проверочный тег, не релиз; `0.0.0` — только не выпущенная работа.
- **RC / candidate:** проверенный артефакт, ещё не объявленный готовым; **signing job:** единственный защищённый этап, имеющий приватный ключ подписи Venus.
- **Evidence:** machine-readable result test/job/artifact digest, отнесённый к exact revision. Простая заметка `PASS` без теста не evidence.
- **Operator:** управляет серверной установкой/авторизованным обновлением. **Developer:** пишет code/docs, не получает production секреты. **Reviewers:** подтверждают контент и изменения безопасности. **Updater:** отдельная привилегированная host-служба, не socket Docker, предоставленный Venus.
- Поставщик приложения и runtime разделены: браузерный API **MUST NOT** передавать команду shell, arbitrary artifact URL, OCI image или Docker socket.
- Release workflow **MUST** fail closed: любое неразрешённое несоответствие версии, подписи, digest, migration, known-problems gate, совместимости или health останавливает публикацию либо rollout.

## 2. Организация Git и baseline веток

```text
main                       protected, deployable source of truth
feature/<issue>-<slug>     PR -> main
fix/<issue>-<slug>         PR -> main
hotfix/<issue>-<slug>      срочная исправительная ветка с тем же gate
v0.0.1                    CI validation only; никаких production assets
venus-v0.0.1              разрешает подготовку подписанного release
```

Все изменения проходят PR, code review, автоматизированную проверку и формальный migration/security impact. Запрещены force push и переустановка уже опубликованного service-qualified tag; immutable tag provenance сопоставлять со SHA ожидаемого commit `main` до публикации и проверить через remote после неё (Part 12 `REL-03`). Регулярный CI запускается на `pull_request`, `push(main)` и простых `v*` тегах без релизных разрешений; production workflow — строго `venus-v*` с проверкой полного SemVer regexp и service slug. Разнести reusable проверки и workflow публикации, чтобы PR из fork никогда не получал signing secret.

Git repo layout — предложенный baseline:

```text
venus/
  README.md
  .docs/              # спецификации, ADR, ссылки, тестовые contracts
  apps/web/           # React + Vite, locale assets
  apps/api/           # Fastify, REST/WSS, room, game, music
  packages/contracts/ # versioned API/WS types
  packages/relationship-engine/
  packages/card-catalog/
  packages/i18n/
  infra/venus/         # Docker Compose, named Nginx include sample, helm НЕ нужен
  tools/               # document/content validators
  .github/workflows/  # ci.yml, release.yml, compat.yml
```

Первые четыре directories проекта — намерение, их отсутствие в текущем ZIP нормально. Разработчик не должен создавать заглушки, якобы реализующие API.

## 3. SemVer и изменение контрактов

| Изменение | Версия сервиса | Дополнительный контракт |
|---|---|---|
| Исправление бага, опечатки, совместимая документация | PATCH | changelog + точный regression ID |
| Добавление API endpoint, нового режима без ломки существующего поведения, совместимая миграция | MINOR | OpenAPI/WS version, tests и update audit |
| Breaking изменение стабильного API/identity/card schema/db retention | MAJOR после 1.0; до 1.0 — документированное совместимое окно либо осознанное breaking MINOR | explicit migration, clients compatibility, ADR |
| Исправление данных карточки без изменения схемы | контентный `pack_revision`, при упаковке внутрь сервиса — release PATCH | content digest + каталог tests |
| Изменение разрешений картинок/музыки | переутверждение лицензии и content release gate | немедленная блокировка unlicensed asset |

Должен существовать **один** источник версии (`RELEASE_VERSION` из qualified tag): frontend build meta, `/api/v1/version`, OCI labels, manifest, UI Settings, installer lock. Test запускает именно собранный image digest и сверяет всё, не ограничиваясь `package.json`. База данных имеет свой `schema_generation` и цепь forward migrations; алгоритм Relationship Engine хранит `engine_version/policy_revision`, каталог — `pack_digest`. Запущенная игровая сессия всегда использует исходный snapshot даже после выпуска новых карточек.

## 4. Порядок pipeline по стадиям

### 4.1. PR / ordinary CI (без release secrets)

1. Checkout exact revision, pinned toolchain/versions, frozen install (`npm ci`/`pnpm --frozen-lockfile` и т.п.). Toolchain/lock и GitHub Actions SHOULD pin to immutable SHA; license/SBOM check for dependencies.
2. Lint `.md`/internal links, JSON Schema and card examples: `python tools/check_docs.py`, `python tools/validate_cards.py .docs/examples/cards`.
3. Format, lint, TypeScript `tsc --noEmit`, app unit tests with seeded clocks/randomness, relation safety tests, i18n completeness/placeholder parity.
4. Contract tests: server validates HTTP OpenAPI and WebSocket events from actual client; database migrations up/down compatibility; secret filtering and rbac; auth/CSRF/origin and rate limits.
5. Real database integration tests: 8 concurrent joins vs ninth rejection, duplicate reconnect, phantom presence, idempotent action retry, transaction snapshot, rejected/expired consent.
6. Frontend/browser E2E at RU/EN/TR and 320/375/768/1024/1440/1920 widths; keyboard/zoom 200%, hidden scrollbars without inaccessible controls; testing `prefers-reduced-motion`.
7. Media compatibility fixture: mock token grants for unauthorized publishing, browser capture flow with real permitted media in **browser smoke** (unit mocks alone not enough). Music: autoplay rejection, epoch drift, stale revision, in-person output role, HTTP Range.
8. Container image build (without secrets), Compose config parse, non-root/loopback port assertions, liveness/readiness smoke and SBOM/provenance generation.
9. Diff-based update compatibility + backup-scope audits; attach PASS or reasoned N/A. Run catalog lint + machine-verifiable affected checks from Part 12 without signing.
10. Upload immutable test reports; no tag movement and no production deploy from PR.

### 4.2. Qualified release workflow `venus-vX.Y.Z`

**Строгий порядок; любое `FAIL/UNKNOWN` прекращает переход.**

```text
validate service-qualified tag + exact main revision
  -> rerun same-revision CI/tests
  -> build and smoke exact release OCI artifact ONCE
  -> pin OCI digest; exact runtime version & image verified
  -> assemble bundle, canonical release manifest, checksums
  -> Part 12 catalog fixed to immutable upstream SHA
  -> pre-signing Part 12: full applicability + all non-signature checks
  -> PROTECTED signing job loads only VENUS private signing key
  -> sign manifest; derive public verifier; embed in versioned bootstrap.sh
  -> verify signature, bundle SHA-256, public/private key separation
  -> final signed-artifact Part 12 checks + `known-problems-report.json`
  -> publish immutable GitHub release assets and SBOM/provenance
  -> external anonymous asset/trust smoke (fresh environment)
  -> mark release/discovery ready only after published asset verified
```

Manifest binds `schema_version`, `component='venus'`, `role='web-api'`, exact version/tag, OCI repo **by SHA-256 digest**, bundle URL/SHA-256/size, declared install schema, minimum updater version, compatibility requirements, documentation revision and release notes URL. Приложенный `known-problems-report.json` относится к полному исходному SHA Venus и SHA Part 12; не подменять новый central catalog содержимым snapshot из архива, если центральная revision обновилась.

Signing private key живёт только в service-scoped protected GitHub Secret; не копировать в image, release archive, logs, CI artifact, `.env` или VPS. Versioned `bootstrap.sh` включает **только** публичный verifier и в первую установку пишет `/etc/exocortex/release-trust/venus.pem`. Секретный signing key и SSH/storage credentials — разные ключи. Смена release trust существующей установки только через current-key-signed transition; новый bootstrap не может перезаписать несовпадающий trust-файл.

### 4.3. Минимальный пример workflow-trigger (иллюстрация, не полная GitHub Action)

```yaml
# .github/workflows/ci.yml (future, pseudoconfig)
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
# Permissions default read-only; no publishing/secrets
permissions:
  contents: read
```

```yaml
# .github/workflows/release.yml (future, pseudoconfig)
on:
  push:
    tags: ['venus-v*']
# The job MUST validate the full tag, exact main commit and all gates.
# Release/signing permissions only in protected, dependent job.
```

Это **не готовые workflow-файлы**: исполнитель обязан создать действующие workflows согласно полному контракту, а не копировать одни `on` блоки и считать релиз настроенным.

## 5. Обязательные тестовые матрицы

### 5.1. Room, security, locale

| ID | Given / When / Then | Где автоматизировать |
|---|---|---|
| CI-R-001 | восемь разных identities в комнате, девятый одновременный join → 409/`ROOM_FULL` | DB integration + contention |
| CI-R-002 | same valid identity reconnect → не занимает новое место, прежний socket закрыт | E2E WS |
| CI-R-003 | invite URL у гостя → нет полномочий host (music/cinema/game moderator) | API authorization |
| CI-R-004 | закрытие room во время stream → revoke publish grants, запрет новых join/action | contract + RTC |
| CI-I-001 | один `card_id` в одном раунде у RU/EN/TR участников → три локализованных payload, одинаковый event revision | browser/API |
| CI-I-002 | имена/карточки содержат `<script>`/emoji/турецкую İ, кириллицу → escaped text, сохранён корректный текст | security/UI |
| CI-P-001 | игрок A запрашивает `B` preferences / private prompt → 403/404 без полей или side effects | access/negative |
| CI-P-002 | private_pair одно отказавшее лицо → действие не стартует, не сообщается отказавший или личный мотив | engine/integration |
| CI-P-003 | приватные social edges отсутствуют в WS event, logs, telemetry, crash report, archive preview | security static/dynamic |

### 5.2. Game / Relationship Engine

Список базовых кейсов обязательно расширяет [08](08_RELATIONSHIP_ENGINE.md#16-регрессионные-тесты-и-метрики). Каждое изменение policy фиксирует golden fixtures (deterministic seed, snapshot hash) и property tests:

- при одинаковом seed изменения `comfort=0` никогда не открывают карточку с `min_comfort>0`; никакое направление `not_a_friend` не допускает forced pair;
- `in_person` physical action никогда не выбирается в `online`;
- односторонний crush повышает вес **мягкой инициативы**, но не обходит верхний comfort получателя и не показывает чувства в UI;
- mutual crush/relationships создают больше допустимых pair/private **в статистическом тесте**, с bounded fairness и защитой против public inference;
- для N раундов поддерживается progression, но верхняя граница не превышает самых строгих ограничений и не заставляет выбирать интимные карточки;
- frozen snapshot не меняется от PATCH настроек, join/leave, нового card pack и engine release; отказ от действия остаётся доступен;
- re-run настроек сохраняет draft/personal preferences, но создаёт новый session_id/seed/snapshot; cards не повторяются по возможности и pool exhaustion не ослабляет policy;
- no eligible safe cards → безопасная fallback карточка только из **валидированного нейтрального пула** либо fail closed с понятной ошибкой, никогда не переход к запрещённому контенту.

### 5.3. Music & Cinema

| ID | Проверка | Exit criterion |
|---|---|---|
| CI-M-001 | host plays/seeks/next 8 listeners | position/queue revision consistent; guests can't mutate |
| CI-M-002 | network jitter and client clock offset | measured drift thresholds/`DEGRADED` when exceeded |
| CI-M-003 | autoplay blocked until gesture | explicit recoverable UI; no false playing |
| CI-M-004 | `in_person` eight phones | exactly one default public loudspeaker, no multi-device echo assumption |
| CI-C-001 | permitted desktop tab capture with audio | 1 publisher/7 viewers A+V measured, no server transcode invented |
| CI-C-002 | source prohibits audio/DRM | visible unsupported/limited; no circumvention |
| CI-C-003 | blocked UDP | explicit connectivity state and documented fallback; no fake media-ready |
| CI-C-004 | Android/iOS publish devices & sources | product support claims restricted to tested combinations |

### 5.4. Deployment, update & recovery

- Clean Linux VPS: exact release bootstrap verifies trust, manifest signature, bundle SHA-256; rejects path traversal and unsafe permissions; creates `.env` 0600 and **stops at operator input**; does not own Nginx.
- Actual installer verifies Docker/Compose, `docker compose config`, locked image digest, loopback health, strict runtime security, one scoped Updater enrollment only when central prerequisites satisfied.
- Wrong selected version, mutable image, stale manifest, missing env, duplicate port, missing shared agent → fail **before** runtime mutation; old version remains healthy.
- On upgrade, standard full ZIP from same builder is verified and saved to user before mutation per Part 05; no backup `.env`; no leaked tokens, no arbitrary image passed to Updater.
- Migrations test from **oldest supported** compatible version to candidate; broken migration executes rollback in actual production-like Compose and **restores old version/data** and reports both failure stages. Health checks compare running exact version/digest, not merely HTTP 200.
- Update job observes `REQUESTED -> BACKUP_VERIFIED -> ARTIFACT_VERIFIED -> PULLING -> APPLYING -> HEALTH_CHECK -> COMPLETED` or terminal failure/recovery states. Duplicate request id + same payload resolves same job, different payload rejected. Reload/disconnect/502 does not create duplicate update.
- Public edge check after Nginx config `nginx -T`, `nginx -t`, reload, **external SNI/HTTPS/WSS**. Nginx reload only after loopback healthy. No `coturn` unless approved NAT traversal design.

## 6. Versioned acceptance gates и статус функции

Сервис может показывать общую readiness и по-модульные готовности, но не выдаёт продуктовый milestone за completed без evidence.

| Gate | До перехода требуется | Обязательный evidence |
|---|---|---|
| G0 Docs/Contracts | документы 01–09, CI source parts, schemas, examples, локализация, UI flows, ADR blockers записаны | link check, schema tests, traced decisions |
| G1 Room + Games | 8 users, directed encrypted preferences, snapshot, 3 modes, in-person/online, 300 reviewed cards RU/EN/TR, safety/privacy | DB+E2E+reviewed pack manifest |
| G2 Music | право на каждый трек, host queue, 8 clients, local volume, single output in-person | license register + drift/rights tests |
| G3 Desktop Cinema | 1 host + 7 viewers, A/V, SFU, external HTTPS/UDP, latency measurements | captured A/V smoke and network report |
| G4 Mobile publisher | tested supported OS/device/source permutations, explicit A/V/audio caveats | device matrix, permission/termination tests |
| G5 Calls | video calls, Cinema split view, mic/camera privacy, echo cancellation and support | RTC/UX/a11y/security suite |
| Production release | Gx selected feature scope; central normative Parts complete, signed immutable assets, full Part12 gate, verified backup+rollback, external deployed health | signed release evidence + deployment readiness record |

Опубликованная v0.0.1 может содержать не все будущие модули, если UI честно обозначает их как unavailable и конкретный release scope явно указан. **Публичный Games ready невозможен с одними примерами карточек вместо ≥100 каждого режима.**

## 7. Известные проблемы: машинный gate, не чекбокс «вроде учли»

По [Part 12](source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md) snapshot есть 118 активных problem IDs (REL/BST/TRUST/PERM/CTR/NET/HLT/INT/DATA/OPS). Exact каталог на release revision может измениться. Для **каждого** активного ID выпуск обязан предоставить **один** статус `PASS` или `N/A`, имя теста/ссылку на evidence либо конкретную доказательную неприменимость, профили/paths/components. `UNKNOWN/FAIL`, stale catalog SHA/revision, unproven N/A и missing report блокируют публикацию. Пред-signing часть выполняется **до** получения signing key, signature-dependent проверки — **после** в защищённом job. Эксплуатационный DNS/сертификат/credential smoke остаётся отдельной deployment readiness `NOT_RUN`, не липовый release `PASS`.

Пример записи (структура illustrative; запрещено публиковать это как реальный результат):

```json
{
  "schema_version": 1,
  "service": "venus",
  "revision": "FULL_GIT_SHA",
  "release_tag": "venus-v0.0.1",
  "catalog_revision": "FULL_UPSTREAM_DOC_SHA",
  "catalog_sha256": "SHA256_OF_EXACT_PART_12_BYTES",
  "checks": [
    {"id":"NET-02","status":"PASS","evidence":["ci-job-id/nginx-no-owned-daemon"],"reason":null}
  ]
}
```

**Пример неполон** и не допускается на реальном релизе; полный report содержит все активные ID ровно один раз. Приоритетные до первой поставки ID и их профилактика — [07](07_KNOWN_AND_EXPECTED_PROBLEMS.md).

## 8. Update UI / trusted updater handoff (реализация только по Part 05)

1. В authenticated operator Settings показать **текущую фактическую** `venus` version + локальный updater/registry reachability раздельно. Unknown version ≠ 0.0.0.
2. `Check for updates` делает реальное discovery через approved source, сравнивает SemVer, исключает prerelease/draft/wrong service/incompatible; результат информативен — Updater перепроверит release.
3. `Install exact X.Y.Z` показывает предупреждение и запускает **один** стандартный полный ZIP backup. Использовать Part 05 раздел 34: операторское явное согласие, сохранить точно эти байты на его компьютер; когда File System Access позволяет подтверждённую запись — дождаться close; когда только обычная загрузка — не говорить, что она точно сохранилась, и продолжить в рамках исходного подтверждения.
4. Проверить checksum + short-lived receipt (scope, version, request ID, size, digest). На reference backend Part05 максимальный декодированный архив — **128 MiB**; 15 мин receipt — исходный reference default. Если scope данных выходит за лимит, блокировать update и проектировать законный bounded backup, а не отключать gate.
5. Updater принимает только зарегистрированный Venus profile и exact version, independently verifies manifest/signature/digest. Unix socket permissions/scoped token; app не получает Docker socket, произвольную команду/URL/образ.
6. UI показывает persisted job и настоящие machine states, не рисует fake progress; после 502/reload/reconnect подтягивает существующий job_id/request_id, никогда не запускает новую мутацию вслепую.
7. SUCCESS только после проверки running image digest/version и health; при rollback различать оригинальную причину и recovery outcome, отображать restored version. После updater restart для позднего ручного восстановления требуется исходный скачанный ZIP того же SHA-256.
8. Данные Venus и комнаты должны быть покрыты backup/restore scope; secrets `.env`, access tokens и личные исходные записи избыточных данных не выводятся в журнал. Совместимый откат схемы обязателен либо миграция запрещается до отдельного safe plan.

Полная машинная state table — Part 05 §29, полный UI контракт §34. Этот документ не создаёт альтернативного упрощённого пути update.

## 9. Контроль воспроизводимости и supply-chain

- Dependencies fixed in lock; third-party bundled assets fetched only at pinned version and SHA-256. Never fetch bootstrap from mutable `main`/`latest`.
- OCI image digest is installed identity. Build once, test that **same** digest, publish it, verify digest again on VPS. Separate CI/test artifact from released image without byte identity = `REL-05` failure.
- Detached signature validates publisher identity; checksum validates bytes; one не заменяет другое. Signing protected job never prints key; provenance/SBOM generated and archived, но не называются verified enforcement пока policy реально не проверяет их.
- Любое schema change имеет forward/backward compatibility test and data migration plan; releasing a new pack doesn't rewrite active game snapshots.
- Секреты — only environment/secret store with scoped grants, no log, no raw user uploads, no screenshots of private preferences.
- Source download retries bounded with backoff; partial bundles never become active. Asset completeness checked from clean unauthenticated environment after publish.
- `known-problems-report.json`, tests, manifest, signing and binary identity attached to same revision for весь support lifecycle.

## 10. Definition of Done / PR template

Каждый PR содержит: `why`, changed domain contracts, affected files/docs, security/privacy impact, migration+rollback, 3 locale strings/translation review, card-pack impact, list of automated test IDs and results, UX screenshots at breakpoints if UI, compatibility audit PASS/N/A, links to ADR when departing from baseline, and a named reviewer. Нельзя закрыть пункт декларацией «tested manually» без процедуры/артефакта.

До первого production tag дополнительно:

- [ ] закрыты/заблокированы явно все G0 blocker ADR и получены central Parts 00/03/06/09/13, если применимы;
- [ ] CI branch/tag namespace безопасен, signing secrets только в protected job;
- [ ] обязательный release known-problems report полный и привязан к immutable SHA;
- [ ] one artifact built/tested/deployed by digest, valid signed bundle, embedded public bootstrap verifier;
- [ ] tested clean install, wrong input failure, conflict port failure, local and public readiness;
- [ ] real migration/restore, health rollback, persistence and no Nginx ownership;
- [ ] publishing URL canonical HTTPS, host-managed Nginx checked and external SNI/WS tested;
- [ ] privacy/games/music/media feature readiness не преувеличена;
- [ ] operator runbook из 06 воспроизводим **без выполнения потенциально деструктивных команд** на production в качестве эксперимента.

**Перекрёстные документы:** [02 — Tech](02_TECHNICAL_ARCHITECTURE.md) · [06 — Deploy](06_DEPLOYMENT_AND_OPERATIONS.md) · [07 — Risks](07_KNOWN_AND_EXPECTED_PROBLEMS.md) · [08 — Relationship](08_RELATIONSHIP_ENGINE.md) · [09 — Cards](09_CARD_AUTHORING_AND_AUTOMATION.md).
