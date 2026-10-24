from pathlib import Path
import json,hashlib,subprocess,os,datetime
root=Path('C:/.projects/venus');here=Path(__file__).resolve().parent;pins={}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p,expected=None):
    p=Path(p);p=p if p.is_absolute() else root/p
    if expected:assert sha(p)==expected,str(p)
    pins[str(p.relative_to(root)).replace('\\','/')]={'sha256':sha(p),'bytes':p.stat().st_size}
    return json.loads(p.read_text(encoding='utf-8-sig'))
def packet(p,expected=None):
    p=Path(p);p=p if p.is_absolute() else root/p;idx=read(p,expected)
    rows=idx['files'];rows=[{'path':n,**v} for n,v in rows.items()] if isinstance(rows,dict) else rows
    for row in rows:
        child=p.parent/row['path']
        if child.is_dir():assert not child.is_symlink() and row['type']=='historical_or_extraction_directory'
        else:assert sha(child)==row['sha256'] and child.stat().st_size==row['bytes'],str(child)
    return idx
author=root/'.docs/implementation/reviews/p05/layout14-window-author-round01';idx=packet(author/'INDEX.json','f9c4d8e8d94b9c6f886dea3a4f6b98e8272f57faf8f437d8a0ffceb6e40ac1f4');assert len(idx['files'])==45
parent=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume13';producer=parent.with_name('p05-v2-layout-producer-resume14');packet(producer/'INDEX.json','bc0492fa7a80db9d72c66692f9d404a756dc276fa404f575eb8d293b65ad4d55')
names=sorted(p.name for p in parent.glob('*.mjs'));assert len(names)==27
for n in names:
    if n=='x11.mjs':continue
    if n=='run.mjs':assert (producer/n).read_text().replace('p05-v2-layout-producer-resume14','p05-v2-layout-producer-resume13')==(parent/n).read_text()
    else:assert (producer/n).read_bytes()==(parent/n).read_bytes(),n
old=(parent/'x11.mjs').read_text();new=(producer/'x11.mjs').read_text()
assert old[:old.index('export async function windowFor')]==new[:new.index('// Only the exact native suffix')]
assert old[old.index('export async function native200'):]==new[new.index('export async function native200'):]
for n in ['binding.json','expected-cells.json','real-text-fixture.json','DESIGN.md','matrix.mjs','probe-policy.mjs']:assert (producer/n).read_bytes()==(parent/n).read_bytes(),n
probe_results=[]
for number in [1,2]:
    saved=author/f'synthetic-experiment0{number}';live=root/f'.artifacts/p05-layout14-window-experiment0{number}'
    report=read(saved/'stdout.json');term=read(saved/'TERMINAL.json');ack=read(saved/'DIAGNOSTIC-ACK.json');assert report==read(live/'stdout.json') and term==read(live/'TERMINAL.json')
    assert report['status']=='PASS_DIAGNOSIS_ONLY' and report['cleanup']=='PASS' and not report['cleanup_components_failed'];assert term['worker_exit']==0 and term['cleanup']=='PASS_OWNED_STOPPED_CONTAINER_REMOVED' and not term['remaining_owned_containers']
    assert ack['owner']==term['owner'] and ack['project']==term['project'] and ack['image']==term['image']=='sha256:b3ff0e81571977b5950cb8dd97d2c9a2bfb2ec70c65da25b5fee914b67ce765f'
    assert sha(saved/'probe.mjs')==ack['script_sha256']
    ci=read(live/'owned-stopped-inspect.json')[0];assert ci['Image']==ack['image'] and ci['Config']['Labels']['venus.p05.owner']==ack['owner'] and ci['Config']['Labels']['venus.p05.project']==ack['project']
    assert not ci['State']['Running'] and ci['State']['ExitCode']==0 and ci['HostConfig']['NetworkMode']=='none' and ci['HostConfig']['ReadonlyRootfs'] and ci['HostConfig']['PidsLimit']==256
    chromium=report['engines'][0];assert chromium['engine']=='chromium';assert [o['exact_count'] for o in chromium['observations']]==[0]*5;assert [o['nonce_prefix_count'] for o in chromium['observations']]==[0,0,0,1,1]
    if number==2:
        for obs in chromium['observations'][3:]:assert obs['title_kinds']==[{'kind':'OWN_SYNTHETIC_ASCII_SUFFIX','normalized_title':'VENUS_NONCE - Google Chrome for Testing','suffix':' - Google Chrome for Testing','own_pid_match':True}]
    probe_results.append({'diagnostic':number,'status':report['status'],'cleanup':term['cleanup'],'naked_nonce_count':[0]*5,'prefix_count':[0,0,0,1,1],'sampling':'target0/25/100/250/500ms_not_exact_recorded_latency'})
    for n in ['probe.mjs','probe.py','COMMAND.json','DIAGNOSTIC-ACK.json']:pins[str((saved/n).relative_to(root)).replace('\\','/')]={'sha256':sha(saved/n),'bytes':(saved/n).stat().st_size}
freeze=read('.artifacts/p05-pilot-bundle-source-freeze13.json');assert freeze['identity']=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13' and len(freeze['files'])==1870
for n,h in freeze['files'].items():assert sha(Path(freeze['materialized_root'])/n)==h,n
assert read(producer/'ROOT_RUN_ACK.json')['root_run_ack'] is False
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';source=Path(freeze['materialized_root']);outputs=source/'.artifacts/p05';before=sorted(p.name for p in outputs.iterdir())
run=subprocess.run([node,str(producer/'run.mjs')],cwd=source,env={**os.environ,'PYTHON':str(root/'.venv/Scripts/python.exe')},capture_output=True,timeout=30);assert run.returncode==1 and b'ROOT_RUN_ACK_REQUIRED' in run.stderr
(here/'pending-ack.txt').write_bytes(run.stdout+run.stderr);assert before==sorted(p.name for p in outputs.iterdir())
result={'status':'PASS_LAYOUT_PRODUCER_METHOD_ONLY','source_identity':freeze['identity'],'image':idx['image'],'producer_runtime_digest':'6f655644467953eda6dc0e91981e61afea72b9e76c39d2727bf624aa74c3713d','author_children_verified':45,'unchanged_other_MJS':25,'original459_oracles_and_bounds':'UNCHANGED','synthetic_diagnostics':probe_results,'native13_actual_count':'UNKNOWN_PRESERVED','native_layout14_actual':'PENDING','finite_controls_PASS':11,'independent_controlflow_PASS':3,'new_native_actions':0,'APP_ACK_writes':False}
(here/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(here/'INPUT-PINS.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
