# P11 — Calls: локальный функциональный компонент принят

Общие Calls до8 участников и приватные пары реализованы на одном встроенном медиасервере с Cinema. Два независимых nonauthor гейта PASS, открытых блокирующих замечаний в этом объёме нет. Это закрытие функциональной разработки по плануv3/U022, не полный исходныйG5 и не общийP07.

## Что работает

Явный join без захвата устройств; отдельно выбранные mic/camera по умолчанию выключены, минимальные права источниковJWT. Приватная пара возникает только после текущего взаимного согласия; host не получает её состав или слушателей через Cinema. Переключение general/pair подтверждает cutoff старого scope, ошибки и повторный revoke не выдаются за успех. Stale async capture, смена устройства, отмена и unmount останавливают принадлежащие им tracks. Старые RTC-пути, session/18+/API/SFU generations и peer expiry проверяются после await перед доставкой. TTL/status cleanup ограничен своей комнатой.

Cinema/Games продолжают работу, локальное ducking не мутирует общую музыку. Общий240/min guard сохранён; Games/Music/Cinema/Calls fallback3s описан новойADR041, локальные clocks/deadlines и5s renewals прежние. Additive schema003 сохраняет001/002; совместимый feature-off restart не возрождает согласия. Это не E2EE и не проверка физических AEC/устройств.

## Фактическая проверка и точные источники

Clean9c710aa6:32/32native tests и12/12mandatory Calls records PASS, source unchanged/cleanup completed.8 отдельных Chromium процессов, synthetic native WAV/Y4M, aggregatebrowser+API12CPU/4GiB; SFU2CPU/1GiB,PG1CPU/512MiB.300frames/2400receiver samples,4800actualRTTs: maxjitter20ms при30ms,RTTp953ms,loss0,freeze121ms,SFUp95.606core/peak165691392B. Две пары, listen-only projection, failedcutoffretry, deviceintent cancel, actualTCP2participants, UI,API-loss3267ms,actualPG16oldrestore,minimalcameraJWTdenial иcompatibleoff/on PASS. Физические audiooutput/lip-sync/echo не измерены. Первые10rounds/FAIL и исходные профили сохранены.

На9c также90/90focused units в10files,types/lint/schema/i18n exit0; production-build02 unsigned0.0.0image3d5c4660e51b0cbc8e25431b1ac37401615d2b57035f79c056904eca77d11cf0,build/inspect/inventory0, состав зависимостей совпал с прежним baseline. Эта image metadata относится к9c, не к позднему source/docpin и не к новому подписанному релизу.

AffectedMusic — явно композиция12positivecase receipts, а не один all-engine native0:10Chromium/API cases наb3 (общийrun02 остаётсяFAIL из-за последующегоFirefox fixture race) плюс отдельныеclean6a Firefox/WebKit native0 сactualPG16dump/restore matchinghash. Chromium60s/480samples p95113.751ms/max146.138ms; offline2252/reconnect3016/revokeall2999ms <=4500ms приfallback3s. Поздний FF/WK testcase только ждёт фактическуюpause передforceddenial, не меняет Chromiumbody или app. Подробные источники/индексы в INPUTS.json.

AffectedCinema наclean6a:32tests/19records PASS,source unchanged/cleanupcomplete;1publisher+7viewers,A/Vp9539ms/glass92ms/skew45ms,35matchedpairs/viewer,SFU.155core/115433472B. Это receivedaudio-vs-renderedvideo в локальном стенде. ACL/retry/revoke/API-loss/actualoldPGrestore PASS.

Текущий проверенный source/docpin c6b9320a и portablecore d884b512 закреплены независимыми отчётами. App/runtime файлы не менялись после9c; поздние отличия — ADR041, P08 testcase synchronization/header comment и исправление source_inventory, одинаково исключающее административный.git как directory и managedworktreefile. Старые clean identities не переписаны и не выдаются за новый прогон.

## Оставшийся общий объём и откат

P07 aggregate load/soak/release/restore/regression не запускался; полный исходныйG5, productionDNS/TLS/NAT, физические устройства/P10native и новый signedv3delivery не приняты. Node patch/coherenttoolchain, Go/OS license-source/advisory obligations и сохранённый P06Desktop exportFAIL остаются отдельными delivery/P07 задачами. Выпущенныйvenus-v0.0.1 не изменён. Следующий функциональный блок — адаптация Preza, после функций подготовка общегоP07.

Откат: подтвердить media cutoff, выключить Calls в совместимом gen3 image/config, сохранить additive tables и protected authority/witness. Room safety exit и другие модули остаются доступны по своим правам. Не откатывать protected файлы/consents, не запускать destructive downmigration, не выдавать gen2 image за совместимый gen3 rollback. При неясном cutoff затронутый media закрыт; обычный restart не выполняет DBrestore.
