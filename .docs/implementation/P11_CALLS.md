# P11 Calls v1 — контракт до реализации

2026-10-25, sourcebaseline dc92c892, независимыйentry01 INDEX0e9bea0e. Contract frozen BEFORE firstP11appedits/tests. Scope standalone-local functionaldevelopment, общийP07послефункций. P10nativeHOLDнеprerequisite; acceptedP09transport иv3profileбазовые. ЭтотконтрактнеполучаетPASSотсвоегоописания.

## API и согласие

Все endpoints /api/v1/rooms/:roomId/calls. Cookiepath, exactOrigin+CSRF, currentroom/member/18+/onlineWSgeneration, boundedbody/ratelimit иfinalenqueuefence обязательны. Нетnativebypass/directSFUtoken илиhostadminpair. Все mutatebody strictkeys, expected_rev>=0 и UUIDidempotency_key. При409клиентполучаетfreshstate. Idempotency replay не оживляетterminalscope, изменённыйbody409. ВreceiptнетJWT, privateoperationнепубликуетpairметаданныевroomoutbox.

- GET /calls: schema1, room_id, available, transport_ready, general:null|scope, pairs:толькосвоиpending/active, self_lease:null|{lease_id,scope_id,kind,audio,video}. Scope={id,rev,kind:general_call|pair_call,state:pending|active,members:[ID],inviter_member_id,expires_at,participants:[{lease_id,member_id}]}. Generalparticipants — общие; pairIDs/counts/причины/участникиневыдаютсяпосторонним/host.
- POST /general/join: {expected_rev,idempotency_key,audio:boolean,video:boolean}. Первыйсоздаётgeneral scope, остальныевходятвтекущийrev, максимум8. ВозвращаетCallGrant. Flags—явноеintentразрешитьданныйsourceвэтомподключении, неавтоматическоевключениеhardware. false/false—listenonly. Расширениеflagsактивногоleaseнеразрешено: выйти, выбратьыразрешения, явно войти снова; дляterminalpairнужныновоеinvite/accept.
- POST /pairs/invite: {expected_rev:0,idempotency_key,member_id}. Толькодругомутекущемуonlineпринятомучленутойжекомнаты. Инициаторсогласилсяэтимдействием, pending60s, grantещёнет. Наличиеpendingнеотключаеттекущийзвонок.
- POST /pairs/:scopeId/accept: {expected_rev,idempotency_key}. Толькоадресатpendinginvite. Подтверждаетобоих, сначалаretireстарыеCallsобоихиconfirmbackendcutoff; generalостальныепродолжаются, oldpairзакрытцеликом. Неподтверждённыйcutoff503, новогодоступанет. Новуюinvite приэтомнесамоуничтожать.
- POST /pairs/:scopeId/decline (адресат) и /cancel (инициатор): {expected_rev,idempotency_key}; terminal, replayнеоткрываетscope.
- POST /pairs/:scopeId/media: {expected_rev,idempotency_key,audio,video}; толькодвеactiveconsentingстороны, свежийCallGrant.
- POST /:scopeId/leave: {expected_rev,idempotency_key}; generalтолькосвойparticipant, pairотзывобоих. Повторыterminalбезреактивации.
- Existing /media/leases/:leaseId/renew|release переиспользуютсясkind-awarepolicy. CallGrant={schema_version:1,lease_id,scope_id,kind:general_call|pair_call,call_rev,audio,video,expires_at,signaling_url,token}; roommember/epoch/20slease/5srenew/protectedUUID ивсе4RTCpathsтакиежекакCinema.

## Данные, admission и terminal fences

Additive media migration003: room_call_scopes (UUIDid/roomFKcascade/kind/state/rev/upstream_room/APIepoch/created_by/target/sessionA/sessionB/generationA/generationB/pending_or_activeexpiry/timestamps), lease allow_audio/allow_video boolean defaultfalse. Old001/002 checksumsнепереписываются. CallsflagsдобавляютсявbindingтолькодляCalls, Cinema bindingнеослабляется. Kind-specificscopevalidator, currentpairmember/session/generation/offerобоих иниодноговосстановленногоconsent. ПолныеданныеpeerсогласиянеявляютсяpublicRoomView, не пишутсявsharedoutbox/log.

InviteTTL60s, activepair≤24hиroomTTL, ≤16pending/room, ≤1pendingoutgoing/member; ≤4activepairs, general≤8; recentterminalmetadataдо2min, общийroomretention23h/backup≤7dпрежний. ОбщийadmissionодналогическаяVenusmedia room дляCinema+Calls; ≤64leases/16upstreamrooms не повышаются. General8+Cinema8илиgeneral4+pair2+pair2+Cinema8 укладываются16leases/6upstreamrooms. Pendinginviteнепотребляетmedia capacity, actualgrantпроверяетобщийvenuebudget. Неразрешённаяpendingcutoffнеразрешаетновыйcutover/grant.

