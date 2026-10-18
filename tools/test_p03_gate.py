"""Negative acceptance tests: rehashed partial/false statistical PASS stays rejected."""
import copy
import json
import math
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from p03_gate import validate_statistics,digest,verify_auc,verify_gf

def metric(count):
    se=math.sqrt((.25+(count-1)/6)/(count*count))
    return dict(status='PASS',heldout_scores=[[0]*count,[0]*count],n_negative=count,n_positive=count,auc=.5,ci95=[.5-1.96*se,.5+1.96*se])

class P03StatisticalEvidenceTests(unittest.TestCase):
    def fixture(self):
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup);root=Path(temporary.name)
        def artifact(name,value):
            path=root/name;path.write_text(json.dumps(value),encoding='utf-8');return dict(path=name,sha256=digest(path.read_bytes()))
        protocol=artifact('protocol.json',dict(protocol_revision='P03-M2',preregistration_tag='p03-m2-preregistered-20261018'))
        (root/'source.txt').write_bytes(b'preregistered source fixture')
        declared=dict(protocol_revision='P03-M2',raw_input_sha256={'source.txt':digest((root/'source.txt').read_bytes())},pack_digest='sha256:'+'d'*64)
        inputs=artifact('design.json',declared);sha='a'*40;cid='b'*64
        invariant=dict(status='PASS',sessions=70000,violations=[],sizes=[dict(size=n,sessions=10000,completed=9999,safe_refusals=1) for n in range(2,9)],invariants=[dict(id='I'+str(i).zfill(2),checks=1,violations=0,runtime_evidence_required=False) for i in range(1,16)])
        fairness=[];inferences=[]
        for n in range(2,9):
            for mode in ['questions','truth_or_dare','yes_but']:
                for context in ['online','in_person']:
                    cell=dict(size=n,mode=mode,context=context)
                    fairness.append(dict(**cell,status='PASS',sessions=2000,K=n*1000,D=n*2000,invitation_counts=[2000]*n,max_individual_session_share=.5,aggregate_player_share_gap=0))
                    inferences.append(dict(**cell,**metric(400),train_per_class=100,holdout_per_class=400,structural_deterministic_decoders=[]))
        pg=.11;pf=.1;n=1000000;vg=n/(n-1)*pg*(1-pg);vf=n/(n-1)*pf*(1-pf);cov=n/(n-1)*(.1-pg*pf);se=math.sqrt((vg/pg**2+vf/pf**2-2*cov/(pg*pf))/n)
        gf=dict(status='PASS',n=n,pG=pg,pF=pf,counts=dict(both=100000,g_only=10000,f_only=0,neither=890000),ratio=pg/pf,ci95=[math.exp(math.log(pg/pf)-1.96*se),math.exp(math.log(pg/pf)+1.96*se)])
        results=dict(invariants=invariant,fairness=dict(status='PASS',strata=fairness),gf=gf,inference=dict(status='PASS',comparisons=[dict(comparison=pair,status='PASS',pooled=metric(16800),strata=copy.deepcopy(inferences)) for pair in ['FG','FM','GM']]))
        values={}
        for section,result in results.items():
            values[section]=dict(status='PASS',gating=True,probe=False,section=section,source_sha=sha,source_after_sha=sha,source_identity_sha256=cid,source_identity_after_sha256=cid,source_dirty=False,source_dirty_after=False,protocol_sha256=protocol['sha256'],pack_digest=declared['pack_digest'],preregistered_input_descriptor=declared,preregistered_raw_inputs_after=declared['raw_input_sha256'],input_sha256={'dist.js':'c'*64},input_sha256_after={'dist.js':'c'*64},fresh_build='tsc -b --force BEFORE dynamic runtime imports',results={section:result})
        report=dict(source_sha=sha,source_identity_sha256=cid,measurement_protocol=protocol,measurement_inputs=inputs,measurements={key:artifact(key+'.json',value) for key,value in values.items()})
        return root,report,artifact,values

    def verify(self,root,report):
        with patch('p03_gate.subprocess.check_output',return_value=b'preregistered source fixture'):
            return validate_statistics(root,report)

    def test_complete_declared_fixture_and_raw_numeric_recomputation(self):
        root,report,_,_=self.fixture();self.assertEqual(set(self.verify(root,report)),{'invariants','fairness','gf','inference'})

    def test_rehashed_partial_probe_dirty_or_changed_results_rejected(self):
        for kind in ['probe','dirty','source','missing-cell','sample','unexecuted','decoder','false-auc','false-gap','zero-gf']:
            with self.subTest(kind=kind):
                root,report,artifact,values=self.fixture();section='inference';value=values[section]
                if kind=='probe':value['probe']=True
                elif kind=='dirty':value['source_dirty_after']=True
                elif kind=='source':value['source_after_sha']='f'*40
                elif kind=='missing-cell':value['results']['inference']['comparisons'][0]['strata'].pop()
                elif kind=='sample':value['results']['inference']['comparisons'][0]['strata'][0]['holdout_per_class']=4
                elif kind=='decoder':value['results']['inference']['comparisons'][0]['strata'][0]['structural_deterministic_decoders']=['public-secret']
                elif kind=='false-auc':value['results']['inference']['comparisons'][0]['strata'][0]['heldout_scores'][1]=[1]*400
                elif kind=='unexecuted':section='invariants';value=values[section];value['results'][section]['invariants'][0]['checks']=0
                elif kind=='false-gap':section='fairness';value=values[section];value['results'][section]['strata'][0]['invitation_counts']=[1,3999]
                elif kind=='zero-gf':section='gf';value=values[section];value['results'][section]['counts']=dict(both=0,g_only=1,f_only=0,neither=999999)
                report['measurements'][section]=artifact('changed-'+section+'.json',value)
                with self.assertRaises(ValueError):self.verify(root,report)

    def test_preregistration_cannot_be_rehashed_to_a_different_source(self):
        root,report,_,_=self.fixture()
        with patch('p03_gate.subprocess.check_output',return_value=b'changed after preregistration'):
            with self.assertRaisesRegex(ValueError,'preregistration'):validate_statistics(root,report)

    def test_raw_auc_and_paired_counts_reject_nonfinite_or_fabricated_bound(self):
        bad=metric(400);bad['heldout_scores'][0][0]=float('nan')
        with self.assertRaises(ValueError):verify_auc(bad)
        with self.assertRaises(ValueError):verify_gf(dict(n=1000000,counts=dict(both=0,g_only=100,f_only=0,neither=999900)))
