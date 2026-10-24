# P04: независимый финальный гейт, 20 октября 2026

**HOLD_FULL_P04. Исправления 139 карточек приняты в техническом объёме; весь этап P04 не закрыт.** Проверяющий не автор470r3. Карточки, ledger, registries, runtime pointers и исторические решения не менялись. Новый Docker reviewer не запускал.

Точные входы: HANDOFF SHA256 `ab5607a5711154b6f11c87e66b95169212d69706ed24d91a6a49d6db4d9d994a`; manifest `fc5b6705d216ca8afb89ac49e94541e613a280ba4268dbf34f9051053fc8d365`. Все1655 записей manifest,470 card pins и author-script pins текущего freeze проверены без расхождений. Catalog digest **97bf4bb876640ec11612ae9fdd9e3baceb2cd88075e7f8d0ad59d80e4f49f6db**. Отдельный P04-C2 pack digest **sha256:8f72a053955cd16cf477bd8322d58e25119515745f52814660501843738f2176** имеет другое назначение и не должен равняться catalog digest.

## Пять критериев EXIT-P04

| Критерий плана §8 | Итог | Подтверждено | Остаток до полного PASS |
|---|---|---|---|
|1. ≥100 reviewed originals на режим, RU/EN/TR, provenance/reviewer/date/rights; CARD001..015 | **HOLD** |470 draft: Q160/TD160/YB150; schema470/0 errors;139 исправлений и точные редакторские pins; история/provenance сохранены |Reviewed0, reviewer/date0, needs_review470; человеческий HOLD не снят. Release validator фактически FAIL473:470 CARD012 и3 CARD015 |
|2. Coverage всех поддерживаемых mode/context/size/stage/comfort/class через реальный P03 predicate | **HOLD** |Два draft P04-C2 отчёта по5880 cells; rule/capability exclusions отделены от CONTENT_GAP; существующие тесты каталога проходят |Нет reviewed release pack. Приватные content gaps и применимость21 очной приватной карточки не разрешены. Старый r2 TopicMap нельзя использовать с изменёнными хешами; итоговое V2 coverage при интеграции требует новой точной привязки |
|3. N2..8,3 режима,2 контекста: neutral20/C0, allX YesBut refusal, безопасный Start дляR1..100 | **HOLD** |На каждом draft profile4200 neutral sessions PASS и14 EXPECTED_REFUSAL; neutral20 PASS. Штатный unit test actual planner preview/shortage PASS |Положительные draft/synthetic результаты не являются сессиями reviewed r3 release; повтор на принятом совместимом pack/source отсутствует. Приватный CONTENT_GAP не считается поддерживаемым завершением |
|4. Similarity/diversity, atomic digest publication, locale/roles/capability/consent | **HOLD**, applicability OPEN |Exact duplicates0/token queue0; редакторские findings исправлены на точных байтах; locale/roles schema PASS;48 исправленных очных приватных карточек требуют канал и сейчас отфильтрованы |Нет человеческого semantic/diversity disposition и atomic reviewed publication.21 прежняя карточка обещает приватный разговор без требования канала.11 кластеров имеют отдельные обязательства selector/UX, а не доказательство их исполнения |
|5. Active pointer rollback, revoked-card block и безопасное прекращение опасной active revision | **HOLD** |Draft rollback сохраняет470r2/raw ledger. Принятый history proof сохраняет844 исходные ревизии/151 событие и итог983/185. Штатный fail-closed revocation-intent unit test PASS |r3 никогда не публиковался/не активировался. Нет текущего r3 runtime pointer/active-session revoke/rollback proof. Backup SQLite и исторический тест другого digest не заменяют этот критерий |

HOLD означает отсутствие обязательного stage evidence или человеческого решения, а не отмену прошедших компонентных проверок. Release validator отдельно завершился ожидаемым FAIL: защита от публикации draft сохраняется.

## Решения владельца и139 исправлений

Source review450 сохраняет исходный HOLD;77 исключённых ID и перенесённые UX-обязательства не возвращались. Точные приложение/action list для365 дельта-ID дают **226 локально принять +139 исправить**. Вводные224/141 противоречат таблице; исходное противоречие сохранено, объём установлен по точным ID.

В470r3 ровно139 карточек(Q26/TD57/YB56;77P1/62P2) получают revision+1 и новые байты.331 raw unchanged состоят из226 локально принятых и105 исторически неизменённых. **226 локальных решений сохраняют силу на своих прежних байтах;139 новых хешей ожидают повторного решения.**105 неизменённых не равны105 безусловно одобренным. Никаких новых human-approved/reviewed/rights/date записей проверяющий не создавал.

Correction scope подтверждён:83 Q/TD pins и150 YB pins совпадают с предыдущими независимыми round02 reviews;1655 manifest entries включают сохранённые механический/SQLite/relocation proofs. Механический gate4234 и handoff3728 checks остаются доказательствами именно этих байтов. Три группы Q/TD findings и пять YB языковых findings закрыты прежними независимыми повторами; их FAIL сохранены. Это трассируемая проверка исправлений RU/EN/TR, не новая подпись квалифицированного переводчика или снятие общего HOLD.

