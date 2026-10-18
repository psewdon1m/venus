# P02 · Независимая проверка QA/evidence · round 1

Reviewer: `/root/p02_quality_review`. Дата: 2026-10-18. Результат: **FAIL**, 4 открытых замечания.

Проверенная база Git: `b964ab231972dfd44185c90c21ae283eca2866fd`. Рабочее дерево изменяемое, поэтому это предварительная проверка текущих исходников; PASS на финальный commit не выдан. Identity на момент записи: `42eef954bca8ee25655412158e149d6097e400da3906f3b0b437fa8582d96ca1`.

Прочитаны полный P02 integration suite, tests/p02 runtime/harness, runner, container smoke, migrations, backup/security, client revision tests, EXIT-P02 и entry review. Увиденный preflight artifact сообщает 18 proof checks, source_dirty=true. Самостоятельный повтор полного Docker прогона в этом раунде не запускался: root выполняет контейнерные проверки; вывод основан на исполняемых assertions, а не на принятии их PASS за достаточное покрытие.

## QA-P02-01 · P1 · Нет проверки upgrade/обратной совместимости предыдущего image

`apps/api/src/p02.integration.test.ts:56`. Миграция проверяется повторным migrate на уже подготовленной generation1. В container smoke запускается только кандидат. Не выполнено условие возврата P02: предыдущий image на совместимой upgraded схеме; отсутствует доказательство перехода generation0→1 с последующим чтением данных прежним image.

Закрытие: В disposable PostgreSQL выполнить P01→P02 migration, сохранить синтетические данные, запустить exact принятый P01 image против upgraded БД и снова P02; сравнить identity/row scope, не теряя реальные room/preferences. Отдельно отказ unsupported/checksum mutation до commit.

## QA-P02-02 · P1 · Restore drill не сравнивает восстановленные identity/preferences/row scope

`apps/api/src/p02.integration.test.ts:154`. Перед pg_dump создаётся комната только с defaults. После restore проверяется лишь запрет доступа закрытого room и удаление private_preferences этого room. Тест остаётся зелёным, если все остальные восстановленные комнаты или encrypted preferences потеряны; обязательный compare identity/row scope отсутствует.

Закрытие: Создать независимую открытую комнату с двумя identities и nondefault encrypted preferences, зафиксировать row scope/identity/revisions до backup, после restore и restart сравнить собственные настройки и identities/row scope для неё, а closed room отдельно остаётся revoked; проверить ключи/.env отсутствуют в dump.

## QA-P02-03 · P1 · Нет negative WS ACL с независимыми identities/unauthorized client

`apps/api/src/p02.integration.test.ts:117`. Существующие WS assertions проверяют собственный ticket replay/expiry, duplicate socket и bad Origin. HTTP проверяет independent identities, но на WS нет чужого room, guest cookie+host ticket и отсутствующей cookie. Это не закрывает EXIT-P02.3 и заявленный реестром two identities+attacker HTTP/WS.

Закрытие: Использовать два клиента+unauthorized connection: чужой ticket со своей cookie, ticket комнаты A на room B, valid ticket без cookie; убедиться, что до/после отказа нет room snapshot/private frames. Свой ticket после отвергнутой foreign попытки должен оставаться корректным согласно atomic consume contract.

## QA-P02-04 · P2 · Boundary проверки lifecycle не подтверждают принятые presence/reservation/grace

`apps/api/src/p02.integration.test.ts:126`. Проверены reconnect после45s, reservation+1 и hostGrace+1. Не проверены границы presence45s/reservation90s до и на deadline, состояние presence после hostGrace и отсутствие promotion независимого guest. Entry-review ENTRY-03 требует timestamp и deadline±1ms.

Закрытие: Добавить реальные PG/HTTP/WS assertions непосредственно перед и на deadline presence/reservation, hostGrace со вторым member; room остаётся open, host сохраняется и guest не повышается.

## Что уже подтверждается assertions

100 реальных SQL admission races с ровно 8 identities; cookie flags; own-only preferences и GCM AAD; process restart; ticket replay/expiry; host powers; idempotent body conflict/stale revision; terminal close; idle/primary delete; locale create/join/reload и XSS escaping; full/closed/offline retry. Unit reducer проверяет delayed/duplicate/foreign-room snapshots. Synthetic offer явно отделён от production fail-closed policy. Эти проверки полезны, но не закрывают четыре указанных обязательных пробела.
