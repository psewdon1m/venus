import json, hashlib, pathlib, collections, datetime
ROOT=pathlib.Path('C:/.projects/venus')
OUT=pathlib.Path(__file__).parent
S=ROOT/'.artifacts/p05-pilot-bundle-source15'
R=S/'.artifacts/p05/venus-topic-browser-5de54fa63bc8'
OLD=ROOT/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-topic-browser-4db308580d32'
pins={}
def read(p):
 b=p.read_bytes();pins[p.relative_to(ROOT).as_posix()]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};return b
def js(p):return json.loads(read(p))
before=js(R/'inputs-before.json');after=js(R/'inputs-after.json')
assert before==after
assert before['source_identity_sha256']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'
assert len(before['files'])==1872
for path,pin in before['files'].items(): assert hashlib.sha256((S/path).read_bytes()).hexdigest()==pin,path
producer=js(R/'producer-pins.json');ack=js(ROOT/'.artifacts/p05-browser24-a18-root-ack01.json')
assert len(producer)==9 and producer==ack['runtime_pins']
for name,pin in producer.items():
 b=read(R/'producer'/name);assert hashlib.sha256(b).hexdigest()==pin
 assert b==read(OLD/'producer'/name)==read(ROOT/'.artifacts/p05-private-batch-browser-producer24'/name)
for key,hashkey in [('independent_review_index','independent_review_index_sha256'),('rebinding_review_index','rebinding_review_index_sha256'),('image_receipt','image_receipt_sha256')]:
 p=pathlib.Path(ack[key]);assert hashlib.sha256(read(p)).hexdigest()==ack[hashkey]
runner=js(R/'runner.json');report=js(R/'topic-browser-report.json');failure=js(R/'failure-details.json');delivery=js(R/'delivery-metadata.json')
exit=js(ROOT/'.artifacts/p05-browser24-a18-run01.exit.json');oldexit=js(ROOT/'.artifacts/p05-browser24-a17-run01.exit.json');oldrunner=js(OLD/'runner.json');oldreport=js(OLD/'topic-browser-report.json')
assert exit['exit_code']==1 and oldexit['exit_code']==0
assert runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['source_and_producer_unchanged']
assert runner['source_identity']==runner['source_identity_after']==ack['source_identity']
assert runner['image']==ack['image']
assert collections.Counter(x['status'] for x in report['records'])=={'PASS':13,'FAIL':1,'NOT_RUN':2}
assert oldrunner['status']=='PASS' and all(x['status']=='PASS' for x in oldreport['records']) and len(oldreport['records'])==16
assert report['failure']['message'].startswith('Authenticated read failed: current 429')
assert report['records'][13]['elapsed_ms']==40848 and report['failure']['phase']=='held-response-new-epoch'
assert not report['page_errors'] and delivery['diagnostic_errors']==0
assert len(delivery['http'])==1024 and delivery['overflow']['http']==1419
assert not any(x.get('status')==429 for x in delivery['http'])
assert not any(x.get('status')==429 for x in report['request_metadata'])
for file in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:
 assert not read(R/file).strip()
for file in ['browser-tests.txt','compose-cleanup.txt','fixture-diff.json','image-id.txt']:
 read(R/file)
for file in ['AGENTS.md','.artifacts/p05-browser24-a18-run01.mjs','.artifacts/p05-browser24-a18-run01.txt','.artifacts/p05-browser24-a17-run01.txt']:
 read(ROOT/file)
sources=['apps/api/src/rooms.ts','apps/api/src/room-routes.ts','apps/api/src/topic-game-routes.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/game-operations.ts','apps/web/src/main.tsx','apps/web/src/api.ts','apps/web/src/room-shell.tsx','tests/p05-topic-lifecycle/harness.mjs']
for f in sources:read(S/f)
api=[k for k in before['files'] if k.startswith('apps/api/')]
for path in api:assert read(S/path)==read(ROOT/'.artifacts/p05-pilot-bundle-source14'/path),path
http=delivery['http'];period=[x for x in http if 322000<=x['started_native_ms']<381000]
counts=collections.Counter((x['locale'],x['route']['kind']) for x in period)
out={'audit_exit':0,'frozen_source_files_verified':1872,'producer_modules_exact_A17_and_working':9,'API_files_byte_exact_A17':len(api),'actual_counts':dict(collections.Counter(x['status'] for x in report['records'])),'actual_exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','case14_elapsed_ms':40848,'page_errors':0,'observer_errors':0,'page_http_retained':1024,'page_http_evicted':1419,'page_http_statuses':dict(collections.Counter(x.get('status') for x in http)),'429_page_rows':0,'direct_context_read_observed_status':429,'429_body_headers_bucket_counter':'NOT_EXPORTED','sample_interval_native_ms':[322000,381000],'sample_interval_is_limiter_window':False,'page_request_counts_in_sample':[{'locale':a,'route':b,'count':n} for (a,b),n in sorted(counts.items())],'sample_RU_page_GET_total':sum(n for (a,b),n in counts.items() if a=='ru'),'context_API_reads_in_sample':'UNKNOWN_NOT_OBSERVED_BY_PAGE_EVENTS','actual_APP_feedback_loop':'NOT_ESTABLISHED','actual_precise_rate_bucket_attribution':'UNKNOWN','A17_historical_counts':dict(collections.Counter(x['status'] for x in oldreport['records'])),'native_queries':0,'changes_to_APP_method_producer_ACK':0}
(OUT/'CHECKS.json').write_text(json.dumps(out,indent=2)+'\n')
(OUT/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n')
print(json.dumps(out,indent=2))
