"""Freeze new author correction; independent reviewer must decide closure."""
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT=Path.cwd();P=ROOT/'.artifacts/p05-v2-layout-producer-resume02';OUT=ROOT/'.docs/implementation/reviews/p05/topic-layout-author-resume02'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(path,v):path.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
assert not OUT.exists(),'Refuse rewriting author revision'
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
source=inventory();assert len(source)==1813;assert identity(source)=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
previous=ROOT/'.docs/implementation/reviews/p05/topic-layout-author-resume01'
assert sha(previous/'index.json')=='5c4f69fea4090523b335793ba6a9e1037591ff71e9feba589910c6cd475c6690'
for r in json.loads((previous/'index.json').read_text(encoding='utf-8'))['files']:
 assert sha(previous/r['path'])==r['sha256'],r['path']
 if r['path'].startswith('producer/'):
  assert sha(ROOT/'.artifacts/p05-v2-layout-producer-resume01'/r['path'][9:])==r['sha256'],r['path']
review=ROOT/'.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round01'
review_index=json.loads((review/'index.json').read_text(encoding='utf-8'))
for r in review_index['files']:assert sha(review/r['path'])==r['sha256'],r['path']
method=ROOT/'.docs/implementation/reviews/p05/topic-browser-method13-independent-review-round01'
assert sha(method/'INDEX.json')=='d871a3b677939fdae7fff04ed9dc5254830f1ff3d6617a10728fbc3894d48f41'
assert json.loads((P/'ROOT_RUN_ACK.json').read_text(encoding='utf-8'))['root_run_ack'] is False
checks=json.loads((P/'author-checks-attempt05.json').read_text(encoding='utf-8'));assert checks['status']=='PASS'
finite=sum(r.get('checks')or 0 for r in checks['rows'])
for name in ['resume-controls.json','paint-context-controls.json']:
 obj=json.loads((P/name).read_text(encoding='utf-8'));assert obj['status']=='PASS';finite+=obj['count']
