"""A26 original UI/OCI metadata binding; no Docker, APP edits or active authority."""
from pathlib import Path
import datetime, difflib, hashlib, json, shutil, subprocess, sys
R=Path('C:/.projects/venus'); OLD=R/'.artifacts/p05-pilot-bundle-source22'; S=R/'.artifacts/p05-pilot-bundle-source23'
A=R/'.docs/implementation/reviews/p05/a26-two-gates-rebind-author-round01'
L=S/'.artifacts/p05-v2-layout-producer-a26-01'; O=S/'.artifacts/p05-compatible-rollback-producer38'
oldL=OLD/'.artifacts/p05-v2-layout-producer-a25-02';oldO=OLD/'.artifacts/p05-compatible-rollback-producer37'
F=R/'.artifacts/p05-pilot-bundle-source-freeze23.json'; T=R/'.artifacts/p05-pilot-bundle-image-binding24/receipt.json';P=R/'.artifacts/p05-pilot-bundle-production-image-binding24/receipt.json'
REV=R/'.docs/implementation/reviews/p05/public-exhaustion-focus-independent-round01'
NODE='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
SOURCE='27f5172a4d550017c801a15531d39f52aed120937f70e556dfbaae063b56a5bf'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
freeze,test,prod=read(F),read(T),read(P)
assert freeze['identity']==SOURCE and freeze['included_files']==1881 and freeze['git_source_commit']=='d55ee0430eecfcd9d73199f083c8dd428d68a071'
assert sha(REV/'INDEX.json')=='c3338514ac9c23ee70ebcc56cb446c49f1bf1e62eb09f64fbe8b414b47f04896'
for x in [test,prod]:
 assert x['source_identity']==SOURCE and x['included_files']==1881 and x['probe_exit_code']==x['build_observed_exit']==x['app_imports']==0
 assert x['probe_cleanup']=='AUTO_REMOVED'
assert len(test['image_files_sha256'])==299 and len(prod['image_files_sha256'])==122
assert test['web_dist_files']==prod['web_dist_files']
beforeT=read(R/'.artifacts/p05-pilot-bundle-image-binding23/receipt.json');beforeP=read(R/'.artifacts/p05-pilot-bundle-production-image-binding23/receipt.json')
backend_changes={}
for label,b,n in [('test',beforeT,test),('production',beforeP,prod)]:
 assert b['migration_files']==n['migration_files'] and b['pg_dependency_files']==n['pg_dependency_files']
 assert set(b['compiled_files'])==set(n['compiled_files'])
 changed={p:{'before':b['compiled_files'][p],'after':h} for p,h in n['compiled_files'].items() if h!=b['compiled_files'][p]}
 assert set(changed)=={'packages/relationship-engine/dist/index.js','packages/relationship-engine/dist/topic-planner.js'},changed
 backend_changes[label]=changed
A.mkdir(exist_ok=False);shutil.copytree(oldL,L);shutil.copytree(oldO,O)
inverse={}
for name,b,n in [('run.mjs','p05-v2-layout-producer-a25-02','p05-v2-layout-producer-a26-01'),('runner-policy.mjs','assert.equal(binding.included_files,1879);','assert.equal(binding.included_files,1881);')]:
 raw=(oldL/name).read_bytes();assert raw.count(b.encode())==1
 changed=raw.replace(b.encode(),n.encode());(L/name).write_bytes(changed)
 inverse[name]=changed.replace(n.encode(),b.encode())==raw;assert inverse[name]
 (A/(name+'.diff')).write_text(''.join(difflib.unified_diff(raw.decode().splitlines(True),changed.decode().splitlines(True),fromfile='A25-02/'+name,tofile='A26-01/'+name)),encoding='utf-8')
