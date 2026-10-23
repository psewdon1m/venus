from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys,shutil
sys.path.insert(0,'tools');import stage_inventory
root=Path.cwd();producer=root/'.artifacts/p05-advice-browser-producer11'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(producer/'HANDOFF.json')=='c58b3420c484675877385ef2ec25adbaacebfcd9141da04c1edbebc3fb1ce6c1'
h=json.loads((producer/'HANDOFF.json').read_text(encoding='utf-8'))
for name,pin in h['producer_pins'].items():assert sha(producer/name)==pin
assert stage_inventory.identity(stage_inventory.inventory())==h['source_identity']
assert len(stage_inventory.inventory())==1813
old=root/'.docs/implementation/evidence/p05/renewal-topic-browser-preflight-01/run/producer'
for name,pin in h['producer_base_pins'].items():assert sha(old/name)==pin
api=(root/'apps/api/src/topic-games.ts').read_text(encoding='utf-8')
assert "if(input.scope==='action'&&l.data.plan.interaction==='pair_private')" in api
assert "requireThat(conv?.state.offer?.state==='active','TOPIC_CONSENT_REQUIRED',409)" in api
command=api.split('async conversationCommand(',1)[1].split('async finish(',1)[0]
assert 'l.data.action=' not in command
out=root/'.docs/implementation/reviews/p05/topic-advice-method11-review-round01';assert not out.exists();out.mkdir(parents=True)
work=root/'.artifacts/p05-advice-method11-review-round01'
for name in ('probes.mjs','probes.json','publish.py'):shutil.copyfile(work/name,out/name)
inputs=out/'inputs';inputs.mkdir()
for name in h['producer_pins']:shutil.copyfile(producer/name,inputs/name)
shutil.copyfile(producer/'HANDOFF.json',inputs/'HANDOFF.json')
for name in ['apps/api/src/topic-games.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/topic-test-harness.ts']:
 shutil.copyfile(root/name,inputs/Path(name).name)
