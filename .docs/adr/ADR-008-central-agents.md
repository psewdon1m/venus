# ADR-008 · Central Part13 и host dependency matrix

**Дата:** 2026-10-18 · **ревизия:** P00-1 · **статус:** `BLOCKED_EXTERNAL`.

**Ответственный профиль:** Infrastructure / Operator. **Принимающий:** Авторитетный владелец central norms / оператор. **Последний рубеж:** EXIT-P06.

## Контекст и вопрос

Получить immutable применимые Parts; Part13 определяет обязательных agents, scopes/versions/readiness.

## Варианты / подготовленное решение

Использовать authoritative revisions; неизвестное не объявлять N/A, не копировать agents в Venus compose.

## Доказательства для принятия

Exact source SHA, applicability matrix, enrolled/authenticated integration smoke.

## Последствия, совместимость и откат

Не применять неподтверждённый deployment; вернуть ранее проверенный host profile без takeover shared services.

## Связи и история

Источник: [оркестратор](../README.md), [архитектура](../02_TECHNICAL_ARCHITECTURE.md), [план](../10_IMPLEMENTATION_PLAN.md). Зависимости: нет дополнительных. Решения владельца: U-005; см. [список решений](../implementation/USER_DECISIONS.md).

2026-10-18: запись подготовлена Codex по поручению P00. `DECIDED_FOR_PREPARATION` разрешает подготовку кандидата и тестов; не означает утверждения владельцем, независимого review, production readiness или закрытия EXIT-P00. Для остальных статусов окончательное решение отсутствует.

## Полученные источники P00-2

U-005 выполнен: authoritative Parts00–13 получены из general.git@4449e65d732ca44b91cec5a6f3ca16c2c618578f, пофайловые SHA256 закреплены. Исходное BLOCKED_EXTERNAL относилось к отсутствующим нормам; теперь открытым остаётся Venus dependency declaration/строка матрицы и конкретный оператор до P06. Generic Updater обязателен, Neptune автоматически не назначен. Полнота источников не доказывает enrollment/runtime readiness.
