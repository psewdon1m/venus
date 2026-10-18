"""Validate every declared JSON schema and local API references; fail closed."""
import json
from pathlib import Path
import sys
from jsonschema import Draft202012Validator
from check_p00 import local_refs

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
paths = sorted((root/'.docs/contracts').glob('*.schema.json'))
paths += [root/'.docs/contracts/card.schema.json', root/'.docs/contracts/card-batch.schema.json']
for path in set(paths):
    schema = json.loads(path.read_text('utf-8'))
    Draft202012Validator.check_schema(schema)
    assert not local_refs(schema), str(path)
for api_path in sorted((root/'.docs/contracts').glob('*.openapi.json')):
    api = json.loads(api_path.read_text('utf-8'))
    assert api['openapi'] == '3.1.0' and not local_refs(api), str(api_path)
    for schema in api['components']['schemas'].values():
        Draft202012Validator.check_schema(schema)
    if 'x-base-contract' in api:
        import hashlib
        base=api['x-base-contract'];assert hashlib.sha256((api_path.parent/base['path']).read_bytes()).hexdigest()==base['sha256']
print('PASS: JSON Schema 2020-12 and OpenAPI local references')
