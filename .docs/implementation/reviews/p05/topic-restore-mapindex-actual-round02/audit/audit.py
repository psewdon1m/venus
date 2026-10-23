from pathlib import Path
import json,hashlib,datetime,shutil,sys,subprocess,zipfile,copy,collections
root=Path.cwd();p=root/'.docs/implementation/evidence/p05/mapindex-topic-restore-preflight-01';run=p/'run';base=root/'.artifacts/p05-topic-restore-mapindex-actual-review-round02';out=root/'.docs/implementation/reviews/p05/topic-restore-mapindex-actual-round02'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'index.json')=='a9f00f7e060e0c2eac46c454ec6557e1e273c5b5d1841ff14c7e0c711b8b7b8b';idx=read(p/'index.json')
for f in idx['files']:assert sha(p/f['path'])==f['sha256']and(p/f['path']).stat().st_size==f['bytes'],f['path']
assert sha(p/'image-build-receipt.json')=='20a6942b5a7f6ebd099ff75688bbf32da479ebed82b4991fa87ea6c7e95cb079';receipt=read(p/'image-build-receipt.json');assert sha(p/'build-log.txt')==receipt['build_log_sha256'];assert receipt['source_identity']==idx['source_identity']and receipt['image']==idx['image']
r=read(run/'restore-runtime.json');runner=read(run/'runner.json');children=[read(run/f'child-phase{i}.json')for i in[1,2,3]];maps=[read(run/n)for n in['inputs-before.json','inputs-after-runtime.json','inputs-after-finally.json']];pins=[read(run/n)for n in['producer-pins-before.json','producer-pins-after-runtime.json','producer-pins-after-finally.json']]
assert maps[0]['files']==maps[1]['files']==maps[2]['files'];assert pins[0]==pins[1]==pins[2]
for n,v in pins[0].items():
 if v['type']=='regular_file':assert sha(run/'producer'/n)==v['sha256'],n
assert sha(run/'producer/HANDOFF.json')=='a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b';assert sha(run/'producer/run.mjs')=='07302963889e5f9cdf88acaee02f07881b002d642ca72bd61e4d46ad32ffe035';assert sha(run/'producer/BINDING.json')=='989d1dd3f5f73afb9f8de005c5d25bc05439cb63cb2cc4ea18c042985398258e';assert sha(run/'producer/ROOT_RUN_ACK.json')=='e0eb688743ae12282bf3c8c721f7766692806856617a477edec8fb6718559a81'
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
current=inventory();assert maps[0]['files']==current;assert identity(current)==idx['source_identity']=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4';assert len(current)==1813
archive=(p/idx['source_archive']).resolve();assert sha(archive)==idx['source_archive_sha256']=='064a04d912452d2c20afd5503c3be57016640610a46ba8bf7f244d7208ff486f'
with zipfile.ZipFile(archive)as z:
 assert set(z.namelist())==set(current)
 for n,v in current.items():assert hashlib.sha256(z.read(n)).hexdigest()==v,n
