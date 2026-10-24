"""Read-only frozen evidence/source audit. No Docker, planner execution or product writes."""
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
E = ROOT / '.docs/implementation/evidence/p05/recovery-method17-chromium-actual01'
S = ROOT / '.artifacts/p05-recovery-source1274-01'
OUT = Path(__file__).parent

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def load(p):
    return json.loads(p.read_text(encoding='utf-8'))

def verify_index(p, expected):
    assert sha(p / 'INDEX.json') == expected
    index = load(p / 'INDEX.json')
    for f in index['files']:
        q = p / f['path']
        assert q.stat().st_size == f['bytes'] and sha(q) == f['sha256'], f['path']
    return len(index['files'])

assert verify_index(E, '83d8ccf9fec5929024ca79e2dac7b7472aada4998d820cfa4e168cf84266486f') == 43
raw = load(E / 'raw-path-map.json')
working = S / '.artifacts/p05/venus-topic-browser-e127bdab3c11'
for item in raw:
    assert sha(E / item['archived']) == item['sha256']
    assert sha(working / item['original']) == item['sha256']
before, after = [load(E / 'run' / n) for n in ['inputs-before.json', 'inputs-after.json']]
assert before == after
assert len(before['files']) == 1813
for name, digest in before['files'].items():
    assert sha(S / name) == digest, name
pins = load(E / 'run/producer-pins.json')
for name, digest in pins.items():
    archived = E / 'run/producer' / (name + '.bytes' if name == 'DESIGN.md' else name)
    assert sha(archived) == digest
ack = load(E / 'p05-recovery-method17-root-ack01.json')
assert ack['status'] == 'ROOT_RUN_ACK'
report = load(E / 'run/topic-browser-report.json')
assert [r['id'] for r in report['records']] == [f'P05-TB-{n:02}' for n in range(1,17)]
assert [r['status'] for r in report['records']] == ['PASS']*3+['FAIL']+['NOT_RUN']*12
dispatch = report['mutation_dispatches']
assert Counter(d['control'] for d in dispatch) == {'game-skip':20,'game-next':19}
assert all(d['result']=='EXACT_RECEIPT_VERIFIED' and d['response_status']==200 for d in dispatch)
assert not report['page_errors']
runner = load(E / 'run/runner.json')
assert runner['status']=='FAIL' and runner['cleanup']=='PASS'
for name in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:
    assert not (E / 'run' / name).read_text(encoding='utf-8').strip()
diff = load(E / 'run/fixture-diff.json')
assert sha(E / 'run/harness-original.mjs') == diff['original_sha256']
assert sha(E / 'run/harness-derivative.mjs') == diff['derivative_sha256']
original = (E / 'run/harness-original.mjs').read_text(encoding='utf-8')
derived = original
for change in diff['exact_semantic_replacements']:
    assert derived.count(change['before']) == 1
    derived = derived.replace(change['before'],change['after'])
assert derived == (E / 'run/harness-derivative.mjs').read_text(encoding='utf-8')

planner = (S / 'packages/relationship-engine/src/topic-planner.ts').read_text(encoding='utf-8')
api = (S / 'apps/api/src/topic-games.ts').read_text(encoding='utf-8')
browser = (E / 'run/producer/browser.mjs').read_text(encoding='utf-8')
assert "seed:randomBytes(32).toString('hex')" in api
assert "&&rng.next()<(stage<3?0:stage===3?.22:.4)" in planner
assert "for(let n=0;n<20;n++)" in browser
assert "Read settling must never skip planner rounds" in browser
assert "No real private encounter within declared20-round bound" in browser
# Predicate counterexamples, not a replay, seed search or an assertion about actual seed.
for stage in range(1,5):
    threshold = 0 if stage < 3 else .22 if stage == 3 else .4
    assert not (3 > 0 and 0 < 5 and .99 < threshold)
assert not (0 > 0 and 0 < 5 and 0 < .4)
assert (3 > 0 and 0 < 5 and .1 < .22)
result = {
    'status':'PASS_READONLY_CHECKPOINT_AUDIT_NOT_FUNCTIONAL_PASS',
    'evidence_index_sha256':sha(E/'INDEX.json'), 'evidence_children':43,
    'raw_archive_and_original_files_verified':len(raw),
    'historical_source_files_verified':len(before['files']),
    'historical_source_identity':before['source_identity_sha256'],
    'runtime_pins_verified':len(pins), 'runtime_pins':pins,
    'root_ack_sha256':sha(E/'p05-recovery-method17-root-ack01.json'),
    'actual_counts':dict(Counter(r['status'] for r in report['records'])),
    'actual_dispatches':dict(Counter(d['control'] for d in dispatch)),
    'strict_receipts_200':len(dispatch),'cleanup':'PASS',
    'source_predicate_counterexamples':6,
    'scope':'Historical source slice; no Docker, runtime rerun, source mutation, seed search or final-stage acceptance.'
}
(OUT/'audit-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
