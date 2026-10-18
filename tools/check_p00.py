"""Check P00 inventory, traceability, local refs and baseline integrity.

No network or production mutation. Never upgrades pending acceptance to PASS.
"""
from __future__ import annotations
import csv
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
import zipfile
from jsonschema import Draft202012Validator
from p00_evidence import verified_row_errors, read_evidence, validate_gate

ROOT = Path(__file__).resolve().parents[1]


def inventory(root):
    result = {}
    for source, pattern in [
        ('.docs/README.md', r'(?<![A-Z0-9])V-\d{3}(?!\d)'),
        ('.docs/08_RELATIONSHIP_ENGINE.md', r'RE-\d{3}'),
        ('.docs/05_CI_QUALITY_AND_RELEASES.md', r'CI-[A-Z]-\d{3}'),
        ('.docs/09_CARD_AUTHORING_AND_AUTOMATION.md', r'CARD-\d{3}'),
        ('.docs/source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md', r'\*\*([A-Z]+-\d{2})\*\*'),
    ]:
        for rid in set(re.findall(pattern, (root/source).read_text('utf-8'))):
            result[rid] = source
    engine_source = '.docs/08_RELATIONSHIP_ENGINE.md'
    invariants = (root/engine_source).read_text('utf-8').split('## 15. Formal invariants (fail closed)')[1].split('## 16.')[0]
    for number in re.findall(r'^(\d+)\. ', invariants, re.M):
        result[f'PLAN-RE-INV-{int(number):02}'] = engine_source
    api_source = '.docs/contracts/api.v1.openapi.json'
    api = json.loads((root/api_source).read_text('utf-8'))
    for item in api['paths'].values():
        for op in item.values():
            result['PLAN-API-'+op['operationId'].upper().replace('_','-')] = api_source
    return result


def check_rows(root, rows):
    errors = []
    expected = inventory(root)
    ids = [row['requirement_id'] for row in rows]
    if len(ids) != len(set(ids)):
        errors.append('duplicate requirement ID')
    for rid, source in expected.items():
        matches = [r for r in rows if r['requirement_id'] == rid]
        if len(matches) != 1 or matches[0]['source'] != source:
            errors.append('missing/wrong source requirement: '+rid)
    adr_ids = {r['id'] for r in json.loads((root/'.docs/adr/index.json').read_text('utf-8'))['records']}
    for row in rows:
        rid = row['requirement_id']
        path = (root/row['source']).resolve()
        if not path.is_relative_to(root.resolve()) or not path.is_file():
            errors.append(rid+': missing/unsafe source'); continue
        if hashlib.sha256(path.read_bytes()).hexdigest() != row['source_sha256']:
            errors.append(rid+': stale source hash')
        if not row['task_id'] or not row['check_id'] or not row['owner_role'] or not re.fullmatch(r'P(?:0\d|1[01])', row['stage']):
            errors.append(rid+': missing task/check/owner/stage')
        if any(a not in adr_ids for a in row['adr'].split(';') if a):
            errors.append(rid+': unknown ADR')
        if row['status'] not in ('PLANNED','PREPARED','REFERENCE_VERIFIED','VERIFIED'):
            errors.append(rid+': invalid status')
        if row['status'] == 'VERIFIED' and not (row['evidence_uri'] and row['evidence_sha256']):
            errors.append(rid+': VERIFIED without evidence')
        errors.extend(verified_row_errors(root,row))
        if row['commit_sha'] and not re.fullmatch(r'[a-f0-9]{40,64}',row['commit_sha']):
            errors.append(rid+': invented/non-full Git revision')
    return errors


def local_refs(document):
    errors = []
    def walk(value):
        if isinstance(value, dict):
            if '$ref' in value:
                ref = value['$ref']
                if not ref.startswith('#/'):
                    errors.append('non-local/unresolved ref: '+ref)
                else:
                    target = document
                    try:
                        for token in ref[2:].split('/'):
                            target = target[token.replace('~1','/').replace('~0','~')]
                    except (KeyError, TypeError): errors.append('broken ref: '+ref)
            for child in value.values(): walk(child)
        elif isinstance(value, list):
            for child in value: walk(child)
    walk(document)
    return errors


