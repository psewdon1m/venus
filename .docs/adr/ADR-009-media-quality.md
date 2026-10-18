# ADR-009 · RTC quality и room sound policy

**Дата:** 2026-10-18 · **ревизия:** P00-1 · **статус:** `PROPOSED`.

**Ответственный профиль:** RTC / QA / Product. **Принимающий:** Назначенный RTC/QA reviewer. **Последний рубеж:** EXIT-P09.

## Контекст и вопрос

Принять measurement profile до испытаний и sound policy Cinema/Music/Calls.

## Варианты / подготовленное решение

Исходные targets p95 AV<=120ms/skew<=500ms/glass-to-glass<=2s в согласованном нормальном профиле; music pause при Cinema.

## Доказательства для принятия

Profiles, sample count/duration/percentiles, normal/throttled/UDP-blocked, причины DEGRADED.

## Последствия, совместимость и откат

Снять support claim/выключить module; смена порога требует новой ревизии/ADR, не ретуши старого FAIL.

## Связи и история

Источник: [оркестратор](../README.md), [архитектура](../02_TECHNICAL_ARCHITECTURE.md), [план](../10_IMPLEMENTATION_PLAN.md). Зависимости: ADR-001. Решения владельца: отложены до профильного гейта; см. [список решений](../implementation/USER_DECISIONS.md).

2026-10-18: запись подготовлена Codex по поручению P00. `DECIDED_FOR_PREPARATION` разрешает подготовку кандидата и тестов; не означает утверждения владельцем, независимого review, production readiness или закрытия EXIT-P00. Для остальных статусов окончательное решение отсутствует.
