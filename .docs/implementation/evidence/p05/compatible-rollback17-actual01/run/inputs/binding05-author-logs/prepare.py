from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,sys
base=Path('.artifacts/p05-engine3-bundle-source01');p=base/'.artifacts/p05-compatible-rollback-producer05';old=Path('.artifacts/p05-compatible-rollback-producer04');r=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'));write=lambda path,value:path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
assert not p.exists();assert sha((old/'INDEX.json').read_bytes())=='10659a29e2d60f90dfe952d991a29435f20e51f059dd6b4227a18e1b989df666'
for name,row in read(old/'INDEX.json')['files'].items():assert sha((old/name).read_bytes())==row['sha256']
receiptA=Path('.artifacts/p05-bundle-image-binding01/receipt.json');receiptB=Path('.artifacts/p05-engine3-image-binding01/receipt.json');assert sha(receiptA.read_bytes())=='30f5a64082c9792ee247390041788d6c91d19a6746bb8f24db4a82cd56df0dfa';assert sha(receiptB.read_bytes())=='20dbb347aa19704ac43ae84910278082593a82e28a4f1f2281c20bd5341531d0'
A=read(receiptA);B=read(receiptB);assert A['source_identity']=='f4270f88bc84753f2fbdb3871311f039843add50a5ffe4832991c25d5b34f20d' and B['source_identity']=='ed18d3cb16cac4e244d2f2d58602c41cd8485b0bddf9beef7fe9ae1fa64a0026';assert len(A['image_files_sha256'])==276 and len(B['image_files_sha256'])==272
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
inv=inventory(base);assert identity(inv)==A['source_identity'] and len(inv)==1835
assert identity(inventory(Path('.artifacts/p05-engine3-prebundle-source01')))==B['source_identity']
shutil.copytree(old,p)
for name in ['INDEX.json','BINDING.json','PROFILE.json','actual-image-maps.json','included-inputs.json','ROOT_RUN_ACK_TEMPLATE.json','compatibility-comparison.json','actual-build-metadata-absence.json','README.md','REBIND.md','AUTHOR_CHECKS.json','METHOD_CARRY.json','predecessor-source-delta.json','predecessor-source-delta.patch']:
 shutil.copyfile(old/name,p/'pinned-inputs'/('historical04-'+name+'.bytes'))
for name,path in [('current-A3-receipt.json.bytes',receiptA),('current-B3-receipt.json.bytes',receiptB)]:shutil.copyfile(path,p/'pinned-inputs'/name)
def anchors(receipt):
 out={}
 for kind in ['compiled_files','migration_files','web_dist_files','pg_dependency_files']:
  for name,pin in receipt[kind].items():
   if name in out:assert out[name]==pin
   out[name]=pin
 assert len(out)==76 and all(receipt['image_files_sha256'][name]==pin for name,pin in out.items());return dict(sorted(out.items()))
