from pathlib import Path
import json,hashlib,collections,datetime
r=Path('C:/.projects/venus');o=Path(__file__).parent;s=r/'.artifacts/p05-pilot-bundle-source15';p=s/'.artifacts/p05/venus-topic-browser-de47e0967e4c';pins={}
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};return b
def js(p):return json.loads(read(p))
sha=lambda b:hashlib.sha256(b).hexdigest()
ack=js(r/'.artifacts/p05-browser25-a18-root-ack01.json');exit=js(r/'.artifacts/p05-browser25-a18-run01.exit.json');runner=js(p/'runner.json');report=js(p/'topic-browser-report.json');failure=js(p/'failure-details.json');delivery=js(p/'delivery-metadata.json')
assert exit['exit_code']==1 and runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['source_and_producer_unchanged']
assert collections.Counter(x['status'] for x in report['records'])=={'PASS':11,'FAIL':1,'NOT_RUN':4}
assert report['records'][11]['elapsed_ms']==19796 and report['failure']['phase']=='native-elapsed-wall-rollback'
assert report['failure']['message'].startswith('Authenticated read failed: current 429')
assert 'seekPrivate' in report['failure']['stack'] and failure['actual_fixture']['round_index']==9 and failure['actual_fixture']['game_rev']==18
assert failure['actual_fixture']['round_state']=='pending' and failure['actual_fixture']['interaction']=='pair_public'
assert not report['page_errors'] and not failure['diagnostic_errors'] and delivery['diagnostic_errors']==0
assert len(delivery['http'])==1024 and delivery['overflow']['http']==566
assert all(x.get('status')==200 for x in delivery['http'])
assert not any(x.get('status')==429 for x in report['request_metadata'])
phase=[x for x in report['request_metadata'] if x['phase']=='native-elapsed-wall-rollback']
assert sum(x['path'].endswith('/round/advance') for x in phase)==8
assert sum(x.get('kind')=='skip' for x in phase)==8
assert report['mutation_dispatches'][-1]['control']=='game-next' and report['mutation_dispatches'][-1]['response_status']==200
before=js(p/'inputs-before.json');after=js(p/'inputs-after.json');assert before==after and len(before['files'])==1872
assert before['source_identity_sha256']==ack['source_identity']==runner['source_identity']==runner['source_identity_after']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'
for file,pin in before['files'].items():assert sha((s/file).read_bytes())==pin,file
runtime=js(p/'producer-pins.json');assert runtime==ack['runtime_pins'] and len(runtime)==9
for n,h in runtime.items():
 b=read(p/'producer'/n);assert sha(b)==h and b==read(r/'.artifacts/p05-private-batch-browser-producer25'/n)
digest=sha(('\n'.join(n+' '+h for n,h in sorted(runtime.items()))+'\n').encode());assert digest=='f1be316048622bdd55c4a5e3a4e0ce381303dc902ea6678c4154f67ab5a7e658'
for key,hkey in [('independent_review_index','independent_review_index_sha256'),('rebinding_review_index','rebinding_review_index_sha256'),('image_receipt','image_receipt_sha256')]:assert sha(read(Path(ack[key])))==ack[hkey]
assert ack['independent_review_index_sha256']=='ea2bace0b98a3908cdd383d730eabde358b2aefad2e6263054bab10a88b91dfd'
assert sha(read(r/'.artifacts/p05-browser25-a18-run01.mjs'))==ack['runner_sha256']
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:assert not read(p/n).strip()
for n in ['browser-tests.txt','compose-cleanup.txt','fixture-diff.json','image-id.txt']:read(p/n)
for n in ['AGENTS.md','.artifacts/p05-browser25-a18-run01.txt','.docs/implementation/reviews/p05/a18-browser24-failure-diagnosis-independent-round01/INDEX.json']:read(r/n)
for n in ['apps/api/src/rooms.ts','apps/api/src/room-routes.ts','apps/api/src/topic-game-routes.ts','apps/api/src/topic-games.ts','apps/api/src/topic-game-model.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/game-operations.ts','apps/web/src/main.tsx','packages/contracts/src/generated.ts','tests/p05-topic-lifecycle/harness.mjs']:read(s/n)
period=[x for x in delivery['http'] if 196000<=x['started_native_ms']<256000];counts=collections.Counter((x['locale'],x['route']['kind']) for x in period)
lasttimes=[]
for x in delivery['http']:
 own=x.get('bundle',{}).get('own',x.get('dto')or{});t=own.get('server_time')
 if t:
  ms=datetime.datetime.fromisoformat(t.replace('Z','+00:00')).timestamp()*1000;lasttimes.append({'locale':x['locale'],'route':x['route']['kind'],'native_ms':x['started_native_ms'],'server_ms':ms,'server_window':int(ms//60000)})
checks={'audit_exit':0,'actual_counts':{'PASS':11,'FAIL':1,'NOT_RUN':4},'exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','source_files_verified':1872,'runtime_modules_verified':9,'runtime_digest':digest,'page_errors':0,'observer_errors':0,'case12_phase_duration_ms':19796,'case12_advance_receipts':8,'case12_skip_receipts':8,'source_required_coherentGame_attempts_at_least':17,'page_http_retained':1024,'page_http_evicted':566,'page_http_statuses':dict(collections.Counter(x.get('status') for x in delivery['http'])),'sample_native_ms':[196000,256000],'sample_is_rate_window':False,'sample_page_game_GET_counts':[{'locale':a,'route':b,'count':n} for (a,b),n in sorted(counts.items())],'last_known_server_times':lasttimes[-6:],'actual_helper_sample_count':'UNKNOWN_NOT_EXPORTED','actual429_body_headers_limiter_count':'UNKNOWN_NOT_EXPORTED','wall_rollback_executed_before_failure':False,'APP_runaway_loop_established':False,'new_method_implemented_or_accepted':False,'native_actions':0}
(o/'CHECKS.json').write_text(json.dumps(checks,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print(json.dumps(checks))
