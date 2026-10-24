from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();a=json.loads((p/'AUDIT.json').read_text())
attempts=[{'script':'audit-initial-card-uuid-assumption.mjs.txt','exit':1,'reason':'Reviewer assumed canonical card IDs were UUIDs; actual TD-1016 is valid catalog ID. Corrected to canonical bundle membership/revision/context plus20distinct IDs.'},{'script':'audit-second-operator-map-assumption.mjs.txt','exit':1,'reason':'Reviewer assumed operator.files array; actual16-entry map. Corrected shape handling; every pin still strictly verified.'},{'script':'audit.mjs','exit':0,'reason':'All corrected saved-actual checks pass. No producer, native or APP change.'}]
(p/'ATTEMPTS.json').write_text(json.dumps(attempts,indent=2)+'\n',encoding='utf-8')
h={k:a[k] for k in ['status','source_identity','git_commit','image','profiles','completed_rounds','finishes','skips','requests','WS_connections','rooms_created_closed','cohorts']}
h.update({'writes':'COMPLETE_STOP','findings':[],'own_audit_exit':0,'retained_round_request_UUID_lists':False,'retained_raw_HTTP_receipt_bodies':False,'new_native_actions':0,'APP_ACK_method_edits':False,'full42_PASS':False,'stage_PASS':False})
(p/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files={f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.rglob('*')) if f.is_file() and f.name!='INDEX.json'}
i={k:h[k] for k in ['status','writes','source_identity','git_commit','image','profiles','completed_rounds','finishes','skips','findings','new_native_actions','full42_PASS','stage_PASS']};i.update(created_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=files)
b=(json.dumps(i,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b);print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
