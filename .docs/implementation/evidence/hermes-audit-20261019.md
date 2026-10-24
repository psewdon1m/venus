# Hermes: исходный аудит для автономного Venus

Дата: 2026-10-19. Автор проверки: `/root/hermes_audit`. Это исследование исходников и воспроизводимые локальные пробы отдельных функций, **не приёмка P09/P11 и не испытание звонков**.

Зафиксирован фактический HEAD [Hermes `7fa332888068ccd41bbc4b949b7dcf8c536ba3d5`](https://github.com/psewdon1m/hermes/tree/7fa332888068ccd41bbc4b949b7dcf8c536ba3d5). Read-only clone: `C:\Temp\venus-hermes-audit`; foreign worktree чист. В [машинном отчёте](hermes-audit-20261019.json) приведены SHA-256 сырых Git blob всех 68 tracked файлов, результаты 22 синтаксических проверок, границы JWT-пробы и 12 находок. Рабочие CRLF не выдаются за Git blob.

## Вывод и границы повторного использования

Hermes полезен как образец двухстороннего WebRTC: perfect-negotiation, замена треков, восстановление после разрыва, prejoin-разрешения, остановка захвата, краткоживущие TURN credentials. Его API, авторизацию и UI нельзя перенести в Venus без переработки. Для комнатного звонка на восемь человек существующий клиент недостаточен.

Рекомендуется реализовать Venus MediaSession и серверные контракты внутри Venus, используя проверенные идеи Hermes и прямые браузерные API; не подключать Hermes как отдельную платформу, не переносить Telegram bot, Redis call-state, logger, исходный Caddy UI и внешние агенты. При фактическом заимствовании конкретных строк записывать исходный SHA/файл/диапазон и локальные изменения; это исследование ещё ничего в приложение не копирует.

В дереве нет LICENSE и поля license в package.json. Прямое указание владельца «наш проект, взять если полезен» является разрешением в рамках задания. Оно не устанавливает происхождение всех SVG/PNG или разрешения третьих лиц; ассеты в Venus не импортированы. Это факт о provenance, а не требование остановить инженерную работу ради документов для друзей.

## Фактическая архитектура

- Node/Express API создаёт bearer join token/код; Redis хранит состояние звонка и лимитеры.
- Node/ws передаёт SDP/ICE между участниками; `MAX_PEERS_PER_CALL` по умолчанию 2.
- Медиа идёт P2P напрямую или через coturn. SFU в Hermes отсутствует.
- Browser `MediaSession` содержит один `RTCPeerConnection`; `SignalingSession.pickOtherPeer()` выбирает одного собеседника. Один remote display. Простое увеличение серверного лимита до 8 не создаёт групповой звонок.
- Docker Compose размещает Caddy, API, signalling, Redis, coturn, bot, logger на одном хосте. Эта поставка не является готовой конфигурацией Venus.

Опорные исходники: [signalling](https://github.com/psewdon1m/hermes/blob/7fa332888068ccd41bbc4b949b7dcf8c536ba3d5/signal/src/server.js), [single peer selection](https://github.com/psewdon1m/hermes/blob/7fa332888068ccd41bbc4b949b7dcf8c536ba3d5/web/signaling-session.js#L194), [peer connection](https://github.com/psewdon1m/hermes/blob/7fa332888068ccd41bbc4b949b7dcf8c536ba3d5/web/media-session.js#L566), [Compose](https://github.com/psewdon1m/hermes/blob/7fa332888068ccd41bbc4b949b7dcf8c536ba3d5/docker-compose.yml).

## Что требуется переписать для Venus

1. **Admission и адресация.** JWT проверяется только на `callId`; `peerId` приходит из query и не связан с участником Venus. Нужна серверная идентичность, активная room membership, поколения комнаты/звонка/пары, разделение общего и приватного пространств, авторизованный target. Приватный звонок создаётся только после двух явных согласий; его события, SDP и ICE не транслируются остальным участникам комнаты.
2. **Проверка каждого действия.** Текущий сигналинг ретранслирует произвольный `type/payload`, не перепроверяет ACL, срок токена и отзыв после подключения. Нужны bounded schemas/allowlist, атомарное ограничение вместимости, запрет публикации observer, ограничения размера/частоты и проверки membership/consent/generation на каждом управляющем действии. Существующий list-then-add Redis не доказывает вместимость при гонке.
3. **Токены.** JWT-helper из точного исходника в изолированной пробе принимает подписанные missing/string `exp` и непроверенный header. Valid принят, expired отклонён. Использовался только синтетический ключ; это не утверждение возможности подделать HMAC без секрета. Для Venus нужны штатная библиотека с фиксированным алгоритмом, обязательные типизированные claims, purpose/audience/issuer, короткий срок, серверная сессия и поколение. Bearer URL и reusable 24h links Hermes не переносятся.
4. **Отзыв медиа.** У Hermes нет авторитетного server-side прекращения уже установленного прямого P2P потока. Отзыв токена или закрытие WebSocket сам по себе не закрывает прямой peer connection у модифицированного клиента. Нельзя назвать такой тест доказательством немедленного отзыва публикации. Браузерный `pc.close()` завершает потоки на исполняющем его клиенте; это отдельная операция ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/close)).
5. **Коды и лимитеры.** Активный route создаёт OTC через `Math.random`, не резервирует уникальность с NX, разрешает OTC через отдельные GET/DEL. Лимитеры при Redis error пропускают запросы; это не означает fail-open всей API-авторизации. Доверие к forwarded IP требует собственной proxy boundary Venus.
6. **Логи.** Не переносить произвольные client logs и SDP/debug в общий observer sink. В Venus нужны ограниченные служебные события без bearer credentials, SDP, ICE и текста приватного пространства.

