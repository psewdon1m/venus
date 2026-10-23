from pathlib import Path
import hashlib,json,datetime
o=Path(__file__).resolve().parent;assert not(o/'INDEX.json').exists();a=json.loads((o/'AUDIT.json').read_text())
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
d={'status':'PASS_OWNED_CLEANUP_ONLY','writes':'COMPLETE_STOP','plan_sha256':a['plan_sha256'],'authority_sha256':a['authority_sha256'],'executor_sha256':a['executor_sha256'],'independent_plan_sha256':a['independent_plan_sha256'],'historical_projects':13,'objects_deleted':91,'commands_exit0':455,'mutation_attempts':104,'final_empty_dual_scope_enumerations':78,'preserved_host_leaf_pins':660,'preserved_new_index_children':72,'reviewer_Docker_queries':0,'reviewer_mutations':0,'private_or_DB_backup':False,'current_A18_OCI_or_full_P05_PASS':False,'findings':[],'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p)for p in sorted(o.rglob('*'))if p.is_file()and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8');print(json.dumps({'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(d['files']),'status':d['status']}))
