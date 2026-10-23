from pathlib import Path
import hashlib,json,sys
ROOT=Path('C:/.projects/venus');OUT=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
a=ROOT/'.docs/implementation/reviews/p05/layout15-firefox-suffix-author-round01'
assert sha((a/'INDEX.json').read_bytes())=='d99151f0ac9720797389b6294948319a74546a38fed4b71e4428bb896a8b6997'
index=json.loads((a/'INDEX.json').read_text());assert len(index['files'])==34
for name,p in index['files'].items():assert pin(a/name)==p,name
base=ROOT/'.artifacts/p05-pilot-bundle-source13/.artifacts'
old=base/'p05-v2-layout-producer-resume14';new=base/'p05-v2-layout-producer-resume15'
changed=[];same=[]
for f in sorted(old.glob('*.mjs')):
 b=f.read_bytes();c=(new/f.name).read_bytes()
 if b!=c:changed.append(f.name)
 else:same.append(f.name)
assert changed==['run.mjs','x11.mjs'] and len(same)==25
assert (new/'run.mjs').read_bytes()==(old/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume14',b'p05-v2-layout-producer-resume15')
for name in ['binding.json','expected-cells.json','real-text-fixture.json','DESIGN.md']:
 assert (new/name).read_bytes()==(old/name).read_bytes(),name
xold=(old/'x11.mjs').read_text();xnew=(new/'x11.mjs').read_text()
assert xold[xold.index('export async function readyOwnedWindow'):]==xnew[xnew.index('export async function readyOwnedWindow'):]
assert (a/'x11.mjs').read_bytes()==(new/'x11.mjs').read_bytes()
assert (a/'run.mjs').read_bytes()==(new/'run.mjs').read_bytes()
sys.path.insert(0,str(ROOT/'tools'));from stage_inventory import inventory,identity
snapshot=json.loads((ROOT/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text())['files']
source=inventory(ROOT/'.artifacts/p05-pilot-bundle-source13');assert source==snapshot and len(source)==1870
assert identity(source)=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13'
ack=json.loads((new/'ROOT_RUN_ACK.json').read_text());assert ack['root_run_ack'] is False
cal=a/'calibration';native=json.loads((cal/'stdout.json').read_text());term=json.loads((cal/'TERMINAL.json').read_text());command=json.loads((cal/'COMMAND.json').read_text())['argv'];authority=json.loads((cal/'DIAGNOSTIC-ACK.json').read_text())
assert native['status']=='INCOMPLETE_CALIBRATION_NO_METHOD_PASS' and native['cleanup']=='PASS' and native['cleanup_failed']==[]
ff,wk=native['engines'];assert ff['engine']=='firefox' and ff['status']=='MEASURED_OWN_NONCE_TEMPLATE' and ff['page_title_is_own_nonce'] is True
assert ff['observations']==[{'kind':'OWN_NONCE_TEMPLATE','prefix_escaped':'','suffix_escaped':' \\u{2014} Nightly','normalized_template':'VENUS_NONCE \\u{2014} Nightly','own_browser_PID_match':True,'selected_by_nonce':False,'selected_by_own_PID':True}]
assert wk['engine']=='webkit' and wk['status']=='UNRESOLVED' and wk['observations']==[] and wk['elapsed_ms']>=20000 and len(wk['query_counts'])==8
assert term['worker_exit']==1 and int((cal/'exit.txt').read_text())==1 and term['remaining_owned_containers']==[]
assert authority['script_sha256']==sha((cal/'p05-layout15-engine-window-calibration01.mjs').read_bytes())
raw=ROOT/'.artifacts/p05-layout15-engine-window-calibration01/owned-stopped-inspect.json';rows=json.loads(raw.read_text());assert len(rows)==1;r=rows[0]
assert r['Image']==term['image']==authority['image'] and not r['State']['Running'] and r['State']['ExitCode']==1
for key,value in [('project',term['project']),('owner',term['owner']),('role','synthetic-window-diagnosis')]:assert r['Config']['Labels']['venus.p05.'+key]==value
assert r['HostConfig']['NetworkMode']=='none' and r['HostConfig']['ReadonlyRootfs'] and r['Config']['User']=='1000:1000'
assert command[command.index('--name')+1]==term['project'] and (cal/'cleanup.stdout.txt').read_text().strip()==term['project']
result={'status':'PASS_METHOD_ONLY_WEBKIT_UNRESOLVED_NO_NATIVE_LAYOUT_PASS','author_index':pin(a/'INDEX.json'),'children_verified':34,
 'source_identity':identity(source),'included_files':1870,'image':term['image'],'changed_MJS':changed,'unchanged_MJS':same,
 'run_dir_only':True,'readiness_focus_keyboard_native_screenshot_tail_exact':True,
 'fixed_cells_design_fixtures_binding_exact':True,'pending_ACK':True,
 'calibration':{'worker_exit':1,'combined_status':native['status'],'firefox':ff,'webkit':wk,'cleanup':term['cleanup'],'raw_stopped_inspect_pin':pin(raw)},
 'scope':'Measured Firefox suffix only; real title-query/focus path NOT_RUN; WebKit unresolved, not waived; later A17 source/image rebind required.'}
(OUT/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:result[k] for k in ['status','children_verified','included_files','changed_MJS','run_dir_only','scope']}))
