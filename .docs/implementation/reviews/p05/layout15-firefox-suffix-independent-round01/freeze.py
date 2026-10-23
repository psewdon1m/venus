from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
handoff={'status':'PASS_METHOD_ONLY','writes':'COMPLETE_STOP','source_identity':'c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13','included_files':1870,
 'image':'sha256:b3ff0e81571977b5950cb8dd97d2c9a2bfb2ec70c65da25b5fee914b67ce765f',
 'producer_runtime_digest':'3d3ad6ca89ec9a20451fa5ea628d1c96cc770a73680b55fb5b6e0e5237b9a090',
 'author_index_sha256':'d99151f0ac9720797389b6294948319a74546a38fed4b71e4428bb896a8b6997',
 'findings':[],'scope':'Measured Firefox suffix adapter only; original459/bounds/focus exact14.',
 'WebKit':'UNRESOLVED_NO_SUFFIX_OR_NATIVE_PASS_GRANTED','Firefox_native_search_focus':'NOT_PROVED',
 'calibration_worker_exit':1,'native_layout_RUN':False,'future_binding':'A17 rebind required','active_ACK_edits':False,
 'validation':{'audit_exit':0,'author_focused_controls':4,'author_focused_exit':0,'own_negatives':3,'own_final_exit':0,'own_initial_inventory_fixture_exit':1}}
(p/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files={f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.iterdir()) if f.is_file() and f.name!='INDEX.json'}
index={k:handoff[k] for k in ['status','writes','source_identity','included_files','image','producer_runtime_digest','findings','WebKit','Firefox_native_search_focus']}
index.update({'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'native_layout_PASS':False,'stage_PASS':False,'files':files})
b=(json.dumps(index,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b)
print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
