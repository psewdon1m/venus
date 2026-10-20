# P05: локальные браузерные проверки

`node tools/p05-browser.mjs` собирает тестовый образ из текущих исходников и запускает PostgreSQL, реальный API Rooms/Games и собранный frontend в локальной Docker-инфраструктуре. HTTPS и WebSocket проходят через локальный TLS edge с открытой тестовой парой ключей из `tests/fixtures`; это не сертификат production. Внешние порты отсутствуют. Сеть Compose — internal; контейнеры не имеют Docker socket. Браузер/API работают как UID 1000, с read-only rootfs, без capabilities, с отдельными временными файловыми системами и ограничениями CPU/RAM.

Команды:

```text
node tools/p05-browser.mjs --probe
node tools/p05-browser.mjs
node tools/p05-browser.mjs --chat
node tools/p05-browser.mjs --catalog
node tools/p05-browser.mjs --self-actions
npm run test:p05:reporter
```

По умолчанию требуется чистый checkout. `--allow-dirty` разрешён для разработки и явно маркируется `preflight_only`; смена включённых исходников во время запуска всё равно даёт FAIL. `--engine=chromium`, `--engine=firefox` или `--engine=webkit` ограничивает диагностический запуск одним движком. `--case=P05-STALE-READ-AFTER-NEW-PREPARE` или другой точный ID запускает один сценарий; `selected_case` и `full_browser_matrix:false` сохраняются в receipt. Такие запуски не доказывают полную матрицу.

Каждая попытка создаёт собственный `.artifacts/p05/venus-p05-<random>/` с build/test/cleanup logs, точными inventories до/после, SHA checkout, ID образа, `runner.json`, `browser-report.json` и PNG. Ошибки и предыдущие попытки не перезаписываются. Ошибка cleanup или изменение исходников запрещает PASS. Итоговый чистый запуск выполняется после окончания всех параллельных записей; manifest обновляет оркестратор.

Host wrapper явно задаёт `P05_ENGINE=all` и пустой `P05_CASE`, если CLI не ограничивает запуск: случайные значения окружения не сужают заявленный scope. Перед PASS проверяются точные движки и IDs сценариев, уникальное полное покрытие ожидаемых layout/native клеток, фактические viewport/DPR/reset, toolchain и cleanup. Формальная корректность отчёта не заменяет реальный запуск. `--probe` также имеет уникальное имя контейнера и project/role labels; после любого результата wrapper проверяет наличие и удаляет только контейнер с подтверждёнными именем и labels. Неопределённость inspect или отказ удаления дают cleanup FAIL.

`test:p05:reporter` входит в обычный `quality`. Это отдельные негативные проверки репортера, включая запуск настоящего host wrapper в дочернем Node-процессе с явно подменённой только границей внешних команд. Проверяются отказы при суженном/неполном inner report, наследовании selector, pageerror и неопределённой/чужой/неудачной уборке после simulated probe timeout. Эти control artifacts помечены `isolated_control_only`/`no_docker_executed`; они не считаются браузерным или Docker доказательством. Реальный Docker browser прогон обязателен отдельно.

## Изоляция контента

`tests/p05/server.mjs` — отдельная тестовая точка входа, которая создаёт synthetic FrozenPack через `tests/p05/fixtures.mjs` и передаёт его непосредственно в Games с явным `allowSynthetic`. Основу составляют прежние машинные fixtures; P05 добавляет 25 необязательных нейтральных in-person private карточек на режим с новыми IDs 5001–5025, без chat capability, физического контакта или ухода. Это исправляет покрытие тестовых in-person сценариев, сохраняя исходные P03/P04 fixtures неизменными. Factory не читает новые 450 карточек и не меняет production approved registry. Тестовый контент помечен `SYNTHETIC` во всех трёх локалях. Отсутствие одобрения human review450 остаётся самостоятельной границей P04. Пройденный fixture E2E не подтверждает принятие изменённых карточек или готовность публичного каталога.

Для точного продвижения сценария тестовый драйвер может читать/decrypt план текущего раунда через локальный PostgreSQL. Это инструмент теста, а не HTTP backdoor или production env injector. Пользовательские проверки затем выполняются через реальный UI и авторизованные HTTPS/WS пути. Все имена и сообщения искусственные; скриншоты не содержат реальные приватные данные.