def check(root=ROOT):
    errors=[]
    rows=list(csv.DictReader((root/'.docs/implementation/traceability.csv').open(encoding='utf-8',newline='')))
    errors.extend(check_rows(root,rows))
    expected_count=len(inventory(root))
    adrs=json.loads((root/'.docs/adr/index.json').read_text('utf-8'))['records']
    if {a['id'] for a in adrs} != {f'ADR-{n:03}' for n in range(1,13)} or len(adrs)!=12:
        errors.append('ADR inventory must contain 001..012 once')
    for a in adrs:
        if not (root/'.docs/adr'/a['file']).is_file(): errors.append('missing ADR file '+a['id'])
        if a['status'] not in ('PROPOSED','DEFERRED','BLOCKED_EXTERNAL','DECIDED_FOR_PREPARATION','ACCEPTED'): errors.append('unknown ADR status '+a['id'])
        if a['status']=='ACCEPTED':
            decisions=json.loads((root/'.docs/implementation/user-decisions.v1.json').read_text('utf-8'))
            accepted={d['id'] for d in decisions['decisions'] if d['status']=='ACCEPTED'}
            if decisions.get('source',{}).get('kind')!='user_message' or a.get('approval_source') not in accepted:
                errors.append('ACCEPTED ADR without explicit user decision '+a['id'])
    registry=json.loads((root/'.docs/implementation/p00-registry.json').read_text('utf-8'))
    if [p['id'] for p in registry['stages']] != [f'P{i:02}' for i in range(12)]: errors.append('stage inventory')
    if registry['human_acceptance']=='PENDING' and registry['stages'][0]['status']=='PASSED': errors.append('pending acceptance cannot pass P00')
    if registry['stages'][0]['status']=='PASSED':
        try:
            gate=json.loads(read_evidence(root,registry.get('current_gate_report')))
            if (root/'tools/fixtures/p00-2.zip').is_file():
                from p00_history import validate_p00_history
                errors.extend(validate_p00_history(root))
            else:
                errors.extend(validate_gate(root,gate,registry.get('independent_reviewers',[])))
        except (ValueError,TypeError,OSError) as exc:errors.append('passed registry without valid gate: '+str(exc))
    text=(root/'.docs/implementation/USER_DECISIONS.md').read_text('utf-8')
    if any(uid not in text for uid in registry['pending_user_decisions']): errors.append('missing user decision')
    flows=(root/'.docs/implementation/UI_FLOWS.md').read_text('utf-8')
    if any(f'UX-{n:02}' not in flows or not any(r['requirement_id']==f'UX-{n:02}' for r in rows) for n in range(1,13)):
        errors.append('incomplete UX flow inventory')
    for filename in ('projections.v1.schema.json','events.v1.schema.json'):
        schema=json.loads((root/'.docs/contracts'/filename).read_text('utf-8'))
        Draft202012Validator.check_schema(schema)
        errors.extend(local_refs(schema))
    api=json.loads((root/'.docs/contracts/api.v1.openapi.json').read_text('utf-8'))
    errors.extend(local_refs(api))
    if api['openapi']!='3.1.0': errors.append('OpenAPI version')
    operations=[]
    for path,item in api['paths'].items():
        for method,op in item.items():
            operations.append(op['operationId'])
            if not op.get('x-authorization') or 'default' not in op['responses']: errors.append('missing ACL/error '+path)
            if op['x-authorization'] not in ('public','invite') and op.get('security')!=[{'RoomSession':[]}]: errors.append('cookie security missing '+path)
            if method!='get' and not op.get('x-origin-check-required'): errors.append('Origin guard missing '+path)
            actual={p['name'] for p in op.get('parameters',[]) if p['in']=='path'}
            if actual!=set(re.findall(r'\{([^}]+)\}',path)): errors.append('path parameters '+path)
    if len(operations)!=len(set(operations)): errors.append('duplicate operationId')
    machines=json.loads((root/'.docs/contracts/state-machines.v1.json').read_text('utf-8'))['machines']
    for name,m in machines.items():
        if any(t[0] in m['terminal'] or len(t)!=4 or not t[3] for t in m['transitions']): errors.append('terminal reopen/unguarded transition '+name)
    pin_path=root/'.docs/source-snapshots/central-4449e65/provenance.json'
    if pin_path.is_file():
        pin=json.loads(pin_path.read_text('utf-8'))
        if (not re.fullmatch(r'[a-f0-9]{40}',pin.get('commit','')) or not pin.get('clean_status',{}).get('clean') or
            not pin.get('remote_verification',{}).get('head_matches_local')):errors.append('central provenance identity incomplete')
        if len(pin.get('files',[]))!=15:errors.append('central source inventory incomplete')
        for item in pin.get('files',[]):
            path=pin_path.parent/item['file']
            if not path.resolve().is_relative_to(pin_path.parent.resolve()) or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
                errors.append('central snapshot missing/tampered: '+item['file'])
    elif registry.get('revision')=='P00-2':errors.append('P00-2 central snapshots absent')
    applicability=root/'.docs/implementation/central-applicability.csv'
    if applicability.is_file():
        with applicability.open(encoding='utf-8',newline='') as f:section_rows=list(csv.DictReader(f))
        expected_sections=set()
        for path in (root/'.docs/source-snapshots/central-4449e65').glob('PART_*.md'):
            fenced=False
            for number,line in enumerate(path.read_text('utf-8').splitlines(),1):
                if line.lstrip().startswith('```'):fenced=not fenced;continue
                if not fenced and re.match(r'^##\s',line):expected_sections.add((path.relative_to(root).as_posix(),str(number)))
        actual=[(r['document'],r['line']) for r in section_rows]
        if set(actual)!=expected_sections or len(actual)!=len(set(actual)):errors.append('central applicability inventory incomplete/duplicate')
        for r in section_rows:
            source=root/r['document']
            if any(not value for value in r.values()) or hashlib.sha256(source.read_bytes()).hexdigest()!=r['source_sha256']:
                errors.append('central applicability missing/stale evidence metadata')
    elif registry.get('revision')=='P00-2':errors.append('central applicability matrix absent')
    receipt=json.loads((root/'.docs/implementation/evidence/baseline-receipt.json').read_text('utf-8'))
    archive=Path(receipt['archive_path'])
    if not archive.is_file(): archive=root/'tools/fixtures/pre-p00.zip'
    if not archive.is_file() or hashlib.sha256(archive.read_bytes()).hexdigest()!=receipt['archive_sha256']:
        errors.append('baseline archive absent/digest mismatch')
    else:
        with zipfile.ZipFile(archive) as z:
            names=z.namelist()
            if len(names)!=len(set(names)) or any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts or '\\' in n or ':' in n for n in names): errors.append('unsafe baseline entries')
            manifest=z.read('FILE_MANIFEST.sha256')
            if hashlib.sha256(manifest).hexdigest()!=receipt['source_manifest_sha256']: errors.append('baseline manifest hash')
            old=[r.split('  ',1) for r in manifest.decode().splitlines() if r]
            if set(names)!={p for _,p in old}|{'FILE_MANIFEST.sha256'}: errors.append('baseline member inventory')
            for sha,path in old:
                if hashlib.sha256(z.read(path)).hexdigest()!=sha: errors.append('baseline bytes '+path)
    return errors, {'trace_rows':len(rows),'source_requirements':expected_count,'adrs':len(adrs),'api_operations':len(operations),'runtime_acceptance':'NOT_RUN'}


def main():
    errors,summary=check()
    for error in errors: print('ERROR',error)
    print(json.dumps(summary,ensure_ascii=False))
    print('FAIL' if errors else 'PASS: P00 integrity checked; gate acceptance requires bound independent reports; runtime remains separate')
    return int(bool(errors))

if __name__=='__main__': sys.exit(main())
