from pathlib import Path
import hashlib,json,datetime
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
S=R/'.artifacts/p05-pilot-bundle-source15';C=S/'.artifacts/p05-compatible-rollback-producer28';P=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer27';raw=S/'.artifacts/p05/venus-p05-oci-58825426c411'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
ackfile=R/'.artifacts/p05-a18-compatible-rollback28-root-ack01.json'
assert pin(ackfile)['sha256']=='d19f0a9073398b549464fb1190e67969c7340d349683580126c50e2382605d2d'
ack=read(ackfile);binding=read(C/'BINDING.json');ci=read(C/'INDEX.json');pi=read(P/'INDEX.json');freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze15.json')
assert ack['source_identity']==ci['source_identity']==freeze['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'
assert ack['images']==binding['images']=={'A':'sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616','B':'sha256:62602920f998e1e971d3f8f9dd55c706217e4e00a50bcee2d056cbf6d94c8903'}
mjs=[n for n in ci['files'] if n.endswith('.mjs')];assert len(mjs)==40 and set(mjs)=={n for n in pi['files'] if n.endswith('.mjs')}
for n,v in ci['files'].items():
 assert v['type']=='regular_file' and pin(C/n)=={k:v[k] for k in ['bytes','sha256']}
for n in mjs:
 assert (C/n).read_bytes()==(P/n).read_bytes()==(raw/'inputs'/n).read_bytes()
for n,h in freeze['files'].items():assert pin(S/n)['sha256']==h
assert len(freeze['files'])==1872
r=read(raw/'runner.json');quota=read(raw/'actual-native-quotas.json');profile=r['resource']['profile'];terminal=read(raw/'TERMINAL.json')
assert quota['accounting']==profile and profile['whole_ms']==900000 and profile['work_ms']==780000 and profile['cap_mib']==512 and profile['host_cap_mib']==96 and profile['native_reserved_mib']==380 and profile['reserve_gib']==10
assert quota['expected_mib']=={'/retained-db':240,'/authority':32,'/private':8,'/evidence':64}
assert all(int(quota['observed_bytes'][n])==v*1024**2 for n,v in quota['expected_mib'].items())
assert [x['phase'] for x in r['resource']['phase_preflights']]==['setup','A1','B2','A3','cleanup']
assert all(min(int(x['host_free_bytes']),int(x['native_free_bytes']))>10*1024**3+512*1024**2 for x in r['resource']['phase_preflights'])
assert len({p['terminal']['process_nonce'] for p in terminal['phase_terminals']})==3
assert [c['id'] for c in r['controls']]==[f'OCI{i:02}' for i in range(1,15)] and all(c['status']=='PASS' and all(c['proof'].values()) for c in r['controls'])
d={'status':'PASS_CURRENT_ACK_SOURCE_RUNTIME_RESOURCE_BINDINGS','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'external_ACK':{'path':str(ackfile),**pin(ackfile)},'accepted_parent_actual':pin(R/'.docs/implementation/reviews/p05/oci27-a17-actual-independent-round01/INDEX.json'),'combined_current_binding_review':pin(Path(ack['independent_review_index'])),'source_freeze':pin(R/'.artifacts/p05-pilot-bundle-source-freeze15.json'),'source_materialized_files_rehashed':1872,'current_producer_files_rehashed':len(ci['files']),'recursive_MJS_raw_exact_parent27_and_executed_inputs':40,'current_producer_INDEX':pin(C/'INDEX.json'),'controls_exact_order_all_proofs_true':14,'distinct_phase_process_nonces':3,'hard_quota_accounting_exact':True,'native_actions':0,'findings':[]}
(O/'BINDINGS-AUDIT.json').write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8');print(json.dumps(d))
