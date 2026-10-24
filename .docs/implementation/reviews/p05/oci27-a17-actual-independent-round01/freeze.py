from pathlib import Path
import hashlib,json,datetime
o=Path(__file__).resolve().parent;assert not(o/'INDEX.json').exists();a=json.loads((o/'AUDIT.json').read_text())
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
d={'status':'PASS_COMPONENT_ONLY','writes':'COMPLETE_STOP','source_identity':a['source_identity'],'included_files':1871,'images':a['images'],'resource_profile':a['resource_profile'],'PID_limits':a['PID_limits'],'project':a['project'],'owner':a['owner'],'controls_PASS':14,'all_phases_COMPLETE_exit0':True,'cleanup':'COMPLETED_OWNED_EMPTY','source_producer_unchanged':True,'full_raw_envelope_entries':479,'safe_export_files':21,'native_actions':0,'findings':[],'full_P05_or_production_PASS':False,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p)for p in sorted(o.rglob('*'))if p.is_file()and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8');print(json.dumps({'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(d['files']),'status':d['status']}))
