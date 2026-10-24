from pathlib import Path
import hashlib,json,re,shutil,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;raw=R/'.artifacts/p05-pilot-bundle-source17/.artifacts/p05/venus-p05-oci-e5faee7e9085';C=R/'.artifacts/p05-pilot-bundle-source17/.artifacts/p05-compatible-rollback-producer31'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
r=read(raw/'runner.json');t=read(raw/'TERMINAL.json');ack=read(raw/'authority-ack.json');binding=read(C/'BINDING.json');plan=read(raw/'plan.json')
assert r['status']==t['status']=='PASS_BOUNDED_SYNTHETIC_OCI_ROLLBACK'and r['cleanup']==t['cleanup']=='completed'
assert r['source_producer_unchanged']and r['error_name']is None and all(t[n]is None for n in ['first_error','export_error','cleanup_error'])
assert r['remaining_owned']==t['remaining_owned']==read(raw/'owned-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]}
assert r['actual_execution']and r['DB_restore']is False and r['external_roots_rolled_back']is False and r['full_P05_PASS']is False and r['production_approval']is False and r['human450']=='HOLD_UNCHANGED'
assert ack['attempts']==1 and ack['statistics_RUN']is False and ack['root_run_ack']is True
assert ack['producer_index_sha256']==pin(C/'INDEX.json')['sha256']=='057b3bac1bbddbe2f161b3a39f2e09cac7877597b9b22a7a23851c592eb21577'
assert ack['independent_review_index_sha256']=='0c0afaccd3251b810008bf6bf8491bb5d44a98d2cc862564a7428e18dbfa612b'
for field in ['independent_review_index','application_source_review_index']:assert pin(Path(ack[field]))['sha256']==ack[field+'_sha256']
external=R/'.artifacts/p05-oci31-a20-root-ack01.json';assert read(external)==ack
ph={p:read(raw/f'evidence/phase-{p}-terminal.json')for p in ['A1','B2','A3']};expanded=read(raw/'inputs/actual-image-maps.json')
for phase,d in ph.items():
 key='B'if phase=='B2'else'A';assert d['status']=='PHASE_COMPLETE'and d['pool_closed']and d['synthetic_only']and d['full_P05_PASS']is False
 assert d['image']==r['images'][key]==binding['images'][key]and d['actual_image']['files']==expanded['maps'][key]['files']
 assert d['actual_image']['compiled64']and d['actual_image']['additional_modules_verified']and d['version_DTO_bound']and d['actual_TLS_CA_verified']and len(d['served_UI'])>=3
 assert d['boot']['private_scopes_revoked']and d['boot']['corrupt_sessions_aborted']==d['boot']['unsupported_sessions_aborted']==0
 assert d['elapsed_ms']<120000
 assert read(raw/f'attached-{phase}-terminal.json')['status']=='PHASE_COMPLETE'
 assert t['phase_terminals'][['A1','B2','A3'].index(phase)]['code']==0
a,b,c=ph['A1'],ph['B2'],ph['A3'];assert all(a['seed'][k]for k in ['real_admissions','A_D_private_positive','nonselected_host_denied','observer_denied','auth_CSRF_Origin_negatives'])
assert a['narrow']['HTTP_narrow_close_leave']and a['narrow']['authority_advanced']and a['narrow']['D_live_before_switch']['live_invitation_action_topic_advice_chat']
replay_summary={}
for phase,d in [('B2',b),('A3',c)]:
 assert d['migration_only']['all_user_rows_equal']and d['migration_only']['all_sequences_equal']and d['authority_before_after_boot_equal']and all(d['preserved'].values())
 live=d['live_before_boot'];assert live['live_invitation_action_topic_advice_chat']and live['live_projection_count']==live['private_ref_count']==2 and min(live['remaining_ms'].values())>0
 revoke=d['raw_revoked'];assert revoke['raw_round_stopped']and revoke['invitation_action_acks_cleared']and revoke['private_objects']==revoke['private_refs']==0 and revoke['snapshot_history_unchanged']and revoke['observed_before_legacy_maintain_listen_or_private_http']
 rows=d['replay'];assert [x['kind']for x in rows]==['read']*3+['revoked_round_view']+['exact_and_new_ID']*9
 assert all(x['status']in [404,409]for x in rows[:3])
 pairs=rows[4:];assert all(x['fresh_status']==409 and x['new_receipts']==0 and x['status']in [200,409]for x in pairs)
 for x in pairs:
  for e in [x['effect'],x['freshEffect']]:assert e['all_other_tables_sequences_and_authority_equal']and e['raw_grants_still_revoked']['raw_round_stopped']and e['raw_grants_still_revoked']['private_objects']==e['raw_grants_still_revoked']['private_refs']==0
 assert sum(x['status']==200 for x in pairs)==8 and pairs[-1]['status']==409
 view=rows[3]
 if phase=='B2':assert view['status']==404 and view['endpoint']=='ABSENT_B4'and view['version_bound_NA']and view['effects']['absent_route_exact_no_effects']and view['effects']['admission_counter_increment']==0
 else:assert view['status']==200 and view['endpoint']=='A3_BUNDLED'and view['safe_own_only']and view['private_parts_null']
 replay_summary[phase]={'rows':13,'reads':3,'version_bound_view':view['status'],'exact_and_new_pairs':9,'exact_receipt200':8,'chat_denied409':1,'fresh_denials409':9,'new_receipts':0}
assert b['new_E']['fresh_bilateral_private_positive']and b['new_E']['same_synthetic_pins']and b['new_E']['live_before_switch']['live_invitation_action_topic_advice_chat']
assert b['fresh_B_operational_fixture']=={'label':'F','separate_from_untouched_E':True,'created_by':'UNCHANGED_ACTIVE_PRIVATE_ONE_SESSION20','untouched_oracle':False}
assert all(c['final_current'].values())and r['quiescent']==[{'phase':p,'API_clients':0}for p in ['A1','B2','A3']]
browser=read(raw/'evidence/browser-terminal.json');assert browser==r['browser']and browser['status']=='BROWSER_CONTROLS_COMPLETE'and browser['cleanup']=='completed'and browser['page_errors']==0
assert all(browser[k]for k in ['actual_B_UI','retained_A_cleared','fresh_B_page','browser_safe_exit','old_B_private_cleared_on_A3'])and browser['closed_host_gate']['context_closed']and browser['raw_private_evidence_exported']is False
resource=r['resource'];assert resource['status']=='PASS_QRB_BOUND_ONLY_PROFILE'and resource['failure']is None and resource['profile']['revision']=='QRB_BOUND_ONLY_2_BROWSER_PIDS256'and resource['profile']['PID_limits']=={'browser':256,'other_roles':128,'native_free':32}
assert resource['host_allocated_peak']<96*1024**2 and resource['host_controller_peak_sampled_rss']<256*1024**2 and t['whole_elapsed_ms']<900000
# Project saved native inspections to non-secret resource/identity fields only. Never access ENV.
inspections=[]
for p in sorted((raw/'logs').glob('*.json')):
 prefix=''
 with p.open(encoding='utf-8-sig')as f:
  for line in f:
   prefix+=line
   if re.search(r'"code"\s*:',line):break
 m=re.search(r'"arguments"\s*:\s*(\[.*?\])\s*,\s*"code"\s*:\s*(-?\d+|null)',prefix,re.S)
 if not m:continue
 args=json.loads(m.group(1))
 if len(args)==2 and args[0]=='inspect'and args[1].startswith(plan['project']+'-'):
  entries=json.loads(read(p)['stdout'])
  for entry in entries:
   role=entry['Config']['Labels']['com.venus.oci.role'];h=entry['HostConfig'];expected=256 if role=='browser' else 128
   expected_image=read(raw/'postgres-image-binding.json')['image_id'] if role=='db' else plan['roles'][role]
   assert h['PidsLimit']==expected and entry['Config']['Labels']['com.venus.oci.owner']==r['owner']and entry['Image']==expected_image
   if role=='browser':assert h['Memory']==h['MemorySwap']==1536*1024**2 and h['NanoCpus']==1000000000
   inspections.append({'log':p.name,'role':role,'image':entry['Image'],'PidsLimit':h['PidsLimit'],'memory_bytes':h['Memory'],'nano_cpus':h['NanoCpus'],'readonly':h['ReadonlyRootfs']})
assert any(x['role']=='browser'and x['PidsLimit']==256 for x in inspections)
sn=['source-A1-before.json','source-B2-before.json','source-A3-before.json','source-after-runtime.json','source-after-finally.json'];ss=[read(raw/n)for n in sn];freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze17.json');assert all(x==ss[0]for x in ss)and ss[0]['files']==freeze['files']and len(freeze['files'])==1874
pn=['producer-A1-before.json','producer-B2-before.json','producer-A3-before.json','producer-after-runtime.json','producer-after-finally.json'];ps=[read(raw/n)for n in pn];assert all(x==ps[0]for x in ps)and ps[0]==read(C/'INDEX.json')['files']
assert read(R/'.artifacts/p05-oci31-a20-run01.exit.json')['exit_code']==0
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';check=subprocess.run([node,str(O/'audit-contract.mjs')],cwd=R,capture_output=True,timeout=30);(O/'contract.stdout.txt').write_bytes(check.stdout);(O/'contract.stderr.txt').write_bytes(check.stderr);assert check.returncode==0,check.stderr.decode()
safe=['runner.json','TERMINAL.json','owned-after-cleanup.json','authority-ack.json','plan.json','RAW_INDEX.json','actual-native-quotas.json','ipc-db-runtime.json','postgres-image-binding.json']+[f'attached-{p}-terminal.json'for p in ph]+[f'evidence/phase-{p}-terminal.json'for p in ph]+['evidence/browser-terminal.json','evidence/browser-A1-ready.json','evidence/browser-narrowed-ready.json','evidence/browser-B2-ready.json']
dest=O/'raw';dest.mkdir(exist_ok=True)
for n in safe:
 p=dest/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(raw/n,p)
for n in ['p05-oci31-a20-run01.txt','p05-oci31-a20-run01.exit.json']:shutil.copyfile(R/'.artifacts'/n,dest/n)
(O/'NATIVE-INSPECTIONS.json').write_text(json.dumps({'scope':'RESOURCE_IDENTITY_PROJECTION_NO_ENV_OR_RAW_INSPECT','records':inspections},indent=2)+'\n')
(O/'INPUT-PINS.json').write_text(json.dumps({'external_ack':{'path':str(external),**pin(external),'semantic_equal_export':True},'source_producer_snapshots':{n:pin(raw/n)for n in sn+pn},'producer_index':pin(C/'INDEX.json'),'method_index':pin(Path(ack['independent_review_index'])),'executed_runtime':{n:pin(raw/'inputs'/n)for n in ['api-child.mjs','host-runner.mjs','browser-child.mjs','scenarios.mjs','contract.mjs','bound-profile.mjs']},'safe_exports':{n:pin(raw/n)for n in safe}},indent=2)+'\n')
d={'status':'PASS_COMPONENT_ONLY','source_identity':ack['source_identity'],'included_files':1874,'images':ack['images'],'owner':r['owner'],'project':r['project'],'controls':14,'all_phase_complete_exit0':True,'replay':replay_summary,'resource_profile':resource['profile']['revision'],'PID_limits':resource['profile']['PID_limits'],'whole_elapsed_ms':t['whole_elapsed_ms'],'phase_elapsed_ms':{p:d['elapsed_ms']for p,d in ph.items()},'host_allocated_peak_bytes':resource['host_allocated_peak'],'sampled_host_RSS_peak_bytes':resource['host_controller_peak_sampled_rss'],'safe_export_files':len(safe)+2,'raw_index_entries':len(read(raw/'RAW_INDEX.json')['files']),'contract_validation_exit':check.returncode,'cleanup':'COMPLETED_OWNED_EMPTY','all_errors':None,'source_producer_snapshots_exact':True,'DB_restore':False,'external_roots_rollback':False,'browser_context':'FIXED_SYNTHETIC_CLOCK_NOT_ORDINARY470','old128_failure_or_cause_rewritten':False,'native_actions':0,'full_P05_or_production_PASS':False}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d))
