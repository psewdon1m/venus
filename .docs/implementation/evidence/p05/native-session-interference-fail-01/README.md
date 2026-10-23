# P05: native probe вмешивался в исходную сессию

Полная попытка `2d1afb6069fd` FAIL: Chromium10 PASS, Firefox18+/capacity PASS, localized-game FAIL; 136 layout/17 native, WebKit NOT_RUN. Source unchanged и cleanup completed.

В отличие от прежних предположений, raw localized_setup подтверждает: оба action consent приняты и active. На TR phase сервер показывает paused/transport, round skipped/generic; позднее соединение вернулось, но прекращённый раунд не ожил. Отсутствующий pending action не является достаточным объяснением этого FAIL.

Root и автор прочитали nativeZoom и Rooms.connect/disconnect: копирование storageState переносит ту же room identity в native process. Новый WS увеличивает socket_generation того же участника и заменяет прежний grant; закрытие текущего native socket может установить reconnecting и безопасно прекратить парный раунд. Такую проверку нельзя считать пассивной копией страницы. Серверная защита не ослабляется.

Исправление стенда: отдельные настоящие комнаты и identity для native lobby/active probes, без копии исходной сессии, реальный consent flow и отдельный context evidence. Одинаковая карточка RU/EN/TR проверяется в исходной main matrix. Native probe должен дополнительно доказать сохранность исходной игры до/после. Старые попытки не получают задним числом точной причины при отсутствии их собственного server-state witness.
