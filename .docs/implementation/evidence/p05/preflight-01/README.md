# P05 · Сохранённые промежуточные попытки

Это **dirty-source preflight**, не clean-source или полный EXIT-P05. [Индекс](index.json) фиксирует исходную директорию попытки, фактический outcome, exact image, source inventories, размер и SHA256 каждого сохранённого файла. Первоначальные `.artifacts/` файлы скопированы без исправления содержимого; новые результаты не заменяют прежние FAIL.

| Попытка | Фактический результат | Что она показывает |
|---|---|---|
| [catalog-first-fail](catalog-first-fail/catalog-tests.txt) | 6/7 | Ошибка ожидания теста: aborted dispatch возвращает clear-only состояние. Это не повод требовать выдачу старого prompt |
| [catalog-eight-pass](catalog-eight-pass/catalog-integration.json) | 8/8 PASS | Реальные PostgreSQL/filesystem safety/withdraw/reconcile и отдельный внутренний HTTP idempotency replay |
| [restore-channel-fail](restore-channel-fail/chat-tests.txt) | 17/19, два FAIL | B05-004: после SQL restore старый private prompt возвращается без рабочего chat grant |
| [chat-nineteen-pass](chat-nineteen-pass/chat-integration.json) | 19/19 PASS | Исправление B05-004, прежние chat cases и два quiet-public HTTP/WS сценария с восемью участниками |
| [browser-initial-prepare-fail](browser-initial-prepare-fail/browser-report.json) | FAIL | Диагностика подтверждает initial-A-prepare freshness conflict, а не предполагаемый overwrite новой B-сессии |
| [browser-stale-read-pass](browser-stale-read-pass/browser-report.json) | 1 Chromium case PASS | Подготовка A, завершение A, удержанный настоящий HTTP ответ A, подготовка и ручной Start B после отпускания A |
| [browser-expired-retry-pass](browser-expired-retry-pass/browser-report.json) | 1 Chromium case PASS | Неудачный POST и expiry удаляют retry; старый приватный текст повторно не отправлен |
| [browser-firefox-keyboard-fail](browser-firefox-keyboard-fail/browser-report.json) | FAIL | Ранний полный запуск остановился на Firefox keyboard navigation; WebKit в той попытке не выполнялся |
| [browser-native-capture-corrected](browser-native-capture-corrected/browser-report.json) | Chromium layout/native часть PASS, runner source-changed FAIL | Настоящий native zoom наблюдался; полноразмерные X11 captures заменили ошибочный способ обрезанного Playwright screenshot. Старые попытки не переписаны |

Количество групп, matrix cells и источники каждой попытки читаются из её собственного JSON. Эти разные исходники нельзя объединять в один вымышленный общий PASS. Отдельные сохранённые PNG показывают только указанные случаи; все снимки каждого промежуточного запуска здесь не упакованы. Полная новая матрица и последующая clean-source проверка имеют самостоятельные результаты.

Bounded WS capture в quiet-public cases доказывает отсутствие card/text/pair/refusal fields в соответствующих фактических outsider frames при проверенной полноте буфера. После двух согласий показ разрешён; после отзыва проверяются новые проекции. Уже полученное сообщение невозможно «стереть» у адресата этим тестом. Browser route hold задерживает ответ после серверной отправки и проверяет client generation; server dispatch fence требует отдельных серверных проверок.

Human HOLD450, topic/advice/semantic implementation и полный P05 остаются открытыми. Mobile/Music отложены владельцем; media не реализованы этим компонентом. Исходные независимые раунды сохраняются отдельно в `reviews/p05/`.
