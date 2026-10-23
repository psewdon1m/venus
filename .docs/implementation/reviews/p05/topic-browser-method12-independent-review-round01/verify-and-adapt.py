"""Independent inputs verification; rerun author assertions with path-only relocation."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path.cwd()
OUT = Path(__file__).resolve().parent
AUTHOR = ROOT / '.docs/implementation/reviews/p05/topic-browser-method12-preparation-round01'
PRODUCER = ROOT / '.artifacts/p05-private-batch-browser-producer12'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name, value):
    (OUT / name).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
assert sha(AUTHOR / 'index.json') == 'ad8083a619f45107095aa6b9040f77dcc0d9c9db9c8cb4d543b973ee598bd818'
assert sha(AUTHOR / 'HANDOFF.json') == 'be662e90ea8fcc0ee7bd217fc412c0dac10d5f405d2607f098b02b717037c440'
idx = json.loads((AUTHOR / 'index.json').read_text())
for row in idx['files']:
    path = AUTHOR / row['path']
    assert sha(path) == row['sha256'], row['path']
    assert path.stat().st_size == row['bytes'], row['path']
handoff = json.loads((AUTHOR / 'HANDOFF.json').read_text())
for name, digest in handoff['runtime_pins'].items():
    assert sha(PRODUCER / name) == digest, name
    snapshot_name = name + '.bytes' if name.endswith('.md') else name
    assert sha(AUTHOR / 'producer' / snapshot_name) == digest, name
freeze = ROOT / '.docs/implementation/evidence/p05/renewal-source-freeze-01'
freeze_idx = json.loads((freeze / 'index.json').read_text())
assert sha(freeze / 'included-source.zip') == freeze_idx['archive_sha256']
inputs = json.loads((AUTHOR / 'source-context.json').read_text())
assert inputs['identity'] == handoff['source_identity']
assert len(inputs['files']) == handoff['included_files'] == 1813
with zipfile.ZipFile(freeze / 'included-source.zip') as zf:
    for name, digest in inputs['files'].items():
        assert sha(ROOT / name) == digest, name
        assert hashlib.sha256(zf.read(name)).hexdigest() == digest, name
observer_review = ROOT / '.docs/implementation/reviews/p05/topic-private-batch-observer-review-round02'
assert sha(observer_review / 'index.json') == 'b171a3b0a34de747ab2bca671587435214c602f1e3549ebfa509fe709047f775'
for row in json.loads((observer_review / 'index.json').read_text())['files']:
    assert sha(observer_review / row['path']) == row['sha256'], row['path']
adaptations = []
for stem in ['integration', 'request']:
    source = AUTHOR / f'p05-method12-{stem}-controls01.mjs'
    text = source.read_text(encoding='utf-8')
    replacements = {
        "'../node_modules/typescript/lib/typescript.js'": repr((ROOT / 'node_modules/typescript/lib/typescript.js').as_uri()),
        "'./p05-private-batch-browser-producer12/request-emission.mjs'": repr((PRODUCER / 'request-emission.mjs').as_uri()),
        f"'.artifacts/p05-method12-{stem}-controls01.json'": repr((OUT / f'author-{stem}-rerun.json').as_posix()),
    }
    changes = []
    for before, after in replacements.items():
        if before in text:
            assert text.count(before) == 1
            text = text.replace(before, after)
            changes.append({'before': before, 'after': after})
    target = OUT / f'author-{stem}-rerun.mjs'
    target.write_text(text, encoding='utf-8')
    adaptations.append({'source': source.relative_to(ROOT).as_posix(), 'source_sha256': sha(source), 'target': target.name, 'target_sha256': sha(target), 'changes': changes, 'assertions': 'UNCHANGED'})
save('inputs-verification.json', {
    'status': 'PASS', 'source_identity': inputs['identity'], 'included_files_verified_host_and_zip': len(inputs['files']),
    'author_index_sha256': sha(AUTHOR / 'index.json'), 'author_handoff_sha256': sha(AUTHOR / 'HANDOFF.json'),
    'author_packet_files_verified': len(idx['files']), 'runtime_pins': handoff['runtime_pins'],
    'observer_review_index_sha256': sha(observer_review / 'index.json'),
    'image': handoff['image'], 'image_binding': 'EXISTING_FROZEN_EVIDENCE_ONLY_NO_DOCKER_REPROBE',
    'adaptations': adaptations,
})
print(json.dumps({'status': 'PASS', 'source_files': len(inputs['files']), 'packet_files': len(idx['files']), 'runtime_pins': len(handoff['runtime_pins'])}))
