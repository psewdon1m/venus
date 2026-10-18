"""Regression tests for fabricated, partial, stale or self-approved P01 evidence."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from p01_gate import digest, identity, inputs, read_artifact, validate

class P01EvidenceTests(unittest.TestCase):
    def fixture(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);root=Path(temp.name)
        (root/'source.ts').write_text('source')
        (root/'infra/venus').mkdir(parents=True);(root/'infra/venus/compose.yml').write_text('compose')
        files=inputs(root);cid=identity(files);sha='a'*40
        def artifact(name,value):
            path=root/'.docs/implementation/evidence/p01'/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(json.dumps(value));return {'path':path.relative_to(root).as_posix(),'sha256':digest(path.read_bytes())}
        report={'gate':'EXIT-P01','status':'PASSED','source_sha':sha,'source_identity_sha256':cid,'pending_decisions':[],
            'inputs':artifact('inputs.json',{'source_sha':sha,'files':files,'source_identity_sha256':cid}),
            'ci':artifact('ci.json',{'id':1,'head_sha':sha,'conclusion':'success','status':'completed','path':'.github/workflows/ci.yml','html_url':'https://github.com/psewdon1m/venus/actions/runs/1'}),
            'ci_jobs':artifact('jobs.json',{'jobs':[{'name':n,'conclusion':'success','run_id':1,'head_sha':sha} for n in ['quality','container-smoke']]}),
            'negative':artifact('negative.json',{'source_sha':sha,'source_identity_sha256':cid,'source_dirty':False,'status':'PASS','source_before':digest('\n'.join(n+':'+h for n,h in sorted(files.items())).encode()),'source_after':digest('\n'.join(n+':'+h for n,h in sorted(files.items())).encode()),'cases':[{'id':n,'status':'PASS','positive_exit':0,'negative_exit':1} for n in ['schema','locale','type','unit']]}),
            'health':artifact('health.json',{'source_sha':sha,'source_dirty':False,'status':'PASS','image_id':'sha256:'+'b'*64,'checks':[{'id':n,'status':'PASS'} for n in ['nonroot-image-labels-and-layer-secret-scan','loopback-only-app-private-postgres','runtime-isolation-no-socket','version-contract-web-and-ready-postgres','database-outage-is-not-ready-process-alive','database-recovery-without-app-restart','structured-logs-do-not-expose-payloads-or-secrets']]}),
            'protection':artifact('protection.json',{'url':'https://api.github.com/repos/psewdon1m/venus/branches/main/protection','required_status_checks':{'strict':True,'contexts':['quality','container-smoke'],'checks':[{'context':n,'app_id':15368} for n in ['quality','container-smoke']]},'enforce_admins':{'enabled':True},'allow_force_pushes':{'enabled':False},'allow_deletions':{'enabled':False},'required_pull_request_reviews':{'required_approving_review_count':0},'required_conversation_resolution':{'enabled':True}}),
            'reviews':[]}
        image='sha256:'+'b'*64
        rendered=artifact('rendered.json',{'services':{'app':{'image':image,'environment':{'IMAGE_DIGEST':image},'ports':[{'host_ip':'127.0.0.1'}]},'db':{}},'networks':{'backend':{'internal':True}}})
        logs=artifact('logs.json',{'event':'request_complete'})
        health=read_artifact(root,report['health']);health.update(compose_sha256=digest(b'compose'),rendered_compose_sha256=rendered['sha256'],logs_sha256=logs['sha256'],runtime={'image':image,'user':'1000:1000','source_revision':sha,'version':'0.0.0','privileged':False,'readonly_rootfs':True,'cap_drop':['ALL'],'security_opt':['no-new-privileges:true'],'mounts':[{'destination':'/run/secrets/db_password','rw':False}]},version={'service':'venus','version':'0.0.0','source_revision':sha,'image_digest':image,'contract_revision':'P00-2'})
        report.update(health=artifact('health.json',health),rendered_compose=rendered,logs=logs)
        for name,scope in [('review-a','implementation'),('review-b','evidence')]:
            narrative=root/'.docs/implementation/reviews/p01'/f'{name}.md';narrative.parent.mkdir(parents=True,exist_ok=True);narrative.write_text('PASS: independent review')
            report['reviews'].append(artifact(name+'.json',{'reviewer_id':name,'scopes':[scope],'status':'PASS','open_findings':[],'source_identity_sha256':cid,'source_sha':sha,'report_path':narrative.relative_to(root).as_posix(),'report_sha256':digest(narrative.read_bytes())}))
        return root,report,artifact

    def verify(self,root,report):
        def git(args,**kwargs):
            if args[1]=='ls-tree':return 'infra/venus/compose.yml\nsource.ts\n'
            return b'compose' if args[-1].endswith('compose.yml') else b'source'
        with patch('p01_gate.subprocess.check_output',side_effect=git):return validate(root,report)

    def test_bound_complete_evidence_passes(self):
        root,report,_=self.fixture();self.assertEqual(self.verify(root,report),[])

    def test_failed_dirty_partial_or_foreign_ci_cannot_pass(self):
        for field,changes in [('ci',{'head_sha':'c'*40}),('ci',{'conclusion':'failure'}),('ci_jobs',{'jobs':[]}),('negative',{'cases':[]}),('health',{'source_dirty':True}),('health',{'checks':[]}),('protection',{'enforce_admins':{'enabled':False}})]:
            with self.subTest(field=field,changes=changes):
                root,report,artifact=self.fixture();value=read_artifact(root,report[field]);value.update(changes);report[field]=artifact(field+'.json',value)
                self.assertTrue(self.verify(root,report))

    def test_stale_tampered_self_or_duplicate_reviews_cannot_pass(self):
        for kind in ['stale','tamper','self','duplicate','open','narrative']:
            root,report,artifact=self.fixture()
            if kind=='stale':(root/'source.ts').write_text('changed')
            if kind=='tamper':(root/report['ci']['path']).write_text('{}')
            if kind=='duplicate':report['reviews'][1]=copy.deepcopy(report['reviews'][0])
            if kind in ['self','open','narrative']:
                value=read_artifact(root,report['reviews'][0])
                if kind=='self':value['reviewer_id']='/root'
                if kind=='open':value['open_findings']=['unfixed']
                if kind=='narrative':(root/value['report_path']).write_text('changed')
                report['reviews'][0]=artifact('review-a.json',value)
            self.assertTrue(self.verify(root,report),kind)

    def test_paths_outside_source_are_rejected(self):
        root,_,_=self.fixture()
        with self.assertRaises(ValueError):read_artifact(root,{'path':'../outside','sha256':'0'*64})

    def test_mixed_jobs_fabricated_snapshot_compose_or_image_rejected(self):
        mutations=[('ci_jobs',lambda v:v['jobs'][0].update(run_id=9)),('ci_jobs',lambda v:v['jobs'][0].update(head_sha='c'*40)),('negative',lambda v:v.update(source_before='arbitrary',source_after='arbitrary')),('health',lambda v:v.update(compose_sha256='0'*64)),('health',lambda v:v.update(logs_sha256='0'*64)),('health',lambda v:v['runtime'].update(image='sha256:'+'c'*64)),('health',lambda v:v['version'].update(source_revision='c'*40)),('protection',lambda v:v['required_status_checks']['checks'][0].update(app_id=None))]
        for field,mutate in mutations:
            root,report,artifact=self.fixture();value=read_artifact(root,report[field]);mutate(value);report[field]=artifact(field+'.json',value)
            self.assertTrue(self.verify(root,report),field)

if __name__=='__main__':unittest.main()
