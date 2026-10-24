import datetime
import hashlib
import json
from pathlib import Path
O=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
save('commands.json',{'entries':[{'command':'node .../controls.mjs','exit_code':0,'controls_pass':13,'prior_counterexample':'CLOSED'}, {'command':'python .../verify.py','exit_code':0,'scope':'23authorhashes/9runtimepins/historical1813unchanged+currentdriftsnapshot'}, {'command':'node .../author-rerun.mjs','exit_code':0,'controls_pass':30}], 'Docker_calls':0,'browser_calls':0,'source_or_producer_edits':False,'initial_read_attempts':'Missing guessed raw folder; corrected by actual packet inventory before final verification'})
files=[{'path':p.relative_to(O).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(O.rglob('*'))if p.is_file() and p.name not in {'INDEX.json','HANDOFF.json'}]
i=json.loads((O/'inputs.json').read_text(encoding='utf-8'))
save('INDEX.json',{'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_METHOD_ONLY','scope':'DIAGNOSTIC_ONLY_NO_FUNCTIONAL_FIX_OR_CAUSE_CLAIM','source_identity':i['source_identity'],'source_qualification':'UNCHANGED_HISTORICAL1813_SUBSET_ONLY_CONCURRENT_ADDITIONS','current_source_inventory_snapshot':i['current_source_inventory_snapshot'],'author_INDEX_sha256':i['author_INDEX_sha256'],'runtime_pins':i['runtime_pins'],'controls_pass':43,'prior_finding':'METHOD14-R01-001_CLOSED','actual_run':False,'files':files})
save('HANDOFF.json',{'status':'PASS_METHOD_ONLY','writes':'COMPLETE','scope':'DIAGNOSTIC_ONLY','INDEX_sha256':sha(O/'INDEX.json'),'REPORT_sha256':sha(O/'REPORT.md'),'files':len(files),'METHOD14_R01_001':'CLOSED','actual409cause':'UNRECORDED_UNCHANGED','next':'Root exact operational rebind after parallel writers/image recovery; bounded actual diagnostic repeat only then'})
print(json.dumps({'status':'PASS_METHOD_ONLY','INDEX_sha256':sha(O/'INDEX.json'),'HANDOFF_sha256':sha(O/'HANDOFF.json'),'files':len(files)}))
