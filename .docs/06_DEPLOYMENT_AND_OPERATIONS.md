# Venus · Deployment, Infrastructure & Operations Runbook

**Владелец:** Infrastructure / Operator · **редакция:** 1.0.0 · **дата:** 2026-10-18 · **статус:** процедурная спецификация, команды и конфиги приведены как шаблоны будущей реализации. **Ни один процесс не был установлен этим документом.**

**Авторитет:** [Part 04 — Bootstrap and Deployment](source-snapshots/PART_04_BOOTSTRAP_AND_DEPLOYMENT.md), [Part 05 — CI/Releases](source-snapshots/PART_05_CI_RELEASES_AND_LOCAL_UPDATES.md), [Part 12 — Known Problems](source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md). Применимые центральные Parts 00/03/06/09/13 не предоставлены: их получение и фиксация immutable revision — prerequisite для production. Локальный runbook **не имеет права** ослаблять эти требования.

## 1. Неприкосновенная инфраструктурная граница

- На хосте **уже есть единственный host-managed Nginx**. Установка Venus MUST NOT устанавливать/restart/reload/replace/own Nginx, `nginx.conf` или global TLS. Venus поставляет только **именованный vhost include contract**, который проверяет и активирует оператор после локальной готовности.
- Containerized Venus API/web слушает **только `127.0.0.1:4300`** (baseline предложен; проверить реестр host ports до deploy), БД не публикуется наружу; независимый LiveKit SFU слушает signaling **`127.0.0.1:7880`** и media напрямую на согласованном публичном UDP **7882**. Дополнительный ICE/TCP **7881** требует отдельного review. Наличие публичного IP и разрешения UDP **не** доказывает NAT и firewall работу.
- Nginx = TLS/HTTP2/HTTPS/WSS; он **не** передаёт UDP WebRTC и не заменяет TURN. coturn **не является** базовой зависимостью; вводить его только после документированного NAT/exposure теста по Part 04.
- Венус backend и LiveKit имеют разные версии, отдельные secret/config trust boundaries. LiveKit — **явно provisioned external media dependency**, не загружается/не устанавливается «заодно» при выполнении bootstrap Venus. Обязательные shared host agents назначаются **только** подтверждённой матрицей центральной Part 13; неизвестная матрица != N/A.
- API/UI никогда не получают Docker socket, root shell или доступ на запись в Nginx конфигурацию. Привилегированное обновление выполняет зарегистрированный локальный Updater через scoped Unix socket.
- Сетевой профиль `in_person` использует интернет так же, как `online`. Различается физическая совместимость карточек и политика аудиовывода; server deployment не переключается.

## 2. Environment/topology (проектный baseline)

```text
External browsers / mobile app
    HTTPS 443 -> DNS venus.example.invalid / rtc.venus.example.invalid
           -> EXISTING SERVER NGINX (operator-owned vhosts, TLS, WSS)
                 |                                   |
                 | 127.0.0.1:4300                    | 127.0.0.1:7880
                 v                                   v
        Venus web+API container               LiveKit SFU (separate)
             |       |                             ^
             |       + PostgreSQL                   | direct ICE / WebRTC media
             |       + licensed media asset path    | public UDP 7882
             + Room/Game/Music token/signaling -----+

Only host firewall exposes HTTPS, public RTC UDP when approved; no API/DB/backend public ports.
```

`venus.example.invalid` — явный placeholder для инструкции, **не** реальный домен. Реальные домены, vhost/conflict registry, сертификаты и backend-port значения выбирает оператор. В validation известные структурные placeholders отвергаются, кроме отдельного operator-chosen Access Key, где запрещены специальные ограничения по форме (Part 04 §20).

## 3. Production prerequisites — до первого bootstrap

