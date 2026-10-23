from pathlib import Path
import json,hashlib,shutil
root=Path.cwd();frozen=root/'.artifacts/p05-recovery-source1274-01';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt=root/'.artifacts/p05-recovery-image-a-receipt01.json';r=json.loads(receipt.read_text(encoding='utf-8'))
producer=frozen/'.artifacts/p05-private-batch-browser-producer16';assert not producer.exists();producer.parent.mkdir(exist_ok=True);shutil.copytree(root/'.artifacts/p05-private-batch-browser-producer16',producer)
runner=(root/'.artifacts/p05-method13-browser-run01.mjs').read_text(encoding='utf-8')
replacements={r['previous_pruned_image']:r['image'],'p05-private-batch-browser-producer13':'p05-private-batch-browser-producer16','p05-method13-root-binding01.json':'p05-recovery-method16-root-ack01.json',"const before=inventory();":"assert.equal(sha(readFileSync(authority.image_receipt)),authority.image_receipt_sha256);assert.equal(sha(readFileSync(authority.rebinding_review_index)),authority.rebinding_review_index_sha256);\nconst before=inventory();",'DIRTY_FROZEN_FUNCTIONAL_V2_BROWSER_SLICE':'HISTORICAL_EXACT_SOURCE_REBUILT_IMAGE_DIAGNOSTIC_SLICE_NOT_CURRENT_LIVE_STAGE'}
for a,b in replacements.items():assert runner.count(a)==1,(a,runner.count(a));runner=runner.replace(a,b)
runner_path=frozen/'.artifacts/p05-recovery-method16-browser-run01.mjs';runner_path.write_text(runner,encoding='utf-8',newline='\n')
pins={p.name:sha(p) for p in producer.iterdir() if p.is_file() and (p.suffix=='.mjs' or p.name=='DESIGN.md')}
review=root/'.docs/implementation/reviews/p05/topic-browser-method16-independent-review-round01/INDEX.json';assert sha(review)=='d7c452b3b58bf3199f7a94af88b266c01121881a39389727709fd43e70ad9bc8'
data={'status':'NOT_AUTHORIZED_DRAFT_REBINDING_REVIEW_REQUIRED','source_identity':r['source_identity'],'included_files':1813,'source_root':str(frozen),'image':r['image'],'runner_sha256':sha(runner_path),'runtime_pins':pins,'independent_review_index':str(review),'independent_review_index_sha256':sha(review),'image_receipt':str(receipt),'image_receipt_sha256':sha(receipt),'rebinding_review_index':None,'rebinding_review_index_sha256':None,'source_scope':'EXACT_HISTORICAL1274_SNAPSHOT_NOT_LIVE_P04_R3','previous_actual_method15':'4PASS_05FAIL_11NOTRUN_SECOND_ACTOR_PREPARATION_DEADLINE','attempts':1,'diagnostic_only_change':True,'full_stage_acceptance':False}
out=root/'.artifacts/p05-recovery-method16-binding-draft01.json';out.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'runner':str(runner_path),'runner_sha256':sha(runner_path),'draft_sha256':sha(out),'status':data['status']}))
