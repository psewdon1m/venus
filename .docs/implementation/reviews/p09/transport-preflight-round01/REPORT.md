# P09 transport preflight round01: bind-гипотеза опровергнута

**Точная причина текущего RTC failure ещё не установлена. P09 runtime/EXIT остаётся FAIL/незавершённым.** Read-only проверка не меняла приложение, Docker, Git или тесты. Последний actual run `venus-p05-916133b29e2c` привязан к clean source `4f301d3892c3dc90ecac4516a97d939c4c80eb8a`, core `1606335791c4fbddd40e8fa204624c1b59568ffc0c2a515054e1261f638fb5d8`; current core независимо совпал. Точные локальные/внешние SHA256 и размеры — INPUTS.json.

## 1. Global bind не ограничивает RTC loopback

Проверен exact LiveKit1.13.10 source `e5655ac20267fa5005dccaf3f0e3bfc3ea688c07` и его gomod-pinned mediatransportutil `v0.0.0-20260821083140-f234b534b095` (полный commit `f234b534b095f875a474a8319bba4268262cf6b3`).

- В [LiveKit RTC constructor](https://github.com/livekit/livekit/blob/e5655ac20267fa5005dccaf3f0e3bfc3ea688c07/pkg/rtc/config.go#L62) используется отдельный RTCConfig; top-level BindAddresses ему не передаётся. [go.mod](https://github.com/livekit/livekit/blob/e5655ac20267fa5005dccaf3f0e3bfc3ea688c07/go.mod#L23) фиксирует конкретную dependency revision.
- [Service listener](https://github.com/livekit/livekit/blob/e5655ac20267fa5005dccaf3f0e3bfc3ea688c07/pkg/service/server.go#L239) применяет global BindAddresses к control HTTP и связанным service listeners (также optional WebTransport). Это не RTC UDP/TCP mux.
- [Dependency WebRTC config](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/rtcconfig/webrtc_config.go#L178) создаёт TCP listener по Port без указанного IP — wildcard. UDP builder получает только RTC interface/IP filters и отдельную loopback опцию.
- [UDP construction](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/transport/createmux.go#L35) перечисляет подходящие локальные интерфейсы и слушает их IP/заданный порт. EnableLoopbackCandidate добавляет loopback к допустимым интерфейсам/candidates, а не исключает eth0. Явный node_ip отдельно задаёт advertised/NAT mapping.

**Вывод:** supervisor `bind_addresses:['127.0.0.1']` сам по себе не заставляет ICE7881/7882 слушать только loopback. Ранее принятое entry-разделение control bind/RTC transport подтверждено в этой части. Менять global bind на0.0.0.0 для лечения наблюдаемого failure не обосновано и может открыть прямой control/auth bypass при другом сетевом профиле. Это не runtime-доказательство фактической доступности портов: адреса/filters/route в самом последнем daemon ещё не наблюдались данным агентом.

## 2. Что говорит actual failed run

Native capture дал live audio+video; cinema/start завершился200; WebSocket до /media/rtc/v1 открылся, затем закрылся1000. Нет /cinema/source ack и нет renew. Конечный PC имеет connection/ICE closed; supervisor к концу running с актуальной authority. Start→release по безопасному API log — **15258ms**. Cleanup completed, runner statusFAIL, clean source неизменён.

В CinemaPanel renew timer устанавливается сразу после успешного `await room.connect`, до publishTrack. Поэтому отсутствие renew за15s вместе с отсутствием source ack указывает прежде всего на незавершённый connect/RTC establishment. Это **вывод по косвенным признакам**, не установленная точная ICE/SDK причина: snapshot сохранён уже после retire/disconnect и скрывает состояние перед закрытием. Из него нельзя отличить failed ICE, DTLS/SDP negotiation, SDK timeout и lifecycle cancellation. Live capture не доказывает отправленные RTP bytes, открытый WS не доказывает успешный join/connect.

## 3. Минимальная gateway совместимость

В текущем supervisor и Venus gateway присутствуют /rtc и /rtc/v1 плюс оба validate пути; передаётся исходный query и binary/text flag WebSocket frames. Client Room.connect использует установленный signaling prefix, а наблюдаемый /media/rtc/v1 upgrade действительно состоялся. Не обнаружено source-only основания объявить корневой причиной пропущенный v1 route или принудительное преобразование всех binary сообщений в text. При этом успешный frame/SDP/ICE обмен ещё не доказан: эта проверка не выдаёт gateway PASS и не заменяет stage gate.

## 4. Самый короткий следующий диагностический шаг

До изменения bind/token/security contracts выполнить один ограниченный publisher-only путь до connect error: сохранить безопасные stage labels (capture/grant/connect/publish-video/publish-audio/source-ack), error.name/code из SDK без raw message, timestamped ICE/connection transitions и последний candidate-pair state/protocol/bytescounts **до** retire. Raw SDP, JWT, query, cookies и приватные данные не сохранять. Если ICE никогда не succeeded — проверить advertised node_ip против фактического media container address и observed ICE UDP/TCP socket/route; если pair succeeded, исследовать DTLS/SDK/track stage. Не повторять весь8-client/A-V/performance corpus до первого успешного publisher connect.

Наличие20s lease и renew после connect стоит учитывать при долгом handshake, но данный15.258s fail **не доказывает** expiry и не оправдывает ослабление watchdog/renew/ACL. Не увеличивать timeouts и не менять bind вслепую. Для stage closure всё ещё нужны настоящий publisher+7viewers, A/V metrics, negatives/revoke и остальные обязательные targeted P09 proofs.

Конкретный воспроизведённый application defect этим source-only review не установлен; устранена одна неверная root-cause гипотеза и выделен недостающий диагностический срез. P07/production/devices не приняты. Предыдущий FAIL сохранён.

## 5. Дополнительный quick-check: внешние STUN по умолчанию

**Подтверждён configuration gap, но не доказана причина текущего15s timeout.** SFU собственный WebRTCConfig не добавляет STUN при explicitnode_ip. Однако независимый [RoomManager JoinResponse builder](https://github.com/livekit/livekit/blob/e5655ac20267fa5005dccaf3f0e3bfc3ea688c07/pkg/service/roommanager.go#L1059) при выключенномTURN и пустомstun_servers добавляет DefaultStunServers. В [точной dependency](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/rtcconfig/config.go#L38) это внешние Twilio/Google адреса. Поэтому пустой serverstun_servers не означает отсутствие внешних ICE server запросов браузера.

[Пинованный SDK RTCEngine](https://github.com/livekit/client-sdk-js/blob/b6b92107809e6df4376003853be5960ba09446e1/src/room/RTCEngine.ts#L874) принимает iceServers из JoinResponse, если поле rtcConfig.iceServers не задано. CinemaPanel сейчас передаёт толькоautoSubscribe:true. Минимальная явная local-only настройка — connect option `rtcConfig:{iceServers:[]}`: пустой array задан, и SDK не подставит серверные defaults. Это сохраняет direct host candidates и ACL; не нужно открывать7880/менятьglobalbind. PublicICE/TURN позднее потребует собственного профиля. Изолированный internalDocker может блокировать эти STUN запросы; связать их именно с наблюдаемымFAIL можно только после предложенного короткого pre-retire diagnostic, не объявлять исправление доказанным заранее.

UDP7882 — штатный общий mux: конкретный pinned builder создаёт по одному socket на допустимыйlocalIP/порт и передаёт их в multi-mux. Общийпорт сам по себе не конфликтует с несколькими участниками; комнаты/ufrag разделяются RTCстеком. Внешняя route/портовая доступность для последнегоactualrun здесь не измерялась.

**COMPLETE_STOP.**
