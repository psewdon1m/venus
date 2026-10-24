from pathlib import Path
import sys,json,hashlib,datetime,shutil,difflib
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
c=Path('.artifacts/p05-grant-phase-candidate02');prior=Path('.artifacts/p05-grant-phase-candidate01');base=Path('.artifacts/p05-grant-phase-candidate-review-round02');out=Path('.docs/implementation/reviews/p05/topic-grant-phase-candidate-round02');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text('utf-8-sig'))
assert sha(c/'topic-state.ts')=='3a687304a86f7743c1fbae35f2f7c9ad2c4cf64948d54f134cc68739bcf736b4' and sha(c/'topic-state.test.ts')=='14c8509cbe77a109b96e2b70850887c45c4b2779d64a7bda18beb6c1640ab88a'
for name,h in read(c/'HANDOFF.json')['pins'].items():assert sha(c/name)==h
assert read(c/'HANDOFF.json')['previous_handoff_sha256']==sha(prior/'HANDOFF.json')
source=inventory();assert identity(source)=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4' and len(source)==1813
a=(prior/'topic-state.ts').read_text('utf-8');b=(c/'topic-state.ts').read_text('utf-8');assert a[:a.index('export class TopicCache')]==b[:b.index('export class TopicCache')];assert a[a.index(' clear(){'):]==b[b.index(' clear(){'):]
# Only the copied non-null anchor field and bind body change from01; accept remains exact.
strip=lambda s:s.replace('private boundScope:TopicScope|null=null;','')
assert strip(a[:a.index(' bind(scope:')])==strip(b[:b.index(' bind(scope:')])
assert (c/'topic-state.test.ts').read_text('utf-8').startswith((prior/'topic-state.test.ts').read_text('utf-8'))
tests=read(base/'vitest-results.json');assert tests['numPassedTests']==tests['numTotalTests']==47 and tests['numFailedTests']==0
loaded=read(base/'loaded-inputs.json');assert any(x['sha256']==sha(c/'topic-state.ts') for x in loaded) and any(x['sha256']==sha(c/'topic-state.test.ts') for x in loaded)
assert len(read(base/'probes.json')['rows'])==12 and len(read(base/'metadata-replay.json')['rows'])==4 and read(base/'prospective-tsx.json')['result']['reusedPrompt']
out.mkdir(parents=True,exist_ok=False);inputs=[]
for p in [c/'HANDOFF.json',c/'topic-state.ts',c/'topic-state.test.ts',prior/'HANDOFF.json',prior/'topic-state.ts',Path('apps/web/src/topic-state.ts'),Path('apps/web/src/topic-games-panel.tsx'),Path('apps/web/src/topic-test-harness.ts')]:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':sha(p)})
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
(out/'candidate01-02.diff').write_text(''.join(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile='candidate01',tofile='candidate02')),'utf-8')
status='SCOPED_GRANT_PHASE_CANDIDATE02_PROSPECTIVE_PASS_INTEGRATION_ACTUAL_PENDING'
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','candidate_author':'/root','exact_inputs':inputs,'findings':[],'closed_candidate_finding':'GRANT-PHASE-CANDIDATE-R01-NULL-GAP','original_product_finding':'TG-UI-GRANT-PHASE-001 requires fresh integratedactualbrowser proof','checks':{'own_exact_old01_new02_null_and_boundary_controls':12,'own_exact02_cache_actualmetadata_timing_regression_controls':4,'own_exact_harness_panel_candidate02_readloader_positive':'PASS','independent_unique_cache_Vitest':47,'finite01to02':'Copied boundScope anchor plus bind only; all accept/deadline/phase validators and postclass helpers exact01; tests01 retained with null-suspension tests appended','source_e9_1813_unchanged':True},'limits':['Synthetic cache/TSX scheduler and prospective47unit results; not an actual new browser run. Standard panel harness nodefs is distinct from explicit own candidate substitution loader.','No product/candidate writes or functionalDockerRUN. Old01 finding/report preserved; new integration/source/image/tests/actualmethod10/independentaudit still required.','No changed budget, permission5s, protocol/server/schema, fullP05/human450/production claims.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8');(out/'REPORT.md').write_text('''# Grant phase candidate02: independent repeat

**SCOPED_GRANT_PHASE_CANDIDATE02_PROSPECTIVE_PASS_INTEGRATION_ACTUAL_PENDING.** Candidate01 null-suspension finding is closed on exact source3a687304/tests14c8509c. No new findings. Included e9/1813 remains unchanged.

Twelve own exact old01/new02 controls reproduce the old null gap and reject it in02; verify stale pre-null generations fail, both pending/active expiry floors survive repeated null, all five actual room/member/identity/session/round reset boundaries work, the caller object cannot mutate the copied anchor, failed transitions do not publish phase state, and a legitimate active phase still has its original5s own permission bound. Four additional exact-cache controls replay actual RU/TR metadata timing: fresh active RU now accepts after obsolete pending deadline; TR survives that pending deadline while fresh permission remains; same-phase nonextension still rejects replay. An exact included harness/panel with only SHA-pinned candidate02 cache read substitution shows the original pending-history active-prompt counterexample now succeeds.

Independent unique-cache Vitest47PASS, with candidate source/test load hashes checked. This does not silently treat the standard node:fs TSX harness as candidate-substituted: own separate loader supplies that proof. Finite01→02 changes only the copied last non-null boundScope anchor and bind method. All accept/deadline/phase publication code and validators/helpers remain exact01; prior tests remain with explicit null controls appended. Null still destroys private values and invalidates reads; nonsecret floors survive transport suspension and reset on the next real different scope.

No product/candidate writes or functional Docker/browser RUN occurred. Original01/report remain immutable. TG-UI-GRANT-PHASE-001 still requires integrated source/image/tests and actual unchanged method10 proof; no budget/5s lease/protocol/server/schema change or fullP05/human450/production acceptance is claimed.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()];(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
