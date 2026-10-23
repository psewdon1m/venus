from pathlib import Path
import json,hashlib,datetime,collections
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
N=R/'.artifacts/p05/venus-topic-browser-e32f352c20df';P=R/'.artifacts/p05-private-batch-browser-producer23'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(v,label):
 if not v:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,want):
 need(sha(p)==want,'index '+str(p));pin(p);d=load(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**({'sha256':v}if isinstance(v,str)else v)}for n,v in files.items()]
 for v in files:
  q=p.parent/v['path'];need(sha(q)==v['sha256'],'index child '+str(q))
  if 'bytes'in v:need(q.stat().st_size==v['bytes'],'child size')
 return len(files)
ackpath=R/'.artifacts/p05-browser23-a15-root-ack01.json';need(sha(ackpath)=='18cfec9783187c626ed5923d5b7d27b9f5d2400810a9b42cdf028077dafc18ba','ACK')
ack=load(ackpath);pin(ackpath);need(ack['status']=='ROOT_RUN_ACK','authority')
need(sha(R/'.artifacts/p05-browser23-a15-run01.mjs')==ack['runner_sha256'],'runner pin');pin(R/'.artifacts/p05-browser23-a15-run01.mjs')
reviews={}
for pathkey,pinkey in [('independent_review_index','independent_review_index_sha256'),('rebinding_review_index','rebinding_review_index_sha256'),('application_review_index','application_review_index_sha256')]:
 p=Path(ack[pathkey]);reviews[p.relative_to(R).as_posix()]=index(p,ack[pinkey])
for n,h in ack['application_reviews'].items():
 p=Path(n);reviews[p.relative_to(R).as_posix()]=index(p,h)
