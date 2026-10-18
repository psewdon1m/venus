#!/usr/bin/env python3
"""Venus cards: JSON Schema, locale parity, relationship/safety guards, catalog uniqueness.

Usage from repository root:
  python tools/validate_cards.py .docs/examples/cards
  python tools/validate_cards.py content/cards --release --minimum 100
  python tools/validate_cards.py .docs/examples/cards --report /tmp/cards-report.json

Agent-generated drafts do not become published by passing this script.
Human editorial, linguistic, rights, age-policy and coverage review remain required.
"""
from __future__ import annotations

from collections import Counter
import argparse
import copy
import json
from pathlib import Path
import re
import sys
import unicodedata

from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[1]
SCHEMA=ROOT/'.docs/contracts/card.schema.json'
LOCALES=('ru','en','tr')
FIELDS={'questions':('question',),'truth_or_dare':('truth','dare'),'yes_but':('proposal','responder')}
PREFIXES={'questions':'Q','truth_or_dare':'TD','yes_but':'YB'}
TOKEN=re.compile(r'\{([a-zA-Z][a-zA-Z0-9_]*)\}')
HTML=re.compile(r'<\s*\/?[a-zA-Z]|<!--|<\!DOCTYPE',re.I)
CONTROL=re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')
LINK=re.compile(r'https?://|www\.|\]\(',re.I)
MAX_FILE_BYTES=1024*128


def _pairs_no_duplicates(pairs):
    data={}
    for key,val in pairs:
        if key in data:
            raise ValueError(f'duplicate JSON object key: {key}')
        data[key]=val
    return data


def normalized(text):
    return ' '.join(re.sub(r'[^\w\s]', ' ', unicodedata.normalize('NFC',text).casefold()).split())


