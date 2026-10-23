"""Read saved actual C2 outputs; no Docker or product requests."""
from pathlib import Path
import json,hashlib,itertools,collections,datetime,sys,ast
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[5];sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
OUT=Path(__file__).parent
PACK=ROOT/'.docs/implementation/evidence/p04/final-coverage-docker-20261020-round02'
RAW=ROOT/'.artifacts/p04-final-coverage02'
CARDS=ROOT/'.docs/implementation/evidence/p04/review470-r4/candidate/cards'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
expected_index='722d8a4856318ca0d6215e8eb5b8fbd2e707bb552a1d0698afae4dcb84df1776'
assert sha(PACK/'INDEX.json')==expected_index
index=load(PACK/'INDEX.json');assert len(index['files'])==10
for x in index['files']:assert (PACK/x['path']).stat().st_size==x['bytes'] and sha(PACK/x['path'])==x['sha256']
raw_names=['analysis.json','coverage.json','coverage-private-chat.json','receipt.json','stdout.txt','stderr.txt','command.mjs']
for n in raw_names:assert (PACK/n).read_bytes()==(RAW/n).read_bytes()
receipt=load(PACK/'receipt.json');record=load(PACK/'RECORD.json')
assert receipt['exit_code']==record['actual_Docker_exit_code']==0
assert receipt['image']=='sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5'
assert receipt['container_cleanup']==record['container_cleanup']=='completed'
assert receipt['input_unchanged'] and not any(receipt[x] for x in ['human_approval','runtime_activation','full_stage_pass'])
assert (PACK/'stderr.txt').read_bytes()==b''
actual_cards={p.name:sha(p) for p in sorted(CARDS.glob('*.json'))};assert len(actual_cards)==470 and receipt['input_raw_sha256']==actual_cards
frozen=load(ROOT/'.docs/implementation/evidence/p04/review470-r4/current-input-freeze.json');assert {Path(x['path']).name:x['sha256'] for x in frozen['card_files']}==actual_cards
cards=[load(CARDS/n) for n in sorted(actual_cards)]
catalog=digest([{'id':c['id'],'revision':c['revision'],'sha256':digest(c)} for c in cards]);assert catalog==receipt['catalog_digest']==record['digest']=='dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270'
stdout=json.loads((PACK/'stdout.txt').read_text(encoding='utf-8'));assert stdout['cards']==470 and stdout['digest']==catalog and stdout['status']=='DRAFT_COVERAGE_COMPUTED_NOT_RELEASE_APPROVAL'
analysis=load(PACK/'analysis.json');assert analysis['catalog_digest']==catalog and analysis['exact_duplicates']==0 and analysis['similarity_queue']==[]
assert analysis['manifest']['status']=='illustrative_draft_candidate' and analysis['manifest']['total_cards']==470
# Exact executed inline script is recoverable without executing producer Python.
tree=ast.parse((PACK/'producer.py').read_text(encoding='utf-8'))
script=[n.value.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='script' for t in n.targets)][0]
assert script.encode()==(PACK/'command.mjs').read_bytes()
producer=(PACK/'producer.py').read_text(encoding='utf-8')
for required in ["'--rm'","'--network','none'","'--read-only'","'--user','1000:1000'","'--memory','1536m'","'--cpus','1'","'--pids-limit','64'",'after==before',"label=venus.p04.final=20261020-02"]:assert required in producer
modes=['questions','truth_or_dare','yes_but'];contexts=['online','in_person'];sizes=list(range(2,9));classes=['X','J','F','G','M','S','R'];normalclasses=['F','G','M','S','R']
expected_cells=set(itertools.product(modes,contexts,sizes,range(1,5),range(5),classes))
expected_neutral=set(itertools.product(modes,contexts,sizes,range(1,101)))
expected_private=set(itertools.product(modes,contexts,sizes,[1,4],normalclasses))
summary=[]
for name,on in [('coverage.json',False),('coverage-private-chat.json',True)]:
 r=load(PACK/name)
 assert r['protocol']=='P04-C2' and r['synthetic'] and r['capabilities']==(['private_text_chat'] if on else [])
 assert r['pack_digest']=='sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4'
 assert r['neutral20']==r['private_coverage']=='PASS' and r['private_baseline_required']==25 and r['private_budget_rounds']==100
 ck=lambda x:(x['mode'],x['context'],x['size'],x['stage'],x['comfort'],x['resolved_class'])
 assert len(r['cells'])==5880 and {ck(x) for x in r['cells']}==expected_cells
 status=collections.Counter(x['private_profile_status'] for x in r['cells'])
 expected_status={'RULE_EXCLUDED_STAGE':2940,'RULE_EXCLUDED_COMFORT':588,'RULE_EXCLUDED_CLASS':672,('SUPPORTED' if on else 'CAPABILITY_UNAVAILABLE'):1680};assert dict(status)==expected_status
 for c in r['cells']:
  if c['stage']<3:expected='RULE_EXCLUDED_STAGE'
  elif c['comfort']==0:expected='RULE_EXCLUDED_COMFORT'
  elif c['resolved_class'] in ['X','J']:expected='RULE_EXCLUDED_CLASS'
  else:expected='SUPPORTED' if on else 'CAPABILITY_UNAVAILABLE'
  assert c['private_profile_status']==expected
  if expected=='SUPPORTED':assert c['private_baseline_card_count']=={'questions':47,'truth_or_dare':50,'yes_but':46}[c['mode']]
  if not on:assert c['by_interaction']['pair_private']==0 and c['private_baseline_card_count']==0
 neutral=[x for x in r['sessions'] if x['profile']=='neutral_C0_F'];veto=[x for x in r['sessions'] if x['profile']=='all_X']
 assert len(r['sessions'])==4214 and len(neutral)==4200 and {(x['mode'],x['context'],x['size'],x['rounds']) for x in neutral}==expected_neutral
 assert all(x['status']=='PASS' and x['reason'] is None for x in neutral)
 assert len(veto)==14 and {(x['context'],x['size']) for x in veto}==set(itertools.product(contexts,sizes))
 assert all(x['mode']=='yes_but' and x['status']=='EXPECTED_REFUSAL' and x['rounds']==20 and x['reason']=='INSUFFICIENT_SAFE_CARDS' for x in veto)
 private=r['private_sessions'];assert len(private)==420 and {(x['mode'],x['context'],x['size'],x['comfort'],x['resolved_class']) for x in private}==expected_private
 assert all(x['rounds']==100 and x['status']==('PASS' if on else 'CAPABILITY_UNAVAILABLE') and 0<=x['private_rounds']<=25 for x in private)
 if not on:assert all(x['private_rounds']==0 for x in private)
 summary.append({'file':name,'cells':5880,'cell_statuses':dict(status),'neutral_R1_to_R100_PASS':4200,'neutral_R20_PASS':42,'yesbut_allX_EXPECTED_REFUSAL':14,'private_cases':420,'private_status':('PASS' if on else 'CAPABILITY_UNAVAILABLE'),'content_gaps':0})
