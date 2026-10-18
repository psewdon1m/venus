# P00 · Проверяемые сценарии интерфейса

**Ревизия:** P00-2 · **статус:** текстовые flow boards подготовлены; визуальное и независимое UX acceptance `NOT_RUN`. Источники — [03](../03_VISUAL_DIRECTION.md), [04](../04_UI_UX_AND_INTERACTIONS.md), [08](../08_RELATIONSHIP_ENGINE.md). Макеты не выдаются за приложение.

## Общий договор каждого flow

Один desktop stage + collapsible participants, на mobile single stage + bottom navigation/sheets. Persistent state комнаты не зависит от фокуса Games/Cinema/Lounge. Атмосфера: холодный дождливый город снаружи, тёплый интерьер/матовая бумага внутри; исходные moodboard-only изображения не production assets. UI labels доступны RU/EN/TR; ошибка server code локализуется клиентом. Загрузка, empty, ready, pending и error различимы.

Для каждого flow обязательны ширины 320/375/768/1024/1440/1920, высоты 568/667/768/900/1080, landscape, zoom200%, keyboard-only, reduced motion и RU/EN/TR stress. Touch targets ≥44px; focus-visible; критические действия не прячутся под клавиатурой/safe area. Overflow доступен touch/keyboard при скрытой полосе; длинные тексты не обрезают decline/stop. Dialog trap возвращает focus инициатору, Escape закрывает обычный overlay, не подтверждает согласие.

| ID / требование | Вход → действия → результат | Ошибки / отказ / восстановление | Приёмка |
|---|---|---|---|
| UX-01 / V-003,004 | Landing → создать → явно выбрать online/in_person, locale, имя → room+invite | network fail не создаёт fake room; повтор с тем же key; empty/слишком длинное имя | ≤2 смысловых шага после landing как usability target; имя plain text, live error, focus первого ошибочного поля |
| UX-02 / V-002,004 | invite → язык → имя → join → replace URL на room без invite secret | expired/full/invalid/reconnect; 9th не попадает внутрь; same-name новый user не получает старую identity | RU/EN/TR picker словами; keyboard join; invitation failure не раскрывает чужие данные |
| UX-03 / V-005,012 | room shell → Games/Cinema/Lounge focus; invite/settings reachable | disconnected banner остаётся до recovery; будущий модуль unavailable | состояние/8 capacity/host видно; смена фокуса не меняет музыку/игру; mobile tray не закрывает exit |
| UX-04 / V-008,009 | my settings → 1…7 outgoing relation entries → один comfort0…4 → explicit submit/skip | никто не редактирует за другого; active/paused read-only; skip пишет neutral explicit=false | host видит только ready; arrow keys slider + textual value; own privacy copy; saved settings между сессиями |
| UX-05 / V-007,009 | mode → 2…8 IDs → personal readiness → rounds default20/custom1…100 → pre-start → Start | insufficient pool/absent setup/409; нет тайного timeout skip; двойной start один session | summary scope/context/rounds и только own preferences; безопасный error не предлагает повысить comfort |
| UX-06 / RE-014 | Questions → localized prompt/actor → ответ/skip → host next | decline/stop доступны без объяснения/штрафа; offline action явно pending | один card ID для трёх locale; aria-live не перечитывает карточку бесконечно; stage label не раскрывает pair class |
| UX-07 / V-007 | Truth or Dare → выбор словами → reveal выбранной стороны → response | обе стороны в одной границе риска; выбор синхронизирован сервером | клавиатура и reduced-motion без flip; hidden side не повышает допустимую интенсивность |
| UX-08 / V-007 | P1 предложение → P2 да / собственное «но» / нет → outcome | не предзаполнять условие; private text только scoped; отсутствие ответа не accept | responder на своём языке; отказ без публичного автора/причины; next не выполняет действие за человека |
| UX-09 / V-010 | private neutral invite каждому → два accept → private prompt/channel → done/stop → common room | TTL30s → отказ; одна сторона decline/revoke/disconnect → нет доступа; capability off запрещает online private | остальные видят generic pause без card ID/actor list; in_person не требует доказательства ухода; chat входит в G1 по принятому U-001 |
| UX-10 / V-011 | completed/aborted → summary без pair/comfort stats → replay/edit → new session | новый seed/snapshot, без прошлых consents; exit Games сохраняет draft | доступ к edit только после session; repeat не копирует card sequence; music не останавливается от navigation |
| UX-11 / RE-010,013,015 | транспорт пропал → reconnecting → fresh scoped snapshot → прежний session | retry не делает новую mutation; new pack/locale/member не переписывает snapshot | focus сохраняется разумно; stop не изображается подтверждённым без ACK; чужой private cache очищен при revoke |
| UX-12 / V-006,013,014 | будущий music/cinema → host action → фактическая readiness/audio status | no audio/autoplay/DRM/source ended/UDP failure → причина/retry, не fake live | G1 unavailable; позднее local volume, one speaker in_person, Cinema pauses Music по умолчанию; media matrix P08…P10 |

## Copy и локализация

P01 создаёт реальные locale catalogs со стабильными ключами `room.capacity_reached`, `game.settings_locked`, `consent.accept`, `consent.decline`, `game.stop`, `connection.reconnecting`. До их появления нет заявления о переводе всего UI. Screen reader labels, ошибки, plural/time и keyboard hints включаются в те же каталоги. Имена не склоняются автоматической конкатенацией, Turkish İ/ı/Ş и Cyrillic проверяются на реальных строках.

## Запись результата review

По каждому UX-ID: reviewer, revision, layout/locale/device profile, ожидаемое/наблюдаемое, screenshot/record URI без private данных, defect ID. Сейчас эти поля остаются `NOT_RUN`; таблица задаёт последовательность и критерий будущего теста.

## UX-00 · Вход: оферта и декларация18+

При открытии сервиса до create/join показаны читаемый текст/ссылка действующей оферты и две неотмеченные проверки: принять текущую оферту и подтвердить18+. Доступность обеих — keyboard/screen reader/locale/zoom; отказ выводит из сервиса без создания identity. До утверждённого текста нет public entry. Отправка create/join/resolve содержит version/digest и явные true declarations; сервер проверяет, а не доверяет localStorage. Повторный вход использует server record и актуальную версию; reacceptance не блокирует stop/decline/leave. Test IDs: ENTRY-001…005, runtime P02/P05.
