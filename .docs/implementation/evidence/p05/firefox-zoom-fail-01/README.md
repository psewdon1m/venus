# P05 · Прерванный Firefox native-zoom preflight

**FAIL**, полный browser gate не принят. [Исходный runner](runner.json) относится к dirty tree и фиксирует точный image/source, exit130 Docker-команды и `cleanup=completed`. [Raw log](browser-tests.txt) содержит десять завершённых Chromium-групп, две успешные Firefox-группы и прерванную Firefox localized группу. Реальный [browser-report.json](browser-report.json) успел сохраниться при завершении: FAIL, 80 matrix cells и 10 native checks. Он скопирован без реконструкции; сообщение закрытой страницы после SIGINT не является исходной причиной зависания.

На протяжении нескольких наблюдений Firefox не продвигался дальше первого entry/native сценария. Нагрузка была около 0.08% CPU, память около 644 MiB из 3 GiB; OOM отсутствовал. Агент сделал [read-only X11 capture](read-only-x11-1721.png). Root также просмотрел изображение: ещё не проверявшееся TR-окно уже показывает browser chrome **200%**. Нативный probe в соседнем RU-контексте оставил Firefox site zoom в других окнах. Это ошибка изоляции стенда; результат этой матрицы недействителен.

Точная ожидающая Promise не установлена. Исчезнувшее native-окно и изменившееся EN-окно не подтверждают гипотезу о зависшем `context.close()`. После проверки exact Compose owner root отправил SIGINT только `venus-p05-40b6485cf6ed-browser`. Родительский runner завершился с exit1 и выполнил свой `finally`/cleanup; прежний лог и PNG сохранены.

Следующее исправление: отдельный browser process для каждого native probe, сброс native zoom, проверка actual viewport/DPR, ограниченные ожидания и step trace. После targeted Firefox необходимо повторить полный прогон; эти намерения не являются PASS.

[Индекс](index.json) содержит SHA256/size сохранённых файлов и отдельную инвентаризацию всех наблюдавшихся PNG исходной попытки. Инвентаризация не означает, что каждый PNG упакован в этот каталог. Проверки production, Safari/macOS/iOS и настоящих устройств здесь отсутствуют.
