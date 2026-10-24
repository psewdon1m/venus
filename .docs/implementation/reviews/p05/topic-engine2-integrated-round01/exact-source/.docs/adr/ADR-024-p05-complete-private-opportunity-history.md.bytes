# ADR-024 · Полная история приватных возможностей

Дата: 2026-10-19. Статус: `FIX_CANDIDATE / INTEGRATED_TESTS_PENDING`. Основание: [TG-AR-001](../implementation/reviews/p05/topic-anti-repeat-microfixtures-round01/REPORT.md), strict anti-repeat P03-M3 и [независимый prospective review](../implementation/reviews/p05/topic-anti-repeat-prospective-round01/REPORT.md). Каталог450 сохраняет HOLD; stage PASS не заявлен.

## Планирование

Алгоритм `RE-1.P05-TOPIC-2` получает предыдущую приватную пару из полного `history.rounds` текущей сессии. Возможность без текста, отказ и замена не стирают её; промежуточные публичные раунды не сбрасывают память. Content history служит учёту использованных карточек и семантических семейств. Fallback последней content history предыдущей сессии остаётся дополнительной эвристикой; он не объявляется полным room-wide журналом пустых возможностей.

Повтор предыдущей пары запрещён, когда есть другая пара с неиспользованной допустимой карточкой после hard eligibility, полного объединения тем, разрешений/исключений обоих и semantic blocking публичной/собственной pair history. Один фильтр используется для альтернативы и кандидата. При N2 или отсутствии эффективной альтернативы повтор допустим. Private cap и запрет ранних stages сохранены. Публичный график и его RNG не потребляют приватные темы, исключения или историю.

## Версия и запуск

Новые snapshots получают engine2. Исторические snapshots/proofs не переписываются; неподдерживаемая revision не интерпретируется новым selector.

Метод `bootGate` не обращается к source/catalogue, но обычный server требует совместимые released profile/catalog ledger ещё до создания TopicGames. Различаются два исхода:

1. Если исходные требования запуска выполнены, barrier завершает отзыв transient private scopes до listen. Активные/приостановленные sessions с неподдерживаемым или повреждённым authenticated snapshot header переходят в aborted. Проверяются engine/private/recovery revision, формат pins и baseline room/session/schema. Ciphertext snapshot/history и внешние roots сохраняются.
2. Если исходные требования не выполнены, server не слушает порт. При approved registry0 и существующих protocol2 данных это ранний отказ. Он не означает, что bootGate выполнился, данные очищены или maintenance завершён. Synthetic profile/catalog bypass не вводится.

Prior history не пропускает запись с признаками прежнего старта: snapshot, pack_digest, completed state, ненулевой current_round, rounds, participants либо history object. Для такой записи отсутствие snapshot означает `TOPIC_HISTORY_UNAVAILABLE`/503. Неподдерживаемая snapshot revision также закрывает новую игру в той же комнате. Это защита наблюдаемых corruption/partial-restore случаев, а не обнаружение произвольного удаления всех следов из БД. История не стирается для продолжения игры.

Закрыть экспериментальную комнату и создать самостоятельную новую можно только через доступный совместимый авторизованный runtime. Во время раннего startup refusal этот путь не обещается. Offline retirement command здесь не реализован; до появления совместимого входа сервис остаётся закрытым. Роли, identity и частные разрешения в новую комнату автоматически не переносятся.

## Откат и гейты

Остановить новые starts новой revision, quiesce текущие игры и отозвать private epochs/acks/advice/chat; выход остаётся доступным. Сохранить monotonic exclusions/retirement и history. Возврат допускает только явно совместимый reader; старый дефектный алгоритм не становится соответствующим strict gate. Переключение версии не возвращает старое согласие.

До приёмки нужны исходный seed0/fixed16, N2/no-effective-alternative/full-union/semantic/decline/replaced/public-counterfactual controls, startup unsupported/corrupt header и started-prior controls, затем применимые actual Docker/API/WS/browser/restore и measurements на точных новых bytes. Shadow30 PASS является отдельным источником evidence; интегрированный PASS и production boot им не заменяются.
