# P08: независимый выходной Engineering-гейт, round 01

**FAIL: один обязательный дефект восстановления после запрета autoplay.** Проверен exact source `8600fe2f7c80a9b6cbf8c72507b869f55f71cbd0`, implementation core `3ca43ec1112e618e4a1212b14769fa1d270faa349d57207b30936983ae966c4f`, 1971 файлов. Полный PASS этапа не выдан. Проверяющий не автор реализации; собственные writes — только этот пакет и журнал агента.

## Обязательное исправление P08-ENG-001 · P2

**Файлы:** `apps/web/src/music-sync.ts:13`; `apps/web/src/music-panel.tsx:22`, `:24`, `:30`, `:32`, `:36`.

`applyMusicSync` вызывает `audio.play()` при paused audio и shared playing tuple, но его catch молча поглощает rejection. `MusicPanel` выставляет blocked только в обработчике первоначального явного enable. Поэтому запрет браузером асинхронного воспроизведения после host Play/смены источника/другого позднего восстановления не сообщается UI. Audio остаётся paused, кнопка показывает «Выключить звук», recovery hint отсутствует, а interval повторяет play каждые250ms. Комментарий о том, что UI play-handler сообщает autoplay denial, для этого пути неверен. `NotAllowedError` не обязан порождать media element error event.

Узкая read-only проверка exact TypeScript-модуля в Node24.22.0 с fake audio.play, отклоняющим promise `NotAllowedError`, дала native0: три вызова, три undefined результата, audio paused, feedback отсутствует. Это воспроизведение скрытого error path, **не реальная браузерная policy/DOM проверка**. В actual round10 deny-path не форсировался; успешные decode после клика его не закрывают.

**Нужное исправление:** передать ошибку асинхронного play в актуальный UI с учётом lifecycle/generation; при NotAllowedError показать локальное blocked/retry, прекратить фоновые повторные play до явного enable/retry. AbortError после src switch/unmount не выдавать за autoplay block. Сохранить shared tuple и локальность пользовательского решения.

**Достаточная повторная проверка:** узкая regression отрицательного play promise и browser/UI flow forced denial→локальный blocked→явный retry→воспроизведение. Если clock/tuple/range не изменятся, повторять60s drift/full music matrix для этого исправления не требуется; прежние proof остаются на8600 и применимость к новому core объясняется явным source delta.

## Что подтверждено

- Входной hold источника разрешён U-024: локальный host-file catalogue, собственные synthetic fixtures. Неизвестные реальные tracks не получают rights approval. U022/ADR035 переносят P07 на финальный общий прогон, не делают его PASS.
- Пересчитан core3ca4/1971 с существующим stage_inventory; административный worktree .git pointer исключён так же, как отсутствует файловая запись .git у clean normal checkout. Все25 проверенных application/infra/test/tool inputs совпали ROOT/W. Root Git index A4bb сохранён.
- Все26 byte/hash entries targeted-round10 и targeted-preflight01 совпали. Все девять предыдущих round INDEX существуют и закреплены; FAIL не переписаны.
- Round10: native0, clean exactsource/unchanged, image535ad19d,11 actual cases. Host-only/replay/conflict/Origin, single/suffix/invalid Range/foreign-room, pause/seek/restart/server auto-next, native audio8contexts, local volume без server mutation, actual Music+Game start/audit, reconnect/registry revoke, очной personal opt-in и leave-cookie denial, close/idle/schema fence, Firefox/WebKit decode.
- Принятый до измерения ограниченный local component drift profile:8Chromium/2s warmup/60s/480samples; p95=121.272ms/max201.626ms при limit300ms. Это не исходный proposed15min run, не физические8телефонов и не P07 load/soak. Последние остаются непроверенными в этом verdict.
- Actual PG16 custom dump→отдельная restore DB:5 music rows, before/after hash24bc433f совпал. Это доказательство сохранности новой additive таблицы; не новый signed release и не повтор полного P06 update/host-key recovery.
- Preflight3 catalog/Range unit +2 monotonic unit и impacted schema/i18n/lint/API/web types native0 сохранены с честной пометкой dirty preflight. Четыре source pins совпадают. Clean actual image build и runtime относятся к8600; preflight не переименован в новый clean full-quality run.
- Каталог ограничен путём/hash/размером/magic/rights expiry, запрещены произвольные URL/пути/symlink asset. Stream room-scoped использует существующую cookie и native audio same-origin guard; каждую64KiB выдачу повторяет room/member/session/18+/ledger/serving/generation/catalog/fd checks. Уже доставленные audio bytes не объявлены отзываемыми DRM.
- Queue/transport host-only, revision/idempotency, server anchor/auto-next, bounded retries/read paths. Local volume остаётся client-only. RU/EN/TR строки совпадают по ключам, native buttons/ranges доступны клавиатурой; actual клавиатурная проверка range Home/ArrowRight сохранена. Полная screen-reader/реальная-device приёмка не заявлена.
- Миграция additive/checksummed, FKcascade и reject будущего schema. Overlay/music files read-only и вне DB backup, исходники assets требуют отдельного host сохранения. Отключение каталога/функции и сохранение additive таблицы/protected ledgers — применимый совместимый code rollback; signed0.0.1 не расширяется этим кодом.

## Остальные границы

Security reviewer независимо оценивает HTTP final-enqueue fence; этот Engineering verdict его не принимает и не дублирует как собственное установленное finding. Handoff default speaker не реализован как отдельная операция; текущая модель закрепляет общий output за host и допускает только явное personal listening. Она удовлетворяет заявленному текущему одно-speaker пути и не называется управляемой передачей колонки.

Actual Music+Cinema pending P09, P07 aggregate deployment/load/soak/restore pending, новый signed release/production/public networks/TLS/real devices/реальный каталог не приняты. Модульный scoped verdict после исправлений может разрешить следующие независимые функции; он не заменяет эти гейты. Длинные статистические suites не запускались. Production/P07 объём не добавлялся к текущему требуемому исправлению.

**COMPLETE_STOP.** Все собственные записи прекращены после публикации INDEX; повторный round выполняется только по новой source revision.
