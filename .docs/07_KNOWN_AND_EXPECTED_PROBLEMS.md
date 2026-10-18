# Venus · Known Deployment Failure Classes, Expected Product Risks & Incident Playbooks

**Владелец:** Operations / QA / Security / Product Safety · **версия:** 1.0.0 · **дата:** 2026-10-18 · **статус:** preventive risk register; ни один пункт не утверждает, что ошибка уже случилась на работающем Venus.

## 1. Что является «известной проблемой», а что прогнозом

1. **CENTRAL KNOWN:** [Part 12](source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md) — реальный реестр 118 известных *классов* ошибок в родственной инфраструктуре (snapshot автора 2026-10-18), с идентификаторами `REL-01`, `BST-01` и т.п. Он **не** доказывает, что какая-то из них уже проявилась в Venus. Центральная revision проверяется как immutable SHA перед каждым конкретным релизом.
2. **VENUS EXPECTED:** ниже `VNS-RISK-###` — архитектурные риски для ещё не реализованного продукта. Они имеют гипотезу причины, симптомы, предотвращение и evidence, но являются `[OPEN]` до испытаний.
3. **OBSERVED INCIDENT:** регистрировать отдельно по фактическому UTC времени, версии, digest, host, безопасному correlation_id, команде/тесту, первопричине, permanent fix, regression. При закрытии связать с Part 12 ID либо добавить новый абстрактный class по центральной процедуре; нельзя придумывать `PASS` на основании предположения.

**Priority:** `P0` = может раскрыть личные отношения/секреты, причинить вред/обойти consent, разрушить данные или заблокировать безопасное восстановление; `P1` = ломает критичный пользовательский путь/заявленный SLA; `P2` = ухудшает UX или поддержку при сохранённом безопасном fallback. `Release impact`: `BLOCK` означает запрет объявлять соответствующий модуль готовым; `DEGRADE` — допускается честная ограниченная функция/другой сценарий, если согласовано.

**Каждая строка содержит:** risk ID, affected module/profile, symptom, why, prevention, detection, fallback, owner, acceptance test and source link; недостающие оценки частот/сроков остаются измеряемыми, не выдуманными.

## 2. P0/P1 продуктовые и приватностные риски (Venus-specific)

### VNS-RISK-001 · Несанкционированный просмотр чужих отношений / комфорта — P0, BLOCK Games

- **Причина:** общий сериализатор room snapshot; GraphQL/REST/WS fields возвращают `comfort`, raw `A→B`, initiator hint, class, private prompt; кеш/analytics сохраняет значения; host получает privileged view.
- **Симптом:** клиент A читает B preferences или угадывает mutual crush из точного server event; linter/log содержит sensitive data.
- **Профилактика:** DB encryption at rest, owner-only preferences endpoint, private scoped projection separate from common broadcast, deny-by-default serializers, no relation fields in logging/metrics/backup preview; двухпользовательские отрицательные auth tests.
- **Обнаружение:** RE-017/018, CI-P-001/003; test 8 clients intercept all WS/HTTP/UI state и проверяет forbidden keys, cross-member access = 403/404.
- **Реакция:** revoke room invite/sessions, disable affected route, preserve only sanitized request metadata, patch and rerun privacy suite; legal incident owner validates notification process.

### VNS-RISK-002 · Forced intimacy / нарушенное согласие — P0, BLOCK Games

- **Причина:** consent выводится из c=4 или crush, таймаут трактуется как acceptance, host принимает за пару, recipient исключён из confirmation, `not_a_friend` игнорируется в fallback, «наказание» за отказ.
- **Симптом:** private/physical task активируется без двух личных подтверждений; UI раскрывает отказавшего, перестаёт работать `Отказаться` после snapshot lock.
- **Профилактика:** all RE invariants в backend, `pair_private/physical → bilateral per-action opt-in`; stop/decline without reason; no penalty; immutable snapshot only preferences, not permissions.
- **Обнаружение:** RE-003/004/010/011/015/017, fuzz/state-machine concurrent decline/accept/disconnect.
- **Реакция:** отключить чувствительные карточки feature flag, сохранить общий Games только на level 0, investigate safe event metadata, review content pack; до исправления release BLOCK.

### VNS-RISK-003 · Социальная деанонимизация crush через частоту — P1, BLOCK if deterministic

