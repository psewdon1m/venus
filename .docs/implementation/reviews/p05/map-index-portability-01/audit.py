from pathlib import Path
import json,hashlib,shutil,tempfile,re,sys
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'));from stage_inventory import inventory,identity
sha=lambda b:hashlib.sha256(b).hexdigest()
review=ROOT/'.docs/implementation/reviews/p05/map-index-review-round01';original=ROOT/'.artifacts/p05-map-index-candidate01/HANDOFF.json';raw=original.read_bytes();expected='1cf33923ff98c627ff4cd706379a0dfad9664b19ab177058f9fbf15de33b6aae';assert sha(raw)==expected
assert sha(review.joinpath('INDEX.json').read_bytes())=='d6c04b0788345d8dd4253a189a56d724e428b3f25c91657a88742052f617e50f'
for row in json.loads(review.joinpath('INDEX.json').read_text(encoding='utf8'))['files']:assert sha(review.joinpath(row['path']).read_bytes())==row['sha256']
OUT.joinpath('HANDOFF.json').write_bytes(raw)
candidate=ROOT/'.artifacts/p05-map-portability-candidate01';ignore=candidate.joinpath('Dockerfile.checks.dockerignore').read_bytes();assert sha(ignore)=='89c107f84b66fc365441d4a7b880c72dfd1000fd114fce54130d403884a15684'
current=ROOT.joinpath('infra/venus/Dockerfile.checks.dockerignore').read_bytes();rules=lambda b:[s for s in b.decode().splitlines() if s.strip() and not s.startswith('#')]
a=rules(current);b=rules(ignore);assert b.count('!.artifacts/p05-map-index-candidate01/HANDOFF.json')==1;b.remove('!.artifacts/p05-map-index-candidate01/HANDOFF.json');assert a==b
OUT.joinpath('Dockerfile.checks.dockerignore.proposed').write_bytes(ignore)
witness=json.loads(candidate.joinpath('witness.json').read_text(encoding='utf8'));assert witness['actual_exit_code']==0 and witness['candidate_ignore_sha256']==sha(ignore)
files=[p for p in candidate.joinpath('witness-output').rglob('*') if p.is_file()];assert len(files)==1 and not files[0].is_symlink() and sha(files[0].read_bytes())==expected and len(files[0].read_bytes())==1875
assert files[0].relative_to(candidate/'witness-output').as_posix()=='witness/p05-map-index-candidate01/HANDOFF.json'
assert candidate.joinpath('neighbor-canary.txt').is_file() and 'DONE' in candidate.joinpath('build-raw.txt').read_text(encoding='utf8')
wd=OUT/'context-witness';wd.mkdir(exist_ok=True)
for name in ['Dockerfile.checks','Dockerfile.checks.dockerignore','build-raw.txt','neighbor-canary.txt','witness.json']:shutil.copyfile(candidate/name,wd/name)
wd.joinpath('exported-HANDOFF.json').write_bytes(files[0].read_bytes())
links=re.compile(r'!?\[[^\]\n]*\]\(([^)]+)\)');controls=[]
with tempfile.TemporaryDirectory(prefix='venus-map-portability-') as temp:
 t=Path(temp);tr=t/review.relative_to(ROOT);shutil.copytree(review,tr);compat=t/original.relative_to(ROOT);compat.parent.mkdir(parents=True);compat.write_bytes(raw)
 def errors():return [dest for dest in links.findall(tr.joinpath('report.md').read_text(encoding='utf8')) if not (tr/dest.split('#')[0]).resolve().exists()]
 assert errors()==[];controls.append({'name':'old-exact-report-all-links-with-only-one-compatibility-blob','status':'PASS'})
 compat.unlink();assert errors()==['../../../../../.artifacts/p05-map-index-candidate01/HANDOFF.json'];controls.append({'name':'missing-original-target-still-rejected-no-link-skip','status':'PASS'})
 changed=raw.replace(b'2026',b'2027',1);json.loads(changed);assert changed!=raw;compat.write_bytes(changed);assert sha(compat.read_bytes())!=expected;controls.append({'name':'valid-json-tamper-fails-explicit-byte-pin','status':'PASS'})
 compat.write_bytes(raw);assert sha(compat.read_bytes())==sha(OUT.joinpath('HANDOFF.json').read_bytes());controls.append({'name':'compatibility-target-exact-durable-copy','status':'PASS'})
f=inventory();ident=identity(f);assert ident=='1d3a2ba1aa0c79ad223c89094e6def087036abcf327fb46ba42956a68ffbc6f0' and len(f)==1813
report={'status':'PACKAGING_DESIGN_AND_RETAINED_DOCKER_CONTEXT_AUDIT_PASS_NOT_INTEGRATED','reviewer':'/root/p04_gate_preflight','original_review_sha256':sha(review.joinpath('report.md').read_bytes()),'original_index_sha256':sha(review.joinpath('INDEX.json').read_bytes()),'original_review_children_unchanged':True,'compatibility_original_path':original.relative_to(ROOT).as_posix(),'compatibility_exact_blob_sha256':expected,'durable_copy_sha256':sha(raw),'payload_bytes':len(raw),'metadata_assessment':'Explicit author/hashes/source identity/control counts/public local paths only; no participant messages/auth tokens/private keys/real card text observed.','checks_ignore_before_sha256':sha(current),'checks_ignore_proposed_sha256':sha(ignore),'source_identity':ident,'included_files':len(f),'source_writes':False,'git_index_writes':False,'reviewer_Docker_actions':False,'tracked_clone_verified':False,'Docker_context_witness':'INDEPENDENT_RETAINED_RAW_AND_EXPORTED_BYTES_AUDIT_NOT_REEXECUTION','retained_Docker_export_unique_files':1,'targeted_owned_fixture_controls':controls,'full_docs_check_rerun':False,'full_stage_acceptance':False}
OUT.joinpath('recommendation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':report['status'],'controls':len(controls),'retained_Docker_export_files':len(files),'source':ident}))
