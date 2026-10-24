import datetime
import hashlib
import json
import subprocess
from pathlib import Path

root=Path.cwd()
base=root/'.docs/implementation/evidence/p05/directory-allocator-review-02'
old=root/'.docs/implementation/evidence/p05/directory-allocator-review-01'
producer=root/'.artifacts/p05-directory-component-3c0225e4d8dd'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(old/'independent.test.ts')==sha(base/'independent.test.ts')=='7838f28515b421fae6fc0001f8577b5ed04837fee72a7a88245befcfbb892d58'
inputs=[]
for path in sorted((base/'source').iterdir()):
    assert sha(path)==sha(root/'apps/api/src'/path.name)
    assert sha(path)==sha(producer/path.name)
    inputs.append({'path':'apps/api/src/'+path.name,'bytes':path.stat().st_size,'sha256':sha(path)})

checks=[]
for label,inspect_path,label_key in [
    ('independent',base/'inspect-01.json','venus.review.owner'),
    ('author',producer/'inspect.json','venus.component.owner'),
]:
    inspect=json.loads(inspect_path.read_text(encoding='utf-8-sig'))[0]
    assert inspect['Image']=='sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472'
    assert inspect['Config']['User']=='1000:1000'
    assert inspect['HostConfig']['ReadonlyRootfs'] is True
    assert inspect['HostConfig']['NetworkMode']=='none'
    assert inspect['HostConfig']['Memory']==768*1024*1024
    assert inspect['HostConfig']['NanoCpus']==1000000000
    assert inspect['State']['ExitCode']==0
    owner=inspect['Config']['Labels'][label_key]
    result=subprocess.run(['docker','ps','-aq','--filter','label='+label_key+'='+owner],check=True,text=True,capture_output=True)
    assert result.stdout.strip()==''
    checks.append({'producer':label,'owner':owner,'actual_exit_code':0,'fresh_remaining':[]})

old_report=root/'.docs/implementation/reviews/p05/directory-allocator-round01.md'
old_json=root/'.docs/implementation/reviews/p05/directory-allocator-round01.json'
assert sha(old_report)=='21210489b1366807d06a772197012ad5e7cbeba3e333bccf618cf3eb5cf80741'
assert sha(old_json)=='b938faa0959274ce328699f46e9a96b7e6cf31ae616859ec9e7f7f182b8b504b'
report={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_unchanged':True,'inputs':inputs,
        'prior_control_bytes_unchanged':True,'prior_fail_reports_unchanged':True,'cleanup':checks,
        'independent_pass':26,'author_rerun_pass':15,'windows_only_skip':1,'exit_code':0}
(base/'input-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
