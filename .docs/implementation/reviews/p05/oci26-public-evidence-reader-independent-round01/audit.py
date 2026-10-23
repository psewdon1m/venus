from pathlib import Path
import hashlib,json,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/oci26-public-evidence-reader-author-round01'
B=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer25';C=B.with_name('p05-compatible-rollback-producer26')
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
assert pin(A/'INDEX.json')['sha256']=='4913131904a7ac0aade55a1d65e7d0267b77480197b10d3de6d52f5a8d40380a'
author=read(A/'INDEX.json');assert len(author['files'])==69
for f in author['files']:assert pin(A/f['path'])=={k:f[k]for k in ['bytes','sha256']},f['path']
assert pin(C/'INDEX.json')['sha256']=='24ad4aa16145845e55b3e474b1d841ccb0fa1f5bc364df055ce9e903b6a49b7a'
cur=read(C/'INDEX.json');par=read(B/'INDEX.json');assert set(cur['files'])==set(par['files'])
assert {p.relative_to(C).as_posix()for p in C.rglob('*')if p.is_file()and p.name!='INDEX.json'}==set(cur['files'])
for n,f in cur['files'].items():assert pin(C/n)=={k:f[k]for k in ['bytes','sha256']},n
delta=[n for n in cur['files']if cur['files'][n]!=par['files'][n]];assert delta==['host-runner.mjs']
for n in cur['files']:
 if n not in delta:assert (C/n).read_bytes()==(B/n).read_bytes(),n
assert len([n for n in cur['files']if n.endswith('.mjs')])==40
assert pin(C/'host-runner.mjs')['sha256']=='dd361913db5533526f7dab42daadcacda04570c248729fcceb447cd082a7c64a'
host=(C/'host-runner.mjs').read_text();old=(B/'host-runner.mjs').read_text();start=host.index('/** Same non-atomic exists/lstat/read contract;');end=host.index('export async function executePlan(');inverse=host[:start]+host[end:]
inverse=inverse.replace("let activePhase='setup';let unrecordedCommandFailureSaved=false;","let activePhase='setup';")
for name in ['command','evidence']:
 before=next(x for x in old.splitlines(True)if x.startswith(' async function '+name+'('));after=next(x for x in inverse.splitlines(True)if x.startswith(' async function '+name+'('));inverse=inverse.replace(after,before)
assert inverse==old
binding=read(C/'BINDING.json');assert binding['root_run_ack']is False and read(C/'ROOT_RUN_ACK_TEMPLATE.json')['root_run_ack']is False
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert read(C/'included-inputs.json')==freeze['files']and len(freeze['files'])==1871
assert binding['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
probe=A/'p05-oci26-reader-probe01';terminal=read(probe/'TERMINAL.json');native=read(probe/'worker.stdout.txt');assert terminal['worker_exit']==0 and terminal['cleanup']=='OWNED_EMPTY'and terminal['remaining']=={'containers':[],'networks':[],'volumes':[]}
assert terminal['owner']=='98a19e90543d4502b54e01f2ca2f5206'and terminal['id']=='685389d316407778589c3d269793df59ade4591cc25908a1d1fd75f8a0eb9b52'
assert len(native['rows'])==12 and all(x['original_status']==x['candidate_status']for x in native['rows'])
assert {x['case']:x['candidate_status']for x in native['rows']}=={'missing':0,'empty':0,'regular':0,'binary':0,'max':0,'oversize':8,'unreadable':1,'directory':8,'symlink':8,'broken':0,'fifo':8,'injection_literal_arg':0}
assert next(x for x in native['rows']if x['case']=='max')['stdout_bytes']==2097152
assert read(probe/'before-start.stdout.txt')['image']==binding['images']['A']
for n in ['remaining-containers.stdout.txt','remaining-networks.stdout.txt','remaining-volumes.stdout.txt','worker.stderr.txt']:assert (probe/n).stat().st_size==0
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';results=[]
for name,script in [('author-focused-repeat',A/'author/p05-oci26-controls.mjs'),('independent-negatives',O/'own-negatives.mjs')]:
 run=subprocess.run([node,str(script)],cwd=R,capture_output=True,timeout=30);(O/(name+'.stdout.txt')).write_bytes(run.stdout);(O/(name+'.stderr.txt')).write_bytes(run.stderr);assert run.returncode==0,(name,run.stderr.decode());results.append({'name':name,'exit_code':run.returncode,'result':json.loads(run.stdout)})
d={'status':'PASS_METHOD_ONLY','source_identity':binding['source_identity'],'included_files':1871,'images':binding['images'],'author_index':pin(A/'INDEX.json'),'producer_index':pin(C/'INDEX.json'),'producer_files':len(cur['files']),'runtime_MJS':40,'changed_MJS':delta,'full_inverse':'EXACT25','other39_MJS_and_all_other_files':'EXACT25','original14_E_F_stop_replay_poll_limits':'UNCHANGED','native_probe':'EXISTING_12_STABLE_CASES_ONLY_OWNED_EMPTY_WORKER0','native_keeper64_capacity_or_performance_proven':False,'checks':results,'prior25_cause':'UNRESOLVED_UNCHANGED','pending_ACK_authority':False,'native_actions':0,'APP_writes':0}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({k:v for k,v in d.items()if k!='checks'}))
