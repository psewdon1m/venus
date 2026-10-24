import hashlib
import json
from pathlib import Path

ROOT = Path.cwd()
BASE = ROOT / '.docs/implementation/evidence/p05/planner-targeted-review-01'
AUTHOR = ROOT / '.docs/implementation/evidence/p05/planner-targeted-preparation-01'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

author_index = json.loads((AUTHOR / 'artifact-index.json').read_text(encoding='utf-8-sig'))
for row in author_index['files']:
    path = AUTHOR / row['file']
    assert path.stat().st_size == row['bytes'], row
    assert sha(path) == row['sha256'], row

snapshot = BASE / 'source'
inputs = []
for path in sorted(snapshot.rglob('*')):
    if path.is_file():
        rel = path.relative_to(snapshot)
        actual = ROOT / rel
        assert sha(actual) == sha(path), str(rel)
        inputs.append({'path':rel.as_posix(), 'bytes':path.stat().st_size, 'sha256':sha(path)})

planner = snapshot / 'packages/relationship-engine/src/topic-planner.ts'
data = planner.read_bytes()
begin = data.index(b'export const TOPIC_TARGETED_REPLACEMENT_VERSION')
end = data.index(b'/** Caller may record disclosure only after', begin)
old = data[:begin] + data[end:]
historical = ROOT / '.docs/implementation/reviews/p05/planner-round-01.source-topic-planner.ts'
assert old == historical.read_bytes()
assert hashlib.sha256(old).hexdigest() == '83f4b5e4bd96d3ad7d2bb00b533693fdee240a628123d983b6491bd2fc77775a'

result = {'author_artifacts_verified':len(author_index['files']), 'source_snapshot_files_verified':len(inputs),
          'source_unchanged':True, 'old_planner_exact_bytes_preserved':True, 'inputs':inputs}
(BASE / 'input-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({key:value for key,value in result.items() if key != 'inputs'}))
