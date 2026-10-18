# ADR-013 · Воспроизводимый foundation и CI trust boundary

Дата: 2026-10-18. Статус: IMPLEMENTED; результат независимой приёмки хранится в P01 gate report. Владелец: Engineering / Codex. Рубеж: EXIT-P01. Основание: ADR-010, ADR-011, U-004, поручение реализации P01. Отдельного продуктового согласования не требуется.

Node24.22.0/npm11.19.1, Python3.12.14; exact dependencies+integrity lock, TypeScript6.0.3 (совместимый диапазон typescript-eslint<6.1), React19.3.1/Vite8.3.4, Fastify5.12.7, pg8.23.1/PostgreSQL16.14. npm workspaces избегает отдельного package-manager bootstrap. Нет ORM или прикладной migration до P02. OCI node/postgres закреплены digest. Образ nonroot; developer Compose isolated, loopback-only.

Ordinary CI проверяет PR/push без credentials persistence и signing secrets, contents:read, actions pinned commit SHA. Release/signing не включён; P06 создаёт отдельный protected workflow/environment. Защищённый main требует два обязательных GitHub Actions job; технический gate принимают отдельные агенты, human approval count=0 по U-004.

Version содержит build source commit и локальный config image digest из launcher; не выдаёт это за registry digest/signature. Readiness означает только SQL connectivity при schema_generation0. Логи содержат разрешённые структурированные поля, без сырых ошибок/данных запросов. Room auth/consent/retention не имитируются.

Исторический P00 проверяется на byte archive, включая все прежние доказательства. Его 12 исходных ADR сохранены; эта запись и P01 registry расширяют историю, не переписывают принятый P00 index. Текущая source inventory/manifest включает новые файлы и исключает generated output. Подробные команды, ограничения и rollback: [developer guide](../DEVELOPER_GUIDE.md).

Альтернативы: pnpm добавляет bootstrap; ORM преждевременно определяет P02; объединённый release/PR workflow увеличивает доверие к непроверенному fork. Неприменённые варианты не нужны для foundation.
