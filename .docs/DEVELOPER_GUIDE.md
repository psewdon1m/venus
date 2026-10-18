# Разработка Venus · P01

Исходный репозиторий: [psewdon1m/venus](https://github.com/psewdon1m/venus). Рабочая ветка P01: `feature/p01-foundation`; изменения идут через PR в защищённый `main`. Обязательны `quality` и `container-smoke`, актуальность относительно main, закрытые обсуждения; force push/deletion запрещены, правило действует на администратора. Техническую приёмку выполняют отдельные агенты по U-004. Нулевой порог human approvals не заменяет независимый gate report.

## Зафиксированное окружение

Node **24.22.0**, npm **11.19.1**, Python **3.12.14**. Node version хранится в `.node-version`; `engines` и `.npmrc` отклоняют другую версию. Прямые npm-зависимости exact; транзитивные версии и integrity — в `package-lock.json`. Python-зависимости, включая транзитивные, — в `tools/requirements.lock` с SHA256 всех опубликованных distribution файлов. Не обновлять lock при обычной установке. Python и Node должны быть доступны как `python`, `node`, `npm` в PATH; на Windows использовать `npm.cmd` при ограниченном запуске ps1.

```sh
git clone https://github.com/psewdon1m/venus.git
cd venus
git switch feature/p01-foundation
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .venv\Scripts\Activate.ps1
python -m pip install --require-hashes -r tools/requirements.lock
npm ci
npm run quality
npm run test:container
```

`quality` последовательно проверяет ESLint, TypeScript, unit tests, JSON Schema/OpenAPI, RU/EN/TR, Python regression tests, документацию/историческую приёмку P00/manifest, production build и четыре отрицательные мутации. Отрицательные проверки сначала доказывают положительный контроль, затем проверяют ожидаемую ошибку в временной копии. Состояние исходников до/после обязано совпасть. Отчёт: `.artifacts/negative-gates.json`.

Контейнерные тесты требуют работающий Linux Docker Engine и Compose v2. Они собирают образ из pinned base digest, поднимают собственный случайный Compose project, настоящую PostgreSQL16 и app, проверяют отказ/возврат БД, согласованность version, runtime isolation, отсутствие секретов во всех слоях образа и логах. Проверки используют временные синтетические данные; `finally` удаляет только volumes/network этого project. Образ остаётся локально для осмотра. Отчёты и rendered Compose: `.artifacts/container/`. Команда требует чистую Git-ревизию; `--allow-dirty` допустим лишь для отладки и записывает неприемлемый для гейта `source_dirty: true`.

## Структура и текущее поведение

`apps/web` — React/Vite, комфортный custom UI на RU/EN/TR; `apps/api` — Fastify, pg, HTTP foundation. `packages/contracts` содержит foundation types из P00-2; `packages/i18n` — тексты каркаса. `packages/relationship-engine` и `packages/card-catalog` обозначают будущие server-only boundaries, availability=false; draft cards не становятся production pack. `infra/venus` содержит Dockerfile и disposable Compose.

Реализованы только `GET /health/live`, `GET /health/ready`, `GET /api/v1/version` и статические файлы. Rooms/Games/entry-policy/session/consent/migrations ещё отсутствуют. Неизвестный API возвращает404, не HTML и не фиктивный успех. Это непубличный каркас, `noindex`; он не является готовым входом с офертой/18+ из P05.

Readiness выполняет `SELECT 1` с ограничением времени; при отказе возвращает503 и database=unavailable. Liveness остаётся200, пока отвечает процесс. `schema_generation=0` означает отсутствие прикладных migrations, а не проверку будущей схемы. P02 обязан заменить это реальной проверкой ожидаемой generation.

Version `0.0.0` и source revision записываются при build. OCI labels совпадают с ними. Локальный image ID (`sha256` config digest) передаётся launcher через `IMAGE_DIGEST` и сопоставляется с `docker inspect`. Это **локальный image ID**, не registry manifest digest и не самостоятельная аттестация со стороны приложения. В P06 потребуется подписанный registry digest и доверенный launcher. Вне контейнера значение `unreleased` честно обозначает отсутствие image identity.

Логи — JSON с allowlist event/request_id/route template/method/status_code; query, произвольные URL, payload, cookie, authorization и исключения БД не журналируются. Request ID создаёт сервер. Секрет БД читается из внешнего файла; запрещено коммитить `.env`/ключи. Compose не публикует PostgreSQL; app binding только127.0.0.1. App nonroot1000, read-only rootfs, cap_dropALL, no-new-privileges; Docker socket не монтируется. Это disposable developer environment, production host не затронут.

## Просмотр интерфейса и отладка

После `npm run build` можно запустить Vite на loopback: `npm run dev -w @venus/web`. Для полного API используйте контейнерный smoke либо Compose с внешним файлом секрета, содержащим случайную строку >=16символов. Задайте `VENUS_DB_PASSWORD_FILE`, `VENUS_IMAGE` (проверенный local image ID), `VENUS_HTTP_PORT` и выполните `docker compose --project-name venus-dev --file infra/venus/compose.yml up -d --wait`. URL: `http://127.0.0.1:4300`. Завершение: та же команда с `down --volumes`; это удаляет синтетическую dev БД.

## История, доказательства и откат

Исторические исходники имеют разные окончания строк, поэтому `.gitattributes` сохраняет bytes без автоконверсии. Первый Git import нормализовал часть CRLF; полные исходные bytes восстановлены в P01. Доверенный P00 anchor — внешний архив `venus-p00-2-before-p01.zip` с SHA256 `bf2b3e8b02acf1a2904b1614049b46ae9c8f5b3c244ef1856682257825babb0d`, его byte-identical CI fixture — `tools/fixtures/p00-2.zip`. Исходный pre-P00 архив также скопирован byte-identically как `tools/fixtures/pre-p00.zip`; receipt и его digest сохранены. Fixture не заменяет отдельную резервную копию. Валидатор P00 проверяет прежние input hashes, тестовые результаты и два независимых review именно на frozen bytes. Текущие схемы/trace rows/snapshots проходят дополнительные проверки на текущем дереве.

При изменении исходников обновить consistency manifest явно: `python -B tools/update_manifest.py`, проверить diff, выполнить `npm run quality`. В inventory исключены только зависимости, output, caches и секретные env-файлы; новые исходники без manifest вызывают ошибку. Manifest не является криптографической аттестацией издателя.

Откат P01: отдельный PR с `git revert` implementation commit(s), обязательный CI, повторная сборка; запущенную disposable среду остановить её собственным Compose project. Прикладных migrations и пользовательских данных пока нет. Не снимать защиту main ради отката. Protected release/signing реализуются в P06: сейчас ни publish, ни release workflow, ни signing secrets не заведены; обычный PR/fork workflow имеет только contents:read и не использует environments/secrets/write tokens.

Первичные источники выбора: [Node releases](https://github.com/nodejs/Release/blob/main/README.md), [Node24.22.0 checksums](https://nodejs.org/dist/v24.22.0/SHASUMS256.txt), [Vite](https://vite.dev/guide/), [Fastify logging](https://fastify.dev/docs/latest/Reference/Logging/), [GitHub branch protection](https://docs.github.com/en/rest/branches/branch-protection).
