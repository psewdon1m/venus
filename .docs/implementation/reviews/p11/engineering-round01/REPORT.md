# P11 Engineering round01 — source preflight

**PASS_SOURCE_ONLY в перечисленной области; это dirty preflight, не P11 functional PASS.** Один найденный source-intent race E11-01 исправлен автором до завершения этого review. Его actual regression proof ещё требуется на новом clean source. S11-04 APIpeer timefences в момент просмотра меняются другим автором и здесь не принимаются. Точные наблюдённые hashes, HEAD/dirtypaths и исключённый файл находятся INPUTS.json.

## E11-01: найдено и исправлено на уровне исходника

В первой прочитанной CallsPanel.source request serial назначался **после** awaitstopSource. Старое device-change действие могло позже нового получить более свежий serial. Кроме того stopSource сбрасывал actualmicrophone/camera=false; смена selectorA→B в этот промежуток только меняла выбранныйlabel и не отменяла старыйpendingcaptureA. После await мог активироватьсяA, когда UI уже показываетB. Это нарушало last explicit intent/device lifecycle.

Авторский текущийфикс назначает serial и audioIntent/videoIntent **до первого await**, stopSource(invalidate=false) не отменяет своёновое действие, immediatecheck после await отсеиваетстарую операцию. Device selector опирается наintent, не actualcaptureflag, поэтому новый выбор замещаетpendingcapture. Mute-button умеет отменитьpendingintent; aria-busy отделяетожидание от actualaria-pressed. Stop/leave/error инвалидируютserial+intent, поздниеgetUserMedia outputs останавливаются, stale publish unpublish, catch повторяетgeneration послеstopawait. По source заявленный race закрыт.

Необходимая узкаяactualпроверка: задержанный getUserMedia→явнаяотмена/новыйdevicechoice→позднийstream полностьюended/неpublish→новаяfreshcapture; oldpublication stop completion не должен отменитьновый intent. Автор уже добавляетcase внутри существующегоDEVICEсценария; собственного теста/reviewerframework не требуется. Предыдущий код/обнаружение не выданы за уже runtimeисправленныеbytes.

## Остальные проверенные механизмы

- Explicitsourceflags поgrant и кнопкиcapture; join не запускаетhardware. Mic/camera ограничения низкогоразрешения/bitrate сохранены; devicechange останавливает старыйtrack, error остаётсяmuted, volume локальный. Lategrant сохраняется вgeneration, close ждётdone и освобождает именно ownlease; при неполученнойHTTPjoinreceipt mountedlockedgeneration может определить собственныйlease. Unconfirmed release остаётсяending/retry, не открывает новыйstart.
- Renewal5s/close/unmount/RTCdisconnect и remotepeer identity+sid закрываютстарые ресурсы; room-generation владеетcapture/RTC. Наpairtransition сначала confirmedoldclose. СтрокиRU/EN/TR/нативныеcontrols существуют; окончательный keyboard/reflow/permission/autoplayactualproof ещё нужен, source не заменяет его.
- Media kind/scoped retirement и отдельный general/pair/Cinema sourceallowlist реализованы; добавленная schema003 используетFKroomcascade/sourceflags/ограничениеstate, предыдущиеmigrationchecksums не меняются. S11-01 privatecount и S11-02 endedcutoff исправления видимы какdirtydelta, окончательный Security verdict независим. In-flight Calls.currentPair/finalpeerfence не принят этимpacket.
- Operatorcalls_enabled валидируется boolean и передаётся вfixedv3template; false выключает сервернуюcapability, не толькоUI. Старыйsigned0.0.1 не расширяется. Additive003 не делает старуюschema002 совместимой автоматически: контракт честно требуетclosed-serving trustedrecovery вместоblinddown/автоrollbackданных. Capabilityoff/retirement/protectedauthority и новыйsigneddelivery будут проверены в применимомфинальномобъёме; новогооператорскогоrestorePASS тутнет.
- ADR039 документирует новую **fixture**12CPU/4GiB ревизию после измеренного8CPUFAIL. SFU2CPU/1GiB, строгийmaxjitter30ms/RTT/loss/freeze и concurrent8Calls+Cinema+Games не ослаблены. P09fixturedefault остаётся8CPU, Callsrunner задаёт12 отдельно. Успех10старыхcases не перепривязан кdirtysecurity/UIисправлениям.
- Текущаяматрица предусматривает all11mandatorycases, actualgetUserMedia с явноsyntheticmarkers/nativecaptureCinema, парнуюизолированность, sourceflagsfalse, TCP, APIloss, realPGrestore. Это наличиеметодики, не доказательство, что все11прошли на текущемcandidate. Сохранениеqualitysamples доassert/cgroups нановомprofile требуется; rawmax33msFAIL остаётсяFAIL.

## Что нужно до функционального verdict

Остановить concurrentAPIwriter, закрепить новыеbytes/cleanrevision ипрофиль; пройти затронутыеstatic/unit и boundedactualcases (включая E11-01/S11-01…04), сохранитьqualityoffenders/ресурсы иcleanup. Затем независимыйsource delta/rebind иfinalEngineering/Security решения. Без этихproof ниPASS_SOURCE_ONLY, ни исходныйP09/P08 не закрываютP11. P07/fullG5/publicdevice/productionclaims остаютсяза рамками.

Reviewer не писалcode/tests/manifest, не выполнялтесты/build/Docker/Gitmutation. **COMPLETE_STOP.**