| Объект | Проверка / критерий | Что делать при отказе |
|---|---|---|
| Linux, arch, host access | supported OS/architecture listed by exact Venus release installer; root sudo | отказ без частичной установки |
| DNS | `venus` web host и RTC signaling host resolves to intended public IP | настроить DNS, не обходить origin validation |
| TLS | действующие полномасштабные SAN/fullchain+key для каждого SNI и доступный operator-managed host vhost | отложить публичную активацию |
| Nginx | один daemon, один fail-closed `default_server`, исключены конфликтующие `server_name`, `nginx -T` effective config виден | не затрагивать другие приложения |
| Firewall | incoming TCP 443/80 if authorized, UDP 7882 if approved; egress DNS/HTTPS/registry/RTC dependencies; no exposed 4300/5432/7880 | открыть **только** approved routes |
| Container engine | Docker Engine, Compose v2, known sandbox versions/UID/capabilities | fail preflight |
| Dependency policy | central Part 13 pinned revision, updater/version, declared agent compatibility | BLOCK deployment readiness |
| Trusted releases | immutable `venus-vX.Y.Z` asset, publisher allowlist, signed manifest, embedded release trust key | bootstrap must refuse unsigned/mutable |
| Storage | allocated volumes, DB backups/encryption, log rotation, tested free space quota, licensed audio paths | do not start if unhealthy |
| LiveKit | installed independently, correct RTC public IP and signaling URL, scoped API secret, live+ICE check | `media_ready=DEGRADED`, Cinema disabled |
| Content | reviewed 100 cards/mode RU EN TR if Games public, rights for every music track if Music public | corresponding module disabled, not false READY |

**Bootstrap и deployment README не должны молча считать существующими сторонние shared agents, чьи версии ещё не были проверены.** При ограниченной стадии Games без Cinema допустимо не активировать media dependency, но состояние Cinema явно `UNAVAILABLE`, scope релиза — documented.

## 4. First deployment — три operator steps по Part 04

Синтаксис ниже **шаблон будущего артефакта**, а не исполняемая в текущем ZIP команда: необходимо заменить OWNER/REPOSITORY, выпустить подписанный комплект и его настоящий qualified tag. Никогда не выполнять `curl | sudo sh` с неподтверждённой ссылкой; не подставлять mutable `main`/`latest`.

### Step A — prepare immutable release, на VPS от оператора

```sh
# SERVER: version-specific asset only; replace OWNER/REPOSITORY with approved values
curl -fsSL \
  https://github.com/OWNER/REPOSITORY/releases/download/venus-v0.0.1/bootstrap.sh \
  | sudo sh
```

`bootstrap.sh` обязан отклонить неподдерживаемый OS/arch, установить свой verifier `/etc/exocortex/release-trust/venus.pem`, криптографически проверить detached signed manifest до доверия URL, проверить роль/версию/digest/allow-listed host, скачать bounded bundle, проверить SHA-256, безопасно распаковать без owner/permissions/traversal, создать отдельный `/opt/exocortex/venus/.env` (`0600`) с генерируемыми секретами и release lock, административную `venus-install` wrapper. Повторный bootstrap не переписывает рабочую установку; для existing install используются updater/repair. `prepare` **не запускает app** и в конце печатает реальный env path и точную install command.

### Step B — operator input ONLY

```sh
# SERVER
sudoedit /opt/exocortex/venus/.env
```

`.env` логически делится на 4 группы, и оператор меняет только первую:

```dotenv
# ===== OPERATOR INPUT (human, fill before install) =====
PUBLIC_ORIGIN=https://venus.example.invalid
RTC_SIGNALING_PUBLIC_ORIGIN=https://rtc.venus.example.invalid
VENUS_LOOPBACK_PORT=4300
# operator deliberately chooses exact access key (no length/entropy/charset policy)
OPERATOR_ACCESS_KEY=
# certificate name only if a specific approved host contract needs it

# ===== GENERATED SECRETS (prepare writes; never print or paste) =====
# SECRET_SESSION_KEY=<GENERATED_MACHINE_VALUE>
# DATABASE_PASSWORD=<GENERATED_MACHINE_VALUE>
# SCOPED_UPDATER_TOKEN_REFERENCE=<GENERATED_PROTECTED_REFERENCE>

# ===== RELEASE LOCK (from signed manifest, read-only to operator) =====
# VERSION=0.0.1
# OCI_IMAGE=registry.example.invalid/venus@sha256:<64hex>

# ===== RUNTIME DEFAULTS (bundle-owned) =====
# LISTEN_HOST=0.0.0.0 INSIDE container; host publish still 127.0.0.1 only
# HEALTH_PATH=/health/ready
```

`OPERATOR_ACCESS_KEY` — **отдельный операторский доступ к обслуживанию/обновлению**, не guest invite link. Как требует Part 04, валидатор проверяет только то, что значение явно задано, и exact bytes: **не нормализует, не обрезает, не ограничивает длину/символы, не фильтрует пароли по словарю**. Его нельзя печатать; bootstrap переводит key в verifier для входа. Остальные машинные секреты генерируются CSPRNG и не становятся operator inputs. Публичные origins must be canonical HTTPS; release digest не вводится человеком. Для LiveKit secret используйте явный scoped secret handoff и проверенную внешнюю настройку, НЕ чтение чужого `.env`.

