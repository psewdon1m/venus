# P11 quality review03 — независимые браузерные процессы

**Допустим один новый заранее закреплённый ADR040 candidate:**8отдельных Chromiumprocesses, по1context, при тойже **суммарной** квоте12CPU/4GiB контейнераbrowser+API. SFU2CPU/1GiB, количествоstreams, источники, длительность и все targets, включая strictmaxjitter30ms, неизменны. Это не PASS и не установленный фикс.

Native08/f510 clean/unchanged:10/12casesPASS, maxjitter51msFAIL, p9526ms/RTT7ms/loss0/freeze147ms. Actual cgroup12CPU дал нулевые deltas nr_throttled/throttled_usec. Поэтому quota-pressure8CPU не доказана какполнаяпричина, ADR039 не объявляется QoSfix. Междуfc8 иf510 нетapps/packages/infra изменений. СтарыйsinglebrowserFAIL сохраняется.

ОдинChromiuminstance создаёт8contexts. Восемьinstances сохраняют8пользовательскихпутей, разделяя клиентскиеэкземпляры: это разумный способ убратьискусственный shared-browser фактор при моделировании независимыхпользователей. Конкретный media/network/pacer bottleneck не профилирован, поэтому rootcause остаётсягипотезой. Дополнительныеprocesses могутувеличитьoverhead; гарантииулучшениянет.

Условия: ADR040 иexactsource фиксируются доrun; **никаких12CPU/4GiBкаждомубраузеру**, лимитобщий. Одинаковыйpinnedbrowser/args,8успешныхlaunch/1contextкаждый, partialfailurecleanupвсехbrowserinstances. Сохранитьqualityraw/offenders/elapsed/cgroup ипрежниеSFUtargets; не заменятьmax наp95, не исключатьCinema, не менятьwarmup. Новыйgreen доказываеттолько новыйлокальныйprofile, не8физическихустройств/productioncapacity и неуспехстарогопрофиля.

ЕслиcandidateтожеFAIL — остановитьподборprofiles/capsрадиPASS и локализоватьsource/outboundpacing/SFU/inboundreceiver по сохранённымданным. Новыйтестовыйframework не нужен.

Disablecase: bounded ожидание фактическогоCinema.transport_ready/новойSFUepoch **до** проверки401старогоJWT корректно. 503неподставляетсяза401, readinessфиксируетсяотдельно; старыеconsents/leases послеreadyвсёравноотозваны.

Engineeringround02 остаётсяpending finalactualhandoff/affectedP09/productionbuild; P11/P07/public/devicePASS нет. Reviewerничего не запускал и не менялsource/tests/Docker/Git. INPUTSзакрепляет rawcgroup: отдельныйDockerstats snapshot08отсутствует, это невыдано заимеющийся. **COMPLETE_STOP quality03packet.**
