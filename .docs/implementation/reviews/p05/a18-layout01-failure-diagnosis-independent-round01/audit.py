from pathlib import Path
import json,hashlib,collections,subprocess,sys
r=Path('C:/.projects/venus');o=Path(__file__).parent;s=r/'.artifacts/p05-pilot-bundle-source15';p=s/'.artifacts/p05/venus-v2-layout-5dbf0e43c54f';working=s/'.artifacts/p05-v2-layout-producer-a18-01';pins={};sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':sha(b)};return b
def js(p):return json.loads(read(p))
runner=js(p/'runner.json');q=js(p/'layout-report.json');ack=js(p/'producer/ROOT_RUN_ACK.json');binding=js(p/'producer/binding.json');before=js(p/'inputs-before.json');after=js(p/'inputs-after.json');producer=js(p/'producer-before.json')
assert runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['project']==p.name
assert collections.Counter(x['status'] for x in q['records'])=={'PASS':36,'FAIL':1,'NOT_RUN':14}
assert len(q['records'])==51 and q['status']=='FAIL' and q['cleanup']=='PASS' and not q['cleanup_failures'] and not q['page_errors'] and not q['page_errors_overflow'] and not q.get('observer_error')
failed=[x for x in q['records'] if x['status']=='FAIL'];assert len(failed)==1 and failed[0]['id']=='chromium/ru/private_active/w320' and failed[0]['roles']==[]
assert q['phase']=={'scene':'private_active','native':False,'stage':'measurement','cell':'chromium/ru/private_active/w320','role':'primary','checkpoint':'MEASUREMENT'}
assert q['failure']==failed[0]['failure']=={'name':'AssertionError','code':'KEYBOARD_FOCUS_OUTSIDE','source_module':'probe-policy','source_line':34,'source_column':162}
assert not q.get('failure_screenshot') and not list(p.glob('*private_active*.png')) and not (p/'failure-dom-only.png').exists()
assert q['screenshots']=={'bytes':3448162,'count':72} and len(list(p.glob('*.png')))==72
assert len(q['real_text_observations'])==36 and all(x['status']=='PASS' and x['cleanup']=='PASS' for x in q['real_text_observations'])
assert len(q['keyboard_actions'])==8 and all(x['scene']!='private_active' for x in q['keyboard_actions'])
assert q['last_control']['control']=='pair-chat-send' and q['last_control']['started_monotonic_ms']==251253.299137
assert q['private_preparation'][-1]['control']=='pair-chat-messages' and q['private_preparation'][-1]['status']=='READY'
assert sha(read(p/'producer/ROOT_RUN_ACK.json'))==sha(read(r/'.artifacts/p05-layout-a18-01-root-ack01.json'))=='a6aa232490e9749e9b9789a1213410cae1479af51a22e5225e3125d6730badab'
assert ack['producer_runtime_digest']==runner['producer_runtime_digest']=='a85898fa9aa7b90b96614ce04a6a7addd380fb7d3f334af6c1832e8dcdf0e4f6'
assert ack['operational_resource_profile']==runner['operational_resource_profile']=='LAYOUT21_BROWSER_PID512' and ack['browser_pids_limit']==runner['browser_pids_limit']==512
assert before==after and len(before['files'])==1872
f=js(r/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert before['files']==f['files']
assert before['source_identity']==runner['source_identity']==ack['source_identity']==binding['source_identity']==f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'
for file,h in f['files'].items():assert sha((s/file).read_bytes())==h,file
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
current=inventory();assert current==f['files'] and identity(current)==f['identity']
for name,pin in producer.items():
 if pin['type']=='file':
  b=read(p/'producer'/name);assert sha(b)==pin['sha256'] and len(b)==pin['bytes'] and b==read(working/name),name
runtime={k:v for k,v in producer.items() if k.endswith('.mjs') or k in ['binding.json','DESIGN.md']}
assert sha(json.dumps(runtime,separators=(',',':')).encode())==ack['producer_runtime_digest']
assert len([k for k in producer if k.endswith('.mjs')])==27
assert runner['image']==ack['image']==binding['image']==read(p/'image-id.txt').decode().strip()=='sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616'
for path,h in [(binding['root_build_receipt_path'],binding['root_build_receipt_sha256']),(binding['source_snapshot_path'],binding['source_snapshot_sha256'])]:assert sha(read(Path(path)))==h
assert sha(read(r/ack['independent_review_path']))==ack['independent_review_index_sha256']=='6ba12785c55f5cdb547717902a4a397794fee3899f58d1ba909d3afa7a24cd5d'
browserack=ack['browser_A18_actual_independent_review'];assert sha(read(Path(browserack['path'])))==browserack['sha256']=='04f456ccc50d7a2388b512aa775adfaf90f2883409d63c53c38fb1e1137e9265'
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:assert not read(p/n)
for n in ['browser-tests.txt','compose-cleanup.txt','fixture-diff.json']:read(p/n)
exit=js(r/'.artifacts/p05-layout-a18-01-chromium-ru-run01.exit.json');assert exit['exit_code']==1
read(r/'.artifacts/p05-layout-a18-01-chromium-ru-run01.txt');read(r/'AGENTS.md')
css=read(s/'apps/web/src/style.css').decode();assert 'scroll-behavior:auto!important' in css and 'scroll-behavior:smooth' not in css
read(s/'apps/web/src/topic-games-panel.tsx');assert b'(!target?.invitation||conversation?.prompt)' in (s/'apps/web/src/topic-games-panel.tsx').read_bytes()
compose=js(p/'compose.json');assert compose['services']['browser']['pids_limit']==512 and compose['services']['browser']['cpus']==2 and compose['services']['browser']['mem_limit']=='3g'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';result=subprocess.run([node,str(o/'policy-control.mjs')],cwd=r,capture_output=True,timeout=15)
(o/'policy-control.stdout.txt').write_bytes(result.stdout);(o/'policy-control.stderr.txt').write_bytes(result.stderr);assert result.returncode==0,result.stderr
out={'status':'ACTUAL_FAIL_RETAINED_FOCUSED_DIAGNOSIS_COMPLETE','audit_exit':0,'source_files_verified':1872,'producer_mjs':27,'producer_file_count':sum(x['type']=='file' for x in producer.values()),'producer_runtime_digest':runner['producer_runtime_digest'],'counts':{'PASS':36,'FAIL':1,'NOT_RUN':14},'root_exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','failure':q['failure'],'phase':q['phase'],'actual_failed_control':'UNKNOWN_NOT_EXPORTED','actual_failed_rect':'UNKNOWN_NOT_EXPORTED','persistent_APP_overflow':'UNKNOWN','native_Tab_settlement_cause':'UNKNOWN','failed_role_projection_saved':False,'failure_screenshot_saved':False,'prior_screenshots':72,'prior_RU_representative_text_PASS':36,'source_first_sample_freezing':True,'CSS_smooth_scroll_established':False,'policy_diagnostic_control_exit':0,'native_actions':0,'APP_producer_ACK_edits':False}
(o/'CHECKS.json').write_text(json.dumps(out,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print(json.dumps(out))
