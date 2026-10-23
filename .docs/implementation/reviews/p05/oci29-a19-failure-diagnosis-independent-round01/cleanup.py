"""One approved OCI29 project only. Never executed by the preparing reviewer."""
from pathlib import Path
import hashlib, json, subprocess, sys, time

if sys.argv[1:] != ['--execute']:
    raise SystemExit('Requires explicit root approval, then --execute. No Docker action performed.')
base = Path(__file__).resolve().parent
root = Path('C:/.projects/venus')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(base / 'CLEANUP-PLAN.json') == '585ab51cf29d2d5102d5db3dc69440e0deb720d6c4452575c37e2e78b227fca5'
plan = json.loads((base / 'CLEANUP-PLAN.json').read_text())
owner, project = plan['owner'], plan['project']
assert owner == '15c9560d4f0ab1d8e08e14c6a7987eb3' and project == 'venus-p05-oci-8f430f802c66'
assert sha(base / 'QUERY-FORMATS.json') == '13f2cd49fb2ffa1801f6e7da5337ac1ccc3c8272b87aa1573866ac437164c14c'
formats = json.loads((base / 'QUERY-FORMATS.json').read_text())
objects = plan['objects']
assert [len(objects[k]) for k in ['container', 'volume', 'network']] == [2, 4, 1]
output = root / '.artifacts/p05-oci29-owned-cleanup01'
assert not output.exists(), 'Preserve prior attempt; no automatic cleanup retry'
output.mkdir()
deadline = time.monotonic() + 180
calls, mutations = [], 0

def retained():
    assert sha(base / 'SAFE-EXPORT-PINS.json') == plan['safe_export_pins_sha256']
    for rel, pin in json.loads((base / 'SAFE-EXPORT-PINS.json').read_text())['files'].items():
        p = base / 'safe' / rel
        assert p.is_file() and not p.is_symlink() and sha(p) == pin['sha256'] and p.stat().st_size == pin['bytes']
    p = Path(plan['archive']['path'])
    assert sha(p) == plan['archive']['sha256'] and p.stat().st_size == plan['archive']['bytes']

def call(args, mutation=False):
    global mutations
    remaining = deadline - time.monotonic()
    assert remaining > 0
    if mutation:
        mutations += 1
    row = {'args': args, 'mutation': mutation}
    calls.append(row)
    p = subprocess.run(['docker', *args], capture_output=True, text=True, timeout=min(20, remaining))
    row.update(exit=p.returncode, stdout_bytes=len(p.stdout.encode()), stdout_sha256=hashlib.sha256(p.stdout.encode()).hexdigest(), stderr_bytes=len(p.stderr.encode()), stderr_sha256=hashlib.sha256(p.stderr.encode()).hexdigest())
    assert p.returncode == 0, 'Docker refusal; stop and preserve receipt'
    return p.stdout.strip()

def inventory(kind, label):
    prefix = {'container': ['ps', '-aq', '--no-trunc'], 'volume': ['volume', 'ls', '-q'], 'network': ['network', 'ls', '-q', '--no-trunc']}[kind]
    return sorted(filter(None, call(prefix + ['--filter', label]).splitlines()))

def inspect(kind, expected):
    identity = expected.get('id', expected['name'])
    current = json.loads(call([kind, 'inspect', '--format', formats[kind], identity]))
    if kind == 'container':
        current['mounts'] = [{'type': m.get('Type'), 'name': m.get('Name'), 'destination': m.get('Destination'), 'rw': m.get('RW')} for m in current['mounts']]
    assert current['labels'].get('com.venus.oci.owner') == owner and current['labels'].get('com.venus.oci.project') == project
    keys = {'container': ['id', 'name', 'image', 'labels', 'mounts'], 'volume': ['name', 'driver', 'labels'], 'network': ['id', 'name', 'driver', 'labels']}[kind]
    assert all(current[k] == expected[k] for k in keys), 'Owned identity projection changed'
    if kind == 'container' and current['name'].endswith('-db'):
        assert current['running'] is False, 'Unexpected running DB; no automatic stop'
    return current

status, error = 'FAIL_STOPPED_NO_RETRY', None
try:
    retained()
    for kind in ['container', 'volume', 'network']:
        for label in ['label=com.venus.oci.owner=' + owner, 'label=com.venus.oci.project=' + project]:
            assert inventory(kind, label) == plan['expected_owner_inventory'][kind], 'Unexpected project/owner inventory'
        for expected in objects[kind]:
            inspect(kind, expected)
    # All seven objects are checked before any mutation. Only the known keeper may be stopped.
    for expected in objects['container']:
        current = inspect('container', expected)
        if current['running']:
            assert current['name'] == '/' + project + '-keeper'
            call(['stop', '--time', '5', expected['id']], mutation=True)
            current = inspect('container', expected)
            assert current['running'] is False
        call(['container', 'rm', expected['id']], mutation=True)
    for expected in objects['network']:
        current = inspect('network', expected)
        assert not current['containers'], 'Do not detach or remove a network with endpoints'
        call(['network', 'rm', expected['id']], mutation=True)
    for expected in objects['volume']:
        inspect('volume', expected)
        call(['volume', 'rm', expected['name']], mutation=True)
    for kind in ['container', 'volume', 'network']:
        for label in ['label=com.venus.oci.owner=' + owner, 'label=com.venus.oci.project=' + project]:
            assert inventory(kind, label) == []
    retained()
    status = 'PASS_EXACT_OCI29_OWNED_EMPTY_ONLY'
except Exception as exc:
    error = type(exc).__name__
finally:
    receipt = {'status': status, 'owner': owner, 'project': project, 'plan_sha256': sha(base / 'CLEANUP-PLAN.json'), 'script_sha256': sha(Path(__file__).resolve()), 'calls': calls, 'attempted_mutations': mutations, 'error_type': error, 'safe_archive_sha256': plan['archive']['sha256'], 'full_P05_PASS': False}
    (output / 'TERMINAL.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in receipt.items() if k != 'calls'}))
if status != 'PASS_EXACT_OCI29_OWNED_EMPTY_ONLY':
    raise SystemExit(1)
