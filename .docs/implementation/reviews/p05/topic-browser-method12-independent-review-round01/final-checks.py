"""Final readonly syntax, source identity and existing image-proof checks."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path.cwd()
OUT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'tools'))
from stage_inventory import inventory, identity

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

rows = []
node = Path('C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe')
producer = ROOT / '.artifacts/p05-private-batch-browser-producer12'
for path in sorted(producer.glob('*.mjs')):
    argv = [str(node), '--check', str(path)]
    result = subprocess.run(argv, capture_output=True, text=True, check=False)
    rows.append({'argv': argv, 'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    assert result.returncode == 0, path
files = inventory()
current_identity = identity(files)
assert current_identity == '1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
assert len(files) == 1813
proof = ROOT / '.docs/implementation/evidence/p05/observer-image-pins-preflight-01'
assert sha(proof / 'index.json') == '68016ab14171d501d58bc9de2a3cf114c2701d1b413d4fd09ed4f082925a5827'
index = json.loads((proof / 'index.json').read_text())
for row in index['files']:
    assert sha(proof / row['path']) == row['sha256'], row['path']
assert index['source_identity'] == current_identity
assert index['image'] == 'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4'
assert index['files_probed'] == 4
result = {'status': 'PASS', 'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'source_identity': current_identity, 'included_files': len(files), 'syntax_checks': rows, 'image_proof_index_sha256': sha(proof / 'index.json'), 'image_proof_child_files_verified': len(index['files']), 'new_image_probe': False}
(OUT / 'final-checks.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'PASS', 'syntax': len(rows), 'identity': current_identity, 'files': len(files)}))
