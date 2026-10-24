import datetime
import hashlib
import json
from pathlib import Path
O=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
save('commands.json',{'entries':[{'command':'.venv/Scripts/python.exe .../analyse.py','exit_code':0,'checks':'45 hashes,1813 before/after,sourcepins,real409 beforedeadline and noactionhelper'}, {'command':'node .../controls.mjs','attempt':1,'exit_code':1,'cause':'Reviewer VM omitted Buffer; preserved'}, {'command':'node .../controls.mjs','attempt':2,'exit_code':0,'checks':6}], 'actual_functional_run':False,'product_or_producer_edits':False,'screenshot_viewed':'Existing masked chromium-ru-failure.png only'})
files=[{'path':p.relative_to(O).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(O.rglob('*'))if p.is_file() and p.name not in {'INDEX.json','HANDOFF.json'}]
save('INDEX.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'CONFIRMED_CAPTURE_GAP_EXACT_DOMAIN_CAUSE_UNRESOLVED','source_identity':'1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad','input_evidence_INDEX_sha256':'187945e028eff2c479ab8ecec4f9798f41119d2818c62d80347792aad8af44ee','actual_result':'7PASS_08FAIL_8NOTRUN_CLEANUP_PASS_UNCHANGED','finite_controls_pass':6,'new_functional_run':False,'files':files})
save('HANDOFF.json',{'status':'DIAGNOSTIC_INSTRUMENTATION_AND_BOUNDED_REPEAT_RECOMMENDED','writes':'COMPLETE','INDEX_sha256':sha(O/'INDEX.json'),'REPORT_sha256':sha(O/'REPORT.md'),'files':len(files),'actual_domain_code':None,'domain_code_observed':False,'product_fix_determined':False,'next':'Root new tiny allowlisted diagnostics derivative, independent review, one bounded actual repeat; preserve409/TTL/seed/assertions'})
print(json.dumps({'status':'CAPTURE_GAP_CONFIRMED_DOMAIN_CAUSE_UNRESOLVED','INDEX_sha256':sha(O/'INDEX.json'),'HANDOFF_sha256':sha(O/'HANDOFF.json'),'files':len(files)}))
