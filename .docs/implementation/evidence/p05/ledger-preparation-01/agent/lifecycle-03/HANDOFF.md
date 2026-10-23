# Separate metadata authority for authenticated safety operations

**WRITES_FINISHED; installed after explicit ROOTUNFREEZE.** Included module/test now exactly equal the frozen tested source archived in `linux-round-02/`; prior5562/696d stayed unchanged throughout the root backend run. This is a new integration requirement; historical189/round02 component proof remains valid for its original exact scope.

## Before / after evidence

Independent root registry review `registry-provider-round01` executed real Linux filesystem + actual Rooms/registry source with mock SQL: **31PASS/2FAIL**, SAFETY-GUARD-01. Corrupt/missing personal chain caused actual `Rooms.finalAccessFence(...,true)` to call full `assertLive→personal.read` and reject safety. Report/probe/raw and frozen source inputs remain immutable. This handoff does not relabel that before-failure as PASS.

Author new Linux round01: **209PASS/1FAIL/2Windows-onlySKIP**, exit1. The only failure was a test expecting Keyring's DomainError machine code in its deliberately generic message. Actual content correctly denied. Test-only correction checks `.code`; original raw failure/source snapshots are preserved.

Latest Linux round02: **210PASS/2Windows-onlySKIP**, exit0, comprising all189 previous cases +21 metadata authority cases. Four individual read-only source/test binds to exact image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, UID1000/read-only/networknone/capdrop/1CPU/768MiB/PIDs96, fresh owned labelled volume. Five source/security copies captured before each launch match in-container before/after hashes; raw/configuration/source snapshots and actual cleanup EMPTY receipts are indexed. No moving checkout mount/build. Strict scratch and included TypeScript/ESLint exit0; Windows scratch and included26PASS/186Linux-onlySKIP exit0. Windows skips are not durability proof.

Latest module `60c8f41b2409f23b7969d11067266ffdf651dbc648c99905111ad7dfc6a9cef4`; test `cd2375ce3f463690cb3918dc5d7ddb4f4b0a18402e93e1b530c3fb85aa92d9f6`. Foundation/count/security remain unchanged (`cae3…`, `241d…`, `5782…`).

## API boundary

`assertRoomAuthority(roomId,birth):void` and `assertMemberAuthority(roomId,birth,ownerId):void` are **metadata-only safety fences**. They authenticate immutable birth/pins, persisted intent/terminal, lifecycle chain/witness and process floors; member authority additionally requires exact admitted/not-retired member and rejects reserved owner. They return no data/grant. Caller must still authenticate cookie/member/session/room/offer and hold real DB ordering. Success is never permission to disclose private content or start/admit.

Only these methods and metadata-only `retirementStatus`, `retireMember`, `retireRoom` use the new metadata lock mode. It keeps the same room filesystem lock and protected birth/lifecycle directories, exact configuration binding and lifecycle rollback floors; **no personal file or directory is opened**. This allows authenticated safety withdrawal/close and original-intent recovery even when personal directories are missing/unsafe. `cleanupPersonal`/`cleanupRetiredMetadata` still require safe actual filesystem state and may report an operator-recovery/retention blocker after retirement succeeds; they never repair or unlink unsafe paths.

Normal `open`, `assertLive`, `assertMember`, `admitMember` and wrapped personal `read/narrow` retain full personal checks. Existing full-mode behavior is not weakened. New real Linux tests pair metadata safety success with content denial under personal corrupt/missing/unsafe files, missing/unsafe directories, unknown personal encryption key, process/required-floor rollback. Bad lifecycle/birth/key/scope, withdrawn member, retirement intent or room-only terminal still denies metadata authority. The new tests do not execute HTTP/WS/PG safety routes; root registry wiring and fresh independent integration review must prove the before-failure is closed.

No default activation, PostgreSQL/old-worker/backup/retention scheduling/full-stage/production claim follows. Terminal metadata and key rollback assumptions remain as in lifecycle02 handoff.
