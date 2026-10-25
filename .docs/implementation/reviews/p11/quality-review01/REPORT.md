# P11 quality failure: bounded independent review

**P11 не принят. Конкретная причина jitter FAIL пока не установлена.** Найден подтверждённый дефект сохранения диагностических доказательств; данных для вывода о насыщении CPU или дефекте SFU нет. Проверены exact Git blobs `45e43a13aa43f79a57d3b79c7a5c80d8f659186f`, два исторических пакета и последний завершённый raw run. Тесты/сборки/Docker reviewer не запускал; код не менял.

## Установленные факты

Round01 сохранил успешный quality subtest: p95 RTT4ms, maxfreeze134ms,63video progress, SFUp95CPU0.4725core, peak180813824bytes, egress23.746Mbit/s. Из raw samples независимо получены maxaudiojitter21ms и maxvideojitter26ms. **Весь round01 FAIL** из-за следующего device case, не stagePASS. Round02/последний03 дали `assert(r.jitter<=.03)` FAIL; последний03 отдельно прошёл device, general4+2pairs и switch/staleACL, затем остановился на racedleavehelper доTCP. Cleanup completed. Исторические FAIL не переписаны.

В `tests/p11/integration.mjs` quality_samples присваивается только после цикла assert по jitter/loss. Поэтому в FAIL02/03 нет даже фактического превышенного значения, типа audio/video и SSRC. Нельзя сказать, было31ms или300ms, единичный track или все, Calls или Cinema. Это evidence defect; он не отменяет наблюдаемыйFAIL.

## Семантика метрики

`RTCInboundRtpStreamStats.jitter` задан в **секундах** и связан с RTP interarrival jitter, а не с RTT, freeze или полным временем воспроизведения. RFC3550 определяет сглаженную оценку вариации разницы arrival/RTP timestamp. Низкий RTT не исключает jitter выше30ms; source pacing, sender/receiver scheduling и доставка требуют отдельного разбора. JS100ms sampling не превращает значение в jitter ровно за100ms и не сбрасывает накопленную оценку. [W3C stats](https://www.w3.org/TR/2025/CRD-webrtc-stats-20250925/#dom-rtcreceivedrtpstreamstats-jitter), [RFC3550 §6.4.1](https://www.rfc-editor.org/rfc/rfc3550#section-6.4.1).

Текущий код принимает **максимум всех наблюдённых jitter**, а p95 применяется только к RTT. После FAIL нельзя молча заменить этот gate на p95jitter, отфильтровать Cinema, увеличить warmup/caps или поднять30ms. Percentiles допустимы как дополнительная диагностика при прежнем строгом verdict.

## Источник: что доказано и чего нет

`device-inputs.mjs` сначала вызывает настоящий browser getUserMedia/permissions с fixture devices. Затем audio проходит отдельный AudioContext: native raw input+собственный tone marker → MediaStreamDestination; video — native track→video→canvas320×180, setInterval66ms/captureStream15fps. Remote identities дополнительно анализируются AudioContext/FFT и canvas. Это собственные synthetic identity pipelines, не нетронутые аппаратные tracks и не physical echo evidence.

Эта работа может влиять на pacing/scheduling/кодирование, но из наличия8CPU cap **не следует**, что контейнер достиг cap или throttled. Текущие доказательства не содержат actualbrowserCPU/throttle deltas. Ни источник, ни приложение, ни scheduler нельзя объявить причиной без наблюдений. SFU lowCPU первого прогона не характеризует browser CPU следующего.

## Минимальный следующий шаг

1. До любой assertion сохранить уже собранные raw samples и summary; при первом превышении записать peerindex/PCstatsID/kind/timestamp/value/threshold, хотя бы первые16offenders, max/p95 отдельно audio/video и счётчик превышений. По возможности отличить Calls/Cinema существующим PC/receiver/track binding. Сохранять весь concurrent scope, не исключать неудачный поток.
2. В одном следующем bounded30s прогоне снять browser+SFU `cpu.stat`, `cpu.max`, memory.current/events до/после и один реальный Dockerstats snapshot, как предложил оркестратор. Вычислить usage/throttled deltas по actualelapsed. При необходимости сохранить маленький per-source outbound frame/encode/qualityLimitationReason срез из уже выполняемого getStats; отсутствие поля не подставлять0. Новая система нагрузочного тестирования не нужна.
3. Если одновременно есть реальная quota/throttle проблема — устранить измеренный лишний fixture overhead в пределах прежнего профиля, сохранив getUserMedia, отличимые markers,15fps и все isolation assertions. Если CPU не показывает проблему, сверить sender pacing/encode и характер offending inboundstream; не повышатьcaps и не обвинять scheduler. При таком объёме исходов единственный новый boundedrun достаточен для выбора следующего адресного исправления, а не для автоматическогоPASS.
4. `leave(p)` делает DOMcount→click, пока уход первого pairmember уже завершает peer scope. Cleanup должен допускать **подтверждённое authoritative already-ended собственное участие**: bounded state-aware завершение и ожидание idle. Не поглощать произвольный click timeout/503 и не объявлять actualleave успешным без подтверждения. Отдельный UIleave сценарий сохраняется; TCP case после подготовки обязан реально состояться.

При зелёном affected rerun остаются независимые P11 exit gates и остальные обязательные cases. Production/physicaldevices/P07 здесь не принимаются. Все source/proof hashes и официальные ссылки закреплены в INPUTS.json. **COMPLETE_STOP.**
