from pathlib import Path
import hashlib,json,sys
sys.path.insert(0,'tools');import stage_inventory
r=Path.cwd();p=r/'.docs/implementation/reviews/p05/topic-measurement-method-preparation-round05';work=r/'.artifacts/p05-method05-review-round01'
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest();read=lambda x:json.loads(x.read_text(encoding='utf-8'))
assert sha(p/'INDEX.json')=='f9124f6669057acf18e52ae283f8631fb957200174fa9069a61ef42c27984034'
index=read(p/'INDEX.json');assert len(index['files'])==61
for f in index['files']:
 q=p/f['path'];assert q.stat().st_size==f['bytes'] and sha(q)==f['sha256']
assert sha(p/'HANDOFF.json')=='5a1ccb35d960b60db3ae32e1523fac0d02601adaf9b37db4b2890b86b14f0d04'
assert sha(p/'GUARD_API.json')=='a6f2be5ce78052ffc190eaeb678f27f90b6600369dfffde6955ef67ca3cf3e31'
h=read(p/'HANDOFF.json');api=read(p/'GUARD_API.json')
for c in h['code']:
 assert sha(r/c['original_path'])==c['sha256'] and sha(p/c['snapshot_path'])==c['sha256']
for name,pin in api['files'].items():assert sha(r/api['base']/name)==pin
prior=r/'.docs/implementation/reviews/p05/topic-measurement-method-review-round04'
assert sha(prior/'INDEX.json')=='4bad21b906e9f7b8eb812415dcaf23773f017fd99e77ec49196e77461a944ebb'
assert sha(prior/'REPORT.md')=='4a52ad93caeb68074d8a669816b8c9ca1b44ef0f3986288e8ab237e823e26740'
inv=stage_inventory.inventory();assert len(inv)==1813 and stage_inventory.identity(inv)==h['source_context']['identity']
receipt=r/'.docs/implementation/evidence/p05/renewal-topic-browser-preflight-01/p05-renewal-image-build-receipt01.json';assert sha(receipt)==h['source_context']['receipt_sha256'];compiled=read(receipt)['host_compiled_files_sha256'];assert len(compiled)==64
for n,pin in compiled.items():assert sha(r/n)==pin
proposal=read(r/api['base']/'r100-v3-design-proposal.json')
assert sum(proposal['partitions_bytes'].values())==proposal['global_allocated_footprint_cap_bytes']==128*1024**2
assert proposal['reserve_bytes']==10*1024**3 and proposal['watchdog']['run_hardwall_ms']==300000
assert proposal['worker']['cpus']==1 and proposal['worker']['memory_mib']==1536
assert proposal['descriptor']=={'size':8,'mode':'truth_or_dare','context':'online','capability':'CHAT_ON','regime':'T6_TARGETED_CHANGES','rounds':100,'comfort':4,'class_profile':'F','seed_literal':'venus:P05-AUTHOR-FULL-CYCLE-CPU-1:N8:online:CHAT_ON:T6:TD:R100'}
launcher=(r/api['base']/'r100-v3-launcher.mjs').read_text(encoding='utf-8');guard=(r/api['base']/'host-output-guard.py').read_text(encoding='utf-8')
assert 'nativeInventory?Math.max(nativeInventory.logical_bytes,nativeInventory.allocated_bytes):20*MiB' in launcher
assert '+36*MiB' in launcher and 'parts.control_fully_reserved={logical_bytes:16*MiB,allocated_bytes:16*MiB' in launcher
assert 'unlinkSync(tarPath)'in launcher and 'NO_IMPLICIT_RERUN'in launcher and 'EXACT_METHOD05_LAUNCHER_REQUIRED'in launcher
assert "if seq!=self.counter:self.counter=seq;self.advanced=now"in guard and 'SUPERVISOR_INITIAL_ADVANCE_MISSING'in guard
result={'status':'CHANGES_REQUESTED','packet_children_verified':61,'source_code_snapshots_verified':len(h['code']),'guard_api_files_verified':len(api['files']),'host_compiled_files_verified':64,'source_identity':h['source_context']['identity'],'source_files':1813,'fixed_cap_bytes':128*1024**2,'reserve_bytes':10*1024**3,'worker_run_hardwall_ms':300000,'prior_report_verified':True,'Docker_calls':0,'prepare_calls':0,'R100_calls':0,'selector_calls':0,'statistics_RUN':False,'findings':[{'id':'P05-METHOD05-001','severity':'P2','title':'Cleanup compares truncated list IDs with full inspect IDs'}]}
(work/'audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
