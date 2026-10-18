# Venus · Состояние реализации

Обновлено: 2026-10-18. **EXIT-P00 = PASSED, EXIT-P01 = PASSED.** P01 принят как кандидат в PR, production/public release не разрешён. Ветка реализации: `feature/p01-foundation`; merge в main ещё не выполнен.

Созданы защищённый main и PR-процесс, TypeScript monorepo, React/Fastify/PostgreSQL foundation, exact toolchain/locks, quality и четыре отрицательные проверки, OCI smoke с настоящей БД. Реализованы только health/version/static shell на RU/EN/TR. [Developer guide и rollback](../DEVELOPER_GUIDE.md), [реестр P01](p01-registry.json), [ADR-013](../adr/ADR-013-p01-foundation.md).

## EXIT-P01

Проверенный source SHA: `aa680b8dd29358245d4cf715ba15204106d918a9`. Source identity: `b2a15edfbd321c193152c97f6a8a7f8f9271379cf5519f1526fad304627448dd`. Последующие изменения содержат только status/registry/proofs/reviews/consistency manifest; validator сверяет весь остальной source inventory с проверенной Git-ревизией. Derived evidence не выдаётся за новый runtime build.

[PR #1](https://github.com/psewdon1m/venus/pull/1), [реальный PR CI](https://github.com/psewdon1m/venus/actions/runs/39144088108), [итоговый gate report](evidence/p01/gate-report.json), [implementation round2](reviews/p01/implementation-round2.md), [evidence round2](reviews/p01/evidence-round2.md). Два отдельных агента: PASS, 0 open findings. Round1 FAIL и его evidence сохранены; исправлены malformed URL, связь CI jobs/run/source, snapshot negative checks, Compose/image/log proofs и процедура rollback без удаления CI.

Локально и в GitHub Actions: lint/types/schema/i18n/docs/build PASS; 71 Python +3 JS unit tests PASS; четыре negative fixtures отвергнуты по ожидаемой причине на неизменённых исходниках. Clean-source OCI smoke:7 checks PASS, реальная PostgreSQL остановлена/восстановлена, readiness503 при сохранённой liveness200. App nonroot1000, read-only rootfs, cap_dropALL, no-new-privileges, без Docker socket; app port только127.0.0.1, DB не опубликована. Образ и логи прошли secret/canary checks.

Локальный OCI config image ID: `sha256:3b26fbbf99248afad81b4214932529b66b95f46a16bb95d570e9d7c677387d08`; registry manifest/signature ещё не созданы. Main требует quality/container-smoke от GitHub Actions app15368, strict up-to-date, PR, закрытых обсуждений; enforce admins=true, force push/deletion=false. Signing/release credentials отсутствуют в обычном CI; protected release реализуется P06.

Проверка связанной приёмки: `python -B tools/p01_gate.py verify`. Три P01 API requirement statuses VERIFIED записаны как overrides в P01 registry; исходный P00 CSV сохранён как исторический baseline.

## Исторический EXIT-P00

P00-2:253 trace rows,12 исходных ADR,33 API operations,162 центральных sections applicability; 63 исторических unit tests и9 checks, два независимых PASS round3. [P00 gate](evidence/p00-2-candidate-r3/gate-report.json), [контрактный review](reviews/contracts-round3.md), [evidence review](reviews/evidence-round3.md) сохранены. Byte archive проверяется переносимо; текущие нормативные inputs P00 не изменены. Приёмка P01 добавляет ADR-013, не переписывая принятые 12 ADR.

## Этапы

| Этап | Статус | Следующий результат |
|---|---|---|
| P00 | PASSED | Исторический P00-2, original inputs/reviews сохранены |
| P01 | PASSED | Проверенный foundation в PR #1; disposable среда после smoke удалена |
| P02 | NOT_STARTED | Реальные migrations, комнаты/identity/entry-policy/ACL/retention |
| P03 | NOT_STARTED | Production engine и consent |
| P04 | NOT_STARTED | Reviewed production card catalogue |
| P05 | NOT_STARTED | Полный G1 UX/E2E, текст оферты/version, entry18+ |
| P06 | NOT_STARTED | Protected signing/release, host dependencies/operator, restore/rollback |
| P07 | NOT_STARTED | Реальный target host и ограниченный запуск |
| P08 | NOT_STARTED | Лицензированная Music |
| P09 | NOT_STARTED | Desktop Cinema |
| P10 | NOT_STARTED | Android/iOS publisher |
| P11 | NOT_STARTED | Calls |

Следующий этап — P02; до auth реализации уточняется exact guest/operator applicability центральных требований. U-001…005 и custom comfortable UI учтены. Решений владельца, блокирующих P01, нет. Rooms/games/entry пока отсутствуют; schema_generation0 означает SQL connectivity без прикладной схемы. Публичный release блокируется дальнейшими гейтами; source snapshots не подменяют проверки production host, auth, age/legal и media.
