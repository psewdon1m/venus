# P10 — мобильный веб v1

Действующий scope U-026/ADR-043,user-decisions.v9. Исторический native контракт P10_MOBILE.md сохранён и текущим этапом не исполняется. Новый P10 не требует Android/iOS apps, SDK, Mac, stores, provisioning и нативного screen publisher.

Обязательные функции: вход18+, комната/приглашения, настройка участия и игры3режима, приватный текстовый канал, Music, просмотр Cinema, общие/парные Calls и PDF библиотека/личный/liveпросмотр. Действуют существующие host/member/consent/ACL/TTL/revoke/barriers. Все доступные media требуют пользовательского действия и текущих разрешений браузера; отсутствие screen+sourceaudio API показываетunsupported/denied/noaudio без заменымикрофоном.

Первичные правки: viewport-fit=cover и safeareaотступы включаяlandscape/диалоги; invite readonly input вобычномTabпорядке. Сохраняются44pxконтролы, responsiveonecolumn иvideo playsInline. Показателями проверки являются scrollWidth безгоризонтальногопереполнения, видимые/достижимые кнопки/полеотправкичата, focus, touch, ориентация иRU/EN/TR.

Матрица:320/360/390/430portrait,640×360и844×390landscape,768tablet;3locales. Проверяются реальные доступные webоперации вbrowserengine сtouch emulation/viewportchanges. Короткийviewport сcompose проверяет reflow; это НЕ подтверждение поведения OSклавиатуры. Реальные устройства/браузеры/сети проверяются послеdeployment (U-027); desktopemulation неdevicequalification.

Exit: scopedwebproof, совместные currentV2modulechecks, дванезависимыхnonAuthorreport PASS, точныеinputs иrollback. Native отсутствие неblocker и неnativePASS. ОткатUI ксовместимомуобразу не откатываетданные/согласия, safeexitдолжен оставатьсядоступен.
