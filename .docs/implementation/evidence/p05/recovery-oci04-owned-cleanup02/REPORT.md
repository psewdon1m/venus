# OCI04 exact-owned cleanup

PASS_EXACT_OWNED_EPHEMERAL_RESOURCES_REMOVED_ORIGINAL_RUN_STILL_FAIL

The failed host prefix and immutable actual archive remain unchanged. Only the independently inspected exact owner container IDs, three ephemeral tmpfs volume names/options and network ID were eligible. The only running readonly keeper was stopped with a bounded5s stop before removal. No start, new container, global prune or other owner action was issued. No private database, password or keyring value was exported. This cleanup does not promote the failed OCI04 run.
