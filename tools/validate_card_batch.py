#!/usr/bin/env python3
"""Validate an agent Card Batch Request and optional pinned pack digest.

Usage: python tools/validate_card_batch.py .docs/examples/card-batch-request.json \
   --catalog-manifest .docs/examples/pack-candidate-manifest.json
No network access or user-private data is required.
"""
from pathlib import Path
import argparse,json,sys
from jsonschema import Draft202012Validator,FormatChecker

ROOT=Path(__file__).resolve().parents[1]
SCHEMA=ROOT/'.docs/contracts/card-batch.schema.json'


def load(p):return json.loads(Path(p).read_text('utf-8'))


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('batch_request',type=Path)
    ap.add_argument('--catalog-manifest',type=Path)
    ap.add_argument('--existing-cards',type=Path,help='directory holding existing card JSON; optional collision check')
    args=ap.parse_args()
    errors=[]
    try:
        d=load(args.batch_request);schema=load(SCHEMA)
    except Exception as ex:
        print('BATCH-001 cannot load JSON:',ex);return 1
    Draft202012Validator.check_schema(schema)
    v=Draft202012Validator(schema,format_checker=FormatChecker())
    errors.extend(f'BATCH-001 {err.message}' for err in v.iter_errors(d))
    if not errors:
        n=d['count'];start,end=d['id_range']
        if end-start+1!=n:errors.append(f'BATCH-002 id_range span {end-start+1} != count={n}')
        for key in ['relationship_scope_distribution','comfort_distribution','progression_distribution']:
            total=sum(d[key].values())
            if total!=n:errors.append(f'BATCH-003 {key} sum={total} != count={n}')
        if set(d['languages'])!={'ru','en','tr'}:errors.append('BATCH-004 must include exactly ru,en,tr')
        if d['mode']=='yes_but' and any(x in ('group','solo') for x in d['allowed_interactions']):
            errors.append('BATCH-005 yes_but cannot target group/solo')
        if any(x in ('group','solo') for x in d['allowed_interactions']) and any(d['relationship_scope_distribution'].get(r,0)>0 for r in ('gentle_initiative','mutual_romantic','established_couple')):
            # This is only ambiguous for mixed batches; planning agent must refine per-card distribution.
            print('WARNING BATCH-006: ensure targeted relationship scopes apply to pairs only')
        if args.catalog_manifest:
            try:
                c=load(args.catalog_manifest)
                if d['source_catalog_digest']!='sha256:'+c['canonical_payload_sha256']:
                    errors.append('BATCH-007 input source digest != pinned catalog manifest')
                if d['pack_id']!=c['pack_id']:
                    errors.append('BATCH-007 pack_id mismatch')
            except Exception as ex:errors.append(f'BATCH-007 invalid catalog manifest: {ex}')
        if args.existing_cards:
            prefix={'questions':'Q','truth_or_dare':'TD','yes_but':'YB'}[d['mode']]
            reserved={f'{prefix}-{i:04d}' for i in range(start,end+1)}
            for path in args.existing_cards.rglob('*.json'):
                try:
                    x=load(path)
                except Exception as ex:
                    errors.append(f'BATCH-008 invalid existing catalog JSON {path}: {ex}');continue
                if x.get('id') in reserved:
                    errors.append(f"BATCH-008 reserved ID collision with existing {x['id']} at {path}")
    print('Batch request:',d.get('batch_id','<invalid>'),'errors=',len(errors))
    for err in errors:print('ERROR',err)
    return 1 if errors else 0

if __name__=='__main__':sys.exit(main())
