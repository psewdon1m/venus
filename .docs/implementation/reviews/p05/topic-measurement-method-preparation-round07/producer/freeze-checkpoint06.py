"""Freeze bounded METHOD06 author bytes; no Docker/prepare/run/selector execution."""
from pathlib import Path
import hashlib,json,sys,datetime
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
base=Path('.artifacts/p05-topic-measurements-method07');old=Path('.docs/implementation/reviews/p05/topic-measurement-method-preparation-round05');review=Path('.docs/implementation/reviews/p05/topic-measurement-method05-independent-review-round01');out=Path('.docs/implementation/reviews/p05/topic-measurement-method-preparation-round06')
sha=lambda b:hashlib.sha256(b).hexdigest()
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,b):
    p=out/p;p.parent.mkdir(parents=True,exist_ok=True);assert not p.exists();p.write_bytes(b)
def put(p,v):write(Path(p),(json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode())
assert not out.exists()
assert sha((old/'INDEX.json').read_bytes())=='f9124f6669057acf18e52ae283f8631fb957200174fa9069a61ef42c27984034'
assert sha((review/'INDEX.json').read_bytes())=='4977fad4adaeaf5298ef6aaaef127fd9e34c4eaef20a53c74ddd602c20e36b86'
for packet in [old,review]:
    for row in load(packet/'INDEX.json')['files']:assert sha((packet/row['path']).read_bytes())==row['sha256']
for row in load(old/'HANDOFF.json')['code']:assert sha(Path(row['original_path']).read_bytes())==row['sha256'],'original05 workspace mutated'
receipt_path=Path('.artifacts/p05-renewal-image-build-receipt01.json');receipt=load(receipt_path)
assert sha(receipt_path.read_bytes())=='2dae88a270c9a9a3fbc33386b09ae98585bebb49d6d26e1a3f6d95c8ddf443e5'
files=inventory();assert identity(files)==receipt['source_identity'];assert len(files)==1813
for p,h in receipt['host_compiled_files_sha256'].items():assert sha(Path(p).read_bytes())==h,p
assert len(receipt['host_compiled_files_sha256'])==64
deps=load(old/'readonly-dependency-pins.json')
for p,h in deps['readonly_producer_fixture'].items():assert sha(Path(p).read_bytes())==h,p
ids=load(base/'id-after.stdout.txt');inert=load(base/'inert-final.stdout.txt');syntax=load(base/'syntax-cold-final.json');reuse=load(base/'windows-output-hash-qualified-reuse.json')
assert ids['status']=='PASS_AUTHOR_FINITE_ONLY' and len(ids['cases'])==8 and ids['malformed_mapping_branches']==7
assert len(inert['controls'])==18 and len(syntax['checks'])==31
for result in [ids,inert]:
    for p,h in result['source'].items():assert sha((base/p).read_bytes())==h,p
for r in syntax['checks']:
    assert r['exit_code']==0
    if 'sha256' in r:assert sha(Path(r['path']).read_bytes())==r['sha256']
for p,h in reuse['source'].items():assert sha((base/p).read_bytes())==h,p
names=[]
for r in load(old/'HANDOFF.json')['code']:
    name=Path(r['original_path']).name;names.append('method06-inert-controls.mjs' if name=='method05-inert-controls.mjs' else name)
names.append('method06-id-controls.mjs');code=[]
for name in sorted(names):
    p=base/name;target=Path('exact-source')/(name+'.bytes');write(target,p.read_bytes());code.append({'original_path':p.as_posix(),'snapshot_path':target.as_posix(),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size})
for name in ['id-before.source.bytes','id-before.stdout.txt','id-before.stderr.txt','id-after.stdout.txt','id-after.stderr.txt','inert-final.stdout.txt','inert-final.stderr.txt','syntax-cold-final.json','exact-diff.json','exact-diff.patch.txt','windows-output-hash-qualified-reuse.json']:write(Path('raw')/name,(base/name).read_bytes())
write(Path('raw/windows27-original05.stdout.txt'),(old/'raw/output-attempt03.stdout.txt').read_bytes())
write(Path('archive-script.py.bytes'),Path(__file__).read_bytes())
put('source-context.json',{'identity':identity(files),'files':files,'image':receipt['image'],'compiled64_verified':True,'native_NOT_RUN':True})
write(Path('reference-build-receipt.json'),receipt_path.read_bytes());write(Path('readonly-dependency-pins.json'),(old/'readonly-dependency-pins.json').read_bytes());write(Path('formal-review05-INDEX.json'),(review/'INDEX.json').read_bytes())
api=load(old/'GUARD_API.json');api['candidate_revision']='METHOD06-CANONICAL-CLEANUP-IDS';api['guard_component_revision_unchanged']='METHOD05-HOST-OUTPUT-FENCES';api['base']=base.as_posix();api['files']={n:sha((base/n).read_bytes()) for n in api['files']};api['cleanupOwned_JS']='async cleanupOwned({docker,owner,image,container,volume,exportVerified,optional now}): total30s; ps -aq --no-trunc returns64lowercasehex IDs, require unique list/exact ordered inspect mapping before owner/image/exact-name validation; no logger API, unverified prefix retains volume; failed/ambiguous mapping returns retained without kill/rm';api['launcher_candidate_authority']='prep.candidate_revision and rootACK.candidate_revision must equal METHOD06-CANONICAL-CLEANUP-IDS; exact new launcher pin and relocated source mapping also reject old prepared inputs. METHOD05 writeguard authority retained intentionally; Python guard/package/allocation bytes unchanged.';put('GUARD_API.json',api)
put('attempt-history.json',{'ID_before':{'exit_code':1,'pass':5,'fail':3,'cleanup_source_sha256':sha((base/'id-before.source.bytes').read_bytes()),'effect':'finite mock predicts ID mismatch, no observed actual Docker resource leak'},'ID_after':{'exit_code':0,'top_level_cases':8,'malformed_mapping_subcases':7,'unchanged_test_program_before_after':True},'supervisor_cleanup_final':{'exit_code':0,'controls':18,'mock_IDs':'realistic64lowercasehex'},'syntax_cold_final':{'exit_code':0,'checks':31},'Windows_output':{'not_reexecuted':True,'27_previous_controls_exact4input_hashes_reused':True},'Docker_calls':0,'prepare_calls':0,'run_calls':0,'selector_invocations':0})
handoff={'schema_version':1,'status':'METHOD06_CANDIDATE_AUTHOR_CONTROLS_PASS_INDEPENDENT_REPEAT_REQUIRED_NOT_RUN','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_NOT_acceptor':True,'candidate_revision':'METHOD06-CANONICAL-CLEANUP-IDS','guard_component_revision_unchanged':'METHOD05-HOST-OUTPUT-FENCES','source_context':{'identity':identity(files),'included_files':1813,'image':receipt['image'],'receipt_sha256':sha(receipt_path.read_bytes()),'64_compiled_match':True,'input_snapshot':'NOT_PREPARED'},'code':code,'formal_finding':{'id':'P05-METHOD05-001','review_INDEX':'4977fad4adaeaf5298ef6aaaef127fd9e34c4eaef20a53c74ddd602c20e36b86','status':'PROSPECTIVE_FIXED_NOT_SELF_ACCEPTED'},'diff_reference':'raw/exact-diff.json and raw/exact-diff.patch.txt','minimal_change':'Canonical full Docker ID enumeration and exact ordered unique mapping. Existing owner/name/image/30s/export-retention/allocation-free cleanup fences preserved. Separate METHOD06 candidate/prep/ACK version and base-path relocation. No hostguard/Python/resource/selector changes.','author_validation':{'new_ID_top_level_cases':8,'malformed_mapping_subcases_inside_case8':7,'source_bound_supervisor_cleanup_rerun':18,'syntax_cold_checks':31,'all_final_exit_codes':0,'Windows_output27':'HASH_QUALIFIED_REUSE_NOT_REEXECUTED','Docker_calls':0,'prepare_calls':0,'run_calls':0,'selector_invocations':0},'GUARD_API':'GUARD_API.json','limits_unchanged':{'owned_cap_MiB':128,'worker_hardwall_ms':300000,'reserve_GiB_each_host_native':10,'worker_CPU':1,'memory_MiB':1536,'literal_descriptor_seed_unchanged':True,'statistical_counts_thresholds_unchanged':True},'immutability_verified':{'original05_all61children':True,'original05_all27workspacecode':True,'formal05_all18children':True,'original61_and_READONLY23pins':True,'included_and64compiled':True},'limitations':['All new controls use injected Docker adapter. No actual Docker cleanup/volume/native failure proof, --prepare, R100 or selector execution.','27Windows results are inherited only for exact unchanged guardPython/package/allocation/test source pins; they are not counted as a fresh run.','METHOD04-001 prospective hostguard fix is independently accepted in formal05 scope. METHOD05-001 independent repeat still required; no self closure or RUN authorization.','Separate real frozen snapshot binding and rootACK required before one bounded operational diagnostic. Full statistical consumers/runtime parity/220m feasibility/450HOLD/P05 remain unaccepted.','OCI512MiB/900s needs versioned adaptation/review; fixed METHOD06 candidate remains128MiB/300s, no generic VHD quota or atomic hostileFS guarantees.'],'statistics_RUN':False,'human450':'HOLD_UNCHANGED','full_P05_PASS':False};put('HANDOFF.json',handoff)
report='''# METHOD06 canonical cleanup IDs — candidate, not RUN

P05-METHOD05-001 has a minimal prospective correction. Cleanup requests `docker ps -aq --no-trunc`, requires unique lowercase64hex IDs, then verifies inspect returns the exact same ordered ID list. Malformed/duplicate/missing/reordered replies and another64hex ID sharing a12char prefix fail before kill/removal. Existing exact owner/image/generated-name checks,30s cleanup deadline, logger-free teardown and unverified-export volume retention remain.

The unchanged new ID-control program records3FAIL/5PASS on the copied METHOD05 cleanup (exit1), then8/8 top-level PASS after correction (exit0). Case8 contains7 explicit mapping-denial branches. Additional18 supervisor/cleanup source-bound controls reran with realistic64hex IDs, and31 syntax/cold checks passed. No Docker call, prepare, run, selector or R100 occurred. This predicts and fixes a representation error; it does not claim an observed Docker leak.

The27 prior realWindows output controls were not rerun. Their four exact source inputs (Python guard, package helper, allocation helper, control program) match old raw pins; the packet preserves an explicit hash-qualified reuse record and original raw. The host-output schema remains METHOD05-HOST-OUTPUT-FENCES deliberately. The outer launcher/preparation/rootACK candidate is separately versioned METHOD06-CANONICAL-CLEANUP-IDS, with exact new launcher binding. GUARD_API documents fresh cleanup pins and this distinction.

Exact content changes and base-path-only relocations are listed in raw/exact-diff.json; readable minimal changes are in raw/exact-diff.patch.txt. Original METHOD05 packet and all27 original workspace code snapshots are verified unchanged, along with formal05 review. Current source1274deb/1813, receipt2dae and64 compiled pins remain unchanged. Limits remain128MiB/300s/10GiB,1CPU/1536MiB, same literal descriptor/seed, no changed statistical counts or thresholds.

The author is not the acceptor. Independent repeat must precede root preparation/binding and a separate diagnostic ACK. Actual native cleanup/runtime proof, full statistics/consumer acceptance, feasibility, human450HOLD and fullP05 remain open. OCI512MiB/900s requires separate explicit adaptation/review.
''';write(Path('REPORT.md'),report.encode())
entries=[]
for p in sorted(out.rglob('*')):
    if p.is_file():entries.append({'path':p.relative_to(out).as_posix(),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size})
put('INDEX.json',{'schema_version':1,'scope':'METHOD06_CANDIDATE_NOT_RUN','files':entries})
for row in entries:assert sha((out/row['path']).read_bytes())==row['sha256']
assert identity(inventory())==receipt['source_identity']
for p,h in receipt['host_compiled_files_sha256'].items():assert sha(Path(p).read_bytes())==h
print(json.dumps({'packet':out.as_posix(),'INDEX_sha256':sha((out/'INDEX.json').read_bytes()),'files':len(entries),'HANDOFF_sha256':sha((out/'HANDOFF.json').read_bytes()),'GUARD_API_sha256':sha((out/'GUARD_API.json').read_bytes()),'cleanup_sha256':api['files']['owned-cleanup.mjs'],'launcher_sha256':api['files']['r100-v3-launcher.mjs'],'NOT_RUN':True},indent=2))
