# P08: функциональный музыкальный компонент принят

2026-10-25T00:48:39.521338+00:00. **PASS в локальном объёме разработки.** Два независимых round02 отчёта приняты; ENG001, S01 и S02 закрыты. Можно последовательно переходить к P09 и презентациям. Полный исходный G2/P07 и production этим решением не закрываются.

Ревизия приложения `70ec9416c666483a198d79db21167ebad4ea58c5`, core `7e634af0fedaa1eb5f1a38082bca4b530f8ad3418b6d91cf7db0bff09a2dcdd9`,1971 implementation files. Clean Docker round11: native0,12cases PASS, исходники не менялись, cleanup completed. Изменения журнала/этого отчёта — closing metadata, не новый CI-проверенный application commit.

## Что реализовано

Локальный host-file каталог с hash/magic/rights/expiry и границами ресурсов; room-scoped native audio с Range, 18+/session/generation/retirement checks; host очередь и управление, server anchor/auto-next, локальная громкость, явное включение звука, один default speaker очно, RU/EN/TR. БД additive и checksummed. Новая таблица входит в PG backup.

Независимые проверки нашли поздний autoplay denial и два delivery gaps. Исправлены feedback/retry, синхронный fenced JSON и raw audio enqueue каждого64KiB; ожидание drain выполняется после COMMIT без room lock. Старые FAIL, ошибочные тестовые ожидания и исправления сохранены в rounds01–11; снимки/traceability CSV/accepted P05/P06 proof не переписаны.

## Проверено

- Linux catalog/Range3unit, MusicSync4unit; impacted lint/API+Web types/schema/i18n PASS. Dirty preflight отделён от clean Docker.
-12 actual cases: ACL/replay/revision/Origin/Range/foreign session, pause/seek/restart/auto-next;8Chromium native audio и local volume; реальный Games start; offline/reconnect/catalog revoke; очной explicit output и leave/close/idle/schema fences.
- Firefox157/WebKit27.2: native PCM decode и принудительный поздний NotAllowedError → blocked UI → нет фоновых повторов → явный retry → воспроизведение; общий tuple не меняется локальным отказом. Chromium156:480samples60s после2s warmup, p95=104.320ms, threshold300ms. Это bounded component profile, не15min/physical-device или общий P07 прогон.
- Реальная production Music с PG и медленным Node Writable: close COMMIT во время held drain, один raw enqueue до revoke, последующего нет. Browser endpoints отдельно проверены реальными HTTPS/native audio запросами.
- PG16 custom dump→отдельная restore DB:5rows, одинаковый hash82ac7303…; это новая таблица, не полный новый signed stack restore.

## Отдельно остаётся

U024 выбирает host files, но не даёт неизвестным трекам rights approval. Оригинальные synthetic WAV используются только в явном local-pilot. Реальные треки подключаются отдельно. Audio assets/registry не входят в DB dump и сохраняются на хосте отдельно.

Actual Cinema pause проверяется на P09. Подписанная доставка нового набора модулей и общий P07 load/soak/restore — после функциональных этапов. Восемь браузерных contexts не означают восемь телефонов. Public ICE/NAT/TLS/DNS/production/device support не заявлены. Принятый0.0.1 неизменён; известный Desktop image export FAIL P06 сохранён.

## Откат

Прекратить доступ к каталогу/потокам, убрать optional overlay/env и вернуть совместимый код; additive таблицу не удалять, protected ledgers не откатывать, revoked rights/asset не активировать заново. Полный сбой музыки не требует удаления комнат/игр.

Машинные inputs, acceptance ledger и decision закреплены INDEX.json. Все независимые writers завершены до manifest freeze.
