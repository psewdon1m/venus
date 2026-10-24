from pathlib import Path
import json,hashlib,datetime,shutil
R=Path('C:/.projects/venus');O=Path(__file__).parent;load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ack=load(R/'.artifacts/p05-oci37-a25-root-ack01.json');a=ack['shared_resource_authority'];rp=Path(a['fresh_prelaunch_path']);ra=Path(a['path']);rr=Path(a['review_path']);p=load(rp);r=load(ra);review=load(rr)
assert sha(rp)==a['fresh_prelaunch_sha256']and sha(ra)==a['sha256']=='01fe84029ea2cef6b30b553702ef0ae7c76af9580a19475b4529ac90d4e3e66b'and sha(rr)==a['review_sha256']=='da82fdb47511a549aaef5361f7b48529b3d17be7bdb18bd94bfda673cbc0fffc'
assert review['resource_authority_sha256']==sha(ra)and review['status']=='PASS_METHOD_ONLY'
age=(datetime.datetime.fromisoformat(ack['issued_at'])-datetime.datetime.fromisoformat(p['observed_at'])).total_seconds();assert 0<=age<=60 and p['bounds']=='PASS'and p['new_envelope_CPU']==4
manifest=R/'.artifacts/p05-full-original-resume05/MANIFEST.json';m=load(manifest);assert sha(manifest)==p['statistics_manifest_sha256']=='beacb3659d04aa39299afd2e06f1811f0191974e44f621a85a35c205be4ccd5a'
allowed={x['owner']for x in m['jobs']};stats=[x for x in p['running_container_resources']if x['owner']is not None];foreign=[x for x in p['running_container_resources']if x['owner']is None];assert len(stats)==p['statistics_workers_observed']==8 and all(x['owner']in allowed and x['cpus']==1 and x['memory_bytes']==1610612736 and x['pids_limit']==64 for x in stats)
assert sorted(x['id']for x in foreign)==p['foreign_running_ids']==r['foreign_running_ids_expected']and len(foreign)==0
actual=sum(float(x['CPUPerc'].rstrip('%'))for x in p['actual_stats'])/100;assert actual+4+2<=p['docker_cpus'];assert 8*1610612736+sum(x['memory_bytes']for x in foreign)+3758096384+4294967296<=p['docker_memory_bytes'];assert p['disk_free_bytes']>=42949672960
raw=R/'.artifacts/p05-pilot-bundle-source22/.artifacts/p05/venus-p05-oci-c1a84717e07b';expanded=load(raw/'inputs/actual-image-maps.json');assert [len(expanded['maps'][x]['files'])for x in ['A','B']]==[81,78]
for phase in ['A1','B2','A3']:
 d=load(raw/'evidence'/('phase-'+phase+'-terminal.json'));assert len(d['actual_image']['files'])==(78 if phase=='B2' else 81)
extra={}
for f in [rp,ra,rr,manifest]:extra[str(f)]={'bytes':f.stat().st_size,'sha256':sha(f)}
shutil.copyfile(rp,O/'raw/preflight01.json');shutil.copyfile(ra,O/'raw/resource-authority11.json')
out={'status':'PASS_SAVED_ROOT_PREFLIGHT_BINDINGS_ONLY_NOT_NEW_LIVE_OBSERVATION','fresh_metadata_age_seconds_at_ACK':age,'stats_workers':8,'stats_unchanged_caps':[1,1610612736,64],'stats_exact_active_manifest_owners':True,'active_manifest_sha256':sha(manifest),'foreign_exact_readonly_baseline':r['foreign_running_ids_expected'],'actualCPU_prestart':actual,'new_conservative_OCI_CPU_envelope':4,'spareCPU':2,'memory_and_disk_bounds':True,'actual_phase_map_counts':[81,78,81],'pins':extra,'new_Docker_or_native_actions':0}
(O/'PREFLIGHT-AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps({'status':out['status'],'age_s':age,'stats':8,'CPU':actual,'maps':[81,78,81]}))

