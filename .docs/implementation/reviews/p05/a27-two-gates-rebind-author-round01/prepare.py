"""A27 original UI/OCI metadata binding; no Docker, APP edits or active authority."""
from pathlib import Path
import datetime, difflib, hashlib, json, shutil, subprocess, sys
R=Path('C:/.projects/venus'); OLD=R/'.artifacts/p05-pilot-bundle-source23'; S=R/'.artifacts/p05-pilot-bundle-source24'
A=R/'.docs/implementation/reviews/p05/a27-two-gates-rebind-author-round01'
L=S/'.artifacts/p05-v2-layout-producer-a27-01'; O=S/'.artifacts/p05-compatible-rollback-producer39'
oldL=OLD/'.artifacts/p05-v2-layout-producer-a26-01';oldO=OLD/'.artifacts/p05-compatible-rollback-producer38'
F=R/'.artifacts/p05-pilot-bundle-source-freeze24.json'; T=R/'.artifacts/p05-pilot-bundle-image-binding25/receipt.json';P=R/'.artifacts/p05-pilot-bundle-production-image-binding25/receipt.json'
REV=R/'.docs/implementation/reviews/p05/native-caret-padding-independent-round01'
NODE='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
SOURCE='cbba318d36477efacb1d9d35e5bb867b0af5d9c89f5220808df5a35b59242b07'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
freeze,test,prod=read(F),read(T),read(P)
assert freeze['identity']==SOURCE and freeze['included_files']==1882 and freeze['git_source_commit']=='f815b8b2be5036118e2be99b56c25adc9ac09a80'
assert sha(REV/'INDEX.json')=='59e884ed733a1f0181c7713873defe395a3d69fe5daa7f09e916ace0417f61eb'
for x in [test,prod]:
 assert x['source_identity']==SOURCE and x['included_files']==1882 and x['probe_exit_code']==x['build_observed_exit']==x['app_imports']==0
 assert x['probe_cleanup']=='AUTO_REMOVED'
assert len(test['image_files_sha256'])==299 and len(prod['image_files_sha256'])==122
assert test['web_dist_files']==prod['web_dist_files']
beforeT=read(R/'.artifacts/p05-pilot-bundle-image-binding24/receipt.json');beforeP=read(R/'.artifacts/p05-pilot-bundle-production-image-binding24/receipt.json')
backend_changes={}
for label,b,n in [('test',beforeT,test),('production',beforeP,prod)]:
 assert b['migration_files']==n['migration_files'] and b['pg_dependency_files']==n['pg_dependency_files']
 assert set(b['compiled_files'])==set(n['compiled_files'])
 changed={p:{'before':b['compiled_files'][p],'after':h} for p,h in n['compiled_files'].items() if h!=b['compiled_files'][p]}
 assert not changed,changed
 backend_changes[label]=changed
A.mkdir(exist_ok=False);shutil.copytree(oldL,L);shutil.copytree(oldO,O)
inverse={}
for name,b,n in [('run.mjs','p05-v2-layout-producer-a26-01','p05-v2-layout-producer-a27-01'),('runner-policy.mjs','assert.equal(binding.included_files,1881);','assert.equal(binding.included_files,1882);')]:
 raw=(oldL/name).read_bytes();assert raw.count(b.encode())==1
 changed=raw.replace(b.encode(),n.encode());(L/name).write_bytes(changed)
 inverse[name]=changed.replace(n.encode(),b.encode())==raw;assert inverse[name]
 (A/(name+'.diff')).write_text(''.join(difflib.unified_diff(raw.decode().splitlines(True),changed.decode().splitlines(True),fromfile='A26-01/'+name,tofile='A27-01/'+name)),encoding='utf-8')