## Матрица и границы доказательств

Основная матрица — Chromium, Firefox, WebKit Linux × RU/EN/TR × entry/lobby/active × 320×568, 375×667, 768×768, 1024×768, 1440×900, 1920×1080, 667×375 и 320×568 с CSSOM zoom=2: 216 клеток. До CSS увеличения каждая клетка проверяет фактические `innerWidth`/`innerHeight` против запрошенных размеров, DPR=1 и CSS zoom=1. Для каждой проверяются горизонтальное переполнение, клавиатурный фокус и reduced-motion, сохраняется PNG. CSS zoom=2 проверяет увеличение layout в движке; **это не native browser chrome zoom**.

Отдельные 27 native zoom проверок используют headed браузеры внутри Xvfb и X11 keyboard input через xdotool, без установки в пользовательскую ОС. Для **каждой** проверки запускается отдельный browser process/profile: одних отдельных контекстов недостаточно, поскольку в Firefox обнаружено наследование origin zoom между окнами. Новый контекст с `viewport:null` получает настоящие клавиши Ctrl+plus; измеряются `innerWidth`, `outerWidth`, `devicePixelRatio`, CSS zoom=1 и реальное уменьшение CSS viewport при росте DPR минимум вдвое. Перед закрытием проверяются Ctrl+0 и возврат DPR=1, затем неизменность viewport/DPR основного окна. Для WebKit встроенная ступень может дать 207.36% вместо ровно 200%; отчёт хранит фактическое значение и маркирует покрытие `OBSERVED_NATIVE_GE_200`, не подменяя его значением 200. PNG снимаются через ffmpeg непосредственно с физического прямоугольника X11 окна, включая browser chrome; сохраняются точные physical/CSS dimensions и два вида — начало страницы и доступный keyboard control. Это устраняет обнаруженное обрезание Playwright native-zoom screenshot. До успешного выполнения эта часть остаётся `NOT_RUN`. Движки WebKit Linux не являются Safari на iOS/macOS. Реальные телефоны не проверены.

Native lobby/active probes создают собственную реальную комнату с двумя новыми browser identities, а active — собственную случайно выбранную игру и все требуемые согласия. Cookie/session основного участника не копируется: второй WS с той же identity корректно заменяет socket generation и вмешивался бы в проверяемую игру. Native процесс не подключает дополнительных наблюдателей в основную комнату, не блокирует WS и не меняет время. В отчёте сохраняются разные native/main room/session/card и неизменное состояние основной игры до/после probe. Одна карточка RU/EN/TR доказывается основной матрицей; независимые native сцены не заявляются той же session/card.

Основные resize/evaluate/screenshot/native/cleanup операции имеют ограничение времени и START/PASS/FAIL trace в `browser-tests.txt` и `browser-report.steps`. При зависании закрытия browser process завершается только принадлежащий попытке процесс, а cleanup остаётся FAIL. Для keyboard traversal проверяется принадлежность X11 focus нужному окну. Перед Tab выполняется обычный click по неинтерактивному `h1`, чтобы установить webcontent focus после закрытия другого процесса; target не получает программный focus или click. В отчёте сохраняются фактические события Tab, число шагов и диагностический focus.

X11 inventory не считает любой exit 1 пустым списком окон: отсутствие результатов требует пустых stdout/stderr. Обнаруженный transient `BadWindow` при `X_QueryTree` повторяется максимум пять раз с интервалом 50 мс; ошибки сохраняются в diagnostics, а прочие или исчерпанные ошибки прекращают попытку. После успешной инвентаризации по-прежнему требуется ровно одно новое окно для каждой main/native страницы. Эти проверки входят в reporter suite отдельно от реального capacity сценария.

Для страниц приложения отдельно записываются bounded `pageerror` события с name/message/stack и фазой: максимум 128 событий и явный overflow flag. Любая такая ошибка или overflow окончательно запрещают PASS после cleanup, сохраняя diagnostics; Firefox stderr сам по себе не подменяется app pageerror. Во время активной матрицы сохраняется фактическое HTTP/UI состояние перед каждой локалью, а при ошибке — дополнительные diagnostics/PNG. Случайный выбор карточки и реальные 30/180-секундные сроки согласий сохраняются. Для выбранной парной карточки тест принимает требуемое invitation и action согласие обоими участниками до длительной active матрицы; interaction, requires_action_consent и состояния до/после записываются. Прежний missing prompt имеет фактический skipped/generic round в full preflight; точная причина истечения пока не подтверждена audit свидетельством.

