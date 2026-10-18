#!/usr/bin/env python3
"""Build deterministic metadata manifest for a vetted Venus card pack.

This program DOES NOT publish, sign, approve or amend source cards.
Run a real protected CI release after all human/content/rights checks.

python tools/build_card_pack.py .docs/examples/cards --out .docs/examples/pack-candidate-manifest.json
python tools/build_card_pack.py content/cards --out build/cards-pack-manifest.json --release
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys
import unicodedata

from jsonschema import Draft202012Validator, FormatChecker
from validate_cards import check_directory, _pairs_no_duplicates, SCHEMA, FIELDS, MAX_FILE_BYTES

ROOT=Path(__file__).resolve().parents[1]
POLICY=ROOT/'.docs/contracts/relationship-policy.v1.json'


def serialize(data):
    """Stable, human-auditable project canonicalization; version with this tool."""
    def nfc(v):
        if isinstance(v,str):return unicodedata.normalize('NFC',v)
        if isinstance(v,dict):return {nfc(k):nfc(value) for k,value in v.items()}
        if isinstance(v,list):return [nfc(x) for x in v]
        return v
    return json.dumps(nfc(data),ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode('utf-8')


def hash_bytes(data):return hashlib.sha256(data).hexdigest()


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('cards',type=Path)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--release',action='store_true',help='requires reviewed rights-approved >=100 cards per mode')
    p.add_argument('--minimum',type=int,default=100)
    p.add_argument('--pack-revision',type=int,default=1)
    p.add_argument('--force',action='store_true',help='explicit overwrite of a prior local candidate manifest')
    args=p.parse_args()
    if args.minimum<1 or args.pack_revision<1:p.error('minimum and pack-revision must be positive')
    source=args.cards.resolve()
    paths=sorted(source.rglob('*.json')) if source.is_dir() else [source] if source.is_file() else []
    if not paths:print('FAIL: no card JSON files',file=sys.stderr);return 1
    schema=json.loads(SCHEMA.read_text('utf-8'))
    Draft202012Validator.check_schema(schema)
    validator=Draft202012Validator(schema,format_checker=FormatChecker())
    cards=[];valid_paths=[];entry=[];errors=[];categories=Counter();coverage=Counter();reviewed=0
    for path in paths:
        try:
            if path.stat().st_size>MAX_FILE_BYTES:raise ValueError('card file >128KiB')
            card=json.loads(path.read_text('utf-8'),object_pairs_hook=_pairs_no_duplicates)
            if not isinstance(card,dict):raise ValueError('not object')
        except Exception as exc:
            errors.append(f'{path.name}: invalid file: {exc}');continue
        e=list(validator.iter_errors(card))
        if e:
            errors.extend(f'{path.name}: SCHEMA {x.message}' for x in e);continue
        cards.append(card);valid_paths.append(path)
        categories[(card['mode'],card['category'])]+=1
        for ctx in card['meeting_contexts']:
            coverage[(card['mode'],ctx,card['min_comfort'],card['min_progression_stage'],card['relationship_scope'])]+=1
        reviewed+=int(card['status']=='reviewed')
        entry.append({'id':card['id'],'revision':card['revision'],
                      'sha256':hash_bytes(serialize(card)),'status':card['status']})
    semantic,_=check_directory(cards,valid_paths,args.release,args.minimum)
    errors.extend(f"{x['file']}: {x['code']}: {x['message']}" for x in semantic)
    pack_ids={x['pack_id'] for x in cards}; policy_revs={x['authoring']['policy_revision'] for x in cards}
    if len(pack_ids)!=1:errors.append(f'conflicting pack_ids: {pack_ids}')
    if policy_revs!={'RE-1'}:errors.append(f'conflicting policy revisions: {policy_revs}')
    if errors:
        print(f'BLOCK: {len(errors)} validation errors; manifest not written',file=sys.stderr)
        for e in errors[:60]:print('ERROR',e,file=sys.stderr)
        return 1
    entries=sorted(entry,key=lambda d:(d['id'],d['revision']))
    policy_sha=hash_bytes(POLICY.read_bytes())
    manifest={
      'schema_version':1,'pack_id':next(iter(pack_ids)),'pack_revision':args.pack_revision,
      'content_contract_revision':'CARD-1','policy_revision':'RE-1','policy_sha256':policy_sha,
      'status':'reviewed_release_candidate' if args.release else 'illustrative_draft_candidate',
      'locale_codes':['ru','en','tr'],
      'total_cards':len(entries),'reviewed_cards':reviewed,
      'mode_counts':dict(sorted(Counter(x['mode'] for x in cards).items())),
      'category_counts':{f'{m}/{cat}':n for (m,cat),n in sorted(categories.items())},
      'eligibility_cell_counts':{f'{m}/{ctx}/C{com}/S{stage}/{rel}':n for (m,ctx,com,stage,rel),n in sorted(coverage.items())},
      'cards':entries,
      'caveats':['not a signed release artifact','human safety/localization/rights review not machine proven',
                 'full 2..8-player progression coverage requires engine-driven matrix tests']
    }
    digest=hash_bytes(serialize(manifest));manifest['canonical_payload_sha256']=digest
    output=args.out.resolve()
    if output.exists() and not args.force:
        print(f'BLOCK: output exists; use --force to overwrite candidate: {output}',file=sys.stderr)
        return 1
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f"CANDIDATE ONLY: {len(cards)} validated cards, digest sha256:{digest}; output={output}")
    return 0

if __name__=='__main__':sys.exit(main())
