# P04 · Работа с каталогом

Текущий scope и статус: [реестр](implementation/p04-registry.json), [журнал](../.history/2026-10-19-p04.md), [ADR-017](adr/ADR-017-catalog-review-and-withdrawal.md), [API/storage supplement](contracts/p04-catalog-supplement.v1.json). Immutable CARD-1/RE-1/P00 не изменены.

## Черновик и review

[Первый пакет](content/p04/REVIEW_BATCH_001.md) содержит60draft, по20/mode; исходные RU/EN/TR и metadata открыты, права needs_review. Это недостаточно для100reviewed/mode. [Исходный bounded brainstorm](content/p04/neutral-batch-001-source.json) не использует внешний каталог, но оригинальность/права этим не доказаны. Нужны независимые реальные компетентные RU/EN/TR/редакционные/rights проверки. Романтических и физических карт в этом batch нет.

Подготовка расширена до [полных300draft](implementation/evidence/p04/draft-author-300/REVIEW.md), по100/mode. [Авторский отчет](implementation/evidence/p04/draft-author-report.md) и15ledger exports сохраняют все исходные requests/резервирования/записи. Full draft coverage:4200/4200neutral1…100PASS и14expectedall-Xrefusals; это ещё не human-reviewed каталог. Начальный60card пакет сохранён как отдельная итерация.

Дальнейшая проверка обнаружила отсутствие privatebaseline, скрытое суммарным publiccount. Подготовлены отдельные75in-person и75online-private draft: [актуальный пакет450/150permode](implementation/evidence/p04/draft-author-450/REVIEW.md), из них100public и25+25private. [Авторский отчет и ограничения](implementation/evidence/p04/private-draft-author-report.md) сохраняют происхождение. Для private требуется C1/S3, bilateral, friend_or_more, без physical/going-away; online требует private_text_chat. [Протокол C2](implementation/p04-coverage-protocol-v2.json) проверяет25baseline/100roundbudget, by_interaction и420privateprofiles дополнительно к5880predicate/4200neutral/14negative накаждыйcapabilityprofile. Второй отчет сprivate_text_chat — условная проверка карточек, не подтверждение chat readiness. Текущая production capability по-прежнему отсутствует.

После установки pinned toolchain выполнить `npm ci`, `npm run build`, затем `node tools/card-catalog.mjs draft-check .docs/content/p04/cards .artifacts/p04/new-review-directory`. Выход создаётся эксклюзивно; существующая evidence не перезаписывается. Отчет включает actual FrozenPack validation, similarity queue,5880predicate cells и 1…100round preflight для42нейтральных профилей плюс14negative allX YesBut. Неподдерживаемые по правилам interactions явно названы; нулевые supported cells видны. Это synthetic uniform-class матрица, а не все mixed graphs.

`reserve REQUEST BASE_CARDS BASE_MANIFEST LEDGER AUTHOR` проверяет исходный batch schema/constraints и actual basepack digest, резервирует ID. `record LEDGER BATCH CARDS EXPORT_JSON` атомарно записывает только соответствующий batch; новый текст требует revision+1, иной batch/base — явного нового request. Directory CARDS может содержать остальные batch того же каталога. Export содержит полные constraints и hash-chain events. Ledger и экспорт нужно сохранять; потеря рабочего ledger не дает права заново раздать прежние ID.

Для изменения base/metadata distributions используется `revise REQUEST BASE_CARDS BASE_MANIFEST LEDGER AUTHOR EXPECTED_PREVIOUS_REQUEST_SHA256`: это отдельная CAS операция с неизменяемыми mode/range/count. Старый и новый request остаются в event chain, stable card IDs сохраняются; следующий `record` требует revision+1 у изменённой карточки. Обычный retry не заменяет request и не перераздает IDs.

`build-reviewed CARDS SIGNED_REVIEWS TRUSTED_HUMAN_REGISTRY AUTHOR_IDS NEW_OUT_DIRECTORY` принимает независимые hash-bound human records, проверяет подписи/компетенции/полноту/dedupe/diversity/100permode и нейтральные20rounds. Утверждения об identity/competence/rights требуют внешнего операторского evidence; один public key этого не доказывает. Пока таких записей нет, команда обязана отказать. Builder создаёт только кандидата: доставка через signed application release/гейты P06/P07 ещё обязательна.

Обязательные человеческие checks: editorial, safety, ru, en, tr, rights, similarity и diversity для каждого exact drafthash. Отдельная qualified_safety компетенция дополнительно требуется при романтическом/физическом содержании. В этой friendlycoreподготовке таких карточек нет; все базовые проверки остаются обязательны.

Builder также создаёт `application-bundle-entry.json`. После действительного review exact entry вносится в `packages/card-catalog/src/approved-bundles.json`, затем весь новый application source повторяет тесты/CI/reviews. Runtime loader заново сверяет подписи и полный draft→reviewed mapping; нет горячего чтения внешнего JSON. Пока source registry пуст. `python tools/p04_gate.py inspect` показывает дефициты без выдачи acceptance. `verify-technical --packet …` проверяет только P04-TECHNICAL-1; полный `verify` дополнительно требует внешние human identity/competence evidence и заново реконструирует реальный packaged reviewed bundle.

## Runtime и откат

Production не загружает draft или сетевой JSON. Нет approved bundle, provider недоступен; отсутствие catalogue ledger не разрешает обслуживать восстановленные активные games. `CATALOG_REVOCATION_LEDGER_FILE` указывает на явно provisioned внешний metadata-only ledger, который не восстанавливается из старого DB backup. Не создавать пустую замену пропавшего ledger ради readiness.

Trusted Catalog API не доступен consumer HTTP. activate/rollback требует ожидаемую generation и приложение с exact compatible bundle; live withdrawal сохраняет внешний intent, прекращает unsafe games и очищает обоих прежних recipients. После частичного сбоя выполнять reconcile с актуальным ledger до serving. Для возврата старого image сначала остановить serving, сделать backup, quiesce games и сохранить внешний актуальный ledger; P03 image не поддерживает P04 live-fence.

## Проверки

`npm run quality` проверяет unit/negative/contracts/docs/build, включая accepted historical P03. `node tools/p04-integration.mjs` создает изолированный pinned PostgreSQL Docker project и тестирует actual HTTPS/WS/CAS/revocation/fullrestore; удаляет только собственные ресурсы. Fixtures synthetic, approval/offer для пользователей не утверждаются. Дополнительно обязательны P02/P03 integration и OCI regression на финальной source identity.

CI выполняет push(main) и pull_request(main). Feature push без PR больше не создает дублирующий cancelled required check; все восемь существующих contexts и exact PR-head checkout сохраняются. Перед PR запускать локальные проверки. Защиты main и исторические canceled runs не обходятся и не удаляются.
