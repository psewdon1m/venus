# P10 — подготовка и незакрытый native G4

Scope: bounded preparation по P10entry01, не полный этапP10. ВходP09functionalaccepted5288bd56 / runtime3dad. Текущая реализация — servernativeclosed + browserunsupportedhandling. Обе native capture pipelines, ихсборка/device/distribution НЕ реализованы/НЕ приняты этим изменением. До первой проверки вся описанная подготовка закончена.

## Действующий контракт

GET /api/v1/rooms/:roomId/cinema/publication-capabilities возвращает native-publication.v1.schema.json только текущему принятому члену комнаты под finaldeliveryfence/no-store. Native enabled=false, accepted_protocols=[], device_qualified=false. POST /cinema/native/start проходит обычные Origin/CSRF/member/entry guards и всегда409NATIVE_PUBLICATION_UNAVAILABLE, без созданияlease/token/источника. Existing browserstart не становится native credential handoff; metadata о версии не является доказательством происхождения приложения.

Browser preflight — только securecontext+наличие getDisplayMedia. ОтсутствующийAPI и NotSupportedError даютunsupported, NotReadableError/NotFoundError — captureblocked, NotAllowedError — denied. Capture/video/audio/runtime fences не смягчены. НикакогоUA sniffing, OSsupportclaim, fallbackмикрофона, автоматическогоcapture или nativeSDKstub.

## Support matrix

| Комбинация | Код/приёмка |
| --- | --- |
| Chromium156 Linux/Xvfb + настоящийtabcapture собственногоsyntheticAV | P09qualifiedlocal fixture; не телефон и не общий hardwareoutput lip-sync |
| Иной desktop browser/source | APIprobe+actualaudio проверяются runtime; device qualification не заявлена |
| Android native screen+sourceaudio | NOT_IMPLEMENTED / HOLD toolchain+SDKpin+device/distribution |
| iOS native screen+sourceaudio | NOT_IMPLEMENTED / HOLD macOS/Xcode+SDKroute/pin+signing+device/distribution |
| Мобильный browser безgetDisplayMedia | Публикацияunsupported; room/watch по собственнымpermissions остаются |

## Что требуется для native продолжения

- P10-X01: реальные Android и iPhone/iPad, модели/OS, доступ QA и разрешённый источник с воспроизводимым video+audio.
- P10-X02: поддерживаемый Mac/Xcode/SDKexecution и Apple account/team/capability/provisioning; WindowsDocker не заменяетiOSbuild.
- P10-X03: точные Android JDK/Gradle/AGP/SDK/build-tools и Android native dependencies сpins/licenses/sourceaudit.
- P10-X04: выбранный iOS deploymentfloor/captureroute по реальным устройствам и точный iOS native SDKpin.
- P10-X05: pilotdistribution и identity — Androiddebug/privateAPK/store, iOSdev/AdHoc/TestFlight/team/bundleID/AppGroup; реальные signing/provisioning не выдумываются.
- P10-X06: отдельный device-reachable trustedLAN/TLS/ICE profile: loopbackадрес Docker непригоден телефону, TLSvalidationнеотключать.

Сохранены точные значения P10-X01…06 из INPUTS независимогоentry01. Отдельная engineeringобязанность P10-E02: bounded nativecredential handoff через текущую roomauthority; realtimegeneration/20slease/5srenewal/stop/revoke, не directSFUJWT. Это не переименованный внешнийX05. Parentreadonly Get-Command нашёлтолькоjava, adb/xcodebuild/gradle/swiftнеобнаружены; это не исчерпывающая инвентаризациявсехдисков.

## Обязательный последующий device план

Перед запуском закрепить exact apphash/signature/nativeSDK/servercore/OS/device/source и qualityduration/samples/thresholds. Обе платформы реально публикуютvideo+audio7viewers: normal/networkchange/background/OSstop/extensiondeath/denied/noaudio/revoke/oldgrant/reconnect. Измерить A/V/CPU/battery/thermal, проверитьone-timeAndroidconsent, запретмикрофоннойподмены, unknownbuild/hostlessroom/oldgeneration, реальныеdistributioncompatibility и serverdisable/cutoff/rollback. Emulators/mocks/desktopPASS не закрывают этотнабор. P11 независим по P09 и можетпродолжаться.

## Возврат

Не включать nativeпротокол, не менять текущие browser grants/ledgers. Новый nativecandidate требует отдельной новойревизии и полной приёмки; нативныйpublisher не активируетсястрокойversion. Подготовка не закрываетP10/G4, не меняетP07/public claims и историческиепробы.
