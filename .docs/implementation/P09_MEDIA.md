# P09 — Cinema и единый встроенный media transport

Статус: IMPLEMENTATION_BEFORE_TESTS. Входной независимый аудит transport-entry01 допускает реализацию с обязательными fences; это не runtime PASS. Принятый Music компонент P08 — app70ec9416, closing metadata aeb5d724. U022 переносит общий P07 на конец функций. P09 использует тот же transport, который будет обслуживать общие и приватные Calls P11; отдельного P2P нет.

## Закреплённые зависимости

LiveKit server1.13.10 sourcee5655ac20267fa5005dccaf3f0e3bfc3ea688c07; amd64 image sha256:e96a42b8623f738919a3f2006d433aeb19d0f3c67ce11eb986ea20e2cf65fbf5. Browser SDK2.23.0, Node SDK2.19.2. Root licenses Apache2 с отдельным resolved dependency/OS inventory перед freeze. Root LICENSE не объявляет весь бинарник Apache. Источники и точные source pins — independent transport-entry01. Реальный npm lock/integrity формируется при подготовке зависимостей, не подменяется предположением.

## Authority и сеть

LiveKit HTTP7880 привязан к loopback внутри отдельного nonroot Docker service. ICE TCP7881/UDP7882 доступны на том же хосте. Нет прямого внешнего RTC/admin HTTP, внешнего SFU, Redis, STUN/TURN-провайдера или Docker socket. Внутренний supervisor proxy пропускает только четыре RTC paths и необходимые RoomService RPC. RTC proxy требует backend-only secret header; RoomService проверяет подписанные admin grants. Browser не получает admin secret.

Публичный signaling — только same-origin room-scoped /api/v1/rooms/:id/media/rtc{,/v1}{,/validate}. Native/refreshed JWT сам по себе не разрешение: на каждом join/reconnect проверяются cookie, Origin, current18+, активный member/socket generation, текущая scope/lease и защищённая authority. Запрещены неоднозначные Authorization/query tokens и неизвестные RTC paths. Backend requests/query/SDP/cookies не журналируются.

Каждая lease — новый случайный UUID, связан с room/member/socket generation/API epoch/SFU boot epoch. Lease20s, renewal5s при актуальном канале; максимум64 активных lease и одна активная Venus media room на начальном измеряемом профиле. Истёкшие/retired lease не активируются повторно, включая idempotency replay. Новый запрос после нового согласия создаёт новый UUID.

Защищённый bounded active-allowlist на хосте хранит только UUID→binding SHA256 и current epoch; отдельный monotonic witness делает регрессию state fail-closed. Его нет в PG backup. Удалённый UUID не возвращается из старой БД: и PG, и текущая authority обязательны. Новые IDs добавляются только новым серверным созданием под final room fence. Authority mutation сериализуется PostgreSQL advisory lock; startup/restore меняет epoch и отменяет прежние grants. Missing/corrupt authority не provisioned автоматически; оператор явно готовит новый профиль.

Revoke сначала исключает lease из защищённой authority, закрывает pending/active proxy sockets, затем подтверждает RemoveParticipant/DeleteRoom. При отказе admin RPC supervisor quiesces весь собственный media child и подтверждает остановку. Если подтверждения нет, safety room leave/close всё равно фиксируются, но ответ не объявляет успешное прекращение media: MEDIA_CUTOFF_UNCONFIRMED503. Независимый watchdog опрашивает authority1s и при потере API/БД/serving gate не позднее5s останавливает media child. Успешный explicit stop возвращается лишь после подтверждения cutoff. Уже переданные по сети кадры нельзя отозвать задним числом.

Supervisor не получает PG/private-topic/owner signing secrets. Он владеет только своим LiveKit key и process, без Docker socket/privileges. Каждый новый child boot требует нового epoch и чистого набора grants; restart не возобновляет прежние stream. Общий host room владелец не получает прав будущих pair namespaces.

## Cinema продукт