assert len(list(L.glob('*.mjs')))==27 and all((L/p.name).read_bytes()==p.read_bytes() for p in oldL.glob('*.mjs') if p.name not in inverse)
oci_mjs={p.relative_to(oldO).as_posix():sha(p) for p in oldO.rglob('*.mjs')};assert len(oci_mjs)==40
assert all(sha(O/p)==h for p,h in oci_mjs.items())
b=read(L/'binding.json');b.update(source_identity=SOURCE,included_files=1881,image=test['image'],root_build_receipt_path=str(T),root_build_receipt_sha256=sha(T),source_snapshot_path=str(F),source_snapshot_sha256=sha(F));write(L/'binding.json',b)
with (L/'DESIGN.md').open('a',encoding='utf-8') as f:f.write('\n\nA26 metadata-only binding to source23/1881/clean Git d55ee043; accepted original A25-02 document-focus method preserved. Only self run path and strict source count literals change. Original first focus, zoom, oracles, deadlines, 51 cells each and nine-fresh aggregate459/324/135 unchanged. APP room invite selection now uses click; public exhaustion compatible selector patch ADR030 requires fresh uniform statistics. No parent UI/OCI or model actual credit. Root ACK inactive; independent current binding and fresh manual resource admission required.\n')
ack=read(L/'ROOT_RUN_ACK.json')
ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',independent_review_index_sha256='0'*64,producer_runtime_digest='0'*64,source_identity=SOURCE,image=test['image'],issued_at=None,scope='ORIGINAL_NINE_FRESH_SAME_A26_01_RUNTIME_NOT_STAGE')
for k in ['shared_resource_authority','resource_schedule_shards','resource_schedule_policy','all9_current_A25_UI_fresh_required','covered_component_qualification_review_sha256']:ack.pop(k,None)
ack['all9_current_A26_UI_fresh_required']=True
write(L/'ROOT_RUN_ACK.json',ack)
ob=read(O/'BINDING.json');ob.update(source_identity=SOURCE,included_files=1881,prior_source_identity=ob['source_identity'],previous_A_binding={'source_identity':ob['source_identity'],'image':ob['images']['A'],'producer37_index_sha256':sha(oldO/'INDEX.json')},application_source_review='A26 source-only independent c3338514; ADR030 compatible public-exhaustion fallback and room-invite click-selection. Planner/index compiled changed; no blanket backend carry. Fresh original14 current A26/B4 required.',application_current_tests='69/69 targeted planner; 1107 PASS207 Windows platform SKIP; typecheck/lint0. Whole clean Linuxquality/native/statistics pending.',operational_binding_revision='OCI38_A26_B4_LITERAL_BINDING_RUNTIME81_NOT_RUN')
ob['images']['A']=test['image']
for group in ['per_image_compiled','per_image_additional']:
 ob[group]['A']={p:test['image_files_sha256'][p] for p in ob[group]['A']}
