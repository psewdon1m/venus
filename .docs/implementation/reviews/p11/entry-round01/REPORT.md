# P11 ENTRY round01 — общие и приватные Calls

**PASS входа в подготовку контракта и реализацию при обязательных fences ниже.** Это не P11 EXIT. До первого изменения приложения опубликовать отдельные versioned P11_CALLS contract/API schemas, additive data revision и численный профиль проверок: нижеследующий минимальный контракт — проверенный технический кандидат для такого документа. Реализация начинается только после фиксации этого контракта ; P10 preparation reviews к финальномуhandoff завершены в244ebbd7, acceptedpacketпроверен поSHA256.

Проверен accepted P09 INDEXb0ab93d7 и4его члена — SHA256/размеры совпали. P09 принят только functional local component, не исходныйG3/production. P10 native G4 остаётся внешнимHOLD; P11 зависит от P09, не от закрытия физического mobileG4. P10 entry прямо допускает независимыйP11. Очередь U022/ADR035 сохраняет P07 финальным общим прогоном, U023 оставляет презентации перед ним. Входы15files и observedmanagedHEAD находятся INPUTS.json; полного нового clean-source inventory/тестов этим агентом не выполнялось.

## Обязательный минимальный контракт до реализации

### API, область и согласие

Все routes под `/api/v1/rooms/:roomId/calls`, существующая path-scoped cookie, mutationOrigin+CSRF/rate limits, current18+/online member/WSgeneration, строгая схема, expected_rev+UUIDidempotency, fresh snapshot при409. Предлагаемый минимальный набор:

| Route | Минимальное действие/ACL |
|---|---|
| GET `/calls` | Общий состав/owncallstate; приватные invite/pair только если caller одна из двух сторон. Никаких paircounts/IDs/участников в публичном room snapshot |
| POST `/calls/general/join` | Любой текущий участник явно входит в общий звонок до8; первый join создаёт opaquegeneral scope, не admin capability |
| POST `/calls/pairs/invite` | Явное предложение одному другому текущему участнику этой комнаты; UUIDscope, bounded TTL; не grant и не чтение чужого currentpair |
| POST `/calls/pairs/:scopeId/accept` | Только адресат текущего незавершённого invite; подтверждает отдельное именно A/V согласие обеих сторон |
| POST `/calls/pairs/:scopeId/decline-or-cancel` | Только адресат/инициатор соответственно; terminal scope, безопасный replay без повторного включения |
| POST `/calls/:scopeId/leave` | Только собственное участие; в pair заканчивает доступ обеих сторон, в general только собственныйparticipant |
| POST `/calls/:scopeId/media` | Выдача нового минимального grant только после currentmembership/consent/captureintent; никакого grant pendinginvite |
| POST `/media/leases/:leaseId/renew-or-release` | Переиспользовать существующие раздельные renew/release endpoints, но kind-aware ACL; никакой универсальной scope/admin подписи от клиента |

Это кандидаты имён; окончательный schema обязан выбрать отдельные accept/decline/cancel формы и не принимать строку route `decline-or-cancel` буквально. Не плодить новые transport endpoints: все4RTC gateway paths продолжают одинаковую authority проверку.

Private text-chat/game consent не наследуется. Pair scope содержит ровно два roommemberID, инициатор явно согласился invite-действием, адресат — accept. Host основной комнаты не может читать чужой pair state, подписаться, accept за другого или принудительно присоединиться. Opaque foreignID даёт одинаковый неразглашающий отказ. Presence/room events/audit не публикуют pair metadata и причины отказа. Scope/generation/sessionbinding уникальны, завершённыйscope не реактивируется.

**Одна Calls-область на человека:** general или одна pair. Создание pendinginvite само по себе не меняет текущий звонок. Только mutualaccept атомарно прекращает прежние Calls leases/scopes обоих участников: general теряет лишь этихучастников, oldpair заканчивается целиком с genericended для старогопартнёра. Старые sockets/backendroutes отключаются до новогоgrant; любой неподтверждённый cutoff блокирует новыйgrant. Capture/mic/camera локально выключены до cutover, поздний promise не может включить их для новой пары.

### Минимальный media и UI lifecycle

Один уже встроенный SFU/SDK/IPv4 профиль для Cinema+general+pair, namespacesc/g/p с непредсказуемымderivedupstreamID. Calls grants только явно запрошенные microphone/camera sourceflags, закреплённые вleasebinding/JWT: no screen/data/admin/metadataupdate. Cinema сохраняет толькоscreen sources. Отсутствующийиличужойkind нельзя принять через общийtoken verifier. Cookie/room/member/current18+/WSgeneration/APIepoch/SFUepoch/20slease/5srenew/protectedUUID и binding проверяются наgrant, всех4RTCpaths, establishedframe, renewal иwatchdog.

Join/capture только явное локальное действие с понятными выбранными mic/camera; отказpermissions/listen-only и muted состояние видимы. Допустим join с mic/cam off; subsequent enable требует отдельного useraction/getUserMedia. Mute выключает отправку данного источника немедленно, cameraoff освобождает track/device; devicechange завершаетстарыйtrack до установкинового, не меняет sharedagreement. EchoCancellation/noiseSuppression requested и фактический getSettings честно учитывается; аппаратнаяэффективность не заявляется по APIflag. Localvolume неservermutation.

TransientRTC reconnect допустим только при ещё действующемscope/consent/session/lease; после terminalrevoke/WSreplacement/restart/restore — freshscope/согласие, не replayстарогоaccept. Disconnect/error/unmount/srcended/lategrant/capturepromise generation-owned; leave/mute доступны клавиатурой во всех состояниях. Cinema splitview/Calls RUEN/TR/reflow/zoom проверяются в затронутом UI. Generalmic/privateaudio не смешиваются приложением в Cinema; вход в pair прекращает generalreceive/send. Выбранный пользователем tab/systemcapture не является DRM: тесты не доказывают запрет внешней записи уже слышимого звука.

