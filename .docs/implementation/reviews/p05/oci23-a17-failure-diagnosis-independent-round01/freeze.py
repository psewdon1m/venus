from pathlib import Path
import json,hashlib,datetime
o=Path(__file__).resolve().parent
assert not (o/'INDEX.json').exists()
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
index={'status':'DIAGNOSIS_COMPLETE_OCI23_ACTUAL_FAIL_RETAINED','writes':'COMPLETE_STOP','source_identity':'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d','included_files':1871,'actual_status':'FAIL','phase_status':{'A1':'PHASE_COMPLETE','B2':'PHASE_COMPLETE','A3':'FAIL'},'finding':'P2_FIXTURE_E_SELECTED_WS_CONFLICT_WITH_UNTOUCHED_PREBOOT_ACTIVE_ORACLE','cause_qualification':'PINNED_SOURCE_INFERENCE_EXACT_NATIVE_STATE_NOT_EXPORTED','cleanup':'RETAINED_MANUAL_CLEANUP_REQUIRED','retained_owned_objects':7,'native_actions':0,'full_rollback_or_stage_PASS':False,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p) for p in sorted(o.rglob('*')) if p.is_file() and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(index['files']),'status':index['status']}))
