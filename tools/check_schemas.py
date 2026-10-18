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
api = json.loads((root/'.docs/contracts/api.v1.openapi.json').read_text('utf-8'))
assert api['openapi'] == '3.1.0' and not local_refs(api)
for schema in api['components']['schemas'].values():
    Draft202012Validator.check_schema(schema)
print('PASS: JSON Schema 2020-12 and OpenAPI local references')
