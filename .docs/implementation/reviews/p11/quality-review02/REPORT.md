# P11: проверка измеренной коррекции клиентского профиля

**Разрешён один следующий bounded qualification run с новым browser/API fixture budget12CPU/4GiB, после фиксации ADR039 и точного source.** Это обоснованный кандидат нового измеряемого профиля, не PASS, не доказанный фикс jitter и не новая production capacity.

Actual run05 source075b7bc9/core1511ab22 clean/unchanged:10из11casesPASS, strictmaxjitter33ms>30msFAIL; p95jitter19ms/RTT6ms/loss0/freeze139ms. Исходный8CPUFAIL сохраняется со всеми bytes. Независимые safety исправления Cinema private count/cutoff retries войдут в новый source; прежние10PASS нельзя автоматически перепривязать к ним.

## Обоснование

Rawcpu.max действительно800000/100000 =8CPU. Из actualcpu.stat: Δusage273166209µs, Δnr_periods370, Δnr_throttled77, Δthrottled_usec1653003. Throttled77/370=20.81%periods; это **не20.81%потеряннойCPU мощности**. При приблизительном37s интервале среднее7.38core; actual first→lastsample36.8892s подтверждает порядокдлительности, но не является точным интервалом cgroupbefore→after. Dockerstats snapshot780.94% также близок к8CPUquota. Memory.current выросла2.628→3.017GB при4GiBлимите; это наблюдённые значения, **не измеренный абсолютный memory.peak**.

Теперь есть реальные quota-pressure/throttling свидетельства, которых не было в предыдущемreview. Выделить12CPU одному контейнеру, моделирующему8независимых браузерныхпользователей плюс fixture API/measurement work, технически обоснованно для отделения искусственной клиентскойквоты от поведения сервиса. 12CPU — выбранный запас для проверки, не установленный минимальнонеобходимый/оптимальный budget. SFUостаётся2CPU/1GiB с targets1.6core/768MiB; server admission не увеличивается.

Это корреляционное основание устранить один фактор, **не доказательство**, что throttling вызвал33ms или что12CPU обеспечатзелёныйрезультат. При следующемFAIL потребуется адресный разбор по сохранённымoffenders, а не дальнейшееавтоматическоеповышениеbudget.

## Условия до запуска и принятия

1. ADR039/source revision сохраняют исходный8CPUпрофиль иFAIL05, мотивируют только fixtureCPU8→12. Все actualquality assertions неизменны: maxjitter30ms, loss1%, RTTp95300ms, freeze2s, camera/participants/measurement window, SFUlimits. Никакой заменыmax наp95/исключенияCinema/увеличенияwarmupпослеFAIL.
2. Новый exactsource/config/testprofile фиксируется **до** запуска. Сохранить actual DockerVM/hostCPUavailability и caps/cgroup до/после: quota12сама по себе не доказывает доступность12CPU. Не добавлять широкуюсистемутестирования или общийP07.
3. Сохранитьqualitysamples/offenders ифактическийelapsed/CPU/throttle deltas, а такжеSFUmetrics с прежнимиграницами. Проверитьвесь текущий bounded P11набор, включая затронутые S11-01/S11-02 negatives; изменениеfixtureиsecuritysource требует новогоactualproof. Новая сервернаяпоставка/физическиеустройства/P07 остаются отдельно.
4. Green12CPU доказывает только новый локальныйпрофиль. Не писать, что приложение теперь укладывается в8CPUклиентскуюквоту или что исходныйFAILисправлен заднимчислом. Откаткоррекции — вернуть прежнийfixture8CPUновойревизией, сохранивобаотчёта; protectedauthority/данные не затрагиваются.

Данных достаточно для указанного следующего запуска. P11 EXIT пока **NOT PASS**. Reviewer не менялsource/tests/Docker и ничего не запускал. Точныевходы/расчёты в INPUTS.json. **COMPLETE_STOP.**
