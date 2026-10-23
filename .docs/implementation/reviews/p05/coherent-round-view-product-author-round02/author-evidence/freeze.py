from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,difflib
w=Path(__file__).parent;packet=Path('.docs/implementation/reviews/p05/coherent-round-view-product-author-round02');assert not packet.exists();packet.mkdir(parents=True);sha=lambda b:hashlib.sha256(b).hexdigest();write=lambda p,v:p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
files=['apps/api/src/topic-games.ts','apps/api/src/topic-round-view.test.ts','.docs/implementation/p05-source-revision-round-view-02.json'];pins=[]
for name in files:
 p=Path(name);target=packet/'source'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target);pins.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
for name in files[:2]:
 old=w/'before'/Path(name).name;assert old.read_bytes()==(Path('.artifacts/p05-engine3-bundle-source01')/name).read_bytes();target=packet/'before'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(old,target);diff=''.join(difflib.unified_diff(old.read_text(encoding='utf-8').splitlines(True),Path(name).read_text(encoding='utf-8').splitlines(True),fromfile='f427/'+name,tofile='round-view02/'+name));(packet/(Path(name).name+'.patch')).write_text(diff,encoding='utf-8')
shutil.copytree(w,packet/'author-evidence');write(packet/'SOURCE_PINS.json',pins)
report='''# Bundled TD pre-choice application correction02

AUTHOR_HOST_TESTED_NOT_SELF_ACCEPTED. Independent source review and root actual browser remain required. No Docker/image/sourcefreeze/globalmanifest/observer/timer change was performed here.

Exact actual21 INDEXf8f384f47b7ce5bce29216f5cc86c1202ddfb5a9323fbbfc63723734ca1454c2/51 was verified. Seven cases passed;08 failed because game-dare was absent, game active26/private round12 pending, primary EN own choose_truth/choose_dare false, WS live. Independently identified /view responses700/706/712 were200 and still had several seconds of grant; this is not an expiry oracle adjustment. beginConversation deliberately waits for TDside, but new bundle demanded prepared conversation whenever conversation_id had been allocated. Null prepared cleared ordinary/target, so primary choice could never advance the state.

Two guards in dispatchRoundView now recognize only TD with choice absent. Preparation reconciles rather than projecting this phase; final own+target remain normal-authenticated while conversation/chat stay null. Normal choice still requires primary role, native bilateral invitation, source/safety/entry/presence/clock/parent and final enqueue checks. After choice, missing expected projection still fails closed; no broad optional-conversation fallback exists. New action remains absent until original topic approval. Contracts/frontend/helper bytes unchanged.

Red old API:16PASS/1FAIL in existing API file, expected primary choice/target absent. Green final:18API tests; selected3suites28PASS, broader26topic/API/UI suites373PASS/163WindowsSKIP; owned lint0/API build-typecheck0. Native primary and secondary45s-prechoice tests use action=null (no phantom30s window), and fixture parent fence now reads the current data invitation/action instead of a closed-over old action. Pending invitation plus late source/safety/entry/presence/expiry/auth negatives remain. Explicit chosen-side missing projection test denies. Existing UI/API cases and scope/privacy tests remain green.

Chronology retained: initial selected test arguments included a nonexistent timing-test name, so only the actual reported3files are claimed; a PowerShell parser attempt to extend tests exited1 without mutations, followed by saved Python edit. Concurrent parent agent fullhost may have observed intermediate source bytes while this writer was active; it does not certify final SOURCE_PINS. Root must perform combined fullhost/clean-source after all writers stop. The source author packet records only three owned paths, not a global frozen identity.

Prior f427 snapshot and failed actual proof are immutable. Rollback of this small correction restores the known TD prechoice defect; no DB/snapshot policy migration is needed. No actual rerun or stage PASS is claimed. Writes COMPLETE.
'''
(packet/'REPORT.md').write_text(report,encoding='utf-8')
write(packet/'HANDOFF.json',{'status':'AUTHOR_HOST_TESTED_INDEPENDENT_REVIEW_REQUIRED_NOT_RUN','writes_COMPLETE':True,'files':pins,'api_tests':18,'broad_regression':{'files':26,'passed':373,'Windows_skipped':163,'exit_code':0},'lint_exit_code':0,'api_typecheck_exit_code':0,'Docker_commands':0,'contract_frontend_observer_changed':False,'actual_browser_pending':True})
write(packet/'INDEX.json',{'schema_version':1,'status':'AUTHOR_HOST_TESTED_INDEPENDENT_REVIEW_REQUIRED_NOT_RUN','at_utc':datetime.now(timezone.utc).isoformat(),'files':[{'path':p.relative_to(packet).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}for p in sorted(packet.rglob('*'))if p.is_file()and p!=packet/'INDEX.json']})
result={'packet':packet.as_posix(),'index_sha256':sha((packet/'INDEX.json').read_bytes()),'children':len(json.loads((packet/'INDEX.json').read_text())['files']),'source_pins':pins,'writes_COMPLETE':True}
with Path('.history/agents/2026-10-20-p05-round-view02-author.md').open('a',encoding='utf-8')as f:f.write('\n- '+datetime.now(timezone.utc).isoformat()+' UTC - Red oldAPI16P/1F preserved; exact two guard fix after confirming intentional no-conversation TDprechoice. Extended fixture to native action=null/current parent fence at45s; primary choice true/secondaryfalse, pendinginv and late7faults denied, chosen missingprojection denied. Final26files373PASS/163WindowsSKIP, lint/API typecheck0. PowerShell edit syntax failure1 no mutation; nonexistent timing-test arguments not counted. Scoped author freeze '+json.dumps(result)+'. No actualRUN. Writes COMPLETE.\n')
print(json.dumps(result,indent=2))
