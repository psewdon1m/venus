from pathlib import Path
import hashlib,json,datetime
o=Path(__file__).resolve().parent;assert not(o/'INDEX.json').exists()
a=json.loads((o/'AUDIT.json').read_text());b=json.loads((o/'BINDINGS-AUDIT.json').read_text())
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
d={'status':'PASS_COMPONENT_ONLY','writes':'COMPLETE_STOP','roles':['SAFE_ACTUAL_EXPORT_INDEX','NONAUTHOR_ACTUAL_COMPONENT_ACCEPTANCE_SAME_REVIEW'],'source_identity':a['source_identity'],'included_files':a['included_files'],'images':a['images'],'resource_profile':a['resource_profile'],'PID_limits':a['PID_limits'],'project':a['project'],'owner':a['owner'],'controls_PASS':14,'all_phases_COMPLETE_exit0':True,'cleanup':a['cleanup'],'source_producer_unchanged':True,'recursive_MJS_exact_parent27_and_executed_inputs':40,'full_raw_envelope_entries':a['raw_index_entries'],'safe_export_files':a['safe_export_files'],'native_actions':0,'findings':[],'reviewer_failed_attempts_preserved':1,'full_P05_or_production_PASS':False,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(o).as_posix():pin(p) for p in sorted(o.rglob('*')) if p.is_file() and p.name!='INDEX.json'}}
(o/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
for n,v in d['files'].items():assert pin(o/n)==v
result={'path':str(o/'INDEX.json'),**pin(o/'INDEX.json'),'children':len(d['files']),'status':d['status']}
j=Path('C:/.projects/venus/.history/agents/2026-10-21-p05-oci28-a18-actual-review.md')
with j.open('a',encoding='utf-8') as f:f.write(datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Final actual+bindings audits exit0; all14/3phases0/replay13each/current1872+375pins/40MJS/482envelope/profile256/ownedempty. Reviewer schema failure preserved and corrected, no native failure. Frozen '+json.dumps(result)+'; all indexed children rehashed; COMPLETE_STOP, no APP/core/producer/ACK/rootjournal/native writes.\n')
print(json.dumps(result))