## Групповой транспорт: встроенный сервер на одном хосте принят

После первоначального OPEN пользователь выбрал «Встроенный медиасервер на том же хосте». Это разрешает внутренний SFU-контейнер в Docker Venus; отдельный SFU-хост и внешняя платформа не нужны. Ни Hermes, ни новый media server этим аудитом не устанавливались.

| Вариант | Минимальная реализация | Ограничение |
| --- | --- | --- |
| P2P mesh без SFU | `Map<peerId, PeerConnection>`, маршрутизация по парам, 2–8 участников, отдельные private pair namespace, coturn на том же хосте | 7 исходящих копий на участника при 8 людях; авторитетный отзыв уже прямого медиа против изменённых клиентов не доказуем одним сигналингом |
| Внутренний media broker/SFU на том же хосте | Управляемые producers/consumers, серверное закрытие публикации/подписок, один deployable Compose Venus | Требует подтверждения, что запрет касался отдельной SFU-инфраструктуры; серверная пересылка/нагрузка и браузерная совместимость должны быть испытаны |

Принятый инфраструктурный вариант — второй. Конкретная рекомендация для следующего технического spike: self-hosted LiveKit как внутренний контейнер того же Compose, Venus API как единственный источник grants, отдельные media room namespaces для общего звонка до 8 и приватной пары до 2, выделенная публикация Cinema. Hermes оставить источником идей prejoin/track lifecycle, а не auth/server foundation. Это рекомендация выбора компонента, не уже реализованная или принятая библиотечная версия. До внедрения закрепить image digest, SDK versions, license/NOTICE и транзитивные лицензии. У LiveKit server присутствует [Apache-2.0 LICENSE](https://github.com/livekit/livekit/blob/master/LICENSE); этот факт не лицензирует Hermes или его ассеты.

Server-side disconnect и запрет новой публикации должны проверяться вместе с прежним и обновлённым JWT, reconnect и generation сменой. Само наличие SFU или вызов RemoveParticipant не доказывает необратимость отзыва reusable bearer token. Требуется Venus admission layer, а при необходимости fail-closed замена/закрытие media namespace и актуализация grants для всех участников. Точный механизм фиксируется отдельным контрактом и негативным browser test до PASS.

Для локального профиля можно начать с API/WSS 7880 за внутренним reverse proxy и UDP mux 7882; ICE/TCP 7881 и TURN включать и тестировать отдельно. Это параметры из [официального self-hosting port reference](https://docs.livekit.io/transport/self-hosting/ports-firewall/), а не открытые сейчас порты. При разрешённом embedded TURN отдельный coturn не обязателен; не нужно приносить весь Hermes stack.

Расчёт mesh, **не измерение**: `n(n−1)/2 = 28` соединений, 56 направлений; на пользователя 7 исходящих и 7 входящих потоков. При условных 1 Мбит/с video на каждую копию это 7 Мбит/с uplink каждого клиента. При полном TURN relay агрегатно примерно 56 Мбит/с ingress и 56 Мбит/с egress хоста без RTP/RTCP/DTLS, retransmit и audio overhead. Один Cinema presenter отправляет 7 копий. Однохостовая инфраструктура не превращает mesh в одну исходящую копию.

## Cinema, Calls и Games

Hermes `getDisplayMedia` использует `audio:false`; начало screen share очищает camera slot, завершение восстанавливает камеру. Это не готовый Cinema с системным звуком и одновременной камерой. В коде нет общей policy для Cinema/Calls/Games и независимых microphone/system-audio tracks.

В Venus нужны отдельные источники `microphone`, `camera`, `cinemaVideo`, `cinemaAudio`, серверные grants по назначению и локальный менеджер устройств. Приватный звонок не должен отправлять микрофон параллельно в общий вызов: переход требует явно определённого pause/hold предыдущей публикации, без самопроизвольного восстановления. Завершение приватного звонка не включает общий микрофон автоматически. Cinema audio управляется отдельно от голоса; Games не получает mic/camera permission. Все источники прекращаются при stop/leave/consent revoke, а reconnect не создаёт новую публикацию без действующего согласия. Это предложения к будущему контракту, ещё не реализованное поведение.

Perfect-negotiation следует реализовать на каждом разрешённом соединении и проверить offer glare, ICE restart, stale generation и повторный reconnect. Роли polite/impolite — технические, не права хозяина комнаты ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)).

