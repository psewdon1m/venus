# P09: Cinema и единый встроенный transport

2026-10-25: **PASS локального функционального компонента**. Два независимых nonauthor отчёта PASS; E09-01…04 и S09-01…04 закрыты, открытых findings в этом объёме нет. Профиль — functional local component по U-022, не полный исходный G3/P07/public release.

## Реализация

Один встроенный LiveKit1.13.10 на том же Docker-хосте, изолированный от БД и Docker socket. Cinema: только host публикует выбранную вкладку/экран с обязательным звуком; семь зрителей; явные capture/autoplay действия, retry, остановка при завершении источника. Одно video воспроизводит обе remote tracks. Music авторитетно ставится на паузу, Games продолжаются. Calls используют этот же transport на следующем этапе; их реализация этим отчётом не заявлена.

Cookie/Origin/current18+/member/socket-generation/scope/APIepoch/SFUepoch/20slease и protected UUID allowlist проверяются на всех четырёх RTC путях и при установленной доставке. Закрытие, leave, reaccept и revoke прекращают доступ. Подтверждённый backend cutoff отделён от pending receipt; ошибки не превращаются в успешную остановку. API-loss watchdog прекращает owned media process. V3 release profile учитывает media quiescence и authenticated maintenance readiness, не меняя выпущенный v2/venus-v0.0.1.

## Доказательства

Clean source3dad49ae02d62708977fd83aa1b3cfdfecd564eb, implementation identity1b7758fd93c67d92312d9338760c08ff63d7616615bb001cadf3a2a88ccceb40. Round25 nativeexit0,32of32tests и19mandatoryrecordsPASS; source unchanged, cleanup completed. Исторические rounds01–24/FAIL и все независимые findings сохранены.

Actual Chromium156/getDisplayMedia,1publisher+7viewers: normal p95AV66ms, glass75ms, viewer skew45ms,2100samples и35–36unique matched pulses/viewer. Метрика сопоставляет received audio track с rendered video; аппаратный/HTMLaudiooutput lip-sync ею не измерен. Native-source calibration отдельно прошла. SFU p95CPU0.120core, peak115585024bytes, egress4.970Mbit/s, RTP0loss/maxjitter3ms. Target120ms не повышался. Fixture браузеров+API8CPU/4GiB; SFU2CPU/1GiB; PG1CPU/512MiB. Это не productionAPI2CPU load acceptance.

Media-only50±10ms/.5%loss/4Mbit и UDP-blocked actualTCP playback PASS; private authority/admin в netem не ограничиваются. Отдельный actualAPI-loss cutoff2542ms<=5000ms PASS. Проверены denied/noaudio, forcedNotAllowedError+gesture retry, Games/Music, foreign origin/cookie/fourpaths, stale/valid-signed-refresh/forgedtoken, failed release/stop/reaccept retries, expiry, oldrelease-vs-newscope, sourceend, actuallive close+pendingjoin, APIrestart with pending receipt. PG16 custom dump/restore: restored open-room cookieHTTP200, old live grants denied on all4paths, protected closed-roomHTTP403. Protected files не восстанавливались из dump.

Targeted-static01 на17a41867: API/web types, impactedlint, schemas/i18n и10fastunits PASS. Производственный код со17a не менялся; поздние изменения относятся к fixture и доказательствам. Actual production-build02 сделан наa8a2ad22 с нулевым diff productioninputs до3dad; image metadata остаётсяa8a, это не подписанная поставка3dad. Binary SHA5153d7ce95fb2f2ffb455a0e4ac464be2c94a38c77c99fd728f9c61748a11381,81,133,440bytes,Go1.27.1. Pin/license/advisory audit имеет только квалифицированный локальный допуск.

## Незакрытые общие обязательства

Полный исходный G3, общий P07 load/soak/restore/regression и новый подписанный v3 install/update/recovery остаются NOT_PASS. Перед публичной поставкой нужны Node patch/coherent toolchain, полные Go/OS distribution obligations и свежий advisory disposition. Production DNS/TLS/NAT/Cloudflare и физические устройства не проверены. Известный P06 Desktop export FAIL не исправлен и не скрыт. Venus0.0.1 не переписан и не получает новых feature claims.

## Откат

Закрыть grants/retire protected leases, подтвердить остановку media child, выключить media capability/overlay и вернуть совместимый клиент/API. Сохранить additive таблицы и protected authority/retirement witness; не восстанавливать старые UUID/consents из DB. При неподтверждённом cutoff serving затронутого media закрыт. V3 state не импортировать старым v2; несовместимый image/schema требует отдельного закрытого recovery. Обычный restart не запускает DBrestore.
