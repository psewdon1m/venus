"""Negative acceptance tests: rehashed partial/false statistical PASS stays rejected."""
import copy
import json
import math
from functools import lru_cache
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from p03_gate import validate_statistics,validate_progressive,digest,verify_auc,verify_gf

@lru_cache(maxsize=2)
def progressive_fixture(section):
    """Numerically consistent evidence fixture; never production measurement evidence."""
    modes=['questions','truth_or_dare','yes_but'];contexts=['online','in_person'];rows={};sessions=[];sizes=[];refusals=[]
    for n in range(2,9):
        for mode in modes:
            for context in contexts:
                for stage in range(1,5):rows[(n,mode,context,stage)]=dict(size=n,mode=mode,context=context,stage=stage,rounds=0,private_eligible_before_cap=0,private_eligible_after_cap=0,private_options_before_cap_sum=0,private_options_after_cap_sum=0,private_selected=0,min_comfort_histogram={str(i):0 for i in range(5)},interactions=dict(group=0,solo=0,pair_public=0,pair_private=0),anti_repeat=dict(decisions_with_unused_alternative=0,private_choices_with_alternative=0,violations=0,same_pair_no_alternative_exceptions=0))
    prefixes={}
    for n in range(2,9):
        round_total=0
        profiles=[(m,c,i) for m in modes for c in contexts for i in range(2000)] if section=='fairness' else [(modes[i%3],contexts[(i//3)%2],i) for i in range(10000)]
        for mode,context,index in profiles:
            total=20 if section=='fairness' else 1+index%100;completed=section=='fairness' or index!=0;selected=total if completed else 0
            seed=f'venus:P03-M2:fairness:{n}:{mode}:{context}:{index}' if section=='fairness' else f'venus:P03-M1:test:{n}:{index}'
            private=2 if section=='fairness' and index==0 else 0
            sessions.append(dict(seed=seed,total_rounds=total,selected_rounds=selected,private_count=private,private_cap=math.ceil(.25*total),completed=completed));round_total+=selected
            if not completed:refusals.append(dict(seed=seed,completed_prefix=0,reason='SAFE_POOL_EXHAUSTED'))
            if (total,selected) not in prefixes:
                counts=[0]*4
                for r in range(1,selected+1):counts[min(4,1+(4*(r-1))//max(1,total-1))-1]+=1
                prefixes[(total,selected)]=counts
            for stage,count in enumerate(prefixes[(total,selected)],1):
                row=rows[(n,mode,context,stage)];p=1 if private and stage>=3 else 0
                row['rounds']+=count;row['private_selected']+=p;row['min_comfort_histogram']['0']+=count-p;row['min_comfort_histogram']['1']+=p;row['interactions']['pair_public']+=count-p;row['interactions']['pair_private']+=p
                if section=='fairness' and stage>=3:
                    row['private_eligible_before_cap']+=count;row['private_eligible_after_cap']+=count;row['private_options_before_cap_sum']+=count*n*(n-1)//2;row['private_options_after_cap_sum']+=count*n*(n-1)//2
                if private and stage==4:
                    key='same_pair_no_alternative_exceptions' if n==2 else 'private_choices_with_alternative';row['anti_repeat'][key]+=1
                    if n>=3:row['anti_repeat']['decisions_with_unused_alternative']+=1
        sizes.append(dict(size=n,sessions=10000,completed=9999,safe_refusals=1,rounds=round_total))
    return dict(status='PASS',strata=list(rows.values()),sessions=sessions,violations=[]),sizes,refusals

def metric(count):
    se=math.sqrt((.25+(count-1)/6)/(count*count))
    return dict(status='PASS',heldout_scores=[[0]*count,[0]*count],n_negative=count,n_positive=count,auc=.5,ci95=[.5-1.96*se,.5+1.96*se])

class P03StatisticalEvidenceTests(unittest.TestCase):
    def fixture(self):
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup);root=Path(temporary.name)
        def artifact(name,value):
            path=root/name;path.write_text(json.dumps(value),encoding='utf-8');return dict(path=name,sha256=digest(path.read_bytes()))
        protocol=artifact('protocol.json',dict(protocol_revision='P03-M3',preregistration_tag='p03-m3-preregistered-20261018'))
        (root/'source.txt').write_bytes(b'preregistered source fixture')
        declared=dict(protocol_revision='P03-M3',raw_input_sha256={'source.txt':digest((root/'source.txt').read_bytes())},pack_digest='sha256:'+'d'*64)
        inputs=artifact('design.json',declared);sha='a'*40;cid='b'*64
        progressive,sizes,refusals=progressive_fixture('invariants')
        invariant=dict(status='PASS',sessions=70000,violations=[],sizes=sizes,safe_refusals=refusals,progressive_diagnostics=progressive,invariants=[dict(id='I'+str(i).zfill(2),checks=1,violations=0,runtime_evidence_required=False) for i in range(1,16)])
        fairness=[];inferences=[]
        for n in range(2,9):
            for mode in ['questions','truth_or_dare','yes_but']:
                for context in ['online','in_person']:
                    cell=dict(size=n,mode=mode,context=context)
                    counts=[80000//n+int(i<80000%n) for i in range(n)]
                    fairness.append(dict(**cell,status='PASS',sessions=2000,K=40000,D=80000,invitation_counts=counts,max_individual_session_share=.5,aggregate_player_share_gap=(max(counts)-min(counts))/80000))
                    inferences.append(dict(**cell,**metric(400),train_per_class=100,holdout_per_class=400,structural_deterministic_decoders=[]))
        pg=.11;pf=.1;n=1000000;vg=n/(n-1)*pg*(1-pg);vf=n/(n-1)*pf*(1-pf);cov=n/(n-1)*(.1-pg*pf);se=math.sqrt((vg/pg**2+vf/pf**2-2*cov/(pg*pf))/n)
        gf=dict(status='PASS',n=n,pG=pg,pF=pf,counts=dict(both=100000,g_only=10000,f_only=0,neither=890000),ratio=pg/pf,ci95=[math.exp(math.log(pg/pf)-1.96*se),math.exp(math.log(pg/pf)+1.96*se)])
        results=dict(invariants=invariant,fairness=dict(status='PASS',strata=fairness,progressive_diagnostics=progressive_fixture('fairness')[0]),gf=gf,inference=dict(status='PASS',comparisons=[dict(comparison=pair,status='PASS',pooled=metric(16800),strata=copy.deepcopy(inferences)) for pair in ['FG','FM','GM']]))
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
        for kind in ['probe','dirty','source','missing-cell','sample','unexecuted','decoder','false-auc','false-gap','false-K','zero-gf']:
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
                elif kind=='false-K':
                    section='fairness';value=values[section];row=value['results'][section]['strata'][0];row.update(K=2000,D=4000,invitation_counts=[2000,2000],aggregate_player_share_gap=0)
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

    def test_consistently_zeroed_late_private_or_excess_session_cap_cannot_pass(self):
        diag=copy.deepcopy(progressive_fixture('fairness')[0])
        for row in diag['strata']:
            private=row['private_selected'];row['private_selected']=0
            row['interactions']['pair_private']=0;row['interactions']['pair_public']+=private
            row['min_comfort_histogram']['1']-=private;row['min_comfort_histogram']['0']+=private
            row['anti_repeat']['private_choices_with_alternative']=0;row['anti_repeat']['same_pair_no_alternative_exceptions']=0
        for session in diag['sessions']:session['private_count']=0
        with self.assertRaisesRegex(ValueError,'degenerate'):validate_progressive(dict(progressive_diagnostics=diag),'fairness')
        diag=copy.deepcopy(progressive_fixture('fairness')[0]);diag['sessions'][0]['private_count']=6
        with self.assertRaisesRegex(ValueError,'cap violated'):validate_progressive(dict(progressive_diagnostics=diag),'fairness')

    def test_stage_totals_cannot_move_between_cells_with_unchanged_global_counts(self):
        diag,sizes,refusals=progressive_fixture('invariants');diag=copy.deepcopy(diag)
        first=diag['strata'][0];second=diag['strata'][1]
        for row,delta in [(first,-1),(second,1)]:
            row['rounds']+=delta;row['min_comfort_histogram']['0']+=delta;row['interactions']['pair_public']+=delta
        with self.assertRaisesRegex(ValueError,'stage distribution'):validate_progressive(dict(progressive_diagnostics=diag,sizes=sizes,safe_refusals=refusals),'invariants')
