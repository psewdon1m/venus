# Artifact writer v2 preparation

Independent review requested for P05-MEAS-RESOURCE-001 P2. Exact v2 module and controls are paused; original61 and eb8 checkpoint remain immutable. No product changes.

The versioned writer rejects colon/ADS, drive/UNC/backslash paths, Windows device names, trailing dots/spaces and nonportable components before any open. A Windows recount also enumerates alternate streams on the root and every descendant file/directory; hidden preexisting streams cannot silently evade ordinary stat sizes.

Author attempt01 FAILED: Windows PowerShell5.1 Get-Item stream enumeration omitted directory streams. The preserved attempt includes the failed root-directory ADS assertion. V2 now requires pwsh>=7.2 and fails closed when that dependency, enumeration or bounded subprocess fails. Attempt02 passed8 real Windows filesystem controls plus33 invalid names, including existing file ADS, stream creation after initialization and directory ADS. Ordinary5-byte budget/no-overwrite and previous junction regressions remain covered. Owned inert test trees are retained; no global cleanup.

The additional Windows subprocess dependency and cost are explicit. Linux uses the same filename grammar without Windows stream enumeration. This remains best-effort checks for a single owned writer, not an atomic hostile filesystem race proof. Neither these author tests nor a resource-only independent PASS will accept full consumers/runtime/statistics/P05 or human450 content.