- **Причина:** Weight для взаимного crush автоматически выдаёт гарантированные приглашения/приватные раунды; публичный UI указывает reason/type, pattern легко декодировать.
- **Профилактика:** bounded stochastic weights and fairness caps; no raw class/reason; частоты перекрываются статистически, отсутствуют детерминированные публичные маркеры; private pair shown only to two until consent.
- **Обнаружение:** synthetic inference study on public event streams of 10k seeded sessions; сравнить классификатор против random baseline и зафиксировать acceptable threshold посредством ADR.
- **Fallback:** до результатов ограничить величину весов и частоту pair/private, при необходимости выключить автоматический reciprocal boost (не отключая добровольную инициативу).

### VNS-RISK-004 · Поломка snapshot immutability — P0/P1, BLOCK Games

- **Причина:** active game читает live preference row вместо encrypted immutable snapshot; одна вкладка меняет comfort через PATCH, другая уже получила карточку, а policy release меняет параметры не завершившейся сессии.
- **Обнаружение:** RE-010/012/013, конкурентные DB транзакции и race fixtures, diff of snapshot hash before/after all actions.
- **Профилактика:** atomic snapshot transaction, serialized `policy_rev, pack_digest, seed`, active/paused edit returns 409, idempotent advance, new pack does not mutate active round.
- **Fallback:** recover prior committed round, fail closed; не подменять новыми настройками.

### VNS-RISK-005 · «Безопасный» fallback оказался опаснее исходной карточки — P0, BLOCK Games

- **Причина:** недостаток eligible карточек, алгоритм расширяет min comfort/context/relation фильтры и выбирает high-intimacy по умолчанию.
- **Профилактика:** fallback проходит **тот же** hard guard, отдельный vetted neutral pool, release check pool coverage for all target profiles. Не включать уровни, которых пользователь не разрешил.
- **Обнаружение:** RE-006/008, property tests 2..8 players × contexts × comfort × class × stage; `SAFE_POOL_EXHAUSTED` честно прекращает раунд или предложит safe neutral alternatives.

### VNS-RISK-006 · Анонимная комната используется для давления/травли — P0/P1, BLOCK public expansion

- **Причина:** приглашение переслано незнакомцу, отозванный участник reconnect, провокационные карточки, room owner якобы имеет право отвечать за гостя.
- **Профилактика:** cryptographic invite randomness, host revoke link, 8-person capacity gate, session identity per device, report/leave/stop accessible, rate-limits, moderation/abuse policy and content safety review before launch.
- **Обнаружение:** stolen link, removed-member WS reconnection, forged host control, repeated join/test participants with same display name.
- **Fallback:** host can close room/revoke invitations; participant can leave regardless host; self preferences erased per retention.

### VNS-RISK-007 · Online/ in_person физический контекст перепутан — P0, BLOCK Games

- **Причина:** `in_person` mistakenly interpreted as absence of network; content tag not validated; online players get hug/kiss/leave-together demands.
- **Профилактика:** strict `meeting_contexts`, `requires_physical_contact`, `requires_going_away`; online never physical, physical never without bilateral consent and comfort=4; screen call isn't physical presence.
- **Обнаружение:** RE-008/009 + schema validator; 8 phones in shared physical room actual audio/UX test.

### VNS-RISK-008 · Непроверенный агентский контент / вредный перевод — P0/P1, BLOCK content release

- **Причина:** agent adds novel intimacy after translation, inserts placeholder in wrong place, tells B their secret crush, generates coercion, unsafe challenges or stereotyped Korean visuals.
- **Профилактика:** strict JSON Schema, context/policy guards, tri-lingual content and placeholder parity, duplicate detection, separate editorial/safety/locale approval, revisioned immutable pack. Translation must retain consent and negative option semantics.
- **Обнаружение:** `tools/validate_cards.py`, pipeline in 09, human review logs; every sensitive batch blocked until explicit approver.
- **Fallback:** reject card/batch or roll back pack digest, preserve active session pinned cardpack.

## 3. Media / capture / WebRTC risks

