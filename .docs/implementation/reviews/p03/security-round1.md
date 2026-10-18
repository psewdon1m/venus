# P03 · implementation/security preflight, round 1

Reviewer: `/root/p03_security_review`. Дата: 2026-10-18. База HEAD: `c653a260993743971d436e8a2793b8a5d222a63a`; реализация runtime P03 содержит незакоммиченные изменения. Это pre-freeze review; **итоговый gate PASS не выдан**. Статус: **FAIL / corrections and final evidence required**.

Прочитаны P03 implementation plan, Relationship Engine 08, P00 CONTRACTS, entry review P03, ADR-015 и preregistered P03-M1; production `relationship-engine`, `Games`, HTTP/WS projections, room hooks, engine SQL и migration/readiness. Docker/integration runner не запускался параллельно основному исполнителю. Production pack и approved offer остаются unavailable; synthetic fixture не принимается за human review P04.

## P03-SEC-01 · P1 · consent допускает время до последнего acknowledgement

Файл: `packages/relationship-engine/src/consent.ts`, `ConsentOffer`, `consentAllows`, `consentResponse` (на момент review строки 6–8, 21–22, 31–32).

`consentAllows` проверяет только active state, actor, два acks и верхнюю границу `now < active_until`. Нижней границы нет; модель не сохраняет момент activation/последнего acknowledgement. Это нарушает explicit CONTRACTS §8: `now >= max(invitation.last_at, action.last_at)`. При откате wall clock сервер снова разрешает private/action read во времени, когда оба acknowledgement ещё не существовали.

Проверено исполняемым Node 24.22.0 против actual compiled production `dist/consent.js`:

- invitation создана в 1000, accepts actor A/B в 2000/3000; `consentAllows(active, 'a', 1500)` возвращает **true**;
- action создана в 4000 с invitation limit, accepts в 5000/6000; `consentAllows(action, 'a', 4500)` возвращает **true**.

Исправление: сохранять server activation/last-ack time в encrypted offer и fail-closed нижнюю границу; action permission проверять вместе с invitation lifetime. Regression для обоих scopes: до последнего ack, точно на ack, до expiry и точно на expiry; повторный старый accept не двигает activation/lifetime.

## P03-SEC-02 · P2 · валидный template/name нарушает transport и padded storage limits

Файл: `apps/api/src/games-model.ts`, `localText`; `packages/relationship-engine/src/pack.ts`, `semantics`.

Подстановка ролей не проверяет результирующую длину. Ограничение card text 350 code points не гарантирует `PublicRound`/`PrivatePrompt` max4000 и padded JSON limit16380 bytes. Контролируемое участником допустимое имя может расширить повторные placeholders так, что start/advance rollback с `503 ENCRYPTED_VALUE_TOO_LARGE`, либо projection нарушает schema.

Проверено на actual production `FrozenPack.load`, `localText`, `publicRound`, `Keyring.encrypt`:

1. Synthetic `Q-0005` сохраняет metadata; question каждой локали заменён на `'{P2}'.repeat(87)` — 348 code points, `FrozenPack.load` успешно валидирует.
2. У P2 имя `'😀'.repeat(48)` — допустимые 48 graphemes и 48 Unicode code points.
3. Render: **4176 code points / 16704 UTF-8 bytes**.
4. `Keyring.encrypt({body: publicRound, session:null, memberId, status:200}, aad)` выбрасывает **ENCRYPTED_VALUE_TOO_LARGE**.

Исправление: pack/template render-budget с учётом допустимого display name и всех подстановок либо иной явный bounded render contract; не обрезать смысл safety task молча. Нужен boundary regression с Unicode names, повторными placeholders и допустимым максимальным idempotent reply.

## P03-SEC-03 · dispatch race · требует устранения или отдельного доказательства

Файлы: `apps/api/src/rooms.ts`, `socketState`; `apps/api/src/room-routes.ts`, `sendGame` и WS ticker (на момент review 98–102, 120, 128).

Private projection формируется под room lock в transaction; после COMMIT уже готовые plaintext events отправляются `sendGame` вне этого lock и без нового current ACL/consent/deadline check. Потенциальный schedule: подготовлен bundle → committed revoke/end/expiry → dispatch сохранённого bundle. Особенно это существенно при втором server process/worker и wall-clock expiry; обычный однопроцессный happy-path тест не доказывает отсутствие race. Это code inspection finding, transport exploit в настоящей PostgreSQL этим reviewer пока не воспроизведён.

Нужен dispatch fence/current validation, сохраняющий сериализацию с revocation, и deterministic barrier regression: подготовить доступный prompt/condition, отозвать scope перед dispatch, убедиться, что stale payload не отправлен. Если безопасность обеспечивается иной гарантией, она должна быть явной и проверяемой, а не зависеть от текущей скорости event loop.

## P03-SEC-04 · очистка private recipient при быстрой смене round

Файл: `apps/api/src/games.ts`, `socketView` (на момент review 280–297).

Outbox refs выбираются только для current round/current game_rev и только когда member входит в current actors. После A/B private round последовательные finish/stop и advance к C/D могут завершиться до секундного ticker. Тогда A/B уже не current actors; старое `game.private_cleared` не будет доставлено. HTTP scope закрыт, но transport очистка предыдущего private prompt не гарантируется.

Нужен deterministic test с двумя сменами до tick и явный гарантированный clear предыдущему recipient либо обязательный проверенный client contract, очищающий private state на смене/terminal game.snapshot. До реализации клиента нельзя считать его предполагаемое поведение доказательством очистки.

## Положительные наблюдения и оставшиеся доказательства

Room locks сериализуют start/advance/consent; actor role берётся из scoped SQL FK, не из request member ID. Snapshot и round payload encrypted с room/session/round AAD; room/private projections разделены. Invitation и action имеют разные server offer IDs/revisions; условие меняет revision и сбрасывает старые acks. Public private-phase projection generic, без card ID/actors/condition. Terminal scopes не открываются повторно, safety operations не зависят от stale room revision. Public online private capability отсутствует до actual text channel.

`quiesce` — только trusted primitive; обязательный operational fence новых starts/dispatch и P03→P02→P03 proof ещё требуются. Итоговые real PostgreSQL HTTP/WS races/ACL, restart/restore/pinning, 70000 synthetic sessions и preregistered fairness/inference report пока не представлены этому reviewer. После исправлений нужны final source-bound repeat review и ссылки на точные результаты; данный отчёт не заменяет финальный гейт.
