# P05: ошибка inventory окон

Полный dirty preflight `74afa1d3662c` завершился FAIL: Chromium10 PASS, Firefox18+ PASS, Firefox capacity FAIL; 72 layout/9 native, WebKit NOT_RUN. Source unchanged, cleanup completed.

Ошибка `Actor page must own one identifiable new X11 window: 9 !== 1` следует после настоящего X11 `BadWindow` в `X_QueryTree`. Root прочитал код: helper visibleWindows трактует любой exit1 как пустой список. Поэтому ошибочный запрос inventory способен дать ложный пустой baseline и объявить все девять окон новыми. Это конкретная ошибка обработки результата, а не отсутствие места в комнате или доказанный продуктовый дефект. Автор исправляет ограниченные повторы только известного transient X11 запроса, отличая no-results от ошибки. Проверка ровно одного принадлежащего странице нового окна сохраняется.

Три предыдущих reporter findings исправлены в исходниках этой попытки и проверены отдельными явно synthetic controls; данный FAIL не отменяет их scoped результаты, но не даёт полного browser PASS. Исходные raw outputs сохранены без изменения.