| ID / priority | Failure mode & observable | Prevention + safe fallback | Proof before feature ready |
|---|---|---|---|
| VNS-RISK-009 P1 | chosen tab has video but **no audio track** | require explicit tab-audio indicator; request user permission; show `AUDIO_NOT_CAPTURED`, not silent pretend | real 1+7 AV device/browser test; `CI-C-001/002` |
| VNS-RISK-010 P1 | protected/DRM source gives black/no video or blocks audio | no DRM bypass; show unsupported website/source, fallback to shareable permitted source | compatibility matrix by browser/source; `CI-C-002` |
| VNS-RISK-011 P1 | NAT/ICE/UDP inaccessible, WS signaling healthy but viewers see blank screen | verified public ICE IP, 7882 UDP mux and route-specific firewall; clear `MEDIA_CONNECTIVITY_FAILED`; TURN only separate approved design | external-client RTC test with normal/blocked UDP, `CI-C-003` |
| VNS-RISK-012 P1 | iOS/Android native capture allowed video but system/application audio prohibited | explicit per-OS/source supported matrix, real device smoke, disabled unsupported capture path | `CI-C-004`, G4 independent |
| VNS-RISK-013 P1 | SFU VPS egress 7 viewers saturates bandwidth/CPU | cap rooms/bitrates, adaptive 720p baseline, egress/jitter alerts; reduce quality gracefully | concurrent load 1+7 plus multi-room; p95 delay/skew measurements |
| VNS-RISK-014 P1 | A/V lip-sync drift at a viewer; skew between viewers | same WebRTC media timebase for A/V, avoid independent remux tracks, collect real measurements; degrade truthfully | target p95 AV offset <=120ms, viewer skew <=500ms **proposed**, network test |
| VNS-RISK-015 P2 | source stops/shares wrong tab; stale publisher lease | host-only publisher lease, proper `ended` track event, state rev + expiry; UI reveals current source, stop on tab closed | 2 publish attempts and reconnect/room-close tests |
| VNS-RISK-016 P1 | remote browser autoplay/permissions/hardware failure | explicit unlock, permissions, codec/device signals; not a fake server outage | desktop/mobile viewer matrix + restore after denied permission |

Не делать утверждений `no latency`, `all sites`, `mobile browsers always support audio`, `encrypted end-to-end`, если нет соответствующего end-to-end evidence.

## 4. Music, licensing and locale risks

| ID / priority | Failure & root cause | Mitigation / owner / test |
|---|---|---|
| VNS-RISK-017 P0 | каталог содержит трек без online/public performance/distribution rights | License register links track+territory+use+attribution+expiry, legal review, disable unlicensed URL; `CI-M` + G2 legal gate |
| VNS-RISK-018 P1 | `play()` rejected by mobile autoplay policy, client shown as listening | require user gesture, clear unlock button and real state on local device; `CI-M-003` |
| VNS-RISK-019 P1 | tracks drift due to client clocks, jitter, resume | authoritative epoch/queue_rev, RTT offset, bounded rate correction and resync; `CI-M-001/002` |
| VNS-RISK-020 P1 | eight phones in one room play over loudspeakers, echo/flanging | single common playback output default in `in_person`, no per-user volume guarantee for shared speaker; `CI-M-004` |
| VNS-RISK-021 P1 | host changes track but stale device keeps old revision | monotonic music_rev, queue revision, re-fetch snapshot, HTTP Range, rev conflicts | reconnect 8 devices + packet loss tests |
| VNS-RISK-022 P1 | Cinema and Music start together, overlapping competing audio | explicit audio focus policy: host pauses background on Cinema by default; viewers may locally mute, never host-level accidental global volume | concurrent Cinema/music/call placeholder tests |
| VNS-RISK-023 P1 | Turkish i/İ/ı, Russian plural/gender, EN placeholders differ; broken line wraps | reviewed locale strings and role placeholders parity; 320px/200% zoom e2e; no machine English fallbacks for released cards | `CI-I-001/002`, validator 09 |
| VNS-RISK-024 P2 | unlicensed/low-resolution moodboard uploaded as production hero | reference assets labelled moodboard-only, rights/credits, original artwork required | visual asset manifest/permission QA in 03 |

## 5. Operational/deployment risks translated from Part 12

Each below references real upstream category IDs. Их **проверяют** по центральному реестру, а не переименовывают в новые `VNS-RISK` вместо upstream.

