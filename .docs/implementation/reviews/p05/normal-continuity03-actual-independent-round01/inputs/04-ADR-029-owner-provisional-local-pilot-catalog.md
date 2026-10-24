# ADR-029 · Реальные карточки локального пилота без подмены production approval

Дата: 2026-10-20. Статус: `IMPLEMENTED_FOCUSED_PASS / INDEPENDENT_AND_ACTUAL_PENDING`.

Основание — U-019 в [решениях владельца v4](../implementation/user-decisions.v4.json) и [ADR-026](ADR-026-local-pilot-provisional-card-pass.md): точный набор470r4 предварительно принят для теста приглашёнными друзьями. Это разрешение не означает подписанную профессиональную RU/EN/TR экспертизу, проверенные права или production release.

Добавляется отдельная серверная authority `OWNER_PROVISIONAL_LOCAL_PILOT`. FrozenPack и FrozenTopicMap получают обязательный `approval_scope`; обычный reviewed loader продолжает отвергать исходные draft manifest/cards и provisional map. Отдельная фабрика использует те же проверки schema, текста, лимитов render, revision, locale field hashes, taxonomy, семантических семей и целостного исключения mixed families. Фабрика не изменяет исходные draft карточки, статусы, reviewed_by, rights, manifest или synthetic machine map documents. Runtime объекты имеют synthetic=false, но явную provisional authority; это не поле APPROVED. Pack digest и все map pins совпадают с исходным техническим data03; скрытого reseed нет.

В сборку включён единственный точный tuple: оригинальные raw470r4, исходный manifest, data03 map/taxonomy/semantic, SHA документов владельца и независимого технического data review. Literal canonical SHA реестра фиксирован в коде. Нет путей/URL/env JSON, загрузки произвольного draft, фиктивных human ключей или автоматического обновления registry. Изменение authority/data требует новой сборки и ревизии.

Admission разрешён только при явном VENUS_DEPLOYMENT_PROFILE=local-pilot, уже существующей проверке HTTPS loopback APP_ORIGIN и VENUS_PRIVATE_TOPICS=true. Используется обычный V2 TopicGames без syntheticFixtureOnly. Provider получает активный Catalog, проверяет точные pins, не допускает старую synthetic DB запись того же digest, использует Catalog.assertPinned и перечитывает защищённый RevocationLedger при финальном synchronous source fence. Отзыв одной точной revision блокирует весь pack, включая исключённые из repertoire карточки.

При новой пустой установке gen0/null без rooms, sessions, packs и catalog events initial pointer устанавливается обычным Catalog.activate CAS generation0, до startup reconcile. Ошибка CAS/ledger не повторяется и не подавляется. Использованный/отозванный/восстановленный null pointer никогда не активируется startup автоматически. Операторское повторное включение потребует обычного явного catalog activate с актуальным generation. Restart с действующим pointer использует compiled tuple, исходный DB manifest не интерпретируется как reviewed.

Legacy V1 не умеет восстанавливать provisional draft через reviewed loader. Поэтому его catalog active adapter возвращает только REVIEWED_RELEASE; проверка pinned withdrawal делегируется без изменения. Новые комнаты локального пилота используют V2. Исторический V1 core не меняется.

При отключении флага metadata-only taxonomy остаётся доступной для существующих V2 rooms и source-independent bootGate: private scopes отзываются до listen, история не стирается. Provider отказывает old pinned/new active. Startup reconcile очищает недоступный pilot pointer; последующее включение не воскрешает used null. Несовместимая room taxonomy по прежнему требует явного safe refusal/new room, без пересчёта истории.

18+, соглашение на входе, consent/ACL, TTL, epoch, private policy, engine3/RNGdomain2, public wire serializer и семь SQL migrations не меняются. Scope localpilot, production registry остаётся самостоятельным подписанным reviewed путём. Технические P05 гейты не снимаются.

Откат: выключить VENUS_PRIVATE_TOPICS, выполнить startup bootGate/reconcile на этой совместимой сборке до возврата прежней сборки; сохранить ledger/DB/history. При удалении provisional поддержки действующие provisional snapshots не восстанавливать как reviewed, не подменять manifest. Обычный отказ source безопасен; использованный pointer не возвращается автоматически. Нужны независимый source review и реальные normalAPI/UI проверки на новой сборке, отдельно от host doubles.