receipt=Path(ack['image_receipt']);need(sha(receipt)==ack['image_receipt_sha256'],'image receipt');pin(receipt)
freeze=load(R/'.artifacts/p05-pilot-bundle-source-freeze12.json');pin(R/'.artifacts/p05-pilot-bundle-source-freeze12.json')
before=load(N/'inputs-before.json');after=load(N/'inputs-after.json')
need(before==after,'beforeafter exact');need(before['files']==freeze['files']and len(before['files'])==1869,'native exact inventory')
need(before['source_identity_sha256']==ack['source_identity']==freeze['identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','source identity')
for n,h in before['files'].items():need(sha(R/n)==sha(R/'.artifacts/p05-pilot-bundle-source12'/n)==h,'source '+n)
pins=load(N/'producer-pins.json');need(pins==ack['runtime_pins']and len(pins)==9,'producer9 exact ACK')
for n,h in pins.items():need(sha(P/n)==sha(N/'producer'/n)==h,'producer runtime '+n)
runner=load(N/'runner.json');d=load(N/'topic-browser-report.json');m=load(N/'delivery-metadata.json')
need(runner['status']==runner['cleanup']=='PASS'and runner['error']is None and runner['source_and_producer_unchanged']is True,'outerPASS')
need(runner['source_identity']==runner['source_identity_after']==ack['source_identity'],'native runner identity')
need(runner['image']==ack['image']==load(receipt)['image']=='sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689','image')
need((N/'image-id.txt').read_text().strip()==ack['image'],'actual inspected image')
need(d['status']==d['cleanup']=='PASS'and d['engine']==runner['engine']=='chromium','browser PASS')
need(len(d['records'])==16 and [v['id']for v in d['records']]==['P05-TB-'+str(i).zfill(2)for i in range(1,17)]and all(v['status']=='PASS'for v in d['records']),'fixed16')
need(d['page_errors']==[]and not d.get('page_errors_overflow')and not d.get('request_metadata_overflow'),'no page/request truncation')
need(len(d['request_metadata'])==360<=2048 and len(d['mutation_dispatches'])==307<=2048,'request caps')
need(all(v['result']=='EXACT_RECEIPT_VERIFIED'and v['response_status']==200 for v in d['mutation_dispatches']),'307 exact mutation receipts')
need(m['status']==d['delivery_diagnostics']['status']=='COMPLETE'and m['observer_truncated']is False,'complete diagnostics')
need(m['pending']==m['diagnostic_errors']==m['native_body_cancellations']==m['cancelled_observers']==m['unknown_ws_types']==0,'no pending/error/cancel/unknownWS')
need(all(v==0 for v in m['failure_counts'].values()),'failure counts0')
need(m['overflow']['observer_work']==m['overflow']['conversation']==0,'work/correlation overflow0')
need(len(m['http'])==1024 and len(m['ws'])==256 and m['limits']=={'http':1024,'ws':256,'pending':32,'conversation_per_actor':32},'fixed diagnostic rings')
need(m['overflow']['http']==2099 and m['overflow']['ws']==1908,'history ring evictions retained')
need(d['delivery_diagnostics']['overflow']==m['overflow']and d['delivery_diagnostics']['failure_counts']==m['failure_counts'],'summary metadata exact')
private=d['private_preparation'];need(len(private)==112 and all(v['status']=='READY'for v in private),'private preparation112')
for v in private:
 for k in ['snapshot','last_snapshot']:
  s=v[k];need(s['ready']and s['complete']and not s['observer_overflow']and s['body_errors']==0 and s['observer_model_only']and s['cache_accept_observed']is False,'private model snapshot '+k)
for v in d['mutation_dispatches']:
 s=v.get('readiness')
 if s:need(s['complete']and s['ready']and not s['observer_overflow']and s['body_errors']==0 and v['request_observed_monotonic_ms']<s['deadline_monotonic_ms'],'actual mutation finite readiness')
need(len(d['topic_preparation_phases'])==39 and all(v['status']=='READY'for v in d['topic_preparation_phases']),'topic phases')
need(len(d['topic_readiness'])==50 and all(v['result']=='READY'for v in d['topic_readiness']),'readiness50')
need(len(d['action_preparation_phases'])==5 and all(v['status']=='READY'for v in d['action_preparation_phases']),'action phases5')
need(len(d['advice_mutation_receipts'])==5 and all(v['expected_tuple_verified']for v in d['advice_mutation_receipts']),'advice5')
v=d['records'][14]['detail'];need(v=={'other_question_exclude_actual_ui':True,'durable_own_exclusion':True,'peer_settings_unchanged':True},'case15 actual')
fixture=load(N/'fixture-diff.json');need(d['fixture']==fixture,'fixture descriptor')
need(sha(N/'harness-original.mjs')==fixture['original_sha256']and sha(N/'harness-derivative.mjs')==fixture['derivative_sha256'],'harness pins')
raw=(N/'harness-original.mjs').read_text()
for v in fixture['exact_semantic_replacements']:
 need(raw.count(v['before'])==1,'unique harness replacement');raw=raw.replace(v['before'],v['after'])
need(raw==(N/'harness-derivative.mjs').read_text(),'exact two harness adaptations')
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:need((N/n).read_bytes()==b'','owned resources empty')
need((R/'.artifacts/p05-browser23-a15-run01-exit.txt').read_text().strip()=='0','root exit0')
need(d['synthetic_fixture_only']and not d['production_approval']and not d['real_devices']and not d['full_matrix'],'scope restrictions')
for p in N.rglob('*'):
 if p.is_file():pin(p)
for n in ['.artifacts/p05-browser23-a15-run01.txt','.artifacts/p05-browser23-a15-run01-exit.txt']:pin(R/n)
out={'status':'PASS_ACTUAL_A15_CHROMIUM16_SYNTHETIC_FUNCTIONAL_NOT_STAGE','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':ack['source_identity'],'image':ack['image'],'engine':'chromium','records':16,'case15_actual_PASS':True,
 'requests':360,'exact_mutation_receipts':307,'private_preparations_READY':112,'topic_phases_READY':39,'topic_readiness_READY':50,'action_phases_READY':5,
 'diagnostics':{'status':'COMPLETE','errors':0,'pending':0,'native_body_cancellations':0,'cancelled_observers':0,'unknown_ws_types':0,'work_overflow':0,'conversation_overflow':0,'history_ring_evictions':m['overflow']},
 'source_files_exact':1869,'runtime_producer_files_exact':9,'review_index_children_verified':reviews,'cleanup':'PASS_EMPTY_OWNED_SAVED_RECEIPTS','no_native_rerun':True,'full_stage_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out))