Один host publisher и до7 viewers. Host только по user gesture вызывает getDisplayMedia; video+audio обязательны для заявленного live AV. Denied/no-audio/ended/blocked/transport unavailable показываются раздельно; no-audio не называется live со звуком. Guest не может publish, второй publisher запрещён, JWT только screen_share/screen_share_audio без camera/mic/data/admin. Subscribers явно запускают локальный звук; блокировка autoplay имеет доступный retry. Source-ended/stop/close/revoke прекращают выдачу.

Начало Cinema authoritative transaction вызывает Music.pauseForCinema; автоматического неожиданного возврата музыки после stop нет. Games продолжаются рядом с Cinema. UI RU/EN/TR, keyboard/zoom/reflow; capture/stop/leave доступны при ошибках. Calls элементы не выдаются готовыми до P11.

## Данные, доставка, откат

Состояние Cinema и lease metadata — additive checksummed PG schema, room-only FK cascade/существующий TTL. Защищённая authority/keys — отдельные host files и не откатываются DB restore. При startup все прежние media leases недействительны. Overlay только для новой совместимой dev delivery; подписанный0.0.1 не расширяется. Новая bounded operator delivery с дополнительным service/config и общий restore проверяются до финального P07; произвольные compose/образы не становятся доверенными через env.

Откат: capability-off, durable retirement, подтверждённый cutoff собственного media process, совместимый API/client/image; additive tables не удалять, protected authority не восстанавливать из backup. Не менять соседние проекты/Exocortex/Updater.

## Профиль проверок до первого теста

После всех code changes — только impacted types/lint/unit/actual API/media/browser. Без больших P03 статистических suites. Docker host input:16CPU/33.6GB; app≤2CPU/1GiB, SFU≤2CPU/1GiB, browsers≤4CPU/4GiB, DB≤1CPU/512MiB. Admission одного активного Venus media room подтверждается отрицательным вторым запросом.

Normal: один publisher+7viewers,3s warmup+30s measurements, interval100ms для video clock/skew, video timing/pulsed original synthetic audio≥20matched AV samples. Proposed ADR009 targets сохранены: normal p95AVoffset≤120ms, viewer skew≤500ms, glass-to-glass≤2s. Часы source/viewers калибруются по локальному fixture clock с RTT uncertainty; synthetic track source и actual browser tab getDisplayMedia со своим синтетическим содержимым различаются в отчёте. Screenshot/frame callbacks не подменяют факт remote audio receipt.

Degraded: отдельные короткие10s throttled/jitter и10s UDP-blocked→TCP fallback profiles; режим/потери/RTT и recovery≤5s после восстановления фиксируются, нормальные AV targets на degraded не объявляются автоматически PASS. Browser synthetic PCM/AV не означает поддержку чужого protected content или реальных OS/device captures.

Измеряются SFU cgroup CPU/RAM/egress и WebRTC loss/jitter; начальный normal cap p95CPU≤80% от2CPU, RAM≤768MiB, loss≤1%, jitter≤30ms. Превышение требует честного снижения admission/исправления и повторной проверки, без подгонки отчёта. Финальный P07 остаётся отдельным whole-stack load/soak/release/restore.

ACL negatives: all4gateway paths, cookie/Origin/foreign room, guest/second publish, stale/native/refreshed JWT после revoke/restore, pending join-vs-close, explicit remove, API/gateway/SFU/watchdog/admin failure, no-audio/denied/ended. Проверяются Music pause и Games coexistence. Public NAT/TURN/DNS/TLS/Cloudflare и физические Android/iOS остаются NOT_RUN.

## Новая доставка v3 и совместимость

Фиксированный compose.media.standalone.yml + release_environment=standalone-local-media-v3 составляют отдельный устанавливаемый профиль. Подписанный bundle обязан побайтно совпадать с установленным template; driver дополнительно сверяет v3 с собственным template. Исходные v1 release contract, compose.standalone.yml и0.0.1 не изменены. Их v2 executor конфигурация остаётся применимой. Переключать уже установленный0.0.1 на v3 одной заменой config нельзя: для v3 нужны новый явно подготовленный state root, новый image с media binary и собственная подписанная release. Между совместимыми v3 releases сохраняется обычный update/rollback; capability-off не восстанавливает старые leases.

