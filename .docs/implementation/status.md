# Venus · Состояние реализации

Обновлено: 2026-10-18. **EXIT-P00 = PASSED, EXIT-P01 = PASSED, EXIT-P02 = PASSED.** P02 принят двумя независимыми агентами после исправлений; production/public release не разрешён. Ветка: `feature/p02-rooms`, [PR #2](https://github.com/psewdon1m/venus/pull/2). P01 уже в main; исходная история сохранена тегом `p01-accepted-20261018`.

Созданы защищённый main и PR-процесс, TypeScript monorepo, React/Fastify/PostgreSQL foundation, exact toolchain/locks, quality и четыре отрицательные проверки, OCI smoke с настоящей БД. Реализованы только health/version/static shell на RU/EN/TR. [Developer guide и rollback](../DEVELOPER_GUIDE.md), [реестр P01](p01-registry.json), [ADR-013](../adr/ADR-013-p01-foundation.md).

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
| P03 | IMPLEMENTING | Production engine, immutable snapshot и authenticated consent; отдельный журнал P03 |
| P04 | NOT_STARTED | Reviewed production card catalogue |
| P05 | NOT_STARTED | Полный G1 UX/E2E, текст оферты/version, entry18+ |
| P06 | NOT_STARTED | Protected signing/release, host dependencies/operator, restore/rollback |
| P07 | NOT_STARTED | Реальный target host и ограниченный запуск |
| P08 | NOT_STARTED | Лицензированная Music |
| P09 | NOT_STARTED | Desktop Cinema |
| P10 | NOT_STARTED | Android/iOS publisher |
| P11 | NOT_STARTED | Calls |

Текущий этап — P03: production relationship engine, immutable snapshot, rounds и consent, [журнал](../../.history/2026-10-18-p03.md). P02 влит в main6efcb7d37d9fe4fc43db411e1e40052301a5175d, accepted history сохранена tagp02-accepted-20261018. Guest/operator scope зафиксирован отдельным overlay; room host не operator. Production offer отсутствует, public entry закрыт. Публичный release блокируется дальнейшими гейтами; source snapshots не подменяют проверки production host, auth, age/legal и media.

Журнал работы: [P01 · 2026-10-18](../../.history/2026-10-18-p01.md). Локальный образец из другого проекта не включён в Git, source inventory или image.
