# P06 · Независимое read-only исследование Updater API

**Результат: `BLOCKED_EXTERNAL_COMPATIBILITY`, не production readiness.** Наличие update_protocol=2 у Updater0.6.17 **не означает поддержку Venus**. Найдены две конкретные отсутствующие allowlist записи. Нужен отдельный проверенный Updater release с Venus support; объявлять текущий0.6.17 готовой зависимостью Venus нельзя.

Аудит: `/root/p04_evidence_review`, 2026-10-19, около04:28+03:00. Работа по дополнительному поручению root во время ожидания P04 M3 CI. P04 source4a7/identity9e75 не изменялся. Чужой checkout читался через `git show` exact SHA; Updater, bootstrap, installer, runtime, privileged commands и его tests **не запускались**, локальные secret/env/token files не читались, foreign repository не менялся. Исполнялась только собственная проверка публичной RSA подписи вне foreign repo.

## 1. Точные входы и доступная публикация

Repository `https://github.com/psewdon1m-exocortex/updater`; чистый checkout `C:/.projects/exocortex/updater`; source **`17e2dcf1e72bbc6492ea5692520932d1c95a618f`**. Независимый `git ls-remote` подтвердил HEAD17e2, annotated tag object **`8a7c1af17e28d874777d4a7e62eda5146a49c14d`**, peeled `updater-v0.6.17`→17e2.

Все26 прочитанных source files с полными SHA-256, byte sizes и ключевыми line numbers сохранены в [source index](updater-api-preflight.sources.json). Ниже номера строк относятся к этому exact source, а не mutable main.

