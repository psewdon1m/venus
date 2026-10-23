"""Author preparation: exact readonly source copies; never Docker/engine/DB execution."""
from pathlib import Path
import json,hashlib,sys
ROOT=Path.cwd().resolve();OUT=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest();target=OUT/'pinned-inputs';target.mkdir(exist_ok=True)
files=['tests/p05-topic-lifecycle/harness.mjs','tests/p05-topic-games/fixtures.mjs','tests/p05-topic-games/context-fixture.mjs','tests/p03/fixtures.mjs','.artifacts/p05-topic-restore/observations.mjs','.artifacts/p05-topic-restore/replay-observations.mjs','tests/fixtures/p02-test-cert.pem','tests/fixtures/p02-test-key.pem']
records=[]
for name in files:
    raw=(ROOT/name).read_bytes();copy=name.replace('/','__')+'.bytes';p=target/copy
    if p.exists():assert p.read_bytes()==raw
    else:p.write_bytes(raw)
    records.append({'source':name,'copy':'pinned-inputs/'+copy,'sha256':sha(raw),'bytes':len(raw)})
current=json.loads((ROOT/'.docs/implementation/reviews/p05/topic-renewal-regression-audit-round01/inputs/image-build-receipt.json').read_bytes());prior=json.loads((ROOT/'.artifacts/p05-grant-phase-image-build-receipt01.json').read_bytes())
assert current['host_compiled_files_sha256']==prior['host_compiled_files_sha256'] and len(current['host_compiled_files_sha256'])==64
sys.path.insert(0,str(ROOT/'tools'));import stage_inventory
inventory=stage_inventory.inventory(ROOT);identity=stage_inventory.identity(inventory);assert identity=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad' and len(inventory)==1813
(OUT/'included-inputs.json').write_text(json.dumps({'identity':identity,'files':inventory},indent=2)+'\n',encoding='utf8')
(OUT/'dependency-pins.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
proposal=json.loads((ROOT/'.docs/implementation/reviews/p05/previous-oci-rollback-proposal-round01/proposal.json').read_bytes())
binding={'schema_version':1,'status':'AUTHOR_IMPLEMENTATION_RESOURCE_DEPENDENCY_NOT_READY','root_run_ack':False,'source_identity':identity,'prior_source_identity':prior['source_identity'],'included_files':1813,'images':{'A':current['image'],'B':prior['image']},'previous_candidate_approved_known_good':False,'previous_known_UI_bug':'passive expiry renewal availability','compiled_files':current['host_compiled_files_sha256'],'receipt_image_maps':{'A':current['image_files_sha256'],'B':prior['image_files_sha256']},'mandatory_controls':proposal['mandatory_controls'],'budget_mib':proposal['artifact_file_allocation_budget_mib'],'total_mib':512,'reserve_bytes':10*1024**3,'attempt_limit_ms':900000,'expanded_actual_image_UI_migration_maps':'NOT_READY_REQUIRES_READONLY_PREPARATION_AFTER_ROOT_AUTHORIZATION','resource_guard':{'status':'NOT_READY','module':None,'sha256':None,'API':'startOCIResourceGuard(plan): api_version P05_OCI_EXTERNAL_RESOURCE_GUARD_1, external_process_pid; beforeMutation/terminalReport/finish/stop. Continuous actual host+native allocated/free-space, prospective writes and owned failure/cleanup deadlines. Must create control/guard.json for ResourceLease; no weak local substitute.'},'synthetic_content_only':True,'human450':'HOLD_UNCHANGED','full_P05_PASS':False}
binding['metadata_profile']={'amendment_sha256':sha((ROOT/'.docs/implementation/reviews/p05/oci-rollback-author-preparation-round01/PROPOSAL_DELTA.md').read_bytes()),'production_build_metadata_may_be_absent':True,'VersionDTO':'EXPLICIT_SYNTHETIC_FIXTURE_CONFIGURED_NOT_PRODUCTION_METADATA','source_provenance':'PINNED_EXTERNAL_RECEIPTS_PLUS_ACTUAL_IMAGE64_UI_MIGRATION_MAPS'}
for case in binding['mandatory_controls']:
    if case['id']=='OCI01':case['expected']='Actual image IDs/optional labels+metadata, pinned external provenance,64compiled/UI/migration maps; no overlay; metadata absence explicit.'
    if case['id']=='OCI02':case['expected']='Actual protectedHTTPS index/asset bytes match image; VersionDTO is explicitly fixture-configured/image-bound, not production build metadata.'
(OUT/'BINDING.json').write_text(json.dumps(binding,indent=2)+'\n',encoding='utf8')
(OUT/'ROOT_RUN_ACK.json').write_text(json.dumps({'status':'NOT_AUTHORIZED','root_run_ack':False,'producer_index_sha256':None,'expanded_image_map_sha256':None,'resource_guard_sha256':None,'attempts':1,'statistics_RUN':False},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':'AUTHOR_INPUTS_CAPTURED_NO_RUNTIME','source_identity':identity,'included':len(inventory),'dependency_count':len(records),'compiled64_equal':True,'Docker_commands':0}))
