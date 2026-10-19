# Standalone v2 · Журнал пересмотра scope

Статус: SCOPE_ACCEPTED / IMPLEMENTATION_PENDING. Агент: `/root/standalone_scope`. Основание — прямое решение владельца 2026-10-19 (пункты 1–10) и последующий выбор встроенного медиасервера на том же хосте.

## 2026-10-19T12:31:01+00:00 / 2026-10-19T15:31:01+03:00 Europe/Istanbul

- Изучены план v1, ADR-012/017, исходный ADR register, check_docs.py и рецензия450. Её итог HOLD/P0; предоставление рецензии не означает approved pack.
- Подготовлены план v2.0.0, ADR-019 и standalone profile: самостоятельный Venus, local Docker, встроенный updater, host-file backup, отдельный обязательный18+, mock notices, встроенный медиасервер одного хоста и оба Calls.
- Исторические snapshots/P00 contracts не менялись. Прежние full-stage gates не переименованы в PASS; новые reports указывают standalone-local-pilot-v2. Music/mobile DEFERRED_OWNER; production DNS/TLS и устройства не выдаются за испытанные.
- Встроенный updater требует отдельного bounded executor; API без Docker socket/shell. Full restore сохраняет monotonic ledgers вне DB rollback. Эксплуатационные RPO/RTO не выдуманы.
- Первый helper создания журналов остановился после записи docs: отсутствует пакет timezone data у Python. Исправлено использованием фиксированного UTC+03:00 для действующего Europe/Istanbul; реальные timestamps приведены выше. Исходный helper не менял runtime.
- Фактический `python tools/check_docs.py`: PASS, 142 markdown, 10 reference images, 12 original draft examples, 0 broken links/snapshot errors. Это docs integrity, не implementation gate.

Откат: Git-revert scope docs по новому owner decision, сохранить исторические доказательства; runtime этими правками не изменён. Следующий шаг: независимый root-coordinated review и новые проверки на конечной source identity.

## 2026-10-19T12:31:37+00:00 / 2026-10-19T15:31:37+03:00 Europe/Istanbul · Проверки и handoff

- Повторный `python tools/check_docs.py`: PASS, 144 markdown / 10 images / 12 original examples / 0 errors. Git diff whitespace check назначенного plan: PASS. У plan сохранён исходный CRLF, diff 109 insertions/90 deletions.
- `python tools/check_p00.py`: FAIL, 8 stale source hashes для PLAN-P00-* и `P00 normative input changed without a new revision: .docs/10_IMPLEMENTATION_PLAN.md`. Это ожидаемая несовместимость новой ревизии плана с immutable P00 proof, а не разрешение переписать baseline. Root уведомлён; требуется versioned standalone trace/revision и historical-source validation.
- Старый check_p00 также жёстко требует ровно ADR001…012 и прежний status enum. ADR019 должен попасть в новый supplement/versioned registry, а не молча изменить принятый P00 index. Tools/registries/manifest в ownership root; мной не менялись.
- Handoff root: plan v2/ADR019/profile/stage journal готовы; embedded media server owner decision учтён. Полный независимый gate review ещё не заявлен. Runtime-код и исходные snapshots/P00 contracts не изменены.

## 2026-10-19T12:31:59+00:00 / 2026-10-19T15:31:59+03:00 Europe/Istanbul · Единый SFU

Учтено дополнительное steering владельца: один embedded SFU для Cinema, общих Calls и private pair Calls; без P2P/fallback. Добавлены exact-two private namespace/ACL, запрет автоматического host доступа, participant own mic/camera consent и отдельный Cinema host publisher lease. Scope docs авторские; собственный independent PASS им не выдаю. По поручению root начинаю независимый review entry/runtime реализации, которую не писал.
