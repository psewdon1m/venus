import json
from pathlib import Path
import tempfile
import unittest
from p04_gate import inspect,technical,validate_coverage,validate_reviews,validate_private_coverage

class P04AcceptanceBoundary(unittest.TestCase):
    def test_draft_count_is_autonomous_work_and_does_not_imply_human_approval(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);cards=root/'.docs/content/p04/cards';cards.mkdir(parents=True)
            for mode in ['questions','truth_or_dare','yes_but']:
                for i in range(100):(cards/f'{mode}-{i}.json').write_text(json.dumps({'mode':mode,'status':'draft'}),encoding='utf-8')
            result=inspect(root)
            self.assertEqual(result['status'],'NOT_PASSED');self.assertEqual(len(result['missing']),1)
            self.assertIn('HUMAN',result['missing'][0]);self.assertFalse(result['production_catalogue_available'])

    def test_exit_scope_cannot_masquerade_as_a_technical_packet(self):
        with self.assertRaisesRegex(ValueError,'status/scope'):technical(Path('.'),{'gate':'EXIT-P04','status':'PASSED'})

    def test_unbound_or_fabricated_technical_success_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'exact source'):technical(Path('.'),{'gate':'P04-TECHNICAL-1','status':'PASSED','source_sha':'main'})

    def test_missing_duplicate_and_invalid_coverage_cannot_preserve_a_green_count(self):
        source=Path(__file__).resolve().parents[1]/'.docs/implementation/evidence/p04/draft-author-300'
        coverage=json.loads((source/'coverage.json').read_text('utf-8'));analysis=json.loads((source/'analysis.json').read_text('utf-8'))
        validate_coverage(coverage,analysis)
        altered=json.loads(json.dumps(coverage));altered['cells']=[altered['cells'][0]]*5880
        with self.assertRaisesRegex(ValueError,'tuples'):validate_coverage(altered,analysis)
        altered=json.loads(json.dumps(coverage));negatives=[r for r in altered['sessions'] if r['profile']=='all_X'];altered['sessions']=[r for r in altered['sessions'] if r['profile']!='all_X']+[negatives[0]]*14
        with self.assertRaisesRegex(ValueError,'all-X'):validate_coverage(altered,analysis)
        altered=json.loads(json.dumps(coverage));altered['cells'][0]['effective_eligible_card_count']=True
        with self.assertRaisesRegex(ValueError,'card count'):validate_coverage(altered,analysis)

    def test_large_public_pool_does_not_hide_a_supported_private_content_gap(self):
        report={'protocol':'P04-C2','capabilities':[],'private_budget_rounds':100,'private_baseline_required':25,'private_coverage':'PASS',
          'cells':[{'stage':3,'comfort':1,'context':'in_person','resolved_class':'F','effective_eligible_card_count':100,
            'by_interaction':{'group':100,'solo':0,'pair_public':0,'pair_private':0},'private_baseline_card_count':0,'private_profile_status':'SUPPORTED'}]}
        with self.assertRaisesRegex(ValueError,'baseline below'):validate_private_coverage(report,[])

    def test_excluded_private_rows_cannot_claim_eligible_private_cards(self):
        source=Path(__file__).resolve().parents[1]/'.docs/implementation/evidence/p04/draft-author-450'
        original=json.loads((source/'coverage.json').read_text('utf-8'))
        validate_private_coverage(original,[])
        for status in ['RULE_EXCLUDED_STAGE','RULE_EXCLUDED_COMFORT','RULE_EXCLUDED_CLASS','CAPABILITY_UNAVAILABLE']:
            altered=json.loads(json.dumps(original))
            row=next(r for r in altered['cells'] if r['private_profile_status']==status and r['effective_eligible_card_count']>0)
            public=next(k for k,n in row['by_interaction'].items() if n>0)
            row['by_interaction'][public]-=1;row['by_interaction']['pair_private']=1
            with self.subTest(status=status),self.assertRaisesRegex(ValueError,'incorrectly eligible'):
                validate_private_coverage(altered,[])

    def test_root_self_review_and_missing_required_scopes_are_rejected(self):
        import hashlib
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);reviews=root/'.docs/implementation/reviews/p04';reviews.mkdir(parents=True)
            descriptors=[]
            for i in range(2):
                review={'reviewer_id':'/root' if i==0 else '/root/other','source_sha':'a'*40,'source_identity_sha256':'b'*64,'scopes':['evidence'],'status':'PASS','open_findings':[]}
                body='```venus-review\n'+json.dumps(review)+'\n```\nReview.';path=reviews/f'r{i}.md';path.write_text(body,encoding='utf-8')
                sidecar={**review,'report_path':path.relative_to(root).as_posix(),'report_sha256':hashlib.sha256(path.read_bytes()).hexdigest()};p=reviews/f'r{i}.json';p.write_text(json.dumps(sidecar),encoding='utf-8');descriptors.append({'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
            with self.assertRaisesRegex(ValueError,'independent'):validate_reviews(root,descriptors,'a'*40,'b'*64)
            for i,descriptor in enumerate(descriptors):
                p=root/descriptor['path'];review=json.loads(p.read_text('utf-8'));review['reviewer_id']=f'/root/independent{i}'
                metadata={k:review[k] for k in ['reviewer_id','source_sha','source_identity_sha256','scopes','status','open_findings']};path=root/review['report_path'];path.write_text('```venus-review\n'+json.dumps(metadata)+'\n```\nReview.',encoding='utf-8');review['report_sha256']=hashlib.sha256(path.read_bytes()).hexdigest();p.write_text(json.dumps(review),encoding='utf-8');descriptor['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
            with self.assertRaisesRegex(ValueError,'implementation/evidence'):validate_reviews(root,descriptors,'a'*40,'b'*64)

if __name__=='__main__':unittest.main()