### Данные, лимиты, восстановление

Только additive checksummed schema/FKroomcascade. Окончательно закрепить до реализации: например inviteTTL60s,≤16pendinginvites/room,≤1pending исходящийinvite/member, boundedrecentterminalrecords; default venue limit1, general≤8, pair≤2,≤4activepairs. Для8участников при singleCallscope/member +Cinema8 максимум16activeleases/6upstreamrooms; существующие64lease/16backendroombounds не повышать без измерений. Admission должен учитывать Calls+Cinemасовместно, а не только активнуюCinemaстроку.

Boot/APIepoch/SFUrestart/PGrestore прекращают все activeCalls scopes и pendinginvites/consents ДОserving, protectedretirement не возвращается изDBbackup. UI mute/private намерение не восстанавливается какновоеcaptureсогласие. Roomclose/idleexpiry/leave/18+reaccept/WSreplacement отзывают соответствующиеCallscopes; primaryretention≤24h, backuppolicy≤7d какранее. Откат: capabilityoff→durableretire→confirmedcutoff→совместимыйimage/API; additiveданные/authority не откатывать в active. SharedSFU quiesce при неуспешном backendcutoff может безопасно остановить всёmedia; UI должен честно показать общуюtransportfailure, не обещать независимость прифатальномsharedprocessfault.

## Конкретные integration fences текущего кода

Это требования расширения существующего Cinema-кода, не дефекты принятого P09.

- `Media.assertLease` жёстко требует kindcinema и room_cinema_state. Нужен kind-specific scopevalidator, в томчисле currentpairmembership/двустороннееagreement, а не просто убратьcinema проверку.
- `token/gateway` sourceallowlist содержитscreen_share/screen_share_audio и hostpublisher. Calls microphone/camera и currentcallmembership должны иметь отдельный проверяемыйнабор, сохраняя отсутствиеadmin.
- `watchdog` INNERJOINroom_cinema_state и фильтр через activepublisher не годятся Calls: нужны независимыеkind-specificvalidsets; general не прекращается от ухода одногоpublisher, pair не живёт на одномconsent. Supervisor толькоauthoritativeallowlist, не вывод прав изprefix.
- `stopCinema` сейчас вызывает whole-room `retireLocked(c,id)`; после расширения это убьёт Calls. Отдельный scopedretire(kind,scope), whole-room только roomclose/boot/фатальныйfault. Повторный `release` для publisher сейчас можетDeleteRoom: generalpublisher release должен толькоRemoveParticipant, DeleteRoom — при terminalscope/zero-members; pairterminal отзываетоба.
- Roomhooks уже вызываютretireMember приleave/reaccept/consumeTicket replacement иretireRoom передclose. Расширить их наCallsscope+paircounterpart+pendinginvites; chatconsent_hooks не подставлять вместоCallsmembership.
- Pendingcutoff authority остаётся durable и не чистится какпростойrevokedrow. Safe HTTP enqueue/finalWSfence и последнееbackendcutoff подтверждение сохраняются. Новые pairprojections не попадают вpublicRoomView, sharedoutbox иобщиесписки.

## Предлагаемый bounded профиль до первого измерения

Профиль оркестратора получен **до реализации и измерений** и должен быть заморожен в P11_CALLS:8browsercontexts, camera320×180@15fps/max180kbit/s, explicitmic/camera сechoCancellation/noiseSuppression;3swarmup +30s Calls+Cinema+Games, statsinterval100ms. Для каждогоожидаемогоtrack actualnativeA/V/decodedprogress обязательны. Начальныеtargets: p95selectedcandidateRTT≤300ms, packetloss≤1%, RTPjitter≤30ms, непрерывныйfreeze≤2s; SFUp95CPU≤1.6core/peakRAM≤768MiB приcaps2CPU/1GiB, browserfixture8CPU/4GiB. Отчёт сохраняет source/SDK/browser/runtime, интервалы/числосэмплов/denominators, missingmetrics не подменяются0. Собственныеsyntheticbrowserinputs и p09actualgetDisplayMediacoexistence различаются; physicalecho/battery/hardwarelip-sync не заявляются. Нормальныетargets не выдаются автоматически заdegradedprofilePASS.
Изоляция: одновременноgeneral4 +pair2 +pair2 из техже8, отличимые собственныеaudio/video markers; host/observer/foreignscope/staletoken иformerpairmember не получаютнеразрешённыеtracks. Обе сменыпары/decline/revoke/restore негативы обязательноpositive/negativeactual, а не толькоroute403. Затем bounded10s Cinema1+7 +общиеCalls8 +однаactualGame: media/Gamesсосуществование, сохраняемыеlimits/admission. Отдельные10sUDPblocked→TCP/recovery≤5s; permissionsdenied/mute/devicesimulatedfailure/autoplayretry, lateasync, API-loss watchdog≤6.5s иPGrestoreстарыхактивныхscope. Приexplicitrevoke послеconfirmedcutoff и заранееобозначенногодренажа должныперестатьприходитьновыеRTPframes; не выдаватьужеbufferedbytes за DRMнарушение.

FullP07load/soak/release/общийrestore иphysicaldevice/публичнаяNAT/TURN/echoqualification остаютсяpending. Недоказанныеplatform claims не становятсяPASS от8контекстов. После всейреализации — толькозатронутыеtests/fix/retest идваindependentexitreview. ЭтотENTRY не требуетповтораP07/всехисторическихtests и самничего неисполняет.

**COMPLETE_STOP.**