| Central ID | Признак на Venus | Проверка и постоянное решение | Где подробнее |
|---|---|---|---|
| REL-01/02/03/04/05 | wrong tag, wrong version, CI-image≠release image | `venus-vX.Y.Z` signed scoped workflow, remote commit check, run exact OCI digest `/version` | 05 §§3–4 |
| REL-06/07/09/11 | checksum/signature mismatch, mutable bootstrap, missing CDN asset, transient 502 | version-specific bootstrap; independent manifest signature; bounded retries; anonymous external asset trust smoke | 05 §4, 06 §4 |
| REL-08/12 | installer/updater incompatible, changed signed archive cannot be read by old helper | pinned compatibility matrix, test upgrades from every supported originating updater | 05 §§4–5 |
| BST-01/02/03/04 | multiple apps share bootstrap/env/trust, manually copied tokens | separate Venus trust/config/install; typed scoped secret handoff; no read foreign env | 06 §§1–4 |
| BST-05/06/09/10 | refresh loses env fields/overwrites inputs, wrong runtime UID | schema-aware migration, preserve operator inputs, validate mounts as runtime UID | 05 §§5/8, 06 §4 |
| BST-11/12/13 | placeholders or same host port, unclear next command, Access Key wrongly restricted | preflight port ownership; exact 3 steps; Access Key opaque exact text | 06 §§3–4 |
| TRUST-01/03/04/05/06/07 | keys mixed, arbitrary trust download, secrets logged, stale token | embedded public verifier; protected release key, secret refs; final install trust smoke | 05 §9, 06 §4 |
| PERM-01..07 | owner/mode/parent directory prevents unprivileged process/secure secret | same-UID tests, parent traversal check, no chmod 777 workaround | 06 §3/9 |
| PERM-08..13 | stale systemd unit sandbox prevents activation/rollback even if binary healthy | effective unit `ReadWritePaths`, atomic binary+unit, test mutation/rollback under sandbox | 06 §9.4 |
| CTR-01/06/07 | localhost API inside container OK, host loopback closed, Compose env missing | rendered Compose, host listener and external ingress probes | 06 §§4–5 |
| CTR-02/08/09/10 | bind secret stale inode, Updater unit/socket mismatch, missing new env | re-create targeted consumers, preserve stable parent mount, validate candidate/rollback Compose | 06 §9.4 |
| NET-01/02/03/04/05/08 | wrong virtual host/default cert/Origin, multiple Nginx owners | one host-managed Nginx, fail-closed default, `nginx -T`, SNI and forwarded origin tests | 06 §5 |
| NET-06/07 | backend public bind or no egress for registry/RTC | only host loopback for app, explicit incoming/outgoing firewall checks | 06 §§1/3 |
| NET-09/10/11/13 | large ZIP/RTC/API wrong body size or timeout, upload 413 | route-specific limits, no unbounded buffering; real install+rollback upload test | 05 §8, 06 §5 |
| NET-12 | hero/favicon/deep-link fail | root-relative assets, public route and responsive screenshots | 03/04/06 |
| HLT-01..04/06 | health conflates process, media, DB and stale metrics | separate liveness, readiness, edge and module metrics, provenance of value | 02 §12, 06 §8 |
| HLT-05/07..12 | false uptime, storage probe wrong permissions, short cold-start window | current instance start, real canary, measured health budgets and status reconciliation | 06 §§8–9 |
| INT-01..08 | installed dependency != enrolled/authenticated; token orientation wrong | staged dependency health/credential handoff, exact scoped contract, pending is not ready | 06 §§3–4 |
| INT-09..16 | central registry/version/allowlist/handshake mismatch for formal host agents | check verified Part13 capabilities/min versions/auth, real event/endpoint smoke, not only ping | 05 §§4–5, 06 §3 |
| DATA-01..05 | uploaded music or backups buffered unbounded or incomplete | bounded streaming + quota + durable flush/digest, abandoned session GC | 06 §7 |
| DATA-06..10 | unverified archive, shared root or false independent backup | restore drill, separate namespace/secret retention and failure domain | 06 §7 |
| DATA-11 | Unicode canonical path collision in mirrored music/backup | Unicode NFC/casefold canonical key, preflight collision and no unsafe delete | 06 §7 |
| OPS-01..06 | wrong host/path, manual hotfix never tested or documented | normalized runbooks, incident ID, root-cause+regression+docs closure | 06 §9 |
| OPS-07..11 | wrong HTTP method, ambiguous error, 502 during upgrade/restart, stale job | real callback tests, durable job, distinguish original/rollback failures, no blind re-submit | 05 §8, 06 §9 |

**Важное правило:** свернуть один диапазон (`PERM-08..13`) удобно для объяснения, но **release checker обязан создать отдельную запись на каждую строку каждого ID**. Ни одна таблица этого документа не является заменой полного per-ID report.

## 6. Readiness matrix: что уже доказано?

На дату редакции **документационный комплект не содержит работающий Venus**, поэтому все implementation evidence = **NOT_RUN**, а не PASS.