def check_card(card):
    """Deterministic *structural* safety validation; returns coded errors.

    Semantic safety and rights cannot be proved by metadata alone.
    """
    err=[]
    def E(code,msg):err.append({'code':code,'message':msg})
    raw_mode=card.get('mode')
    mode=raw_mode if isinstance(raw_mode,str) else None
    fields=FIELDS.get(mode,())
    identity=card.get('id')
    if mode in PREFIXES and not re.fullmatch(PREFIXES[mode]+r'-\d{4}',str(identity)):
        E('CARD-001','id prefix/number incompatible with mode')
    raw_interaction=card.get('interaction')
    interaction=raw_interaction if isinstance(raw_interaction,str) else None
    contexts=card.get('meeting_contexts')
    contexts=contexts if isinstance(contexts,list) else []
    capabilities=card.get('required_capabilities')
    capabilities=capabilities if isinstance(capabilities,list) else []
    tags=card.get('safety_tags')
    tags=tags if isinstance(tags,list) else []
    raw_comfort=card.get('min_comfort')
    comfort=raw_comfort if isinstance(raw_comfort,int) and not isinstance(raw_comfort,bool) else -1
    roles={'group':0,'solo':1,'pair_public':2,'pair_private':2}
    if interaction in roles and card.get('participants_required') != roles[interaction]:
        E('CARD-003','participants_required does not match interaction')
    if mode=='yes_but' and interaction not in ['pair_public','pair_private']:
        E('CARD-003','yes_but always requires a pair')
    if interaction in ('group','solo') and card.get('relationship_scope')!='none':
        E('CARD-004','group/solo requires relationship_scope=none')
    if interaction in ('pair_public','pair_private') and card.get('relationship_scope')=='none':
        E('CARD-004','pair requires relationship_scope != none')
    if interaction in ('pair_public','pair_private') and card.get('consent')!='bilateral':
        E('CARD-005','pair activation requires bilateral consent')
    if interaction=='pair_private':
        if not (card.get('consent')=='bilateral' and
                isinstance(card.get('min_comfort'),int) and card['min_comfort']>=1 and
                isinstance(card.get('min_progression_stage'),int) and card['min_progression_stage']>=3 and
                'private' in tags):
            E('CARD-005','private pair requires bilateral, stage >=3, comfort>=1 and private tag')
        if 'online' in contexts and 'private_text_chat' not in capabilities:
            E('CARD-008','online private pair requires private_text_chat feature capability')
    if card.get('requires_physical_contact'):
        if not (card.get('meeting_contexts')==['in_person'] and card.get('consent')=='bilateral' and
                card.get('min_comfort')==4 and 'physical_contact' in tags and
                card.get('min_progression_stage',0)>=3):
            E('CARD-006','physical contact only in_person, comfort 4, stage>=3, bilateral and physical tag')
    if card.get('requires_going_away'):
        if not (card.get('meeting_contexts')==['in_person'] and interaction=='pair_private' and card.get('consent')=='bilateral'):
            E('CARD-007','going-away is in_person private pair with bilateral consent only')
    if card.get('category')=='romance' or 'romantic' in tags:
        if comfort<2:
            E('CARD-009','romance/romantic tag requires comfort>=2')
    if (card.get('interaction')=='pair_private') != ('private' in tags):
        E('CARD-005','private tag must be present iff private pair interaction')
    if (card.get('requires_physical_contact') != ('physical_contact' in tags)):
        E('CARD-006','physical_contact tag must match requires_physical_contact')

    content=card.get('text')
    if not isinstance(content,dict):
        E('CARD-002','text must be localized object');content={}
    for field in fields:
        locale_tokens={}
        for lang in LOCALES:
            loc=content.get(lang,{})
            value=loc.get(field) if isinstance(loc,dict) else None
            if not isinstance(value,str):
                E('CARD-002',f'{lang}.{field} missing');continue
            if unicodedata.normalize('NFC',value)!=value or value.strip()!=value:
                E('CARD-011',f'{lang}.{field} is not NFC / has edge whitespace')
            if CONTROL.search(value) or HTML.search(value) or LINK.search(value):
                E('CARD-011',f'{lang}.{field} has control/HTML/link content')
            tokens=TOKEN.findall(value)
            if set(tokens)-{'P1','P2'}:
                E('CARD-010',f'{lang}.{field} invalid placeholders {tokens}')
            residue=TOKEN.sub('',value)
            if '{' in residue or '}' in residue:
                E('CARD-010',f'{lang}.{field} malformed placeholder braces')
            locale_tokens[lang]=set(tokens)
            # Responder side is generic "yes/but/no", not addressed to a named player.
            if field!='responder':
                if interaction=='solo' and 'P1' not in tokens:
                    E('CARD-010',f'{lang}.{field} solo must mention {{P1}}')
                if interaction in ('pair_public','pair_private') and 'P2' not in tokens:
                    E('CARD-010',f'{lang}.{field} pair must mention {{P2}}')
                if interaction=='group' and tokens:
                    E('CARD-010',f'{lang}.{field} group question cannot target a specific role')
        if len(locale_tokens)==3 and len(set(map(frozenset,locale_tokens.values())))!=1:
            E('CARD-010',f'{field}: locale placeholder roles do not match: {locale_tokens}')
    # Explicit status and rights gate; the agent cannot approve its own output.
    author=card.get('authoring')
    if card.get('status')=='reviewed':
        if (not isinstance(author,dict) or not author.get('reviewed_by') or
            not author.get('reviewed_at') or author.get('rights_status')!='original_verified' or
            author.get('origin')=='example'):
            E('CARD-012','reviewed requires named human reviewer, date, verified original rights, non-example')
    elif isinstance(author,dict) and author.get('rights_status')=='original_verified' and author.get('origin')=='agent':
        # Rights review cannot be self-asserted by unreviewed generated drafts.
        E('CARD-012','unreviewed agent draft cannot mark rights original_verified')
    return err