Публичный unauthenticated GitHub API release GET подтвердил [updater-v0.6.17](https://github.com/psewdon1m-exocortex/updater/releases/tag/updater-v0.6.17): release409774283, published2026-10-11T16:10:50Z, draft=false/prerelease=false, **API immutable=false**. Есть bootstrap, detached signature, manifest, installer, binary, checksums, Sigstore assets и known-problems report. Наличие этих assets не означает, что все их attestations/host checks нами проверены. Target_commitish=main не заменяет отдельно проверенный peeled tag SHA.

См. [public release receipt](updater-public-release-preflight.json) и [signature consistency receipt](updater-public-signature-preflight.json). По HTTPS скачаны только public manifest/signature/bootstrap; совпали actual bytes hashes и GitHub asset digest:

| Public artifact | SHA-256 |
|---|---|
| bootstrap.sh | `93c91c9aef38071075ea053200d4cb489d4c05c8d8c49f46722de518c7756b8f` |
| updater-release.json | `fa6e1660e3f07c202066c737cd56e8b5b491f90c36910274a7f1c01f2611c891` |
| updater-release.json.sig.json | `a246f7a9cdffbc56cbcea82ab1ceb3b3f95a6c2b932d356d5ec45e6d68551129` |

Собственный Node crypto verifier подтвердил RSA-PSS-SHA256/salt32, RSA3072, key_id=`88d39471ad312424e3663d765128828eb50d220d8819dcbc660217b87252e30e` по public key, встроенному в этот public bootstrap. Это **криптографическая согласованность скачанных bytes под встроенным ключом**, не независимое удостоверение publisher identity, build provenance, установленного host trust или Venus compatibility. Bootstrap не выполнялся; standalone updater.pem не использовался как новый trust anchor. Installer/binary SHA известны из API/manifest, но сами installer/binary в этом аудите не исполнялись и не скачивались.

## 2. Подтверждённые внешние блокеры

### UP-VENUS-001 · Register resolution исключает repositories.venus.url

`internal/kernel/register.go:142–157,192–201`, file SHA256 **`d93105af192fab4bd542bbd98d47aed8f5394f9ff7e48261e61dde57aad5208c`**. `kernel.Load` с default wanted=nil разрешает только `updaterMetadataKey`; allowlist repository scopes: kernel,volt,saturn,chronos,laboratory,neptune,gryphon,wyvern,updater,mastermind. Venus отсутствует.

`internal/api/protocol.go` head candidate использует обычный `kernel.Load`, затем `repositories.<head.Service>.url`; Engine.run повторяет тот же путь. Поэтому даже наличие Venus ключа в настоящем Kernel snapshot само по себе недостаточно: Updater фильтрует его до чтения. Исправление должно разрешить **только точный metadata key `repositories.venus.url`**, сохранив запрет разрешать произвольные application credentials.

### UP-VENUS-002 · Release trust scope Venus запрещён

`internal/releaseauth/verify.go:85–112`, file SHA256 **`5f724b26d00ae578f78c0783790882d44af7314757145a0e1dcf2483eab9227b`**. `VerifyDownloaded` принимает kernel,volt,saturn,updater,neptune,gryphon,chronos,laboratory,wyvern,window,mastermind. Venus отсутствует; результат `unsupported release trust scope` возникает до загрузки его public trust key.

Регистрация head ID синтаксически допускает venus, и release tag parser общий; это не снимает данные два запрета. Check/update success нельзя выводить из успешного register-head или health protocol2.

## 3. Реальный транспорт и operator-copy контракт

| Поверхность | Что действительно реализовано в17e2 |
|---|---|
| Health | `GET /v1/health`, server.go:68: status/service/version/busy/update_protocol=2/backup_policy=operator-copy; capability names относятся также к Mastermind, не подтверждают Venus support. |
| Service socket | `/run/exocortex/updater.sock`, config.go:54–61, server.go:274–329; Unix socket0660, HTTP Host должен быть `updater.local`. |
| Head authentication | server.go:242–253: `X-Updater-Token`, constant-time compare с token конкретного registered head. Это **не Bearer**; Bearer используется отдельно Updater→Kernel. Token остаётся на backend и не передаётся в browser. |
| Check | `POST /v2/check`, protocol.go:78; JSON head_id/component. Для Venus component=venus. Shared updater/neptune/gryphon/wyvern/window checks запрещены service-facing API403 и принадлежат root TUI. |
| Update | `POST /v2/updates`, protocol.go:103–132; strict UpdateRequest, отсутствие signed saved-copy receipt→426, конфликт/preflight→409, accepted→202/job. 202 не доказывает completed update. |
| Job reads | **`GET /v1/jobs?head_id=…`, `GET /v1/jobs/{id}`**, server.go:96/111. Общие `GET /v2/jobs` в просмотренной реализации не объявлены. Reads авторизуются по head scope. |
| Recovery | `POST /v2/jobs/{id}/rollback`, protocol.go:134; authenticated original head, исходный saved ZIP должен совпасть с durable job SHA. `volatile_linux.go:88` требует finished operator-copy job. |
| Privileged operator socket | `/run/exocortex-admin/updater.sock`; operator_socket_linux.go:22–91: отдельный root-owned directory, socket0600, SO_PEERCRED UID0. Нельзя монтировать его в Venus app или заменять head-scoped socket root API. |

`internal/model/model.go:15–32`: backup={filename,sha256,data_base64, optional restore_url/spool_id}; request={request_id,head_id,service,version,backup,backup_receipt,operator_saved,optional preparation_id}. Стриминговый spool здесь **не generic обход128MiB**: обычный Engine.Start разрешает его только Mastermind. Не переименовывать Venus в Mastermind ради обхода.

`internal/engine/receipt.go:18–78`: receipt JSON schema `exocortex.update-backup.v2`, поля id/head_id/service/version/sha256/size/filename/expires. Формат `base64url(JSON).base64url(HMAC-SHA256(token, ASCII first part))`. Обязательны operator_saved=true, совпадение request/target/version/filename, actual ZIP SHA/size, PK prefix и .zip. Документированный mint TTL15min; verifier отвергает истёкший receipt и expires более20min в будущем. Backup decode cap **128MiB исходных decoded ZIP bytes**, HTTP JSON cap180MiB для base64 overhead. Превышение должно блокировать apply; не сокращать scope full backup ради лимита.

ZIP держится RAM, временный restore file — только проверенный tmpfs `/dev/shm`; без него restore failclosed. После daemon/host restart bytes в памяти нет: нужен original operator-saved ZIP того же checksum. Durable job сохраняет metadata, previous image/version, mutation/recovery state, не содержимое архива. UI должен сохранять request/job ID, читать фактический статус после reload/502 и повторять discovery после terminal success. Старый expired receipt не заменяет job lookup.

## 4. Head/dependency/trust/deployment ограничения

- `config.go:161–219` не содержит fixed service enum для регистрации. Обязательны отдельный registered head/env, KERNEL_URL/KERNEL_SERVICE_TOKEN, project/service/container/image-variable/version-variable/health URL/control token и значение текущей версии по VersionVariable. Generic config acceptance не доказывает service support downstream.
- `component/capabilities.go:4–18` не разрешает Venus ни Neptune, ни Gryphon, ни Wyvern. Neptune сейчас разрешён kernel/volt/saturn/chronos/laboratory/mastermind; Gryphon — saturn/chronos/mastermind; Wyvern — mastermind/laboratory. Это не основание автоматически назначить Venus все helpers. Если принятая Venus dependency matrix потребует конкретный helper, нужна отдельная точная allowlist запись и реальные scoped enrollment/negative tests; пока объявление владельцем отсутствует.
- `VerifyBytes`, verify.go:27–74: detached envelope schema `exocortex.release-signature.v1`, RSA-PSS-SHA256/salt32, SPKI RSA>=3072, key_id=SHA256(SPKI DER). Trust file `/etc/exocortex/release-trust/<service>.pem` или trusted configured directory. Для Venus нужен **venus.pem из его authenticated versioned bootstrap**; не скачивать произвольный key рядом с manifest и не устраивать ручную fingerprint замену trust.
- `install.sh:45–73` устанавливает Updater/helper pins; Venus pin не нужно автоматически раскладывать на все hosts или добавлять в неизменяемые старые release assets. Venus bootstrap должен создать свой pin и failclosed при несовпадении существующего. Публичный dev helper `scripts/create-release-key.mjs:6` тоже имеет узкий enum без Venus; это tooling gap, а не разрешение генерировать здесь реальные private keys.
- Head release resolver: qualified `venus-vX.Y.Z`, stable non-draft/non-prerelease, manifest `venus-release.json` и `.sig.json`, schema1/service/version exact, OCI reference+digest, compose_bundle URL+SHA, database_schema>=1, valid minimum_updater_version. Updater own binary/installer manifest другого назначения и не является шаблоном head manifest.
- `engine/deployment.go:29–160`: generic head bundle — tar.gz с обязательным `compose.production.yaml`; updater применяет ограниченный versioned configuration, не произвольный code/shell/Nginx. Venus packaging обязан соответствовать имени/формату, а не передавать существующий dev compose как готовый production contract.
- `systemd/updater.service`: ProtectSystem=strict, разрешён `/opt/exocortex`; принятому в Venus docs `/opt/exocortex/venus` это соответствует. Произвольный новый `/opt/venus` потребовал бы отдельного sandbox решения. Не расширять глобальные write paths автоматически по пользовательскому JSON.
- `health_version.go:43–69`: один LocalHealthURL должен возвращать200 и **верхнеуровневую version**, совпавшую с реально устанавливаемой версией; Engine также проверяет health. У Venus4a7 `/health/ready` делает реальный DB probe, но version не выдаёт; `/api/v1/version` выдаёт version, но не подтверждает DB readiness. Нужен отдельный совместимый P06 health contract/endpoint с обоими фактами; нельзя просто подменить readiness версией.
- Manifest rollback_restore сейчас допускается только laboratory-offline-v1 и saturn-offline-v1; **venus-offline-v1 не поддерживается**. Generic online restore отправляет multipart на head.RestoreURL с X-Updater-Token. Безопасность Venus restore/write boundary/keys/external deletion+revocation ledgers ещё должна быть спроектирована и проверена. Если нужен offline profile, требуется отдельное upstream extension; не объявлять чужой profile применимым.

Release workflow source имеет environment `release` и выдаёт signing key только signing build step после pre-signing job. Нами не проверены фактические GitHub environment protection/settings, CI текущего релиза или весь Part12 report. DEPLOYMENT_READINESS прямо сохраняет отдельные NOT_RUN host/systemd/SFTP rehearsals; даже опубликованный signed release не квалифицирует Venus installation.

## 5. Минимальный source-only patch outline для владельца Updater

Это предложение для отдельного принятого upstream изменения, **не patch, уже применённый к чужому repo**:

1. Добавить точный `venus` к repository metadata allowlist `internal/kernel/register.go:196`; не разрешать wildcard credentials и не менять fallback/auth правила.
2. Добавить `venus` к release trust scope allowlist `internal/releaseauth/verify.go:87`; сохранить RSA key checks, per-service key file, existing mismatch failure и immutable artifact checks.
3. Уточнить документацию generic Venus head profile и требуемые service fields; подтвердить bundle composition, real-version+readiness endpoint, saved-copy backup/restore contract. Документы central/general в этом аудите не менялись.
4. Только если принята dependency matrix: добавить конкретный helper в `ConsumesHelper` для Venus и тесты; не добавлять Venus к root-only host-component/recovery lists — это application head, а не shared host agent. Генератор release key дополнить лишь при его принятии как tooling для Venus; фактический private key остаётся только protected operator/signing provisioning.
5. Выпустить **новую** qualified Updater версию с real source SHA, public bundle digest и проверенной подписью; старый updater-v0.6.17 не переписывать. Номер следующего upstream релиза здесь не выдумывается. Именно новый опубликованный compatible tuple становится Venus pin/minimum, затем enrolled Linux integration доказывает actual installed behavior. Protocol2-only/health version-only admission запрещён.

Необходимые проверки будущего upstream кандидата (здесь NOT_RUN): exact Venus metadata resolution и отсутствие secret/wildcard resolution; signed Venus release accepted только под Venus key; wrong key/service/tag/schema/digest/min-version и foreign-head token denied до mutation; сохранение всех existing service tests; readonly health/discovery не выдают privileged controls; two heads/one helper reuse/isolation; exact operator ZIP128MiB boundary/forged+expired+wrong-target receipt/failed browser save; job replay/restart/502 recovery; pull/migration/health fault injections с original saved ZIP и previous image; ключи/env отсутствуют в full backup, старые ledgers не воскрешают revocations. Native tests/disposable Linux/systemd rehearsal и Part12 evidence выполняются владельцем/автором отдельной совместимой поставки, не заменяются этим input audit.

## 6. Что остаётся на стороне Venus/P06

Конкретное исследование завершено: baseline/release/API известны, две несовместимости установлены. В P06 dependency candidate нужно записать `BLOCKED_EXTERNAL_COMPATIBILITY` с этими IDs;0.6.17 — только исследованный исходный baseline. Дальнейшие независимые internal preparations доступны: операторский BFF/API proposal, signed release builder, backup/restore design, measured local tests и complete known-problems matrix.

Не приняты/не доказаны: Venus consumer dependency declaration и центральная строка applicability, оператор/host enrollment, authenticated Kernel Register scopes для Venus, реальный signing/bootstrap trust, поддерживающий Venus Updater release, P05 final candidate, RPO/RTO и recovery consequences, actual target-host install/update/rollback/public unauthenticated assets, actual browser saved-copy flow. P04 human gate также остаётся открытым. Этот memo не закрывает EXIT-P06, не публикует release, не разрешает production deployment и не изменяет normative sources.

## 7. Сопоставление с существующим P06 offline prototype

По отдельному поручению root прочитан author checkout `C:/Users/pc/.codex/worktrees/p06-release-preparation/venus` без изменения файлов и без запуска его tests. Нижеследующее относится к **дорабатываемому** prototype, а не уже принятому release protocol. Его test-only/no-installation ограничения полезны и должны сохраниться; несовместимые production-facing форматы нужно выровнять до freeze, а не превращать успешный synthetic fixture в утверждение о совместимости.

| Прочитанный candidate file | SHA-256 до выравнивания |
|---|---|
| `.docs/contracts/release-artifact.v1.schema.json` | `66bfb61e4ff792c46b666d7b25eaff841be4e2e4c77e6dd2505e9c6d963495ec` |
| `.docs/contracts/release-verification-context.v1.schema.json` | `35521b37183bcc81966f1c4c8633654049bfadb7a617b238cbbfec03186a806a` |
| `tools/lib/release-artifact.mjs` | `e93497599de3c0060b553273db4cbe37190cef9074dadacbcd32720cf9f45306` |
| `.docs/P06_RELEASE_PREPARATION.md` | `d01823ea643922ee779c1e75fb5a2982b3845ec0ac283baf323c70751d75f41b` |
| `.docs/adr/ADR-018-p06-offline-release-preparation.md` | `d7bffc96dc9f89ec36fae066f3bed4bf375540199bd5128b47d5afa154099912` |

### Обязательные поля общего head manifest

Источники: actual Go `internal/model/model.go:81–97`, `internal/release/release.go:107–150`, `internal/engine/engine.go` построение nextImage. Сохранять именно общий wire format:

| Prototype сейчас | Actual Updater поле/смысл | Конкретное выравнивание |
|---|---|---|
| component=venus | **service=venus** | service обязателен на верхнем уровне; component не является alias. |
| schema_version=1,version | schema_version=1,service/version совпадают с выбранным qualified tag | Сохранить actual names и exact stable version. |
| image.reference=repository@digest | image.reference + `@` + image.digest | Для Venus common reference выбрать repository без @digest; полный immutable ref вычислять отдельно. Иначе получится двойной @sha256. Generic Go сам bare-reference schema не навязывает, но всегда дописывает digest. |
| bundle.url/sha256 | **compose_bundle.url/sha256** | Верхнеуровневый compose_bundle обязателен; filename/size можно вынести в Venus extension, связав с теми же URL/hash. |
| database_schema_generation | **database_schema**, integer>=1 | Scalar common generation должен быть явным; отдельные core/games/catalog generations сохранить в строго проверяемом Venus compatibility tuple. Не выдумывать смысл scalar из количества migration streams. |
| minimum_updater_version | minimum_updater_version | Привязать к будущему действительно выпущенному Venus-compatible baseline;0.6.17 не становится compatible от совпадения этого числа. |
| proposed bundle ceiling512MiB | compose bundle download<=128MiB | Если это тот же Updater compose bundle, ограничить134217728 bytes. Это отдельная граница от128MiB decoded full-backup ZIP; ни одну нельзя обходить другой. |
| platform arm64/amd64 | опубликованный Updater0.6.17 binary/installer только linux-amd64 | Arm64 остаётся непроверенной будущей matrix cell; данный pin не доказывает совместимость ARM deployment. |

Go `json.Unmarshal` игнорирует незнакомые поля. `role/channel/tag/source_commit/platform/updater/host_dependencies/compatibility_contract_sha256/documentation/signing_key_sha256/release_notes_url` в этом общем model не контролируются Updater автоматически. Предпочтительная структура — common fields выше плюс **один явный `venus` namespace** для строгого Venus tuple/дополнительных координат, без двусмысленных aliases. Venus verifier должен проверять весь этот namespace, cross-field equality и независимо доверенный context; unknown-field strictness внутри него сохраняется. Если эти дополнительные условия должны быть host-side pre-mutation guard, потребуется отдельный typed Venus manifest handler/ValidateVenus в будущей Updater поставке — простое добавление JSON полей не обеспечивает такой guard.

### Подпись и ключ — три разных контура

Текущий prototype `release-artifact.mjs:43,58–59` принимает только Ed25519, raw signature64bytes и verify(null). Это не actual release envelope. Для будущего aligned verifier:

- Public key — single SPKI RSA public PEM>=3072, key_id/public_key_sha256=SHA256(DER). Не разрешать private PEM и не принимать ключ из самого manifest.
- Signature file — bounded JSON envelope<=16KiB со schema=`exocortex.release-signature.v1`, algorithm=`RSA-PSS-SHA256`, key_id, signature=standard base64. Verify SHA256 поверх **точных manifest bytes**, RSA PSS padding/saltLength32; key_id сверить с доверенным public key. Не сохранять старое требование signatureBytes.length===64.
- Canonical `VENUS-CJSON-1` можно оставить более строгим authoring format для Venus, но это не обязательство generic Updater canonical parser: Go проверяет подпись exact bytes, затем json.Unmarshal. Не подписывать один encoding и не проверять другой.
- P04 human/card approvals Ed25519 **не менять**; saved-copy backup receipt HMAC-SHA256 тоже не заменять RSA. Это отдельные trust scopes с разными задачами.

### Какой tuple действительно нужно связывать

Предложение общего профиля, а не готовый новый schema file: exact main/source commit40hex + implementation identity; qualified venus-vX.Y.Z; common service/version; bare OCI reference и sha256 digest, derived immutable image ref; common compose_bundle canonical URL/raw SHA/bytes/required member; common database_schema и explicit module-generation compatibility/previous release/restore profile; fixed policy/cardpack/contract identities; pinned future Updater release version/source commit/installer URL+SHA/public key identity и **наблюдаемый update_protocol=2 плюс принятый Venus-support compatibility contract**, а не выдуманное vendor api_revision поле; approved helper consumption matrix и central revision; signed manifest bytes hash и detached envelope identity. Производные совпадения строк не доказывают actual remote main/running image/host enrollment — эти факты по-прежнему нужно измерить.

Список concrete upstream additions остаётся точным: repository metadata key и release trust scope обязательны; helper capability только согласно принятой матрице; typed Venus manifest/restore handler нужен, если выбранный compatibility/offline-recovery guard не обеспечивается generic engine. Не добавлять Venus к shared-host component catalog и не маскировать его под другой service/profile.

Требуемые новые prototype negatives: common-field omission/alias substitution; reference с уже встроенным @digest и derived double digest; несовпадающие common/venus extension identity/hash/generations; wrong RSA key/key_id/envelope/schema/algorithm/PSS salt/signature/manifest byte mutation; Ed25519 release key rejected, P04 Ed25519 unaffected; compose limit отдельно от backup limit; mixed synthetic/real Updater tuple не становится approved; дополнительные поля не считаются проверенными Updater только из-за успешного Go Unmarshal. После выравнивания нужны fresh source-bound native/CLI/Linux tests и независимый review. В этом input audit никакой такой PASS заранее не заявляется.
