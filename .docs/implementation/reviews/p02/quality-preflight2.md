# P02 · QA/evidence · предварительная перепроверка 2

Reviewer: `/root/p02_quality_review`. Результат: **FAIL**. Source SHA: `b964ab231972dfd44185c90c21ae283eca2866fd`. Source identity: `6c02c3d68757bc8d64c809b2c1db514befa6c1a9190c893416fa1e14fcfe73c1`. Дерево изменяемое; это не итоговая подпись кандидата.

QA-P02-01…03: просмотренные правки добавляют exact previous OCI из accepted Git archive с чтением upgraded schema и сохранением scoped rows; restore сравнивает две открытые identities/шифртексты/revisions/session hashes и nondefault private values, отдельно применяет revocation; WS проверяет чужую cookie/ticket, чужой room и отсутствие room-session. Закрытие по исходникам принято, фактический новый прогон выполняется root и подлежит сверке после freeze.

QA-P02-04 закрыто частично: boundary assertions добавлены, но guest в тесте отсутствует. Не доказано отсутствие promotion независимого участника.

QA-P02-05: воспроизводимый ложный PASS в `tools/stage_gate.py`. Самостоятельная адресная проверка использует существующую `P02EvidenceTests.fixture()`: baseline `verify(root, report) == []`; замена reviewer narrative на `# FAIL\n\nOpen findings: blocker unresolved\n` с обновлением SHA256 в review JSON и его descriptor при сохранении machine status PASS также даёт `[]`. Это расходится с требованием принимать согласованные отчёты независимых агентов. Требуется структурная metadata в narrative, сверенная с JSON по status/source/reviewer/scopes, и отрицательные fixtures contradictory FAIL/foreign source/другой reviewer.

Файлы реализации не изменялись. Полный Docker/browser повтор здесь не запускался, адресный validator fixture выполнен фактически.