def check_directory(cards, paths, release=False, minimum=100):
    errors=[];counts=Counter();seen={};unique_text={}
    seen_id={}
    for card,path in zip(cards,paths):
        for issue in check_card(card):
            errors.append({'file':str(path),'code':issue['code'],'message':issue['message']})
        ident=card.get('id');rev=card.get('revision')
        # One candidate pack must contain only one active revision per stable card ID.
        # A card update creates a replacement pack, not two revisions in the same pack.
        if isinstance(ident,str):
            if ident in seen_id:
                errors.append({'file':str(path),'code':'CARD-001',
                               'message':f'duplicate stable card id across {seen_id[ident]} (even if revisions differ)'})
            else:
                seen_id[ident]=str(path)
        if isinstance(ident,str) and isinstance(rev,int) and not isinstance(rev,bool):
            key=(ident,rev)
            if key in seen:
                errors.append({'file':str(path),'code':'CARD-001','message':f'duplicate card id@revision across {seen[key]}'})
            seen[key]=str(path)
        else:
            errors.append({'file':str(path),'code':'CARD-001','message':'invalid identity'})
        mode=card.get('mode')
        mode=mode if isinstance(mode,str) else None
        raw_text=card.get('text')
        langru=raw_text.get('ru',{}) if isinstance(raw_text,dict) else {}
        if mode in FIELDS and isinstance(langru,dict):
            # Malformed draft fields must yield validation errors, never crash an agent batch.
            # Reused responder boilerplate is expected; avoid false positives.
            sig='|'.join(normalized(langru.get(f,'')) for f in FIELDS[mode]
                         if f!='responder' and isinstance(langru.get(f),str))
            if sig:
                k=(mode,sig)
                if k in unique_text:
                    errors.append({'file':str(path),'code':'CARD-013','message':f'normalized duplicate of {unique_text[k]}'})
                unique_text[k]=str(path)
        if release:
            if card.get('status')!='reviewed':
                errors.append({'file':str(path),'code':'CARD-012','message':'release pack requires reviewed status'})
            else:counts[mode]+=1
    if release:
        for mode in FIELDS:
            if counts[mode]<minimum:
                errors.append({'file':'<pack>','code':'CARD-015','message':f'{mode}: {counts[mode]} reviewed cards < {minimum} minimum'})
    return errors,counts


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('source',type=Path,help='single card JSON or directory recursively containing card JSON files')
    ap.add_argument('--release',action='store_true',help='require reviewed ≥minimum cards for each mode')
    ap.add_argument('--minimum',type=int,default=100)
    ap.add_argument('--report',type=Path,help='save deterministic machine-readable validation evidence')
    args=ap.parse_args()
    if args.minimum<1:ap.error('--minimum must be >=1')
    schema=json.loads(SCHEMA.read_text(encoding='utf-8'))
    Draft202012Validator.check_schema(schema)
    validator=Draft202012Validator(schema,format_checker=FormatChecker())
    src=args.source.resolve()
    paths=([src] if src.is_file() else sorted(src.rglob('*.json')) if src.is_dir() else [])
    errors=[];cards=[];okpaths=[]
    if not paths:errors.append({'file':str(src),'code':'CARD-001','message':'no JSON card files found'})
    for f in paths:
        try:
            if f.stat().st_size>MAX_FILE_BYTES:raise ValueError('card file >128KiB limit')
            d=json.loads(f.read_text('utf-8'),object_pairs_hook=_pairs_no_duplicates,
                         parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite JSON value')))
            if not isinstance(d,dict):raise ValueError('card must be JSON object')
        except (ValueError,UnicodeError,OSError) as ex:
            errors.append({'file':str(f),'code':'CARD-001','message':str(ex)});continue
        for err in sorted(validator.iter_errors(d),key=lambda x: str(list(x.path))):
            path='.'.join(map(str,err.path)) or '<root>'
            errors.append({'file':str(f),'code':'CARD-002','message':f'{path}: {err.message}'})
        cards.append(d);okpaths.append(f)
    sem,counts=check_directory(cards,okpaths,args.release,args.minimum)
    errors+=sem
    result={'schema_version':1,'checked_files':len(paths),'parsed_cards':len(cards),
            'release_mode':args.release,'counts_reviewed':dict(counts),'errors':errors,
            'status':'PASS' if not errors else 'FAIL',
            'warning':'Machine checks are not human content/localization/legal review.'}
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Validated {len(paths)} files, {len(cards)} parsed; errors={len(errors)}")
    for issue in errors[:100]:print(f"{issue['code']}: {issue['file']}: {issue['message']}")
    if len(errors)>100:print(f'... {len(errors)-100} more errors (see report)')
    if not errors:print('PASS: structural/semantic checks only; human review still mandatory.')
    return 1 if errors else 0

if __name__=='__main__':
    sys.exit(main())
