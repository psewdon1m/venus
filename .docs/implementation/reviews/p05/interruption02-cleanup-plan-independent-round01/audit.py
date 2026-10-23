import hashlib
import json
from pathlib import Path
from zipfile import ZipFile
from datetime import datetime, timezone

ROOT = Path('C:/.projects/venus')
OUT = ROOT / '.docs/implementation/reviews/p05/interruption02-cleanup-plan-independent-round01'
BASE = ROOT / '.artifacts/p05-fixedrange-interruption-recovery02'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
idx = load(BASE / 'INDEX.json')
plan = load(BASE / 'CLEANUP_PLAN.json')
pins = load(BASE / 'RAW_PINS.json')
terminal_path = Path(plan['parent_terminal_path'])
terminal = load(terminal_path)
assert sha(BASE / 'INDEX.json') == '16cf32f0f8e96ec5ae85cc91045bf7c891ec358bbe56e785e3617014c10ad2eb'
assert sha(BASE / 'CLEANUP_PLAN.json') == 'f834f4c6cdc7b80f3152003d4d5a18f46525b7eeb016436f05bc393a210401d8'
assert sha(terminal_path) == plan['parent_terminal_sha256'] == idx['parent_terminal_sha256']
assert sha(BASE / 'RAW_PINS.json') == plan['raw_pins_sha256'] == idx['raw_pins_sha256']
assert sha(BASE / 'stopped-synthetic-raw.zip') == plan['archive_sha256'] == idx['archive_sha256']
failed = [r for r in terminal['records'] if not r['ok']]
assert len(failed) == len(plan['resources']) == len(idx['rows']) == 8
assert len(terminal['records']) == 995 and sum(r['ok'] for r in terminal['records']) == 987
assert plan['resources'] == idx['rows']
assert {r['owner'] for r in failed} == {r['owner'] for r in plan['resources']}
assert idx['mutations_performed'] == 0 and plan['credit'] == 0
assert len(idx['calls']) == 24 and all(c['exit'] == 0 for c in idx['calls'])
assert len(pins['files']) == idx['raw_files'] == 32
raw_paths = {p['path'] for p in pins['files']}
assert len(raw_paths) == 32
for pin in pins['files']:
    p = BASE / pin['path']
    assert p.is_file() and p.stat().st_size == pin['bytes'] and sha(p) == pin['sha256']
assert sum(p['bytes'] for p in pins['files']) == idx['raw_bytes'] == 12750296
with ZipFile(BASE / 'stopped-synthetic-raw.zip') as z:
    files = {n for n in z.namelist() if not n.endswith('/')}
    assert files == raw_paths
    for pin in pins['files']:
        data = z.read(pin['path'])
        assert len(data) == pin['bytes'] and hashlib.sha256(data).hexdigest() == pin['sha256']
    assert z.testzip() is None
