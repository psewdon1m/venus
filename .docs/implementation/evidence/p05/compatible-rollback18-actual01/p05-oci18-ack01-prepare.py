from pathlib import Path
import json,hashlib,shutil,datetime,subprocess
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source12';prod=s/'.artifacts/p05-compatible-rollback-producer18';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
reviews=[(r/'.docs/implementation/reviews/p05/oci18-browser-diagnostic-independent-round01','1bbd7f1baab3b60a0e2924ac30cef064aba281e9669e139167b45704a4abfab8'),(r/'.docs/implementation/reviews/p05/a15-image-host-pure-n4-preparation-independent-round01','129465903374b210d6e93e29ed0898dac761424b7259de6581f8d2f34784e582')];copied=[]
for review,h in reviews:
 assert sha(review/'INDEX.json')==h;d=json.loads((review/'INDEX.json').read_bytes());assert d['status'].startswith('PASS')
 for f in d['files']:assert sha(review/f['path'])==f['sha256']
 dest=s/review.relative_to(r)
 if dest.exists():assert {p.relative_to(dest).as_posix():sha(p)for p in dest.rglob('*')if p.is_file()}=={p.relative_to(review).as_posix():sha(p)for p in review.rglob('*')if p.is_file()}
 else:shutil.copytree(review,dest)
 copied.append(dest/'INDEX.json')
assert sha(prod/'INDEX.json')=='6523ff7c9a87f47c461f8047563dee11973479684f4f834f160d1f8599c24aba'
for n,v in json.loads((prod/'INDEX.json').read_bytes())['files'].items():assert sha(prod/n)==v['sha256']
n4=r/'.artifacts/p05-ordinary-real470-probe04/runs/venus-pilot470-056966f74135/outer-report.json';n=json.loads(n4.read_bytes());assert n['status']==n['cleanup']=='PASS'
a=json.loads((prod/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes());assert a['status']=='NOT_AUTHORIZED'and not a['root_run_ack'];a.update(status='AUTHORIZED',root_run_ack=True,producer_index_sha256=sha(prod/'INDEX.json'),independent_review_index=str(copied[0]),independent_review_index_sha256=sha(copied[0]),application_source_review_index=str(copied[1]),application_source_review_index_sha256=sha(copied[1]),issued_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),N4_prerequisite={'status':'PASS','outer_sha256':sha(n4),'independent_actual_review_sha256':'0a9513fb7dcc1309492af06398b78df623059de38314f17e04015dc20c6b4c38'},concurrent_workload='MAX_TWO_ORIGINAL_COHORTS06_AFTER_BROWSER16_COMPLETE_NO_OTHER_BROWSER_CORPUS_MATCHED_LAYOUT_OR_PROFILER_DURING_OCI18',scope='ONE_FIXED_A15_B4_A15_SYNTHETIC_COMPATIBILITY14_NOT_STAGE_OR_PRODUCTION')
p=r/'.artifacts/p05-a15-compatible-rollback18-root-ack01.json';assert not p.exists();p.write_text(json.dumps(a,indent=2)+'\n',encoding='utf-8')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';code="import fs from'node:fs';import{createHash}from'node:crypto';import{validateAuthority}from'./.artifacts/p05-compatible-rollback-producer18/contract.mjs';const p='.artifacts/p05-compatible-rollback-producer18/';const a=JSON.parse(fs.readFileSync("+json.dumps(str(p))+"));validateAuthority(JSON.parse(fs.readFileSync(p+'BINDING.json')),a,createHash('sha256').update(fs.readFileSync(p+'INDEX.json')).digest('hex'));console.log('COLD_AUTHORITY_PASS_NO_ALLOCATION');";q=subprocess.run([node,'--input-type=module','-e',code],cwd=s,capture_output=True,text=True,encoding='utf-8');assert q.returncode==0,q.stderr
print(json.dumps({'ack':str(p),'sha256':sha(p),'cold_exit':q.returncode,'review':sha(copied[0]),'source_unchanged_by_excluded_review_copy':True}));print(q.stdout.strip())
