# ADR-010 · Технический baseline и SQL migrations

**Дата:** 2026-10-18 · **ревизия:** P00-1 · **статус:** `DECIDED_FOR_PREPARATION`.

**Ответственный профиль:** Engineering (исполнитель: Codex). **Принимающий:** Separate agents /root/contract_review and /root/evidence_review. **Последний рубеж:** EXIT-P00.

## Контекст и вопрос

Закрепить локальный технический baseline в рамках поручения P00, не объявляя независимую приёмку.

## Варианты / подготовленное решение

TypeScript monorepo, React/Vite, Fastify, PostgreSQL; явные versioned SQL migrations и typed contracts. ORM не обязателен; handwritten SQL с параметрами, не прямое исполнение псевдо-DDL из02. Exact supported версии/locks проверяются в P01.

## Доказательства для принятия

Contract/schema/reference tests сейчас; toolchain/build/real migrations в P01/P02. Альтернатива ORM допускается новой ADR с теми же invariants.

## Последствия, совместимость и откат

До runtime вернуть contract revision; после DB только tested expand/compatibility/restore.

## Связи и история

Источник: [оркестратор](../README.md), [архитектура](../02_TECHNICAL_ARCHITECTURE.md), [план](../10_IMPLEMENTATION_PLAN.md). Зависимости: ADR-011. Решения владельца: U-004; см. [список решений](../implementation/USER_DECISIONS.md).

2026-10-18: запись подготовлена Codex по поручению P00. `DECIDED_FOR_PREPARATION` разрешает подготовку кандидата и тестов; не означает утверждения владельцем, независимого review, production readiness или закрытия EXIT-P00. Для остальных статусов окончательное решение отсутствует.

## Технический review P00-2

По принятому U-004 проверку выполняют отдельные агенты с отчётами и input hashes. Round1 содержит FAIL, исправления требуют повторного review; локальные тесты сами не принимают гейт. Актуальный результат хранится в implementation/status.md и bound gate report.
