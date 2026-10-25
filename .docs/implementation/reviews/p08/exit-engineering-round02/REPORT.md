# P08: независимый выходной Engineering-гейт, round02

**PASS — локальный synthetic Music component.** P08-ENG-001 закрыт; новых обязательных Engineering findings в проверенной correction delta нет. Разрешено закрытие функционального компонента и переход к следующему независимому этапу по U022/ADR035. Это не полный исходный G2, не готовность всего проекта и не PASS P07.

Exact source `70ec9416c666483a198d79db21167ebad4ea58c5`, core `7e634af0fedaa1eb5f1a38082bca4b530f8ad3418b6d91cf7db0bff09a2dcdd9`,1971files. Проверяющий — не автор реализации. Входы, узкая source delta от8600, byte/hash проверки и native наблюдения закреплены в INPUTS.json.

## Закрытие P08-ENG-001

`applyMusicSync` теперь сообщает только актуальный `NotAllowedError`; source replacement и AbortError не создают ложный blocked. Panel synchronize захватывает generation, onBlocked выключает listening ref и показывает локальный blocked/retry, фоновые250ms attempts прекращаются. Explicit enable очищает block и снова запрашивает playback; его promise сверяет live/generation/listening/src. Shared tuple не меняется локальным отказом.

Собственный read-only exact-module Node24 mock: native0, NotAllowed feedback, остановка повторов, успешный explicit retry, игнорирование AbortError/старого src и неизменный sharedrev. Это helper-proof с fakeaudio. Реальный UI и native decoder подтверждены отдельно clean Dockerround11: в Firefox и WebKit сначала играет настоящий own PCM, затем pause/shared Play при injected NotAllowedError, видимый blocked, счётчик повторов стабилен700ms, tuple rev не меняется; после удаления injection и явного retry звук возобновляется/blocked исчезает. Это actual browser flow с принудительным отказом, а не доказательство политики всех реальных устройств.

Предыдущий FAIL round01 и все его члены сохранены неизменными, INDEX9084a0ed. Исправление не стирает прежнее отрицательное наблюдение.

## Проверенная correction delta и реальные proof

HTTP state теперь использует существующий `enqueueFencedJson`; direct async reply.send после finalFence удалён. Audio больше не передаёт prefetched Readable между guard и socket: каждая ограниченная64KiB raw write выполняется синхронно после последнего room/member/session/catalog/fd fence. Drain ожидается после COMMIT, следующий chunk заново авторизуется. HEAD/close/error/idle cleanup сохраняются. Это Engineering-проверка реализации; окончательное Security/Privacy решение принимает отдельный reviewer.

Все20 файлов двух новых evidence INDEX совпали по SHA256/размеру;6preflight sourcepins совпали с exact source. Core1971 пересчитан, ROOT/W проверенные appbytes совпали, rootGitindexA4bb не изменён. Dirty correctionpreflight остаётся честно preflight:4MusicSync unit и impactedlint/API/webtypes native0. Clean runtime image/build и sourceunchanged относятся к70ec, не подменяются preflight.

Round11 native0:12PASS,8Chromium/480samples/60s p95=104.320ms(max186.202ms), Firefox157.0 и WebKit27.2 actualdecode+forcedrecovery, Music+Game actual совместимость, host/Range/room boundaries, pause/seek/restart/auto-next, reconnect/revoke и одно-speakeropt-in. Точные версии в rawp08report; не заявляется новый device support. Принимается заранее выбранный ограниченный60s component profile; исходный предложенный15min и общий P07 soak не выдаются за выполненные.

Новый delivery proof использует production Music class, настоящий PostgreSQL и настоящий Node Writable с highWaterMark1: первая raw enqueue удерживает callback/drain, HTTP close успевает COMMIT, после освобождения callback дальнейшей выдачи нет — ровно1write и destroyed sink. Это actual production-code boundary с synthetic sink, не реальный внешний slow-network/физический audio приёмник.

Actual PG16 custom dump→отдельная восстановленная DB:5rows, before/afterSHA82ac7303 совпали. Table additive/FKcascade и неизвестная future schema rejection не изменены. Protected ledgers/отозванные assets не возвращаются при code rollback; host audio вне DBbackup сохраняется отдельно. Cleanup completed, image5f4e2185, source clean/unchanged. Сам reviewer повтор общейматрицы/статистик не запускал; использованы exact nativeproof и узкий helperrecheck.

## Сохраняемые границы

- Только собственное synthetic audio и выбранный owner локальный каталог. Реальные сторонние tracks/rights **NOT_APPROVED**; операторский registry не является агентской юридической приёмкой.
- P07 воспроизводимое развёртывание/общая интеграция/load/soak/restore **NOT_RUN**, будет после функций.
- Actual Music+Cinema **pending P09**; pause hook не назван интеграционным PASS.
- Новый signed deployment включённых модулей предстоит; immutable venus-v0.0.1 не включает Music. Этот verdict его не расширяет.
- Production/DNS/TLS/внешняя сеть/физические устройства не приняты; P06 Desktop export FAIL сохранён.

Оригинальные требования, историческиеFAIL и acceptedproof не изменены. Только собственный пакет и новый журнал. **COMPLETE_STOP.**
