from pathlib import Path
import hashlib,json,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
A=R/'.docs/implementation/reviews/p05/oci24-fresh-b-fixture-isolation-author-round01'
B=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer23'
C=B.with_name('p05-compatible-rollback-producer24')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p)}
assert sha(A/'INDEX.json')=='0443eee445acd813b739347380d652b96b605cb689f90d23be392f256c4cee43'
author=read(A/'INDEX.json');assert len(author['files'])==44
for f in author['files']:
 p=A/f['path'];assert pin(p)=={k:f[k] for k in ['bytes','sha256']},f['path']
assert sha(C/'INDEX.json')=='9c8e0e409ab4d36204ddaf2e77d06e2ca61f7c73a77547c215b07998431f1a56'
current=read(C/'INDEX.json');parent=read(B/'INDEX.json')
for n,f in current['files'].items():
 p=C/n;assert pin(p)=={k:f[k] for k in ['bytes','sha256']},n
actual_names={p.relative_to(C).as_posix() for p in C.rglob('*') if p.is_file() and p.name!='INDEX.json'}
assert actual_names==set(current['files'])==set(parent['files'])
delta=sorted(n for n in current['files'] if current['files'][n]!=parent['files'][n])
assert delta==['api-child.mjs','browser-child.mjs']
mjs=[n for n in current['files'] if n.endswith('.mjs')];assert len(mjs)==40
for n in current['files']:
 if n not in delta:assert (C/n).read_bytes()==(B/n).read_bytes(),n
api=(C/'api-child.mjs').read_text();browser=(C/'browser-child.mjs').read_text()
addition="const F=await activePrivate(h);assert.notEqual(F.room,E.room,'FRESH_B_FIXTURE_MUST_BE_SEPARATE');next.F=serialize(F);"
label="report.fresh_B_operational_fixture={label:'F',separate_from_untouched_E:true,created_by:'UNCHANGED_ACTIVE_PRIVATE_ONE_SESSION20',untouched_oracle:false};"
assert api.count(addition)==api.count(label)==1
assert api.replace(addition,'').replace(label,'')==(B/'api-child.mjs').read_text()
assert browser.count('e=b.F,eActor=')==1 and 'b.E' not in browser
assert browser.replace('e=b.F,eActor=','e=b.E,eActor=')==(B/'browser-child.mjs').read_text()
assert sha(C/'api-child.mjs')=='3a29583c270fc80fc53c61b3529f0462cf01f4ac2e716c2251f9a0a50ad23826'
assert sha(C/'browser-child.mjs')=='85ebd27d3b0da591419f44e3ae9b79dcc0b580d0189cfd5a7d3217ef853bcb44'
assert api.index('report.replay=await replay(')<api.index(addition)
assert api.index('E:await obs.liveUntouched')<api.index(addition)<api.index("privateWrite('state-B2-final.json'")
assert "phase==='B2'?previous.D:previous.E" in api and "phase==='B2'?previous.baseline.D:previous.baseline.E" in api
assert "const freshBCursor=gates[1].release()" in browser
scenarios=(C/'scenarios.mjs').read_text();assert 'i<=20' in scenarios
host=(C/'host-runner.mjs').read_text();assert 'deadline_ms:900000' in host and 'A3:120000' in host
assert "for(const name of Object.values(plan.volumes))" in host
assert read(C/'BINDING.json')['root_run_ack'] is False and read(C/'ROOT_RUN_ACK_TEMPLATE.json')['root_run_ack'] is False
diag=R/'.docs/implementation/reviews/p05/oci23-a17-failure-diagnosis-independent-round01/INDEX.json'
assert sha(diag)==current['actual23_independent_diagnosis_sha256']=='2cc91004f4ce30985efe27c18de76b57f12fe377db2947f5723a827e0b9b6253'
binding=read(C/'BINDING.json');assert binding['source_identity']==current['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
included=read(C/'included-inputs.json');freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert included==freeze['files'] and len(included)==1871
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
run=subprocess.run([node,str(A/'author/p05-oci24-controls.mjs')],cwd=R,capture_output=True,timeout=30)
(O/'finite.stdout.txt').write_bytes(run.stdout);(O/'finite.stderr.txt').write_bytes(run.stderr)
assert run.returncode==0,run.returncode
finite=json.loads(run.stdout);assert len(finite['controls'])==8 and all(x['status']=='PASS' for x in finite['controls'])
result={'status':'PASS_METHOD_ONLY','source_identity':binding['source_identity'],'included_files':1871,'producer_index':pin(C/'INDEX.json'),'author_index':pin(A/'INDEX.json'),'producer_files':len(current['files']),'runtime_MJS':40,'changed_MJS':delta,'other38_MJS':'EXACT23','all_other_producer_files':'EXACT23','full_inverse':'EXACT23','original_E_A3_oracles':'UNCHANGED','F':'GENUINE_ACTIVEPRIVATE_AFTER_STRICT_REPLAY_DISTINCT_ROOM','migration_rows_sequences':'ALL_FIXTURES_UNFILTERED','cleanup':'WHOLE_OWNED_VOLUMES_UNCHANGED','finite_controls':8,'finite_exit':run.returncode,'pending_ACK_authority':False,'actual_resource_fit':'UNKNOWN_UNTIL_NATIVE','native_actions':0,'APP_writes':0,'images':binding['images'],'diagnosis_index':pin(diag)}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
