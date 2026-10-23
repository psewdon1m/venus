from pathlib import Path
import hashlib,json,subprocess,sys,re,datetime
sys.path.insert(0,'tools')
from stage_inventory import included,identity,inventory
from source_inventory import EXCLUDED
root=Path.cwd();base=root/'.docs/implementation/evidence/standalone/clean-final-01';idx=json.loads((base/'index.json').read_text());sha=idx['source_sha'];expected=idx['source_identity_sha256'];checks={}
for path,meta in idx['files'].items():
 raw=(base/path).read_bytes();assert len(raw)==meta['bytes'] and hashlib.sha256(raw).hexdigest()==meta['sha256'],path
checks['raw_index_all25_sha_and_size']=len(idx['files'])
q=base/'quality';docs=[q/'.artifacts-docker-quality-inputs-before.json',q/'.artifacts-docker-quality-inputs-after.json',base/'mock-entry/source-inputs-before.json',base/'mock-entry/source-inputs-after.json']
maps=[json.loads(path.read_text()) for path in docs];files=maps[0]['files'];assert all(m['files']==files and m['source_identity_sha256']==expected for m in maps);assert identity(files)==expected
checks['all4_maps_same_identity']=expected
tracked=subprocess.check_output(['git','ls-tree','-r','--name-only','-z',sha]).decode().rstrip('\0').split('\0')
def keep(path):
 p=Path(path);name=p.name
 return included(path) and not any(part in EXCLUDED for part in p.parts[:-1]) and not path.startswith('.history/example/') and not name.endswith(('.pyc','.tsbuildinfo','.log')) and name!='.env' and not(name.startswith('.env.') and name!='.env.example')
tracked={p for p in tracked if keep(p)};assert tracked==set(files)
raw=subprocess.check_output(['git','cat-file','--batch'],input=''.join(sha+':'+path+'\n' for path in files).encode());offset=0
for path,h in files.items():
 end=raw.index(b'\n',offset);header=raw[offset:end].split();assert header[1]==b'blob';size=int(header[2]);payload=raw[end+1:end+1+size];assert hashlib.sha256(payload).hexdigest()==h,path;offset=end+size+2
assert offset==len(raw);assert inventory()==files;checks['complete_git_included_blob_map_count']=len(files);checks['current_included_bytes_match_tested_commit']=True
outer=json.loads((q/'report.json').read_text());inner=json.loads((q/'.artifacts-docker-quality-run.json').read_text());pilot=json.loads((base/'mock-entry/report.json').read_text())
for d in [outer,inner,pilot]:assert d['status']=='PASS' and d['source_sha']==sha and d['source_sha_after']==sha and d['source_dirty'] is False and d['source_dirty_after'] is False
assert outer['actual_exit_code']==inner['actual_exit_code']==0 and outer['cleanup']=='completed' and outer['cleanup_errors']==[]
assert inner['source_unchanged'] and pilot['source_unchanged'] and pilot['cleanup']=='completed' and pilot['cleanup_errors']==[]
assert len(pilot['checks'])==9 and all(c['status']=='PASS' for c in pilot['checks']);checks['clean_source_actual_exit_and_9pilot_checks']='PASS'
cat=json.loads((q/'.artifacts-catalog-r2-check-run.json').read_text());assert cat['status']=='PASS' and len(cat['commands'])==3 and all(c['exit_code']==0 and c['signal'] is None and c['error_code'] is None for c in cat['commands'])
for path,h in cat['files'].items():assert hashlib.sha256((q/('.artifacts-catalog-r2-check-'+path.replace('/','-'))).read_bytes()).hexdigest()==h,path
schema=json.loads((q/'.artifacts-catalog-r2-check-schema.json').read_text());tests=json.loads((q/'.artifacts-catalog-r2-check-content-history-tests.json').read_text());assert schema['status']=='PASS' and schema['parsed_cards']==450 and schema['errors']==[]
assert tests['status']=='PASS' and tests['tests_run']==14 and tests['failures']==tests['errors']==0 and tests['skipped']==[] and tests['human_approval'] is False
manifest=json.loads((q/'.artifacts-catalog-r2-check-full-check-manifest.json').read_text());ci=json.loads((q/'.artifacts-catalog-r2-check-full-check-input-index.json').read_text());assert manifest['total_cards']==450 and manifest['reviewed_cards']==0 and ci['source_sha']==sha and ci['source_dirty'] is False and ci['snapshot_directory_unchanged'] and len(ci['files'])==450
for path,h in ci['files'].items():assert files[path]==h,path
checks['catalog_hash_binding_and_14checks']='PASS';checks['pack_digest']='sha256:'+manifest['canonical_payload_sha256'];summary=[]
for name in ['coverage','coverage-private-chat']:
 c=json.loads((q/f'.artifacts-catalog-r2-check-full-check-{name}.json').read_text());assert c['pack_digest']==checks['pack_digest'] and len(c['cells'])==5880 and c['private_coverage']==c['neutral20']=='PASS' and c['private_budget_rounds']==100
 neutral=[r for r in c['sessions'] if r['profile']=='neutral_C0_F'];assert len(neutral)==4200 and all(r['status']=='PASS' for r in neutral) and {r['rounds'] for r in neutral}==set(range(1,101))
 summary.append({'name':name,'cells':len(c['cells']),'neutral_sessions':len(neutral),'private_sessions':len(c['private_sessions']),'private_budget_rounds':c['private_budget_rounds'],'private_statuses':{status:sum(r['status']==status for r in c['private_sessions']) for status in sorted({r['status'] for r in c['private_sessions']})}})
checks['C2']=summary
log=re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',(q/'quality.txt').read_text());assert '57 passed (57)' in log and 'Ran 117 tests' in log and 'Ran 14 tests' in log and 'PASS: schema, locale, type and unit corruption rejected' in log
checks['quality_log_57JS_117Python_14catalog_4negative']='PASS';cleanup=[]
for cmd in [['docker','container','inspect',outer['container']],['docker','volume','inspect',outer['volume']],['docker','container','ls','-aq','--filter','label=com.docker.compose.project=venus-pilot-46489f420652'],['docker','volume','ls','-q','--filter','label=com.docker.compose.project=venus-pilot-46489f420652'],['docker','network','ls','-q','--filter','label=com.docker.compose.project=venus-pilot-46489f420652']]:
 result=subprocess.run(cmd,capture_output=True,text=True);absent=(result.returncode!=0 and ('No such container' in result.stderr or 'no such volume' in result.stderr)) if 'inspect' in cmd else result.returncode==0 and not result.stdout.strip();assert absent;cleanup.append({'command':cmd,'actual_exit_code':result.returncode,'stdout':result.stdout,'stderr':result.stderr,'owned_resource_absent':True})
checks['owned_cleanup_independently_confirmed']=cleanup
images=[]
for image in [outer['image_id'],pilot['image_id']]:
 d=json.loads(subprocess.check_output(['docker','image','inspect',image]))[0];assert d['Architecture']=='amd64' and d['Os']=='linux' and d['Config']['User']=='1000:1000';images.append({'image_id':d['Id'],'os':d['Os'],'architecture':d['Architecture'],'user':d['Config']['User']})
checks['retained_exact_images']=images
result={'scope':'Independent exact clean source/evidence implementation verification; no stage/human acceptance','status':'PASS','time_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_sha':sha,'source_identity_sha256':expected,'checks':checks}
Path('.artifacts/review-standalone-gate/final-proof-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