def valid_runtime(value):
 assert value['status']=='PASS'and value['runtime_cleanup']=='completed';checks=value['checks'];assert len(checks)==14;ids=[x['id']for x in checks];assert len(set(ids))==14 and set(ids)=={f'P05-RESTORE-{i:02}'for i in range(1,15)}and all(x['status']=='PASS'for x in checks);d={x['id']:x['detail']for x in checks}
 assert d['P05-RESTORE-03']['format']=='custom'and d['P05-RESTORE-03']['entire_database']and d['P05-RESTORE-03']['api_connections']==0 and d['P05-RESTORE-03']['exit_code']==0
 assert value['raw_restored']['all_user_rows_equal']and value['raw_restored']['all_sequences_equal'];assert value['pre_dump']['tables']==value['raw_restored']['tables'];assert len(value['pre_dump']['tables'])==33
 assert value['pre_dump']['authority']!=value['post_mutation']['authority'];assert d['P05-RESTORE-07']['exact_tree']==value['post_mutation']['authority'];assert d['P05-RESTORE-07']['all_five_roots_and_legacy_deletion_ledger_equal']and d['P05-RESTORE-07']['D_original_roots_unchanged'];assert value['post_mutation']['D_authority_unchanged']
 assert d['P05-RESTORE-06']['observed_before_third_boot']and d['P05-RESTORE-06']['api_connections']==0 and d['P05-RESTORE-06']['exit_code']==0
 assert len(value['children'])==3 and len({c['pid']for c in value['children']})==3
 for c in value['children']:
  report=c['report'];assert c['exit_code']==0 and c['exit_signal']is None and not c['timed_out']and report['status']=='PASS'and report['runtime_cleanup']=='completed';assert report['pid']==c['pid'];assert report['server_time_ms']==1000000+(c['phase']-1)*1000
  if c['phase']>1:
   times={x['stage']:x['native_elapsed_ms']for x in report['chronology']};order=['raw_D_live_before_boot','actual_bootGate_returned','raw_D_revocation_observer_completed','legacy_reconcile_completed','Rooms_maintain_completed','listener_opened','protected_phase_completed','app_pool_closed_authority_preserved'];assert all(times[a]<times[b]for a,b in zip(order,order[1:]));assert all(v>0 for v in report['before_D']['remaining_ms'].values());assert report['before_D']['live_invitation_action_topic_advice_chat']and report['before_D']['live_projection_count']==2 and report['before_D']['private_ref_count']>0;boot=report['raw_boot_D'];assert boot['raw_round_stopped']and boot['invitation_action_acks_cleared']and boot['private_objects']==boot['private_refs']==0 and boot['snapshot_history_unchanged']
 assert d['P05-RESTORE-14']['fixed_forward_server_times']==[1000000,1001000,1002000]and all(v>0 for v in d['P05-RESTORE-14']['restored_D_unexpired_before_boot']['remaining_ms'].values());assert d['P05-RESTORE-13']['valid_untouched_D_credentials']==2
 ev=d['P05-RESTORE-13']['replay_evidence'];assert collections.Counter(e['kind']for e in ev)=={'private_read':3,'nonchat_exact_retry':8,'old_chat_exact_retry':1,'old_tuple_new_request_id':9}
 for e in ev:
  fx=e['effects'];assert set(fx['changed_tables'])<={'public.admission_limits','public.game_rounds'};a=fx['admission_accounting'];assert a['expected_member_scope_only']and a['same_window']and a['request_counter_increment']==1 and fx['all_other_tables_sequences_and_authority_equal'];assert fx['raw_grants_still_revoked']['private_objects']==fx['raw_grants_still_revoked']['private_refs']==0;assert len(fx['revocation_only_round_rewrites'])<=1
  if e['kind']=='nonchat_exact_retry':assert e['status']==200 and e['receipt']['canonical_full_receipt_equal']and e['receipt']['original_receipt_sha256']==e['receipt']['actual_receipt_sha256'];assert fx['revocation_only_round_rewrites']==[]
  else:assert e['status']==409
  if e['kind']=='old_tuple_new_request_id':assert e['new_receipts']==0
 fault=value['children'][2]['report']['http_status_observations'];assert len(fault)==1;f=fault[0];assert f['expected_http_status']==f['actual_http_status']==503 and f['code']=='TOPIC_STORAGE_UNAVAILABLE'and f['owned_path_verified']and f['fault_path_absent_before']and f['fault_path_absent_after']and f['assertion_completed'];assert not value['children'][2]['report']['http_status_overflow'];assert d['P05-RESTORE-12']['not_rebuilt']and d['P05-RESTORE-12']['exact_bytes_restored']and d['P05-RESTORE-12']['recovery200']