| Исходный сценарий §8 | Активная часть P05 | Наблюдаемая проверка harness | Отложенная часть |
|---|---|---|---|
| 1 | Вместимость и идентичность | 8 отдельных контекстов, девятый отказ, duplicate-tab без нового member, одинаковые имена с разными IDs | Нет |
| 2 | Комната/context/local preferences | Реальные комнаты и собственные настройки; UI не выдаёт музыку за доступную | Music output и восемь телефонов: DEFERRED_OWNER |
| 3 | Одна карточка RU/EN/TR | Общий card_id, локализованный synthetic prompt каждого browser context | Human acceptance реальных карточек: P04 |
| 4 | Личные отношения/добровольная пара | A→B crush, B→A friendship; два отдельных согласия, host observer без invitation/chat/edge | Реальные устройства: DEFERRED_OWNER |
| 5 | Snapshot настроек | Disabled comfort во время active; после completed прежнее значение доступно | Нет |
| 6 | not_a_friend | Questions/TD без запрещённой пары; pair-only YB безопасно недоступен | Нет |
| 7 | Сохранность Games | Реальный reconnect/restart сохраняет session/card и серверную ревизию | Cinema capture/music: P09/DEFERRED_OWNER |
| 8 | Честные состояния недоступных медиа | Нет обещания audible/live в fixture играх | iOS/Android autoplay: DEFERRED_OWNER |
| 9 | Keyboard/reflow/reduced motion | 216 layout клеток и 27 отдельных measured native zoom≥200% проверок, доступность game controls | Реальные телефоны: DEFERRED_OWNER |
| 10 | HTTP 502/обрыв WS | Fault edge, connection banner, восстановление фактической session/card после API restart | Production network: не проверен |

Этот документ описывает покрытие и ограничения. Фактические PASS/FAIL берутся из отчёта конкретной попытки; наличие сценария в исходнике теста не является результатом его выполнения.

## Self-actions: отдельная компонентная проверка

`--self-actions` запускает только `tests/p05-self-actions/integration.mjs` через Node test runner в том же изолированном Docker-профиле. `npm run test:p05:self-actions` — соответствующий alias. Эта проверка не является полной браузерной матрицей: receipt содержит `self_actions_only:true` и `full_browser_matrix:false`. Другие режимы и browser selectors одновременно с ней запрещены.

Кроме успешного exit процесса обязателен `self-actions-report.json`: schema1, suite `P05_SELF_ACTIONS`, synthetic fixture scope, PASS, завершённый runtime cleanup и непустой список уникальных фактически выполненных `P05-SA-*` проверок с PASS. Отсутствующий/пустой/неуспешный отчёт закрывает приёмку. Отчёт не подменяет независимую оценку достаточности набора сценариев; HTTP/PG результат не называется browser UI proof. Caller/receipt контроли выполняются с явно подменёнными внешними командами в отдельном `.artifacts/p05-reporter-controls/`, без утверждения Docker execution.

## Toolchain

Dockerfile закрепляет Node 24.22.0 по digest, package-lock закрепляет Playwright 1.64.1, npm 11.19.1. Браузеры устанавливаются Playwright CLI этой версии внутри Docker, не в пользовательскую ОС. Фактические browser versions сохраняются probe/report. Версии системных библиотек определяются сборкой образа; для проверки используется его точный локальный sha256 ID, без заявления о побитовой воспроизводимости apt mirror.

Подход установки и Linux ограничения сверены с [официальной документацией Playwright Docker](https://playwright.dev/docs/docker). Публичный Docker image иной версии не используется для подмены browser revisions из установленного package-lock.

Для native keyboard input используется [xdotool/X11 XTEST](https://github.com/jordansissel/xdotool); renderer shortcut без изменения реальных viewport/DPR не считается native zoom. Неудачные capability experiments сохранены рядом с последующими попытками. Режим `--chat` запускает самостоятельные реальные PostgreSQL/HTTPS проверки приватного чата; `--catalog` — PostgreSQL/filesystem проверки Catalog/Rooms/Games, без утверждения браузерного или HTTP покрытия для этого режима.
