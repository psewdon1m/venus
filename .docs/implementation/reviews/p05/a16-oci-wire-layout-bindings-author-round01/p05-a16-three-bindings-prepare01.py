from pathlib import Path
import json,hashlib,shutil
root=Path('C:/.projects/venus');oldroot=root/'.artifacts/p05-pilot-bundle-source12';newroot=root/'.artifacts/p05-pilot-bundle-source13'
work=root/'.artifacts/p05-a16-three-bindings-author01';work.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
freezePath=root/'.artifacts/p05-pilot-bundle-source-freeze13.json';freeze=read(freezePath)
receiptPath=root/'.artifacts/p05-pilot-bundle-image-binding13/receipt.json';receipt=read(receiptPath)
productionPath=root/'.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json';production=read(productionPath)
assert freeze['identity']==receipt['source_identity']==production['source_identity']=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13'
assert freeze['included_files']==receipt['included_files']==production['included_files']==1870
assert production['build_metadata']['source_revision']==freeze['git_source_commit']=='b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc'
assert production['base_test_image']==receipt['image']
sources={'oci':oldroot/'.artifacts/p05-compatible-rollback-producer19','wire':root/'.artifacts/p05-public-wire-adjunct06','layout':oldroot/'.artifacts/p05-v2-layout-producer-resume12'}
destinations={'oci':newroot/'.artifacts/p05-compatible-rollback-producer20','wire':root/'.artifacts/p05-public-wire-adjunct07','layout':newroot/'.artifacts/p05-v2-layout-producer-resume13'}
for name,source in sources.items():
 dest=destinations[name];assert not dest.exists()
 shutil.copytree(source,dest,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json','ROOT-ACK.run*.json'))
oci=destinations['oci'];prior=read(sources['oci']/'BINDING.json');b=read(oci/'BINDING.json');images={**b['images'],'A':receipt['image']}
b.update(source_identity=freeze['identity'],included_files=1870,images=images,operational_binding_revision='OCI20_A16_B4_BINDING_ONLY_NOT_RUN',application_source_review='A16 reviewed ledger-inspection memo; fresh independent application/source authority required in root ACK; A15 projection/logging and A14 UI carried by exact bytes. No native or production claim.',application_current_tests='Root image receipts bind current bytes; this author ran only cold binding/source checks. No carried host/native PASS is reissued.')
for path in b['per_image_compiled']['A']:b['per_image_compiled']['A'][path]=receipt['image_files_sha256'][path]
for path in b['per_image_additional']['A']:b['per_image_additional']['A'][path]=receipt['image_files_sha256'][path]
maps=read(oci/'actual-image-maps.json');maps['images']=images;maps['status']='ROOT_ACTUAL_RECEIPTS_A16_B4_CRITICAL_81_78_NATIVE_PENDING'
for path in maps['maps']['A']['files']:maps['maps']['A']['files'][path]=receipt['image_files_sha256'][path]
assert maps['maps']['A']['metadata'] is None and receipt['build_metadata_absent'] is True
save(oci/'actual-image-maps.json',maps)
b['expanded_actual_image_UI_migration_maps_sha256']=sha((oci/'actual-image-maps.json').read_bytes());save(oci/'BINDING.json',b)
save(oci/'included-inputs.json',freeze['files'])
ack=read(oci/'ROOT_RUN_ACK_TEMPLATE.json');assert ack['status']=='NOT_AUTHORIZED' and ack['root_run_ack'] is False
ack.update(source_identity=freeze['identity'],images=images,application_source_review_source=freeze['identity'],expanded_image_map_sha256=b['expanded_actual_image_UI_migration_maps_sha256']);save(oci/'ROOT_RUN_ACK_TEMPLATE.json',ack)
op={'status':'AUTHOR_PROSPECTIVE_A16_BINDING_ONLY_PENDING_NONAUTHOR_ACK','source_identity':freeze['identity'],'included_files':1870,'images':images,'source_freeze_path':str(freezePath),'source_freeze_sha256':sha(freezePath.read_bytes()),'test_receipt_path':str(receiptPath),'test_receipt_sha256':sha(receiptPath.read_bytes()),'production_receipt_path':str(productionPath),'production_receipt_sha256':sha(productionPath.read_bytes()),'production_source_revision':production['build_metadata']['source_revision'],'production_source_revision_kind':'CLEAN_GIT_COMMIT_SEPARATE_FROM_SOURCE_IDENTITY','root_run_ack':False,'runtime_methods':'ALL40MJS_BYTE_EXACT_OCI19','B4':'UNCHANGED_GENUINE_PREBUNDLE_NOT_KNOWN_GA','parent_review':'.docs/implementation/reviews/p05/oci19-host-context-independent-round01/INDEX.json','parent_review_sha256':'3d3ff370769694fee2477f3541a1a45ff928ecc99a4a279c43d8b5e2a7ce5177'}
save(oci/'OPERATIONAL_REVISION20.json',op)
wire=destinations['wire'];ack=read(wire/'ROOT-ACK.template.json')
ack.update(status='NOT_AUTHORIZED',source_root=str(newroot),source_identity=freeze['identity'],source_freeze_path=str(freezePath),source_freeze_sha256=sha(freezePath.read_bytes()),image_id=receipt['image'],image_receipt_path=str(receiptPath),image_receipt_sha256=sha(receiptPath.read_bytes()),method_review_path='PENDING_FRESH_WIRE07_A16_BINDING_REVIEW',method_review_sha256='PENDING_FRESH_WIRE07_A16_BINDING_REVIEW',runtime_files=receipt['image_files_sha256'])
ack['producer_files']={n:sha((wire/n).read_bytes()) for n in ['integration.mjs','public-wire-observer.mjs','positive.mjs','ordinary-observation.mjs','runner.mjs','DESCRIPTOR.json']}
save(wire/'ROOT-ACK.template.json',ack)
save(wire/'OPERATIONAL-A16.json',{**op,'runtime_methods':'ALL5_RUNTIME_MJS_AND_DESCRIPTOR_BYTE_EXACT_WIRE06','parent_review':'.docs/implementation/reviews/p05/public-wire-adjunct-independent-round06/INDEX.json','parent_review_sha256':'583a969cb948be3f27ff36f1d9c29ab5d5380a73e943b5fee44b38f609c00c6e'})
layout=destinations['layout'];binding=read(layout/'binding.json');binding.update(source_identity=freeze['identity'],included_files=1870,image=receipt['image'],root_build_receipt_path=str(receiptPath),root_build_receipt_sha256=sha(receiptPath.read_bytes()),source_snapshot_path=str(freezePath),source_snapshot_sha256=sha(freezePath.read_bytes()),status='FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED');save(layout/'binding.json',binding)
for name in ['run.mjs','runner-policy.mjs']:
 data=(layout/name).read_bytes()
 if name=='run.mjs':data=data.replace(b'p05-v2-layout-producer-resume12',b'p05-v2-layout-producer-resume13').replace(b'FINAL_A15_BOUND_INDEPENDENT_REVIEW_REQUIRED',b'FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace(b'FINAL_A15_BINDING_REQUIRED',b'FINAL_A16_BINDING_REQUIRED')
 else:
  assert data.count(b'assert.equal(binding.included_files,1869)')==1
  data=data.replace(b'assert.equal(binding.included_files,1869)',b'assert.equal(binding.included_files,1870)')
 (layout/name).write_bytes(data)
ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':freeze['identity'],'image':receipt['image'],'scope':'A16_LAYOUT13_DIAGNOSTIC_METHOD12_STILL_PENDING_INDEPENDENT_REVIEW'};save(layout/'ROOT_RUN_ACK.json',ack)
save(layout/'OPERATIONAL-A16.json',{**op,'runtime_methods':'25MJS_EXACT12_RUN_DIR_AND_A16_LABEL_LITERALS_RUNNER_INCLUDED_COUNT_ONLY','parent_diagnostic_author':'.docs/implementation/reviews/p05/layout12-diagnostic-author-round01/INDEX.json','parent_diagnostic_author_sha256':'490d9a5a476ae24a34e8f5d6a91193824013c7352a65480ec3374ad1eb5a5b3c','parent_method_independent':'PENDING_NO_ACCEPTANCE_CLAIM'})
save(work/'PREPARED.json',{'sources':{k:str(v) for k,v in sources.items()},'destinations':{k:str(v) for k,v in destinations.items()},'authority':'ALL_FALSE_PENDING','op':op})
print(json.dumps({'status':'PREPARED_NO_RUN','paths':{k:str(v) for k,v in destinations.items()}}))
