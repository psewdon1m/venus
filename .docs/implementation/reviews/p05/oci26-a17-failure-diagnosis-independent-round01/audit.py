from pathlib import Path
import hashlib,json,re,shutil
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;raw=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-p05-oci-882db5f59870'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
t=read(raw/'TERMINAL.json');r=read(raw/'runner.json');plan=read(raw/'plan.json');ack=read(raw/'authority-ack.json');log=read(raw/'logs/0064.json')
assert t['status']==r['status']=='FAIL'and t['first_error']=={'name':'Error','code':None,'phase':'A3','source_module':'host-runner','source_line':42,'source_column':1348}
assert t['export_error']is None and t['cleanup_error']is None and t['cleanup']=='retained_manual_cleanup_required'and sum(map(len,t['remaining_owned'].values()))==7
assert [x['code']for x in t['phase_terminals']]==[0,0,137]and t['phase_terminals'][2]['terminal']is None
assert not(raw/'logs/unrecorded-command-failure.json').exists()
args=log['arguments'];assert args[:4]==['exec',plan['project']+'-browser','node','-e']and args[5]=='/private/browser-command-A3.json'
payload=json.loads(args[6]);assert payload=={'owner':plan['owner'],'command':'A3'}
assert log['code']==134 and log['stdout']==''and 'uv_thread_create(t.get(), start_thread, this)'in log['stderr']and 'DelayedTaskScheduler::Start()'in log['stderr']and 'node_platform.cc:109'in log['stderr']
host=(raw/'inputs/host-runner.mjs').read_text();line=host.splitlines()[41];assert line.index("Error('DOCKER_COMMAND_FAILED')")+1==1348
assert "await startAPI('A3');await waitFile('phase-A3-ready.json');await browserSignal('A3')"in host
assert read(raw/'evidence/phase-A3-ready.json')=={'status':'READY_FOR_STOP','phase':'A3'}
assert not(raw/'evidence/phase-A3-terminal.json').exists()and not(raw/'evidence/browser-terminal.json').exists()
for n in ['A1','B2']:assert read(raw/f'evidence/phase-{n}-terminal.json')['status']=='PHASE_COMPLETE'
headers=[]
for p in sorted((raw/'logs').glob('*.json')):
 prefix=''
 with p.open(encoding='utf-8-sig')as f:
  for z in f:
   prefix+=z
   if re.search(r'"code"\s*:',z):break
 m=re.search(r'"arguments"\s*:\s*(\[.*?\])\s*,\s*"code"\s*:\s*(-?\d+|null)',prefix,re.S);assert m
 a=json.loads(m.group(1));headers.append({'file':p.name,'verb':a[0],'code':json.loads(m.group(2))})
assert len(headers)==64 and [(x['file'],x['code'])for x in headers if x['code']!=0]==[('0032.json',2),('0064.json',134)]
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert ack['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert ack['independent_review_index_sha256']=='d11a5cfca86c572080e60d8ed943d4133798b95dc4572dc623b59ceb519eb22c'
sn=['source-A1-before.json','source-B2-before.json','source-A3-before.json','source-after-finally.json'];ss=[read(raw/n)for n in sn];assert all(x==ss[0]for x in ss)and ss[0]['files']==freeze['files']and len(freeze['files'])==1871
pn=['producer-A1-before.json','producer-B2-before.json','producer-A3-before.json','producer-after-finally.json'];ps=[read(raw/n)for n in pn];assert all(x==ps[0]for x in ps)
assert pin(raw/'inputs/host-runner.mjs')['sha256']=='dd361913db5533526f7dab42daadcacda04570c248729fcceb447cd082a7c64a'
external=R/'.artifacts/p05-a17-compatible-rollback26-root-ack01.json';assert read(external)==ack
assert read(R/'.artifacts/p05-oci26-a17-run01.exit.json')['exit_code']==1
api=(raw/'inputs/api-child.mjs').read_text();assert "assert.equal(stop.status,200);const current=await h.call(previous.A.host,h.roomPath(previous.A));assert.equal(current.status,200);report.final_current="in api
assert "'--pids-limit','128'"in host and "role==='native-free'?32:128"in host
contract=(raw/'inputs/contract.mjs').read_text();assert 'pids'not in contract and "length,14"in contract
dest=O/'raw';dest.mkdir(exist_ok=True)
safe=['runner.json','TERMINAL.json','owned-after-cleanup.json','authority-ack.json','actual-native-quotas.json','logs/0064.json','evidence/phase-A1-terminal.json','evidence/phase-B2-terminal.json','evidence/phase-A3-ready.json','evidence/browser-diagnostic.json']
for n in safe:
 p=dest/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(raw/n,p)
for n in ['p05-oci26-a17-run01.txt','p05-oci26-a17-run01.exit.json']:shutil.copyfile(R/'.artifacts'/n,dest/n)
(O/'COMMAND-HEADERS.json').write_text(json.dumps({'scope':'HEADERS_ONLY_EXCEPT_IDENTIFIED_STATIC_BROWSER_CONTROL_EXEC0064','records':headers},indent=2)+'\n')
(O/'INPUT-PINS.json').write_text(json.dumps({'external_ack':{'path':str(external),**pin(external),'semantic_equal_export':True},'source_producer_metadata':{n:pin(raw/n)for n in sn+pn},'executed_runtime':{n:pin(raw/'inputs'/n)for n in ['host-runner.mjs','api-child.mjs','bound-profile.mjs','contract.mjs','browser-child.mjs']},'norms_and_mapping':{str(p.relative_to(R)):pin(p)for p in [R/'.docs/10_IMPLEMENTATION_PLAN.md',raw/'inputs/CONTROL_MATRIX.md']},'safe_raw':{n:pin(raw/n)for n in safe}},indent=2)+'\n')
d={'status':'DIAGNOSIS_COMPLETE_OCI26_NODE_HELPER_THREAD_FAILURE_OS_CAUSE_UNRESOLVED','source_identity':ack['source_identity'],'included_files':1871,'owner':plan['owner'],'images':ack['images'],'method_review':ack['independent_review_index_sha256'],'first_error':t['first_error'],'elapsed_ms':t['whole_elapsed_ms'],'initiating_log':'logs/0064.json','initiating_command':'BROWSER_NODE_STATIC_CONTROL_WRITER_A3','initiating_exit_code':134,'stdout_bytes':0,'stderr_bytes':len(log['stderr'].encode()),'stderr_sha256':hashlib.sha256(log['stderr'].encode()).hexdigest(),'native_failure':'NODE_STARTUP_UV_THREAD_CREATE_ASSERT_NODE_PLATFORM109','OS_cause':'UNRESOLVED_PID_OR_MEMORY_NOT_PROVEN','unrecorded_failure_receipt':'ABSENT_EXPECTED_RECORD_TRUE_FAILURE','phaseA3ready_host_consumed':True,'phaseA3terminal_present':False,'A3_process_exit':137,'source_producer_snapshots_exact':True,'reported_success_path_flag':r['source_producer_unchanged'],'proposed_variant':'NEW_BOUND_PROFILE_BROWSER_PIDS256_ONLY_INDEPENDENT_REVIEW_AND_ACTUAL_REQUIRED','current_profile_browser_pids':128,'current128_PASS':False,'native_actions':0,'cleanup':t['cleanup'],'retained_owned_objects':7,'export_error':None,'cleanup_error':None}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d))
