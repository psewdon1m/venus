import datetime
import hashlib
import json
from pathlib import Path
O=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
save('commands.json',{'commands':[{'command':'.venv/Scripts/python.exe .../topic-browser-method13-independent-review-round01/verify.py','exit_code':0,'checks':'22 author file hashes,9runtime pins,source1274/1813'}, {'command':'node .../author-rerun.mjs','exit_code':0,'checks':16}, {'command':'node .../controls.mjs','attempt':1,'exit_code':1,'cause':'Reviewer import depth before tests; preserved'}, {'command':'node .../controls.mjs','attempt':2,'exit_code':0,'checks':8}], 'functional_run':False})
files=[{'path':p.relative_to(O).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(O.rglob('*')) if p.is_file() and p.name not in {'INDEX.json','HANDOFF.json'}]
inputs=json.loads((O/'inputs.json').read_text(encoding='utf-8'))
save('INDEX.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_METHOD_ONLY','source_identity':inputs['source_identity'],'included_files':1813,'image':inputs['image'],'author_index_sha256':inputs['author_INDEX_sha256'],'runtime_pins':inputs['runtime_pins'],'finite_controls':{'repeated_author':16,'independent_additional':8},'actual_run':False,'full_stage_acceptance':False,'files':files})
save('HANDOFF.json',{'status':'PASS_METHOD_ONLY','writes':'COMPLETE','INDEX_sha256':sha(O/'INDEX.json'),'REPORT_sha256':sha(O/'REPORT.md'),'files':len(files),'actual_browser':'NOT_RUN','next':'Root exactMETHOD13 outer binding and newactual16; preserve METHOD12FAIL/contentHOLD'})
print(json.dumps({'status':'PASS_METHOD_ONLY','INDEX_sha256':sha(O/'INDEX.json'),'HANDOFF_sha256':sha(O/'HANDOFF.json'),'files':len(files)}))
