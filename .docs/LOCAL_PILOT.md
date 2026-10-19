# Venus · Локальная проверка standalone-входа

Действующая граница — [план v2](10_IMPLEMENTATION_PLAN.md) и [ADR-019](adr/ADR-019-standalone-local-pilot.md). Это проверка компонента входа/комнат в Docker, не полный EXIT-P05/P07 и не запуск production.

## Запуск проверки

Использовать закреплённые Node/npm/Python из [developer guide](DEVELOPER_GUIDE.md), установленные зависимости и Linux Docker Engine. Из чистого checkout:

```text
npm run quality:docker
npm run test:local-pilot
```

Runner собирает реальный runtime image, создаёт отдельный Compose project со случайным именем, PostgreSQL, API и локальным TLS-прокси. Ключи и DB password генерируются для данного прогона и не печатаются. После проверки удаляются только принадлежащие этому project контейнеры, volumes и временные файлы. Image остаётся доступным по ID из отчёта. Не затрагиваются чужие Docker projects или системный ingress.

`quality:docker` запускает весь lint/types/unit/schema/i18n/Python/docs/build/negative suite внутри Linux Docker с закреплёнными Node/Python, без сети и без Docker socket. Git object database монтируется только для чтения; рабочие файлы находятся на отдельном временном volume, который удаляется после проверки. Runtime и PostgreSQL в `test:local-pilot` также работают в контейнерах; Node test driver обращается к ним с локального хоста. Это не проверка внешней сети или физических устройств. `--allow-dirty` допустим для разработки, но не для итогового source-bound доказательства.

В suite входит `test:catalog-r2`: schema всех 450 draft-карточек, свежий `draft-check` с обоими C2 capability-профилями и 14 проверок происхождения/истории. Полные coverage, input maps, результаты и raw stdout/stderr извлекаются из контейнера до удаления его рабочего volume. Это механическая проверка; она не меняет статусы карточек и не заменяет контентную приёмку. При самостоятельном запуске `test:catalog-r2` каждый прогон получает отдельный каталог `.artifacts/catalog-r2-*`.

## Проверяемые условия

1. При отсутствии явного профиля вход закрыт.
2. `VENUS_DEPLOYMENT_PROFILE=local-pilot` разрешает маркированный mock-документ только с точным HTTPS loopback origin.
3. Русский, английский и турецкий тексты связаны с текущими version/digest; они явно обозначены как тестовые.
4. Отказ от 18+, отказ от текущего mock-документа и устаревшая acceptance не создают комнату. Отдельные флажки в UI остаются выключенными до действий пользователя.
5. Явное принятие разрешает создание комнаты, session cookie сохраняет Secure/HttpOnly; рестарт API сохраняет комнату в PostgreSQL.
6. Возврат к `closed` закрывает admission без удаления комнаты.
7. API остаётся nonroot/read-only, не получает Docker socket.
8. Ошибка проверки или cleanup сохраняет FAIL; исходная ошибка и результат очистки учитываются раздельно.

## Границы текущей реализации

`infra/venus/compose.local-pilot.yml` — локальный override к основному Compose, с TLS-фикстурой из `tests/fixtures`. Этот сертификат и его публично известный тестовый ключ не используются для будущего домена. Cloudflare, DNS `venus.shmoza.net` и certbot пока не настраиваются.

Mock legal допускается прямым решением владельца для теста с друзьями. Данный профиль не утверждает готовность публичной оферты. Подтверждение 18+, приватность, отзыв согласия и ACL продолжают действовать.

Reviewed registry по-прежнему пуст. Исправленный карточный набор остаётся draft до собственной контентной приёмки; эти тесты не включают непроверенные карточки в Games. Встроенный updater, backup export, единый медиасервер, Cinema и оба вида Calls требуют следующих реализаций и отдельных гейтов. Hermes используется как source reference; отдельная P2P-ветка для пары не создаётся.

## Доказательства и история

Каждый запуск создаёт новый `.artifacts/local-pilot/venus-pilot-*/` с actual report, source inventories before/after, build и безопасными logs. Финальный прогон требует clean source и неизменных included bytes. Производные versioned evidence сохраняются в `.docs/implementation/evidence/standalone/`; прежние неудачные попытки и независимые findings не перезаписываются.

[Журнал оркестратора](../.history/2026-10-19-orchestrator.md), журналы агентов — в `.history/agents/`.