maps={'schema_version':1,'status':'ROOT_ACTUAL_ENGINE3_A3_B3_RUNTIME76_EACH_NOT_ROLLBACK_PASS','images':{'A':A['image'],'B':B['image']},'maps':{k:{'files':anchors(v),'metadata':None,'metadata_absent':True,'compiled64':True}for k,v in [('A',A),('B',B)]},'source_receipts':{'A':{'path':str(receiptA).replace('\\','/'),'sha256':sha(receiptA.read_bytes())},'B':{'path':str(receiptB).replace('\\','/'),'sha256':sha(receiptB.read_bytes())}},'root_actual_probes_only_no_new_Docker':True}
assert all(A['compiled_files'][name]==pin for name,pin in B['compiled_files'].items()if name.startswith('packages/relationship-engine/')) and A['migration_files']==B['migration_files']
assert all(v['build_metadata_absent'] and v['probe_exit_code']==0 and v['probe_cleanup']=='AUTO_REMOVED' for v in [A,B])
write(p/'actual-image-maps.json',maps);binding=read(old/'BINDING.json');binding.update(source_identity=A['source_identity'],included_files=1835,prior_source_identity=B['source_identity'],images=maps['images'],per_image_compiled={'A':A['compiled_files'],'B':B['compiled_files']},expanded_actual_image_UI_migration_maps_sha256=sha((p/'actual-image-maps.json').read_bytes()),previous_known_UI_bug='Genuine prebundle B3 retains separate sequential private reads and their narrow5s freshness margin; no known-good GA or actual fullbrowser PASS is claimed.',previous_known_issues=['prebundle separate own/target/conversation/chat reads retain observed freshness limitation; engine3 exact-ID fix is present in both images'],application_source_review='REQUIRED_NONAUTHOR_A3_BUNDLED_SOURCE_REVIEW_PLUS_ENGINE3_REVIEW_AND_OPERATIONAL_BINDING',application_current_tests='Root independent B3 Games20 PASS33390bf4; A3 bundled source review and actual browser are separate. No OCI14 RUN by this binding author.',previous_A_binding={'source_identity':read(old/'BINDING.json')['source_identity'],'image':read(old/'BINDING.json')['images']['A'],'producer04_index_sha256':sha((old/'INDEX.json').read_bytes())},operational_rebind_only=True)
binding['engine_compatibility']={'A':'RE-1.P05-TOPIC-3','B':'RE-1.P05-TOPIC-3','policy':'ROOM-TOPIC-2','old_engine2_abort':'Separate startup compatibility test; not substituted for live14'}
write(p/'BINDING.json',binding);write(p/'included-inputs.json',inv);write(p/'previous-B-runtime-pins.json',B)
profile=read(old/'PROFILE.json');profile.update(status='AUTHOR_OPERATIONAL_REBIND05_READY_FOR_INDEPENDENT_REVIEW_NOT_RUN',A_source=A['source_identity'],A_image=A['image'],previous_B_source=B['source_identity'],previous_B_image=B['image'],B_known_issues=binding['previous_known_issues']);profile['engine_profile']='Both genuine engine3; unchangedSQL/enginecompiled; A3 bundledAPI/UI vs B3 prebundleAPI/UI';write(p/'PROFILE.json',profile)
ack=read(old/'ROOT_RUN_ACK_TEMPLATE.json');ack.update(source_identity=A['source_identity'],images=maps['images'],application_source_review_source=A['source_identity'],expanded_image_map_sha256=binding['expanded_actual_image_UI_migration_maps_sha256']);write(p/'ROOT_RUN_ACK_TEMPLATE.json',ack)
metadata={k:{'image':v['image'],'observed':{'exists':False,'sha256':None,'app_imports':0},'actual_receipt':str(path).replace('\\','/'),'receipt_sha256':sha(path.read_bytes()),'exit_code':v['probe_exit_code'],'cleanup':v['probe_cleanup']}for k,v,path in [('A',A,receiptA),('B',B,receiptB)]};write(p/'actual-build-metadata-absence.json',metadata)
oldInv=inventory(Path('.artifacts/p05-engine3-prebundle-source01'));delta=[{'path':name,'A':inv.get(name),'B':oldInv.get(name)}for name in sorted(set(inv)|set(oldInv))if inv.get(name)!=oldInv.get(name)];comparison={'status':'BYTE_COMPATIBILITY_PRECONDITIONS_NOT_RUNTIME_PASS','A_source':A['source_identity'],'B_source':B['source_identity'],'included_delta':delta,'compiled_changed':[name for name in A['compiled_files']if A['compiled_files'][name]!=B['compiled_files'][name]],'engine_equal':True,'all7SQL_equal':True,'public_UI_changed_for_bundle':A['web_dist_files']!=B['web_dist_files'],'both_engine3':True,'whole_image_equivalence_claimed':False};write(p/'compatibility-comparison.json',comparison)
carry=read(old/'METHOD_CARRY.json');carry['status']='EXACT_ACCEPTED02_RUNTIME_METHOD_CARRY_NOT_OCI05_RUN_PASS';carry['prior_operational04_review_index_sha256']='1172135ef3b2cce8c2a2ddb61ff36460d417546ee0acf7ce3956e0dd0cd2e66b';carry['binding_control_script_only_parameter_adjustment']='Operational05 A3/B3 receipt/source/map controls; not method or original14 change';write(p/'METHOD_CARRY.json',carry)
for row in carry['unchanged_MJS_files']:assert sha((p/row['path']).read_bytes())==row['sha256']
dependency_checks=[]
for row in read(p/'dependency-pins.json'):
 copied=p/row['copy'];assert sha(copied.read_bytes())==row['sha256']
 source=base/row['source'];direct=source.exists()
 if direct:assert copied.read_bytes()==source.read_bytes()
 dependency_checks.append({'source':row['source'],'copy':row['copy'],'sha256':row['sha256'],'exact_materialized_source':direct,'excluded_historical_dependency_pinned_only':not direct})
write(p/'binding05-dependency-checks.json',dependency_checks)
write(r/'prepare-result.json',{'at_utc':datetime.now(timezone.utc).isoformat(),'producer':str(p),'workspace':str(base),'source_identity':identity(inv),'source_files':1835,'A':A['image'],'B':B['image'],'method23_exact':True,'full_maps_each':76,'included_delta':len(delta),'compiled_delta':comparison['compiled_changed'],'actual_Docker_commands':0,'root_ACK':False})
print(json.dumps(read(r/'prepare-result.json'),indent=2))
