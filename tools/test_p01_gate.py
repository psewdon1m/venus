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
        files=inputs(root);cid=identity(files);sha='a'*40
        def artifact(name,value):
            path=root/'.docs/implementation/evidence/p01'/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(json.dumps(value));return {'path':path.relative_to(root).as_posix(),'sha256':digest(path.read_bytes())}
        report={'gate':'EXIT-P01','status':'PASSED','source_sha':sha,'source_identity_sha256':cid,'pending_decisions':[],
            'inputs':artifact('inputs.json',{'files':files,'source_identity_sha256':cid}),
            'ci':artifact('ci.json',{'head_sha':sha,'conclusion':'success','status':'completed','path':'.github/workflows/ci.yml','html_url':'https://github.com/psewdon1m/venus/actions/runs/1'}),
            'ci_jobs':artifact('jobs.json',{'jobs':[{'name':n,'conclusion':'success'} for n in ['quality','container-smoke']]}),
            'negative':artifact('negative.json',{'source_sha':sha,'status':'PASS','source_before':'hash','source_after':'hash','cases':[{'id':n,'status':'PASS','positive_exit':0,'negative_exit':1} for n in ['schema','locale','type','unit']]}),
            'health':artifact('health.json',{'source_sha':sha,'source_dirty':False,'status':'PASS','image_id':'sha256:'+'b'*64,'checks':[{'id':n,'status':'PASS'} for n in ['nonroot-image-labels-and-layer-secret-scan','loopback-only-app-private-postgres','runtime-isolation-no-socket','version-contract-web-and-ready-postgres','database-outage-is-not-ready-process-alive','database-recovery-without-app-restart','structured-logs-do-not-expose-payloads-or-secrets']]}),
            'protection':artifact('protection.json',{'required_status_checks':{'strict':True,'contexts':['quality','container-smoke']},'enforce_admins':{'enabled':True},'allow_force_pushes':{'enabled':False},'allow_deletions':{'enabled':False},'required_pull_request_reviews':{'required_approving_review_count':0},'required_conversation_resolution':{'enabled':True}}),
            'reviews':[]}
        for name,scope in [('review-a','implementation'),('review-b','evidence')]:
            narrative=root/'.docs/implementation/reviews/p01'/f'{name}.md';narrative.parent.mkdir(parents=True,exist_ok=True);narrative.write_text('PASS: independent review')
            report['reviews'].append(artifact(name+'.json',{'reviewer_id':name,'scopes':[scope],'status':'PASS','open_findings':[],'source_identity_sha256':cid,'source_sha':sha,'report_path':narrative.relative_to(root).as_posix(),'report_sha256':digest(narrative.read_bytes())}))
        return root,report,artifact

    def verify(self,root,report):
        def git(args,**kwargs):
            return 'source.ts\n' if args[1]=='ls-tree' else b'source'
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

if __name__=='__main__':unittest.main()
