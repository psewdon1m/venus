from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();a=json.loads((p/'AUDIT.json').read_text())
attempts=[{'script':'audit-initial-log-count-assumption.py.txt','exit':1,'reason':'Substring counted final PASS summary alongside16casePASS events; corrected to parse caseIDs and finalsummary separately.'},{'script':'audit.py','exit':0,'reason':'All saved actual/source/method/cleanup and corrected log checks pass; no native mutation.'}]
(p/'ATTEMPTS.json').write_text(json.dumps(attempts,indent=2)+'\n',encoding='utf-8')
h={k:a[k] for k in ['status','source_identity','included_files','image','ACK','method_review','records','PASS','cleanup','case09','diagnostics']}
h.update({'writes':'COMPLETE_STOP','findings':[],'own_audit_exit':0,'synthetic_fixture_only':True,'native_actions':0,'APP_method_ACK_edits':False,'current_functional16_prerequisite':'PASS_EXACT_A17_CHROMIUM_COMPONENT','full_layout_or_stage_PASS':False})
(p/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files={f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.rglob('*')) if f.is_file() and f.name!='INDEX.json'}
i={k:h[k] for k in ['status','writes','source_identity','included_files','image','records','PASS','cleanup','findings','native_actions','current_functional16_prerequisite','full_layout_or_stage_PASS']};i.update(created_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=files)
b=(json.dumps(i,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b);print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
