# P00 · Результаты запуска p00-20261018T151605Z

**Локальная проверка:** PASS · **unittest:** 46 · **check records:** 10 · **EXIT-P00:** IN_REVIEW, приёмка NOT_RUN.

Проверены 244 строки traceability, 12 ADR, 25 API operations, strict projections/events, ссылки и сохранность source snapshots. Эталонные тесты охватывают 36 ячеек, 5050 позиций progression, context/comfort/stage/capability/veto, согласие, отказ/timeout/revoke и запрет private broadcast. Все исходные 12 карточек остались draft. Негативная release-проверка намеренно требует отказа; draft pack детерминированно пересобран только во временный файл.

Идентичность исходников до Git: `ba4a64ba0c1b4a86b98cc5c04ed16753047e67ff7073ddff36697071189fe166`. Input set исключает производные файлы этого запуска и корневой упаковочный манифест; после записи evidence его хеши обновляются и `verify_manifest.py` вызывается повторно. PACKAGE-PRE-EVIDENCE относится к состоянию до заполнения отчётов; итоговая упаковочная проверка выполняется отдельной командой после их записи.

Артефакты: [input hashes](input-hashes.json), [test results](test-results.json), [полный вывод](test-output.txt), [gate report](gate-report.json). В gate report сохранены SHA-256 этих evidence.

Полный EXIT-P00 не принят: нужны U-001/U-004 и независимый review технических контрактов/flows. U-002/U-003/U-005 зарегистрированы с отдельными рубежами. Реальные PostgreSQL, HTTP/WS, шифрование, browser UX, production engine/fairness, media и deployment не запускались. Эталон — исполняемая спецификация, не работающий Venus.

В подготовительном прогоне strict validator отклонил in-memory fixtures с origin=example; они исправлены на явно синтетические данные. Оригинальные карточки и нормативные snapshots не редактировались. Этот итоговый запуск сохраняется отдельно и не подменяет человеческое ревью.
