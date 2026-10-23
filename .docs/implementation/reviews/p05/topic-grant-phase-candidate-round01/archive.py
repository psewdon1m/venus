from pathlib import Path
import sys,json,hashlib,datetime,shutil
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
candidate=Path('.artifacts/p05-grant-phase-candidate01');base=Path('.artifacts/p05-grant-phase-candidate-review-round01');out=Path('.docs/implementation/reviews/p05/topic-grant-phase-candidate-round01')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text('utf-8-sig'))
assert sha(candidate/'topic-state.ts')=='1c3e28d0f9ac9f789559571d737a112d4d1c974ed433c58d9a22d900fe9e47ed';assert sha(candidate/'topic-state.test.ts')=='3a3632f17b2c705b3d3d6fecc3a9b4fd8f685569a07d1e561df75b8d3776dc31'
for n,h in read(candidate/'HANDOFF.json')['pins'].items():assert sha(candidate/n)==h
source=inventory();assert identity(source)=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4' and len(source)==1813
tests=read(base/'vitest-results.json');assert tests['numPassedTests']==tests['numTotalTests']==39 and tests['numFailedTests']==0
loads=read(base/'loaded-inputs.json');assert any(x['sha256']==sha(candidate/'topic-state.ts') for x in loads) and any(x['sha256']==sha(candidate/'topic-state.test.ts') for x in loads)
assert read(base/'prospective-tsx.json')['status']=='PASS';counter=read(base/'null-gap-counterexample.json');assert counter['rows'][0]['accepted_pending_downgrade'] is False and counter['rows'][1]['accepted_pending_downgrade'] is True
old=Path('apps/web/src/topic-state.ts').read_text('utf-8');new=(candidate/'topic-state.ts').read_text('utf-8');assert old[:old.index('/** A local presentation cache')]==new[:new.index('/** A local presentation cache')];assert old[old.index('export function topicRefusals'):]==new[new.index('export function topicRefusals'):]
out.mkdir(parents=True,exist_ok=False);inputs=[]
for p in [candidate/'HANDOFF.json',candidate/'topic-state.ts',candidate/'topic-state.test.ts',Path('apps/web/src/topic-state.ts'),Path('apps/web/src/topic-games-panel.tsx'),Path('apps/web/src/topic-test-harness.ts')]:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':sha(p)})
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
status='CHANGES_REQUESTED_NULL_SUSPENSION_PHASE_FLOOR_RETENTION'
finding={'id':'GRANT-PHASE-CANDIDATE-R01-NULL-GAP','severity':'P2','problem':'bind(null) clears phaseFloors/deadlines and replaces scope with null. Real TopicGamesPanel passes null while connection is offline; reconnecting same identity/session/round resets again. Thus requested retention across transport loss fails despite direct transport-only unit control.','reproduction':'accept active invitation→clear→bind(null)→bind(same identity/session/round,transport2,rev4)→fresh valid pending projection same offer/proposal returns true. Direct transport change without null returns false.','scope':'Defense against phase regression, not evidence of server ACL bypass or actual secret leak. Candidate fixes original availability counterexample prospectively, but does not yet satisfy retention requirement.','correction':'Retain an immutable copy of last non-null room/member/identity/session/round reset anchor through null suspension. Null must still clear private values and invalidate generations; keep nonsecret floor/deadline history until next actual scope differs at a real reset boundary.'}
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','candidate_author':'/root','exact_inputs':inputs,'findings':[finding],'checks':{'unique_exact_candidate_Vitest':39,'own_original_bug_positive_exact_harness_and_candidate_TSX_loader':'PASS','own_exact_nullgap_counterexample':'CONFIRMED','validators_and_postclass_bytes_unchanged':True,'source_e9_1813_unchanged':True},'limits':['Vitest panel harness ordinarily reads included source through node:fs; no claim that its39 tests all execute prospective candidate TSX. Separate own SHA-hardchecked read-only harness loader proves original availability counterexample with candidate cache.','Counterexample uses valid synthetic DTOs and explicit cache sequence; no actual browser/Docker functional run or server leak claim.','Candidate01 and included e9 remain untouched. Root candidate02 prepared separately after finding notification; not accepted by this report.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8')
(out/'REPORT.md').write_text('''# Grant phase candidate01: independent review

**CHANGES_REQUESTED_NULL_SUSPENSION_PHASE_FLOOR_RETENTION.** One P2: GRANT-PHASE-CANDIDATE-R01-NULL-GAP. Exact candidate source1c3e28d/tests3a3632f/HANDOFF pins verified; included e9/1813 unchanged. Independent unique-cache Vitest39PASS and own exact harness/TSX positive confirm the original pending→active availability defect is repaired prospectively.

The new phase-specific deadlines and atomic phase/deadline publication are appropriately scoped. Protocol validators and post-class helpers are unchanged. However bind(null) clears deadlines and phaseFloors and loses the prior non-null reset identity. TopicGamesPanel calls cache.bind(null) during offline transport, so the new guard does not actually survive that transport suspension.

Own exact source counterexample: accept active invitation; clear; bind(null); reconnect same identity/session/round at transport2 and a fresh game revision; accept valid pending DTO for the same offer/proposal. Candidate returns true. The direct transport-only control returns false. This violates the requested monotonic phase retention; it is not a server authorization bypass or demonstrated private-text leak.

Retain a copied nonsecret last non-null room/member/identity/session/round reset anchor through null suspension. Continue invalidating generations and destroying private values on null; reset phase/deadline history only when the next actual scope crosses a real identity/session/round boundary. Verify old pre-null reads fail, active→pending and expired phase refresh remain denied across null/reconnect, and all real boundaries plus mutable caller references reset safely.

Own prospective TSX loader substitutes only the hardchecked candidate topic-state read into the exact included harness/panel; it shows prior-pending-history active prompt now appears. The standard Vitest panel harness reads included source through node:fs, so39PASS is not asserted as39 prospective TSX tests. No product/candidate writes or functional Docker/browser RUN occurred. Candidate01 preserved; separate02 requires independent repeat.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
