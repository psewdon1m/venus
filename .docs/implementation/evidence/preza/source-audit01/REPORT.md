# Preza: source-only аудит для адаптации презентаций в Venus

Дата: 2026-10-24 UTC; рабочая дата проекта — 2026-10-25 Europe/Istanbul. Агент: preza_source_audit01.

Результат: **SOURCE_AUDIT_COMPLETE**, не stage PASS. Готовое PDF-поведение найдено в исходниках. Код источника не исполнялся; зависимости, сборки, тесты, контейнеры и просмотр PDF не запускались.

## Источник и границы

- Авторизованный владельцем источник: https://github.com/psewdon1m/preza.git.
- Exact HEAD: `aeca0de85a54ca8c30ff9c7143f9352fdddfdecf`; commit time `2026-10-11T18:22:57+03:00`; сообщение `Add project branding and signed updates from admin interface`.
- Новый detached checkout: `C:/.projects/venus/.artifacts/preza-source-audit01`, clean. git ls-remote, clone, checkout — native exit 0; hooks отключены через core.hooksPath=NUL.
- В tracked tree нет AGENTS.md, LICENSE/COPYING и lock-файлов. Это отсутствие текстов лицензии, не правовое заключение. Владелец явно авторизовал адаптацию своего проекта. При переносе сохранить source attribution, revision и список заимствованных файлов; бренд и пример PDF не требуются для функциональности.
- Venus root HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70` не описывает текущие незакоммиченные байты. Сравнение сделано по рабочим файлам, SHA-256 которых находятся в INPUTS.json. Root git index не менялся агентом.
- Записи ограничены новым source checkout, этим пакетом и собственным журналом. Приложение, план, контракты, manifest и чужие журналы не изменялись.

## Реально готовое поведение

Все ссылки закреплены на exact commit.

| Механизм | Что присутствует в исходниках | Источник |
|---|---|---|
| Формат | Только upload PDF: расширение .pdf, сигнатура %PDF- в первых 1024 байтах, проверка pdfinfo. Нет импорта PPTX/PPT/Keynote/ODP, URL или редактирования слайдов. Нечитаемые/зашифрованные PDF отвергаются. | [main.py:284](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/api/app/main.py#L284), [storage.py:131](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/api/app/storage.py#L131) |
| Конверсия | pdfinfo определяет число/размеры страниц; pdftoppm -png -r DPI создаёт статические PNG, переименуемые slide-1.png и далее. Один render_lock сериализует конверсии в процессе. | storage.py:131–154; main.py:299–307 |
| Лимиты | Default upload 256 MiB, до 500 страниц, DPI 300 (72–600), render timeout 300 s; pdfinfo timeout 30 s; до 40 млн пикселей на страницу; PNG суммарно до 512 MiB, проверка после рендера. Общей дисковой квоты библиотеки нет. | main.py:110,122,285–311; storage.py:132–152 |
| Библиотека | Несколько презентаций; название, slug, поиск в UI, создание/настройки/замена PDF/удаление. Public-каталога нет; страница /p/slug. | [admin.js:163](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/web/admin.js#L163); main.py:247–249,319–402 |
| Просмотр | Вертикальная непрерывная лента либо отдельные слайды с сохранением пропорций, стрелки/кнопки/счётчик; автор задаёт начальный режим и разрешение переключения. Выбор зрителя хранится в sessionStorage. | [view.js:42](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/web/view.js#L42) |
| Ведущий | Автор в preview запускает/завершает live и меняет страницу. В live зрители не переключают страницу/режим. Сервер PNG также отклоняет другой текущий слайд (409), а не только скрывает кнопки. | admin.js:252–289,381–389; main.py:404–412,442–448; view.js:70–109 |
| Синхронизация | SSE отправляет полное текущее state при подключении и при новой revision; heartbeat до 10 s; EventSource reconnect + refresh/polling восстанавливают состояние. Клиент игнорирует меньшую revision. Это синхронизация состояния, не видеотранспорт. | main.py:454–477; view.js:42–43,111–167,215–217 |
| Замена/конкуренция | Staging до успешной конверсии сохраняет старый документ при ошибке. Новая content_version сбрасывает live/страницу, старые version URLs недействительны. Edit использует expected_revision, в том числе SQL compare-and-set; live-команда expected_revision не имеет. | main.py:349–412 |
| Хранение | SQLite WAL, presentations/settings; source.pdf и PNG под DATA_DIR/presentations/id/content_version; staging/неактивные версии очищаются при старте. Комнатных owner/member ACL и TTL нет. | [storage.py:12](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/api/app/storage.py#L12) |
| Доступ | Один глобальный admin Access Key; HMAC cookies 12 h; optional viewer password, PBKDF2 и access_version для отзыва. Origin/CSRF на admin mutations; password checks на metadata, PNG, SSE, повторная проверка внутри SSE. Без пароля любой знающий slug получает доступ. | [security.py](https://github.com/psewdon1m/preza/blob/aeca0de85a54ca8c30ff9c7143f9352fdddfdecf/api/app/security.py); main.py:146–215,415–477 |
| Анимации/видео/notes | Не реализованы. Viewer отображает только PNG: нет воспроизведения PDF-анимаций/видео/аудио, заметок докладчика, текста/ссылок PDF, laser pointer. | storage.py:131–154; view.js:86–108; storage schema:12–23 |

Тестовые исходники test_presentations.py, test_events.py и другие существуют, но здесь не запускались. README не является proof приёмки Venus.

## Стек и pins

Preza: Python 3.12 slim Bookworm, FastAPI **0.142.2**, python-multipart **0.0.32**, uvicorn[standard] **0.54.0**, SQLite stdlib, Poppler pdfinfo/pdftoppm, plain HTML/CSS/JS без npm build. Test-only pytest **9.1.1**, httpx **0.28.1**. Top-level Python packages имеют == pins; транзитивного lock/hash нет, python:3.12-slim-bookworm без digest, apt poppler-utils без версии. Прочитанные Actions закреплены SHA. Эти плавающие runtime/apt pins нельзя выдавать за уже воспроизводимые зависимости Venus.

Venus: Node **24.22.0**, npm **11.19.1**, TypeScript **6.0.3**, Fastify **5.12.7**, pg **8.23.1**, React/ReactDOM **19.3.1**, Vite **8.3.4**, package-lock; base Node image закреплён digest. Метаданные сравнения хешированы в INPUTS.json.

## Минимальная рекомендуемая адаптация

Это proposal будущей реализации, не новый принятый контракт и не независимая приёмка собственной реализации.

1. Сохранить готовое поведение Preza: import → staging → переиспользованный render_pdf/Poppler → атомарная версия, библиотека, два режима, ведущий и синхронная страница. Не писать новый PDF renderer и не обещать отсутствующие office/animation/video возможности.
2. Переиспользовать Python-конвертер как внутренний ограниченный worker на том же Docker-хосте. Venus API остаётся единственной публичной точкой metadata/PNG/auth; целая публичная Preza с собственными SQLite/admin/password/updater дублирует ненужные контуры. Сохранить attribution и exact source pin заимствованного кода.
3. Состояние комнаты и показа адаптировать к существующим Fastify/PG, React/i18n RU/EN/TR и room WebSocket/snapshot. SSE/HTML Preza — образец готового поведения, не требование второй realtime-сессии. Статическим PNG не нужен SFU будущих Cinema/Calls.
4. Для минимального объёма ведущий/редактор — текущий host комнаты, зрители — актуально допущенные участники комнаты. Отдельный presenter-role/передача прав являются явным расширением, если понадобятся. Upload/control/delete проходят origin/CSRF и host/member/room fences; клиентские ID/имена не превращаются в raw paths.
5. Каждая выдача PNG/state/realtime проходит текущие Venus session/member/18+ acceptance/revocation/open-room проверки. Room cookie scoped на /api/v1/rooms/id (для V2 также /api/v2/rooms/id); маршруты размещать под соответствующим prefix. Прямой iframe /p/slug и публичный Preza slide_base эти проверки обходят и не являются готовой интеграцией.
6. Room close/idle expiry прекращают показ и доступ; member revoke/leave — новые байты и события. Завершившаяся после retirement конверсия не публикует результат. UI очищается при смене комнаты/identity. Уже доставленные изображения нельзя отозвать из памяти зрителя задним числом.
7. Текущие Venus timers: idle 24 h, primary deletion 23 h после close (в пределах owner ≤24 h), backup 7 дней. Metadata/blob/staging презентаций включить в эти cleanup/backup/restore и deletion-ledger fences; вечную публичную библиотеку Preza не переносить. Новые data paths должны войти в P06 file-backup до финального P07 общего прогона.
8. Сохранить ограничения рендера и добавить общий room storage budget, ограничение конкуренции/процессов, scratch/CPU/memory limits. Конвертер без Docker socket/привилегий, pinned image, read-only root. Проверка 512 MiB после рендера не заменяет runtime дисковую квоту.
9. При неудачной замене сохранять рабочую версию, проверять monotonic presentation/room revision и version URLs. Feature-off прекращает новые операции/подписки. Приватный канал и принятые P05 карточки не изменять.

## Прицельные проверки будущего блока — не запускались

Только после внесения всех правок этапа: небольшой реальный PDF import/render/view; формат/лимиты; failed replacement сохраняет content; host start/next/stop, late join/reconnect; stale revision/version; два режима и RU/EN/TR UI; cross-room/member/host/18+/revoked/close запреты на metadata/upload/PNG/realtime; conversion-vs-close; TTL blob/staging cleanup; backup/restore с новыми данными и retirement fences. Без полного P03 статистического прогона и без нового общего тестового framework.

## Ограничения и передача

- Read access доступен без нового ключа владельца. Cookies, secret .env и private keys не читались/не копировались.
- Source audit не доказывает runtime/браузерный PASS, безопасность Poppler или production готовность. Входной гейт реализации ещё должен принять интеграционные границы и новую source revision.
- Несколько read-only rg попыток обращались к отсутствующим Venus paths src/server/room-store.ts/auth.ts/maintenance.ts; path-not-found исправлен переходом к реальным rooms.ts/room-routes.ts/server.ts/room-shell.tsx. Это не FAIL приложения/теста.
- Первая PowerShell попытка записать пакет завершилась ParserError/native 1 до исполнения: пакет не был создан этим вызовом. Попытка сохранена в журнале; отчёт/metadata затем записаны отдельно.
- После финальной записи журнала агент прекращает все записи (**STOP**). Derived manifest обновляет оркестратор после завершения параллельных писателей.
