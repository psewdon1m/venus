"""One-off read-only resource snapshot for root's existing P05 manual schedule."""
from pathlib import Path
import datetime, hashlib, json, shutil, subprocess, sys

r = Path('C:/.projects/venus')
out = r / sys.argv[1]
cpu = float(sys.argv[2])
assert not out.exists()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = r / '.artifacts/p05-full-original-resume05/MANIFEST.json'
assert sha(manifest) == 'beacb3659d04aa39299afd2e06f1811f0191974e44f621a85a35c205be4ccd5a'
plan = json.loads(manifest.read_text())
owners = {x['owner'] for x in plan['jobs']}
authority = r / '.artifacts/p05-a21-existing-gates-resource-authority06.json'
assert sha(authority) == '6d156e0ce3986b517a34db11051af88da934ae922b23a6776d73b0bb3f9d4e2c'
a = json.loads(authority.read_text())
def docker(*args):
    return subprocess.check_output(['docker', *args], text=True, encoding='utf-8', timeout=45)
info = json.loads(docker('info', '--format', '{{json .}}'))
ids = docker('ps', '-q', '--no-trunc').split()
rows = []
for container in ids:
    result = subprocess.run(['docker', 'inspect', container], capture_output=True, text=True, encoding='utf-8', timeout=30)
    if result.returncode and 'No such' in result.stderr:
        continue  # Fixed workers can finish between the two read-only snapshots.
    assert result.returncode == 0
    x = json.loads(result.stdout)[0]
    h = x['HostConfig']
    rows.append({'id': x['Id'], 'name': x['Name'], 'owner': x['Config']['Labels'].get('venus.c2.owner'),
                 'image': x['Image'], 'cpus': h['NanoCpus']/1e9, 'memory_bytes': h['Memory'], 'pids_limit': h['PidsLimit']})
stats = [json.loads(line) for line in docker('stats', '--no-stream', '--format', '{{json .}}').splitlines() if line]
owned = [x for x in rows if x['owner'] is not None]
foreign = [x for x in rows if x['owner'] is None]
assert len(owned) <= 8
assert all(x['owner'] in owners and x['cpus'] == 1 and x['memory_bytes'] == 1610612736 and x['pids_limit'] == 64
           and x['image'] == 'sha256:58d8c700adbbca2251743eff25324102885b3ba8f67fd859c5c8d10d23f789e3' for x in owned)
assert sorted(x['id'] for x in foreign) == sorted(a['foreign_running_ids_expected'])
assert all(x['cpus'] > 0 and x['memory_bytes'] > 0 for x in foreign)
assert sum(float(x['CPUPerc'].rstrip('%')) for x in stats)/100 + cpu + 2 <= info['NCPU']
assert 8*1610612736 + sum(x['memory_bytes'] for x in foreign) + 3758096384 + 4294967296 <= info['MemTotal']
free = shutil.disk_usage(r).free
assert free >= 42949672960
receipt = {'observed_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'docker_cpus': info['NCPU'],
           'docker_memory_bytes': info['MemTotal'], 'disk_free_bytes': free, 'running_container_resources': rows,
           'actual_stats': stats, 'statistics_manifest_sha256': sha(manifest), 'statistics_workers_observed': len(owned),
           'foreign_running_ids': [x['id'] for x in foreign], 'new_envelope_CPU': cpu, 'bounds': 'PASS',
           'scope': 'ONE_EXISTING_A21_GATE_MANUAL_START_UNDER_RESOURCE06_NO_METHOD_CHANGE'}
out.write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'path': str(out), 'sha256': sha(out), 'bounds': 'PASS', 'observed_stats_workers': len(owned), 'disk_free_bytes': free}))
