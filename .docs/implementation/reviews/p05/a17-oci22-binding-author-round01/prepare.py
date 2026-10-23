from pathlib import Path
import json,hashlib,shutil
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-a17-oci22-binding-author01'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf8')
source=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21'
dest=root/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22'
freezePath=root/'.artifacts/p05-pilot-bundle-source-freeze14.json';freeze=read(freezePath)
receiptPath=root/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';receipt=read(receiptPath)
productionPath=root/'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json';production=read(productionPath)
reviewPath=root/'.docs/implementation/reviews/p05/oci21-diagnostic-independent-round01/INDEX.json'
assert sha(reviewPath)=='12be809d9b1092b7903b5b65812872106bc8baafeda87c9071c1d5b3e9eb6ff4'
assert sha(receiptPath)=='80cdcce2693859be3fbb0cf88c5e6f4826b113fa002e7e923250281ae8d47e82'
assert sha(productionPath)=='60c1386a075f581c78b0f711b3fff015941db129c012e4892fd02ceb67365ec3'
assert freeze['identity']==receipt['source_identity']==production['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert freeze['included_files']==receipt['included_files']==production['included_files']==1871
assert production['build_metadata']['source_revision']==freeze['git_source_commit']=='3abad03309ebd19f04fc0b61532627a5188d855c'
assert production['base_test_image']==receipt['image']
assert receipt['image']=='sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2'
assert production['image']=='sha256:40d92552d7ee12eacb4d945c4f7920efc4b31dee7a4a712d2e0d93ff54935bdd'
for r in [receipt,production]:
 assert r['probe_exit_code']==r['build_observed_exit']==0 and r['probe_cleanup']=='AUTO_REMOVED' and r['app_imports']==0
assert receipt['source_files_exact_frozen'] is True and receipt['build_metadata_absent'] is True
assert not dest.exists();dest.parent.mkdir(exist_ok=True);shutil.copytree(source,dest)
b=read(dest/'BINDING.json');images={**b['images'],'A':receipt['image']}
b.update(source_identity=freeze['identity'],included_files=1871,images=images,operational_binding_revision='OCI22_A17_B4_LITERAL_BINDING_ONLY_NOT_RUN',application_source_review='A17 CSS-only revision; all69 compiled backend files exact A16; JS content exact A16 with asset rename, CSS/HTML new. Fresh independent source/tuple authority required in root ACK; no native or production claim.',application_current_tests='Actual root A17 image receipts bind current bytes; this author performs only cold binding/source checks. No historic host/native PASS is reissued.')
for field in ['per_image_compiled','per_image_additional']:
 for path in b[field]['A']:b[field]['A'][path]=receipt['image_files_sha256'][path]
assert {**b['per_image_compiled']['A'],**b['per_image_additional']['A']}==receipt['compiled_files']
maps=read(dest/'actual-image-maps.json');maps['images']=images;maps['status']='ROOT_ACTUAL_RECEIPTS_A17_B4_CRITICAL_81_78_NATIVE_PENDING'
maps['maps']['A']['files']={**receipt['compiled_files'],**receipt['migration_files'],**receipt['web_dist_files'],**receipt['pg_dependency_files']}
assert len(maps['maps']['A']['files'])==81 and maps['maps']['A']['metadata'] is None
save(dest/'actual-image-maps.json',maps)
b['expanded_actual_image_UI_migration_maps_sha256']=sha(dest/'actual-image-maps.json');save(dest/'BINDING.json',b)
save(dest/'included-inputs.json',freeze['files'])
ack=read(dest/'ROOT_RUN_ACK_TEMPLATE.json');assert ack['status']=='NOT_AUTHORIZED' and ack['root_run_ack'] is False
ack.update(source_identity=freeze['identity'],images=images,application_source_review_source=freeze['identity'],expanded_image_map_sha256=b['expanded_actual_image_UI_migration_maps_sha256']);save(dest/'ROOT_RUN_ACK_TEMPLATE.json',ack)
op={'status':'AUTHOR_PROSPECTIVE_A17_LITERAL_BINDING_ONLY_PENDING_NONAUTHOR_ACK','source_identity':freeze['identity'],'included_files':1871,'images':images,'source_freeze_path':str(freezePath),'source_freeze_sha256':sha(freezePath),'test_receipt_path':str(receiptPath),'test_receipt_sha256':sha(receiptPath),'production_receipt_path':str(productionPath),'production_receipt_sha256':sha(productionPath),'production_source_revision':production['build_metadata']['source_revision'],'production_source_revision_kind':'CLEAN_GIT_COMMIT_SEPARATE_FROM_SOURCE_IDENTITY','root_run_ack':False,'native_runs':0,'runtime_methods':'ALL40MJS_BYTE_EXACT_REVIEWED_OCI21','B4':'UNCHANGED_GENUINE_PREBUNDLE_NOT_KNOWN_GA','parent_method_review':str(reviewPath.relative_to(root)).replace('\\','/'),'parent_method_review_sha256':sha(reviewPath),'parent_producer_index_sha256':sha(source/'INDEX.json'),'OCI20_failure_preserved':True,'diagnostic_not_acceptance':True}
save(dest/'OPERATIONAL_REVISION22.json',op)
files={p.relative_to(dest).as_posix():{'type':'regular_file','bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(dest.rglob('*')) if p.is_file() and p.relative_to(dest).as_posix()!='INDEX.json'}
save(dest/'INDEX.json',{'status':'AUTHOR_FROZEN_A17_LITERAL_BINDING_PENDING_INDEPENDENT_REVIEW_NOT_RUN','source_identity':freeze['identity'],'files':files})
save(work/'PREPARED.json',{'source':str(source),'destination':str(dest),'producer_index_sha256':sha(dest/'INDEX.json'),'op':op})
print(json.dumps({'status':'PREPARED_NO_RUN','producer':str(dest),'producer_index_sha256':sha(dest/'INDEX.json'),'files':len(files)}))
