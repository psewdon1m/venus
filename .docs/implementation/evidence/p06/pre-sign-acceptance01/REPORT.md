# P06 — итог локальной реализации и независимых гейтов

Локальная реализация и pre-sign приёмка **PASS**. Полный EXIT-P06 **HOLD**: реальный сервисный ключ ожидает подтверждения владельца; qualified service release `venus-v0.0.1` ещё не выпускался. P07 не начат.

## Что реализовано

Встроенные operator UI/API с отдельными идентичностями и ограниченным протоколом, подписанный release/bundle, проверка точного image, установка и транзакционный журнал обновления. Create/confirm/apply/cancel/recover сохраняют один job_id; reload, потеря ответа 502 и restart не создают вторую мутацию. Consumer API не получает Docker socket или произвольный shell.

Полный PostgreSQL backup записывается атомарно в owner-only host file. Совместимый откат использует проверенные backup и offline previous image. Защищённые deletion/withdrawal ledgers и high-water witness сохраняются отдельно от DB backup; восстановление старой БД повторяет новые удаления до serving. Обычный restart не восстанавливает backup автоматически. Runbook и trust boundary закреплены в ADR-031; внешние Exocortex/Updater не требуются.

## Точный кандидат и проверки

Проверенный clean Git: `92b7f9d9c5dd5caa6a0953f28ed8e984e04393ba`. Source identity: `fe51759f0c5c3c605b260c14121ae60ed12e7999783b9dcc1c6aa3a2ea8f876d`, 1942 файла. Поздние closing evidence/журналы/статусы/манифест являются производными; им не приписывается новый запуск приложения.

Код первоначального объёма завершён до первого теста; затем выполнен цикл проблема → исправление → профильные тесты → независимая проверка. Неудачные quality01 и Docker01–08 сохранены; замечания E01–E06/SEC01–SEC02 устранены. Последняя правка приложения повторяет закрытие комнаты по защищённому ledger через существующий locked closeRoom с исходным timestamp, сохраняя строгую Topic lifecycle проверку. Для неё выполнена новая полная регрессия.

| Проверка | Фактический результат |
| --- | --- |
| Linux Docker quality03 | exit0; 1315 JS PASS, 3 platform SKIP, 124 Python PASS, 14 catalog-history PASS; lint/typecheck/schema/i18n/docs/build/catalog/negatives PASS |
| Профильные P06 unit09 | 28 PASS, 0 FAIL, 0 SKIP, exit0 |
| Docker round09 | 18 практических проверок PASS; 9 реальных SIGKILL-фаз плюс terminal COMMITTED restart/idempotence |
| Данные | 11 точных сравнений counts шести таблиц, расшифровка synthetic encrypted preferences/completed snapshot, full fresh-DB restore |
| Operator UI | Chromium, create/confirm/502/reload/reauth/cancel; прежний job_id, без хранения credential в browser storage |
| Offline recovery | A удалён из собственного cache, registry остановлен, точный previous image действительно загружен из проверенного архива |
| Monotonic recovery | Новое закрытие комнаты и отзыв карточки не отменяются старым backup; missing/regressed ledger закрывает serving |
| Независимые проверки | Engineering/QA и Security/Privacy: PASS_PRE_SIGN, открытых локальных замечаний нет |

Семь восстановлений: FAILED→RECOVERED_A **2578–8792 ms**, backup age на recovered event **3498–36311 ms**. Это интервалы оригинальных UTC journal timestamps с точностью 1 ms, включая работу на границах событий; это не неэкспортированный engine stopwatch и не production RTO/RPO SLA. Потери данных согласованного backup нет сверх обязательного удаления по более новому ledger. Одна отдельная synthetic admin-запись после backup явно учтена как не восстановленная. Во время одного recovery drill работал отдельный quality container с лимитом 2 CPU/4 GiB; лимиты стенда зафиксированы до испытаний.

## Гейты и трассируемость

INSTALL, SCOPE/applicability, BACKUP, UPDATE-ACL, FAULTS, MONOTONIC и RECOVERY приняты в применимой локальной части. RELEASE принят только как проверенный локальный протокол/pre-sign readiness; полный service release не принят.

Все 118 исторических Part12 ID сохранены с отдельными решениями: **66 local PASS, 34 узких N/A внешней интеграции, 8 pending final signed artifacts, 10 production deferred**. Generic data/ACL/restore не отменены отсутствием Exocortex. Полная построчная матрица и восемь gate decisions находятся в [DECISION.json](DECISION.json). Историческая applicability source revision не переписана.

[Engineering/QA](../../../reviews/p06/engineering-round05/REPORT.md) · [Security/Privacy](../../../reviews/p06/security-round04/FINAL_REPORT.md) · [quality03](../quality-round03/INDEX.json) · [Docker09](../docker-round09/INDEX.json) · [измерения](../recovery-measurements01/MEASUREMENTS.json).

## Что требуется для полного EXIT-P06

От владельца требуется подтвердить public key_id `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb` и сохранение private part как `VENUS_RELEASE_PRIVATE_KEY` в GitHub Environment `venus-release` репозитория `psewdon1m/venus`, либо явно отложить настоящий service release. Приватная часть подготовлена вне Git, images и логов; public trust пока `owner_approved:false`, secret не загружен. Запрос уже отправлен; ответа пока нет. Подтверждение реальных секретов прямо предусмотрено разделом P06 [активного плана](../../../../10_IMPLEMENTATION_PLAN.md).

После решения остаются активация public trust новой source revision, применимые проверки и перепривязка обоих независимых отчётов, remote CI/main binding, immutable tag/image/signature/assets и anonymous published-asset/exact-image проверка. Только после этого возможен полный EXIT-P06. Изменение trust bytes меняет source identity: нынешний pre-sign proof не авторизует изменённый source.

Реальные signing environment, GitHub main/tag/CI этого release, опубликованные assets и installation настоящего service image пока NOT_RUN. Production deployment/DNS/TLS/UDP/реальные устройства и внешний backup-copy не заявлены. Исходный 450 HOLD и временный owner PASS текущих470 для локального пилота не менялись.

## Откат и сохранность

До mutation отказ сохраняет A и данные; после mutation применяется проверенное совместимое восстановление A с исходной ошибкой и отдельным recovery outcome. Protected ledgers не откатываются. При недоказанной совместимости serving остаётся закрыт, сохраняется failed job. Выпущенные immutable tags/assets нельзя переписывать; проблемный кандидат отзывается для новых install.

Тестовый стенд P06 остановлен. После сохранения всех FAIL и PASS packets удалены ровно шесть собственных failed synthetic volumes с проверкой nonce label и отсутствия attached containers; images сохранены для review. Global prune не выполнялся, три чужих endurance container не затронуты. Root Git index и принятый P05 INDEX сохранены без изменений. Журналы оркестратора, этапа и обоих агентов сохранены; агенты завершили записи до closing manifest.
