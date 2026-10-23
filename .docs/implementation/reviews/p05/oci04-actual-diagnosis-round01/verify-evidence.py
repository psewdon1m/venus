from pathlib import Path
import hashlib,json,sys
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;RUN=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-p05-oci-ffaaeef4fe2b';P=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume04';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8'))
plan=load(RUN/'plan.json');phase=load(RUN/'evidence/phase-A1-terminal.json');failure=load(RUN/'control/guard-failure.json');stop=load(RUN/'control/guard-stop.json')
owner='2bae434a9f866273ef7e1bfeaee54dc1';assert all(x['owner']==owner for x in [plan,failure,stop])
assert phase['status']=='FAIL' and phase['error']=={'name':'Error','code':'ERR_MODULE_NOT_FOUND'} and phase['chronology']==[]
assert 'EPERM: operation not permitted, rename ' in failure['reason'] and 'guard.json.next' in failure['reason'] and stop['failure']==failure['reason']
assert stop['status']=='NOT_ACCEPTED' and stop['external_native_probe_cleanup']=='completed' and not (RUN/'runner.json').exists()
assert (ROOT/'.artifacts/p05-recovery-oci04-run01-exit.txt').read_text().strip()=='1'
ack=load(ROOT/'.artifacts/p05-recovery-oci04-root-ack01.json');assert ack['producer_index_sha256']==sha(P/'INDEX.json') and ack['status']=='AUTHORIZED'
assert ack['resource_guard_sha256']==sha(P/'oci-resource-guard.mjs') and ack['expanded_image_map_sha256']==sha(P/'actual-image-maps.json')
binding=load(P/'BINDING.json');assert plan['images']==binding['images'] and binding['source_identity']==plan['source_identity']
for n,row in load(P/'INDEX.json')['source_map'].items():
 q=P/n
 if row['type']=='regular_file':assert q.stat().st_size==row['bytes'] and sha(q)==row['sha256']
 else:assert q.is_dir()
snapshot=P.parents[1];sys.path.insert(0,str(snapshot/'tools'));from stage_inventory import inventory,identity
files=inventory(snapshot);assert len(files)==1813 and identity(files)==plan['source_identity']
paths=[RUN/'plan.json',RUN/'evidence/phase-A1-terminal.json',RUN/'control/guard-failure.json',RUN/'control/guard-stop.json',ROOT/'.artifacts/p05-recovery-oci04-run01.txt',ROOT/'.artifacts/p05-recovery-oci04-run01-exit.txt',ROOT/'.artifacts/p05-recovery-oci04-root-ack01.json',ROOT/'.artifacts/p05-recovery-oci04-activation-witness01.json']
result={'status':'FAIL_EVIDENCE_AND_SOURCE_VERIFIED_DIAGNOSIS_ONLY','owner':owner,'input_pins':{p.relative_to(ROOT).as_posix():sha(p) for p in paths},'source_identity':identity(files),'included_files':1813,'active_producer_index_sha256':sha(P/'INDEX.json'),'original_A1_missing_message':'UNRECORDED_TYPIZED_ERR_MODULE_NOT_FOUND_ONLY','later_inert_import':'EXACT_PG_PACKAGE_LOCATION_FAILURE_REPRODUCED_SEPARATELY','actual_guard_errno':'EPERM','actual_lock_holder':'UNKNOWN','runner_json':'ABSENT_NOT_SYNTHESIZED','cleanup_executed':False,'full_stage_acceptance':False}
(OUT/'evidence-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'source_files':1813,'runner_json':'ABSENT','actual_cleanup':False}))
