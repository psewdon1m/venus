"""P04 evidence inspection. Technical pipeline PASS never implies human/editorial acceptance."""
import argparse
from collections import Counter
import hashlib
import io
import json
from pathlib import PurePosixPath
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import zipfile
from stage_inventory import ROOT,inventory,identity,included
from stage_gate import read,read_bytes,require

RUNTIME_IDS={'P04-MIGRATION','P04-ATOMIC-POINTER','P04-SHORTAGE-ACL','P04-PINNED-ROLLBACK','P04-MUTATION-RECEIPTS','P04-READONLY-AUTH',
 'P04-PUBLIC-READONLY','P04-PUBLIC-REVOKE-FENCE','P04-HTTP-REVOKE-FENCE','P04-PRIVATE-REVOKE-CLEAR',
 'P04-COMMIT-FAILURE','P04-RESTORE-LEDGER','P04-MISSING-LEDGER'}
JOBS={'quality','container-smoke','p02-integration','p03-integration'}|{'p03-measurements ('+s+')' for s in ['invariants','fairness','gf','inference']}

def validate_coverage(coverage,analysis):
    require(coverage['neutral20']=='PASS' and coverage['synthetic'] is True and coverage['capabilities']==[],'draft coverage scope')
    require(len(coverage['cells'])==5880 and len(coverage['sessions'])==4214,'coverage dimensions')
    modes=['questions','truth_or_dare','yes_but'];contexts=['online','in_person']
    expected={(m,c,n,s,comfort,label) for m in modes for c in contexts for n in range(2,9) for s in range(1,5) for comfort in range(5) for label in ['X','J','F','G','M','S','R']}
    actual={(r['mode'],r['context'],r['size'],r['stage'],r['comfort'],r['resolved_class']) for r in coverage['cells']}
    require(actual==expected,'coverage eligibility tuples missing/duplicated')
    for row in coverage['cells']:
        count=row['effective_eligible_card_count'];require(type(count) is int and 0<=count<=analysis['manifest']['mode_counts'][row['mode']],'invalid effective card count')
        require(isinstance(row['rule_exclusions'],list) and all(isinstance(v,str) for v in row['rule_exclusions']),'invalid rule exclusions')
        if row['mode']=='yes_but' and row['resolved_class']=='X':require(count==0,'X-veto eligibility not zero')
        if row['comfort']==0 and row['stage']==1 and row['resolved_class']=='F':require(count>=20,'neutral20 eligibility gap')
    sessions=[s for s in coverage['sessions'] if s['profile']=='neutral_C0_F']
    expected_sessions={(m,c,n,k) for m in modes for c in contexts for n in range(2,9) for k in range(1,101)}
    require({(s['mode'],s['context'],s['size'],s['rounds']) for s in sessions}==expected_sessions and len(sessions)==len(expected_sessions),'coverage cells missing/duplicated')
    require(all(s['status']=='PASS' and s['reason'] is None for s in sessions),'100-card neutral catalogue must support requested1..100 in recorded profiles')
    negatives=[s for s in coverage['sessions'] if s['profile']=='all_X'];expected_x={('yes_but',c,n,20) for c in contexts for n in range(2,9)}
    require(len(negatives)==14 and {(s['mode'],s['context'],s['size'],s['rounds']) for s in negatives}==expected_x and all(s['status']=='EXPECTED_REFUSAL' and s['reason']=='INSUFFICIENT_SAFE_CARDS' for s in negatives),'all-X negative missing/duplicated')

def validate_reviews(root,descriptors,sha,cid):
    reviewers=[];scopes=set()
    for descriptor in descriptors:
        report=read(root,descriptor);require(report['reviewer_id']!='/root' and report['source_sha']==sha and report['source_identity_sha256']==cid and report['status']=='PASS' and report['open_findings']==[],'fresh independent technical review required')
        require(report['report_path'].startswith('.docs/implementation/reviews/p04/'),'review narrative out of scope')
        narrative=read_bytes(root,{'path':report['report_path'],'sha256':report['report_sha256']}).decode('utf-8').replace('\r\n','\n')
        header=re.match(r'\A```venus-review\n([^`]+)\n```\n',narrative);require(header is not None,'structured review header required')
        fields=['reviewer_id','source_sha','source_identity_sha256','scopes','status','open_findings'];metadata=json.loads(header.group(1))
        require(set(metadata)==set(fields) and all(metadata[k]==report[k] for k in fields),'review narrative/result mismatch')
        reviewers.append(report['reviewer_id']);scopes.update(report['scopes'])
    require(len(descriptors)>=2 and len(set(reviewers))>=2 and {'implementation','evidence'}.issubset(scopes),'two independent implementation/evidence reviews required')

