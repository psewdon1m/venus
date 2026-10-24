"""Freeze author candidate and command evidence; never authorize or execute a functional run."""
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT=Path.cwd()
PRODUCER=ROOT/'.artifacts/p05-v2-layout-producer-resume01'
OUT=ROOT/'.docs/implementation/reviews/p05/topic-layout-author-resume01'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(path,value):
    path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
assert not OUT.exists(),'Refuse overwriting a frozen author checkpoint'
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
source=inventory()
assert identity(source)=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
assert len(source)==1813
baseline=json.loads((PRODUCER/'baseline-inputs.json').read_text())
for row in baseline['files']:
    assert sha(ROOT/row['path'])==row['sha256'],row['path']
assert sha(PRODUCER/'matrix.mjs')==sha(ROOT/'.artifacts/p05-v2-layout-producer/matrix.mjs')
checks=json.loads((PRODUCER/'author-checks-attempt03.json').read_text())
assert checks['status']=='PASS'
resume=json.loads((PRODUCER/'resume-controls.json').read_text())
assert resume['status']=='PASS' and resume['count']==13
assert json.loads((PRODUCER/'ROOT_RUN_ACK.json').read_text())['root_run_ack'] is False
lint=json.loads((PRODUCER/'lint-final.json').read_text())
assert all(row['errorCount']==0 and row['fatalErrorCount']==0 for row in lint)
from collections import Counter
counts=Counter()
for row in checks['rows']:
    assert row['exit_code']==0
    if row.get('checks') is not None:
        counts['finite_controls']+=row['checks']
