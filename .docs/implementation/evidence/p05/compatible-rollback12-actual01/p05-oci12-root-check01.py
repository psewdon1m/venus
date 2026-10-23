from pathlib import Path
import hashlib,json,subprocess,datetime
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source04';sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
ack=r/'.artifacts/p05-a7-compatible-rollback-root-ack05.json';assert sha(ack)=='8998bcd4bdb885e9459537a5577b2d80eddfccd54e315b68e9a71de8a169e86e';a=json.loads(ack.read_text());assert a['attempts']==1 and a['root_run_ack']
review=Path(a['independent_review_index']);assert sha(review)==a['independent_review_index_sha256'];d=json.loads(review.read_text());assert d['status'].startswith('PASS')
for x in d['files']:assert sha(review.parent/x['path'])==x['sha256']
producer=p/'.artifacts/p05-compatible-rollback-producer12';index=producer/'INDEX.json';assert sha(index)==a['producer_index_sha256'];d=json.loads(index.read_text())
files=d['files'];items=files.items() if isinstance(files,dict) else [(x['path'],x['sha256']) for x in files]
for n,h in items:assert sha(producer/n)==(h['sha256'] if isinstance(h,dict) else h),n
for k,image in a['images'].items():
 x=json.loads(subprocess.run(['docker','image','inspect',image],capture_output=True,text=True,check=True).stdout)[0];assert x['Id']==image
assert json.loads((r/'.artifacts/p05-ordinary-real470-probe04/runs/venus-pilot470-0426e2bb3223/outer-report.json').read_text())['cleanup']=='PASS'
print(json.dumps({'status':'ROOT_CHECK_PASS_ONE_OCI12_DIAGNOSTIC_AUTHORIZED','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ack_sha256':sha(ack),'producer':sha(index),'review':sha(review),'prior_N4_terminal':'FAIL_DEADLINE_CLEANUP_PASS'}))
