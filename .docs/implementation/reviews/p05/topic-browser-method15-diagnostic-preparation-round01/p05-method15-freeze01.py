from pathlib import Path
import json,hashlib,datetime,sys,shutil
root=Path.cwd();sys.path.insert(0,str(root/'tools'))
from stage_inventory import inventory,identity
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=json.loads((root/'.artifacts/p05-renewal-freeze-context01.json').read_text(encoding='utf-8'))
current=inventory(); mismatches=[p for p,h in base['files'].items() if current.get(p)!=h];assert not mismatches,mismatches
work=root/'.artifacts/p05-private-batch-browser-producer15'
out=root/'.docs/implementation/reviews/p05/topic-browser-method15-diagnostic-preparation-round01';assert not out.exists();out.mkdir(parents=True)
def write(name,value):
 (out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
pins={p.name:sha(p) for p in work.iterdir() if p.is_file() and (p.suffix=='.mjs' or p.name=='DESIGN.md')}
for p in work.iterdir():
 if p.is_file():
  dest=out/'producer'/(p.name+'.bytes' if p.suffix=='.md' else p.name);dest.parent.mkdir(exist_ok=True);shutil.copyfile(p,dest)
for name in ['p05-method15-author01.py','p05-method15-freeze01.py','p05-method15-request-controls01.mjs','p05-method15-request-controls01.json','p05-method15-controls01.txt','p05-method15-lint01.txt']:
 shutil.copyfile(root/'.artifacts'/name,out/name)
write('source-qualification.json',{'historical_source_identity':base['identity'],'historical_included_files':len(base['files']),'historical_subset_changed_or_removed':mismatches,'current_identity_snapshot':identity(current),'current_included_files':len(current),'added_files':sorted(set(current)-set(base['files'])),'qualification':'CONCURRENT_P04_WRITES_NOT_A_SOURCE_FREEZE_NO_ACTUAL_RUN_BINDING'})
(out/'REPORT.md').write_text('# METHOD15 — correlate rejected-response diagnostics\n\nAUTHOR_READY_METHOD_ONLY / independent review required / NOT_RUN. Corrects METHOD14-R01-001 from immutable independent review6cf87fd7. Both observed request UUID validity and response request UUID equality are checked before offer/error metadata projection. Missing, malformed or mismatched correlation sets an explicit unavailable/mismatch flag, records no domain code and throws. Status200 and successful receipt UUID/schema/revision remain mandatory. Browser bytes remain exact METHOD13; no click retry, timeout/seed/TTL/product change.\n\n30 finite fake-event controls PASS, including5 new non200 UUID negative cases; syntax2/2 and lint exit0. No actual HTTP/browser proof or explanation of prior409 is claimed. Existing source1274 is only the unchanged historical1813-file subset; parallel P04-r3 additions drift current whole-tree identity, recorded separately. Actual execution requires a new qualified runtime/image binding after Docker recovery. Inherited run.mjs is not an authorized entrypoint. Original FAILs, human content HOLD and P06 restriction persist.\n',encoding='utf-8',newline='\n')
write('HANDOFF.json',{'status':'AUTHOR_READY_METHOD_ONLY_REVIEW_REQUIRED_NOT_RUN','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'writes':'COMPLETE','root_run_ack':False,'actual_browser_run':'NOT_RUN','source_identity':base['identity'],'source_qualification':'UNCHANGED_HISTORICAL_SUBSET_ONLY_CONCURRENT_ADDITIONS','image':'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4','image_availability':'NOT_CONFIRMED_AFTER_EXTERNAL_PRUNE','runtime_pins':pins,'previous_review_index_sha256':'6cf87fd792fdd95423a1665028310ac68cef32d76e1908df8147f8aadfdfe572','author_finite_controls':30,'whole_stage':'NOT_ACCEPTED'})
write('INDEX.json',{'status':'AUTHOR_READY_METHOD_ONLY_REVIEW_REQUIRED_NOT_RUN','files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]})
print(json.dumps({'index_sha256':sha(out/'INDEX.json'),'files':len(json.loads((out/'INDEX.json').read_text())['files']),'handoff_sha256':sha(out/'HANDOFF.json')}))
