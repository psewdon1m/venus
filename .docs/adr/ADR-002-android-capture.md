# ADR-002 · Android: screen + разрешённый playback audio

**Дата:** 2026-10-18 · **ревизия:** P00-1 · **статус:** `DEFERRED`.

**Ответственный профиль:** Android / RTC. **Принимающий:** Владелец mobile scope / QA. **Последний рубеж:** EXIT-P10.

## Контекст и вопрос

Задать реальные OS/device/source комбинации; не обещать audio по наличию video.

## Варианты / подготовленное решение

MediaProjection + допустимый playback capture; ограничить supported matrix при запрете источника.

## Доказательства для принятия

Реальные аппаратные A/V, permission/revoke/background/network и thermal tests.

## Последствия, совместимость и откат

Отключить server publish для проблемной native версии, сохранить browser participation.

## Связи и история

Источник: [оркестратор](../README.md), [архитектура](../02_TECHNICAL_ARCHITECTURE.md), [план](../10_IMPLEMENTATION_PLAN.md). Зависимости: ADR-001. Решения владельца: отложены до профильного гейта; см. [список решений](../implementation/USER_DECISIONS.md).

2026-10-18: запись подготовлена Codex по поручению P00. `DECIDED_FOR_PREPARATION` разрешает подготовку кандидата и тестов; не означает утверждения владельцем, независимого review, production readiness или закрытия EXIT-P00. Для остальных статусов окончательное решение отсутствует.
