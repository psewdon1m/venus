# P05: остановленный полный browser preflight

Попытка `2c64dc28f68f` FAIL; source unchanged, cleanup completed. Chromium: 10 scenarios PASS. Firefox: первые 2 scenarios PASS, локализованный сценарий FAIL при ожидании TR prompt. Всего 136 layout и 17 native checks; WebKit NOT_RUN.

Исходная HTTP/UI диагностика трёх участников фиксирует один session/round, game_rev8, current_round.state=skipped и kind=generic; приложение без pageerrors/overflow. Сервер прекратил выдачу текста, а не потерял его локализованный DOM при сохранённом доступе. Определить конкретную причину перехода по этим полям недостаточно. До active matrix код принимает quiet invitation, но не принимает созданный pending action: это конкретный пропуск подготовки сценария, требующий исправления через настоящий consent flow. Таймеры и случайный выбор карточки не отменяются.

Отдельный независимый browser-round-01 воспроизвёл дефекты самого reporter/scope/probe cleanup; они исправляются отдельным циклом. Все raw outputs здесь сохранены без переписывания. Отчёт попытки не доказывает полный EXIT-P05 или reviewed450.
