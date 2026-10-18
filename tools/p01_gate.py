"""Freeze and verify P01 evidence. Acceptance never follows from tests alone."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from source_inventory import source_files

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT/'.docs/implementation/evidence/p01'
DERIVED = {'FILE_MANIFEST.sha256', '.docs/implementation/status.md', '.docs/implementation/p01-registry.json'}
PREFIXES = ('.docs/implementation/evidence/p01/', '.docs/implementation/reviews/p01/')

def included(name):
    return name not in DERIVED and not name.startswith(PREFIXES)

def digest(data): return hashlib.sha256(data).hexdigest()
def identity(files): return digest(json.dumps(files,sort_keys=True,separators=(',',':')).encode())
def inputs(root=ROOT):
    return {p.relative_to(root).as_posix():digest(p.read_bytes()) for p in sorted(source_files(root)) if included(p.relative_to(root).as_posix())}

def descriptor(path): return {'path':path.relative_to(ROOT).as_posix(),'sha256':digest(path.read_bytes())}

def read_artifact(root, item):
    name=item['path'];path=(root/name).resolve()
    if not isinstance(name,str) or '\\' in name or ':' in name or name.startswith('/') or not path.is_relative_to(root.resolve()):
        raise ValueError('unsafe evidence path')
    raw=path.read_bytes()
    if digest(raw)!=item['sha256']: raise ValueError('evidence digest mismatch: '+name)
    return json.loads(raw)

def validate(root, report):
    errors=[]
    try:
        files=inputs(root);cid=identity(files)
        if report.get('gate')!='EXIT-P01' or report.get('status')!='PASSED': errors.append('P01 is not accepted')
        frozen=read_artifact(root,report['inputs'])
        if frozen['files']!=files or frozen['source_identity_sha256']!=cid or report['source_identity_sha256']!=cid: errors.append('stale/incomplete source identity')
        sha=report['source_sha']
        if not re.fullmatch('[a-f0-9]{40}',sha): raise ValueError('full Git SHA required')
        git_names=subprocess.check_output(['git','ls-tree','-r','--name-only',sha],cwd=root,text=True).splitlines()
        git_files={name:digest(subprocess.check_output(['git','show',sha+':'+name],cwd=root)) for name in git_names if included(name)}
        if git_files!=files: errors.append('reviewed/tested Git source differs from current source')
        ci=read_artifact(root,report['ci'])
        if ci.get('head_sha')!=sha or ci.get('conclusion')!='success' or ci.get('status')!='completed' or ci.get('path')!='.github/workflows/ci.yml':errors.append('CI is not successful on exact source SHA')
        if not str(ci.get('html_url','')).startswith('https://github.com/psewdon1m/venus/actions/runs/'):errors.append('CI URL missing')
        jobs=read_artifact(root,report['ci_jobs'])['jobs']
        if {j['name'] for j in jobs if j['conclusion']=='success'}!={'quality','container-smoke'}:errors.append('required CI jobs not successful')
        negative=read_artifact(root,report['negative'])
        if negative.get('source_sha')!=sha or negative.get('status')!='PASS' or negative.get('source_before')!=negative.get('source_after'):errors.append('negative evidence stale/not PASS')
        if {c['id'] for c in negative['cases']}!={'schema','locale','type','unit'} or any(c['status']!='PASS' or c['positive_exit']!=0 or c['negative_exit']==0 for c in negative['cases']):errors.append('negative cases incomplete')
        health=read_artifact(root,report['health'])
        if health.get('source_sha')!=sha or health.get('source_dirty') is not False or health.get('status')!='PASS' or not re.fullmatch('sha256:[a-f0-9]{64}',health.get('image_id','')):errors.append('container evidence stale/not PASS')
        expected={'nonroot-image-labels-and-layer-secret-scan','loopback-only-app-private-postgres','runtime-isolation-no-socket','version-contract-web-and-ready-postgres','database-outage-is-not-ready-process-alive','database-recovery-without-app-restart','structured-logs-do-not-expose-payloads-or-secrets'}
        if {c['id'] for c in health['checks']}!=expected or any(c['status']!='PASS' for c in health['checks']):errors.append('container checks incomplete')
        protection=read_artifact(root,report['protection'])
        required=protection['required_status_checks']
        if not required['strict'] or set(required['contexts'])!={'quality','container-smoke'} or not protection['enforce_admins']['enabled'] or protection['allow_force_pushes']['enabled'] or protection['allow_deletions']['enabled']:errors.append('main protection insufficient')
        if not protection.get('required_pull_request_reviews') or not protection['required_conversation_resolution']['enabled']:errors.append('PR protection insufficient')
        reviewers=[];scopes=set()
        for item in report['reviews']:
            review=read_artifact(root,item);reviewers.append(review['reviewer_id']);scopes.update(review['scopes'])
            if review['source_identity_sha256']!=cid or review['source_sha']!=sha or review['status']!='PASS' or review['open_findings']!=[] or review['reviewer_id']=='/root':errors.append('review stale/self/unresolved')
            narrative=root/review['report_path']
            if digest(narrative.read_bytes())!=review['report_sha256']:errors.append('review narrative digest mismatch')
        if len(set(reviewers))<2 or not {'implementation','evidence'}.issubset(scopes):errors.append('two independent reviews/scopes required')
        if report.get('pending_decisions')!=[]:errors.append('unresolved P01 decisions')
    except (KeyError,TypeError,ValueError,OSError,subprocess.SubprocessError) as exc:
        errors.append(str(exc))
    return errors

def main():
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['freeze','verify']);args=parser.parse_args()
    if args.mode=='freeze':
        files=inputs();DIRECTORY.mkdir(parents=True,exist_ok=True)
        data={'source_sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'source_identity_sha256':identity(files),'files':files}
        (DIRECTORY/'inputs.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(data['source_identity_sha256']);return 0
    errors=validate(ROOT,json.loads((DIRECTORY/'gate-report.json').read_text('utf-8')))
    for error in errors:print('ERROR',error)
    print('FAIL' if errors else 'PASS: EXIT-P01 source, CI, negative/container evidence and independent reports bound')
    return int(bool(errors))

if __name__=='__main__':sys.exit(main())
