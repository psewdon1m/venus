# Standalone · чистый локальный Docker-прогон

Итог: [PASS_COMPONENT_ONLY](component-gate.json). Две независимые проверки: [implementation PASS](../../../reviews/standalone/final-implementation.md), [evidence PASS](../../../reviews/standalone/final-evidence.md). Замечаний к этому scope не осталось; это не полный stage acceptance.

Проверен commit `0c790881bc34257da8ee7f887e4506be6dc6d01a`, included identity `2bd8e3cdcb2a6b4ab5d179a12301973a30bb836b70a53943047a8cae9e51bd8d`. Оба запуска начались и закончились с чистым checkout и неизменными included bytes. [Индекс 25 исходных файлов](index.json) фиксирует SHA-256 и размер; этот README является последующим пояснением.

- `quality:docker`: actual exit 0, 57 JS +117 Python +14 content/history tests, schema/i18n/docs/types/lint/build и четыре отрицательных контроля PASS. Весь suite работал в Linux Docker без сети и Docker socket, под UID1000, с Git только для чтения.
- Свежий C2: по 5880 eligibility cells и 4200 нейтральных сессий длиной 1–100 раундов в каждом из двух capability-профилей. Private baseline25 доступен in-person; online допускается только при `private_text_chat`. Успешный условный профиль не означает, что приватный чат уже реализован.
- `test:local-pilot`: 9/9 actual Docker checks PASS — default closed, mock RU/EN/TR, отказы 18+/mock/stale acceptance, явное принятие и создание комнаты, рестарт PostgreSQL-backed состояния, закрытие admission и отсутствие Docker socket у API.
- Оба runner завершили cleanup без ошибок. Сохранились image IDs для воспроизведения; собственные контейнеры, тестовый DB volume и временные ключи удалены.

Raw stdout/stderr: [quality](standalone-quality-docker-final-01.txt), [local entry](standalone-local-pilot-final-01.txt). Точные before/after input maps, внутренний producer report, schema/coverage/history reports и negative receipts находятся в `quality/`; runtime proof и безопасные app logs — в `mock-entry/`.

Это проверка локального entry-компонента и draft-каталога. Полные EXIT-P04/P05/P07, production, физические устройства, новые M3-измерения и A/V не заявляются. Исходный owner HOLD не заменяется агентским PASS; reviewed registry остаётся пустым.

Изменённый контент для человеческой приёмки: [полный текст 450 карточек](../../p04/review-450-full-coverage/full-check-02/REVIEW.md), [отчёт автора](../../p04/review-450-full-coverage/AUTHOR_REPORT.md), [текущая финальная выборка истории](../../p04/review-450-full-coverage/authoring/final-history-selection.json). Проверяемый catalog `5de601019fc8eae1c9491a610984e485e3fedce0d36d3d1326b8a589ee528bd4`; pack `sha256:c668e4e8514d6acd97904c14937787e2f67af909d4af204252efb05d8a076484`.
