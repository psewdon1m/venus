# P05: исправления окна согласия и WS polling

Автор: root. Код и авторские проверки завершены; независимая приёмка и фактическая регрессия ещё не получены.

Private action offer теперь создаётся после двустороннего принятия темы и раскрытия задания. Pending TTL остаётся 30 секунд и ограничен прежним invitation deadline; чтения/повторы не обновляют уже созданное предложение. Public timing, два отдельных action accept, история, RNG и snapshots сохраняются. P05-TG-06 проверит реальный путь после 29 секунд согласования темы и принятие действия через ещё 5 секунд.

В обычном WS на сокет остаётся максимум один запланированный/исполняемый poll. Лишние тики объединяются; актуальный cursor читается при исполнении. Heartbeat и delivery остаются в прежней последовательной цепочке, все финальные fences и fail-closed storage errors сохранены. Истинный production handler с service doubles воспроизводил очередь poll:1…7 перед heartbeat, после правки — poll:1,poll:2,heartbeat. Это не PostgreSQL proof.

Red, ошибочные fixture/lint попытки и исправления сохранены. Focused 149 PASS. Полный host запуск на финальных байтах дал 853 PASS/1 FAIL/208 platform SKIP: root не добавил Python в PATH. Единственный упавший тест отдельно повторён с правильным окружением: PASS. Не называем исходную команду успешной. Lint/typecheck финально exit0.

Исторический actual18 остаётся 7 PASS/08 FAIL/8 NOT_RUN. Его единственная причина не установлена. Установленные source defects не доказывают наблюдавшуюся цепь pause/stop; pongs незадолго до паузы не подтверждают фактический 45-секундный timeout. Новый image byte-bound к source 4ebcc5/1823; actual Games20 выполняется отдельно, browser/layout ещё не запущены.

Schema, wire, ROOM-TOPIC-2, public/private authorization и clocks не менялись. Предыдущий настоящий b244 image совместим по формату, но содержит известные два P2; fallback требует quiesce и запрета новых private starts. Human HOLD сохраняется, P04/P05 не объявлены PASS.