## Локальный Docker и будущий домен

Для локальных испытаний достаточно одного изолированного Compose-проекта Venus: API/DB, frontend/reverse proxy, выбранный внутренний media компонент, coturn при проверке relay, browser workers с синтетическими устройствами. Существующие плавающие `node:20-alpine`/`coturn:latest`, `npm install` без lockfiles, root host-network coturn и копирование private key с `0644` из Hermes не являются разрешённым шаблоном поставки: закрепить версии/digests, non-root там, где возможно, bounded ports, read-only cert mount и ограниченные credentials.

`venus.shmoza.net` — планируемое имя; DNS, сервер и сертификаты ещё не проверены. Для будущего хоста certbot path обычно соответствует `/etc/letsencrypt/live/venus.shmoza.net/fullchain.pem` и `privkey.pem`; реальные имена lineage/symlink следует проверить на хосте. Для текущего localhost применять отдельный явно тестовый TLS profile, не выдавать self-signed fixture за certbot issuance.

Стандартный Cloudflare proxy обслуживает перечисленные HTTP/HTTPS порты; он не обеспечивает произвольный TURN UDP/TCP passthrough. Для будущего TURN понадобится отдельное DNS-only имя/доступные origin ports либо явно поддерживаемый L4-продукт; это можно сохранить на том же хосте. HTTPS/WSS у основного имени может использовать Cloudflare отдельно ([Cloudflare network ports](https://developers.cloudflare.com/fundamentals/reference/network-ports/)). Текущий coturn ожидает 3478 UDP/TCP, 5349 TLS и диапазон 49152–65535; для Venus диапазон следует ограничить конфигурацией и измеренной ёмкостью. Локальный Docker PASS не доказывает внешний NAT, доступность домена, выдачу certbot или поддержку реальных телефонов.

## Проверки, действительно выполненные в этом аудите

- `git ls-remote HEAD`, read-only clone и `git rev-parse HEAD` совпали; финальный foreign `git status --porcelain` пуст.
- Проиндексированы 68 tracked raw Git blob; секреты окружения не читались и зависимости не устанавливались.
- Node v24.22.0 `--check`: **21 PASS / 1 FAIL** из 22 JS. FAIL — `api/src/services/calls.js:1`, malformed `/ services/...`; ниже есть обрезанное выражение. Этот модуль **не импортируется активными routes/app**, поэтому его дефект не объявляется доказательством падения текущего API startup.
- Изолированно выполнена точная функция signal `verifyJWT`, синтетические 5 случаев; результаты и SHA-256 function source сохранены в JSON.
- Исходный Compose, WebRTC, JWT/ACL и log paths проверены статически. Рабочий стек, реальный browser call, 8 users, screen/audio, relay revocation, нагрузка, мобильные устройства и публичный NAT **не испытаны**.

Предлагаемые обязательные будущие негативные испытания: cross-room и cross-pair receive/send; consent decline/revoke; stale token/generation/reconnect; observer publish; параллельный join выше cap; общий+приватный звонок без утечки mic; остановка Cinema при revoke; проверка media bytes после server revoke; 8 независимых браузерных контекстов с активными синтетическими audio/video; Stats/packet loss/jitter/CPU/memory и полный owned-container cleanup. Отключение feature flags должно возвращать предыдущий Games-only режим без удаления миграций или истории доказательств.
