from pathlib import Path
import json,hashlib,datetime
r=Path.cwd();f=r/'.artifacts/p05-recovery-source1274-01';prep_path=f/'.artifacts/p05/r100-v3-7da46d477970/preparation.json';p=json.loads(prep_path.read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
method=r/'.docs/implementation/reviews/p05/topic-measurement-method08-independent-review-round01/INDEX.json';assert sha(method)=='e46158ab5d6e36f5fa633e95c9f40c19f4672f6f341d29cc935ab8fb1fae4977'
image_review=r/'.docs/implementation/reviews/p05/recovery-image-binding-independent-round01/INDEX.json';assert sha(image_review)=='c451ddef9cec3ae0fadf1b9aa3d955c3ce7d5bffa60034cb9b91c9652e44db6c'
for n in ['r100-v3-launcher.mjs','verify-terminal.mjs','allocated-tree.py']:
 assert sha(f/'.artifacts/p05-topic-measurements-method08'/n)==sha(r/'.artifacts/p05-topic-measurements-method08'/n)
x=json.loads((r/'.artifacts/p05-resume-r100-method07-root-ack01.json').read_text(encoding='utf-8'))
x.update({'candidate_revision':p['candidate_revision'],'preparation_sha256':sha(prep_path),'image':p['image'],'independent_review_index':str(method),'independent_review_index_sha256':sha(method),'independent_image_review_index':str(image_review),'independent_image_review_index_sha256':sha(image_review),'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_scope':'EXACT_RESTORED_HISTORICAL1274_NOT_CURRENT_LIVE_TREE','expected_terminal_transport':'BOUNDED_STDOUT_AFTER_SUPERVISOR_V1','external_terminal_verifier_mandatory':True})
out=r/'.artifacts/p05-recovery-method08-root-ack01.json';assert not out.exists();out.write_text(json.dumps(x,indent=2)+'\n',encoding='utf-8',newline='\n');print(json.dumps({'ack_sha256':sha(out),'prepared':str(prep_path),'status':x['status']}))