# Newsource binding is a frozen root build witness, not a second image filesystem extraction.
sourcefreeze=load(ROOT/'.artifacts/p05-unified-source-freeze01.json');assert sourcefreeze['identity']==record['source_identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
assert len(sourcefreeze['files'])==sourcefreeze['included_files']==record['source_file_count']==1819
assert identity(sourcefreeze['files'])==sourcefreeze['identity']
current=inventory(ROOT);same=current==sourcefreeze['files']
coverage_review=load(ROOT/'.docs/implementation/reviews/p04/unified-channel-coverage-review-round01/results.json')
assert sourcefreeze['files']['packages/card-catalog/src/coverage.ts']==coverage_review['pins']['packages/card-catalog/src/coverage.ts']
build=ROOT/'.artifacts/p05-unified-docker-build01.txt';assert receipt['image'].removeprefix('sha256:') in build.read_text(encoding='utf-8')
assert (ROOT/'.artifacts/p05-unified-docker-build01-exit.txt').read_text().strip()=='0'
for filename,path in [('source-build-freeze.json',ROOT/'.artifacts/p05-unified-source-freeze01.json'),('source-build.txt',build),('source-build-exit.txt',ROOT/'.artifacts/p05-unified-docker-build01-exit.txt')]: (OUT/filename).write_bytes(path.read_bytes())
result={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_ACTUAL_LEGACY_P04_C2_DRAFT_ONLY','input_index_sha256':expected_index,'indexed_files_verified':10,'raw_files_exact':raw_names,'actual_container_exit_code':0,'cleanup':'completed_root_receipt_and_checked_wrapper_not_new_Docker_inspection','raw470_current_equals_recorded_before_and_source_freeze':True,'source_identity':sourcefreeze['identity'],'source_files':1819,'current_full_included_map_equal_at_audit':same,'current_identity_at_audit':identity(current),'image':receipt['image'],'image_binding':'FROZEN_ROOT_BUILD_WITNESS_NO_SECOND_IMAGE_EXTRACTION','profiles':summary,'human_approval':False,'runtime_activation':False,'V2_semantic_C2':False,'full_P04_PASS':False,'full_P05_PASS':False,'Docker_commands':0}
(OUT/'audit-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2))
