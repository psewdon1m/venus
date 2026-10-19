# Updater Venus source-only proposal · independent review02

**PROPOSAL_REVIEW_PASS — не EXIT-P06 и не принятие Updater release.** Reviewer `/root/p04_evidence_review`. Upstream source17e2dcf1e72bbc6492ea5692520932d1c95a618f; неизменный patch SHA256 `dec8a40ec7f7f8b85cd46ee3d5c92deceb1bda5e6b83537a4e477e14ca699d64`. Открытых замечаний к ограниченному scope этого proposal нет. Round01 CHANGES_REQUESTED сохранён.

## Исправление UVP-E01 независимо подтверждено

Собственный read-only helper повторно прочитал все9 raw blobs через git show17e2 и отдельно получил `git archive` этих9 paths. Исправленный input_files_before точно совпадает с raw Git blob hashes; initial_archive_export_files и неизменный origin receipt совпадают с archive-export bytes. Все9 archive exports становятся raw bytes только после CRLF→LF; первоначально побайтно совпадал1/9. Witness path/size/hash совпадают с самостоятельно полученными bytes. Старый7657-byte report сохранён и проверен по descriptor hash; исходный metadata finding не затёрт.

Проверены все proposal-report.files descriptors, saved reproduction helpers, old-report/witness descriptors и все11 input_files_after hashes против фактической owned source copy. Source comparator отдельно подтвердил: девять baseline files — exact upstream raw bytes, кроме двух объявленных allowlist additions в patched files; новый Go harness/public vector отдельно учтены и не вошли в upstream patch.

- Исправленный proposal-report SHA256: `0606a933fea14e7159398f0a9e23c4dd14fee270c8ffd94533cb761fd6100e57`.
- Archive witness SHA256: `cc6205eea89191613f01c6c1217ee7a7456b88155cdfbe83296421c48151a35f`.
- Старые test log hashes, public vector и patch не изменились; исправление только metadata. Tests заново reviewer не запускал, повтор того же прогона из-за смены атрибуции не требуется.

## Пределы положительного результата

Принят именно reviewable source-only proposal: две точные production-line allowlist additions и два regression test files. Сохранены exact metadata-only repository resolution, запрет credential/wildcard resolution, per-service pinned public key и существующая RSA verification boundary. Не расширены helper/operator/deployment/restore capabilities. Самостоятельный git apply --check --whitespace=error-all на clean foreign checkout успешен; foreign git status до/после чист, никакой foreign mutation не выполнено.

Инспектированные actual root logs подтверждают baseline2 expected scope failures, patched10 primary PASS +2 redirect subcases, дополнительную Node→actual Go VerifyBytes совместимость и byte-tamper rejection. Отдельный noexec environment failure сохранён. Публичный fixture key test-only; private key files отсутствуют. Эти tests относятся к двум выбранным пакетам и отдельному interoperability harness, а не всему Updater suite или complete Venus head update flow.

Новый совместимый qualified Updater release не собран/не опубликован/не установлен; maintainer approval и approved Venus dependency matrix отсутствуют. Protocol2, две открытые admission primitives и подпись synthetic manifest не доказывают typed Venus compatibility/restore guards, actual Kernel enrollment, production public trust, full release/host/systemd/fault-recovery acceptance. Updater0.6.17 остаётся исследованным несовместимым baseline; этот patch нельзя выдавать за уже выпущенную поддержку. Ни EXIT-P06, ни разрешение deploy/update этим review не выдаются.
