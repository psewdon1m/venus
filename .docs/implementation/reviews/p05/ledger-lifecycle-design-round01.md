# P05 ledger lifecycle — независимый design gate, round 01

**DESIGN_OBLIGATIONS_OPEN.** Первоначальное proposal получило CHANGES_REQUESTED; последующие уточнения root устраняют неоднозначности направления, но обязательства ниже ещё не реализованы и не получают PASS. Направление «protocol2 только с рождения + отдельный ledger комнаты» пригодно и устраняет необходимость бессрочного глобального реестра персональных exclusions. Предложение пока недостаточно конкретно для безопасной реализации удаления и совместимого restore. Это проверка проекта решения, а не выполненная миграция, runtime-тест или отказ ранее принятого ограниченного ledger-компонента.

Reviewer не автор `PrivateTopicLedger`. Записи только в собственный журнал и excluded review. Входы с точными SHA-256: `ledger-lifecycle-design-round01.inputs.json`; HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70`, dirty worktree. Само proposal получено в сообщении root: V2-комнаты с рождения, одна PG-транзакция для room/birth marker, fs initialization + внешний descriptor до COMMIT, запрет upgrade legacy, close tombstone до удаления personal files за ≤23h, tombstones/backup ≤7d.

## Что в предложении обосновано

Если `rooms` и обязательный birth marker коммитятся одной транзакцией, согласованный PG backup содержит либо оба, либо ни одного. У честного restore отсутствует промежуточная «эта же V2 room, но ещё без marker». Это верно для обычного атомарного snapshot, не для ручного слияния таблиц/выборочного restore.

Публикация descriptor/chain/witness до COMMIT безопасна: rollback может оставить недоступные orphan files, но не подтверждённую комнату без safety state. После неизвестного исхода COMMIT нельзя считать транзакцию откатившейся. Проверка idempotency под тем же admission lock определяет, был ли commit; нельзя автоматически удалять её files.

Нормальное чтение/restore никогда не вызывает initialize. Все V2 paths проверяют обязательный marker и exact внешний descriptor/incarnation/pins; отсутствие любого элемента закрывает путь. Удалённая V2-комната не становится legacy даже после исчезновения tombstone. Это позволяет удалить персональное содержимое ledger, сохранив безопасное поведение старой DB-копии без вечного персонального реестра.

## Изменения, обязательные перед implementation

### LIFE001 — P1: авторитет закрытия перед разрушительным cleanup

Нельзя принять фразу «durable existing DeletionLedger first» буквально. Текущий `security.ts`:

- создаёт файл без fsync его parent directory;
- в `revoke` не проверяет короткую запись `writeSync`;
- хранит неаутентифицированные JSON lines, не защищает path/owner/modes/links и не имеет required/process floor;
- при `prune` делает file fsync + rename, но не fsync parent directory;
- не имеет crash-safe двухфазной связи между tombstone, DB close и удалением topic files.

Это не finding нового ledger, а непригодность старого примитива в качестве единственного доказательства, после которого разрешается необратимо удалять новый safety state. Не переписывать исторические accepted bytes/contracts, выдавая прежние доказательства за новые. Добавить отдельный versioned retirement authority/descriptor state machine с authenticated room/incarnation/closed-at, защищёнными файлами/locks, полной записью, file fsync, atomic publication, directory fsync и rollback fence. Старый DeletionLedger может остаться legacy input, но не единственным разрешением на unlink.

**Контрпример:** revoke возвращается после короткой записи или недолговечного rename; cleanup удаляет chain/witness/descriptor; crash/старый backup не имеет достоверного terminal proof. Строгий V2 missing-descriptor deny всё ещё спасает новые V2 reads, но утверждение о durable tombstone/безопасном legacy restore и успешном cleanup не доказано.

**Гейт:** Linux faults/actual child kills на каждом переходе live → retiring → retired и после каждого unlink; пока terminal authority не подтверждён, personal files не удаляются. При частичном cleanup терминальность сохраняется, повтор идемпотентен, ошибка не становится PASS.

### LIFE002 — P1: классификация и compatibility floor не должны исчезать с backup

Нужно точно зафиксировать, где живёт необратимый признак protocol2. Рекомендуется NOT NULL protocol/incarnation в `rooms` и обязательный связанный birth record с DB constraint/deferrable trigger; отсутствие linked marker у protocol2 — corruption, а не legacy. Исторические rooms остаются protocol1, conversion запрещён. Внешний descriptor дополнительно обнаруживает marker mismatch/downgrade. Не добавлять новое поле в старый strict wire response без нового contract revision.

Одна новая migration family недостаточна для отказа старому API: старый `server.ts` о ней не знает. Текущий core `migrate/schemaProbe` знает только generation1 и десять таблиц. Повышение core generation новым immutable additive migration может блокировать **холодный** запуск старой версии на новой БД. Оно не останавливает уже запущенный старый процесс, а restore старой generation1 БД убирает DB-only floor.

Нужен неперсональный floor совместимости вне DB rollback и конкретный P06 admission/deployment barrier: остановить старые API/WS workers до нового birth; launcher/updater не запускает неподдерживаемую версию; restore/rollback не служит до проверки floor, ledgers и текущих reader capabilities. `/health/ready` =503 сам по себе не запрещает текущие маршруты. При mixed/unsupported reader — quiesce/deny, не fallback. В штатной модели нет необходимости защищаться от администратора, намеренно запускающего произвольный старый бинарник в обход доверенного launcher; ограничение описать честно.

**Гейт:** actual old-image cold start on V2 DB; уже живой old worker во время upgrade; restore V1 DB при сохранённом внешнем floor; feature-off и legacy game/chat routes против V2 room. Ноль private bytes/legacy starts; безопасный выход/close остаётся доступным.

### LIFE003 — P1: orphan и retirement cleanup требуют сериализации с birth и delivery

DBabsence + bounded birth age недостаточны. Descriptor может уже существовать, а create transaction ещё быть uncommitted. Cleaner видит zero rows, удаляет files, затем create коммитит и отдаёт receipt. Возраст не доказывает отсутствие живой транзакции.

Birth и cleaner должны захватывать один advisory xact lock по room ID **до** публикации файлов, затем cleaner под ним повторно проверяет отсутствие DB row и exact descriptor/incarnation. При DB unavailable, lock busy, indeterminate COMMIT — не удалять. Cleanup не угадывает stale filesystem lock по возрасту. Unknown-commit idempotency replay проверяет protocol/descriptor перед receipt.

Retirement также сериализуется с mutations и delivery; terminal durable state становится видимым до unlink. Старый process-held dirfd/ledger instance после unlink не считается разрешением на доставку. Final HTTP/WS fence заново проверяет terminal descriptor/tombstone и room state под тем же room ordering; после await ещё раз проверяются время/epoch/scope. Старые idempotency receipts не возвращают cookie/private payload без актуального fence.

**Гейт:** create TX удерживается открытой дольше orphan age, cleaner стартует параллельно; неизвестный COMMIT; restart между descriptor fsync/COMMIT/receipt; открытый old fd и задержанный HTTP/WS enqueue во время retirement. Cleaner не создаёт broken committed room, поздняя доставка запрещена.

### LIFE004 — P2: membership withdrawal и персональная retention нуждаются в явной семантике

Текущий `leave` отзывает room sessions и удаляет собственные `private_preferences`; повторный анонимный join получает новый UUID. Предложенный append-only room ledger с общим Keyring не умеет удалить только departed member, сохранив readability остальных entries. В topic design одновременно написано «удаление person удаляет его rows».

Нужно выбрать и зафиксировать совместимую трактовку: DB topic preferences удаляются при leave, а минимальное зашифрованное exclusion evidence остаётся только до room close как safety anti-restore state, с явным перечнем полей/сроком; либо реализовать отдельную безопасную member-retirement/compaction конструкцию. Нельзя заявлять стирание всего личного state, если bytes ledger всё ещё дешифруются. Room retirement за ≤23h после close не является member deletion при продолжающейся комнате.

Restore до leave может оживить старый `room_sessions` token: current room-only deletion ledger не содержит member/session withdrawal. Cold private grants reset сам по себе не отзывает восстановленную auth session. Для соответствующего P06 withdrawal claim нужен независимый монотонный member/session withdrawal либо явная политика инвалидировать все восстановленные sessions с безопасным новым admission. Это отдельная задача от сохранения topic exclusions.

Exclusions относятся к `(room, member identity)`. Прежний member с тем же действующим session сохраняет exclusions; новый anonymous member начинает с пустого allow-set и новых явных opt-ins. Нельзя обещать перенос exclusions того же человека на новый UUID, не вводя отсутствующую identity-link систему. Host не может прочитать/сбросить чужие exclusions. Нет межкомнатного переноса.

## Retention: что именно означает 7 дней

Закрытие в `t0` и tombstone expiry в `t0+7d` **не доказывают**, что вся допустимая backup копия перестала содержать live row. Например, durable tombstone появился, DB close transaction провалилась; позднее в `t0+1d` создан backup с open row, допустимый до `t0+8d`. Текущий `sealBackup` получает произвольные dump bytes и не доказывает reconciliation перед их созданием.

Это не безусловная V2 resurrection: если marker из birth transaction сохранился, strict missing-descriptor deny после cleanup продолжает блокировать такую комнату даже после pruning tombstone. Именно эта проверка должна оставаться обязательной; нельзя reinitialize при restore или трактовать отсутствие descriptor как новую installation.

Для полного deletion/legacy restore claim P06 дополнительно: quiesce + replay retirement/withdrawals до snapshot/admission; bind snapshot capture time, совместимые floors и manifest; запрет просроченного backup и clock rollback по доверенному process/external времени. Внешний механизм копирования файла вне Venus не считается проверенным. Не расширять автоматически владельческий backup≤7d, чтобы скрыть задержку cleanup. После удаления personal state могут оставаться только минимальные authenticated terminal metadata на установленный конечный срок; floor совместимости содержит версию, а не персональные списки.

## Матрица обязательных контрсценариев

| Сценарий | Обязательный результат |
| --- | --- |
| Crash до PG insert / до первого fs file | Нет подтверждённой room; retry обычный новый create |
| Crash после chain, witness, descriptor temp, rename или dir fsync, но до COMMIT | Orphan не обслуживается; initialize не повторяет существующий incarnation; cleanup только под общим lock после окончательного DBabsence |
| COMMIT неизвестен / произошёл до response | Replay того же admission+idempotency key, exact body; не создаёт вторую подтверждённую комнату и не удаляет committed files |
| Committed create receipt, затем потерян файл | Readiness/admission/private routes deny; нет нового пустого ledger |
| Backup до V2 birth | В копии нет room; никакого upgrade той же ID |
| Backup после V2 birth | Marker/protocol/incarnation атомарно присутствуют; newer ledger union применяется, private grants/acks не восстанавливаются |
| Linked marker удалён/несовпадает; protocol bit изменён | Constraint либо runtime corruption deny, descriptor не разрешает downgrade |
| Legacy room из старого backup | Остаётся legacy; topic enable требует создать новую room, не upgrade |
| Chain/witness/descriptor absent, corrupt, lower, wrong pins/key | Fail closed на нужном room path; нет initialize или fallback |
| Старый API/feature-off/legacy endpoint против V2 | Unsupported/mixed deployment deny; старый private route ничего не доставляет |
| Повтор room ID/incarnation | Новый create не переиспользует existing descriptor/tombstone; UUID server-generated, never caller-provided; retry не сбрасывает state |
| Leave/rejoin с прежней и новой identity | Same identity сохраняет narrowing; revoked identity не возвращается через restore; новая identity — пустые allow и explicit opt-in |
| Tombstone fsync/rename fault; DB close rollback | Нет успешного terminal receipt; stricter deny сохраняется, personal cleanup без durable authority запрещён |
| Crash/IO failure между удалениями personal files | Terminal deny остаётся, повтор safe; остатки и overdue cleanup наблюдаемы, не скрываются |
| Restore после personal cleanup / после 7d tombstone prune | Protocol2 никогда не обслуживается без exact live descriptor; auto-init/legacy downgrade запрещены |
| Orphan scanner при живом create TX / DB outage | Не удаляет потенциально committing files; lock/DB uncertainty deny cleanup |
| Старый открытый dirfd/процесс и pending HTTP/WS при retirement | Внешний terminal fence запрещает доставку независимо от кэшированного decrypted state |

## Минимальная корректировка проекта решения

Сохранить per-room protocol2-from-birth. Добавить явные immutable protocol/incarnation DB invariants, authenticated external descriptor lifecycle, общий birth/cleanup/delivery ordering, неперсональный compatibility floor и supported-launch/restore barrier. Прежде чем удалять personal files, публиковать и fsync terminal authority нового versioned примитива; не полагаться только на существующий DeletionLedger. Определить membership withdrawal/retention и доказать 7d snapshot horizon либо постоянный strict missing-descriptor deny для любой восстановленной V2 row.

Затем обновить additive ADR/source revision и design, провести повторный независимый design review. Только после этого implementation, actual Linux+PG crash/restore/race tests, API/WS fences и новый runtime gate. Из этого отчёта не следует ни P05 PASS, ни P06 PASS, ни изменение исходного owner HOLD450.

## Уточнение root — 2026-10-19T16:15:55.7698904+00:00

После предварительных findings root явно принял: immutable private_protocol в rooms с рождения и marker в той же транзакции; никогда не reinitialize восстановленную V2 room; missing descriptor/files закрывает V2 всегда, в том числе после pruning tombstone. Retirement получит собственный durable authenticated retired marker до unlink. Birth/cleaner/retirement используют один advisory room lock; DB uncertainty запрещает orphan cleanup. Final HTTP/WS проверяют terminal marker под тем же ordering.

Root также подтвердил: новая анонимная identity не связывается с прежним человеком; после leave DB preferences удаляются, encrypted exclusion evidence сохраняется только room-local как anti-restore state до close+≤24h. Это требует явного additive retention addendum к прежней формулировке person deletion. Независимое member/session retirement до DB revocation и restore-before-admission остаётся обязательным; cold-grant reset его не заменяет.

Эти уточнения достаточны, чтобы продолжать **default-inactive additive adapter/contracts/migration** без смены архитектурного направления. Они не означают закрытия LIFE001–004 по исходникам/тестам. Точные markers/state transitions, constraints, lock order, external compatibility floor, backup/restore barrier и retention addendum ещё должны появиться как versioned артефакты и получить independent runtime proof. Статус раунда — DESIGN_OBLIGATIONS_OPEN, production activation запрещена до решения этих обязательств; никакого PASS нерешённой интеграции.