assert finite==171,finite
lint=json.loads((P/'lint-resume02-01.json').read_text(encoding='utf-8'));assert all(r['errorCount']==0 and r['fatalErrorCount']==0 for r in lint)
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
js="import {captureProducer,runtimeDigest} from './.artifacts/p05-v2-layout-producer-resume02/runner-policy.mjs';const x=captureProducer('.artifacts/p05-v2-layout-producer-resume02');process.stdout.write(JSON.stringify({producer_runtime_digest:runtimeDigest(x),producer:x}));"
proc=subprocess.run([node,'--input-type=module','-e',js],capture_output=True,text=True,check=False,timeout=30);assert proc.returncode==0,proc.stderr
capture=json.loads(proc.stdout)
shutil.copytree(P,OUT/'producer')
save(OUT/'inputs.json',{'source_identity':identity(source),'included_files':len(source),'files':source,'previous_author_index_sha256':sha(previous/'index.json'),'independent_findings_index_sha256':sha(review/'index.json'),'method13_accepted_index_sha256':sha(method/'INDEX.json'),'producer_runtime_digest':capture['producer_runtime_digest'],'producer':capture['producer']})
save(OUT/'finding-dispositions.json',{'status':'AUTHOR_FIXES_AWAIT_INDEPENDENT_REPEAT','findings':[
 {'id':'LAYOUT-R01-001','author_disposition':'FIXED_AWAIT_INDEPENDENT_REVIEW','change':'Host validates mandatory real-review image/runtime digest against binding/current inventory/root ACK before allocation/Docker','controls':'runner-replay31 includes wrong/missing image/digest before-allocation refusal'},
 {'id':'LAYOUT-R01-002','author_disposition':'FIXED_AWAIT_INDEPENDENT_REVIEW','change':'Flat sRGB paint model rejects unsupported filter/backdrop/blend/isolation/mask/clip/textshadow/transform/perspective/contentvisibility contexts on node/ancestors; focus marks unresolved and not positively visible','controls':'28 exact DOM/focus fake-computed-style controls, including original brightness0/opacity0 counterexamples on node and ancestors'},
]})
report='''# P05 layout459 resume02 — author corrections\n\n**AUTHOR_CODE_READY / INDEPENDENT_REPEAT_REQUIRED / ACTUAL_NOT_RUN.** R01-001 and R01-002 are corrected by the author; only another reviewer may close them. No product source, old producer, old author packet or independent findings were changed. Content470 HOLD and full-stage requirements remain. Root ACK remains false.\n\nR01-001: host runner now requires the actual hashed independent review JSON to expose matching top-level source_identity, image and producer_runtime_digest; the mandatory64hex runtime digest is compared against both actual inventory and root ACK before allocation/Docker. Contrary/missing fields fail even when the true review hash matches ACK and source remains unchanged. Added four exact-host-VM negative controls cover missing/contrary image and digest. The independent repeat should put these exact three fields in its durable index; the operational ACK cannot substitute independent byte acceptance.\n\nR01-002: both self-contained text/control and focus paint calculations conservatively mark unsupported filter/backdrop/blending/isolation/mask/clipping/text-shadow/transform/perspective contexts on node or ancestors as unresolved. Nonopaque opacity and hidden/auto content visibility are not a positive focus proof. Focus visible becomes false in an unresolved context, and strict existing contrast/keyboard assertions reject it. Supported flat sRGB alpha background composition remains; thresholds are unchanged. This does not assert those styles occur in Venus or that actual browser contrast passed. The added28 fake-computed-style controls cover the original brightness0/opacity0 cases on node/ancestor, other supported rejection classes, focus consistency and ordinary flat positives.\n\n31 helpers now derive byte-exact from independently accepted METHOD13 browser5b5e251c910ce1f27d7138723bc0bb2f4eccedd2e7d9cebc1405d559fda8f7d9, review d871a3b677939fdae7fff04ed9dc5254830f1ff3d6617a10728fbc3894d48f41. Observer03 and exact request module remain unchanged. This source-bound upgrade adopts the shared8s positive action phase; actual functional outcome is root-owned and unclaimed. Root's previous METHOD12 actualFAIL is not erased.\n\nFinal171 finite controls PASS:28 contract,57 scope/deadline/DOM/PNG/ACK,14 keyboard VM,31 host-runner VM,13 AST/binding/cold-import,28 new paint-context controls. Final23 syntax checks and ESLint exit0. Earlier snapshots/lint attempts are copied only as history; authoritative current runs are author-checks-attempt05, resume-controls, paint-context-controls and lint-resume02-01. All operations were finite/static/VM/cold imports; no real browser/Docker/X11/selector ran here.\n\nMatrix459 remains exact:360 core normal +45 core native +54 supplements, nine51-cell engine/locale shards. Original matrix/probe-policy/X11/runtime clocks/TTLs/screenshot budgets/cleanup remain. Source1274/1813 and imageff371 binding/build receipt unchanged. Previous87-file author packet and its old working bytes were reverified unchanged. New author runtime digest and all inputs are in inputs.json.\n\nNext: independent repeat checks both prior counterexamples against these exact bytes, reviews METHOD13 helper extraction, confirms the new runtime/source/image tuple, and records a new independent verdict. Fix findings and repeat as necessary; no author self-acceptance. Only root can later set an exact operational ACK and authorize actual layout shards. Natural expiry, native/contrast/permission/cleanup failures remain FAIL.\n'''
(OUT/'REPORT.md').write_text(report,encoding='utf-8')
files=[{'path':p.relative_to(OUT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(OUT.rglob('*'))if p.is_file()]
save(OUT/'index.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'AUTHOR_CODE_READY_INDEPENDENT_REPEAT_REQUIRED','source_identity':identity(source),'included_files':1813,'image':'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4','producer_runtime_digest':capture['producer_runtime_digest'],'finite_author_controls':171,'actual_run':False,'root_run_ack':False,'files':files})
save(OUT/'HANDOFF.json',{'status':'AUTHOR_CODE_READY_INDEPENDENT_REPEAT_REQUIRED','writes':'COMPLETE','index_sha256':sha(OUT/'index.json'),'files':len(files),'producer_runtime_digest':capture['producer_runtime_digest'],'source_identity':identity(source),'included_files':1813,'image':'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4','actual_run':False,'root_run_ack':False,'next':'Other independent reviewer repeats both P2 checks; then root exact review/runtime/source/image ACK if PASS'})
print(json.dumps({'status':'AUTHOR_READY_INDEPENDENT_REPEAT_REQUIRED','index_sha256':sha(OUT/'index.json'),'handoff_sha256':sha(OUT/'HANDOFF.json'),'files':len(files),'producer_runtime_digest':capture['producer_runtime_digest'],'finite_controls':171}))
