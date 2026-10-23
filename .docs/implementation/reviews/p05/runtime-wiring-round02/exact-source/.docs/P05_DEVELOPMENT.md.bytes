# P05 · Rooms, Games и приватный текст

Статус: **разработка / независимый fix–retest цикл**, полный EXIT-P05 не принят. Вход EXIT-P04 открыт: новый каталог450 остаётся draft под исходным human HOLD. Production registry не активирован; интеграционные тесты используют отдельные synthetic factory/pack, недоступные production entry point.

## Реализация

Games UI объединяет подготовку и проверку безопасного пула, выбор участников/режима/числа раундов, authoritative HTTP/WS состояние, Questions/Truth or Dare/Yes But, отдельные invitation/action consent, изменённые условия с новой редакцией, завершение и replay. Согласие не возникает от чтения, молчания или доставки сообщения. Участник может пропустить, остановить или отозвать участие без обязательного объяснения.

[ADR-020](adr/ADR-020-p05-quiet-public-pair.md) вводит тихое двустороннее приглашение перед публичным парным заданием. До согласия обоих группа не видит пару и текст. Приватный prompt/chat от этого не открывается. [ADR-021](adr/ADR-021-p05-safety-neutral-reset.md) задаёт отдельное явное действие перехода к нейтральным настройкам: игра участника становится aborted, старый snapshot сохраняется, его прежние разрешения нельзя возобновить. Обычная остановка остаётся отдельным действием.

[Приватный чат](P05_PRIVATE_CHAT.md) включается явным server flag, работает только в online private round с двумя текущими согласиями и exact actor ACL. Его содержимое шифруется на сервере, имеет ограниченный буфер и TTL, удаляется при отзыве и не восстанавливается после restart/restore. Это не E2EE и не обещание предотвращать снимки экрана. Дополнительный [контракт](contracts/private-chat.v1.schema.json) не переписывает исторический P00 snapshot.

Индикатор Games отражает доступность текущего закреплённого pack либо нового проверенного каталога. Недоступный/несогласованный журнал отзывов закрывает выдачу контента. Ошибка этого индикатора не откатывает emergency stop, setup withdrawal, выход участника или согласование durable withdrawal intent с БД. Ошибки PostgreSQL не маскируются доступностью=false.

## Проверка

Команды выполняются из корня с закреплённым Node/npm/Python и Linux Docker:

```text
npm run quality:docker
npm run test:p05:chat
npm run test:p05:self-actions
node tools/p05-browser.mjs --catalog
npm run test:p05
npm run test:local-pilot
```

По умолчанию эти Docker runners требуют чистый checkout. `--allow-dirty` разрешён только как явно отмеченный preflight; изменение source identity в ходе запуска не становится чистым доказательством. Каждый прогон сохраняет exact image ID, source inventories, исходные результаты и cleanup receipt в собственной `.artifacts/` директории. Инструкции и границы browser matrix — в [P05_TESTING.md](P05_TESTING.md).

Catalog suite проверяет реальные PostgreSQL/filesystem операции с production services, отдельный настоящий внутренний HTTP replay и fsynced withdrawal/reconcile. Он не доказывает внешний TLS, браузерный UI или реальные устройства. Private-chat suite проверяет реальные HTTPS/WS/PG ACL, SQL/log plaintext absence, квоты, гонку awaited read с TTL/revoke, restart и восстановленные старые строки. Доказательство full backup/restore файла относится к P06; in-memory row restore нельзя им подменять.

Независимые агенты сохраняют отдельные раунды отчётов в `.docs/implementation/reviews/p05/` и собственные журналы. Найденные FAIL не удаляются после исправления. Текущие acceptance gaps ведутся в [карте44 требований](implementation/p05-work-map.json): topic boundaries/новая тема, advice opt-in, semantic scheduling, реальные edited RU/EN/TR content и полный source-bound E2E не считаются закрытыми от одного наличия UI или тестового сценария. Music/mobile отложены владельцем; Cinema/Calls относятся к дальнейшим этапам.

[Recipient self-actions](P05_SELF_ACTIONS.md) реализован аддитивно: собственные display permissions связаны с identity/session/round/revision; hidden primary не добавлен в public projection. [Actual11/11](implementation/evidence/p05/self-actions-preflight-05/index.json) и [независимый round06](implementation/reviews/p05/role-round-06.md),132 controls PASS, закрывают ROLE001–006 на identity `d84d16f57da53682f1ae314b14bfb0d1663429c87e41fdeb5416c651c5703b9b`. Generic отказ проверен при HTTP degradation и обоих направлениях расхождения часов; session Stop/Pause при WS loss проверены отдельно. Все предыдущие FAIL и архивы сохранены. Это bounded dirty component proof, не полный P05; последующие bytes не наследуют глобальный PASS.

[Настройки тем](P05_PRIVATE_TOPICS.md) имеют отдельный inactive API adapter:35 author/22 independent иactual9/9 после исправления pre-mutation auth expiry. Ledger foundation и versioned planner получили отдельные pure/IO gates; [LIFE001–004](implementation/reviews/p05/ledger-lifecycle-design-round01.md), birth/retirement/admission flow, V2 game/epoch/advice/UI/C2/restore пока не приняты. [ADR-023](adr/ADR-023-p05-room-topic-safety-lifecycle.md) фиксирует границы, retention и откат.

[Pure conversation kernel](implementation/reviews/p05/kernel-round-02.md) имеет 68 авторских и 86 независимых проверок PASS; исходный kernel-round01 FAIL сохранён. Модуль не экспортирован и не активирован. Интеграция room-wide ledger и versioned planner с V2 game, API/UI, actual races/full restore и новый C2/fairness/inference пока обязательны для полной функции; детальная граница в [проекте интеграции](P05_TOPIC_ADVICE_DESIGN.md).

## Зафиксированный браузерный preflight

[Полная матрица](implementation/evidence/p05/browser-matrix-preflight-01/index.json) имеет actual Docker PASS30/216/27 и nominal probe PASS; [независимый round02](implementation/reviews/p05/browser-round-02.md) — PREFLIGHT_EVIDENCE_PASS. Точный tested source identity `46bf2780058b7a420af842de0939245f05bad32d039bc69cef90fe9fd853c197` сохранён recoverable included-source ZIP, все bytes сверены. Это dirty-source synthetic proof до следующих изменений UI/API; полный P05 и clean-source acceptance не заявлены. Новые source bytes не наследуют этот PASS автоматически.

## Совместимость и откат

Новые runtime свойства не переименовывают исторические P03/M3/P04 evidence в proof текущей версии. Snapshot/policy/исходные migrations не переписываются. Quiet-pair startup reconciliation прекращает старый неподтверждённый публичный парный раунд перед обслуживанием новой политикой.

До смены образа закрыть новые admissions/starts и остановить активные приватные раунды. Чат выключить явным flag=false; текущим совместимым образом удалить ephemeral scopes до downgrade. Новая chat schema additive, автоматическое удаление таблиц или изменение старых migration hashes запрещено. Withdrawal/deletion ledgers сохраняются вне DB rollback; отозванный контент и закрытые комнаты не возвращаются. Возврат к старой версии, которая не поддерживает принятую consent/privacy политику, требует закрытого serving до совместимого recovery. Фактический image rollback новой реализации ещё должен получить собственный результат; описание процедуры не является выполненным откатом.
