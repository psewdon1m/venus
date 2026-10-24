# P04 r4: независимый повтор metadata/applicability/history

**PASS_METADATA_APPLICABILITY_AND_HISTORY_ONLY / FULL_P04_HOLD.** Замечаний в этом ограниченном scope нет. Автор r4 и reviewer различаются. Ни human approval, ни активация, ни окончательный current-source Docker C2/API/UI/V2 gate этим отчётом не принимаются.

Точные входы: r4 HANDOFF `b9095f24ffab2c131286d7a022d539da43924201d515fd0d395b831e6cedf026`, manifest `df7b02a40787e571387f2df7bc89f1aeb98944367500ba7df77776130760173c` (**666 файлов**), freeze `594e6f65c427eaadcde7718c3a986505e40098694a16ee14f1f8aeb2a83d1d88`. Catalog digest **dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270**, pack digest **sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4**. Catalog digest и pack digest имеют разные назначения. Авторские `inputs` сохраняют точные ADR025/U018v3 и явно не обещают окончательный статус параллельно изменяемого API/UI source.

## Что подтверждено

Независимый read-only audit дважды завершился exit0. Все666 manifest length/SHA,470source pins/470target pins, freeze/scripts/ledger hashes проверены. Старый r3 digest97bf4bb8 и новый catalog digest независимо пересчитаны. Нет новых/удалённых ID и нет произвольных изменений JSON. Изменены **143 private cards: Q47/TD50/YB46**; только revision(+1), meeting_contexts и required_capabilities. Все143 теперь `online,in_person`, требуют `private_text_chat`, сохраняют bilateral consent, stage≥3/comfort≥1, physical=false/going-away=false. Для21старой IPprivate capability действительно добавлена впервые. **327raw JSON идентичны**, включая Q1105/1110/1112 иYB1102/1104/1107/1130. Все **2340 RU/EN/TR textfields** и весь provenance/authoring/ID/status/category/comfort/stage/consent остаются прежними.

`applicability143.json` проверен по каждому ID: прежние/новые contexts, rationale, old21 marker, ровно нужные locale fields, все **717 locale-field UTF8 hashes** и их тексты точно совпадают с immutable r3/r4. Собственный `per-id-technical-applicability.json` даёт hashes, прежнюю/новую revision, review operation и отдельное техническое обоснование каждого ID. Это не подписи реальных языковых reviewer.

При технической оценке прочитаны все EN операции, отдельно RU/TR21бывших «личных разговоров» и10образных/неоднозначных случаев. Неизменные локализованные поля связаны с прежним r3 editorial scope; повторная человеческая языковая приёмка не изображается. Обсуждение предпочтений можно вести письменно, оно не требует реального проигрывания музыки, звуков/голоса, нахождения рядом или физического предмета. Для21старой карточки формулировка «личный разговор»/`özel konuşma` не требует речи вслух; новый канал делает доставку явной. Остальные карточки уже называют private chat. Применимость расширяется к одному и тому же письменному действию, без смены задач/текстов.

Особые смысловые проверки: TD1107/1109 — звуки сравниваются словами; TD1158 — окно/шествие принадлежат вымышленному персонажу; TD1160 прямо исключает обязательное поедание; YB1117 — ролевая сцена галереи внутри чата; YB1142 — воображаемый проход; YB1160 — воображаемое соседство; YB1162 — воображаемые места у костра, без реальных шагов; YB1166 — воображаемый праздник без фотографий; YB1180 прямо исключает необходимость реальной музыки/нот. Изменение metadata не создаёт обязательный physical/audio/mobile сценарий. Контекстной причины запретить эти metadata143 в проверенном объёме не найдено. Human HOLD качества/языков/полного контента остаётся самостоятельным.

## История и существующий AuthoringLedger

SQLite открывались read-only для сравнения, integrity_check и foreign_key_check: оба ledger исправны. Все **983** исходные revision tuples сохранены точно; новый ledger содержит1126, новых ровно143 и только для изменённых ID. Все **185** старых event rows — точный prefix215; полная цепочка previous/hash независимо пересчитана.547IDreservations неизменны,41batch сохранён,12request revisions не меняют стабильный диапазон ID,18draft records соответствуют карточкам. Предыдущие143raw revision-history JSON побайтно равныr3. Rollback SQLite совпадает с исходным ledger SHA27fd60b3; исходник не менялся.

Я не ограничился чтением авторского утверждения «API only». На **новой собственной копии** прежнего ledger исполнены существующие `validateBatchSnapshot` **12/12**, `AuthoringLedger.revise` **12/12** и `record` **18/18** с точными requests/ожидаемыми CAS hashes и batch cards. Wrong expected CAS отвергнут `BATCH_REVISION_CONFLICT`, экспорт событий не изменился. Итоговый export равен авторскому; более того, получен **побайтно тот же SQLite SHA51871fffea0337e68fc16f3f305a96002284d0f0da0c8ddd9dc36ee629c6e717**. Это независимое воспроизведение через действующий API, без собственного INSERT/UPDATE/исправления историческойБД. Прямой SQL в проверяющем применяется только к read-only SELECT/PRAGMA; собственные записи выполняет существующий AuthoringLedger. Source/candidate hashes после replay прежние. Собственная copy `.artifacts/p04-r4-ledger-independent-replay01.sqlite` не является runtime ledger.

