from pathlib import Path
import hashlib,json,datetime
o=Path(__file__).resolve().parent;assert not(o/'INDEX.json').exists();a=json.loads((o/'AUDIT.json').read_text())
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
d={'status':a['status'],'writes':'COMPLETE_STOP','source_identity':a['source_identity'],'included_files':1871,'actual_status':'FAIL','finding':'NATIVE_NODE_CONTROL_HELPER_UV_THREAD_CREATE_ASSERT_EXIT134','OS_cause':'UNRESOLVED','prospective_variant':'EXPLICIT_BROWSER_ONLY_PIDS256_REVIEW_AND_ACTUAL_REQUIRED','current128_PASS':False,'native_actions':0,'cleanup':a['cleanup'],'retained_owned_objects':7,'full_rollback_or_stage_PASS':False,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p)for p in sorted(o.rglob('*'))if p.is_file()and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8');print(json.dumps({'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(d['files']),'status':d['status']}))
