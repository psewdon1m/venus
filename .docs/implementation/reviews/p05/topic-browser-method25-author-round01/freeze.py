from pathlib import Path
import json,hashlib,datetime
r=Path('C:/.projects/venus');o=Path(__file__).parent;c=r/'.artifacts/p05-private-batch-browser-producer25';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
pins={x.name:sha(x) for x in sorted(c.glob('*.mjs'))};digest=hashlib.sha256(('\n'.join(n+' '+h for n,h in sorted(pins.items()))+'\n').encode()).hexdigest()
runtime=read(o/'RUNTIME.json');assert runtime['runtime_pins']==pins and len(pins)==9
runtime.update(runtime_digest=digest,runtime_digest_algorithm='SHA256(sorted name + space + sha256 + newline records; same convention as method24)');(o/'RUNTIME.json').write_text(json.dumps(runtime,indent=2)+'\n',encoding='utf8')
wrapper=r/'.artifacts/p05-browser25-a18-run01.mjs';pending=r/'.artifacts/p05-browser25-a18-root-ack01.pending.json';ack=read(pending);assert sha(wrapper)==runtime['wrapper_sha256'] and sha(pending)==runtime['pending_ACK_sha256'] and ack['runtime_pins']==pins and ack['status']=='NOT_AUTHORIZED'
assert not (r/'.artifacts/p05-browser25-a18-root-ack01.json').exists()
# Freeze a small exact runtime snapshot, not historic archives or unrelated controls.
snapshot=o/'runtime';snapshot.mkdir()
for n in pins:(snapshot/n).write_bytes((c/n).read_bytes())
(o/'p05-browser25-a18-run01.mjs').write_bytes(wrapper.read_bytes());(o/'p05-browser25-a18-root-ack01.pending.json').write_bytes(pending.read_bytes())
index={'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NOT_NATIVE','writes':'COMPLETE_STOP','source_identity':ack['source_identity'],'included_files':ack['source_files'],'image':ack['image'],'runtime_count':9,'runtime_digest':digest,'runtime_pins':pins,'wrapper':{'path':wrapper.relative_to(r).as_posix(),'sha256':sha(wrapper)},'pending_ACK':{'path':pending.relative_to(r).as_posix(),'sha256':sha(pending)},'changed_runtime':['browser.mjs coherentGame only'],'other8_MJS_raw_exact24':True,'all16_case_bodies_raw_exact24':True,'timeout_ms':8000,'intervals_ms':[50,100,250],'finite_controls':6,'checks_exit':0,'syntax_checks':3,'lint_exit':0,'diagnosis_index_sha256':'44bd3ddc93645dbf8c4fcc7a3d30c88b33a9fc20841ba61b2fd39e2911de93ac','APP_edits':False,'native_actions':0,'active_ACK':False,'actual_browser_PASS':False,'stage_PASS':False,'required_next':'Nonauthor exact method/current binding review; root authorizes ONE fresh actual. Existing24 failure remains retained.'}
(o/'HANDOFF.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf8')
index['created_at_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat();index['files']=[{'path':p.relative_to(o).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(o.rglob('*')) if p.is_file() and p.name!='INDEX.json']
assert not (o/'INDEX.json').exists();(o/'INDEX.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf8');print(json.dumps({'INDEX_sha256':sha(o/'INDEX.json'),'children':len(index['files']),'runtime_digest':digest,'wrapper_sha256':sha(wrapper),'pending_ACK_sha256':sha(pending)}))