valid_runtime(r);assert all(children[i]==r['children'][i]for i in range(3));assert runner['status']=='PASS'and runner['cleanup']=='PASS'and runner['error']is None and runner['source_and_producer_unchanged'];assert idx['observed_exit_code']==0
neg=[]
for defect in['duplicateID','sequencefalse','tablehash','externalroots','expiredD','bootorder','wrongreceipt','newreceipt','counter2','revivedprivate','HTTP500']:
 v=copy.deepcopy(r);d={x['id']:x['detail']for x in v['checks']}
 if defect=='duplicateID':v['checks'][0]['id']=v['checks'][1]['id']
 if defect=='sequencefalse':v['raw_restored']['all_sequences_equal']=False
 if defect=='tablehash':v['raw_restored']['tables'][0]['sha256']='bad'
 if defect=='externalroots':d['P05-RESTORE-07']['exact_tree']={}
 if defect=='expiredD':next(iter(v['children'][2]['report']['before_D']['remaining_ms'].keys()));v['children'][2]['report']['before_D']['remaining_ms']['injected']=0
 if defect=='bootorder':next(x for x in v['children'][2]['report']['chronology']if x['stage']=='listener_opened')['native_elapsed_ms']=1
 if defect=='wrongreceipt':next(e for e in d['P05-RESTORE-13']['replay_evidence']if e['kind']=='nonchat_exact_retry')['receipt']['actual_receipt_sha256']='bad'
 if defect=='newreceipt':next(e for e in d['P05-RESTORE-13']['replay_evidence']if e['kind']=='old_tuple_new_request_id')['new_receipts']=1
 if defect=='counter2':d['P05-RESTORE-13']['replay_evidence'][0]['effects']['admission_accounting']['request_counter_increment']=2
 if defect=='revivedprivate':d['P05-RESTORE-13']['replay_evidence'][0]['effects']['raw_grants_still_revoked']['private_objects']=1
 if defect=='HTTP500':v['children'][2]['report']['http_status_observations'][0]['actual_http_status']=500
 rejected=False
 try:valid_runtime(v)
 except AssertionError:rejected=True
 assert rejected,defect;neg.append({'id':defect,'status':'REJECTED_AS_REQUIRED'})
resources={}
for kind,args in[('containers',['ps','-aq']),('volumes',['volume','ls','-q']),('networks',['network','ls','-q'])]:
 result=subprocess.run(['docker',*args,'--filter','label=venus.p05.project='+r['run_id']],capture_output=True,text=True);assert result.returncode==0 and not result.stdout.strip();resources[kind]={'exit_code':0,'remaining':[]}
for n in['remaining-containers.txt','remaining-volumes.txt','remaining-networks.txt']:assert not(run/n).read_text().strip()
compose=read(run/'compose.json');assert compose['services']['api']['labels']['venus.p05.project']==r['run_id']and compose['services']['api']['labels']['venus.p05.role']=='controller';assert compose['services']['db']['labels']['venus.p05.project']==r['run_id'];assert compose['volumes']['postgres-data']['labels']['venus.p05.project']==r['run_id'];assert compose['networks']['isolated']['labels']['venus.p05.project']==r['run_id']
for n in['before-dump-connections-0.txt','before-restore-connections-0.txt']:assert(run/n).read_text().strip()=='0'
dump=read(run/'DUMP_COMPLETE.json');restore=read(run/'RESTORE_COMPLETE.json');assert dump['dump_sha256']==restore['dump_sha256']==r['checks'][2]['detail']['dump_sha256'];assert dump['dump_bytes']==2751347 and dump['exit_code']==restore['exit_code']==0 and dump['whole_database']and restore['whole_database'];assert(run/'dump-sha.txt').read_text().split()[0]==dump['dump_sha256'];assert(run/'controller-wait.txt').read_text().strip()=='0'
for i in[1,2,3]:
 proof=read(run/f'fixture-proof-phase{i}.json');assert proof['original_sha256']==current['tests/p05-topic-lifecycle/harness.mjs'];assert proof['derivative_sha256']==sha(run/'harness-derivative.mjs');assert len(proof['semantic_replacements'])==7 and not proof['auth_or_grant_substitution']
