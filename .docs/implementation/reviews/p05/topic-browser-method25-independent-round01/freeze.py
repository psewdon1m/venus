from pathlib import Path
import json,hashlib,datetime
o=Path(__file__).parent;r=Path('C:/.projects/venus');sha=lambda b:hashlib.sha256(b).hexdigest()
pins=json.loads((o/'INPUT_PINS.json').read_text())
for path,pin in pins.items():
 b=(r/path).read_bytes();assert sha(b)==pin['sha256'] and len(b)==pin['bytes'],path
a=json.loads((o/'AUDIT.json').read_text())
h={k:a[k] for k in ['status','functional_method_status','source_identity','included_files','image','runtime_count','runtime_pins','runtime_digest','wrapper','pending_ACK','findings','author_index_sha256','source_binding_review_sha256','native_actions','APP_edits','producer_edits','ACK_edits','actual_browser_PASS','stage_PASS']}
h.update(writes='COMPLETE_STOP',shared_condition_preparation_ms=8000,audit_exit=0,repeated_author_controls=6,author_controls_exit=0,own_actual_helper_negatives=4,own_controls_exit=0,layout_prerequisite='HOLD_UNTIL_NEW_NATIVE_PASS',current_source_binding_status='PASS_STATIC_BINDING_ONLY_UNCHANGED_A18_IMAGE',actual24_failure_retained=True)
(o/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n')
index={**h,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(json.dumps({'INDEX_sha256':sha(b),'children':len(index['files']),'runtime_digest':a['runtime_digest'],'status':index['status']}))
