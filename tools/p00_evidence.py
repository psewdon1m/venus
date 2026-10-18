"""Fail-closed evidence linkage for P00 agent review; no publisher-signature claim."""
from pathlib import Path
import hashlib
import json
import re

REQUIRED_CHECKS={'P00-BASELINE','P00-REGISTRY','P00-CONTRACTS','P00-RULES','P00-FLOWS','P00-DECISIONS','P00-NORMS'}
REVIEW_SCOPES={'contracts','privacy','flows','evidence','tests','traceability'}
REQUIRED_TEST_CHECKS={'P00-INTEGRITY','P00-UNIT','CARD-DRAFT','CARD-BATCH','POLICY-CONFIG','DOC-INTEGRITY','NEGATIVE-DRAFT-RELEASE','PACK-BUILDER','PACK-REPRODUCIBILITY'}
DERIVED_FILES={'.docs/implementation/status.md','.docs/implementation/p00-registry.json','FILE_MANIFEST.sha256'}

def digest(data):return hashlib.sha256(data).hexdigest()

def candidate_files(root):
    root=Path(root)
    result={}
    for path in sorted(root.rglob('*')):
        if not path.is_file():continue
        rel=path.relative_to(root).as_posix()
        if (rel in DERIVED_FILES or rel.startswith(('.docs/implementation/evidence/','.docs/implementation/reviews/','.git/')) or
            '__pycache__' in path.parts or path.suffix=='.pyc'):continue
        result[rel]=digest(path.read_bytes())
    return result

def identity(files):return digest(json.dumps(files,sort_keys=True,separators=(',',':')).encode('utf-8'))

def read_evidence(root, descriptor):
    if not isinstance(descriptor,dict) or not isinstance(descriptor.get('path'),str):raise ValueError('missing evidence descriptor')
    rel=descriptor['path']
    if ':' in rel or '\\' in rel or rel.startswith('/'):raise ValueError('evidence path must be repository-relative')
    path=(Path(root)/rel).resolve()
    if not path.is_relative_to(Path(root).resolve()) or not path.is_file():raise ValueError('evidence file absent/unsafe: '+rel)
    expected=descriptor.get('sha256')
    if not isinstance(expected,str) or not re.fullmatch(r'[a-f0-9]{64}',expected) or digest(path.read_bytes())!=expected:
        raise ValueError('evidence digest mismatch: '+rel)
    return path.read_bytes()

def verified_row_errors(root,row):
    if row.get('status') not in ('VERIFIED','REFERENCE_VERIFIED'):return []
    try:
        data=json.loads(read_evidence(root,{'path':row.get('evidence_uri'),'sha256':row.get('evidence_sha256')}))
        if row['status']=='REFERENCE_VERIFIED':
            if row['requirement_id']!='PLAN-P00-BASELINE' or data.get('restore_verified') is not True:
                raise ValueError('REFERENCE_VERIFIED requires the baseline restore receipt')
        else:
            if data.get('status')!='PASS' or row['requirement_id'] not in data.get('requirement_ids',[]):
                raise ValueError('evidence does not prove the requirement')
            if data.get('candidate_identity_sha256')!=identity(candidate_files(root)):
                raise ValueError('VERIFIED evidence belongs to stale candidate')
    except (ValueError,TypeError,KeyError,OSError) as exc:return [row.get('requirement_id','?')+': '+str(exc)]
    return []

def validate_gate(root,report,expected_reviewers):
    errors=[]
    try:
        current=candidate_files(root);current_id=identity(current)
        if report.get('gate_id')!='EXIT-P00' or report.get('gate_status')!='PASSED':errors.append('not a passed EXIT-P00 report')
        if report.get('candidate_identity_sha256')!=current_id:errors.append('stale gate candidate identity')
        manifest=json.loads(read_evidence(root,report.get('inputs')))
        if manifest.get('files')!=current or manifest.get('candidate_identity_sha256')!=current_id:errors.append('incomplete/stale candidate file set')
        checks=report.get('checks',[])
        if not isinstance(checks,list):raise ValueError('checks must be list')
        ids=[c.get('id') for c in checks if isinstance(c,dict)]
        if len(ids)!=len(checks) or len(ids)!=len(set(ids)):errors.append('duplicate/malformed gate checks')
        if not REQUIRED_CHECKS.issubset(ids):errors.append('missing required P00 checks')
        if any(c.get('status')!='PASS' for c in checks):errors.append('unpassed P00 checks')
        if report.get('pending_critical_decisions')!=[]:errors.append('critical decisions unresolved')
        tests=json.loads(read_evidence(root,report.get('tests')))
        if tests.get('status')!='PASS' or tests.get('candidate_identity_sha256')!=current_id:errors.append('test evidence stale/not PASS')
        if not tests.get('checks') or any(c.get('status')!='PASS' for c in tests['checks']):errors.append('test checks absent/unpassed')
        test_ids=[c.get('check_id') for c in tests.get('checks',[])]
        if len(test_ids)!=len(set(test_ids)) or not REQUIRED_TEST_CHECKS.issubset(test_ids):errors.append('required test records missing/duplicate')
        for c in tests.get('checks',[]):
            if c.get('check_id')=='PACK-REPRODUCIBILITY':continue
            expected=1 if c.get('check_id')=='NEGATIVE-DRAFT-RELEASE' else 0
            if c.get('actual_exit')!=expected or c.get('expected_exit')!=expected or not isinstance(c.get('argv'),list) or len(c['argv'])<2:
                errors.append('test command/exit evidence missing')
        output=read_evidence(root,tests.get('output')).decode('utf-8')
        count=tests.get('unit_tests')
        if type(count) is not int or count<1 or not re.search(r'Ran '+str(count)+r' tests.*?\bOK\b',output,re.S):errors.append('unit execution/count evidence missing')
        for c in checks:
            if not c.get('evidence_check_ids') or not set(c['evidence_check_ids']).issubset(test_ids):errors.append('gate check unbound to executed tests')
        executor=report.get('executor_id')
        if not executor:errors.append('missing executor identity')
        seen=set();scopes=set()
        reports=report.get('reviewers',[])
        if len(reports)<2:errors.append('at least two separate reviews required')
        for descriptor in reports:
            review=json.loads(read_evidence(root,descriptor))
            who=review.get('reviewer_id')
            if who==executor or who not in expected_reviewers or who in seen:errors.append('self/unknown/duplicate reviewer')
            seen.add(who)
            if review.get('status')!='PASS' or review.get('open_findings')!=[]:errors.append('review not green')
            if review.get('candidate_identity_sha256')!=current_id or review.get('revision')!=report.get('revision'):errors.append('stale reviewer identity/revision')
            read_evidence(root,review.get('narrative'))
            scopes.update(review.get('scopes',[]))
        if seen!=set(expected_reviewers):errors.append('expected review agents missing')
        if not REVIEW_SCOPES.issubset(scopes):errors.append('review scope incomplete')
    except (ValueError,KeyError,TypeError,OSError) as exc:errors.append(str(exc))
    return errors