(base/'negative-controls.json').write_text(json.dumps(neg,indent=2)+'\n');(base/'current-owned-resources.json').write_text(json.dumps(resources,indent=2)+'\n')
out.mkdir(parents=True,exist_ok=False);(out/'evidence').mkdir();(out/'audit').mkdir()
for n in['index.json','receipt.json']:shutil.copyfile(p/n,out/'evidence'/n)
for n in['restore-runtime.json','runner.json','child-phase1.json','child-phase2.json','child-phase3.json','DUMP_COMPLETE.json','RESTORE_COMPLETE.json','fixture-proof-phase3.json']:shutil.copyfile(run/n,out/'evidence'/n)
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'audit'/q.name)
report={'schema_version':1,'status':'BOUNDED_ACTUAL_MAPINDEX_RESTORE_AND_STORAGE503_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','root_producer_author':'/root/p05_topics_ui','root_actual_runner':'/root','actual_index_sha256':sha(p/'index.json'),'actual_files_verified':len(idx['files']),'source_identity':identity(current),'included_files':len(current),'image':idx['image'],'findings':[],'newsource_regression_audit_not_priorPASS_promotion':True,'supersedes_narrative_metadata_only':{'prior_index':'0e51524ea6e648756c496a6bb33b2d4c1dc762f6765034c7958838975c6702dd','prior_path':'.docs/implementation/reviews/p05/topic-restore-mapindex-actual-round01','problem':'Prior narrative copied old1d dump bytes/hash; actual guard asserted correct2751347 and correctnewdumpcontinuity. Prior report preserved; this newround reruns exactguards with corrected narrative.'},'closed_product_finding':{'id':'TG-STORAGE-HTTP-001','scope':'Missing required personal-chain read through PrivateTopicPreferences returns sanitized503/no file creation on newsource; not all malformedstorage or otherregistryendpoints.'},'checks':{'distinct_controls_PASS':14,'distinct_real_Node_child_PIDs':[c['pid']for c in r['children']],'raw_user_table_summaries_equal':33,'full_sequence_definition_directstate_guard_executed':True,'prelisten_untouchedD_positive_and_boot_revocation':True,'externalroots_plus_legacy_deletion_ledger_preserved':True,'nonchat_exact200receipts_norevival':8,'oldchat_and_private_read409':4,'freshIDstale409_no_newreceipt':9,'own_tampered_evidence_controls_rejected':len(neg),'current_label_resources_empty':resources,'fullsourceZIP_and3source3producer_maps_equal':True},'limits':['Raw private DB rows, sequence values, credentials and original receipts stay in owned tmpfs and are intentionally not retained. Exact reviewed observer executes equality guards; independent audit recomputes all public table hashes/relationships and checks source/execution/metadata continuity, not private post-cleanup decryption.','Controlled forward fixture times1000000/1001000/1002000 prove unexpiredD control; native elapsed is recorded but this is not a natural-duration TTL soak.','Synthetic current-source realPG/HTTP/filesystem composition only; no encryptedP06export, compatiblepreviousOCIrollback,productiondeploymentorbackupretention proof.','Previous UNKNOWN and confirmed500 FAILs remain immutable; browser/fullP05/human450 separatelypending.'],'no_product_producer_Docker_mutations_or_functional_run_by_reviewer':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Mapindex actual restore — independent complete audit

**BOUNDED_ACTUAL_MAPINDEX_RESTORE_AND_STORAGE503_PASS.** All115 packet hashes,1813 source ZIP entries and complete source/producer maps before/runtime/finally were verified. Fourteen distinct controls pass on e9b9/image d316 with three successful Node children15/31/43. Eleven deliberately corrupted evidence variants are rejected by the independent audit.

Actual entire-DB custom dump is2751347 bytes, SHA369d5fab604fab04f3051f64aaf0675faf79e3a801a4cfdcebf464e1997b8fe3; dump/restore exit0 follow zero API connections. All33 raw table summaries match restored state. The exact observer includes full sequence definitions and direct last_value/is_called equality. External five roots and legacy deletion ledger survive DB rollback. D has all private scopes, two projections and future deadlines before boot; raw scope/ack/object/ref revocation occurs before reconcile/maintenance/listen in children2/3, retaining snapshot/history.

Eight exact old non-chat receipts return unchanged200 without effects beyond narrow admission accounting. Private reads/oldchat and nine fresh-ID old-tuple attempts return409, with zero new receipts and no grant revival; only identified stopped-round cipher/floor revocation effects occur. Missing owned personal chain now returns503 TOPIC_STORAGE_UNAVAILABLE, stays absent before/after the read, then exact restoration recovers200. This closes TG-STORAGE-HTTP-001 for that bounded endpoint/fault scope.

Cleanup succeeds, private configuration deletion is recorded, and independent read-only queries for this exact project label find no container/volume/network. The concurrent browser project was untouched. Raw private rows/sequence values/receipts stay tmpfs-only; their equality is checked by the pinned executed observer, not independently decrypted after cleanup. Controlled forward fixture time is explicit; no natural TTL soak, P06 export/previous-image rollback, production or fullP05/human450 acceptance is claimed. Both earlier FAILs remain preserved.
''',encoding='utf8');assert inventory()==current
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
