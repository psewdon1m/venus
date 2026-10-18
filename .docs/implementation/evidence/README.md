# P00 · Доказательства и история приёмки

Текущий принятый результат: [P00-2 round3 gate](p00-2-candidate-r3/gate-report.json), [input hashes](p00-2-candidate-r3/input-hashes.json), [test results](p00-2-candidate-r3/test-results.json), [test output](p00-2-candidate-r3/test-output.txt). Все ссылки/хеши и независимые reviewer identities проверяет tools/p00_evidence.py через check_p00.py. Это не криптографическая подпись издателя и не production readiness.

История: [P00-1 подготовка](p00-20261018T151605Z/report.md) осталась IN_REVIEW; [P00-2 первый freeze](p00-2-candidate/test-results.json) имел61зелёный тест, но contract review оставил2ошибки. Текущий freeze содержит63теста и оба independent PASS. FAIL-отчёты сохранены в reviews/; прежние результаты не переписываются.

[Baseline receipt](baseline-receipt.json) — архив исходных55файлов с проверенным восстановлением. [Pre-decision archive](p00-2-change-baseline.json) сохраняет90файлов подготовленнойP00-1 перед принятием решений. Оба архива находятся вне рабочего дерева; перед переносом на инойhost сохранить доверенные bytes/digest и locator отдельным изменением.

Frozen candidate input set исключает производные evidence/reviews, status/registry и упаковочный FILE_MANIFEST.sha256. Это позволяет записать результат review без циклического хеша отчёта на самого себя. Сам input manifest обязан содержать полный текущий набор source files; gate validator отвергает частичный или устаревший список. Итоговый корневой manifest включает производные артефакты и проверяется после их записи.

Реальные PostgreSQL/HTTP/WS/browser/media/release/deployment tests остаются NOT_RUN до своих этапов. Их нельзя закрыть P00 test suite или agent report.
