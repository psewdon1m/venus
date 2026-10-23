# METHOD08 actual: NOT_ACCEPTED

Worker completed100/100, exit0,45.0449s. Parent exit1 at guarded tar staging; capacity fault HOST_TAR_STAGE_GUARD_FAILED. Export is unverified and the owned native volume is retained. No full statistics or stage PASS. Terminal stdout honestly reports NOT_ACCEPTED; the post-supervisor write bug is not treated as the cause of this new failure. Actual supervisor stderr was ignored and the Python traceback was truncated by the launcher, so exact exception is unrecorded. Independent diagnosis must distinguish proven code faults from an unproven Windows race hypothesis. Original prefix is preserved; no rerun or cleanup happened before this snapshot.

Source/image are the independently qualified restored historical1274/A29e39 snapshot. Live tool/P04 changes are separate. Preparation01 failed before worker because its new output parent was absent; preparation02 succeeded after creation of that parent. Both attempts are retained.
