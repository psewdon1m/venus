#118 — additive promotion map03

**PREPARATION_ONLY. Ни stage PASS, ни разрешения подписи.** Точный source `5de418d7ffb6a0198616a78c6774d54beb0b2437`; измеренный `stage_inventory.py` core `7df73218ae4bd2d5480916a31c779cc0e1e909c37f85290344f88532001e724d`. Это полный hash исходников, не suffix Docker project. Preflight15 при подготовке RUNNING/NOT_ACCEPTED. Старые пакеты не изменены.

Все118 исходных ID/check_id/source_line/source_row_sha256 сохранены.67currentpending,7finalartifactpending,34namedN_A,10productiondeferred. Новых тестов запрошено: **0**. Требуется привязать существующие подходящие проверки к группам ниже; одна фактическая проверка закрывает несколько ID.

## Уже имеющиеся компонентные доказательства

Это покрытие отдельных механизмов, не автоматическое повышение всего ID. Точные paths/hashes и ограничения — MAP.json.

| Компонент | ID с применимым уже наблюдённым подмножеством |
|---|---|
| O-REPRO11 | REL-04, REL-08, REL-12, BST-01, BST-04, BST-05, BST-09, BST-10, BST-12, PERM-01, PERM-02, PERM-03, PERM-05, PERM-06, PERM-07, CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-10, HLT-02, HLT-03, HLT-09, HLT-12, DATA-01, DATA-03, DATA-04, DATA-05, DATA-06 |
| O-PDF05 | NET-09, DATA-01, DATA-03, DATA-04 |
| O-DB04 | CTR-05, HLT-08, HLT-09, OPS-04, OPS-06 |
| O-BATCH05 | BST-12, HLT-09, DATA-04, DATA-06, OPS-04, OPS-06 |
| O-PNG06 | NET-12, OPS-04, OPS-06 |
| O-LOCALE06_07 | NET-12, OPS-04, OPS-06 |
| O-GUARD09_10 | BST-12, CTR-05, CTR-06, NET-04, NET-05, HLT-03, HLT-09, DATA-04, DATA-05, DATA-06, OPS-04, OPS-06 |
| O-SOURCE04 | REL-04, REL-05, REL-06, REL-09, TRUST-06, NET-09, OPS-03 |
| O-PREFLIGHT14-SUBSET | NET-04, NET-05, NET-09, NET-12, HLT-04, OPS-04, OPS-06 |
| O-HISTORICAL-P06 | REL-01, REL-02, REL-10, REL-11, BST-03, BST-06, BST-07, BST-08, BST-11, BST-13, TRUST-01, TRUST-03, TRUST-04, TRUST-07, PERM-04, CTR-01, CTR-02, CTR-08, NET-06, NET-11, HLT-01, HLT-10, OPS-01, OPS-02, OPS-05, OPS-08, OPS-09, OPS-10, OPS-11 |

O-REPRO11 — реальные11/11 на14c. O-DB04/O-BATCH05 — реальные PostgreSQL/authority targeted regressions. O-PNG06 — только выбранный1/12 case с503 и decoded recovery; полный suite оставалсяFAIL. O-GUARD09_10 — актуальная physical fence работа193PASS+1expectedskip, но SOURCE_ONLY/dirty targeted. O-LOCALE06_07 — только source review. O-PREFLIGHT14-SUBSET — успешные21cell/mobile/private-call/etc подзаписи **внутри общего FAIL14**. O-SOURCE04 —565sources/999notices **14c**, не окончательный изменённый source. O-HISTORICAL-P06 — только исторические per-ID receipts; старый D44F не имеет текущего binding.

## Что осталось получить

| Группа evidence | ID, которым она нужна |
|---|---|
| P-PREFLIGHT | BST-12, CTR-05, CTR-06, NET-04, NET-05, NET-09, NET-12, HLT-01, HLT-02, HLT-03, HLT-04, HLT-08, HLT-09, HLT-12, DATA-01, DATA-03, DATA-04, DATA-05, DATA-06, OPS-04, OPS-06 |
| P-HOUR | NET-09, HLT-01, HLT-12, OPS-04, OPS-06 |
| P-OPERATOR-CURRENT | REL-01, REL-02, REL-08, REL-10, REL-11, REL-12, BST-01, BST-03, BST-04, BST-05, BST-06, BST-07, BST-08, BST-09, BST-10, BST-11, BST-13, TRUST-01, TRUST-03, TRUST-04, TRUST-07, PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-06, PERM-07, CTR-01, CTR-02, CTR-03, CTR-04, CTR-07, CTR-08, CTR-10, NET-06, NET-11, HLT-10, OPS-01, OPS-02, OPS-03, OPS-05, OPS-08, OPS-09, OPS-10, OPS-11 |
| P-FINAL-IMAGE | REL-04, REL-05, REL-08, REL-12, BST-01, BST-04, BST-05, BST-08, BST-09, BST-10, BST-11, BST-12, BST-13, PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-06, PERM-07, CTR-01, CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-08, CTR-10, HLT-02, HLT-03, HLT-08, HLT-09, HLT-10, HLT-12, DATA-05, DATA-06, OPS-01, OPS-08, OPS-09, OPS-10, OPS-11 |
| P-SOURCES | REL-04, REL-05, REL-06, REL-09, TRUST-06, NET-09, OPS-03 |
| P-RECOVERY-REBIND | REL-04, REL-08, REL-12, BST-01, BST-04, BST-05, BST-09, BST-10, BST-12, PERM-01, PERM-02, PERM-03, PERM-05, PERM-06, PERM-07, CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-10, HLT-02, HLT-03, HLT-09, HLT-12, DATA-01, DATA-03, DATA-04, DATA-05, DATA-06 |
| P-TWO-REVIEWS | REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08, REL-09, REL-10, REL-11, REL-12, BST-01, BST-03, BST-04, BST-05, BST-06, BST-07, BST-08, BST-09, BST-10, BST-11, BST-12, BST-13, TRUST-01, TRUST-03, TRUST-04, TRUST-06, TRUST-07, PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-06, PERM-07, CTR-01, CTR-02, CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-08, CTR-10, NET-04, NET-05, NET-06, NET-09, NET-11, NET-12, HLT-01, HLT-02, HLT-03, HLT-04, HLT-08, HLT-09, HLT-10, HLT-12, DATA-01, DATA-03, DATA-04, DATA-05, DATA-06, OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-08, OPS-09, OPS-10, OPS-11 |
| P-FIVE-CI | REL-01, REL-02, REL-03, REL-05, REL-10, OPS-04, OPS-06 |
| P-REAL-RELEASE | REL-03, REL-04, REL-05, REL-06, REL-07, REL-09, TRUST-06, CTR-04 |

