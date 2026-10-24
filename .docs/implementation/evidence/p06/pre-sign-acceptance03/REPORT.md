# P06 — pre-sign03 after bounded CI socket-group correction

**PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT** на clean911ac0771541a5f2c3c01f766f6222f383c21565/core5a917292b99797afaaf58c7f41e21a1a24cf3358d923da071cad782a96f5f087,1944файла. Полный EXIT-P06 HOLD до corrected-head CI и настоящего qualified release. P07 не начат.

CI старого358a/corea1 отклонил начальную установку: fixture executor UID1001 имел только supplementary group0, недостаточную для Docker socket GitHub runner. Root fixture driver с тем же Docker CLI работал; DB/app mutation не началась. FAIL и исходные reports сохранены. Оставшиеся четыре длинных statistical jobs старого отклонённого head остановлены, а не записаны как PASS.

Исправление ограничено измерением stat(socket).gid и передачей его только trusted executor вместо0, public GID receipt и новым immutable pre-sign03 path workflow. App/API/DB/operator runtime, consumer/operator privileges и mode сокета не изменялись. Два независимых агента приняли source fix и текущий localactual10. GitHub nonzero-GID execution ещё pending и должен пройти в обязательном новом CI до merge/release.

Actual10:18checksPASS,9реальныхSIGKILL-фаз,11сравненийcounts,17jobjournals,fullPostgreSQLrestore/decryption,currentprotectedledgers/non-resurrection,offlineAload и UI502/reload;37nativecommands exit0,ownedcleanupcomplete. Локальный измеренныйsocketGID0 не подменяет nonzero-GID GitHub proof. lint14exit0. Семь recovery event intervals2545–9198ms по исходным UTC timestamps, не engine stopwatch и не SLA. Старые unit10/quality03 сохраняют provenance и отдельно привязаны к неизменным runtime/component bytes.

Owner U020/ADR032/key59a72237 и protected environment/шифрованный secret готовы; реальные runner signing/image/main/tag/assets/anonymous OCI всё ещё проверяются отдельно. Все118ID:67PASS34N_A7artifactpending10productiondeferred. Исторические pre-sign01/02 не переписаны.

[Решение/pins/118ID](DECISION.json) · [Engineering](../../../reviews/p06/engineering-signing-round02/REPORT.md) · [Security](../../../reviews/p06/security-signing-round02/REPORT.md) · [Actual10](../docker-round10/INDEX.json) · [Preflight](../service-preflight02/INDEX.json) · [FAIL](../github-pr-fail01/INDEX.json).
