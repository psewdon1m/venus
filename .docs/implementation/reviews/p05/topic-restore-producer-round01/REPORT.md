# Restore04 concrete producer — independent round01

**CHANGES_REQUESTED: two P2 producer gaps.** All exact author/source pins and snapshot hashes were checked. No Docker, PostgreSQL restore, product or producer writes occurred. Prior design acceptance remains design-only.

## RESTORE-PRODUCER-R01-SEQUENCE_STATE

rawDatabase records only sequence schema/name/last_value. assertRestored then reports all_sequences_equal. Four exact inert counterexamples change increment, cache, cycle or is_called while the observer still accepts equality. Record full sequence definition and direct relation last_value/is_called, then compare exact state. Preserve the old failures and prove new negatives reject. Raw whole-table equality remains absolute.

## RESTORE-PRODUCER-R02-FILESET

producerPins closes over the initial producerNames array. An added top-level helper is absent from final maps, which still compare equal. Re-enumerate the declared top-level regular-file set and entry types at every capture, rejecting additions/removals/symlink changes before comparing names/hashes. Historical nested artifact/control directories need no arbitrary recursive binding.

The remaining mechanisms were source-reviewed: seven finite harness seams, real pg_dump/restore/quiescence, three fresh processes, unchanged external roots, live future D and pre-listen raw boot revocation, fourteen fixed IDs, exact receipt compatibility and narrow accounting/revocation effects. Copied39 observer,20 runner and34 receipt controls all pass but do not cover the two findings. Own five counterexamples demonstrate test gaps, not product revivals or an actual restore failure.

Corrected immutable producer bytes, independent repeat and root binding/RUN authorization remain required. No full P05 or human450 acceptance follows.
