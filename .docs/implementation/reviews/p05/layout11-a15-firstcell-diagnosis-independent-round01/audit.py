from pathlib import Path
import json,hashlib,subprocess,datetime,collections
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
S=R/'.artifacts/p05-pilot-bundle-source12';N=S/'.artifacts/p05/venus-v2-layout-3d98582f2d82';P=S/'.artifacts/p05-v2-layout-producer-resume11'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(x,label):
 if not x:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,want):
 need(sha(p)==want,'review pin');pin(p);d=load(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**v}for n,v in files.items()]
 for v in files:
  need(sha(p.parent/v['path'])==v['sha256'],'review child '+v['path'])
 return len(files)
ackpath=R/'.artifacts/p05-layout11-a15-root-ack01.json';need(sha(ackpath)=='26a4b64bcfc43e9a677eb1b935b233b554bc83c1ab89d4a9a0e4998c6b00d36a','ACK');ack=load(ackpath);pin(ackpath)
index(R/ack['independent_review_path'],ack['independent_review_index_sha256'])
b=ack['browser23_actual_PASS_prerequisite'];index(R/b['independent_index'],b['sha256'])
before=load(N/'inputs-before.json');after=load(N/'inputs-after.json');freeze=load(R/'.artifacts/p05-pilot-bundle-source-freeze12.json')
need(before==after and before['files']==freeze['files']and len(before['files'])==1869,'frozen source inventories')
for n,h in before['files'].items():need(sha(S/n)==h,'materialized source '+n)
need(before['source_identity']==freeze['identity']==ack['source_identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','source identity')
producer=load(N/'producer-before.json')
for n,v in producer.items():
 if v['type']=='file':need(sha(P/n)==v['sha256']and(P/n).stat().st_size==v['bytes'],'producer '+n)
runtime={n:v for n,v in producer.items()if n.endswith('.mjs')or n in ['binding.json','DESIGN.md']}
digest=hashlib.sha256(json.dumps(runtime,separators=(',',':'),ensure_ascii=False).encode()).hexdigest();need(digest==ack['producer_runtime_digest']=='7e3f9d97cfde447dc0dac434cde78af55f94618abbe4e4f50bbedf79ec7e945f','runtime digest')
d=load(N/'layout-report.json');runner=load(N/'runner.json')
need(d['status']==runner['status']=='FAIL'and d['cleanup']==runner['cleanup']=='PASS','native failure cleanup')
need(runner['source_identity']==ack['source_identity']and runner['producer_runtime_digest']==digest and runner['image']==ack['image'],'actual pins')
need((N/'image-id.txt').read_text().strip()==ack['image'],'actual image')
need(len(d['records'])==51 and collections.Counter(v['status']for v in d['records'])=={'FAIL':1,'NOT_RUN':50},'fixed51 disposition')
v=d['records'][0];need(v['id']=='chromium/ru/entry/w320'and v['roles']==[]and v['failure']=={'name':'AssertionError','code':'ASSERTION_OR_OPERATION_FAILED'},'first cell failure')
need(d['failure']==v['failure']and d['phase']=={'scene':'entry','native':False,'stage':'measurement','cell':v['id']},'saved stage')
need(d['screenshots']=={'bytes':0,'count':0}and not list(N.glob('*.png')),'no screenshots')
need(d['page_errors']==[]and d['page_errors_overflow']is False and d['keyboard_actions']==[]and d['cleanup_failures']==[],'no saved ancillary error')
need(d['request_metadata']==[{'phase':'entry','method':'GET','route':'/api/v1/entry-policy','status':200}],'saved request metadata')
need(not any(k in v for k in ['audit','keyboard','viewport'])and not any(k in d for k in ['failure_screenshot','failure_screenshot_error','real_text_observations']),'missing measurement diagnostics exact')
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:need((N/n).read_bytes()==b'','saved cleanup empty')
text=(P/'measure.mjs').read_text();need(text.index('const audit=')<text.index('keys=await keyboard(')<text.index('const capture=screenshots.accept')<text.index('onObservation(outcome);assert(normalClock')<text.index('assertObservation(audit)'),'source measurement/save/assert order')
browser=(P/'browser.mjs').read_text();need(browser.index("report.phase={scene,native,stage:'measurement'")<browser.index('await measureRole('),'measurement stage')
need('await driver.closeScene();driver=null;await owned.close();owned=null;'in browser and 'const a=driver?.actors()'in browser,'inner cleanup before outer capture')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
run=subprocess.run([node,str(O/'assertion-projection-control.mjs')],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=15)
(O/'assertion-projection-control.txt').write_bytes(run.stdout);need(run.returncode==0,'cold projection control')
for p in N.rglob('*'):
 if p.is_file():pin(p)
for n in ['measure.mjs','probe-policy.mjs','x11.mjs','dom-audit.mjs','scene-driver.mjs','browser.mjs','matrix.mjs','runner-policy.mjs']:pin(P/n)
for n in ['tests/p05/display.mjs','tests/p05/window-inventory.mjs']:pin(S/n)
result={'status':'OBSERVED_FIRST_CELL_FAIL_EXACT_ASSERTION_LOCATION_UNKNOWN_NOT_APP_DEFECT_PROOF','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':ack['source_identity'],'image':ack['image'],'producer_runtime_digest':digest,'runtime_mjs':sum(n.endswith('.mjs')for n in runtime),'source_files':1869,'shard_cells':51,'PASS':0,'FAIL':1,'NOT_RUN':50,
 'firstcell':v['id'],'roles_saved':0,'screenshots':0,'audit_saved':False,'keyboard_saved':False,'assertion_location':'UNKNOWN_NOT_RETAINED','APP_CSS_accessibility_failure_established':False,
 'strict_final_dom_audit_assertion_reached':False,'inert_projection_control_exit':run.returncode,'native_rerun':False,'APP_or_method_edits':False,'owned_cleanup':'PASS_EMPTY_SAVED_RECEIPTS','whole459_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
