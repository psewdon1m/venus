from pathlib import Path
import hashlib,json,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/oci27-browser-pid-profile-author-round01'
B=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer26';C=B.with_name('p05-compatible-rollback-producer27');revision='QRB_BOUND_ONLY_2_BROWSER_PIDS256'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
assert pin(A/'INDEX.json')['sha256']=='99521e37a87641959edc6233e5e2f062a91ea764e1b267ce9a51c714a692b915'
author=read(A/'INDEX.json');assert len(author['files'])==50
for f in author['files']:assert pin(A/f['path'])=={k:f[k]for k in ['bytes','sha256']},f['path']
assert pin(C/'INDEX.json')['sha256']=='4c4d8134eaf7820a98075c60235cadb272cc2ca4a9262dcf6d8208fe3654245c'
cur=read(C/'INDEX.json');par=read(B/'INDEX.json');assert set(cur['files'])-set(par['files'])=={'RESOURCE_PROFILE27.md'}and not(set(par['files'])-set(cur['files']))
assert {p.relative_to(C).as_posix()for p in C.rglob('*')if p.is_file()and p.name!='INDEX.json'}==set(cur['files'])
for n,f in cur['files'].items():assert pin(C/n)=={k:f[k]for k in ['bytes','sha256']},n
changed=['bound-profile.mjs','bootstrap.mjs','host-runner.mjs','driver.mjs','contract.mjs','resource-lease.mjs']
assert sorted(n for n in par['files']if cur['files'][n]!=par['files'][n])==sorted(changed+['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','PROFILE.json'])
assert len([n for n in cur['files']if n.endswith('.mjs')])==40
for n in par['files']:
 if n not in changed+['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','PROFILE.json']:assert (C/n).read_bytes()==(B/n).read_bytes(),n
for n in changed:
 b=(C/n).read_bytes().replace(revision.encode(),b'QRB_BOUND_ONLY_1')
 if n=='bound-profile.mjs':b=b.replace(b',PID_limits:{browser:256,other_roles:128,native_free:32}',b'')
 if n=='host-runner.mjs':b=b.replace(b"role==='native-free'?32:role==='browser'?256:128",b"role==='native-free'?32:128").replace(b"'--pids-limit',role==='browser'?'256':'128'",b"'--pids-limit','128'")
 if n=='contract.mjs':b=b.replace(b'assert.deepEqual(r.resource.profile.PID_limits,{browser:256,other_roles:128,native_free:32});',b'')
 assert b==(B/n).read_bytes(),n
for n in ['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json']:assert (C/n).read_bytes().replace(revision.encode(),b'QRB_BOUND_ONLY_1')==(B/n).read_bytes()
binding=read(C/'BINDING.json');template=read(C/'ROOT_RUN_ACK_TEMPLATE.json');profile=read(C/'PROFILE.json');assert binding['root_run_ack']is False and template['root_run_ack']is False
assert binding['resource_profile']==template['resource_profile']==profile['resource_profile']==cur['resource_profile']==revision
assert profile['PID_limits']=={'browser':256,'other_roles':128,'native_free':32}and profile['A_source']==binding['source_identity']and profile['A_image']==binding['images']['A']and profile['actual_compatibility_RUN']is False
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert read(C/'included-inputs.json')==freeze['files']and len(freeze['files'])==1871
assert binding['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
diag=R/'.docs/implementation/reviews/p05/oci26-a17-failure-diagnosis-independent-round01/INDEX.json';assert pin(diag)['sha256']==cur['actual26_independent_diagnosis_sha256']=='4806f27c457b696c8c8fd48f10ee8752c3d2fbd3970cf59db5e01c91d1010042'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';control=R/'.artifacts/p05-oci27-controls.mjs';assert control.read_bytes()==(A/'author/p05-oci27-controls.mjs').read_bytes()
run=subprocess.run([node,str(control)],cwd=R,capture_output=True,timeout=30);(O/'focused.stdout.txt').write_bytes(run.stdout);(O/'focused.stderr.txt').write_bytes(run.stderr);assert run.returncode==0,run.stderr.decode();finite=json.loads(run.stdout);assert len(finite['controls'])==4 and all(x['status']=='PASS'for x in finite['controls'])
falseack=R/'.artifacts/p05-oci27-unissued-ack01.json';assert falseack.read_bytes()==(C/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes()
allocation_root=C.parent/'p05';before={p.name for p in allocation_root.glob('venus-p05-oci-*')}
denial=subprocess.run([node,'--max-old-space-size=192',str(C/'driver.mjs'),'--run','--ack='+str(falseack)],cwd=C.parent.parent,capture_output=True,timeout=30)
(O/'falseACK.stdout.txt').write_bytes(denial.stdout);(O/'falseACK.stderr.txt').write_bytes(denial.stderr);assert denial.returncode==1 and b'NOT_ACCEPTED_BEFORE_OR_DURING_PLAN'in denial.stderr
assert {p.name for p in allocation_root.glob('venus-p05-oci-*')}==before
driver=(C/'driver.mjs').read_text();assert driver.index('validateAuthority(binding,ack,sha(indexRaw))')<driver.index("await import('./host-runner.mjs')")
d={'status':'PASS_METHOD_ONLY','source_identity':binding['source_identity'],'included_files':1871,'images':binding['images'],'resource_profile':revision,'PID_limits':profile['PID_limits'],'author_index':pin(A/'INDEX.json'),'producer_index':pin(C/'INDEX.json'),'producer_files':len(cur['files']),'changed_MJS':changed,'runtime_MJS':40,'other34_MJS':'BYTE_EXACT26','six_method_byte_inverse':'EXACT26','original14_E_F_stop_replay_bounds':'UNCHANGED','focused_groups':4,'focused_exit':run.returncode,'falseACK_exit':denial.returncode,'falseACK_allocations':0,'diagnosis':pin(diag),'prior128_attempt':'FAIL_UNCHANGED','OS_cause_or_remedy_resourcefit':'UNPROVEN_UNTIL_ACTUAL','native_actions':0,'APP_writes':0}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d))
