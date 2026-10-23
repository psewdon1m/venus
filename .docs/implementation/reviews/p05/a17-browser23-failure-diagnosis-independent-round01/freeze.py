from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();a=json.loads((p/'AUDIT.json').read_text())
h={'status':'DIAGNOSIS_COMPLETE_NATIVE_FAIL_RETAINED','writes':'COMPLETE_STOP','source_identity':a['source_identity'],'image':a['image'],'counts':a['counts'],'cleanup':a['cleanup'],
 'finding':{'priority':'P2','scope':'METHOD_PREPARATION','code':'MISSING_SECONDARY_POST_CONSENT_MIN_REV_BARRIER','confirmed':True},
 'exact_sent_expected_rev':'NOT_RETAINED','exact_409_code':'UNLISTED_NOT_RETAINED','REVISION_CONFLICT':'SOURCE_INFERENCE_ONLY','APP_defect':'NOT_PROVED',
 'recommendation':a['recommendation'],'native_actions':0,'APP_edits':False,'method_edits':False,'ACK_edits':False,'own_audit_exit':0,'browser_PASS':False,'layout_prerequisite':'HOLD','stage_PASS':False}
(p/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files={f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.rglob('*')) if f.is_file() and f.name!='INDEX.json'}
idx={k:h[k] for k in ['status','writes','source_identity','image','counts','finding','APP_defect','browser_PASS','layout_prerequisite','stage_PASS']};idx.update(created_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=files)
b=(json.dumps(idx,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b);print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
