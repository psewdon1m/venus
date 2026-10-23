from pathlib import Path
import json,hashlib,datetime
o=Path(__file__).parent;r=Path('C:/.projects/venus');sha=lambda b:hashlib.sha256(b).hexdigest()
for path,pin in json.loads((o/'INPUT_PINS.json').read_text()).items():
 b=(r/path).read_bytes();assert sha(b)==pin['sha256'] and len(b)==pin['bytes'],path
a=json.loads((o/'AUDIT.json').read_text());control=json.loads((o/'independent-controls.stdout.txt').read_bytes());assert control['controls']==a['own_actual_helper_combinations']==5
h={k:a[k] for k in ['status','functional_method_status','source_identity','included_files','image','runtime_count','runtime_pins','runtime_digest','wrapper','pending_ACK','author_index_sha256','source_binding_review_sha256','findings','native_actions','APP_edits','producer_edits','ACK_edits','actual_browser_PASS','stage_PASS','JSON_parse_helper_fail_fast_preserved','unaccounted_JSON_parse_terminal_guard_preserved']}
h.update(writes='COMPLETE_STOP',shared_condition_preparation_ms=8000,audit_exit=0,repeated_author_controls=7,author_controls_exit=0,own_actual_helper_negatives=5,own_controls_exit=0,layout_prerequisite='HOLD_UNTIL_NEW_NATIVE_PASS',current_source_binding_status='PASS_STATIC_BINDING_ONLY_UNCHANGED_A18_IMAGE',prior_actual_failures_retained=True)
(o/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n');index={**h,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(json.dumps({'INDEX_sha256':sha(b),'children':len(index['files']),'status':index['status'],'runtime_digest':index['runtime_digest']}))
