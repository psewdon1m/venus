# P08–P10 · Раннее исследование внешних ограничений

Статус: RESEARCH_ONLY, 2026-10-19. Разрешено планом§3; не реализация и не EXIT-P08/09/10. Сведения ниже проверены по первичным онлайн-источникам в эту дату; это не pin будущих версий SDK/server и не результат испытаний Venus.

## P08 · Происхождение музыки

CC0 допускает копирование, распространение и исполнение, включая коммерческое использование, в пределах прав, от которых отказался правообладатель. Оно не удостоверяет, что загрузивший конкретную запись обладал всеми правами, и не предоставляет гарантий; права третьих лиц могут сохраняться. Следовательно, одного поля license=CC0 у случайного файла недостаточно для Venus asset admission. [Creative Commons: CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/), [legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en).

Предлагаемый первый каталог — небольшой набор оригинальных записей с документированным разрешением от действительного правообладателя на серверное хранение и передачу участникам комнат. В asset registry до включения нужны exact file hash, автор/владелец записи и композиции, источник и доказательство полномочий, разрешённые способы использования/территории/срок, attribution, решение rights reviewer и механизм отзыва. Это предложение для ADR-004; никаких прав или assets здесь не получено. Для технических тестов допустимы отдельные синтетические сигналы, не выдаваемые за лицензированный пользовательский каталог.

## P09 · Отзыв доступа LiveKit

Официальная документация различает Cloud и self-hosted: удаление участника или изменение его permissions у self-hosted не инвалидирует уже выданный токен. Короткий TTL и прекращение выдачи новых токенов уменьшают окно, но из этого не следует немедленный запрет повторного входа. В Cloud строгий cutoff также требует учёта refresh и явного revoke_token_ts. [LiveKit tokens and grants](https://docs.livekit.io/frontends/reference/tokens-grants/).

Вывод для будущей реализации Venus: RemoveParticipant сам по себе не доказывает наш revoke gate. До ADR-001/009 нужны точный выбранный server/SDK и отдельный proof: сохранить старый и refreshed JWT, отозвать membership/publisher lease, попытаться заново подключиться и публиковать через внешний signaling, в том числе после SFU restart и повторного создания комнаты. Для self-hosted надо проектировать и проверять дополнительный авторитетный контроль допуска/поколения и завершение существующих соединений; это ещё не выбранная или доказанная архитектура. Cloud требует отдельного выбора оператора/аккаунта/стоимости. Нельзя обещать немедленный revoke только на основании TTL.

Signaling/API7880 ставится за TLS proxy; ICE использует выбранный UDP range либо UDP mux7882. При mux диапазон не используется. ICE/TCP7881 и TURN — отдельные настройки, не результат успешного HTTPS. [LiveKit ports/firewall](https://docs.livekit.io/transport/self-hosting/ports-firewall/). Нужны реальный отдельный клиент/сеть, operator-approved exposed ports и тест blocked UDP; localhost не является внешним доказательством. Venus bootstrap SFU не устанавливает.

## P10 · Мобильный захват

Android требует пользовательского согласия для каждой MediaProjection session. Для target Android14+ нужны foreground service type/permissions mediaProjection; повторное использование токена для createVirtualDisplay запрещено. Завершение projection нужно обрабатывать при user stop, lock, другой projection и process kill. [Android MediaProjection](https://developer.android.com/media/grow/media-projection).

AudioPlaybackCapture зависит от usage и capture policy приложения-источника; применяется наиболее ограничительная комбинация. Нельзя обещать звук любого приложения. [Android audio capture](https://developer.android.com/media/platform/av-capture).

Apple описывает отдельное пользовательское согласие и изолированную broadcast upload extension, получающую video/audio samples. Это не доказательство поддержки любого источника или результата на iPhone. [Apple ReplayKit security](https://support.apple.com/en-ca/guide/security/seca5fc039dd/web).

Нужны отдельные реальные Android/iOS устройства, подписывание/распространение, exact OS/SDK/source matrix и испытания protected/unsupported sources, permission revoke, background/lock, interruption/reconnect. Windows workstation и браузерные mocks не закрывают mobile gate. Эта запись не выбирает store accounts, bundle IDs или платные подписки.
