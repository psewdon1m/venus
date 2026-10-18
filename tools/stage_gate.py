"""Source-bound independent acceptance for P02 onward. Never turns partial checks into PASS."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys
from stage_inventory import ROOT,inventory,identity,included,digest

CONTAINER_CHECKS={'nonroot-image-labels-and-layer-secret-scan','loopback-only-app-private-postgres','runtime-isolation-no-socket','version-contract-web-and-ready-postgres','database-outage-is-not-ready-process-alive','database-recovery-without-app-restart','public-entry-fails-closed-without-approved-offer','structured-logs-do-not-expose-payloads-or-secrets','malformed-secret-startup-is-sanitized'}
P02_CHECKS={'P02-MIGRATION','P02-CAPACITY','P02-ACL','P02-IDEMPOTENCY','P02-PREFERENCES-RESTART','P02-WS-TICKETS','P02-RECONNECT','P02-RESERVATION','P02-CLOSE','P02-BACKUP-RESTORE','P02-RETENTION','P02-ENTRY-RATE','P02-REACCEPT','P02-BROWSER-RU','P02-BROWSER-EN','P02-BROWSER-TR','P02-BROWSER-FULL-CLOSED','P02-BROWSER-OFFLINE-POLICY','P02-TIMERS','P02-ROLLBACK','P02-CRYPTO-AUDIT','P02-BROWSER-RECOVERY'}
def descriptor(path,root=ROOT):return {'path':path.relative_to(root).as_posix(),'sha256':digest(path.read_bytes())}
def read_bytes(root,item):
    name=item['path'];path=(root/name).resolve()
    if not isinstance(name,str) or ':' in name or '\\' in name or name.startswith('/') or not path.is_relative_to(root.resolve()):raise ValueError('unsafe evidence path')
    data=path.read_bytes()
    if digest(data)!=item['sha256']:raise ValueError('evidence hash mismatch: '+name)
    return data
def read(root,item):return json.loads(read_bytes(root,item))
def require(condition,message):
    if not condition:raise ValueError(message)
def validate(root,report,stage='P02'):
    errors=[]
    try:
        require(stage in ('P02','P03') and report['gate']=='EXIT-'+stage and report['status']=='PASSED',stage+' not accepted')
        sha=report['source_sha'];require(re.fullmatch('[a-f0-9]{40}',sha),'full source SHA required')
        current=inventory(root);cid=identity(current);frozen=read(root,report['inputs'])
        require(frozen['source_sha']==sha and frozen['source_identity_sha256']==cid and report['source_identity_sha256']==cid and frozen['files']==current,'stale/incomplete source identity')
        names=subprocess.check_output(['git','ls-tree','-r','--name-only',sha],cwd=root,text=True).splitlines()
        full={name:digest(subprocess.check_output(['git','show',sha+':'+name],cwd=root)) for name in names}
        require({k:v for k,v in full.items() if included(k)}==current,'tested Git source differs from current implementation')
        ci=read(root,report['ci']);jobs=read(root,report['ci_jobs'])['jobs'];required_jobs={'quality','container-smoke','p02-integration'}
        if stage=='P03':required_jobs|={'p03-integration'}|{'p03-measurements ('+section+')' for section in ('invariants','fairness','gf','inference')}
        require(isinstance(ci['id'],int) and ci['html_url']==f'https://github.com/psewdon1m/venus/actions/runs/{ci["id"]}' and ci['path']=='.github/workflows/ci.yml' and ci['head_sha']==sha and ci['status']=='completed' and ci['conclusion']=='success','CI run/source not successful')
        require(len(jobs)==len(required_jobs) and {j['name'] for j in jobs}==required_jobs and all(j['conclusion']=='success' and j['run_id']==ci['id'] and j['head_sha']==sha for j in jobs),'CI jobs/run/source mismatch')
        negative=read(root,report['negative']);snapshot=digest('\n'.join(k+':'+v for k,v in sorted(full.items())).encode())
        require(negative['status']=='PASS' and negative['source_sha']==sha and negative['source_identity_sha256']==cid and negative['source_dirty'] is False and negative['source_before']==negative['source_after']==snapshot,'negative snapshot not bound to tested source')
        require(len(negative['cases'])==4 and {c['id'] for c in negative['cases']}=={'schema','locale','type','unit'} and all(c['positive_exit']==0 and c['negative_exit'] in (1,2) and c['status']=='PASS' for c in negative['cases']),'negative checks incomplete')
        health=read(root,report['health']);image=health['image_id']
        require(health['source_sha']==sha and health['source_dirty'] is False and health['status']=='PASS' and re.fullmatch('sha256:[a-f0-9]{64}',image),'container proof not clean/current')
        require(len(health['checks'])==len(CONTAINER_CHECKS) and {c['id'] for c in health['checks']}==CONTAINER_CHECKS and all(c['status']=='PASS' for c in health['checks']),'container checks incomplete')
        require(health['compose_sha256']==digest((root/'infra/venus/compose.yml').read_bytes()),'Compose source mismatch')
        rendered=read_bytes(root,report['rendered_compose']);logs=read_bytes(root,report['logs'])
        require(digest(rendered)==health['rendered_compose_sha256'] and digest(logs)==health['logs_sha256'],'container companion artifact mismatch')
        compose=json.loads(rendered);app=compose['services']['app'];runtime=health['runtime']
        require(app['image']==image and app['environment']['IMAGE_DIGEST']==image and len(app['ports'])==1 and app['ports'][0]['host_ip']=='127.0.0.1' and not compose['services']['db'].get('ports') and compose['networks']['backend']['internal'] is True,'Compose exposure/image mismatch')
        require(runtime['image']==image and runtime['source_revision']==sha and runtime['version']=='0.0.0' and runtime['user']=='1000:1000' and runtime['privileged'] is False and runtime['readonly_rootfs'] is True and runtime['cap_drop']==['ALL'] and 'no-new-privileges:true' in runtime['security_opt'],'runtime inspect identity/isolation mismatch')
        mounts=runtime['mounts'];require(len(mounts)==3 and {m['destination'] for m in mounts}=={'/run/secrets/db_password','/run/secrets/keyring','/var/lib/venus'} and all(m['rw'] is (m['destination']=='/var/lib/venus') for m in mounts),'unexpected runtime mounts')
        require(health['version']=={'service':'venus','version':'0.0.0','source_revision':sha,'image_digest':image,'contract_revision':'P00-2'},'version not bound to image')
        integration=read(root,report['integration']);runner=read(root,report['integration_runner'])
        require(integration['source_sha']==sha and integration['source_dirty'] is False and integration['synthetic'] is True and integration['status']=='PASS' and integration['all_expected_checks']==len(P02_CHECKS),'P02 integration not bound/current')
        require(len(integration['tests'])==len(P02_CHECKS) and {c['id'] for c in integration['tests']}==P02_CHECKS and all(c['status']=='PASS' for c in integration['tests']),'P02 integration checks incomplete')
        capacity=next(c for c in integration['tests'] if c['id']=='P02-CAPACITY')['detail'];require(capacity['races']>=100 and capacity['successful_identities']==8,'capacity races insufficient')
        details={c['id']:c.get('detail',{}) for c in integration['tests']}
        expected={
            'P02-MIGRATION':dict(upgrade_from_generation=0,to_generation=1,repeat_noop=True,checksum_mismatch_rejected=True,unknown_generation_rejected=True),
            'P02-ROLLBACK':dict(previous_source='934d9a1efcccfb4380e708a8f5143a43efbc3a71',generation=1,exact_scoped_rows_preserved=True,candidate_resumed=True,previous_room_api_unavailable=True),
            'P02-BACKUP-RESTORE':dict(encrypted_roundtrip=True,expiry_rejected=True,header_tamper_rejected=True,revocations_reapplied=True,open_room_identities_preserved=True,nondefault_private_values_preserved=True,exact_scoped_rows_preserved=True,host_cannot_read_guest_values=True),
            'P02-WS-TICKETS':dict(guest_cookie_host_ticket_denied=True,foreign_room_cookie_denied=True,foreign_room_ticket_denied=True,unauth_denied=True,replayed_denied=True,expired_denied=True,bad_origin_denied=True),
            'P02-TIMERS':dict(presence_before_at=True,reservation_before_at=True,host_grace_before_at_after=True,late_ping_online=True,heartbeat_not_activity=True),
            'P02-CRYPTO-AUDIT':dict(fingerprint_keyed=True,private_cipher_bytes=16384,reply_cipher_bytes=16384,audit_atomic_rollback=True,audit_metadata_only=True,count_cap=10000,byte_cap=67108864),
            'P02-BROWSER-RECOVERY':dict(external_revision_conflict=True,refresh_replaces_draft=True,save_after_refresh=True,in_room_reaccept=True,explicit_adult_and_offer=True,no_reload_for_reaccept=True)}
        for key,values in expected.items():require(all(details[key].get(k)==v for k,v in values.items()),'insufficient recovery/privacy/ACL proof: '+key)
        require(re.fullmatch('sha256:[a-f0-9]{64}',details['P02-ROLLBACK'].get('previous_image','')),'previous OCI image identity missing')
        require(runner['source_sha']==sha and runner['status']=='PASS' and runner['cleanup']=='completed','integration runner failed/cleanup incomplete')
        screenshots=report['screenshots'];require(set(screenshots)=={'ru','en','tr'},'locale screenshots incomplete')
        for item in screenshots.values():require(read_bytes(root,item).startswith(b'\x89PNG\r\n\x1a\n'),'invalid screenshot evidence')
        protection=read(root,report['protection']);checks=protection['required_status_checks']
        require(protection['url']=='https://api.github.com/repos/psewdon1m/venus/branches/main/protection' and checks['strict'] is True and set(checks['contexts'])==required_jobs and {(c['context'],c['app_id']) for c in checks['checks']}=={(n,15368) for n in required_jobs} and len(checks['checks'])==len(required_jobs),'required GitHub Actions checks insufficient')
        require(protection['enforce_admins']['enabled'] and protection['required_pull_request_reviews'] and protection['required_conversation_resolution']['enabled'] and not protection['allow_force_pushes']['enabled'] and not protection['allow_deletions']['enabled'],'main PR protection insufficient')
        reviewers=[];scopes=set()
        for item in report['reviews']:
            review=read(root,item);reviewers.append(review['reviewer_id']);scopes.update(review['scopes'])
            require(review['reviewer_id']!='/root' and review['status']=='PASS' and review['open_findings']==[] and review['source_sha']==sha and review['source_identity_sha256']==cid,'review stale/self/unresolved')
            require(review['report_path'].startswith('.docs/implementation/reviews/'+stage.lower()+'/'),'review narrative out of scope')
            narrative=read_bytes(root,{'path':review['report_path'],'sha256':review['report_sha256']}).decode('utf-8').replace('\r\n','\n')
            header=re.match(r'\A```venus-review\n([^`]+)\n```\n',narrative)
            require(header is not None,'review narrative requires structured result/identity header')
            metadata=json.loads(header.group(1))
            fields=['reviewer_id','source_sha','source_identity_sha256','scopes','status','open_findings']
            require(set(metadata)==set(fields) and all(metadata[k]==review[k] for k in fields),'review narrative/result/identity mismatch')
        require(len(set(reviewers))>=2 and {'implementation','evidence'}.issubset(scopes),'two independent implementation/evidence reviews required')
        require(report['pending_decisions']==[],'P02 critical decision unresolved')
    except (KeyError,TypeError,ValueError,OSError,subprocess.SubprocessError,StopIteration) as error:errors.append(str(error))
    return errors
def main():
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['freeze','verify','identity']);args=parser.parse_args();directory=ROOT/'.docs/implementation/evidence/p02'
    if args.mode=='identity':print(identity(inventory()));return 0
    if args.mode=='freeze':
        files=inventory();directory.mkdir(parents=True,exist_ok=True);data={'source_sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'source_identity_sha256':identity(files),'files':files}
        (directory/'inputs.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(data['source_identity_sha256']);return 0
    errors=validate(ROOT,json.loads((directory/'gate-report.json').read_text('utf-8')))
    for error in errors:print('ERROR',error)
    print('FAIL' if errors else 'PASS: EXIT-P02 source/CI/HTTP/WS/PostgreSQL/browser/OCI and independent reviews bound');return int(bool(errors))
if __name__=='__main__':sys.exit(main())
