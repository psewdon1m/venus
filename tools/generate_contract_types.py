"""Generate the transport types from immutable P00 OpenAPI; --check rejects drift."""
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
api=json.loads((ROOT/'.docs/contracts/api.v1.openapi.json').read_text('utf-8'))
def ts(s):
    if '$ref' in s:return s['$ref'].split('/')[-1]
    if 'const' in s:return json.dumps(s['const'])
    if 'enum' in s:return ' | '.join(json.dumps(v) for v in s['enum'])
    t=s.get('type')
    if isinstance(t,list):return ' | '.join(ts({**s,'type':item}) for item in t)
    if not s.get('properties') and ('oneOf' in s or 'anyOf' in s):return ' | '.join(ts(v) for v in s.get('oneOf',s.get('anyOf')))
    if t=='array':return f'Array<{ts(s["items"])}>'
    if t=='object':
        props=s.get('properties',{});required=s.get('required',[])
        if not props:return 'Record<string, '+(ts(s['additionalProperties']) if isinstance(s.get('additionalProperties'),dict) else 'never')+'>'
        return '{ '+ '; '.join(json.dumps(k)+('' if k in required else '?')+': '+ts(v) for k,v in props.items())+' }'
    return {'integer':'number','number':'number','string':'string','boolean':'boolean','null':'null'}.get(t,'unknown')
text='// Generated from .docs/contracts/api.v1.openapi.json. Run python tools/generate_contract_types.py.\n'
text+='\n'.join('export type '+name+' = '+ts(schema)+';' for name,schema in api['components']['schemas'].items())+'\n'
p=ROOT/'packages/contracts/src/generated.ts'
schemas=json.loads(json.dumps(api['components']['schemas']).replace('#/components/schemas/','#/$defs/'))
schema_text=json.dumps(schemas,ensure_ascii=False,indent=2)+'\n'
schema_path=ROOT/'packages/contracts/src/schemas.json'
if '--check' in sys.argv:
    if not p.is_file() or p.read_text('utf-8')!=text:raise SystemExit('Generated transport contracts are stale')
    if not schema_path.is_file() or schema_path.read_text('utf-8')!=schema_text:raise SystemExit('Generated runtime schemas are stale')
else:
    p.write_text(text,encoding='utf-8');schema_path.write_text(schema_text,encoding='utf-8')
