# Updater Venus source-only proposal · independent review01

**CHANGES_REQUESTED — proposal metadata only, not EXIT-P06.** Reviewer `/root/p04_evidence_review`; upstream17e2dcf1e72bbc6492ea5692520932d1c95a618f, patch SHA256 `dec8a40ec7f7f8b85cd46ee3d5c92deceb1bda5e6b83537a4e477e14ca699d64`.

Read-only просмотрены patch, proposal report/origin, baseline negative/patched positive/environment failure logs, public-only Node vector и отдельный Go interoperability harness. Foreign Updater checkout не менялся и его tests/runtime не запускались. Самостоятельно проверен `git apply --check --whitespace=error-all` на чистом foreign checkout; результат0. Собственный source comparator подтвердил: все9 текущих owned-copy baseline files равны exact `git show`17e2 bytes, кроме ровно двух ожидаемых добавлений venus к allowlists. Foreign git status по-прежнему чист.

## Scope и границы безопасности

Patch содержит ровно две production-line правки и два новых test files. Repository lookup разрешает только точный metadata key repositories.venus.url, не wildcard credentials. Release trust допускает отдельный Venus scope и сохраняет per-service venus.pem, pinned SPKI RSA>=3072/key_id/PSS checks. Не изменены network redirect/auth behavior, helper consumption maps, root-only operator APIs, runtime installation, manifest/restore handlers или общий deployment scope.

Новые tests содержат синтетические локальные HTTP/TLS endpoints, проверку отсутствия credential resolution/cache leakage, missing/wrong/neighbor public pins, tampered bytes и unknown trust scope. RSA private keys генерируются в памяти test, в файлы пишутся только public PEM/signatures. Дополнительный Node→actual Go VerifyBytes harness вынесен за пределы upstream patch. Baseline log содержит ровно два ожидаемых scope failures; positive log —10 primary PASS и2 redirect subcases PASS. Отдельный noexec environment failure сохранён и не переобозначен test-case proof. В этом review tests заново не запускались: inspected actual root logs и source bytes сопоставлены, полный Updater suite не утверждается.

## UVP-E01 / P2 · неправильная атрибуция input before hashes

Исходный proposal-report.input_files_before и proposal-origin.files описывают archive-export/Windows EOL bytes, а не raw Git blobs17e2. Примеры:

| File | Первоначально записано before | Actual git show17e2 |
|---|---|---|
| go.mod | `64e49bfc5ec1123101f2553f34b247b39c618c6e8c2fb1bcd21acee25ac927c7` | `6fb9f6e40d2d4a67453d9031d5844c5ed9c0f708e9fdd4c795d908956bb4d8fc` |
| internal/kernel/register.go | `0ef57c31add9a31d86fc4a44ea9eeb764e4c41149392dcf2efa0ce2a6b7fd30d` | `d93105af192fab4bd542bbd98d47aed8f5394f9ff7e48261e61dde57aad5208c` |
| internal/releaseauth/verify.go | `6933bd74c5cc923cddd5136900d4855e1849716947fe5a161fe2cd3deba690f2` | `5f724b26d00ae578f78c0783790882d44af7314757145a0e1dcf2483eab9227b` |

Root подтвердил: первый importer использовал git archive с export EOL; перед actual baseline/patched tests отдельный helper переписал все9 файлов через git show в exact raw LF. Текущий owned source это подтверждает, но старый origin receipt остался. Это не обнаружение расширенного patch scope или плохой криптографии; это ложная raw-source атрибуция в evidence.

Нужно сохранить старый report/import receipt как отдельный attempt, явно назвать archive-export bytes, добавить raw Git blob input map и EOL-normalization witness, связать actual baseline/patched source с соответствующей raw map и reproducible helper. Повторять те же tests только из-за исправления metadata не требуется, если nine tested bytes/patch/harness/vector неизменны; повторная проверка metadata фиксируется новым report02. Первоначальный FAIL не переписывается.

Никакой результат этого proposal review не утверждает whole Updater support, typed Venus manifest/restore compatibility, новый опубликованный release, maintainer approval, accepted dependency matrix, installed host или EXIT-P06.
