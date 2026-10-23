from pathlib import Path
import json,hashlib,datetime,shutil,sys
root=Path.cwd();base=root/'.artifacts/p05-storage-candidate-review-round02';p=root/'.artifacts/p05-storage-availability-candidate03';p2=root/'.artifacts/p05-storage-availability-candidate02';out=root/'.docs/implementation/reviews/p05/topic-storage-candidate-round02'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='808ace3c1d4c19c10806aa319db53061bd5667dee6883f0abb7bb1fd6e19983e';assert sha(p2/'HANDOFF.json')=='ba954ca742dacc1f4acbbb489bff1a368d40622577c89093c48dbb2b8d6d9220';h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['files'].items():assert sha(p/n)==v;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
for label,file,load in [('02','test-results.json','loaded-inputs.json'),('03','test-results03.json','loaded-inputs03.json')]:
 r=read(base/file);assert r['numPassedTests']==r['numTotalTests']==81 and r['success'];assert len(read(base/load))>=2
 names=[a['fullName']for t in r['testResults']for a in t['assertionResults']if a['status']=='passed'];assert any('preserves exact DomainError even if it carries errno-like native fields'in n for n in names);assert any('returns503 for a real native missing-file read and does not create it'in n for n in names)
assert len(read(base/'checks.json')['rows'])==11;assert read(base/'finite03.json')['only_two_RU_test_strings_restored']
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811
out.mkdir(parents=True,exist_ok=False);(out/'candidate03').mkdir();(out/'probes').mkdir()
for q in p.iterdir():
 if q.is_file():shutil.copyfile(q,out/'candidate03'/q.name)
shutil.copyfile(p2/'HANDOFF.json',out/'candidate02-HANDOFF.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'SCOPED_STORAGE_CANDIDATE03_PROSPECTIVE_PASS_INTEGRATION_AND_ACTUAL_PENDING','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'AUTHOR_DISJOINT_EXACT_ROOT_CANDIDATE02_03_RECHECK_NOT_INTEGRATED','reviewer':'/root/p05_topics_ui_review','author':'/root','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'findings':[],'closed_candidate_findings':['STORAGE-CANDIDATE-R01-DOMAIN_PRECEDENCE','Incidental two RU test fixture encoding differences in02 restored in03'],'checks':{'own_exacthelper_checks':11,'independent_unique_cache02_tests':81,'independent_unique_cache03_tests':81,'both_new_tests_explicitly_in_fresh_passed_assertion_list':True,'loader_source_test_SHA_hardchecked_and_receipts_retained':True,'source02_03_byte_identical':True,'source01_02_only_guard_added':True,'tests02_03_only_two_RU_fixture_strings_restored':True},'scope_limits':['Known synchronous external private topic storage classes and native errno/syscall only; DomainError-first identity preserved, unknown/parser/programmer errors unchanged. No blanket malformedJSON or otherregistryendpoint acceptance.','Seven synchronous storage wrappers/class behavior from round01 unchanged besides DomainError precedence; no appglobalFSclassification, SQL/auth/enqueue/revoke wrapping, fallback/repair/automaticretry/grant renewal.','Root stale79 preparation evidence remains in02; own unique loaders verify exact inputs and81names, rather than promoting reused79.','Not integrated into included source: new source freeze/image/typecheck/lint/appropriate full tests and independent actual unchanged503 restore remain mandatory.','ActualTG-STORAGE-HTTP-001 is not closed by prospective tests alone; human450/fullP05 notaccepted.'],'failed_attempts':['Own initial Unicode diff print hit cp1252 stdout; reran JSON-escaped diff without source changes.'],'no_included_product_producer_or_Docker_functional_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Scoped storage candidate03 — independent repeat review

**SCOPED_STORAGE_CANDIDATE03_PROSPECTIVE_PASS_INTEGRATION_AND_ACTUAL_PENDING.** The DomainError precedence finding is closed. Eleven own helper checks preserve identity/status400/401/403/409/503 even with errno-like fields, retain unknown errors and sanitize known native/typed storage faults to503.

Candidate02 and03 each independently pass81 tests using separate reviewer cache directories and SHA-pinned absolute source/test loaders. Receipts prove both new tests executed. The source change from01 is exactly the unconditional DomainError-first guard;03 source equals02. Two incidental mojibake RU fixtures in02 were restored to their original UTF8 in03, with no other test changes. Stale79 preparation attempts remain preserved and are not used as02 proof.

This accepts the narrow prospective source/test bytes. It does not integrate them or close the actual HTTP500 finding. Keep auth/SQL/enqueue/revoke outside storage classification; no global FS policy, fallback, repair, retry or generic SyntaxError mapping. Fresh included source/image/appropriate tests and unchanged503 actual restore regression with independent evidence review remain necessary. No product edits or functional Docker run occurred; human450 and full P05 remain separate.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert inventory()==source
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
