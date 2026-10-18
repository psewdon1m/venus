# Реестр ADR

Ревизия P00-2. ADR-001…009 сохраняют исходные ID. `ACCEPTED` у005/006/007/012 означает прямое принятие владельцем U-001…004; это не доказательство реализации. `DECIDED_FOR_PREPARATION` — технический кандидат исполнителя, проверяется отдельными агентами. `DEFERRED` и `BLOCKED_EXTERNAL` не закрываются автоматически.

| ID | Вопрос | Статус | Рубеж |
|---|---|---|---|
| [ADR-001](ADR-001-sfu-host.md) | Размещение и сеть внешнего LiveKit | `DEFERRED` | EXIT-P09 |
| [ADR-002](ADR-002-android-capture.md) | Android: screen + разрешённый playback audio | `DEFERRED` | EXIT-P10 |
| [ADR-003](ADR-003-ios-capture.md) | iOS: capture и разрешённый app audio | `DEFERRED` | EXIT-P10 |
| [ADR-004](ADR-004-music-rights.md) | Источник и права музыкального каталога | `DEFERRED` | EXIT-P08 |
| [ADR-005](ADR-005-retention.md) | Retention отношений, primary и backup | `ACCEPTED` | EXIT-P05 |
| [ADR-006](ADR-006-age-content.md) | Возрастная и контентная политика | `ACCEPTED` | EXIT-P04 |
| [ADR-007](ADR-007-private-online-chat.md) | Настоящий приватный онлайн-момент в G1 | `ACCEPTED` | EXIT-P00 |
| [ADR-008](ADR-008-central-agents.md) | Central Part13 и host dependency matrix | `BLOCKED_EXTERNAL` | EXIT-P06 |
| [ADR-009](ADR-009-media-quality.md) | RTC quality и room sound policy | `PROPOSED` | EXIT-P09 |
| [ADR-010](ADR-010-stack-migrations.md) | Технический baseline и SQL migrations | `DECIDED_FOR_PREPARATION` | EXIT-P00 |
| [ADR-011](ADR-011-protocol-projections.md) | API/WS/DB/privacy candidate P00-1 | `DECIDED_FOR_PREPARATION` | EXIT-P00 |
| [ADR-012](ADR-012-acceptance-and-external-inputs.md) | Принятие P00, роли и отложенные критерии | `ACCEPTED` | EXIT-P00 |

[Машинный реестр](index.json) · [Решения владельца](../implementation/USER_DECISIONS.md). История предложений сохранена; гейты требуют тестов и независимых отчётов. Получение central norms и разрешение material divergence — разные действия.
