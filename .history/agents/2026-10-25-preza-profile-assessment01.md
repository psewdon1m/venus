# Profile4 bounded actual operator smoke assessment01

- Agent: /root/contract_review
- Scope: source-only assessment, no code changes/tests/build/Docker execution; own journal only.
- Parent source31b4a57c/native04 running; previousnative03 10/12 scoped PASS, no full profile4 operator proof inferred.
- Task: identify smallest existing P06 helper seam for actual unsigned profile4 initialize/start/ready/authenticatedquiesce/stop/BK2/restore/featureoff-on/compatibleguard, no full A/B framework.
2026-10-25T07:25:18.8477928+00:00

## Assessment and minimal recipe (source only)

No existing turnkey profile4 smoke command exists. tests/p06/docker-drill.mjs is the useful real-Docker seam, but its cfg/provision and candidate-only branch are legacyv2 and full route starts executor/operator/registry/browser/A-B/failure images. Do not run it unchanged and call thatprofile4. tests/p06/helpers.mjs uses FakeDriver: not an actual proof. Current tests/presentations/backup-capacity.mjs uses actual BK2 producer/read/PGrestore with a fixed adapter after browser API process is absent and renderer stopped. It does not execute DockerDriver.stop/authenticated quiescence/static productiontemplate/featureoff lifecycle.

Smallest addition if parent elects coverage: ONE tests/presentations/profile4-smoke.mjs, invoked by a small explicit optional branch of existing P06/P05 host runner. Existing Dockerfile.operator fixture already COPYs tests/presentations, tools/venus-operator and canonicalprofile4template; ignorealreadypermits the directory, so no new general framework/image/test API needed. Reuse existing P06 Linux namedstatevolume+helperDockerCLI/socketGID+ownedproject cleanup. Run provisioning once as privilegedfixture root; run actual Driver actions as executorUID1001+socketGID so permission failures are visible. No operatorHTTPUI, registry, failingimages, nativebrowser, longstatistics or full A/B round needed.

Inputs: exact cached PRODUCTION Dockerfile image with real buildmetadata/version/source labels and image ID/config identity; helperimageID; pinned Postgres image; exact current source/core hashes; unique disposableproject and hoststatevolumemountpoint. P05browserimage lacksproductionbuildmetadata and is not substitute. Existing unsigned production version0.0.0 cannot pass createRelease/verifyRelease (which requireversion>0.0.0); do not weaken/bypass that verifier. For expressly unsigned runtime scope, pass a clearly-labelled unsigned local runtime descriptor directly to real DockerDriver with actual image labels/version/source, environment=standalone-local-presentations-v4,presentations=PRESENTATIONS_RELEASE,schema generation/read1 and source_identity. This does not prove signedrelease/import/UpdateEngine.install. A future fixture-signed install would need validfixtureversion/image labels and separatetransportidentity, out of this minimum.

Concrete sequence:
1. Fresh Linux namedstatevolume, provision('/data',temporaryoperatorcredential,{presentations:true}); preserve0700/0600/UID1000 protected files and nonsecret controlreceipt. Build cfg as existing P06: local_root=/data, host_root=exactLinuxDockerVolumeMountpoint, canonical/opt/venus/infra/venus/compose.presentations.standalone.yml, profilev4,presentations_enabled=true,calls_enabled=false,free loopbackappport and matching APP_ORIGIN. Staticmedia still present; fixed7881/7882 must be free, so run after current nativeprojects complete, not concurrently. No Windows host permission emulation.
2. In executor1001 helper, use real DockerDriver: preflight(descriptor,{install:true}), serving(false), initialize(descriptor), start(descriptor), healthy(descriptor), serving(true). localImage uses exact cached image; no override/mock of localImage/start/stop/quiesce/restore/healthy. Descriptorlabelidentity must match actual image0.0.0/source. This exercises static guardian, appentry, actualprovision, DBmigrations and media-preparation-under-closed-serving.
3. Using actual production room/entry/host APIs (adapt P06 createRoomsScript and existing smallPDFfixture, hold syntheticcookies onlymemory/notreport), import TWO small ready PDFs, setsettings/startlive, retain intactdocument PNG SHA and metadata plus protectedentries canonicalhash. Start one100page conversion and wait actual root-owned healthbusy identity (no injectedtestAPI) so quiesce must cancel a realjob. Existing API-level round covers ACL details; do not duplicate entire suite.
4. driver.stop(): must close serving, execute real HMAC POST /internal/v1/presentations/quiesce whileAPIrunning and get confirmedready, then stop app/renderer/media, requireQuiesced and purge verified project-owned tmpfs through real UIDhelpers. Capture native exits/trace, stoppedstates, projectvolume labels/options, no volatileplaintext and job cancellation. No adapter substitutes or direct APIcrash as replacement for this step.
5. backup=driver.backup({manifest:descriptor},UUID), driver.readBackup(backup.file): assert BK2/max256/header/writeboundary/excludedkeys/floors/spool and one actualfilehash. Existing large capacity proof remains separately referenced; this small smoke is lifecycle proof, not another largestaccepted proof.
6. Restart enabled+healthy+serving; delete the first document via authenticatedhost API (protectedretirement), preserve second intactdocument. Stop through same real path; driver.restore(backup,{manifest:descriptor}) restores DBwhilefloors/keyring remainoutside. FeatureoffDriver=new DockerDriver({...cfg,presentations_enabled:false}); start/healthy/open same compatiblev4image. Snapshot unavailable and bytes denied; assert floors unchanged as entries, not whole authorityfilebytes (epoch/version intentionallyrotate).
7. Stop offdriver; start ondriver/healthy/open. Assert nonretiredsecondPDF/settings/PNGhash survive, live staysstopped; retiredfirstPDF cannotreappear/read even though older backup contains it. This exercises DBrestore+protectedfloor+feature-off/on compatibility together, with one smalldataset, no extensive A/Bfailurematrix.
8. Attempt ondriver.start({...descriptor,environment:'standalone-local-media-v3'}) and wrongmodule/profile descriptor; require PRESENTATIONS_ROLLBACK_PROFILE before compose/DBmutation and unchanged currentcontainerIDs/healthyroom. This is an actual methodguard, not a gen3 runtime. Final realstop/ownedcleanup.