def validate_private_coverage(coverage,capabilities):
    require(coverage['protocol']=='P04-C2' and coverage['capabilities']==capabilities and coverage['private_budget_rounds']==100 and coverage['private_baseline_required']==25 and coverage['private_coverage']=='PASS','private coverage protocol/budget/gap')
    for row in coverage['cells']:
        counts=row['by_interaction'];require(set(counts)=={'group','solo','pair_public','pair_private'} and all(type(n) is int and n>=0 for n in counts.values()) and sum(counts.values())==row['effective_eligible_card_count'],'interaction coverage counts inconsistent')
        baseline=row['private_baseline_card_count'];require(type(baseline) is int and 0<=baseline<=counts['pair_private'],'invalid private baseline count')
        expected='RULE_EXCLUDED_STAGE' if row['stage']<3 else 'RULE_EXCLUDED_COMFORT' if row['comfort']==0 else 'RULE_EXCLUDED_CLASS' if row['resolved_class'] in ['X','J'] else 'CAPABILITY_UNAVAILABLE' if row['context']=='online' and 'private_text_chat' not in capabilities else 'SUPPORTED'
        require(row['private_profile_status']==expected,'private content gap disguised as rule exclusion')
        if expected=='SUPPORTED':require(baseline>=25,'supported private baseline below100-round budget')
        else:require(counts['pair_private']==0 and baseline==0,'excluded private interaction incorrectly eligible')
    rows=coverage['private_sessions'];expected={(m,c,n,comfort,label) for m in ['questions','truth_or_dare','yes_but'] for c in ['online','in_person'] for n in range(2,9) for comfort in [1,4] for label in ['F','G','M','S','R']}
    require(len(rows)==420 and {(r['mode'],r['context'],r['size'],r['comfort'],r['resolved_class']) for r in rows}==expected,'private simulation profiles missing/duplicate')
    for row in rows:
        unavailable=row['context']=='online' and 'private_text_chat' not in capabilities
        require(row['rounds']==100 and row['status']==('CAPABILITY_UNAVAILABLE' if unavailable else 'PASS') and type(row['private_rounds']) is int and 0<=row['private_rounds']<=25 and (not unavailable or row['private_rounds']==0),'private simulation result/capability/cap mismatch')
    for mode in ['questions','truth_or_dare','yes_but']:
        for context in ['in_person']+(['online'] if 'private_text_chat' in capabilities else []):require(any(r['mode']==mode and r['context']==context and r['private_rounds']>0 for r in rows),'private planner path never exercised')

