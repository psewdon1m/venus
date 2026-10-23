from pathlib import Path
import hashlib,json,sys
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/topic-browser-method24-author-round01'
sha=lambda b:hashlib.sha256(b).hexdigest();pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())};read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
assert sha((A/'INDEX.json').read_bytes())=='98f0b021ad18c0d90873432e2a2a304a7d164c0e30dba4d36e6a3a0d1bd98c42'
i=read(A/'INDEX.json');assert len(i['files'])==31
for row in i['files']:assert pin(A/row['path'])=={k:row[k] for k in ['bytes','sha256']},row['path']
h=read(A/'HANDOFF.json');new=R/'.artifacts/p05-private-batch-browser-producer24';old=R/'.artifacts/p05-private-batch-browser-producer23'
assert sorted(p.name for p in new.glob('*.mjs'))==sorted(h['runtime_pins']) and len(h['runtime_pins'])==9
for n,v in h['runtime_pins'].items():
 assert sha((new/n).read_bytes())==v and (new/n).read_bytes()==(A/'runtime'/n).read_bytes()
 if n!='browser.mjs':assert (new/n).read_bytes()==(old/n).read_bytes()
digest=sha(('\n'.join(n+' '+v for n,v in sorted(h['runtime_pins'].items()))+'\n').encode())
assert digest==h['runtime_digest']=='4531f07ba506ba0bc4e248fdb1eadf6f2552764322f2b9221bdc47539e59d212'
b=(old/'browser.mjs').read_bytes();c=(new/'browser.mjs').read_bytes();start=b.index(b' await check(9,');end=b.index(b' await check(10,',start);ns=c.index(b' await check(9,');ne=c.index(b' await check(10,',ns)
assert b[:start]==c[:ns] and b[end:]==c[ne:]
wrapper=R/'.artifacts/p05-browser24-a17-run01.mjs';pending=R/'.artifacts/p05-browser24-a17-root-ack01.pending.json'
assert sha(wrapper.read_bytes())=='59fb691af0d8fc83beaf98f9667eb0fd5d41cbab13f532c4da4a6cdee8ff0205'
assert sha(pending.read_bytes())=='9396d5d87649f509b81209e8ef3f0b2d501bb8ee110d3c7aa0550fa680c56063'
parentwrapper=(R/'.artifacts/p05-browser23-a17-run01.mjs').read_bytes();transformed=parentwrapper
for x,y in [(b'p05-private-batch-browser-producer23',b'p05-private-batch-browser-producer24'),(b'p05-browser23-a17-root-ack01.json',b'p05-browser24-a17-root-ack01.json')]:assert transformed.count(x)==1;transformed=transformed.replace(x,y)
assert transformed==wrapper.read_bytes()
ack=read(pending);previous=read(R/'.artifacts/p05-browser23-a17-root-ack01.pending.json')
changed=sorted(k for k in ack.keys()|previous.keys() if ack.get(k)!=previous.get(k))
assert set(changed)<={'runner_sha256','runtime_pins','independent_review_index','independent_review_index_sha256','scope','rebinding_review_index','rebinding_review_index_sha256','method_author_index_sha256'}
assert ack['status']=='NOT_AUTHORIZED' and ack['issued_at'] is None and ack['independent_review_index_sha256'] is None
assert ack['runtime_pins']==h['runtime_pins'] and ack['runner_sha256']==sha(wrapper.read_bytes())
assert ack['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d' and ack['source_files']==1871
assert ack['image']=='sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2'
assert ack['rebinding_review_index_sha256']=='8810dede69eaf9fcea3eddfe6d0d0c11e1deaef86d83f73de992bb142d39b3c0'
for field in ['rebinding_review_index','image_receipt','application_review_index']:assert sha(Path(ack[field]).read_bytes())==ack[field+'_sha256']
for path,v in ack['application_reviews'].items():assert sha(Path(path).read_bytes())==v
f=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');sys.path.insert(0,str(R/'tools'));from stage_inventory import inventory
assert inventory(R)==f['files'] and f['identity']==ack['source_identity'] and f['git_source_commit']==ack['clean_source_commit']
assert sha((R/'.docs/implementation/reviews/p05/a17-browser23-failure-diagnosis-independent-round01/INDEX.json').read_bytes())=='5007752aba66494263ae5651aebe4aff26fcfdf8fcd35fd2484b52f5b70fb292'
result={'status':'PASS_METHOD_ONLY','author_children_verified':31,'runtime_count':9,'runtime_pins':h['runtime_pins'],'runtime_digest':digest,'only_case09_changed':True,'all15_other_cases_helpers_and8MJS_exact':True,
 'wrapper':pin(wrapper),'pending_ACK':pin(pending),'wrapper_only_two_literals':True,'pending_ACK_changed_fields':changed,
 'source_identity':ack['source_identity'],'included_files':1871,'image':ack['image'],'source_binding_review_sha256':ack['rebinding_review_index_sha256'],
 'shared_condition_preparation_ms':8000,'pending_not_authorized':True,'original_actual_FAIL':'RETAINED_5007752a','new_native_RUN':False,'APP_edits':False}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:result[k] for k in ['status','author_children_verified','runtime_count','runtime_digest','wrapper_only_two_literals','source_identity','shared_condition_preparation_ms']}))