assert len(list(L.glob('*.mjs')))==27 and all((L/p.name).read_bytes()==p.read_bytes() for p in oldL.glob('*.mjs') if p.name not in inverse)
oci_mjs={p.relative_to(oldO).as_posix():sha(p) for p in oldO.rglob('*.mjs')};assert len(oci_mjs)==40
assert all(sha(O/p)==h for p,h in oci_mjs.items())
b=read(L/'binding.json');b.update(source_identity=SOURCE,included_files=1882,image=test['image'],root_build_receipt_path=str(T),root_build_receipt_sha256=sha(T),source_snapshot_path=str(F),source_snapshot_sha256=sha(F));write(L/'binding.json',b)
with (L/'DESIGN.md').open('a',encoding='utf-8') as f:f.write('\n\nA27 metadata-only binding to source24/1882/clean Git f815b8b2; accepted original A26-01 document-focus method preserved. Only self run path and strict source count literals change. Original first focus, zoom, oracles, deadlines, 51 cells each and nine-fresh aggregate459/324/135 unchanged. APP CSS scroll-padding-block now extends native caret/focus scroll visibility; all backend modules exact A26. Uniform06 remains source27f/image24 pure-domain component and cannot establish whole A27 UI/OCI acceptance. Root ACK inactive; independent current binding and fresh manual resource admission required.\n')
ack=read(L/'ROOT_RUN_ACK.json')
ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',independent_review_index_sha256='0'*64,producer_runtime_digest='0'*64,source_identity=SOURCE,image=test['image'],issued_at=None,scope='ORIGINAL_NINE_FRESH_SAME_A27_01_RUNTIME_NOT_STAGE')
for k in ['shared_resource_authority','resource_schedule_shards','resource_schedule_policy','all9_current_A26_UI_fresh_required','covered_component_qualification_review_sha256']:ack.pop(k,None)
ack['all9_current_A27_UI_fresh_required']=True
write(L/'ROOT_RUN_ACK.json',ack)
ob=read(O/'BINDING.json');ob.update(source_identity=SOURCE,included_files=1882,prior_source_identity=ob['source_identity'],previous_A_binding={'source_identity':ob['source_identity'],'image':ob['images']['A'],'producer38_index_sha256':sha(oldO/'INDEX.json')},application_source_review='A27 CSS-only caret scroll-padding source independent59e884ed. Backend69/67+SQL7+PG2 rawexact A26; current source1882 with normative09. Fresh original14 A27/B4 required; pure-domain full06 source27f/image24 component only, not whole A27 image.',application_current_tests='A26 backend targeted69 and host1107 historical qualified component; CSS-only A27 rendered/native/cleanquality actuals pending, source review only.',operational_binding_revision='OCI39_A27_B4_LITERAL_BINDING_RUNTIME81_NOT_RUN')
ob['images']['A']=test['image']
for group in ['per_image_compiled','per_image_additional']:
 ob[group]['A']={p:test['image_files_sha256'][p] for p in ob[group]['A']}
