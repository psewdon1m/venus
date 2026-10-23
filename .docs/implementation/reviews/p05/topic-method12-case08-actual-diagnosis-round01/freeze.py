import datetime
import hashlib
import json
from pathlib import Path

OUT=Path(__file__).resolve().parent
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,v):
    (OUT/name).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
save('commands.json',{'entries':[
    {'command':'.venv/Scripts/python.exe .docs/implementation/reviews/p05/topic-method12-case08-actual-diagnosis-round01/analyse.py','attempt':1,'exit_code':1,'cause':'Reviewer Windows default cp1252 decode of UTF-8 evidence; preserved script'},
    {'command':'.venv/Scripts/python.exe .docs/implementation/reviews/p05/topic-method12-case08-actual-diagnosis-round01/analyse.py','attempt':2,'exit_code':0,'checks':'45 evidence hashes/sizes, unchanged1813 inventory, six source pins, eight-case states and exact action dispatch count'},
    {'command':'node .docs/implementation/reviews/p05/topic-method12-case08-actual-diagnosis-round01/source-controls.mjs','attempt':1,'exit_code':1,'cause':'Own probe omitted explicitly inert DB AAD external binding'},
    {'command':'node .docs/implementation/reviews/p05/topic-method12-case08-actual-diagnosis-round01/source-controls.mjs','attempt':2,'exit_code':1,'cause':'Own probe omitted real crypto randomUUID binding'},
    {'command':'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/topic-method12-case08-actual-diagnosis-round01/source-controls.mjs','attempt':3,'exit_code':0,'checks':8},
], 'docker':'NOT_RUN','browser':'NOT_RUN','product_edits':False,'producer_edits':False,'image_inspection':'Existing masked EN failure screenshot viewed; no browser interaction'})
files=[]
for path in sorted(OUT.rglob('*')):
    if path.is_file() and path.name not in {'INDEX.json','HANDOFF.json'}:
        files.append({'path':path.relative_to(OUT).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
save('INDEX.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'DIAGNOSIS_CONFIRMED_PRODUCER_PENDING_ACTION_BUDGET_EXHAUSTED','source_identity':'1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad','input_evidence_index_sha256':'bacb33c162d316a2ae7b495a3b2196c1f6f67e32f7840af845286ddc9b24c955','original_actual_result':'7PASS_08FAIL_8NOTRUN_CLEANUP_PASS_UNCHANGED','source_controls_pass':8,'new_functional_run':False,'full_stage_acceptance':False,'files':files})
save('HANDOFF.json',{'status':'DIAGNOSIS_CONFIRMED_PRODUCER_FIX_RECOMMENDED','writes':'COMPLETE','INDEX_sha256':sha(OUT/'INDEX.json'),'files':len(files),'REPORT_sha256':sha(OUT/'REPORT.md'),'source_identity':'1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad','product_fix_required_by_this_evidence':False,'next':'Root authorize METHOD13 minimal positive-action preparation derivative; separate independent review and new actual run. Preserve original FAIL and all TTL/seed/negative assertions.'})
print(json.dumps({'status':'DIAGNOSIS_CONFIRMED','INDEX_sha256':sha(OUT/'INDEX.json'),'HANDOFF_sha256':sha(OUT/'HANDOFF.json'),'REPORT_sha256':sha(OUT/'REPORT.md'),'files':len(files)}))
