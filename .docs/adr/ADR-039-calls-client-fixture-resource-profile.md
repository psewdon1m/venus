# ADR-039 — P11 browser fixture resource profile revision 2

Status: accepted engineering correction before candidate measurement. 2026-10-25 UTC.

P11_CALLS revision 1 and its 8 CPU results remain immutable. Round05 source075b7bc9 had ten passing functional records and strict jitter FAIL33ms against30ms; it is not stage PASS. Before/after self cgroup CPU counters show delta usage273166209us over approximately37s, delta periods370, throttled periods77 (20.81% of periods), throttled1653003us. The latter is not a percentage of lost processing capacity. Actual Docker stats780.94%, memory2.602GiB/4GiB. Quota pressure is measured; causality for jitter is not established.

For a NEW candidate measurement only, eight independent browser contexts plus the API receive12CPU/4GiB. SFU remains2CPU/1GiB, acceptance p95CPU1.6core/peak768MiB. PG remains1CPU/512MiB. All video/source, eight-user concurrent Cinema/Games, duration and exact max jitter30ms/RTT300ms/loss1%/freeze2s targets remain unchanged. No selective exclusion of Cinema metrics or substitution of p95 jitter. Collect actual elapsed time and the same self cgroup counters. This is a client fixture budget, not a production eight-core capacity claim, nor a guaranteed fix. P09 independent fixture stays8CPU.

Independent bounded quality-review02 is required before candidate run. Existing8CPU FAILs are preserved; new security fixes require all affected records to rerun on exact new source. No automatic rebind of round05 passing records. If the candidate still fails, preserve FAIL and diagnose the actual product/input cause without raising targets.

Compatibility/rollback: compose defaults8CPU; only the existing --calls runner selects12. Revert the Calls fixture selector/profile to8 for comparison, retaining both evidence series. No application data, production deployment limit, accepted P09/P06 bytes or cryptographic trust changes. P07/public/device/fullG5 remain pending.
