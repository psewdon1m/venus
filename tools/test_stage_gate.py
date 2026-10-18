"""P02 evidence rejects mixed revisions, incomplete recovery and independent-review bypasses."""
import json
from unittest.mock import patch
from test_p01_gate import P01EvidenceTests
from stage_gate import validate,read,P02_CHECKS,CONTAINER_CHECKS

class P02EvidenceTests(P01EvidenceTests):
    def fixture(self):
        root,report,artifact=super().fixture();report['gate']='EXIT-P02';sha=report['source_sha']
        jobs=['quality','container-smoke','p02-integration']
        ci=read(root,report['ci_jobs']);ci['jobs']=[dict(name=n,conclusion='success',run_id=1,head_sha=sha) for n in jobs];report['ci_jobs']=artifact('jobs.json',ci)
        health=read(root,report['health']);health['checks']=[dict(id=n,status='PASS') for n in CONTAINER_CHECKS]
        health['runtime']['mounts']=[dict(destination=n,rw=n=='/var/lib/venus') for n in ['/run/secrets/db_password','/run/secrets/keyring','/var/lib/venus']];report['health']=artifact('health.json',health)
        protection=read(root,report['protection']);protection['required_status_checks'].update(contexts=jobs,checks=[dict(context=n,app_id=15368) for n in jobs]);report['protection']=artifact('protection.json',protection)
        integration=dict(source_sha=sha,source_dirty=False,synthetic=True,status='PASS',all_expected_checks=len(P02_CHECKS),tests=[dict(id=n,status='PASS') for n in sorted(P02_CHECKS)])
        details={
            'P02-CAPACITY':dict(races=100,successful_identities=8),
            'P02-MIGRATION':dict(upgrade_from_generation=0,to_generation=1,repeat_noop=True,checksum_mismatch_rejected=True,unknown_generation_rejected=True),
            'P02-ROLLBACK':dict(previous_image='sha256:'+'d'*64,previous_source='934d9a1efcccfb4380e708a8f5143a43efbc3a71',generation=1,exact_scoped_rows_preserved=True,candidate_resumed=True,previous_room_api_unavailable=True),
            'P02-BACKUP-RESTORE':dict(encrypted_roundtrip=True,expiry_rejected=True,header_tamper_rejected=True,revocations_reapplied=True,open_room_identities_preserved=True,nondefault_private_values_preserved=True,exact_scoped_rows_preserved=True,host_cannot_read_guest_values=True),
            'P02-WS-TICKETS':dict(guest_cookie_host_ticket_denied=True,foreign_room_cookie_denied=True,foreign_room_ticket_denied=True,unauth_denied=True,replayed_denied=True,expired_denied=True,bad_origin_denied=True),
            'P02-TIMERS':dict(presence_before_at=True,reservation_before_at=True,host_grace_before_at_after=True,late_ping_online=True,heartbeat_not_activity=True),
            'P02-CRYPTO-AUDIT':dict(fingerprint_keyed=True,private_cipher_bytes=16384,reply_cipher_bytes=16384,audit_atomic_rollback=True,audit_metadata_only=True,count_cap=10000,byte_cap=67108864),
            'P02-BROWSER-RECOVERY':dict(external_revision_conflict=True,refresh_replaces_draft=True,save_after_refresh=True,in_room_reaccept=True,explicit_adult_and_offer=True,no_reload_for_reaccept=True)}
        for row in integration['tests']:
            if row['id'] in details:row['detail']=details[row['id']]
        report['integration']=artifact('integration.json',integration);report['integration_runner']=artifact('runner.json',dict(source_sha=sha,status='PASS',cleanup='completed'))
        report['screenshots']={}
        for locale in ['ru','en','tr']:
            path=root/'.docs/implementation/evidence/p01'/('room-'+locale+'.png');path.write_bytes(b'\x89PNG\r\n\x1a\nfixture')
            from stage_gate import descriptor
            report['screenshots'][locale]=descriptor(path,root)
        for i,item in enumerate(report['reviews']):
            value=read(root,item);old=root/value['report_path'];new=root/'.docs/implementation/reviews/p02'/old.name;new.parent.mkdir(parents=True,exist_ok=True)
            metadata={k:value[k] for k in ['reviewer_id','source_sha','source_identity_sha256','scopes','status','open_findings']}
            new.write_text('```venus-review\n'+json.dumps(metadata)+'\n```\n# Independent review\nPASS: no open findings\n')
            from stage_gate import digest
            value.update(report_path=new.relative_to(root).as_posix(),report_sha256=digest(new.read_bytes()));report['reviews'][i]=artifact('review-'+str(i)+'.json',value)
        return root,report,artifact

    def verify(self,root,report):
        def git(args,**kwargs):
            if args[1]=='ls-tree':return 'infra/venus/compose.yml\nsource.ts\n'
            return b'compose' if args[-1].endswith('compose.yml') else b'source'
        with patch('stage_gate.subprocess.check_output',side_effect=git):return validate(root,report)

    def test_missing_mixed_or_false_recovery_evidence_is_rejected(self):
        for kind in ['missing','foreign','dirty','restore','rollback','ws','timers','crypto','browser','runner','screenshots']:
            root,report,artifact=self.fixture();value=read(root,report['integration'])
            if kind=='missing':value['tests'].pop()
            if kind=='foreign':value['source_sha']='f'*40
            if kind=='dirty':value['source_dirty']=True
            ids={'restore':'P02-BACKUP-RESTORE','rollback':'P02-ROLLBACK','ws':'P02-WS-TICKETS','timers':'P02-TIMERS','crypto':'P02-CRYPTO-AUDIT','browser':'P02-BROWSER-RECOVERY'}
            if kind in ids:next(v for v in value['tests'] if v['id']==ids[kind])['detail']={}
            report['integration']=artifact('changed.json',value)
            if kind=='runner':report['integration_runner']=artifact('runner-bad.json',dict(source_sha=report['source_sha'],status='PASS',cleanup='failed'))
            if kind=='screenshots':report['screenshots'].pop('tr')
            self.assertTrue(self.verify(root,report),kind)
    def test_rehashed_failed_or_foreign_review_narrative_cannot_pass(self):
        from stage_gate import digest
        for change in ['missing','status','reviewer_id','source_sha','scopes','open_findings']:
            root,report,artifact=self.fixture();review=read(root,report['reviews'][0]);path=root/review['report_path']
            metadata={k:review[k] for k in ['reviewer_id','source_sha','source_identity_sha256','scopes','status','open_findings']}
            changes=dict(status='FAIL',reviewer_id='another-agent',source_sha='f'*40,scopes=['security'],open_findings=['unresolved'])
            if change=='missing':path.write_text('# FAIL\nOpen findings: unresolved\n')
            else:
                metadata[change]=changes[change];path.write_text('```venus-review\n'+json.dumps(metadata)+'\n```\n# FAIL\n')
            review['report_sha256']=digest(path.read_bytes());report['reviews'][0]=artifact('review-failed.json',review)
            self.assertTrue(self.verify(root,report),change)