text='''# P05 advice method11 prospective review, round01

**CHANGES_REQUESTED: two P2 producer findings.** The frozen method11 has not run. Its receipt and finite readiness mechanisms pass the independent controls below, but the new required-action fixture setup is placed before topic consent and is incompatible with the unchanged later finish helper. No product defect or full-stage acceptance is claimed.

Exact inputs: HANDOFF `c58b3420c484675877385ef2ec25adbaacebfcd9141da04c1edbebc3fb1ce6c1`; browser `70abacfc3dc3fdb560d9fd21b197ce849a3622984789886c8a3d0fdfdc751df0`. All seven declared producer hashes and seven baseline hashes independently verified. Current source `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad`/1813 equals the frozen identity. Product, original producer and candidate bytes were read only. No functional Docker/browser execution.

## M11-R01 — P2: required action accepted before prerequisite topic consent

Case04 now calls `acceptActionsUi(q)` immediately after `invite(q)`. Topic consent is intentionally still pending until case05 `acceptTopics(q)`. Real `TopicGames.response` rejects action acceptance unless the private topic offer is active (`TOPIC_CONSENT_REQUIRED`,409); its self-actions likewise requires `topic` before `accept_action` can be true. The unmodified panel renders the action accept control disabled in this state. The exact candidate `acceptActionsUi` waits for it to be enabled and cannot complete the new case04 path on a required-action plan.

Reproduction: independent [probes](probes.mjs) execute the current unmodified panel/harness with pending invitation already active, topic pending and action pending. Action accept is disabled and private prompt absent. With legitimate topic-active projection and permission, it becomes enabled. Exact candidate helper invoked against that disabled precondition rejects before mutation. This is a source-bound scenario with explicit API/permission fixtures, not a new actual browser attempt.

Correction: keep case04 quiet invitation and all zero/one topic acknowledgement checks. Place conditional real action setup after the existing bilateral topic acceptance in case05, before the extended advice scenario. Do not bypass consent, alter TTL or seed authority in SQL. Re-test the ordering and a non-required-action fixture.

## M11-R02 — P2: unchanged finish helper rejects the newly preaccepted action

Once that setup legitimately accepts both actors' action, case07 later calls `actionAndFinish(q)`. It branches on immutable `f.plan.requires_action_consent`, asserts primary `game-finish` absent and always calls `acceptActionsUi` again. The prior action remains active: `conversationCommand` including `other_question` never resets `l.data.action`; subsequent bilateral topic acceptance re-enables primary finish. Real self-actions exposes finish for valid active action/topic and no new action acceptance. The panel consequently shows finish and disables the already-accepted action control. The helper's first absence assertion fails; merely moving setup after topic consent leaves this regression.

Independent unmodified TSX control shows `game-finish` visible and action accept disabled for valid active own action. Running the exact candidate `actionAndFinish` against that projection rejects at its forbidden finish-absence assertion. The need is introduced by the changed fixture; its unchanged helper bytes do not establish compatibility.

Correction: classify current action using both actors' exact own target projections with same room/session/round/game revision and unexpired action ref/state/own acceptance, plus fresh primary self-actions. For active, both-own-accepted action and permitted primary finish, retain role-denial and final exact finish mutation checks without reacceptance. For pending action, preserve the original no-finish → two genuine acceptances path. Missing, expired, mismatched, mixed or unproven action must fail instead of being treated as preaccepted. A later condition edit creates a fresh pending action, so that path must still exercise fresh consent. Do not change the planner's `requires_action_consent` field.

## Independent validation and finite scope

Seventeen controls PASS, exit0: exact response receipt/opaque tuple/coherent min revision; eleven wrong status/schema/request/revision/kind/method/path/advice/epoch/proposal/decision negatives; shared-stage parallel recipient waits drain after one rejection; pending-topic and active-action TSX states; both exact helper regressions reproduced. The tests load named functions from the pinned producer AST, not a rewritten implementation. No Playwright response or DOM engine is claimed by the inert request/permission fixtures.

AST comparison: only cases04 and06 changed; fourteen other case bodies exact. Three functions added (`adviceMutation`, `adviceUiReady`, `receivedPendingAdvice`); only existing `topicUiReady` changed, solely its advice locator allowlist. Topic method10 and old helper functions including `actionAndFinish` are exact baseline. Case06 retains no-preview, new edit advice id, recipient opt-in, both-actor revoke absence and original content matcher. The new advice receipt filters path/method/kind and validates status200/schema2/request_id/integer game_rev and expected opaque tuple before coherent same-round min revision. Readiness uses existing absolute8s stage; shared multi-actor waits use allSettled and do not reset per actor. This review does not accept the historical root lint invocation that ignored artifacts as an executed lint check.

Retain this candidate, HANDOFF and report unchanged. A new corrected candidate needs its own pins, finite source/flow diff and independent repeat review before RUN. The saved actual `c78abdd7` failure remains FAIL; its first advice failure was not caused by action expiry. No new product changes, timeout increases, full P05, human450 or production approval follow from this review.
'''
(out/'REPORT.md').write_text(text,encoding='utf-8')
r={'schema_version':1,'status':'CHANGES_REQUESTED','reviewer':'/root/p05_topics_ui_review','created_at':datetime.now(timezone.utc).isoformat(),'handoff_sha256':sha(producer/'HANDOFF.json'),'browser_sha256':sha(producer/'browser.mjs'),'source_identity':h['source_identity'],'included_files':1813,'findings':[{'id':'M11-R01','severity':'P2','scope':'producer','title':'Action setup precedes mandatory topic consent'},{'id':'M11-R02','severity':'P2','scope':'producer','title':'Finish helper reaccepts the newly preaccepted action'}],'independent_controls':json.loads((work/'probes.json').read_text(encoding='utf-8')),'functional_run':False,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8')
files=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':r['status'],'full_stage_pass':False,'files':files},indent=2)+'\n',encoding='utf-8')
with (root/'.history/agents/2026-10-20-p05-advice-method11-review.md').open('a',encoding='utf-8') as log:
 log.write('\n## '+datetime.now(timezone.utc).isoformat()+' — Immutable review completed\nSeven producer/base pins and current1274/1813 verified. Own17 exact-function/currentTSX controls exit0, two P2 reproduced: M11-R01 action before topic consent; M11-R02 unchanged finish rejects newly active/preaccepted action. Fourteen other case AST exact, topicUi only allowlist, three additions. No producer/product/Docker writes. Report '+out.relative_to(root).as_posix()+'/index.json SHA'+sha(out/'index.json')+' ('+str(len(files))+' files), CHANGES_REQUESTED; parent acknowledged ordering and prepares separate02. Prior actual failure preserved.\n')
print(json.dumps({'status':r['status'],'index_sha256':sha(out/'index.json'),'files':len(files),'report':out.relative_to(root).as_posix()}))