counts['finite_controls']+=resume['count']
assert counts['finite_controls']==139
shutil.copytree(PRODUCER,OUT/'producer')
save(OUT/'inputs.json',{'source_identity':identity(source),'included_files':len(source),'files':source,'producer_baseline_original_files_verified':len(baseline['files'])})
save(OUT/'commands.json',{'status':'AUTHOR_CHECKS_PASS_WITH_RETAINED_LINT_FAILURE','functional_run':False,'entries':[
    {'command':'.venv/Scripts/python.exe .artifacts/p05-v2-layout-producer-resume01/adapt-resume.py','exit_code':0},
    {'command':'node .artifacts/p05-v2-layout-producer-resume01/build-driver.mjs','exit_code':0,'final_helpers':31},
    {'command':'.venv/Scripts/python.exe .artifacts/p05-v2-layout-producer-resume01/check-author.py','attempts':[1,2,3],'exit_codes':[0,0,0],'final_syntax_commands':22,'final_finite_modules':4,'final_finite_controls':126},
    {'command':'node .artifacts/p05-v2-layout-producer-resume01/resume-controls.mjs','exit_code':0,'final_controls':13},
    {'command':'node node_modules/eslint/bin/eslint.js --config .artifacts/p05-v2-layout-producer-resume01/eslint.config.mjs .artifacts/p05-v2-layout-producer-resume01 --format json --output-file [attempt output]','attempt':1,'exit_code':1,'cause':'Unused extracted choosePrivate; actual Node24 structuredClone builtin missing from lint environment; original full lint JSON retained'},
    {'command':'node node_modules/eslint/bin/eslint.js --config .artifacts/p05-v2-layout-producer-resume01/eslint.config.mjs .artifacts/p05-v2-layout-producer-resume01 --format json --output-file [attempt output]','attempt':2,'exit_code':0},
    {'command':'node node_modules/eslint/bin/eslint.js --config .artifacts/p05-v2-layout-producer-resume01/eslint.config.mjs .artifacts/p05-v2-layout-producer-resume01 --format json --output-file .artifacts/p05-v2-layout-producer-resume01/lint-final.json','exit_code':0},
]})
report='''# P05 layout459 resume01 — author checkpoint\n\n**CODE_READY / INDEPENDENT_REVIEW_REQUIRED / ACTUAL_NOT_RUN.** This author cannot accept their own producer. Root ACK remains false. Content470 HOLD remains; no product changes, Docker/browser/selector execution, or full P05 acceptance occurred.\n\nThe new producer implements the previously unfinished layout pipeline: exact459 IDs/three engines/RU-EN-TR, seven actual V2 scenes and actual primary/secondary/observer roles,31 source-bound exact accepted METHOD12 helper AST texts plus exact observer03, actual private admission/advice/chat receipts and post-commit own-read floors, bounded sweeps, actual DOM measurements and Tab/focus/contrast/reduced-motion oracles, physical X11 native200/capture/reset, safety keyboard actions at native200 before reset, owned browser/display/runtime/container/network/volume cleanup,51-cell shard runner and nine-shard459 aggregate. No synthetic inert result is an actual layout PASS.\n\nMatrix, measurement thresholds and clocks remain strict. Original matrix/probe-policy/DOM-audit/X11/runtime bytes match the preceding producer. Whole-matrix PNG size/count/uniqueness fences were completed in aggregation. The new host runner requires actual durable independent review index bytes/hash/status/source and reviewed runtime digest before allocation/Docker; a separate root-controlled ACK remains mandatory.\n\nSource1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad/1813; imageff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4; build receipt2dae88a270c9a9a3fbc33386b09ae98585bebb49d6d26e1a3f6d95c8ddf443e5. Final source identity recomputed; all60 original prior-worktree top-level input hashes remain unchanged. Historical checkpoint54/inert28 is preserved; the current working producer had progressed beyond that snapshot, so this author completed its code rather than overwriting historical proof.\n\n139 finite author controls PASS:28 matrix-contract,57 scope/permissions/deadline/DOM/PNG/ACK guards,14 exact safety-keyboard VM,27 exact host-runner VM,13 additional AST/cold-source/byte-binding guards. Final22 syntax checks and ESLint exit0. These declared fake/static/VM/cold-import tests do not execute a real browser or Docker; the real host-runner ACKfalse negative test exits before allocation/Docker. Original lint FAIL retained, then unused choosePrivate extraction removed and actual readonly Node24 structuredClone declared without disabling no-undef. Remaining31 exact helper texts are hash-recorded.\n\nActual readiness is deliberately unclaimed: natural scene expiry, unsupported compositing/native control contrast, missing own-role controls, native keyboard/window failures, and any product accessibility problems must FAIL on execution. Current METHOD12 actual16 run is separately reported by root as7PASS/case08FAIL/remainingNOT_RUN; this author checkpoint does not overwrite that failure or claim to fix its action-consent transition. The source-bound extracted method remains exact; independent diagnosis and a new source/method revision may require re-binding this candidate before any RUN.\n\nNext: another agent independently reviews this exact packet and its code/oracles/resource/cleanup boundaries. Fix findings in a new explicit revision, rerun applicable controls, repeat independent review. Only after PASS may root fill ROOT_RUN_ACK with matching durable review/runtime/source/image and execute real shards. Full459 actual union, later final gate and human approval remain separate.\n'''
(OUT/'REPORT.md').write_text(report,encoding='utf-8')
files=[]
for path in sorted(OUT.rglob('*')):
    if path.is_file():
        files.append({'path':path.relative_to(OUT).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
save(OUT/'index.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'AUTHOR_CODE_READY_INDEPENDENT_REVIEW_REQUIRED','source_identity':identity(source),'included_files':len(source),'declared_cells':459,'actual_browser':'NOT_RUN','root_run_ack':False,'finite_author_controls':139,'files':files})
save(OUT/'HANDOFF.json',{'status':'AUTHOR_CODE_READY_INDEPENDENT_REVIEW_REQUIRED','writes':'COMPLETE','source_identity':identity(source),'included_files':len(source),'image':'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4','declared_cells':459,'index_sha256':sha(OUT/'index.json'),'files':len(files),'actual_run':False,'root_run_ack':False,'report_sha256':sha(OUT/'REPORT.md'),'next':'Other independent reviewer; also preserve root actualMETHOD12 case08 FAIL and diagnose separately before authorizing any layout RUN'})
print(json.dumps({'status':'AUTHOR_CODE_READY_INDEPENDENT_REVIEW_REQUIRED','index_sha256':sha(OUT/'index.json'),'handoff_sha256':sha(OUT/'HANDOFF.json'),'files':len(files),'finite_controls':139}))
