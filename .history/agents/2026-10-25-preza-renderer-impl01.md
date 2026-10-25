# Preza renderer/operator implementation01

- Agent: /root/contract_review
- Started UTC: 2026-10-25; exact timestamps below.
- Task: implement initial renderer/guardian/static profile4/operator bounded backup portion in W4f658136 plus root types.
- Owned: infra/venus/**, tools/venus-operator/**, tools/presentation-*.mjs|py, v4 release schema, focused renderer/operator tests if needed; this new W journal only.
- Forbidden until root announces whole initial implementation complete: tests/build/install/lint/typecheck/Docker execution. No app/API/web/root shared docs/manifest/old journals; no commit/push/ROOT sync.
- Pending exact read input hashes and actions. No acceptance claim.
2026-10-25T06:35:53.8913716+00:00

## Substantial implementation update UTC 2026-10-25T07:00:13.8443701+00:00

Written initial source, never executed: infra/venus/presentation-{guardian,render}.py; static production profile4 and presentations-tests overlay; presentation-app-entry.mjs; renderer IPC/dependency contract; pinned Python/Poppler Dockerfile+P05Dockerfile copies; operator Dockerfile/ignore copies. Guardian PID1 exactCap0xe0+NoNewPrivs, nonrootchild caps/groups0, namespace-wide kill/reap, bounded trustedUID cleanup, immutable fixed-file IPC and epoch/nonce heartbeat/result/ack; known Poppler advisory/publicHOLD retained.

Added tools/presentation-provision.mjs explicit independent ProtectedAuthority initialization; tools/presentation-inventory.mjs actual-version/binary/license exporter with optionalnull fixture buildmetadata. No implicitstartup authority initialization. Profile4 provision includesmedia, presentationauthority and nonsecret controlreceipt; executor1001 cannot traverse UID1000 protected0700 and v4preflight usesreceipt/appUIDstat probe rather than weakening permissions.

Operator: new presentations-profile descriptor + signed v4 schema/manifest binding; driver new staticroleenv/quiescence/ownedvolatilepurge/compatiblev4rollback/readiness; new presentation-backup.mjs actualstreamedPGdump BK2strict256MiB+framing/reader. ExistingBK1writer retained128MiB; reader dispatch keeps BK1strict128; profile4 cannotrestoreBK1. Existingv2/v3templates and schemas unchanged. Fetch/published verification accepts explicit environment, no signing/publicgate bypass.

Written focused sources tests/presentations/backup-frame.test.mjs (BK1/BK2 limits/hash/permissions/profile-crossrestore) and renderer-adversary.py (actualhost-controlled namespace/UID/caps/signals/setsid/junk probe). These are not executed/proofs. Root ownsactualbackup-capacity integration/controller and API/Webintegration sources.

Coordination: API agreedfixed /run/venus-presentations/spool, immutableAPI1000source/request/cancel/ack, rootoutput/pages/result/health, busyuntilack/health<=1s. Parent approved media-HMAC authenticated internalquiesce route; APIagentimplements quiesce fence/cancel/epoch-preserving bindings/spoolidle. Rootcontroller usesexported writePresentationBackup(adapter,current,UUID), readPresentationBackup(fullpath). Servicekey presentation-renderer confirmed. Root requestedoperatorfixtureCOPYtests/presentations, appliedwithdockerignore allowance.

Source-reading failures: exploratory missing apps/api/src/presentations-spool.ts (actualpresentation-spool.ts) and missing infra/venus/compose.media-tests.yml (actualcompose.p09-tests.yml); correctedreadingpaths, no tests. EditingPython scripts were filegeneration/textreplacement only, not productexecution. Alltests/build/install/lint/typecheck/Docker/nativechecks remainNOT_RUN perownerpipeline. No commit/push/ROOTsync/app/privatecontract/manifest edits.

Remaining: finite source-only consistency read, final ownedfile/inputhashes and handoff. No furtherfeature scope.
[
  {
    "path": "infra/venus/presentation-guardian.py",
    "sha256": "a71b92655b4c2b400de8dba3e28869d4bb7e74b1ca67c4aedd4be344685838e8"
  },
  {
    "path": "infra/venus/presentation-render.py",
    "sha256": "391c1c13874997c5205c0c414e38d4983d83c0e31650c4b5ff7b803a8f8674e9"
  },
  {
    "path": "infra/venus/presentation-app-entry.mjs",
    "sha256": "c2ee527985e7dce905000a7eaca2ebf06604e22f35c3dafe556e65651372dce5"
  },
  {
    "path": "infra/venus/presentation-dependencies.json",
    "sha256": "b02ca7670d1e6e7ca0d350dfa366adff25e9660154b00aa4b9fb0fdb3233171d"
  },
  {
    "path": "infra/venus/PRESENTATION_IPC.md",
    "sha256": "2c23605d9c65517911caf86603467a79f1dfa357e8d40cd472306cc7063d0ade"
  },
  {
    "path": "infra/venus/compose.presentations.standalone.yml",
    "sha256": "9c0a91ec73f81caacf1e8ad0a139339fff232e175b3d3c548da2686e7bbd0e9c"
  },
  {
    "path": "infra/venus/compose.presentations-tests.yml",
    "sha256": "dfd1a7506b8ceb1da8f8e14fb53021fdb08607347cdb02a559a800dc72ac53e1"
  },
  {
    "path": "infra/venus/Dockerfile",
    "sha256": "0c53d79814a99646feecbaf01886278ff7c64f54e508f5b4e39141fab4554d0a"
  },
  {
    "path": "infra/venus/Dockerfile.p05-tests",
    "sha256": "a505654877b9229a1aa54e6640539fdb2c0efb61b0dcc7460d52caaef4d6e237"
  },
  {
    "path": "infra/venus/Dockerfile.p05-tests.dockerignore",
    "sha256": "8d0be5ffb32d5c0a5f533a71445df740b150139a7ce9468b9b3bfe164195ba35"
  },
  {
    "path": "infra/venus/Dockerfile.operator",
    "sha256": "017bcab93c6d8e438c2815185e77b43b3e1c4a7031c4bd4be46d7008d84db267"
  },
  {
    "path": "infra/venus/Dockerfile.operator.dockerignore",
    "sha256": "f7d0935bcb2ec14445b7a7f4a9982861babbedb67484b2fad6ecd3d0e6baeed8"
  },
  {
    "path": "tools/presentation-provision.mjs",
    "sha256": "522e8e8e60652bf908996272260b765257530f2a57f642275e85c80a5162b6b8"
  },
  {
    "path": "tools/presentation-inventory.mjs",
    "sha256": "08484aecda9b847afb0465dbb2251e1ad59cc4b1fb64238fa124d0f45cad2108"
  },
  {
    "path": "tools/venus-operator/driver.mjs",
    "sha256": "57eb8091bbe573e1cf872cd0210045d3e3e2495e4a4012d0f5d973ed787ceb2f"
  },
  {
    "path": "tools/venus-operator/provision.mjs",
    "sha256": "04421a3b0f8c8662dbb48138ca210675a840d4840708beb53bed83e3098117f2"
  },
  {
    "path": "tools/venus-operator/release.mjs",
    "sha256": "f3f98cae474a9a9581b7b9faaeb67fb3ef8fea3724d842187f34fb8a39ed5cd8"
  },
  {
    "path": "tools/venus-operator/create-release.mjs",
    "sha256": "a5b677c8c5d93f50095314dbea8a2ee60ea4a7cda3daa4dd53b075ad80b8b93b"
  },
  {
    "path": "tools/venus-operator/fetch-release.mjs",
    "sha256": "548dd0b5eb3cb962c6b554857cc08f6e82e5852f04fbf9285ab9b3c682371d57"
  },
  {
    "path": "tools/venus-operator/verify-published.mjs",
    "sha256": "6a9fcaf0e32bdc69f2030fad6b5989c11f4cb767cb9456f850827d92094fb3a7"
  },
  {
    "path": "tools/venus-operator/presentations-profile.mjs",
    "sha256": "b8a125222c70a1da7054803093a0bf22b6a2e3dd4d03f5451e8767e96351478a"
  },
  {
    "path": "tools/venus-operator/presentation-backup.mjs",
    "sha256": "dfbbfb5554051cb3430608d4e48d5dfc73b4d49e963adee028956777990361a6"
  },
  {
    "path": ".docs/contracts/venus-standalone-release.v4.schema.json",
    "sha256": "15991b99e232b99a147732d6fe8168a8612a20cd1100ada123cdeb320737b72e"
  },
  {
    "path": "tests/presentations/backup-frame.test.mjs",
    "sha256": "06852cfa4651fa1a392304043200001de8a455a436399c485a5420df46aa3915"
  },
  {
    "path": "tests/presentations/renderer-adversary.py",
    "sha256": "252367f89d11a97d2738f46717422267738496642e01c2b6fac73fe57fa9e82a"
  }
]

## Initial implementation handoff UTC 2026-10-25T07:01:59.5250387+00:00

Finite source-only consistency reading completed. Rootrequested adversarygrandchild closesstdio0/1/2 beforeorphanpause, applied. Inventory now actualpackagepinchecks/pdfinfo stderr version; missingfixturebuildmetadata isnull withfixture flag, declaredrevisiononly andsource_attestation=false. OperatorfixtureCOPYtests/presentations andignoreallowance applied. Profile4 converter masksproductionimage's historicalVOLUME/var/lib/venus withreadonly4KiBtmpfs; noanonymouswritablepersistentconvertervolume. TrustedcleanupattemptsallUIDphases evenifonefails soAPIownedsource removal isattempted beforeclosing; unknownunsafe/deepjunkstillneveracknowledges/newjob. No broaderoperatorrefactor.

Exact scopes handedoff: servicepresentation-renderer; staticnetworknone/privatePID1/cap0xe0; trustedUID1000/65534 cleanup; IPCdocinfra/venus/PRESENTATION_IPC.md; provisionPresentations(root)->authorityDirectory; profile4 standalone-local-presentations-v4 andmodule1; writePresentationBackup/readPresentationBackup seam; legacyBK1strict128 andnewBK2strict256. Parentownsactual12case/backup-capacity/controller andindependentexitreviews. SuggestedcommandsafterparentALL_INITIAL_COMPLETE: node --test tests/presentations/backup-frame.test.mjs; parentexisting --presentations actualDocker/PG/browser/isolation/backupcapacity run. ThesehaveNOT_RUN here.

All test/build/install/lint/typecheck/Docker checks: NOT_RUN byexplicitpipeline. Pinnedaptavailability NOT_RUN untilactualbuild. Publicredistribution/license/advisory readiness/P07 remainHOLD; nofeature/stagePASS. Noapp/sourceoutsideownedpaths/otherjournals/manifest/Git mutations/ROOTsync.

COMPLETE_STOP initialportion; furtherwritesonlynewparentassignment.
[
  {
    "path": ".docs/adr/ADR-042-room-presentations-preza.md",
    "sha256": "974d5aa304a131a818ccfa9bef13a68a2f904739c24251dd56c2edaf2ded2c54"
  },
  {
    "path": ".docs/implementation/PRESENTATIONS.md",
    "sha256": "7c7d34c10348ad1975a8e5965dd56252b6291d76c496f79ea6a7f7ff4363f134"
  }
]
[
  {
    "path": "infra/venus/presentation-guardian.py",
    "sha256": "a71b92655b4c2b400de8dba3e28869d4bb7e74b1ca67c4aedd4be344685838e8"
  },
  {
    "path": "infra/venus/presentation-render.py",
    "sha256": "391c1c13874997c5205c0c414e38d4983d83c0e31650c4b5ff7b803a8f8674e9"
  },
  {
    "path": "infra/venus/presentation-app-entry.mjs",
    "sha256": "c2ee527985e7dce905000a7eaca2ebf06604e22f35c3dafe556e65651372dce5"
  },
  {
    "path": "infra/venus/presentation-dependencies.json",
    "sha256": "b02ca7670d1e6e7ca0d350dfa366adff25e9660154b00aa4b9fb0fdb3233171d"
  },
  {
    "path": "infra/venus/PRESENTATION_IPC.md",
    "sha256": "2c23605d9c65517911caf86603467a79f1dfa357e8d40cd472306cc7063d0ade"
  },
  {
    "path": "infra/venus/compose.presentations.standalone.yml",
    "sha256": "c3e314d4b6658a75f81b3abedf6a1c864ea386d09aaa2e7180099680382b46af"
  },
  {
    "path": "infra/venus/compose.presentations-tests.yml",
    "sha256": "e0832c5ee29f856344c580536c9ba5158e1827ce195b35f983be62a0f3eb2a36"
  },
  {
    "path": "infra/venus/Dockerfile",
    "sha256": "0c53d79814a99646feecbaf01886278ff7c64f54e508f5b4e39141fab4554d0a"
  },
  {
    "path": "infra/venus/Dockerfile.p05-tests",
    "sha256": "a505654877b9229a1aa54e6640539fdb2c0efb61b0dcc7460d52caaef4d6e237"
  },
  {
    "path": "infra/venus/Dockerfile.p05-tests.dockerignore",
    "sha256": "8d0be5ffb32d5c0a5f533a71445df740b150139a7ce9468b9b3bfe164195ba35"
  },
  {
    "path": "infra/venus/Dockerfile.operator",
    "sha256": "017bcab93c6d8e438c2815185e77b43b3e1c4a7031c4bd4be46d7008d84db267"
  },
  {
    "path": "infra/venus/Dockerfile.operator.dockerignore",
    "sha256": "f7d0935bcb2ec14445b7a7f4a9982861babbedb67484b2fad6ecd3d0e6baeed8"
  },
  {
    "path": "tools/presentation-provision.mjs",
    "sha256": "522e8e8e60652bf908996272260b765257530f2a57f642275e85c80a5162b6b8"
  },
  {
    "path": "tools/presentation-inventory.mjs",
    "sha256": "befcf16943ecd92c3c093df8543471e397a5ef7271f1321103aaa099a239af7d"
  },
  {
    "path": "tools/venus-operator/driver.mjs",
    "sha256": "57eb8091bbe573e1cf872cd0210045d3e3e2495e4a4012d0f5d973ed787ceb2f"
  },
  {
    "path": "tools/venus-operator/provision.mjs",
    "sha256": "04421a3b0f8c8662dbb48138ca210675a840d4840708beb53bed83e3098117f2"
  },
  {
    "path": "tools/venus-operator/release.mjs",
    "sha256": "f3f98cae474a9a9581b7b9faaeb67fb3ef8fea3724d842187f34fb8a39ed5cd8"
  },
  {
    "path": "tools/venus-operator/create-release.mjs",
    "sha256": "a5b677c8c5d93f50095314dbea8a2ee60ea4a7cda3daa4dd53b075ad80b8b93b"
  },
  {
    "path": "tools/venus-operator/fetch-release.mjs",
    "sha256": "548dd0b5eb3cb962c6b554857cc08f6e82e5852f04fbf9285ab9b3c682371d57"
  },
  {
    "path": "tools/venus-operator/verify-published.mjs",
    "sha256": "6a9fcaf0e32bdc69f2030fad6b5989c11f4cb767cb9456f850827d92094fb3a7"
  },
  {
    "path": "tools/venus-operator/presentations-profile.mjs",
    "sha256": "b8a125222c70a1da7054803093a0bf22b6a2e3dd4d03f5451e8767e96351478a"
  },
  {
    "path": "tools/venus-operator/presentation-backup.mjs",
    "sha256": "dfbbfb5554051cb3430608d4e48d5dfc73b4d49e963adee028956777990361a6"
  },
  {
    "path": ".docs/contracts/venus-standalone-release.v4.schema.json",
    "sha256": "15991b99e232b99a147732d6fe8168a8612a20cd1100ada123cdeb320737b72e"
  },
  {
    "path": "tests/presentations/backup-frame.test.mjs",
    "sha256": "06852cfa4651fa1a392304043200001de8a455a436399c485a5420df46aa3915"
  },
  {
    "path": "tests/presentations/renderer-adversary.py",
    "sha256": "446b6cc8d4c7180491e0ee191851d078dcfd2081b06e31e75f5dd362026437dc"
  }
]