Явное первоначальное provision(root,credential,{media:true}) / provision.mjs ROOT CREDENTIAL --media готовит media key+authority UID1000. Startup ничего не создаёт. media service получает только key, app — authority; release/private signing key отсутствует в обоих. stop/backup/restore проверяют остановку обоих containers по точному Compose project/service identity, даже при capability-off. Backup по-прежнему PGcustom≤128MiB, protected files/key не входят. Тестовый v3 release не означает новую публикацию или замену0.0.1. Новая публичная подпись после общего завершения остаётся отдельным гейтом.

v3 сейчас намеренно localhost pilot: ICE advertised127.0.0.1 и два host ports7881TCP/7882UDP, signaling same-origin; внешний NAT/domain/TURN не квалифицирован. В Docker browser fixture ICE использует адрес внутреннего media container. Среда fixture изолирована; synthetic key никогда не публикуется.

Fixture network revision: browser и media используют обычный локальный Compose bridge без опубликованных host ports. Browser дополнительно подключён к прежнему internal PG network; media не имеет маршрута к PG. В полностью internal network без default route Chromium в фактическом round06 завершил ICEgathering с0local candidates, хотя получил172.x SFU UDP/TCP candidates. Новый profile даёт браузеру обычный default route, как у реального клиента. Это проверка локального transport, не доказательство отсутствия любых исходящих пакетов: внешние STUN/TURN запрещены явнымrtcConfig.iceServers=[] и fixedserverconfiguration; новых внешних service dependencies нет.

Chromium fixture получает --disable-features=WebRtcHideLocalIpsWithMdns: адреса принадлежат только собственному Docker bridge. Это не browserproduction setting и не изменяет API/consent/capturepermissions. Реальное getDisplayMedia остаётся, SDK/WebRTC/DTLS/SFU не подменяются; ограничение сетевой квалификации сохраняется до физического/publicnetworkприёмочного прогона.

Native signaling compatibility: pinned SDK Room(singlePeerConnection:false) явно выбирает поддерживаемый /rtc V0. Это один и тот же SFU для Cinema/будущих Calls, не отдельный P2P transport: внутри SDK два RTCPeerConnection выполняют publisher/subscriber роли. V1 offer-with-join в текущемpin завершался15sICE timeout при доступномTCP/UDP и корректныхадресах; SDK сам содержит V0 fallback и описание ICEпроблем offer-with-join. Выбор стабильного поддерживаемого режима проверяется следующим раундом. Все4gateway routes сохраняют одинаковые authority fences, положительный productprofile закреплёнV0.

## Исправления независимого security review round01

S09-01: additive migration002 хранит pending cutoff по lease; неподтверждённые записи не удаляются таймером. Повтор stop/release/reaccept заново подтверждает backend cutoff, а не принимает terminal/revoked state за успех. Неизвестные scope/lease не объявляются успешной остановкой.

S09-02: v3 operator healthy дополнительно вызывает HMAC-only /internal/v1/media/prepare при закрытом serving gate. Эта maintenance-команда исключает старые lease из protected authority, подтверждает остановку прежнего child, запускает пустой child и реально проверяет admin ListRooms. Consumer barriers не обходятся; running/RTC/grants остаются закрыты до обычного current-authority poll после commit/open. Preparation grace ≤4s, не продлевается повторным probe; нет подтверждения — gateFAIL. Обычный v2 health не меняется.

ICE: loopbackcandidatefalse исключает alias loopbackFD при explicitnodeIP rewrite; HTTPbind127 остаётся. Временный debug/credential-hash instrumentation удалён. Возвращён SDK default single-PC V1 и обычный browser mDNS; они не были доказанной причиной. Normal/degraded repeats проверят итоговые байты.

## Normal profile revision2 до повторного испытания

