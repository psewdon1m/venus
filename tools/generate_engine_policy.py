"""Generate the server-only exact RE-1 policy copy; never rewrites normative inputs."""
import argparse
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
raw=(ROOT/'.docs/contracts/relationship-policy.v1.json').read_bytes()
outputs={'packages/relationship-engine/src/policy.json':raw,'packages/relationship-engine/src/policy-identity.ts':('export const policyDigest="sha256:'+hashlib.sha256(raw).hexdigest()+'";\n').encode()}
outputs['packages/relationship-engine/src/card-schema.json']=(ROOT/'.docs/contracts/card.schema.json').read_bytes()
for name,data in outputs.items():
    path=ROOT/name
    if args.check:
        if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale engine policy: '+name)
    else:path.write_bytes(data)
