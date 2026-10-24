from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();a=json.loads((p/'AUDIT.json').read_text())
h={k:a[k] for k in ['status','runtime_count','runtime_pins','runtime_digest','wrapper','pending_ACK','source_identity','included_files','image','shared_condition_preparation_ms']}
h.update({'functional_method_status':'PASS','writes':'COMPLETE_STOP','findings':[],'author_index_sha256':'98f0b021ad18c0d90873432e2a2a304a7d164c0e30dba4d36e6a3a0d1bd98c42','source_binding_review_sha256':a['source_binding_review_sha256'],'audit_exit':0,'repeated_author_controls':8,'author_controls_exit':0,'own_actual_helper_negatives':4,'own_controls_exit':0,'native_actions':0,'APP_edits':False,'producer_edits':False,'ACK_edits':False,'actual_browser_PASS':False,'layout_prerequisite':'HOLD_UNTIL_NEW_NATIVE_PASS','stage_PASS':False})
(p/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files={f.name:{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.iterdir()) if f.is_file() and f.name!='INDEX.json'}
i={k:h[k] for k in ['status','functional_method_status','writes','source_identity','included_files','image','runtime_count','runtime_digest','wrapper','pending_ACK','findings','native_actions','actual_browser_PASS','layout_prerequisite','stage_PASS']}
i.update(created_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=files)
b=(json.dumps(i,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b);print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
