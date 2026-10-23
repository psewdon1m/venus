# OCI14: оценка повторного использования перед новым drill

**BLOCKED_FOR_UNCHANGED_14_ORACLES / NOT_RUN**. Можно переиспользовать большую часть phase/factory/scenario/effect/browser helpers; запустить прежние14 без изменения оракулов на новой A и исторической B13b нельзя. Это установленная несовместимость ожидаемого состояния, не основание возобновлять широкую OCI05 инфраструктуру.

Входы: frozen04 под `.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume04`, original14 proposal, source текущей A `b244e61a…/1819` / ROOM-TOPIC-2 и исторической B13b ROOM-TOPIC-1. Binding04 указывает B `sha256:b6f49831e1ca16dafdcd45707144f050f4e302d4709a51d59f9981ce7b67ed6b` и A `sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f`. Новая A передана root как image0b4; полный exact digest/expanded UI+compiled+migration map должен прийти в новый binding. В этом задании image содержимое не инспектировалось и provenance новогоA не выдумывается.

## Два точных blocker

1. **Неподдерживаемая policy против supported-restart оракула.** B13b принимает только ROOM-TOPIC-1; новая A создаёт ROOM-TOPIC-2. В обеих версиях TopicGames.bootGate сначала вызывает clearPrivate; при несовместимом заголовке переводит game_sessions в aborted и делает continue до обработки round cipher/acks. Это правильный failclosed startup branch. Но `observations.revokedUntouched` требует именно round.data.state=stopped, invitation/action.state=stopped и acks.length=0; host factsOCI07/OCI12 требуют raw_round_stopped. При A2→B1 этот оракул недостижим: abort не равен supported round stop. При B2 freshE(policy1)→A3(policy2) проблема повторяется. Нельзя заставить прежний PASS, пропустив snapshot check, исправив policy_cipher/историю, принудительно очистив аcks SQL или назвав abort проверкой stopped. Не исполнять заведомо несовместимый метод.
2. **Один compiled64 map для двух разных приложений.** factory/image-modules используют один `binding.compiled_files` для A и B. Раньше оба API/engine64 были одинаковы, различался UI; текущий unified-chat изменил API/planner/UI. Нужны отдельные exact maps A/B, при каждом boot выбор своего map; проверка всех прежних64+expanded UI/migrations остаётся. Простая подмена binding source/image оставит false mismatch либо неправильные pins. Это узкая механическая адаптация, не ослабление оракула.

Проверки этих source-bound facts выполнены только как finite чтение/сопоставление веток (`source-bound-checks.json`), без imports/DB/Docker/child/API_RUN. Они не заменяют фактический rollback.

## Покрытие всех14 при последующем решении

| Control | Reuse / необходимая граница |
|---|---|
|OCI01|Exact A/B image/module/policy/map/schema checks сохраняются; нужен per-image64+expandedmap binding|
|OCI02|HTTPS/staticRoot/image UI bytes/TLS/version DTO helpers сохраняются; новые exact assets дляA|
|OCI03|Real18+/cookies/CSRF/Origin/host+observer denials и positive A/D через сценарии сохраняются|
|OCI04|HTTP exclusion/close/leave, authority advances/snapshot/history helpers сохраняются|
|OCI05|Untouched D live/unexpired до switch; ingress stop, poolclose/zeroDBclients/samePG+roots+keys сохраняются|
|OCI06|Distinct B process/no downmigration/migration-only equality сохраняются; actual new maps проверить|
|OCI07|**BLOCKER** unsupported policy abort branch не удовлетворяет raw_round_stopped/acks0 старого observer|
|OCI08|A exclusion/Bclosed/Cretired/newerroots raw preservation сохраняется; API denial shape под новой policy требует явной проверки, не broad4xx|
|OCI09|Receipt effects/freshID denials/no grant revival helpers сохраняются; unsupported responses нельзя пропустить как auth/rate/500|
|OCI10|Actual retainedA/freshB UI clear+safe exit остаются обязательными, не заменять restart; новые UI compatibility trace до RUN|
|OCI11|Fresh E на B технически возможно только с B policy1 и прежними synthetic pins; actual guarantee не заявлено. LiveE нужно сохранить до switch2|
|OCI12|**BLOCKER** E policy1→A3policy2 также abort, а observer требует round stopped/acks0|
|OCI13|Final exactA/safeexit/exclusions/identity/sourcepins сохраняются|
|OCI14|Owned cleanup/secrets/bounded rawindex и512MiB/900s остаются; Docker-only launcher должен реально учитывать PG/authority/private/tmpfs/shm/evidence concurrent allocation и force-stop exact ownedcontainers; Windows Job/CLI stop не заменяют это|

## Минимальный выбор root до реализации

**Вариант A:** существует действительно сохранённый предыдущий B с ROOM-TOPIC-2 и совместимыми источниками/миграциями/authority (дать exact digest+source/build maps). Тогда supported liveD/liveE barriers позволяют сохранить прежние14 semantics; per-image pins и короткий Docker-only orchestration — необходимые адаптации. Разные attestation digests одной текущей сборки/test target не надо выдавать за предыдущую версию приложения или содержательный rollback. Сама доступность такого B пока не подтверждена.

**Вариант B:** B остаётся13b/policy1. Тогда нужен новый явно согласованный **mixed-policy failclosed/quiesce/return drill**: separate expected unsupported startup branch, raw clearPrivate/no usable grants/aborted sessions, immutable snapshot/history/ledger сохранены, новая E создаётся строго по B policy1 и на возврате безопасно aborts A3. При необходимости реального origin-side quiesce — выполнить защищённые stop/decline на старом образе, но не заявлять после этого D_live_before_boot. Предварительно сравнить все14 proof obligations, отдельно описать unsupported encrypted inactive round/acks и отсутствие повторной авторизации; убрать точное stopped/acks0 утверждение можно только как **новую принятую методику**, не как unchanged14 PASS. Если исходное обязательство требует именно физического удаления аcks для unsupported branch, current code этого observer не доказывает: остаётся product finding/совместимый B, а не изменение теста ради зелёного.

Рекомендуется сначала проверить наличие совместимого B (вариантA). Если его нет, root принимает узкую новую failclosed методику и независимый reviewer утверждает её до RUN. Ни в одном варианте не требуется новый универсальный framework, старые04/05 не переписываются. Docker-only adaptation должна сохранить строгие bounds/actual PG+authority+browser+receipt controls; отказ из-за бюджета сохраняется NOT_ACCEPTED. До выбора ни executable draft, ни реальный RUN не начаты.