maps=read(O/'actual-image-maps.json');maps['status']='ROOT_ACTUAL_RECEIPTS_A26_B4_CRITICAL_81_78_NATIVE38_PENDING';maps['images']['A']=test['image']
old_a=maps['maps']['A']['files'];new_a={p:test['image_files_sha256'][p] for p in old_a if not p.startswith('apps/web/dist/')};new_a.update(test['web_dist_files']);maps['maps']['A']['files']=new_a
assert len(new_a)==81 and len(maps['maps']['B']['files'])==78 and maps['maps']['B']==read(oldO/'actual-image-maps.json')['maps']['B']
write(O/'actual-image-maps.json',maps);ob['expanded_actual_image_UI_migration_maps_sha256']=sha(O/'actual-image-maps.json');write(O/'BINDING.json',ob);write(O/'included-inputs.json',freeze['files'])
write(O/'FULL299-PROBE24.json',{'status':'FULL_IMAGE_PROBE_PROOF_NOT_OCI_RUNTIME_EXPECTED_MAP','image':test['image'],'source_identity':SOURCE,'receipt_path':str(T),'receipt_sha256':sha(T),'files':test['image_files_sha256'],'file_count':299})
write(O/'OPERATIONAL_REVISION38.json',{'status':'AUTHOR_A26_METADATA_REBIND_PENDING_INDEPENDENT_NO_NATIVE','source_identity':SOURCE,'included_files':1881,'images':ob['images'],'source_freeze_sha256':sha(F),'test_receipt_sha256':sha(T),'production_receipt_sha256':sha(P),'core_git':freeze['git_source_commit'],'parent37_INDEX_sha256':sha(oldO/'INDEX.json'),'A_expected_runtime81':True,'B78unchanged':True,'full299_separate':'FULL299-PROBE24.json','all40_MJS_rawexact37':True,'all14_oracles_resources_deadlines':'UNCHANGED','native_runs':0,'root_ack':False})
oa=read(O/'ROOT_RUN_ACK_TEMPLATE.json');oa.update(status='NOT_AUTHORIZED',root_run_ack=False,source_identity=SOURCE,images=ob['images'],producer_index_sha256=None,independent_review_index=None,independent_review_index_sha256=None,application_source_review_index=None,application_source_review_index_sha256=None,application_source_review_source=SOURCE,expanded_image_map_sha256=sha(O/'actual-image-maps.json'));write(O/'ROOT_RUN_ACK_TEMPLATE.json',oa);write(A/'OCI38-INACTIVE-ACK.json',oa)
if not (S/'.docs/implementation/reviews/p05'/REV.name).exists():shutil.copytree(REV,S/'.docs/implementation/reviews/p05'/REV.name)
res=R/'.artifacts/p05-a26-existing-gates-resource-authority12.json';guard=R/'.artifacts/p05-a26-manual-preflight10.py'
oldRes=R/'.artifacts/p05-a25-existing-gates-resource-authority11.json';ra=read(oldRes)
ra.update(created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),source_identity=SOURCE,source_files=1881,test_image=test['image'],production_image=prod['image'],revision=12,parent_resource_authority_sha256=sha(oldRes),supersedes_prospective_authority_sha256=sha(oldRes),active_statistics_manifest_sha256=None,active_statistics_manifest_qualification='QUIET_ONLY. Original05 naturally STOPPED_FAIL. Uniform A26 full06 pending independent binding/prereg. Any simultaneous statistics require new exact-manifest admission; this authority admits zero stats workers.',allowed_additional_jobs=['Nine original fresh current A26 layout51 shards after independent metadata binding acceptance; manual one each','One original14 current A26 OCI38 after independent metadata binding acceptance; no concurrent UI'],resource_policy_changes=['Metadata-only A26/currentimages/1881 original UI A25-02 and OCI37→38 unchanged methods/caps.', 'All numeric caps/headroom identical resource11. Quiet-only until independentlybound current uniform06 manifest exists. No old05/image58 active authority. No P06.'])
write(res,ra)
oldGuard=(R/'.artifacts/p05-a25-manual-preflight09.py').read_text()
start=oldGuard.index("manifest = r / ");end=oldGuard.index("a = json.loads(authority.read_text())")
newGuard=oldGuard[:start]+"authority = r / '.artifacts/p05-a26-existing-gates-resource-authority12.json'\nassert sha(authority) == '"+sha(res)+"'\n"+oldGuard[end:]
start=newGuard.index('assert len(owned) <= 8');end=newGuard.index("assert sorted(x['id']",start)
newGuard=newGuard[:start]+"assert len(owned) == 0, 'RESOURCE12_QUIET_ONLY_NO_STATISTICS_ADMITTED'\n"+newGuard[end:]
newGuard=newGuard.replace("'statistics_manifest_sha256': sha(manifest)","'statistics_manifest_sha256': None").replace('ONE_EXISTING_A25_GATE_MANUAL_START_UNDER_RESOURCE11_NO_METHOD_CHANGE','ONE_EXISTING_A26_GATE_MANUAL_START_UNDER_QUIET_RESOURCE12_NO_METHOD_CHANGE')
guard.write_text(newGuard,encoding='utf-8')
write(A/'INPUT-PINS.json',{'freeze':{'path':str(F),'sha256':sha(F)},'test_receipt':{'path':str(T),'sha256':sha(T)},'production_receipt':{'path':str(P),'sha256':sha(P)},'layout_parent_INDEX_sha256':sha(oldL/'INDEX.json'),'OCI_parent_INDEX_sha256':sha(oldO/'INDEX.json'),'source_review_sha256':sha(REV/'INDEX.json'),'resource12':{'path':str(res),'sha256':sha(res)},'guard10':{'path':str(guard),'sha256':sha(guard)}})
write(A/'RUNTIME-INVERSES.json',{'layout_two_literals_inverse':inverse,'other25_layout_MJS_rawexact_A25_02':True,'all40_OCI_MJS_rawexact37':oci_mjs})
write(A/'IMAGE-MAP-CHECKS.json',{'compiled_changes_only':backend_changes,'migration7_PG2_exact_A25':True,'runtime_A_files':len(new_a),'runtime_B_files':78,'B_map_exact37':True,'full_probe299_separate':True})
shutil.copyfile(Path(__file__),A/'prepare.py')
print(json.dumps({'status':'PREPARED_PENDING_EXISTING_COLD_CHECKS_AND_FREEZE','author':str(A),'Docker':0}))
