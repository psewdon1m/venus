# ADR-043 — P07, мобильный веб и техническая поставка

Статус: OWNER_DECIDED,2026-10-25. Прямое последующее решение U-025…028, user-decisions.v9.json. Дополняет активный план v3; сохранённые v2/v3 план, исходный native P10, traceability CSV и принятые proof не переписываются.

Выполнить P07 локально с согласованным профилем60min/8browsercontexts/≥10completegame sessions и REPRO/E2E/LOAD/RESTORE/PILOT. Реальная музыка подключается позже. Реальные устройства, внешние сети, DNS/TLS и эксплуатация проверяются после deployment; localPASS не доказывает их. Новое разрешение не включает фактический production deploy.

P10 заменён мобильным вебом: адаптивные Rooms/Games/privatechat/Music/Cinema/Calls/Presentations, touch/keyboard/reflow/orientation и доступные браузерные операции. Native Android/iOS apps, platformcaptureSDK, stores/provisioning/Mac больше не являются обязательствами текущего P10. Публикация экрана проверяет capability и выдаёт точное unsupported/denied/noaudio; нельзя имитировать отсутствующую поддержку или подменять звук микрофоном. Desktop emulation — проверка вьюпорта и поведения, не физическая mobile qualification. Контракт P10_MOBILE_WEB.md имеет приоритет над сохранённым P10_MOBILE.md в новомscope.

Техническая поставка требует нового согласованного Node/toolchain/base image, актуальной проверки медиакомпонента/конвертера, источников/лицензий/уведомлений и нового подписанного release. Старый venus-v0.0.1 неизменен, существующий key/secret уже разрешён. Невозможный или непроверенный внешний шаг фиксируется отдельно, не заменяется mock/fixture PASS.

Совместимость: additive schema сохраняется, protected ledgers/content generations не откатываются с PG. Web изменения не расширяют server ACL. Откат — совместимый профильv4 и featureoff, authenticated quiesce/BK2 восстановление, сохранение новых отзывов/удалений. Произвольный v3 downgrade отвергается. Старые нативные документы остаются историческими, их отсутствие реализации не препятствует новому mobileWEBscope.
