import datetime
import hashlib
import json
from pathlib import Path
O=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
save('commands.json',{'entries':[{'command':'node .../controls.mjs','exit_code':0,'controls_pass':8,'confirmed_P2_counterexamples':1}, {'command':'python .../verify.py','attempt':1,'exit_code':1,'cause':'Correct refusal of whole-tree1274 claim after concurrent additions'}, {'command':'node .../author-rerun.mjs','attempt':1,'exit_code':1,'cause':'Dependent rerun tried before adapted script existed; preserved note'}, {'command':'python .../verify.py','attempt':2,'exit_code':0,'scope':'23file hashes/9pins/historical1813 unchanged subset + current drift captured'}, {'command':'node .../author-rerun.mjs','attempt':2,'exit_code':0,'controls':25}], 'functional_run':False,'Docker_calls':0,'producer_edits':False,'product_edits':False})
files=[{'path':p.relative_to(O).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(O.rglob('*')) if p.is_file() and p.name not in {'INDEX.json','HANDOFF.json'}]
inputs=json.loads((O/'inputs.json').read_text(encoding='utf-8'))
save('INDEX.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'CHANGES_REQUIRED_METHOD_ONLY','source_identity':inputs['source_identity'],'source_scope':'HISTORICAL1813_UNCHANGED_SUBSET_CURRENT_TREE_HAS_CONCURRENT_ADDITIONS','current_source_inventory_snapshot':inputs['current_source_inventory_snapshot'],'author_INDEX_sha256':inputs['author_INDEX_sha256'],'runtime_pins':inputs['runtime_pins'],'controls_pass':33,'confirmed_P2':1,'actual_run':False,'files':files})
save('HANDOFF.json',{'status':'CHANGES_REQUIRED_METHOD_ONLY','writes':'COMPLETE','INDEX_sha256':sha(O/'INDEX.json'),'REPORT_sha256':sha(O/'REPORT.md'),'files':len(files),'finding':'METHOD14-R01-001','next':'New immutable diagnostic revision: validate observed/response UUID correlation before non200codeprojection; then independent repeat. No actual409cause/functionalPASS claimed.'})
print(json.dumps({'status':'CHANGES_REQUIRED_METHOD_ONLY','INDEX_sha256':sha(O/'INDEX.json'),'HANDOFF_sha256':sha(O/'HANDOFF.json'),'files':len(files)}))