### Step C — install, local verify, no ingress mutation

```sh
# SERVER
sudo chmod 600 /opt/exocortex/venus/.env
sudo venus-install
sudo venus-install status
curl --fail --silent --show-error http://127.0.0.1:4300/health/ready
```

Installer checks: root privilege only for host changes, Compose v2, pinned OCI digest, preserved operator inputs, protected service UID, required host agents scoped enrollment by approved dependency matrix, rendered `docker compose config`, no public app port, healthy DB migrations/worker, bounded loopback readiness and actual running version. Timeout prints bounded recent logs and exits nonzero. Container baseline: `read_only` rootfs when compatible, `no-new-privileges`, `cap_drop: ALL`, nonroot UID, bounded volumes, resource/log quotas; no Nginx container/sidecar/service.

**Не переходить к Step D, если local readiness зелёная лишь на process-level**: `/health/ready` должен подтверждать завершённые критичные миграции, DB и required app dependencies; `media_ready/music_ready/game_ready` отображать раздельно.

## 5. Step D — operator-managed Nginx and public activation

Только после Step C оператор создаёт **или обновляет** независимые host-managed vhost files для web и RTC signaling. Это не делает installer. **Ниже пример конструкции, не готовая вставка без host baseline/security review**: `map $http_upgrade $connection_upgrade` должен быть один раз определён в `http {}` серверной конфигурации; менять глобальный файл app-инсталлятору нельзя.

```nginx
# HOST OPERATOR, http{} scope: once in centrally managed baseline if absent
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

```nginx
# HOST OPERATOR /etc/nginx/sites-available/venus.conf — illustrate placement
# Exact cert paths and HSTS/TLS baseline follow existing server policy.
server {
    listen 443 ssl http2;
    server_name venus.example.invalid;
    ssl_certificate     /etc/letsencrypt/live/venus.example.invalid/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/venus.example.invalid/privkey.pem;

    client_max_body_size 1m;  # default API limit; exceptions route-specific
    location / {
        proxy_pass http://127.0.0.1:4300;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 75s;
    }
}

