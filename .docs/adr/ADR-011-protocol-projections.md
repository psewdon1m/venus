# ADR-011 · API/WS/DB/privacy candidate P00-1

**Дата:** 2026-10-18 · **ревизия:** P00-1 · **статус:** `DECIDED_FOR_PREPARATION`.

**Ответственный профиль:** Engineering / Privacy. **Принимающий:** Separate agents /root/contract_review and /root/evidence_review. **Последний рубеж:** EXIT-P00.

## Контекст и вопрос

Уточнить atomics, projections, decline precedence и additive own/private endpoints без выдачи draft за работающий API.

## Варианты / подготовленное решение

OpenAPI3.1 + strict JSONSchema1; UUID IDs; per-operation idempotency; room/session locks; scoped projections; private card ID не публичен; explicit flags сохраняются.

## Доказательства для принятия

Schema negatives, state/rule tests, source traceability; transport/DB/browser доказательства оставлены P02/P03/P05.

## Последствия, совместимость и откат

Отменить candidate до клиентов; после — совместимое окно/new contract version. Snapshot/consent не переносить молча.

## Связи и история

Источник: [оркестратор](../README.md), [архитектура](../02_TECHNICAL_ARCHITECTURE.md), [план](../10_IMPLEMENTATION_PLAN.md). Зависимости: ADR-005;ADR-007;ADR-010. Решения владельца: U-001;U-004; см. [список решений](../implementation/USER_DECISIONS.md).

2026-10-18: запись подготовлена Codex по поручению P00. `DECIDED_FOR_PREPARATION` разрешает подготовку кандидата и тестов; не означает утверждения владельцем, независимого review, production readiness или закрытия EXIT-P00. Для остальных статусов окончательное решение отсутствует.

## Технический review P00-2

По принятому U-004 проверку выполняют отдельные агенты с отчётами и input hashes. Round1 содержит FAIL, исправления требуют повторного review; локальные тесты сами не принимают гейт. Актуальный результат хранится в implementation/status.md и bound gate report.