def validate_ci_artifacts(root,packet,ci,jobs,runner):
    index=read(root,packet['ci_artifact_index']);metadata=read(root,packet['ci_artifact_metadata'])
    require(index['run_id']==ci['id'] and index['source_sha']==packet['source_sha'] and index['source_identity_sha256']==packet['source_identity_sha256'],'artifact index from another source/run')
    expected={'negative-gates','container-smoke','p02-integration','p03-integration','p04-integration'}|{'p03-measurements-'+s for s in ['invariants','fairness','gf','inference']}
    artifacts=metadata['artifacts'];require(len(artifacts)==9 and {a['name'] for a in artifacts}==expected and len({a['id'] for a in artifacts})==9,'actual artifact set incomplete/duplicate')
    receipts={}
    for item in index['download_receipts']:
        receipt=read(root,item);require(receipt['artifact_id'] not in receipts,'duplicate download receipt');receipts[receipt['artifact_id']]=receipt
    require(set(receipts)=={a['id'] for a in artifacts},'download receipt IDs mismatch')
    raw_archives=index['raw_archives'];require(len(raw_archives)==9 and {a['artifact_id'] for a in raw_archives}==set(receipts),'actual ZIP archives missing/duplicate')
    members={}
    for artifact in artifacts:
        receipt=receipts[artifact['id']]
        require(artifact['workflow_run']['id']==ci['id'] and artifact['workflow_run']['head_sha']==packet['source_sha'] and receipt['run_id']==ci['id'] and receipt['source_sha']==packet['source_sha'] and artifact['digest']=='sha256:'+receipt['archive_sha256'],'API/ZIP/run/source mismatch')
        archive_descriptor=next(a['archive'] for a in raw_archives if a['artifact_id']==artifact['id']);raw=read_bytes(root,archive_descriptor)
        require(len(raw)<=256*1024*1024 and hashlib.sha256(raw).hexdigest()==receipt['archive_sha256'],'actual ZIP bytes differ from API digest')
        actual=[];seen=set()
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            require(sum(i.file_size for i in archive.infolist())<=256*1024*1024,'artifact uncompressed budget')
            for entry in archive.infolist():
                if entry.is_dir():continue
                path=PurePosixPath(entry.filename);require(not path.is_absolute() and '..' not in path.parts and '\\' not in entry.filename and ':' not in entry.filename and entry.filename not in seen and entry.file_size<=128*1024*1024,'unsafe/duplicate actual ZIP member');seen.add(entry.filename)
                data=archive.read(entry);actual.append({'path':entry.filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
        require(sorted(actual,key=lambda m:m['path'])==sorted(receipt['files'],key=lambda m:m['path']),'receipt manifest differs from actual ZIP members')
        paths=set()
        for member in receipt['files']:
            path=PurePosixPath(member['path']);require(not path.is_absolute() and '..' not in path.parts and '\\' not in member['path'] and ':' not in member['path'] and member['path'] not in paths,'unsafe/duplicate archive member')
            paths.add(member['path']);members[artifact['name']+'/'+member['path']]=member
    logs=index['job_logs'];require(len(logs)==8 and {j['job_id'] for j in logs}=={j['id'] for j in jobs},'actual job logs incomplete')
    observed=set()
    for item in logs:
        job=next(j for j in jobs if j['id']==item['job_id']);raw=read_bytes(root,item['log']).decode('utf-8-sig')
        ids={int(v) for v in re.findall(r'Artifact ID(?: is)?\s+(\d+)',raw)}
        require(ids==set(item['artifact_ids']) and ids,'job log upload IDs mismatch')
        observed.update(ids)
        names={a['name'] for a in artifacts if a['id'] in ids}
        expected_names={'negative-gates'} if job['name']=='quality' else {'p03-integration','p04-integration'} if job['name']=='p03-integration' else {'p03-measurements-'+job['name'].split('(')[1].rstrip(')')} if job['name'].startswith('p03-measurements (') else {job['name']}
        require(names==expected_names,'artifact uploaded by wrong required job')
    require(observed==set(receipts),'artifacts from another job/attempt')
    copied=index['copied_files']
    for name,descriptor in copied.items():
        require(name in members,'copied file outside actual ZIP manifest');raw=read_bytes(root,descriptor);member=members[name]
        require(len(raw)==member['bytes'] and hashlib.sha256(raw).hexdigest()==member['sha256'],'copied bytes differ from original artifact member')
    catalog=runner['catalog_directory'];require(catalog.startswith('.artifacts/p04/catalog-'),'catalogue output not run-scoped')
    relative=catalog.removeprefix('.artifacts/p04/')
    bindings={'runtime':'p04-integration/runtime-report.json','runtime_runner':'p04-integration/runtime-runner.json','inputs':'p04-integration/source-inputs.json','analysis':'p04-integration/'+relative+'/analysis.json','coverage':'p04-integration/'+relative+'/coverage.json','conditional_coverage':'p04-integration/'+relative+'/coverage-private-chat.json'}
    require(all(packet[key]==copied.get(name) for key,name in bindings.items()),'gate input not bound to actual P04 CI member')
    negative=read(root,copied['negative-gates/negative-gates.json'])
    require(negative['source_sha']==packet['source_sha'] and negative['source_identity_sha256']==packet['source_identity_sha256'] and negative['source_dirty'] is False and negative['status']=='PASS' and len(negative['cases'])==4 and {c['id'] for c in negative['cases']}=={'schema','locale','type','unit'} and all(c['status']=='PASS' and c['positive_exit']==0 and c['negative_exit']!=0 for c in negative['cases']),'actual negative controls incomplete/stale')

def technical(root,packet):
    require(packet['gate']=='P04-TECHNICAL-1' and packet['status']=='PASSED','technical packet status/scope')
    sha=packet['source_sha'];require(bool(re.fullmatch('[0-9a-f]{40}',sha)),'exact source required')
    inputs=read(root,packet['inputs']);current=inventory(root)
    require(inputs['source_sha']==sha and inputs['files']==current and inputs['source_identity_sha256']==identity(current)==packet['source_identity_sha256'],'stale source identity')
    raw=subprocess.check_output(['git','archive','--format=tar',sha],cwd=root)
    with tarfile.open(fileobj=io.BytesIO(raw),mode='r:') as archive:
        committed={m.name:hashlib.sha256(archive.extractfile(m).read()).hexdigest() for m in archive if m.isfile() and included(m.name)}
    require(committed==current,'candidate bytes differ from actual Git source')
    runtime=read(root,packet['runtime']);runner=read(root,packet['runtime_runner'])
    require(runtime['source_sha']==runner['source_sha']==sha and runtime['synthetic'] is True,'runtime source or synthetic scope')
    require(runtime['status']=='PASS' and len(runtime['required'])==len(RUNTIME_IDS) and set(runtime['required'])==RUNTIME_IDS and len(runtime['records'])==len(RUNTIME_IDS) and {r['id'] for r in runtime['records']}==RUNTIME_IDS and all(r['status']=='PASS' for r in runtime['records']),'runtime proofs incomplete/duplicate/failing')
    require(runner['status']=='PASS' and runner['source_dirty'] is False and runner['forced_runtime_build'] is True and runner['source_unchanged'] is True and runner['source_identity_sha256']==runner['source_identity_after']==packet['source_identity_sha256'] and runner['cleanup']=='completed','runtime runner stale/dirty/incomplete')
    coverage=read(root,packet['coverage']);analysis=read(root,packet['analysis'])
    validate_coverage(coverage,analysis)
    validate_private_coverage(coverage,[])
    conditional=read(root,packet['conditional_coverage']);validate_coverage({**conditional,'capabilities':[]},analysis);validate_private_coverage(conditional,['private_text_chat'])
    require(conditional['pack_digest']==coverage['pack_digest'],'conditional coverage from different pack')
    require(analysis['exact_duplicates']==0 and analysis['manifest']['total_cards']>=300 and all(analysis['manifest']['mode_counts'].get(mode,0)>=100 for mode in ['questions','truth_or_dare','yes_but']),'full draft catalogue incomplete')
    require(coverage['pack_digest']=='sha256:'+analysis['manifest']['canonical_payload_sha256'],'coverage pack mismatch')
    ci=read(root,packet['ci_run']);jobs=read(root,packet['ci_jobs'])['jobs']
    require(ci['head_sha']==sha and ci['conclusion']=='success' and ci['event']=='pull_request','actual PR CI not successful/exact source')
    require(ci['repository']['full_name']==ci['head_repository']['full_name']=='psewdon1m/venus' and ci['name']=='Venus CI' and ci['path']=='.github/workflows/ci.yml','CI from wrong repository/workflow')
    require(len(jobs)==8 and {j['name'] for j in jobs}==JOBS and all(j['conclusion']=='success' and j['head_sha']==sha and j['run_id']==ci['id'] for j in jobs),'actual CI jobs missing/another source')
    validate_ci_artifacts(root,packet,ci,jobs,runner)
    protection=read(root,packet['protection']);required=protection['required_status_checks']
    require(required['strict'] is True and set(required['contexts'])==JOBS and {(c['context'],c['app_id']) for c in required['checks']}=={(name,15368) for name in JOBS} and len(required['checks'])==8,'required Actions contexts weakened')
    require(protection['enforce_admins']['enabled'] and protection['required_pull_request_reviews'] is not None and protection['required_linear_history']['enabled'] and protection['required_conversation_resolution']['enabled'] and not protection['allow_force_pushes']['enabled'] and not protection['allow_deletions']['enabled'],'main protection weakened')
    validate_reviews(root,packet['reviews'],sha,packet['source_identity_sha256'])
    return True

def inspect(root):
    cards=[json.loads(p.read_text('utf-8')) for p in sorted((root/'.docs/content/p04/cards').glob('*.json'))]
    counts=Counter(c['mode'] for c in cards)
    registry_path=root/'packages/card-catalog/src/approved-bundles.json'
    registry=json.loads(registry_path.read_text('utf-8')) if registry_path.exists() else {'approved':[]}
    reviewed=Counter(c['mode'] for entry in registry['approved'] for c in entry['cards'] if c['status']=='reviewed')
    missing=[]
    if any(counts[mode]<100 for mode in ['questions','truth_or_dare','yes_but']):missing.append('P04-DRAFT-COUNT: autonomous content preparation incomplete')
    if any(reviewed[mode]<100 for mode in ['questions','truth_or_dare','yes_but']):missing.append('P04-HUMAN-REVIEW:100 reviewed originals/mode with competent RU/EN/TR/editorial/rights records')
    return {'schema_version':1,'gate':'EXIT-P04','status':'NOT_PASSED','draft_counts':dict(counts),'reviewed_counts':dict(reviewed),
      'missing':missing,'technical_packet_required':True,'production_catalogue_available':bool(registry['approved']),
      'note':'Inspection is not acceptance. Human identity/competence/rights and semantic diversity cannot be inferred from generated metadata or signatures.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=['inspect','verify-technical','verify']);parser.add_argument('--packet',type=Path);parser.add_argument('--out',type=Path);args=parser.parse_args()
    if args.command=='inspect':
        result=inspect(ROOT)
        if args.out:
            args.out.parent.mkdir(parents=True,exist_ok=True)
            with args.out.open('x',encoding='utf-8') as stream:json.dump(result,stream,ensure_ascii=False,indent=2);stream.write('\n')
        print(json.dumps(result,ensure_ascii=False));return 0
    try:
        require(args.packet is not None,'exact technical packet required');packet=json.loads(args.packet.read_text('utf-8'));technical(ROOT,packet)
        if args.command=='verify':
            status=inspect(ROOT);require(not status['missing'],'EXIT-P04 human/editorial/rights evidence remains missing; technical PASS is insufficient')
            human=read(ROOT,packet['human_acceptance'])
            require(human['status']=='APPROVED' and human['synthetic'] is False and human['catalog_digest']==read(ROOT,packet['analysis'])['catalog_digest'] and len(human['identity_competence_evidence'])>0,'genuine external human acceptance required')
            require(packet['approved_bundle_registry']['path']=='packages/card-catalog/src/approved-bundles.json','approved application registry must be source-bound')
            read(ROOT,packet['approved_bundle_registry'])
            result=subprocess.check_output(['node','tools/p04-verify-reviewed.mjs',str(ROOT/packet['approved_bundle_registry']['path']),human['pack_digest']],cwd=ROOT,text=True)
            verified=json.loads(result);require(verified['status']=='PASS' and verified['input_catalog_digest']==human['catalog_digest'] and all(verified['modes'].get(mode,0)>=100 for mode in ['questions','truth_or_dare','yes_but']) and verified['reviewed_coverage']=={'cells':5880,'sessions':4214,'neutral20':'PASS'},'reviewed pack cannot be reconstructed/bound to current input catalogue/coverage')
            print('PASS: EXIT-P04 technical evidence and externally established human approvals bound');return 0
        print('PASS: P04-TECHNICAL-1 only; EXIT-P04 human acceptance remains separate');return 0
    except (ValueError,KeyError,OSError,subprocess.CalledProcessError) as error:print('BLOCK:',error);return 1

if __name__=='__main__':sys.exit(main())
