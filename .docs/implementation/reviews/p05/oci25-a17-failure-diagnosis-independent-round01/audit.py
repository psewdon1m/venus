from pathlib import Path
import hashlib,json,re,shutil
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
raw=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-p05-oci-f0ff48a45f06';read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
t=read(raw/'TERMINAL.json');runner=read(raw/'runner.json');plan=read(raw/'plan.json');ack=read(raw/'authority-ack.json')
assert t['status']==runner['status']=='FAIL'
assert t['first_error']=={'name':'Error','code':None,'phase':'A3','source_module':'host-runner','source_line':29,'source_column':903}
assert t['cleanup']=='retained_manual_cleanup_required'and t['export_error']is None and t['cleanup_error']is None and sum(map(len,t['remaining_owned'].values()))==7
assert [x['code']for x in t['phase_terminals']]==[0,0,137]and t['phase_terminals'][2]['terminal']is None
for name in ['A1','B2']:assert read(raw/f'evidence/phase-{name}-terminal.json')['status']=='PHASE_COMPLETE'
assert read(raw/'evidence/phase-A3-ready.json')=={'status':'READY_FOR_STOP','phase':'A3'}
assert not(raw/'evidence/phase-A3-terminal.json').exists()and not(raw/'evidence/browser-terminal.json').exists()
# Read only command headers through code; never consume inspect stdout/ENV or private contents.
headers=[];header_pins={}
for p in sorted((raw/'logs').glob('*.json')):
 prefix=''
 with p.open(encoding='utf-8-sig')as f:
  for line in f:
   prefix+=line
   if re.search(r'"code"\s*:',line):break
 match=re.search(r'"arguments"\s*:\s*(\[.*?\])\s*,\s*"code"\s*:\s*(-?\d+|null)',prefix,re.S);assert match,p.name
 args=json.loads(match.group(1));code=json.loads(match.group(2));headers.append({'file':p.name,'verb':args[0],'code':code,'A3_browser_signal':args[0]=='exec'and any('browser-command-A3' in x for x in args),'A3_inspect':args==['inspect',plan['project']+'-a3']})
 header_pins[p.name]={'header_utf8_sha256':hashlib.sha256(prefix.encode()).hexdigest(),'header_characters':len(prefix)}
assert len(headers)==63 and [(x['file'],x['code'])for x in headers if x['code']!=0]==[('0032.json',2)]
assert headers[-1]['A3_inspect']and not any(x['A3_browser_signal']for x in headers)
host=(raw/'inputs/host-runner.mjs').read_text();assert "else if(value.code!==0)reject(Error('DOCKER_COMMAND_FAILED'))"in host
assert "record:false})).stdout" in host and "names.get('keeper')"in host
assert "await startAPI('A3');await waitFile('phase-A3-ready.json');await browserSignal('A3')"in host
assert "if(!s.isFile()||s.isSymbolicLink()||s.size>2097152)process.exit(8)"in host
api=(raw/'inputs/api-child.mjs').read_text();assert "assert.equal(stop.status,200);const current=await h.call(previous.A.host,h.roomPath(previous.A));assert.equal(current.status,200);report.final_current="in api
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert ack['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert ack['independent_review_index_sha256']=='ffef872fc90ac6de57ed0b0afd49d665480ad15a87b963220cd31926e966a0ac'
external=R/'.artifacts/p05-a17-compatible-rollback25-root-ack01.json';assert read(external)==ack
sn=['source-A1-before.json','source-B2-before.json','source-A3-before.json','source-after-finally.json'];ss=[read(raw/n)for n in sn];assert all(x==ss[0]for x in ss)and ss[0]['files']==freeze['files']and len(freeze['files'])==1871
pn=['producer-A1-before.json','producer-B2-before.json','producer-A3-before.json','producer-after-finally.json'];ps=[read(raw/n)for n in pn];assert all(x==ps[0]for x in ps)
assert read(R/'.artifacts/p05-oci25-a17-run01.exit.json')['exit_code']==1
dest=O/'raw';dest.mkdir(exist_ok=True)
safe=['runner.json','TERMINAL.json','owned-after-cleanup.json','authority-ack.json','actual-native-quotas.json','evidence/phase-A1-terminal.json','evidence/phase-B2-terminal.json','evidence/phase-A3-ready.json','evidence/browser-diagnostic.json']
for n in safe:
 p=dest/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(raw/n,p)
for n in ['p05-oci25-a17-run01.txt','p05-oci25-a17-run01.exit.json']:shutil.copyfile(R/'.artifacts'/n,dest/n)
(O/'COMMAND-HEADERS.json').write_text(json.dumps({'scope':'HEADERS_ONLY_NO_STDOUT_OR_STDERR_OR_ENV_VALUES','records':headers,'header_pins':header_pins},indent=2)+'\n')
(O/'INPUT-PINS.json').write_text(json.dumps({'external_ack':{'path':str(external),**pin(external),'semantic_equal_export':True},'source_producer_metadata':{n:pin(raw/n)for n in sn+pn},'executed_source':{n:pin(raw/'inputs'/n)for n in ['host-runner.mjs','api-child.mjs','bound-profile.mjs','browser-child.mjs']},'safe_raw':{n:pin(raw/n)for n in safe}},indent=2)+'\n')
d={'status':'DIAGNOSIS_COMPLETE_OCI25_ACTUAL_FAIL_CAUSE_UNRESOLVED','source_identity':ack['source_identity'],'included_files':1871,'owner':plan['owner'],'images':ack['images'],'method_review':ack['independent_review_index_sha256'],'first_error':t['first_error'],'elapsed_ms':t['whole_elapsed_ms'],'phaseA3ready_present':True,'phaseA3terminal_present':False,'A3_process_exit':137,'first_initiating_command':'UNRECORDED_KEEPER_EVIDENCE_READ_BEFORE_BROWSER_A3_SIGNAL_SOURCE_SEQUENCE_INFERENCE','exact_evidence_filename':'UNRESOLVED_READY_OR_TERMINAL_POLL','initiating_exit_code':'NOT_RETAINED','initiating_stderr':'NOT_RETAINED','logged_commands':63,'only_logged_nonzero':'HANDLED_STARTUP_PG_ISREADY_0032_EXIT2','stale_browser_PID_sample_causality':'NOT_ESTABLISHED','OOM_or_wall_limit_cause':'NOT_ESTABLISHED','source_producer_snapshots_exact':True,'reported_success_path_flag':runner['source_producer_unchanged'],'cleanup':t['cleanup'],'retained_owned_objects':7,'export_error':None,'cleanup_error':None,'native_actions':0}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d))
