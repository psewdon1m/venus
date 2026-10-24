from pathlib import Path
import hashlib,json
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;P=ROOT/'.artifacts/p05-topic-statistics-resume02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
index=ROOT/'.docs/implementation/reviews/p05/topic-statistics-author-resume02/INDEX.json';assert sha(index)=='576148902c6cf09947f80364caee3d00dc7e06824d9799465ebbf8900be81ba4'
d=json.loads(index.read_text())
for row in d['files']:
 p=index.parent/row['path'];assert sha(p)==row['sha256'] and p.stat().st_size==row['bytes']
handoff=json.loads((index.parent/'HANDOFF.json').read_text());assert sha(index.parent/'HANDOFF.json')=='d927366efa922134b45350bb585cec9543e872faad498780f8ad3c091e93af93'
assert handoff['actual_runtime84_RUN'] is False and handoff['full_statistical_RUN'] is False and handoff['full_P05_PASS'] is False
# Every working source file must have an exact byte copy in the durable packet.
mirrors=[]
for p in P.iterdir():
 if p.is_file():
  matches=[row['path'] for row in d['files'] if row['sha256']==sha(p)]
  assert matches,p.name;mirrors.append({'path':p.name,'sha256':sha(p),'durable_copies':matches})
f=json.loads((P/'FEASIBILITY.json').read_text());assert f['status']=='FEASIBILITY_UNPROVEN_FULL_RUN_NOT_AUTHORIZED';assert 'neither ETA nor lower/upper bound' in f['interpretation']
for k in ['path','inventory_path']:
 p=ROOT/f['actual_single_profile_diagnostic'][k];h=f['actual_single_profile_diagnostic']['sha256' if k=='path' else 'inventory_sha256'];assert sha(p)==h
workload=ROOT/'.artifacts/p05-topic-measurements/workload.mjs';protocol=(P/'protocol.mjs').read_text();assert "from '../p05-topic-measurements/workload.mjs'" in protocol
assert sha(workload)==sha(index.parent/'dependency-source/.artifacts/p05-topic-measurements/workload.mjs.bytes')=='05e87a4cb24c553bebabc4e48c428b9aacb75aa9820c76cd060773795a505fa4'
parent=ROOT/'.docs/implementation/reviews/p05/topic-statistics-author-resume01/INDEX.json';assert sha(parent)=='5b263330f76e6119b1dd765426704d97d4b1d4ab12a7bddc3de1ce91367d549b'
for n in ['consumers.mjs','inference.mjs','protocol.mjs']:assert sha(P/n)==sha(parent.parent/'exact-author-source'/(n+'.bytes'))
assert sha(P/'allocated-tree07.py')=='7adcdaf51b40191ee5abf76def60292aa4a49364a62721968c68cd0ef7ebb4de'
result={'status':'PASS_FROZEN_WIP_INPUTS_ONLY','author_index_children':len(d['files']),'working_files':mirrors,'workload_sha256':sha(workload),'fixed_workload_imported_not_replaced':True,'historical_single_profile_pins_verified':True,'actual_run':False,'current_source_acceptance':False}
(OUT/'inputs-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'author_children':len(d['files']),'working_files':len(mirrors)}))