## Validators и scope C2

- Existing `tools/validate_cards.py ...review470-r4/candidate/cards --report ...schema-repeat.json`: **exit0**,470parsed/0errors. Draft/schema/semantic-machine validation.
- Тот же validator `--release --minimum 100`: фактический **exit1/473errors**,470×CARD012 и3×CARD015. Это ожидаемая отрицательная проверка held draft, сохранённая в `release-negative.*`, а не ошибка, которую скрыли. Reviewed0; metadata не обошла release boundary.
- `audit.py`: оба запуски exit0; результаты в `audit-run01.txt`, `audit-run02.txt`, `audit-result.json`.
- `ledger-replay.mjs` с существующим Node24.22.0/Python environment: **exit0**,12validators/12CAS/18record/negativeCAS и exactbytes equality. Сырые stdout/result и hashes использованных compiled API/helper сохранены.

Saved historical-compiled diagnostic проверен как **историческая диагностика**: chat-on содержит5880cells/4214neutral-veto/420private sessions, private PASS420; по каждому mode/context/late-stage допустимомуclass baseline равен47/50/46, т.е.25не снижено и actors не считаются дополнительнымиcardIDs. Neutral20 исходного diagnostic PASS. Capability-off содержит прежнюю ошибочную IPclassification:210IPsessionsPASS при0private и840IP CONTENT_GAP cells — это **не** current-source acceptance и не результат нового rootcoverage predicate. Старые результаты не переписаны.

Отдельный независимый review rootcoverage `57027715bedb9b6e2716767a5184cef2ac5d516e21f8c98c638659b2ee25a69c` принял только его код/13targetedtests; здесь этот факт не подменяет фактический пересчёт r4 на новом image/source. Финальный local Docker C2 root ещё **PENDING**, API/UI+ACL/consent/TTL — другой автор и отдельный independent gate. Legacy `coverageReport/preflight` также не является новым V2 semantic/exclusion/history/fairness proof.

## EXIT-P04 после этого повторения

| Критерий | Итог этого scope |
|---|---|
|≥100reviewed/mode/RUENTr/provenance/rights | Draft470 Q160/TD160/YB150, provenance сохранён; reviewed0 и humanHOLD. **HOLD** |
|Coverage mode/context/size/stage/comfort/class | Metadata/application defect прежнего канала адресован согласованным U018; historical chat-on baseline≥25. Final newsourceDocker/V2/reviewedpack ещё нужны. **PENDING/HOLD** |
|N2..8/3modes/2contexts neutral20/allX/safeStartR1..100 | Сохранённая диагностика положительна в своёмhistoricalscope; нынешний actualnewsource и reviewedpack не принят. **PENDING/HOLD** |
|Similarity/diversity, atomic digest publication, locale/roles/capability/consent | Metadata143/schema/IDs/history/API-CAS **PASS в узком scope**; сохранённые duplicates0/tokenqueue0 не human semantic disposition. Полной atomic reviewed publication и человеческойприёмки нет. **HOLD** |
|Withdrawal/replay/rollback/versionedbindings | Сейчас runtimepointer не менялся,r3/rollbackcopy доступны. Новые TopicMap/releasebindings/интеграция и фактический compatibleUI/API/engine/pack rollback отдельны. **PENDING/HOLD** |

11semantic-cluster/UX/recipient/condition/skip/withdrawal обязательства предыдущегоr3 сохраняются: metadata/text equality не доказывает selector nonrepeat или новую acceptance. Данные review450 и старые r2/r3 proof не перезаписаны. Владелец разрешил единый канал, но не выдал через это техническое решение человеческое content approval. Release registries и runtimeactivationfalse не менялись.

Для отказа от кандидата оставить r4 неактивным; исходныйr3 и отдельная rollback ledgercopy доступны. Будущий откат должен сохранять новый channel/consent/ACL/TTL/exclusion/retirement safety, а не возвращать уязвимую metadata/policy комбинацию. Документ не подтверждает активацию, EXIT-P04/P05 или переходкP06. Уже разрешённая независимая работа P05 продолжается по решениям владельца.

Reviewer писал только собственный report/journal и fresh excluded replayledger. Docker, приложение, сервисные запросы и чужие журналы не использовались. Вспомогательные read-only запросы сначала имели missingpath/quoting/cp1252 ошибки; исправлены явными путями/скриптом/UTF8 и отмечены в журнале. Исторические пакеты и собственные raw результаты сохранены. **Записи COMPLETE после INDEX/HANDOFF freeze.**
