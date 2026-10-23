from pathlib import Path
import hashlib,json,subprocess,datetime
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/privacy-matched-support-source-audit-round02';C=R/'.artifacts/p05-privacy-support-constructive01'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
assert pin(A/'INDEX.json')['sha256']=='4445157e87ea6ef9ce01367578121ee5efd302e298fb43a2b2aac5188ed921d8'
a=read(A/'INDEX.json')
for f in a['files']:assert pin(A/f['path'])=={k:f[k] for k in ['bytes','sha256']}
ci=read(C/'INDEX.json');assert pin(C/'INDEX.json')['sha256']=='6b753615af59e439c6b6a3ed1314deb8e8e605bab7bd6f7baa1c4ef1b76c2e2d'
for n,p in ci['files'].items():assert pin(C/n)==p
for n,p in read(A/'INPUTS.json')['pins'].items():assert pin(R/n)==p
old=read(R/'.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/CELL-COVERAGE.json');coverage=read(C/'ORIGINAL-COVERAGE.json')
assert coverage['cells']==[{k:v for k,v in x.items() if k!='observations'} for x in old['cells']]
assert (C/'matched-model.mjs').read_bytes()==(R/'.artifacts/p05-privacy-matched-operational01/matched-model.mjs').read_bytes()
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';runs={}
for label,args,expected in [('author-cold',[str(C/'controls.mjs')],0),('pending-host-denial',[str(C/'host.mjs'),str(C/'ROOT-ACK.template.json'),str(A/'INDEX.json')],1)]:
 p=subprocess.run([node,*args],cwd=R,capture_output=True,timeout=30);(O/(label+'.stdout.txt')).write_bytes(p.stdout);(O/(label+'.stderr.txt')).write_bytes(p.stderr);assert p.returncode==expected;runs[label]=p.returncode
d={'status':'PASS_EXACT_PINS_ORIGINAL_COVERAGE_AND_AUTHOR_COLD_NO_NATIVE','author_index':pin(A/'INDEX.json'),'author_children':len(a['files']),'candidate_index':pin(C/'INDEX.json'),'candidate_files':len(ci['files']),'runtime':ci['runtime'],'original_coverage_exact_42_cell_projection':True,'old_model_raw_exact':True,'subprocess_exits':runs,'pending_denial_before_output_and_docker':'HOST_VALIDATE_STATUS_BEFORE_MKDIR_AND_NATIVE_CALLS','native_actions':0,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(O/'PIN-RESULT.json').write_text(json.dumps(d,indent=2)+'\n');(O/'INPUT-PINS.json').write_text(json.dumps({'author_INDEX':{'path':str(A/'INDEX.json'),**pin(A/'INDEX.json')},'candidate_INDEX':{'path':str(C/'INDEX.json'),**pin(C/'INDEX.json')},'candidate_files':ci['files'],'upstream_inputs':read(A/'INPUTS.json')['pins']},indent=2)+'\n');print(json.dumps(d))