for row in plan['resources']:
    owner = row['owner']
    prior = next(r for r in failed if r['owner'] == owner)
    assert all(prior[k] == row[k] for k in ('ordinal', 'lane', 'range'))
    inspect = load(BASE / owner / 'safe-inspect.json')
    ack = load(BASE / owner / 'original-ACK.json')
    host = load(BASE / owner / 'original-host-report.json')
    assert sha(BASE / owner / 'safe-inspect.json') == row['safe_inspect_sha256']
    assert sha(BASE / owner / 'original-ACK.json') == row['original_ACK_sha256']
    assert sha(BASE / owner / 'original-host-report.json') == row['original_host_report_sha256'] == prior['host_report_sha256']
    assert Path(prior['host_report']).read_bytes() == (BASE / owner / 'original-host-report.json').read_bytes()
    assert (ROOT / '.artifacts/p05-full-original-execution04/acks' / (owner + '.json')).read_bytes() == (BASE / owner / 'original-ACK.json').read_bytes()
    assert inspect['Id'] == row['container_id'] and inspect['Name'] == '/' + row['container']
    assert inspect['Labels'] == {'venus.c2.owner': owner} == inspect['volume']['Labels']
    assert inspect['Image'] == row['image'] == ack['image_id'] == host['image']
    assert inspect['Image'] == 'sha256:58d8c700adbbca2251743eff25324102885b3ba8f67fd859c5c8d10d23f789e3'
    assert ack['source_identity'] == host['source_identity'] == '6562438b8bc1b413ff717bf03ecf4d47380c71ea12a358264ba02b7675ece10e'
    assert ack['owner'] == host['owner'] == owner and ack['range'] == host['range'] == row['range']
    assert host['status'] == 'FAIL' and host['producer_unchanged'] and not host['export_verified']
    state = inspect['State']
    assert state['Status'] == 'exited' and state['Running'] is False and state['Paused'] is False and state['Restarting'] is False
    assert state['Pid'] == 0 and state['ExitCode'] == row['native_exit_code'] == 255 and row['expected_stopped']
    assert inspect['volume']['Name'] == row['volume'] and inspect['volume']['Driver'] == 'local'
    cfg = inspect['HostConfig']
    assert cfg == {'Memory': 1610612736, 'MemorySwap': 1610612736, 'NanoCpus': 1000000000, 'PidsLimit': 64, 'ReadonlyRootfs': True, 'NetworkMode': 'none'}
    mounts = {m['Destination']: m for m in inspect['Mounts']}
    assert set(mounts) == {'/artifacts', '/run/consumer', '/run/pilot-range-review-index.json', '/run/pilot-range-root-ack.json'}
    assert mounts['/artifacts']['Type'] == 'volume' and mounts['/artifacts']['Name'] == row['volume'] and mounts['/artifacts']['RW'] is True
    for dst in set(mounts) - {'/artifacts'}:
        assert mounts[dst]['Type'] == 'bind' and mounts[dst]['RW'] is False
    assert mounts['/run/consumer']['Source'].endswith('/.artifacts/p05-pilot-corpus-ranges02')
    assert mounts['/run/pilot-range-review-index.json']['Source'].endswith('/.docs/implementation/reviews/p05/pilot-corpus-ranges-independent-round02/INDEX.json')
    assert mounts['/run/pilot-range-root-ack.json']['Source'].endswith('/.artifacts/p05-full-original-execution04/acks/' + owner + '.json')
    assert row['summary_present'] is False and row['credit'] == 'SUPPLEMENTAL_UNCOUNTED_NO_ACCEPTANCE'
    assert not list((BASE / owner / 'export').rglob('*summary*'))
    assert len(list((BASE / owner / 'export').rglob('*.partial'))) == 1
expected_mutations = [['container', 'rm', r['container']] for r in plan['resources']] + [['volume', 'rm', r['volume']] for r in plan['resources']]
assert plan['mutations'] == expected_mutations
result = {'status': 'PASS_PROSPECTIVE_EXACT_EIGHT_CLEANUP_ONLY', 'at': datetime.now(timezone.utc).isoformat(), 'archive_index_sha256': sha(BASE / 'INDEX.json'), 'cleanup_plan_sha256': sha(BASE / 'CLEANUP_PLAN.json'), 'parent_terminal_sha256': sha(terminal_path), 'raw_files_verified': 32, 'raw_bytes_verified': idx['raw_bytes'], 'archive_bytes_verified': (BASE / 'stopped-synthetic-raw.zip').stat().st_size, 'failed_slots': 8, 'normal_successful_carry_count': 987, 'planned_nonforce_mutations': 16, 'reviewer_docker_calls': 0, 'supplemental_credit': 0, 'live_recheck_required_before_mutation': True, 'actual_cleanup_acceptance': False, 'continuation_acceptance': False, 'statistical_acceptance': False, 'stage_acceptance': False}
(OUT / 'AUDIT.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result))