server {
    listen 443 ssl http2;
    server_name rtc.venus.example.invalid;
    ssl_certificate     /etc/letsencrypt/live/rtc.venus.example.invalid/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rtc.venus.example.invalid/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:7880;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 90s;
    }
}
```

Обязательные host checks перед и после активации:

```sh
# SERVER: read-only inspection
sudo nginx -T | grep -E 'server_name|proxy_pass|ssl_certificate|listen'
# SERVER: validate entire active candidate
sudo nginx -t
# SERVER: ONLY OPERATOR with reviewed candidate
sudo systemctl reload nginx
# EXTERNAL CLIENT: verify real origin, SNI/chain and access
curl -fsS https://REAL_VENUS_HOST/health/ready
```

`REAL_VENUS_HOST` — заменить вручную. Поддерживать fail-closed `default_server` и canonical domains; `nginx -t` проверяет синтаксис, **не** факт нужного vhost/SNI upstream. Оператор должен подтвердить effective `nginx -T`, fullchain/SNI извне, HTTPS `Origin`/forwarded headers, `WSS` heartbeat, API auth и favicon/deep-link routes. Рекомендуется сохранить прежний include: при неудачном тесте routing не переключать, не перезагружать глобальный Nginx в состоянии конфликта. Пример `client_max_body_size` нельзя переносить на большой update ZIP endpoint: Part 12 `NET-13` требует route-specific лимиты для install и rollback, с публичным 413 тестом.

## 6. WebRTC / LiveKit provisioning contract

**Отдельный approved LiveKit install** (runtime independent, explicit owner, signed or pinned audited artifacts):

- LiveKit signaling `7880` bound loopback, proxied by existing Nginx on `rtc.venus.example.invalid`. Do not expose 7880 from Internet.
- ICE media UDP `7882` publicly bound and allowlisted in firewall (when RTC config uses UDP mux), `advertise_public_ip`/external IP resolved correctly. For an alternative UDP port-range configuration, open **only** explicitly configured exact range, not both modes by guesswork.
- ICE/TCP `7881` only if needed and approved; 443/HTTPS may not be enough to connect peers. Nginx cannot act as generic TURN relay. TURN (standalone or integrated LiveKit TURN) requires separate rationale, ports/TLS/abuse/quotas/auth review.
- LiveKit API key/secret created through protected boundary; browser receives **short-lived room-scoped grants** from Venus API, never persistent server credentials. Publish grant only current host, subscribe grants for members. On room close/revocation, invalidate/terminate relevant media identities.
- `livekit`/`venus` compatibility matrix pinned to tested versions; no untested LiveKit upgrade while Cinema running and no silent dependency install by Venus bootstrap.
- Smoke profile: real desktop tab with permitted video+audio → LiveKit → 7 separate browser viewers, correct audio/video, reconnect, muting, playback latency and A/V skew; test UDP blocked client to observe fallback/degradation. A second independent network (not VPS loopback) required to prove public media.

**Rough egress sizing only:** if source stream is 1.5–3 Mbps and 7 remote subscribers each receive it, egress ~10.5–21 Mbps before overhead, plus music. Measure actual CPU, egress, bandwidth, packet loss, jitter at planned peak concurrency and room count; eight-person room requirement does not imply infinite simultaneous rooms on VPS.

**Mobile capture:** publish ability on Android/iOS is a separate G4 requirement. Android MediaProjection/allowed playback audio; iOS capture APIs and app-audio require platform matrix and appropriate app distribution. Unsupported source/DRM yields explicit user-facing limitation; avoid asserting universal browser audio capture.

## 7. Storage, data, retention, backup and recovery

- PostgreSQL state and music metadata on named persistent volume / approved storage; media audio only from licensing-approved asset root; never store movie-screen content or ambient conversation by default.
- PostgreSQL, private relationships and session snapshots are covered by the **standard full logical backup** needed for manual/automatic/pre-update actions. Snapshot creation must be consistent at a transaction boundary; restore needs verified checksum, migration compatibility, row count/scope and synthetic restore drill.
- Backup MUST NOT contain `.env`, trust private material, API keys, signed session cookies, runtime host secrets or excessive raw user relation logs. Per Part 04 deployment secrets recovered via separate **encrypted operator procedure**.
- Settings retention `[PROPOSED]`: default room expiry after 24h idle, encrypted private preferences deleted on room expiration; active game immutable snapshots must be retained until finished/expired. Long-term cross-room profiles require explicit ADR/consent.
- On ordinary reboot use persistent DB/volume, do **not** restore entire app from ZIP automatically. After actual failed update restore only via trusted Updater's recovery sequence with validated job state and operator saved ZIP if required.
- Per Part 05 archive recovery: while update active, downloaded ZIP transfer same bytes + receipt/digest; helper holds rollback data in memory and tmpfs only when necessary; terminal job metadata bounded (reference 20 jobs/30 days), prior image kept for offline immediate rollback.
- Music source files rights must be tracked; deleting revoked track from library also invalidates queued state and HTTP stream access. Do not use Spotify or arbitrary URLs as legal substitute for streaming rights.

## 8. Normal operation and on-call checks

| Frequency | Read-only or change | Owner / observable result |
|---|---|---|
| On every deploy | image digest/version, `/health/live`, `/health/ready`, dependencies and external SNI/HTTPS/WSS, WebRTC media | release operator, signed evidence |
| Daily | disk/free on authoritative DB/media volume, DB job, log budget, backup artifact existence, failure metrics | on call |
| Weekly | synthetic 8-user room, playlist sync, private visibility, consent decline, no stolen host role | QA/ops |
| Monthly | restore drill on disposable isolate, signature/trust verification, dependency security updates | ops/security |
| On incident | UTC/time, host, running digest/version, site vhosts effective config, sanitized bounded logs, operation request/job ID | incident owner |

`/health/live`: process alive only. `/health/ready`: app ready, DB/migrations done. `/health/features`: separately `cinema=available/degraded/unavailable`, `music`, `games` with as-of/time; authenticated/admin exposure as needed. Public edge readiness independent from process health. `UNKNOWN` and stale samples never display 0% healthy.

Log fields `timestamp_utc, request_id, room_id_pseudonym?, service_version, image_digest, stage, error_code`; forbid raw invite URLs, access keys, relationship edges, comfort levels, card private text, participant personal chat and audio. Log rotation/bounds mandatory; only safe tail on failure.

## 9. Failure scenarios — ordered safe runbooks

### 9.1. Browser gets 502 after deploy

1. Confirm host, exact path, version and intended vhost (Part 12 `OPS-01`). Do **not** blindly rerun first-install bootstrap.
2. Verify `venus-install status`, `docker compose config`, published host listener **127.0.0.1:4300** and GET loopback `/health/ready`.
3. If loopback fails, inspect bounded container logs/DB readiness/migration; do not reload Nginx as workaround. If loopback succeeds, inspect `nginx -T`, correct upstream, SNI/fullchain, path and forwarded origin. Prevent unintended router takeover.
4. After fix, verify UI join + WSS + selected module + public HTTPS end to end.

### 9.2. WebRTC signaling works, audience sees black/silent screen

1. Distinguish capture permission, screen video capture, audio track count, DRM/capture block, token grant vs ICE network. Don't assume server broken.
2. Host local preview of capture video/audio; verify `audio track present` and user selected share-tab-audio.
3. Inspect RTC token issuer/audience, expiry, publisher lease, client ICE candidate and remote connectivity. UDP 7882 accessible externally? Public IP advertised?
4. Check codecs/OS/browser, permission revocation and active track lifecycle; stop sharing if source terminates. Report unsupported protected sources, **do not** implement DRM circumvention.
5. External client reconnect test; retain safe jitter/RTT/log evidence without actual stream frames.

### 9.3. Music drifts or echoes

1. Check room `music_rev`, track source rights, epoch and client clock offset; missing permissions for browser audio playback should show unlock action.
2. Verify all clients receive same authoritative `track_id/rev`, server timeline and drift strategy; stalled network should show resync, not rapid unbounded seeks.
3. For `in_person` check exactly one loudspeaker mode; advise headphones on extra personal outputs and reduce second speaker volume, do not claim per-user volume for shared physical speaker.
4. Measure drift percentile and report profile; do not silently claim synchronization when buffering.

### 9.4. Update fails / rollback failed

1. Preserve request_id/job_id and **both** original failure and rollback error. Check `running version, image digest, DB schema, .env, Compose config, health` to determine factual state.
2. If mutation did not occur, correct preflight and retry with same idempotency semantics. If migration or apply occurred, **no blind second update** until reconciled.
3. Check Updater effective systemd `ReadWritePaths` for **both apply and rollback**, runtime socket directory inode, dependency versions and direct Unix socket health. Old unit with new binary can appear healthy yet refuse mutation (`PERM-08..13`, `CTR-09`).
4. Use official privileged `repair` after eliminating root cause; never manually remove transaction journal. Preserve backup digest; if restore after restart, verify original operator ZIP SHA-256.
5. Re-run config, migration/health, authenticated critical path, public SNI/WS and update job verification. Log exact versions/steps with masked credentials.

### 9.5. Privacy / leaked invitation

1. Revoke room invite and user sessions, terminate media grants (do not merely hide frontend).
2. Record sanitized incident and audit exposed endpoints, private payload and response cache; DO NOT attach real relationship data to issue/PR.
3. Rotate scoped secrets only if actual risk, preserving correct operator env; restore safe serving and run access-control regression tests.
4. If legally required, follow applicable user notification/regulatory process; legal/privacy ADR before launch.

## 10. Pre-production acceptance / deployment record

Create a durable, operator-authenticated `deployment-readiness.json` **for each actual target host/release** (never inside public app). Suggested fields: service, git revision, signed release digest, pinned central Parts revision, matched updater+agents, exact vhost owners, local/edge check states, RTC media UDP external proof, module readiness, DB migration+backup restore evidence, operator/time, remaining blocks. Real TLS/DNS/credentials smoke may be `NOT_RUN` until activated; don't report as Part12 release test PASS.

**Final checklist:**

- [ ] original `venus-v...` asset signature and manifest trust verified on the VPS; `.env` and trust owned by Venus, not another app;
- [ ] operator-only inputs and strict generated-secret boundary; no exposed secrets in logs/CLI;
- [ ] installer does not install, start or modify Nginx; no default-public backend port;
- [ ] Compose rendered with actual env before start; DB/cold start/host dependencies healthy;
- [ ] external origin/SNI/HTTPS/WSS and RTC UDP tested; effective `nginx -T` validated;
- [ ] stateful rooms survive process restart, correct room/participant readiness;
- [ ] privacy/consent, RU/EN/TR, 8 members and all enabled modules have real end-to-end evidence;
- [ ] pre-update ZIP, signed exact upgrade, rollback and restore smoke pass from oldest supported release;
- [ ] Part 12 complete per-ID release report and deployment readiness file identify each unknown/block.

**Cross references:** [02 Tech](02_TECHNICAL_ARCHITECTURE.md) · [05 CI](05_CI_QUALITY_AND_RELEASES.md) · [07 Risks](07_KNOWN_AND_EXPECTED_PROBLEMS.md).