| Feature / environment | Status in this document | Blocker to close | Evidence path to retain |
|---|---|---|---|
| Room 8 connected participants | NOT_RUN | real DB WS tests | `ci/rooms-8-report.json` (future) |
| Relationship privacy / no coercion | NOT_RUN | RE test suite and human content review | `ci/re-policy-report.json` |
| Card production packs 100/mode ×3 locales | NOT_READY | publish ≥300 reviewed cards, cross-locale validation | `content/pack-manifest.json` |
| Online / in-person game adaptation | NOT_RUN | correct context filter & phone test | `ci/context-e2e.json` |
| Music synchronized + source rights | BLOCKED | signed rights register and DRM-free licensed streams | `content/license-evidence.json` |
| Desktop ScreenCapture A/V | NOT_RUN | 1+7 live WebRTC measurement | `ci/rtc-smoke.json` |
| Android screen + playback audio | SPIKE | supported OS/app matrix | `ci/android-device-matrix.json` |
| iOS screen + app audio | SPIKE | supported OS/app matrix | `ci/ios-device-matrix.json` |
| Central Exocortex Parts 00/13 policy integration | BLOCKED | exact immutable policy revisions and integration matrix | `release/policy-revisions.json` |
| Signed release, full Part12 report | NOT_RUN | protected CI signing + 118-ID evidence | `release/known-problems-report.json` |
| Public DNS/TLS/SNI/UDP and rollback | NOT_RUN | real operator host readiness | `deployment/readiness.json` |

`NOT_RUN` in this matrix is honest preliminary readiness; it does not prevent delivering this zip as a specification. It **does prevent** claiming production implementation is complete.

## 7. Incident workflow — reproduce, contain, fix, prove

1. **Classify symptom** with `VNS-RISK` and upstream Part12 ID. Record event time UTC, affected revision, exact artifact digest, process/feature health, safe correlation ID and reproducible steps without user secrets.
2. **Contain immediately:** privacy/consent incident → disable private/sensitive feature, revoke grants and invitations; infrastructure incident → preserve previous healthy route/runtime, do not run destructive bootstrap; illegal media → disable track/source.
3. **Root cause:** locate boundary (capture, ICE, WSS, app API, DB transaction, permissions, licensed storage, renderer, release signing/updater); test the smallest local reproducible unit and the public critical path.
4. **Permanent fix:** update correct module, add automated regression, include config/schema migration if needed, update docs/runbook and risk class. Workaround labelled with expiry, not treated as standard deployment.
5. **Two-way verification:** prove preconditions before change and healthy postconditions after; compare old/new versions, actual running digest, data, UI + SNI; perform explicit rollback rehearsal for schema/runtime changes.
6. **Close with evidence:** issue links to immutable CI logs (redacted), `ci test ID`, signed release, external smoke and owner approval. No «works on my machine» closure.

## 8. Release hold / rollback authority

- **P0:** affected module cannot become public-ready; if already public, operator disables sensitive feature/isolates service and publishes safe status. Rollback via authenticated scoped Updater, with exact last-known-good image and verified backup if data changed.
- **P1:** hold advertised affected feature and release if central Part12/required functional gate fails. A product release may intentionally ship a different completed scope with inaccessible affected module **only if** dependencies/migrations remain safe, named in release notes.
- **P2:** requires issue, tracked acceptance and published impact; may ship when no security/legal/compatibility rule is weakened and product owner approves.
- If rollback returns `ROLLBACK_FAILED`, **не** объявлять old service recovered на основании флага. Actual DB/schema, Compose env, running image version, local and public health must be reconciled; preserve original and rollback failures.

## 9. Upstream problem-ID inventory verification (not a PASS report)

Included source snapshot has 118 distinct active IDs. `tools/check_docs.py` MUST verify IDs/uniqueness and current snapshot checksum. At production release, a **new pinned central Part12 revision** replaces this snapshot as evaluation authority; full `known-problems-report.json` enumerates every active ID once with `PASS/N/A` evidence; anything else blocks signing or final publication. No synthetic `PASS` placeholders and no fabricated host/TLS outcomes.

**Cross references:** [02 Technical](02_TECHNICAL_ARCHITECTURE.md) · [05 CI](05_CI_QUALITY_AND_RELEASES.md) · [06 Deploy](06_DEPLOYMENT_AND_OPERATIONS.md) · [08 Relationship](08_RELATIONSHIP_ENGINE.md) · [09 Cards](09_CARD_AUTHORING_AND_AUTOMATION.md).
