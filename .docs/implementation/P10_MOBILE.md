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

P10-X01: модели/OS Android+iPhone и доступ QA, разрешённый источник с воспроизводимым video+audio. X02: Mac/Xcode/SDKexecution; WindowsDocker не заменяетiOSbuild. X03: AndroidSDK/Gradle/JDK и pinnedRTC SDK обеихплатформ сlicenses/sourceaudit. X04: devdistribution/signing/provisioning/team и выбранные OSfloors. X05: явный bounded nativecredential handoff через текущую roomauthority; realtimegeneration/20slease/5srenewal/stop/revoke, не directSFUJWT. X06: отдельный device-reachable trustedLAN/TLS/ICE profile: loopbackадрес Docker непригоден телефону, TLSvalidationнеотключать. Parentreadonly Get-Command нашёлтолькоjava, adb/xcodebuild/gradle/swiftнеобнаружены; это не исчерпывающая инвентаризациявсехдисков.

## Обязательный последующий device план

Перед запуском закрепить exact apphash/signature/nativeSDK/servercore/OS/device/source и qualityduration/samples/thresholds. Обе платформы реально публикуютvideo+audio7viewers: normal/networkchange/background/OSstop/extensiondeath/denied/noaudio/revoke/oldgrant/reconnect. Измерить A/V/CPU/battery/thermal, проверитьone-timeAndroidconsent, запретмикрофоннойподмены, unknownbuild/hostlessroom/oldgeneration, реальныеdistributioncompatibility и serverdisable/cutoff/rollback. Emulators/mocks/desktopPASS не закрывают этотнабор. P11 независим по P09 и можетпродолжаться.

## Возврат

Не включать nativeпротокол, не менять текущие browser grants/ledgers. Новый nativecandidate требует отдельной новойревизии и полной приёмки; нативныйpublisher не активируетсястрокойversion. Подготовка не закрываетP10/G4, не меняетP07/public claims и историческиепробы.
