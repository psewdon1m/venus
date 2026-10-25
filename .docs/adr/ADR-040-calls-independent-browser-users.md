# ADR-040 — Independent browser processes for P11 simulated users

Status: candidate fixture revision3, independent approval required before first run. 2026-10-25 UTC.

Revisions1/2 and every original FAIL remain immutable. Sourcefc8 had strict maxjitter30ms PASS, sameapplicationf510 had51ms FAIL; both one Chromium parent with8contexts. Round08 grouped RTP: Calls audio43ms/video12ms, Cinema audio7ms/video51ms. Browser quota throttling was0 at12CPU, memory.current3.062GB<4GiB; neither CPU quotas nor motion hint can be asserted as the sole cause. Full P11 remains FAIL.

One real user ordinarily runs an independent browser engine. The candidate uses8isolated Chromium processes with1context each, reusing precisely the same Playwright launch, fixturedevices and controller. This removes shared-engine media/network/audio scheduling as a possible synthetic coupling; it does not claim that coupling caused the failures or guarantee a fix. No new framework, benchmark family or larger load.

The TOTAL browser+API cgroup stays12CPU/4GiB,8users/cameras320x180@15/180k, same SFU2CPU/1GiB with1.6core/768MiB targets, same PG1CPU/512MiB. Same original synthetic markers, actual Cinema+Games,3swarmup/300samples>=30s, exact MAXjitter30ms/RTTp95300ms/loss1%/freeze2s, all functional negatives and four stale token paths. No stream exclusion/offset/p95 substitution. Resource counters and actual elapsed stay captured. Fresh2-user minimalgrant case closes old8browser processes before creating its2users; all children close in finally.

This can qualify only a new local client fixture profile, not8CPU productioncapacity, public networking or physical devices. A new FAIL stays FAIL. Do not tune the threshold to accept old source. Concurrent Cinema motion hints remain an independently tested application change, not proven by this profile decision.

Compatibility/rollback: no production source/API/schema/trust change. Restore the old one-browser/many-context arrangement in a new source revision for comparison, retain both evidence series. Independent Engineering/Security repeat must bind exact new config, cleanup and results. Original P09 fixture remains unchanged.
