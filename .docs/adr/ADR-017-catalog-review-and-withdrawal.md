# ADR-017 · Контент, человеческий review и отзыв

Статус: DECIDED_FOR_IMPLEMENTATION; проверяется независимыми агентами P04. Дата:2026-10-19. Основание: план§8, документ09, CARD-1/RE-1. Не изменяет immutable P00 contracts/ADRs и не подтверждает контентные права.

## Решение

Авторинг выполняется ограниченными batch requests. Отдельный SQLite ledger сохраняет canonical request constraints, базовый digest, исходный request SHA, автора, reserved IDs и последовательность immutable revisions. BEGIN IMMEDIATE и synchronous FULL исключают частичные batch и конкурирующие reservations. Retry того же batch/input не создаёт ID/events заново; конфликт требует нового batch/revision. Экспорт hash-chain сохраняется как evidence; SQLite рабочая БД в .artifacts не является единственным передаваемым evidence.

Сначала production FrozenPack проверяет draft schema, semantics, roles, render budgets и policy identity. Дополнительный анализ отвергает exact duplicates по RU/EN/TR, всем режимам и каждой отдельной стороне TD; responder boilerplate исключён. Jaccard>=.78 создает review queue. Это предложенный некалиброванный порог, не семантический классификатор: человеческая оценка всего каталога, перефразов и размеченная калибровка остаются обязательными. Category share>20% блокирует builder до отдельного ADR; само по себе изменение metadata ради статистики недопустимо.

Независимые компетентные люди проверяют exact draft hashes, весь catalog digest, editorial/safety/rights/RU/EN/TR/similarity/diversity; для романтики/physical требуется qualified safety. Реестр public keys имеет операторское доказательство личности и компетенций. Подписанный Ed25519 record удостоверяет зарегистрированный ключ, а не человековость/языковую компетентность/правовую достоверность: эти факты устанавливаются внешне. Агент не создаёт реальные approvals и не подписывает их от имени человека. Тестовые ключи/люди/карточки изолированы, их записи не поступают в production. Любая правка metadata/текста меняет hash и аннулирует прежний review. Минимум100reviewed/mode не ослабляется.

Первый60card neutral pilot — review material, не выпуск. Остальные карточки требуют самостоятельных идей и review; count не добирается перестановками имен или template filler. Образцы12 и P03syntheticpack не повышаются до reviewed. Production provider закрыт до настоящего approved application bundle.

## Runtime и восстановление

Новый отдельный additive catalogue migration stream не меняет core001/game001. Active pointer изменяется CAS по generation, только между pack digests из immutable application bundle. Existing safe games сохраняют pinned revisions. Никакого consumer operator endpoint, сетевого JSON update или произвольного shell.

Глобальный PostgreSQL shared catalogue fence746826405 берется первым во всех Rooms transactions. Trusted activate/reconcile/withdraw берет exclusive fence; затем sorted room locks, затем audit/outbox locks. HTTP private delivery и оба WS text channels выполняют final committed-state check; публичный WS также реконструирует свежий view и синхронно enqueue под fence. Старый socketState projection не разрешает отправку после отзыва.

Metadata-only withdrawal ledger живёт на защищенном внешнем volume, исключенном из DB backup/restore. Оператор явно provision-ит пустой ledger один раз: missing/corrupt/truncated file не интерпретируется как отсутствие отзывов. Fsynced intent записывается до DB commit. При сбое DB serving блокируется до reconciliation. Reconciliation повторяет intents, отзывает содержащие revision packs, атомарно обнуляет опасный pointer и abort-ит все затронутые активные/paused games. Clears сохраняют монотонные per-member stream revisions и старых recipients; текст/условия не подменяются. Старый DB backup не отменяет внешний ledger. Оператор обязан сохранять актуальный volume; одновременная утрата/откат DB и внешнего ledger не решается одним hash chain и блокирует безопасное восстановление.

Совместимый pointer rollback сохраняет безопасные pinned sessions; revoked target запрещён. Откат image на P03 требует остановки процессов, quiesce активных игр и сохранения актуального withdrawal/deletion ledger; старый image не поддерживает новую catalogue fence и не должен обслуживать её активные игры. Ни pointer rollback, ни старый image не отменяют факт инцидента.

## Проверка

Unit negatives: JSON/Unicode/duplicates/roles, подпись/независимость/полнота и устаревание review, batch idempotence/conflicts/distributions, durable corrupt/missing ledger, actual planner shortage. Интеграционно: real PG migrations/CAS, HTTPS availability/ACL/Start, pointer rollback+pinned revision, cached public WS dispatch race, bilateral private clears, deferred COMMIT fault, полный pg_dump/pg_restore с unsafe active session и внешним более новым ledger. Исторические P01/P02/P03 gates проверяются на original accepted Git bytes, текущий P04 — на отдельной source identity.
