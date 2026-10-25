# P09 independent transport diagnosis round02

**Найден конкретный configuration defect: catch-all node-IP rewrite вместе с loopback candidates допускает выбор loopback socket для advertised eth0 candidate.** Runtime-причинность для последнегоFAIL ещё требует короткого прогона после исправления. P09 EXIT не принят.

Exact review source `2496719326da459425aae53b15acc521034108a7`; actualfailedrun `venus-p05-8a510ce44992`. Пока оркестратор продолжал диагностику, livecheckout продвинулся: application inputs прочитаны из immutable Git blobs24967193. Они не выданы за текущие bytes нового HEAD. Exact fork livekit/ice `bab4ea37435f978883450490f1e51d6f87ec0691` прочитан без исполнения. SHA256/размеры каждого входа закреплены INPUTS.json.

## P09-CFG-LOOPBACK-REWRITE · обязательное исправление

**Место:** `infra/venus/media-supervisor.mjs`, launch config: explicit `node_ip` внутреннего IPv4 контейнера + `enable_loopback_candidate:true`. Top-level HTTP bind127.0.0.1 к этому дефекту не относится.

Цепочка по точным зависимостям:

1. [Pinned rtcconfig](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/rtcconfig/webrtc_config.go#L91) превращает вручную заданный nodeIP в host rewrite. Helper253–282 для plainIP создаёт catch-all правило без Local selector: локальный127.0.0.1 и настоящий172.23.0.2 получают один advertised172.23.0.2. По умолчанию применяется replace, не append.
2. [UDP builder](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/transport/createmux.go#L35) при enableLoopback создаёт отдельные socket на loopback и eth0 с одинаковым портом7882.
3. [MultiPortsUDPMux](https://github.com/livekit/mediatransportutil/blob/f234b534b095f875a474a8319bba4268262cf6b3/pkg/transport/udpmultimux.go#L58) собирает порядок адресов из Go map. Затем GetListenAddresses87–95 возвращает их в этом порядке. Гарантии «eth0 раньшеloopback» нет.
4. [Точный ICE fork gather](https://github.com/livekit/ice/blob/bab4ea37435f978883450490f1e51d6f87ec0691/gather.go#L526) сначала применяет rewrite, затем dedup по CandidateHostConfig (Address/Port/Network/Component), **а GetConn всё равно вызывается с исходным udpAddr**. Если первым оказался127:7882, кандидат уже advertised172:7882, но его conn принадлежит127 socket. Настоящий172 socket позже пропускается как duplicate. UDP mux selection использует исходный socket address ([udp_mux_multi.go](https://github.com/livekit/ice/blob/bab4ea37435f978883450490f1e51d6f87ec0691/udp_mux_multi.go#L41)).

Итог — корректно выглядящие advertised IP/port и совпадающие credentials не гарантируют правильный исходный FD. Пакеты браузера к172:7882 приходят на eth0 socket, а agent registration может оказаться на127 socket. Это конкретный ошибочный путь конфигурации и packet demux, а не предположение «Docker медленный». Go-map порядок делает его правдоподобным объяснением предыдущих редких успехов. **Фактический выбор loopbackFD в последнемrun не зафиксирован**, поэтому его нельзя называть уже доказанной единственной runtime-причиной.

**Минимальный фикс для данного bridge profile:** `enable_loopback_candidate:false`; ещё более строгая альтернатива — RTC interfaces/IP filter только реального nodeIP. Global controlHTTP bind остаётся127.0.0.1. Не менять vendor source/version, не отключать finalACL/lease/watchdog и не увеличивать таймауты для сокрытия проблемы. Public/NAT deployment позднее имеет собственную адресную политику.

**Достаточный следующий тест:** один настоящий publisher connect/capture на исправленном конфиге с уже существующими safeICE snapshots. После первого успеха вернуться к обязательному1+7/A-V/lifecycle P09. Reviewer тестов не запускал и приложение не менял.

## Проверенные границы последнегоFAIL

Это уже поддерживаемый dual-PC /rtc режим, поэтому прежний V1-only вывод неприменим: дваPC имеют correctlocal172.23.0.3 и remote172.23.0.2 UDP7882/TCP7881; gather доходитcomplete, ICEchecking и connect timeout, captureaudio/video live. Safe browser-local credential hashes совпадают с serverremote hashes. Supervisor к концуrunning; actualcleanupcompleted, exactrun clean/sourceunchanged. Эти факты снижают вероятность пропущенногоWSroute, неверногоbrowserlocaloffer и отсутствующегоcapture, но не доказывают правильностьsocketdemux.

В gateway/supervisor forwarding source не найдено преобразования всех binary вtext, потери исходногоquery или отсутствия /rtc маршрута. Frame finalfences/room authority остаются обязательными. Устанавливать V0/dualPC через поддерживаемый singlePeerConnection:false — допустимый единый SDK transport режим с тем же SFU; это не отдельныйP2P механизм. Но actualdualPCfail уже показывает, что сменаV1сама по себе текущую проблему не решила.

Числа агрегированныхdiscard/integrity/DTLS diagnostics не устанавливают конкретный packetdrop: текущий классификатор объединяет разные upstream причины. Не делать из этихсчётчиков точный rootcause. Raw SDP/JWT/ICE passwords не сохранялись этимreviewer; использованы только существующиеhashes и публичныйкод.

Журнал фиксирует ошибочные чтения guessedpaths/диапазона исходника и последующие корректировки; они не являются тестами. Историческиеreviews/FAIL не переписаны. P07/production/device/media-stagePASS не выданы.

**COMPLETE_STOP.**