- **P-PREFLIGHT:** успешный весь текущий короткий compiled joint путь; текущий запуск15 пока не принят.
- **P-HOUR:** один настоящий≥60min/8clients/≥10completed V2games/3modes с объявленными ресурсами, media coexistence/faults и cleanup; preflight его не заменяет.
- **P-OPERATOR-CURRENT:** имеющиеся affected P06 units/drill или точное обоснованное неизменное подмножество для конкретного исходного prevention. Это не новый тест на каждый ID.
- **P-FINAL-IMAGE:** exact new production0.0.2 inventory+realv4Driver install/admission/moduleboot; candidate-only drill не выдать за повтор fullrestore.
- **P-SOURCES:** новый exact Venus archive/index/notices/receipt для финальных байтов; проверенные неизменные third-party archives можно повторно использовать без скачивания724MB.
- **P-RECOVERY-REBIND:** final nonauthors принимают точную совместимость старых11 mechanism records и текущих изменённых authority/API/UI путей; при недостатке — повтор только затронутой ветки существующим Driver.
- **P-TWO-REVIEWS:** две независимые окончательные проверки фактических final bytes/test receipts/per-ID decisions/assets, а не source-only reviews.
- **P-FIVE-CI:** пять обязательных checks на exact finalhead/main; longG/Fstats manual-only.
- **P-REAL-RELEASE:** genuine signedv4 venus-v0.0.2 с main/tag/image/config/sourceassets и anonymous assets+GHCRpull/exactimage; key уже разрешён,0.0.1 immutable.

## Важное обновление recovery parity

Checklist02 описывалD18 и только три API изменения. Текущий5de изменяет **шесть production API и два web файла** относительно14c. Поэтому старое утверждение «только три файла» не является текущим whole-product доказательством. CURRENT-DELTA.json содержит точные SHA256.

Изменённые файлы:
- `apps/api/src/database.ts` — `521bed6eab7853553dd7ff8eeb51b90e0c3ed46336fc36609577ba0099cebdd9`.
- `apps/api/src/private-topic-preferences.ts` — `d9ff6f42dedaa5825ba10edc21ea8bebbbfc4cf9b554d6c4f3fdf00d81123f4c`.
- `apps/api/src/room-private-protocol.ts` — `ebc3fc6d4135bfc1c63dd818d8706498a2588676e81349b86ebe77d04d5e6b62`.
- `apps/api/src/rooms.ts` — `ee4f9d3752c8912c5a79b9b6317d3cd3b8900dd6bb71b2f2a8987bb7fe3dde33`.
- `apps/api/src/topic-games.ts` — `bf1cc88c7682c7b509888f39d41652fe705bcaa31cddda85e229b5332b987beb`.
- `apps/api/src/topic-room-registry.ts` — `f4c08b77b9d4b0fae443953817b908fea19e448a0b6985c9e49af2dd428f1cd7`.
- `apps/web/src/main.tsx` — `57a1db353f6881615200e494766eb9dc6aafaf4cd98b6d6742f7fe264effd1e9`.
- `apps/web/src/presentations-panel.tsx` — `99930e9f134c604463ca01b8873a81a5fc61ba96bb7496a7fe9fbd1cc41a5eaa`.

Последние rooms/protocol/registry байты **точно совпадают** с Eng10 INPUTS. Подготовленная closure сама не выдаёт разрешение: production consumers обязаны вызвать текущую physical fence после последнего await; существующий SOURCE_ONLY+193test component не заменяет actual current compiled admission/revoke/после восстановления и cross-module media/PDF checks. Условное наследование Driver/BK2/schema/guardian не расширяется на весь Rooms auth graph. Нужен явный final nonauthor disposition, а не blanket hash одного INDEX.

Stage identity не включает evidence/reviews/journals. Этот новый документ сам не меняет implementation core. Если actualinputs финального запуска относятся к другому source/core, оркестратор фиксирует отдельный exact byte parity/rebind; никакой Docker project suffix не используется. Sealed draft02 остаётся HOLD с correction01. Новый final118 decision создаётся отдельно после получения receipts; семь post-sign/public пунктов закрываются только реальной публикацией.

Реальная библиотека, physical devices/OSkeyboard/externalnetwork и productionDNS/TLS/NAT отложены владельцем. P10 mobileWEB обязателен локально; nativeapps вне scope. Нового участия владельца для технического закрытия сейчас не требуется.
