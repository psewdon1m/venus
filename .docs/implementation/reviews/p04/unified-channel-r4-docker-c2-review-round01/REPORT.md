# P04 r4: независимый аудит actual Docker C2 round02

**PASS_ACTUAL_LEGACY_P04_C2_DRAFT_ONLY.** Замечаний в проверенной области нет. Docker не повторялся. Этот PASS закрывает фактический P04-C2 draft coverage на указанном source/image/catalog; human approval, новый V2 semantic C2 и полный EXIT-P04/P05 остаются открытыми.

Вход: `.docs/implementation/evidence/p04/final-coverage-docker-20261020-round02/INDEX.json` SHA **722d8a4856318ca0d6215e8eb5b8fbd2e707bb552a1d0698afae4dcb84df1776**. Проверены все10children lengths/hashes; семь actual raw outputs (`analysis`, обаcoverage, receipt, stdout/stderr, command) побайтно равны сохранившимся `.artifacts/p04-final-coverage02` originals. Inline command независимо восстановлен из Python AST producer и совпадает с raw `command.mjs`. Никакой нормализации JSON/строк для сравнения не применялось.

Source **b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4 / 1819**, image **sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5**, r4 catalog **dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270**, pack **sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4**. Catalog digest пересчитан из470actualcards. Frozen source identity пересчитан из полного1819filemap; свежий current `stage_inventory` в момент аудита полностью совпадает. Coverage source hash совпадает с точными bytes ранее принятого независимого coverage-code review. Build exit0/log содержит этот image digest и фактический build; freeze/build witness сохранены в собственном packet.

Image/source граница здесь опирается на frozen root build witness и actual pinned-ID run; reviewer не выполнял новую image-filesystem extraction или компиляцию. Это не clean Git source acceptance: root freeze прямо называет dirty candidate. Пер-command/внутриконтейнерный полный source inventory не изобретён.

## Полный состав и результаты

Каждый profile содержит **5880 уникальных клеток**, строго полный Cartesian product `3mode × 2context × N2..8 × stage1..4 × comfort0..4 × 7classes`. Независимый verifier проверяет не только длину, но все уникальные ключи, rule precedence и ожидаемый status каждой клетки. Дубликат вместо пропуска не проходит равенство полного множества.

| Profile | Cells | Private coverage | Private cases R100 | Baseline late eligible F/G/M/S/R |
|---|---:|---|---|---|
|Channel off|5880|PASS с явной недоступностью,0CONTENT_GAP|420 **CAPABILITY_UNAVAILABLE**,0private rounds|0 eligible private cards в обоихконтекстах|
|Channel on|5880|PASS,0CONTENT_GAP|420 **PASS**,private opportunities≤25|Q47 / TD50 / YB46 в обоихконтекстах, дляN2..8|

В каждом profile **4200 neutral C0/F sessions R1..100 PASS**, включая **42 R20 PASS** (3mode×2context×7sizes);14YesBut all-X profiles имеют ожидаемый безопасный refusal, а не принудительную пару. Итого4214neutral/veto rows. Все420private keys точно покрывают3mode×2context×7sizes×comfort1/4×5classes; rounds100, no duplicate/missing keys. On baseline≥25 проверен для каждой late eligible клетки, независимо от числа actor permutations.

Статусы клеток:2940RULE_EXCLUDED_STAGE,588RULE_EXCLUDED_COMFORT,672RULE_EXCLUDED_CLASS, оставшиеся1680 — offCAPABILITY_UNAVAILABLE или onSUPPORTED. **CONTENT_GAP отсутствует** в обоих профилях. Порог25 и private budget100 сохранены. Верхнеуровневый `private_coverage:PASS` off не выдаётся за420 завершённых приватных игр: все420cases явно unavailable, фактическое число private rounds0. Прежние840in_person gaps из r3 и старые compiled-off labels остаются историческими результатами, не перезаписаны.

Raw report относится к **legacy P03 eligible/preflight**, который действительно вызван pinned command. Проверки100uniqueplans/no-repeat/early-private/≤25 исполняются существующим coverageReport, иначе процесс не завершился бы0; полный список individual plans в этом packet не хранится. Это не actual HTTP/WS/browser100-round session и не `selectNextTopicRound`/allow-exclusion/semantic-history/targeted-replacement C2. Эти будущие свойства нельзя выводить из приведённых чисел.

## Exit, inputs и очистка

Actual Docker `q.returncode=0` зафиксирован receipt, согласуется с root RECORD/наблюдавшим запуск root, структурированным stdout470/digest и пустым stderr. Wrapper использует точный image, `--rm`, unique name/label, networknone, readonlyroot, UID1000, capdropALL/no-new-privileges,1CPU/1536MiB/64pids, readonly candidate bind. Реальная команда импортирует compiled catalog/engine из image; продуктовые backend/DB/HTTP здесь не подменяются заявлением о запуске сервиса — это offline catalogue/planner process внутри Docker.

Все **470 raw SHA** равны captured before map, current r4 files и авторскому r4 freeze. В исполнившемся pinned wrapper есть независимый after capture и `assert after==before`; receipt фиксирует input_unchanged. Отдельная полная after-map не сохранена, и её наличие не приписывается packet. Текущие bytes также независимо совпадают со всеми470beforepins.

Cleanup `completed` связан с checked wrapper: `--rm`, preflight exact name inventory пуст, post-run owner-label `docker ps -aq` успешен и пуст. Это единственный создаваемый контейнер; собственных Docker network/volume producer не создаёт, только два bindmounts и встроенный networknone. Нового reviewer Docker inspect не было; свидетельство очистки — root receipt/actual wrapper, а не выдуманный собственный post-run запрос. Историческийfailedprefix или чужой owner не трогались.

## Границы приёмки

Независимые metadata/applicability/history r4 ранее приняты отдельно (`397dfc7b…`,143metadata/327rawsame/2340textfields/717localehashes/18record+12CASexactreplay). Нынешний actualC2 закрывает ранее **PENDING final newsource Docker P04-C2** для точных b244/image0b4/catalogdfb3. Он не отменяет helddraft и ожидаемый release validator FAIL473: reviewed0/humanHOLD/noactivation сохраняются.

Новый API/UI unified-channel scope имеет отдельного автора/reviewer, V2 semantic C2/fairness/inference/runtimecanaries, полная браузерная/UI matrix и compatible rollback — отдельные гейты. Нет production/DNS/TLS/device или fullP04/P05 заявления.

Reviewer команда `.venv/Scripts/python.exe -B .docs/implementation/reviews/p04/unified-channel-r4-docker-c2-review-round01/audit.py` завершилась **exit0**. `audit-run01.txt` и `audit-result.json` содержат фактический результат. Исторические packets/source/runtime/card files не менялись. Писались только собственные review files/journal; Docker calls0. METHOD18 до author freeze не начинался. **Writes COMPLETE после INDEX/HANDOFF.**