Bounds and qualification: one cached production image proves configuration feature-off/on/restore compatibility and the actual role/quiescence path. It does NOT prove rollback to a distinct older source/image or offline signed A->B recovery. If final contract demands distinct-image downgrade, use a second alreadyavailable compatible profile4 production image with exact labels, then start it during step6 and bind its source/image; otherwise keep that portion HOLD/qualified instead of inventing second-image PASS. No publicsignature/production/TLS/device/P07 claim. A local per-profile operator smoke does not replace independent stageexit.

Actualproof outputs if implemented: one RESULTS.json listing source/core/image/helper/templatehashes; native actions andphase exits; UID1001; before/afterPGasset count/hash; protectedentries hash (notcookie/keycontents); jobcancel+guardianidle/stopped+volumecleanup; BK2fileSHA/bytes; featureoffdenial+featureonintactread/retireddenial; profileguard/no mutation; cleanupstates. Each assertion must bind exact actualbytes. A failing smoke remainsFAIL.

Cleanup addition important: old P06 host loop only tracks the namedhost volume. Profile4 creates a separate project_presentation-spool volume. Remove/verify that exact Compose-labelled volume too, after ownedcontainers stop, alongside newprojectnetworks and statevolume. No globalprune; failedstatevolume retention must beexplicit and test-only.

Inspection failure retained: one rg invocation accidentally passed PowerShell -ErrorAction to rg and returned encoding-flag error; corrected by targeted reads. No product/test/build/Docker execution occurred.
[
  {
    "path": "tests/p06/docker-drill.mjs",
    "sha256": "ce22022a4ab9107221d95f7109efd0b28790935565eb24f4206be141278ce723"
  },
  {
    "path": "tests/p06/fixture-worker.mjs",
    "sha256": "a32ff575964ab49ddeed76f57b54853830218ad386c64d5d23df60e22276d3bc"
  },
  {
    "path": "tests/p06/fixture-operator.mjs",
    "sha256": "8e3eee4813eae4316fdf7475d54a44c1011e2f90c69b6623f3044609c41568cf"
  },
  {
    "path": "tests/p06/helpers.mjs",
    "sha256": "4a883fbebd9335fded309467071451946b6d2b1b408389965b0d5262cea66f54"
  },
  {
    "path": "tests/presentations/backup-capacity.mjs",
    "sha256": "c1a92135b774c5b662c8c581b9273c1d820dad5426d3fd3424033c863f4b7866"
  },
  {
    "path": "tools/p06-integration.mjs",
    "sha256": "054a2e75abe2e0c78909e06eb9274b78dfcaa8d3a905f4e82e11aeba54bacfb4"
  },
  {
    "path": "tools/p05-browser.mjs",
    "sha256": "3e50c42ba43d1c352bde428127bf0a808409907128220f679bdd896a124a0ee8"
  },
  {
    "path": "tools/venus-operator/driver.mjs",
    "sha256": "779b0d51f1ce3c3b72c18abbcb9b89e1cd00330cb8780b1d92e47fc1ef7815db"
  },
  {
    "path": "tools/venus-operator/provision.mjs",
    "sha256": "04421a3b0f8c8662dbb48138ca210675a840d4840708beb53bed83e3098117f2"
  },
  {
    "path": "tools/venus-operator/presentation-backup.mjs",
    "sha256": "dfbbfb5554051cb3430608d4e48d5dfc73b4d49e963adee028956777990361a6"
  },
  {
    "path": "tools/venus-operator/presentations-profile.mjs",
    "sha256": "b8a125222c70a1da7054803093a0bf22b6a2e3dd4d03f5451e8767e96351478a"
  },
  {
    "path": "tools/venus-operator/release.mjs",
    "sha256": "f3f98cae474a9a9581b7b9faaeb67fb3ef8fea3724d842187f34fb8a39ed5cd8"
  },
  {
    "path": "infra/venus/Dockerfile.operator",
    "sha256": "017bcab93c6d8e438c2815185e77b43b3e1c4a7031c4bd4be46d7008d84db267"
  },
  {
    "path": "infra/venus/compose.presentations.standalone.yml",
    "sha256": "c3e314d4b6658a75f81b3abedf6a1c864ea386d09aaa2e7180099680382b46af"
  },
  {
    "path": "apps/api/src/app.ts",
    "sha256": "698f9cd6f4f6523d0348a699728c087aa3cf214262fbf3cd034cbd425ec6f68a"
  },
  {
    "path": "apps/api/src/presentations.ts",
    "sha256": "6ceb34fd957e873de7d9c7e2ff98356eb31e65557d35857824bb2a3fbff6e6cc"
  },
  {
    "path": "apps/api/src/media.ts",
    "sha256": "103f863c7a4e7a078f3ef814c2a64b8ab11203a35a9894791c684f6ebfe8a390"
  }
]

CompletedUTC 2026-10-25T07:30:53.3365138+00:00
Assessment only; requiredsmoke code/proofNOT_RUN. No gatePASS. COMPLETE_STOP.
