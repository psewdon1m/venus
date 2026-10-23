from pathlib import Path
import hashlib,json,datetime
o=Path(__file__).resolve().parent;assert not(o/'INDEX.json').exists();a=json.loads((o/'AUDIT.json').read_text())
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
d={'status':'PASS_METHOD_ONLY','writes':'COMPLETE_STOP','source_identity':a['source_identity'],'included_files':1871,'images':a['images'],'resource_profile':a['resource_profile'],'PID_limits':a['PID_limits'],'producer_index_sha256':a['producer_index']['sha256'],'author_index_sha256':a['author_index']['sha256'],'findings':[],'native_actions':0,'old128_attempt_PASS':False,'new_profile_actual_PASS':False,'full_rollback_or_stage_PASS':False,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p)for p in sorted(o.rglob('*'))if p.is_file()and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8');print(json.dumps({'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(d['files']),'status':d['status']}))