Порог120ms/30s/≥20matched samples и семь получателей сохранены. В предыдущей реализации два отдельных HTML elements не давали браузеру единую точку AVplayout. Исправление приложения — обе remote tracks в одном HTMLvideo/MediaStream, одинаковый named publication stream. Измерительный tap перенесён с сырого remote AudioStream на MediaElementAudioSourceNode этого реально воспроизводимого video; analyser подключён к null-sink output. VideoRVFC/encodedtimestamp остаются, никаких искусственных delay/смещений для подгонки не добавлено. Исторический round16 FAIL125ms сохранён как прежняя методика/source, новый результат не переписывает его.

Open v3 readiness — HMAC read-only currentepoch/running, child/grants не меняет; closed mode выполняет описанную preparation. API boot и неизвестный bootUUID не считаются cutoff receipt: pending flags сохраняются до подтверждённого backend/supervisor cutoff. Старый lease release ограничен своимUUID/upstream scope.

## Normal profile revision3 перед повтором

Round18 подтвердил blocked/retry и open-readiness, но Chromium MediaElementAudioSourceNode на srcObject дал ноль детектированных pulses; этот tap неприменим, PASS не выдан. Возвращён исходный работающий createMediaStreamSource от реально полученной audio track (в теперь общем remote video stream), без изменения output. Это проверяет received audio, не обещает аппаратный loopback. Приложение остаётся с единымAVплеером; capture/publication повышены15→30fps для уменьшения квантования видео в120msbudget, maxbitrate1.5Mbpsсохранён. Нормальные CPU/RAM/egress измеряются заново. Никакого изменения target/искусственной задержки или offset компенсации.

## Normal profile revision4 до нового испытания

Independentav-source-round01 выявил несогласованность synthetic input clocks и level-triggered double counts. Новый собственный источник заранее schedule1Hz по одному AudioContext epoch; flash использует стандартный getOutputTimestamp audibleoutput clock, timestampmarker остаётсяDate.now. Оба детектора — hysteretic risingedges, matching one-to-one, без вычитания offset/компенсации. Один headerreadback вместо40/frame, ненужные synthetic destination/canvascapture streams удалены; захват остаётся actualgetDisplayMedia browser tab. Video явно прокручен в видимую часть viewport передRVFCmeasurement. Sourcecalibration остаётся отдельной диагностикой, не gatePASS.

На неизменном старом профиле round20 native dockerstats sample2026-10-25T02:51:25UTC: общийbrowser/APIfixture385.63% CPU при cap4core,2.177GiB/4GiB; SFU9.49%CPU/106.4MiB. Поэтому отдельный measurementfixture семи браузеров+capture+API получает cap8CPU/4GiB на16CPUhost; это не повышение бюджета VenusSFU2CPU/1GiB. PG теперь явно cap1CPU/512MiB. Browsercap не означает8CPUusage и не доказывает productionappCPU; отдельный deployment/load остаётсяP07. СтарыйprofileFAIL сохранён, новый профиль не принимается автоматически. AV120ms/skew500/glass2s/30s/≥20samples и SFUlimits неизменны. QualityFAIL теперь сохраняется и позволяет выполнить остальные lifecyclecases; итоговыйPASS всё равно требует ВСЕ обязательные recordsPASS.

## Degraded media profile revision5 перед повтором

Round21 исправленный1Hz clock дал normalAV69ms/glass78/skew50/2100samples PASS; SFU.113CPU/116MB. Root-qdisc4Mbit одновременно ограничивал privateauthority4300/admin7890 и media, тогда какnormalmediaegress4.92Mbit; после degraded появились PGpool errors и источникfailclosedдоTCPcase. FAIL сохранён. Новый fixedtcprio filter применяет тотже50±10ms/.5%/4Mbit только SFUsourceports7881/7882; privateDockercontrol не замедляется. Control-loss отдельно проверяется обязательным API-loss watchdog. Полного100%networkfailure supportclaim нет.

Native-source calibration использует временный видимый muted clone того же capturedstream, чтобы не зависеть от throttled local preview вне viewport; waveformtap прежний. ≥100decodedframes/≥5unique1Hzpairs/p95≤120 квалифицируют sourceinput, безsubtractoffset. Непрошедшая калибровка делает итогFAIL, но не мешает выполнить остальные обязательные функциональные проверки.
