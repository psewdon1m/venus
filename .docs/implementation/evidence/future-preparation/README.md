# P04–P11 · Подготовленные результаты и внешние входы

Это передача фактического состояния, не разрешение выпуска. Полные гейты остаются открытыми; исследования, fixture tests и source-only patches имеют отдельную область доказательств.

| Этап | Подготовлено | Что необходимо для продолжения |
|---|---|---|
| P04 | 450 draft, реальный P03 coverage, защищённая публикация/отзыв, технические проверки | Настоящие независимые редакторские, safety, rights и RU/EN/TR решения по точным хешам; затем reviewed bundle и повтор тестов изменённого source |
| P05 | Проверены входные зависимости и fail-closed admission | EXIT-P04; утверждённые оператором оферта/privacy RU/EN/TR с реальной identity и юрисдикцией |
| P06 | Отдельная ветка `feature/p06-release-preparation`: offline verifier, RSA/common wire interoperability, bounded USTAR, Windows/Linux tests | Матрица Venus, совместимый выпуск Updater, production trust, окончательный P05 и реальные install/update/restore/rollback |
| P07 | Аудит необходимых deployment inputs | Принятые P05/P06; целевой сервер, оператор, домены/TLS, независимые клиенты и пилот |
| P08 | Первичные источники о правах и предложение ограниченного оригинального каталога | Конкретные аудиофайлы и доказанные права на нужные способы использования |
| P09 | Первичные LiveKit источники, обнаружено ограничение cached-token revoke | Внешний SFU/network/operator profile, проверенный revoke, реальные A/V клиенты и измерения |
| P10 | Первичные Android/iOS capture ограничения | P09; реальные устройства, подписывание/распространение и испытания обеих платформ |
| P11 | Сохранена отдельная граница Calls | P09; принятый scope/API/ACL/audio-focus контракт и собственные RTC испытания |

## Конкретные пакеты для проверки

- [Human handoff: карточки и неподписанный шаблон](../p04/human-handoff/README.md). Генерация не удостоверяет права, язык или редакторское решение. Закрытые ключи не помещаются в репозиторий или чат.
- [Предлагаемый профиль Venus](venus-dependency-profile.proposed.json) и [предлагаемая строка центральной матрицы](general-venus-matrix.proposed.patch). Рекомендуется минимальный G1: обязательный Updater, без неявного подключения остальных shared agents. Owner/operator ещё не назначены; RPO/RTO не приняты.
- [Actual Updater API/source audit](updater-api-preflight.md), [проверка публичного release](updater-public-release-preflight.json) и [подписи](updater-public-signature-preflight.json). Версия 0.6.17 известным образом несовместима с Venus; наличие публичного файла не устанавливает production trust.
- [Source-only Updater proposal](updater-venus-proposal/proposal-report.json), [независимый исправленный review](updater-venus-proposal/review-round-02.md). Две allowlist-правки с тестами устраняют обнаруженные отказы, но не реализуют весь Venus restore/compatibility contract. Требуется новый выпуск владельца Updater. Старый tag/assets не заменяются. Чужие репозитории не изменены.
- [118 активных Part12 problem IDs](known-problems-inventory-4449e65.json): applicability пока PENDING, release checks NOT_RUN. Перечень не выдаётся за пройденную проверку.
- [Первичные исследования Music/SFU/mobile](media-research-20261019.md), [конкретные незаполненные внешние входы](operator-inputs.json).

P06 implementation source: `7e1a85b3b9454b64a2c1ec50ab05c30c94c17557`, identity `91c018424c1d95a808fb49fe64b4269cdd61815bef4bdde3d5f00f23088d2bff` (246 included files). [Передача отдельной ветки с хешами отчётов](p06-preparation-handoff.json) фиксирует два независимых scoped PASS, clean full quality и отдельный Linux49 прогон. Он находится в отдельном managed checkout; перенос в P04-кандидат не выполнялся. Его проверки не являются приёмкой финального P05-приложения.

## Возврат и продолжение

Принятая исходная точка — main `579ca40a9344fd0af841ff2e2883e394321dfbe7` / `p03-accepted-20261019`. P04 и P06 остаются отдельными ветками, production catalogue/admission закрыты. Не было установки, enrollment, смены trust или центрального ingress. Для отзыва подготовленного предложения достаточно не применять patch; действующее окружение не изменено.

После внешнего решения его источник/принимающий/область фиксируются отдельно, без переписывания старых FAIL/PENDING. Любое изменение включённых исходников требует новой source identity, актуальных тестов и независимого review. Доказательства текущего draft нельзя перенести на reviewed pack или production host автоматически.
