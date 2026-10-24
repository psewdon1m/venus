# ADR-032 — подтверждённый владельцем сервисный signing key P06

Дата владельца: 2026-10-25, Europe/Istanbul. Статус: OWNER_AUTHORIZED; настройка signing environment и настоящий release проверяются отдельно. Scope: P06 standalone-local-pilot-v2; P07 не начат.

Владелец ответил «Подтверждаю ключ и GitHub secret (рекомендую)» на запрос с точным public key_id `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb`, репозиторием `psewdon1m/venus`, GitHub Environment `venus-release` и secret `VENUS_RELEASE_PRIVATE_KEY`. Решение зарегистрировано как U-020 в [user-decisions.v5.json](../implementation/user-decisions.v5.json).

Активируется только этот public trust anchor; новый ключ не создаётся. Существующая приватная часть остаётся вне Git/images/логов и передаётся только в согласованный GitHub environment secret с шифрованием LibSodium sealed box. Выводы и журналы содержат только public identity, HTTP exit/status и secret metadata, никогда значение секрета или credential.

Environment ограничивается service-qualified tags `venus-v*`; подписание выполняется после exact main/tag/source, обязательных тестов и двух независимых source-bound pre-sign reviews. Первый сервисный выпуск — immutable `venus-v0.0.1`, local-pilot prerelease без production latest alias. Возможное approval protected environment исполняется от имени владельца только в пределах подтверждённого выпуска. Настройка environment, upload, фактическое подписание, опубликованные assets и anonymous verification имеют собственные наблюдаемые receipts; это решение не объявляет их успешными заранее.

Совместимость: app/API/DB/operator protocol и одобренные данные P05 не меняются. Изменение public trust/решений меняет source identity: pre-sign packet core `fe51759f0c5c3c605b260c14121ae60ed12e7999783b9dcc1c6aa3a2ea8f876d` остаётся историческим, новые точные байты требуют отдельного rebind и независимой проверки. Broad P05 corpus не повторяется без связанного изменения приложения.

Откат: запретить новые signing jobs и убрать environment secret при отзыве владельцем; оформить следующую trust revision. Не переписывать опубликованные immutable tags/assets и исторические proofs, не выдавать отзыв ключа за автоматический откат уже установленного image. При recovery сохраняются новые protected deletion/withdrawal ledgers и совместимость image/schema/config. Production deployment, домен/TLS и P07 этим решением не разрешаются.