## Конкретные остатки

**P04-FINAL-001 — применимость21 очной приватной карточки: P2, OPEN до интеграции этих ID.** Q-1102/1104/1106/1107/1108/1111/1114/1115/1116/1117/1119; TD-1104/1107/1109/1111/1112/1113/1115/1116/1118/1120. Все имеют in_person-only, pair_private, stage3/C1, bilateral, без required_capabilities и без going-away. RU/EN/TR явно предлагают личный разговор. Нейтральность темы не создаёт техническую приватность. Здесь не доказано фактическое раскрытие: actual UI не исполнялся. Однако применимость, уже исправленная у48 соседних карточек, для21 остаётся неразрешённой. Нужен совместимый реальный канал/ACL, явно пересмотренный публичный формат либо capability-bound withholding с повтором coverage. Reviewer карточки не менял; точные JSON сохранены в legacy21-review-inputs.json.

**P04-FINAL-002 — приватная ёмкость: CONTENT_GAP, не RULE_EXCLUDED.** В default profile840 gap cells: Q/TD/YB in_person, baseline0..11. В условном chat profile840 gap cells: Q/in_person, YB/online, YB/in_person, baseline22..24<25 дляR100. Default дополнительно имеет840 CAPABILITY_UNAVAILABLE cells. Эти пробелы нельзя назвать невозможными по правилам. Условная симуляция с capability не доказывает работающий очный канал. Нужны пригодный reviewed repertoire/согласованный реальный capability scope и повтор существующего coverage. Для нейтральных сессий draft evidence положительно.

**11 semantic clusters — сохранённые обязательства P04/P05.** Реестр совпадает с source DELTA: чередование механик, запрет соседнего повторения, ограничение частоты формата, вымышленная альтернатива. TD-1170 отличается операцией отQ-1172/YB-1175 по принятому editorial review, но session separation ещё не доказана. Token queue0 не доказывает отсутствие смысловых перефразов. Автоматически удалять тематических соседей не требуется: нужны reviewer disposition и соответствующий selector/UX acceptance в своём этапе.

**Mock legal не отменяет content review.** Владелец разрешил mock значения для друзей; этот отчёт не требует реального юридического пакета или production лицензирования для локального теста. Но все470 содержат needs_review; recorded originality/rights disposition в принятом mock scope и reviewed manifest отсутствуют. Нельзя молча выставить original_verified или придумать reviewer/date. Человеческое решение по содержанию и обязательный18+ остаются отдельными границами. Пустые approved registries корректно запрещают активацию.

## Фактические проверки

Свежие reviewer команды:

- `.venv/Scripts/python.exe -B tools/validate_cards.py ...candidate/cards --report ...schema-draft.json`: exit0,470 parsed,0 errors.
- Тот же validator с `--release --minimum 100`: exit1,473 errors(CARD012×470/CARD015×3).
- `node ...candidate/check-handoff.mjs`: exit0,470 cards/139 sections/331 unchanged/11 clusters.
- Существующие Vitest `catalog.test.ts` и `topic-bundles.test.ts`: exit0,23 tests PASS.
- Read-only stdlib audit:1655 manifest entries,470 freeze pins,83 QTD/150 YB editorial hashes; расхождений нет. Новый тестовый фреймворк не создавался; frozen scripts с жёсткими output paths не запускались поверх истории.

Одноразовые ошибки reviewer запросов записаны в журнале: implicit cp1252 read/console encoding исправлены явным UTF8; len(integer duplicate count) исправлен сохранением исходного типизированного значения. Они не меняли candidate/source. Host unit/schema PASS не объявлен local Docker acceptance. Root выполнил штатный Docker draft-check на A29e39/historical1274: exit0, readonly candidate bind, network none, UID1000,1CPU/1536MiB; cleanup receipt completed. Все470 raw pins и весь INDEX перепроверены; analysis и оба coverage JSON структурно точно равны исходным draft отчётам. Root INDEX `b643e7cadd5dd46d0465f224d8f65e3620d6f5504c34ccfea4dc3dc18f3c1720`, receipt `ee1dd9c00ecc40b80739bc797afb308186ecaea28bbfbb31116bf287eab1349c`. Reviewer Docker не повторял; cgroup/cleanup здесь связаны с receipt root, а не с собственным inspect. Два host wrapper printer exit−1 после вычислений описаны в root RECORD и не подменены Docker exit0. Это реальный local Docker draft qualifier, не reviewed-pack/runtime-session acceptance.

Минимальный путь: человеческое решение по exact revisions; разрешить21 applicability/coverage и semantic disposition; штатно собрать разрешённый pack; повторить затронутые coverage/integration/rollback проверки; независимый повтор гейта. До этого r3 остаётся в карантине. Runtime pointer не менялся,470r2/raw ledger/история сохранены. Ни активация draft, ни снижение порогов этот HOLD не закрывают.