maps=read(O/'actual-image-maps.json');maps['status']='ROOT_ACTUAL_RECEIPTS_A27_B4_CRITICAL_81_78_NATIVE39_PENDING';maps['images']['A']=test['image']
old_a=maps['maps']['A']['files'];new_a={p:test['image_files_sha256'][p] for p in old_a if not p.startswith('apps/web/dist/')};new_a.update(test['web_dist_files']);maps['maps']['A']['files']=new_a
assert len(new_a)==81 and len(maps['maps']['B']['files'])==78 and maps['maps']['B']==read(oldO/'actual-image-maps.json')['maps']['B']
write(O/'actual-image-maps.json',maps);ob['expanded_actual_image_UI_migration_maps_sha256']=sha(O/'actual-image-maps.json');write(O/'BINDING.json',ob);write(O/'included-inputs.json',freeze['files'])
write(O/'FULL299-PROBE25.json',{'status':'FULL_IMAGE_PROBE_PROOF_NOT_OCI_RUNTIME_EXPECTED_MAP','image':test['image'],'source_identity':SOURCE,'receipt_path':str(T),'receipt_sha256':sha(T),'files':test['image_files_sha256'],'file_count':299})
write(O/'OPERATIONAL_REVISION39.json',{'status':'AUTHOR_A27_METADATA_REBIND_PENDING_INDEPENDENT_NO_NATIVE','source_identity':SOURCE,'included_files':1882,'images':ob['images'],'source_freeze_sha256':sha(F),'test_receipt_sha256':sha(T),'production_receipt_sha256':sha(P),'core_git':freeze['git_source_commit'],'parent38_INDEX_sha256':sha(oldO/'INDEX.json'),'A_expected_runtime81':True,'B78unchanged':True,'full299_separate':'FULL299-PROBE25.json','all40_MJS_rawexact38':True,'all14_oracles_resources_deadlines':'UNCHANGED','native_runs':0,'root_ack':False})
oa=read(O/'ROOT_RUN_ACK_TEMPLATE.json');oa.update(status='NOT_AUTHORIZED',root_run_ack=False,source_identity=SOURCE,images=ob['images'],producer_index_sha256=None,independent_review_index=None,independent_review_index_sha256=None,application_source_review_index=None,application_source_review_index_sha256=None,application_source_review_source=SOURCE,expanded_image_map_sha256=sha(O/'actual-image-maps.json'));write(O/'ROOT_RUN_ACK_TEMPLATE.json',oa);write(A/'OCI39-INACTIVE-ACK.json',oa)
if not (S/'.docs/implementation/reviews/p05'/REV.name).exists():shutil.copytree(REV,S/'.docs/implementation/reviews/p05'/REV.name)
res=R/'.artifacts/p05-a27-existing-gates-resource-authority13.json';guard=R/'.artifacts/p05-a27-manual-preflight11.py'
oldRes=R/'.artifacts/p05-a25-existing-gates-resource-authority11.json';ra=read(oldRes)
manifest=R/'.artifacts/p05-full-original-ranges06/MANIFEST.json';manifest_sha='12af2af441d19767794cae18fb32832cf02e2cefd0793f154414d34c8cf6d03e';assert sha(manifest)==manifest_sha
plan=read(manifest);assert len(plan['jobs'])==2609 and plan['lanes']==8
assert plan['worker_profile']['cpu']==1 and plan['worker_profile']['memory_bytes']==1610612736 and plan['worker_profile']['pids']==64
ra.update(created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),source_identity=SOURCE,source_files=1882,test_image=test['image'],production_image=prod['image'],revision=13,parent_resource_authority_sha256=sha(oldRes),supersedes_prospective_authority_sha256=sha(R/'.artifacts/p05-a26-existing-gates-resource-authority12.json'),active_statistics_manifest_sha256=manifest_sha,active_statistics_manifest_qualification='Uniform06 exact2609owners/8lanes source27f/1881 image48c tests24 pure-domain component only; separate independent review/Gitprereg/rootactivation required. A27 backend exact A26 permits qualified pure-domain correspondence, no wholeimage/native/stage credit.',allowed_additional_jobs=['Nine original fresh current A27 layout51 shards after independent binding acceptance; manual one each','One original14 current A27 OCI39 after independent binding acceptance; no concurrent UI'],resource_policy_changes=['Metadata-only A27 CSSpadding/1882/image25; source-only independent59e884ed. Backend69/67SQL7PG2 rawexact A26 after root probes.', 'Same all numeric resource11 limits/headroom. Active statistics eligibility is exact uniform06 manifest12af2af4 and image48c (A26/source27f component), old05/58 not admitted.', 'No automatic batch/retry/pause/drain; max8stats plus ONE independentlybound manuallyadmitted UI/OCI, fresh guard immediately before every start. No P06.'])
ra['statistics_image']='sha256:48c5876a7f78c828883734b4039c59eb97644089cd7e8cf7ca9721d2e26c4592';ra['statistics_source_identity']='27f5172a4d550017c801a15531d39f52aed120937f70e556dfbaae063b56a5bf'
write(res,ra)
oldGuard=(R/'.artifacts/p05-a25-manual-preflight09.py').read_text()
newGuard=oldGuard.replace('p05-full-original-resume05','p05-full-original-ranges06').replace('beacb3659d04aa39299afd2e06f1811f0191974e44f621a85a35c205be4ccd5a',manifest_sha).replace('p05-a25-existing-gates-resource-authority11.json','p05-a27-existing-gates-resource-authority13.json').replace('01fe84029ea2cef6b30b553702ef0ae7c76af9580a19475b4529ac90d4e3e66b',sha(res)).replace('sha256:58d8c700adbbca2251743eff25324102885b3ba8f67fd859c5c8d10d23f789e3','sha256:48c5876a7f78c828883734b4039c59eb97644089cd7e8cf7ca9721d2e26c4592').replace('ONE_EXISTING_A25_GATE_MANUAL_START_UNDER_RESOURCE11_NO_METHOD_CHANGE','ONE_EXISTING_A27_GATE_MANUAL_START_UNDER_RESOURCE13_FULL06_COMPONENT_NO_METHOD_CHANGE')
guard.write_text(newGuard,encoding='utf-8')
write(A/'INPUT-PINS.json',{'freeze':{'path':str(F),'sha256':sha(F)},'test_receipt':{'path':str(T),'sha256':sha(T)},'production_receipt':{'path':str(P),'sha256':sha(P)},'layout_parent_INDEX_sha256':sha(oldL/'INDEX.json'),'OCI_parent_INDEX_sha256':sha(oldO/'INDEX.json'),'source_review_sha256':sha(REV/'INDEX.json'),'resource13':{'path':str(res),'sha256':sha(res)},'guard11':{'path':str(guard),'sha256':sha(guard)}})
write(A/'RUNTIME-INVERSES.json',{'layout_two_literals_inverse':inverse,'other25_layout_MJS_rawexact_A26_01':True,'all40_OCI_MJS_rawexact38':oci_mjs})
write(A/'IMAGE-MAP-CHECKS.json',{'compiled_changes_only':backend_changes,'migration7_PG2_exact_A26':True,'runtime_A_files':len(new_a),'runtime_B_files':78,'B_map_exact38':True,'full_probe299_separate':True})
shutil.copyfile(Path(__file__),A/'prepare.py')
print(json.dumps({'status':'PREPARED_PENDING_EXISTING_COLD_CHECKS_AND_FREEZE','author':str(A),'Docker':0}))
