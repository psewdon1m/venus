import datetime
import hashlib
import json
import subprocess
from pathlib import Path

root = Path.cwd()
base = root / '.docs/implementation/evidence/p05/directory-allocator-review-01'
author = root / '.docs/implementation/evidence/p05/topic-directory-component-01'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(author / 'index.json') == 'ed9aa6819cc806d3039fe8eaf523ac110e830719c4ca6005257ae4868cdf482d'
index = json.loads((author / 'index.json').read_text(encoding='utf-8-sig'))
for row in index['files']:
    path = author / row['path']
    assert path.stat().st_size == row['bytes'], row
    assert sha(path) == row['sha256'], row

checks = []
for attempt in ['attempt-01','attempt-02','attempt-03']:
    packet = author / attempt
    receipt = json.loads((packet / 'receipt.json').read_text(encoding='utf-8-sig'))
    inspect = json.loads((packet / 'inspect.json').read_text(encoding='utf-8-sig'))[0]
    assert inspect['Image'] == 'sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472'
    assert inspect['HostConfig']['ReadonlyRootfs'] is True
    assert inspect['HostConfig']['NetworkMode'] == 'none'
    assert inspect['Config']['User'] == '1000:1000'
    owner = receipt['container']
    label = 'venus.component.owner=' + owner
    result = subprocess.run(['docker','ps','-aq','--filter','label='+label],check=True,text=True,capture_output=True)
    assert result.stdout.strip() == '', result.stdout
    checks.append({'attempt':attempt,'owner':owner,'image':inspect['Image'],'fresh_remaining':[],'prior_exit':inspect['State']['ExitCode']})

own = json.loads((base / 'inspect-01.json').read_text(encoding='utf-8-sig'))[0]
owner = own['Config']['Labels']['venus.review.owner']
assert own['HostConfig']['ReadonlyRootfs'] is True
assert own['HostConfig']['NetworkMode'] == 'none'
assert own['Config']['User'] == '1000:1000'
assert own['HostConfig']['Memory'] == 768*1024*1024
assert own['HostConfig']['NanoCpus'] == 1000000000
assert own['State']['ExitCode'] == 1
result = subprocess.run(['docker','ps','-aq','--filter','label=venus.review.owner='+owner],check=True,text=True,capture_output=True)
assert result.stdout.strip() == ''
inputs = [{'path':'apps/api/src/'+p.name,'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted((base/'source').iterdir())]
for p in (base/'source').iterdir():
    assert sha(p) == sha(author / 'attempt-03' / p.name)

output = {'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_artifacts_verified':len(index['files']),
          'author_cleanup_checks':checks,'own_owner':owner,'own_remaining':[], 'exact_source_snapshots':inputs,
          'current_source_matches_snapshot':all(sha(root/row['path']) == row['sha256'] for row in inputs),
          'own_exit_code':1,'finding':'DIRECTORY-001'}
(base/'input-verification.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8')
print(json.dumps(output))
