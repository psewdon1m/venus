from pathlib import Path
import json,hashlib,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/oci25-selected-participant-exit-author-round01'
B=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer24';C=B.with_name('p05-compatible-rollback-producer25')
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
assert pin(A/'INDEX.json')['sha256']=='b8d53e664998f55b03fa191e759935db99326927aa1519fbc4398ded15e71abf'
author=read(A/'INDEX.json');assert len(author['files'])==30
for f in author['files']:assert pin(A/f['path'])=={k:f[k]for k in ['bytes','sha256']},f['path']
assert pin(C/'INDEX.json')['sha256']=='499b43b0296be229d73e45fdf3b1c1d9927dcb02e94c9b5a1cfd91438c56140d'
cur=read(C/'INDEX.json');parent=read(B/'INDEX.json');assert set(cur['files'])==set(parent['files'])
assert {p.relative_to(C).as_posix()for p in C.rglob('*')if p.is_file()and p.name!='INDEX.json'}==set(cur['files'])
for n,f in cur['files'].items():assert pin(C/n)=={k:f[k]for k in ['bytes','sha256']},n
delta=sorted(n for n in cur['files']if cur['files'][n]!=parent['files'][n]);assert delta==['api-child.mjs','host-runner.mjs']
for n in cur['files']:
 if n not in delta:assert (C/n).read_bytes()==(B/n).read_bytes(),n
assert len([n for n in cur['files']if n.endswith('.mjs')])==40
api=(C/'api-child.mjs').read_text();host=(C/'host-runner.mjs').read_text()
old="else{const E=restore(previous.E);const stop=await h.call(E.host,h.base(E)+"
new="else{const E=restore(previous.E),exitActor=E.members.slice(1,3).find(a=>a.id===E.excludedActor);assert(exitActor&&exitActor.id!==E.host.id,'A3_SELECTED_PARTICIPANT_EXIT_REQUIRED');const stop=await h.call(exitActor,h.base(E)+"
assert api.count(new)==1 and api.replace(new,old)==(B/'api-child.mjs').read_text()
start=host.index('/** Exact replay structure:');end=host.index('export async function executePlan(')
inverse=(host[:start]+host[end:]).replace('OCI09:completeReplay(b.replay)&&completeReplay(c.replay)','OCI09:b.replay.length===12&&c.replay.length===12');assert inverse==(B/'host-runner.mjs').read_text()
assert pin(C/'api-child.mjs')['sha256']=='2d638e019b632780559753e57535838f10c4e0b42805886bfca31f54444cbb96'
assert pin(C/'host-runner.mjs')['sha256']=='0f11afbf7c04a3c8057c966be44f79dd5052bb42d0f2f2215af375a73b855e1d'
assert "assert.equal(stop.status,200);const current=await h.call(previous.A.host,h.roomPath(previous.A));assert.equal(current.status,200)"in api
binding=read(C/'BINDING.json');assert binding['root_run_ack']is False and read(C/'ROOT_RUN_ACK_TEMPLATE.json')['root_run_ack']is False
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert read(C/'included-inputs.json')==freeze['files']and len(freeze['files'])==1871
assert binding['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
diag=R/'.docs/implementation/reviews/p05/oci24-a17-failure-diagnosis-independent-round01/INDEX.json';assert pin(diag)['sha256']=='83b25627118cdcc538316f731fe78834f2f80d3e95bb13cb21bec9780ede0ba5'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';results=[]
for name,script in [('author-focused-repeat',A/'author/p05-oci25-controls.mjs'),('independent-aggregate',O/'aggregate-consistency.mjs')]:
 run=subprocess.run([node,str(script)],cwd=R,capture_output=True,timeout=30);(O/(name+'.stdout.txt')).write_bytes(run.stdout);(O/(name+'.stderr.txt')).write_bytes(run.stderr);assert run.returncode==0,(name,run.stderr.decode());results.append({'name':name,'exit_code':run.returncode,'result':json.loads(run.stdout)})
d={'status':'PASS_METHOD_ONLY','source_identity':binding['source_identity'],'included_files':1871,'images':binding['images'],'author_index':pin(A/'INDEX.json'),'producer_index':pin(C/'INDEX.json'),'diagnosis_index':pin(diag),'producer_files':len(cur['files']),'runtime_MJS':40,'changed_MJS':delta,'full_inverse':'EXACT24','all_other_files':'EXACT24','original_E_F_and14':'PRESERVED','strict_stop200':'SELECTED_NONHOST_ONLY_NO_RETRY','replay_aggregate':'EXACT13_ORDERED_KINDS_BOTH_PHASES_SPARSE_REJECT','conditional_all14_check':'PASS_NOT_NATIVE_FUTURE_INPUTS_EXPLICIT','checks':results,'pending_ACK_authority':False,'native_actions':0,'APP_writes':0,'actual_resource_fit':'UNKNOWN_UNTIL_NATIVE'}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({k:v for k,v in d.items()if k!='checks'}))
