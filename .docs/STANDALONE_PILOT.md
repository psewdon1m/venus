# Venus · Standalone local-pilot profile v2

**Основание:** прямые решения владельца 2026-10-19; [ADR-019](adr/ADR-019-standalone-local-pilot.md), [план v2](10_IMPLEMENTATION_PLAN.md). **Статус:** принят scope, реализация и гейты проверяются отдельно.

## Граница поставки

Venus — самостоятельная платформа на одном хосте. Для текущей приёмки достаточно Docker Linux и локальных браузерных клиентов. Нет зависимости от Exocortex, external Updater или Neptune/Gryphon/Wyvern/Window. Метрики, диагностика, секреты, update journal и recovery, которые нужны этому scope, реализуются в Venus. Обычная роль хозяина комнаты не является оператором установки.

| Область | Сейчас | Чего результат не подтверждает |
|---|---|---|
| Rooms + Games | G1, три режима, private pair text, 2…8 участников, 18+ | approved catalog до исправления P04 HOLD |
| Entry documents | явно маркированные mock legal для приглашённых друзей; 18+ отдельно | юридическую готовность публичного сервиса |
| Updates | Venus-owned UI/API + ограниченный исполнитель; signed exact artifacts | внешнюю совместимость с Updater или наличие реальных signing secrets |
| Backup | atomic full PostgreSQL host-file export + validated restore | работу внешнего копирования или сохранность секретов, которых в архиве нет |
| Cinema | встроенный media server на том же хосте, desktop capture по реальным evidence | внешнюю NAT/ICE/UDP и мобильную поддержку |
| Calls | и общий комнатный, и приватный pair | доступ хозяина комнаты к чужим pair media |
| Music | DEFERRED_OWNER, музыка ещё не выбрана | G2/rights approval |
| Mobile publishing | DEFERRED_OWNER | G4/Android/iOS device capture |
| Domain | planned venus.shmoza.net / Cloudflare / certbot default location | существующие DNS records, сертификаты или production-host |

## Runtime и доверительные границы

Приложение непривилегированно, host bind loopback, БД в закрытой сети без host port. Владелец отдельным ответом чата 2026-10-19 принял встроенный media server на том же хосте. Он работает отдельным hardened process/service в Venus Docker deployment с pinned versions/digests, compatibility matrix и actual media readiness. Конкретный сервер и local ingress закрепляются после аудита; открытие media ports на том же хосте возможно только в измеренном конфиге. Hermes — двухсторонний reference, не подтверждение готового multiparty media server. API не монтирует Docker socket, `/etc/letsencrypt` с private keys или соседние проектные каталоги.

Update UI контролируется собственной operator identity. Room invite/host capability не даёт права обновления, backup download или restore. Узкий исполнитель принимает bounded идентификатор проверенного release/job, а не произвольные shell/URL/paths. Он управляет только Venus resources. Privilege boundary проверяется отрицательными тестами и независимым review до apply.

Реальный private signing key при необходимости генерируется защищённо и размещается владельцем в выбранном secret store/защищённом release environment. Public key/key_id можно фиксировать в репозитории; секреты не печатаются и не попадают в fixture/архив. Существующие fixture keys не становятся production keys.

## Backup и безопасное восстановление

Согласованный full PostgreSQL dump, manifest и encrypted preferences/snapshots составляют host-file backup. `.env`, сессионные токены и secret keys исключены. Перезапись валидного файла допускается только атомарным новым файлом после проверки; незавершённая запись не считается backup. Защищённые file permissions, size/digest/schema, дисковый лимит, corrupt/truncated input и rollback fault tests обязательны.

Deletion/withdrawal ledgers находятся на отдельном durable volume и не входят в откатываемую единицу DB backup. Restore старой БД сначала сверяет/применяет текущие ledgers; missing/corrupt/regressed ledger закрывает serving. Шифрование preferences проверяется фактическим расшифрованием после отдельного восстановления ключа в изолированном drill.

Venus очищает собственные backup exports в пределах принятого ≤7 дней; формат содержит created_at/expiry и write boundary. Внешний backup-механизм отвечает за свои копии вне Venus; их возраст/удаление записывается как external NOT_RUN, пока нет evidence. Экспортный файл не заменяет отдельную защищённую процедуру сохранения ключей. Retention отношений по U-002 сохраняется: только в комнате, idle24h, primary≤24h после закрытия.

Для controlled local drill сравниваются данные на согласованной backup boundary; допустимая потеря после неё и реальные SLA не выдумываются. Результат содержит backup age, фактический recovery time, потерянные/восстановленные записи и безопасное admission decision. Эксплуатационные RPO/RTO пока не утверждены владельцем.

## Единый media transport · уточнение владельца 2026-10-19

Для Cinema, общих Calls до восьми участников и приватных pair Calls применяется один Venus-owned встроенный SFU/media server на том же хосте. Отдельная P2P-ветка и P2P fallback не реализуются. Это прямое уточнение владельца и согласованное техническое решение текущего scope; конкретная SFU-реализация ещё проходит аудит/выбор.

Приватный звонок имеет отдельный media-room namespace, ACL и точный состав из двух участников; хозяин основной комнаты не получает доступ автоматически. Общие Calls разрешают каждому вступившему участнику публиковать только свои mic/camera после явного согласия и минимального grant. Cinema использует отдельный host-only publisher lease. Общий transport не объединяет эти namespaces, permissions или recipients. Negatives должны доказать отсутствие cross-room/cross-pair подписки и публикации, а также запрет stale token/rejoin после revoke во всех трёх сценариях.

## Проверки и граница claims

До каждого измерения фиксируются machine/toolchain/image, источники synthetic/actual capture, профиль сети/длительность/samples/thresholds, tests и rollback. Отдельные агенты пишут source-bound отчёты. При замечаниях автор исправляет, повторяет затронутые тесты, reviewer выполняет новый раунд; предыдущие FAIL сохраняются. Каждая стадия и каждый агент регулярно ведут собственный `.history` журнал.

Локальные восемь browser contexts нужны для concurrency/ACL/load, но не доказывают восемь устройств. Docker-throttled/UDP-blocked profiles моделируют отказ, но не доказывают публичный NAT/TURN. Desktop WebKit tests не подтверждают iOS Safari. P08/P10 не получают PASS за выключенную capability.

Полный P04 пока HOLD: [рецензия450](implementation/evidence/Venus_P04_FULL_REVIEW_450_2026-10-19.md) — вход на исправления, не подпись approval. Все текстовые/metadata правки получают revision/hash и повторное ревью, права и минимум100 reviewed/mode подтверждаются отдельно.

## Будущий внешний запуск

Запланирован `venus.shmoza.net`, Cloudflare infrastructure и certbot certificates в стандартном каталоге `/etc/letsencrypt/live/venus.shmoza.net/` (`fullchain.pem`, `privkey.pem`). Это шаблон будущего deployment: домен ещё не привязан, сертификаты/production-host не предоставлены. Local tests используют собственные test certs и не читают реальные production keys.

Перед внешним запуском отдельно потребуются реальный operator/legal profile, DNS/TLS/WSS/Cloudflare policy, network/ICE reachability, target capacity, реальный secret recovery и утверждённый пилот. Отсутствие этих входов не блокирует standalone local tests и не оправдывает заявление production readiness.
