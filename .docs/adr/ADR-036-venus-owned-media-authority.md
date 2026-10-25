# ADR-036 — единый media transport с Venus authority

Status: принято к реализации по direct owner single-host/единый transport scope и independent transport-entry01. Runtime acceptance NOT_RUN. LiveKit OSS1.13.10 с pinned SDK/образы обслуживает Cinema и будущие Calls; source audit закреплён отдельно.

Нативные self-host JWT не дают требуемый revoke: использованы обязательные room-scoped gateway, непреактивируемые lease UUID/current protected authority, RemoveParticipant/DeleteRoom и independent child supervisor. Состояние authority вне DB rollback, одна API authority на host, PG advisory serialization, bounded entries. HTTP7880 только loopback в media container. Guest/host UI не получает service admin secret.

Контракт, тестовый профиль до исполнения, совместимость и откат — P09_MEDIA.md. Длинные статистические прогоны и P07 не запускаются в implementation-first фазе. Missing input/device/public-network не становятся PASS. Подписанный0.0.1 не меняется.

Trust qualification: официальный upstream publisher и pinned amd64 image digest, точный binary SHA256/embedded Go build info в evidence. Digest доказывает выбранные байты, не самостоятельную source attestation. Reproducible build/SLSA source attestation не заявлены. Этот предел доверия сохранён при локальной функциональной приёмке; новая публичная release проходит отдельный финальный delivery gate.