Roomleave/reaccept/socketreplacement закрываютегоpairscopes+pendinginvitesипарныеleases, generalтолькосвоюlease; roomclose/idle — всё. Exactoldlease release невыключаетновыйscope. APIboot/restore/новыйSFUepochзакрываютactiveCalls+pendinginvitesДОserving. СамscopeизстаройDBнеисточниксогласия. WatchdogvalidsetsCinema/general/pairотдельные; listenonlyвалиден, activepublisherCinemaненужендляCalls. Отзыв—protectedretire+socketclose+actualRemoveParticipant/DeleteRoom иdurablependingreceipt; sharedchildquiesceвозможенкакfailclosedfallback, UIчестнопоказываетtransportfailure.

## UI и источники

Defaultallowmic/allowcam=false, устройствапослеjoinвыключены. Явныеcheckboxesдоjoin разрешаютисточникидляlease; отдельныекнопкивключаютgetUserMediaтолькоэтотsource. Hardwarepermissiondeniedневыдаётсязаготовыйживойsource. Mutingостанавливает/освобождаетtrack/device; devicechangeсначалапрекращаетстарыйtrack, затемпробуетновый, failureостаётсяmuted. Сменаgeneration/leave/error/unmountзакрываетtracks/RTC/renew; позднийcapture/grantостанавливается/отзывается, некасаетсяновойscope. Старыйpairникогдапродолжаетполучатьновыйgeneral/privateaudio.

Camera320x180@15fps, max180kbit,VP8/noSimulcast; microphoneechoCancellation/noiseSuppression/autoGainControlзапрашиваются, actualsettingsмогутотличаться. Remoteaudio+videoсобираютсяводинvideoэлементнаpeer. Localvolume/явныйautoplayretry, mute/leaveдоступныклавиатуройвовсехсостояниях. LocalCinema/Musicduckдо20%приCallsсвосстановлениемисходнойгромкости; этонеglobalservermutation/privatepairsidechannel. CinemaиCallsвиднывsplitlayout, не смешиватьзаписываемыетрекитранспортом. Browsercaptureвыбранногопользователемисточника—неDRM. RU/EN/TR,reflow/zoom200%,reducedmotion.

## Замороженный профиль проверок (до первогоизмерения)

SamepinnedSDK/browser/SFUкакP09, ownsyntheticdeviceinputs (реальныйbrowsergetUserMediaсfixturedevicesотдельноотphysicalhardware),8contexts,3swarmup+30s/100msstats. ОжидаемыеsourceA/V реально доставлены/decodedprogress, missingmetricsне0. p95selectedcandidateRTT≤300ms, RTPpacketloss≤1%, jitter≤30ms, freeze≤2s; SFUp95≤1.6core/peak≤768MiBпри2CPU/1GiB, browserfixture8CPU/4GiB/PG1CPU512MiB. Этонеhardwarelip-sync/echo/batteryилиproductioncapacity. ДоactualgetDisplayMedia+Calls+Gamesнеутверждатьсовместимость.

Cases: general8normal; одновременноgeneral4+pair2+pair2 сразличимымиaudio/video иactualnegativeforeign/host/formerpair; mutualdecline/switch/revoke/staleJWT/all4RTCpaths/lateasync; permissionsdenied+mute+devicesimulatedfailure+autoplayretry/keyboard/reflow/RUEN/TR. Затем10s Cinema1+7+Calls8+actualGame,10sUDPblockedactualTCP/recovery≤5s, API-losswatchdog≤5s(жёсткийproductiontargetнеповышаемдо6.5), actualoldactivePGrestoredenied/primarysafe. SourceflagsfalseнеполучаютJWTsource. Explicitrevokeпослеconfirmedcutoff+заранеезаданногоboundeddrainнеполучаетновыеRTPframes. FullP07общийrelease/load/soak/restoreотдельно; нетдлинныхP03stats.

## Отключение, совместимость, откат

Versionedoperator calls_enabled=false выставляетservercapabilityunavailable, не просто скрываетUI. Safetyrelease/leaveнеблокироватьdisabledмодулем. Новоеsignedv3изданиепослефункций; 0.0.1неизменен. ОтключитьCalls, terminate/retireleases/scopes, подтвердитьcutoff, вернутьсовместимыйclient/API/image; additivetables/protectedwitnessсохранить. Incompatibleoldschema — closed-servingtrustedrecovery, неblinddown/автоDBrestore. Cinemaостаётсядоступнымпослесобственныхпроверок, fatalsharedSFUfailможетзакрытьвсёmedia. NativeP10/publicDNS/TLS/NAT/deviceclaimsнеполучаютPASSотэтихтестов.

## Profile revision 2

Current candidate client-fixture budget and rationale: ADR-039. The preceding frozen revision1/8CPU profile is historical; all8CPU failures remain. New runs use12CPU/4GiB for browser+API, same2CPU/1GiB SFU and all strict quality targets. This is not production8CPU capacity acceptance.
