from pathlib import Path
import hashlib,json,datetime,shutil,sys,subprocess
root=Path.cwd();p=root/'.artifacts/p05-topic-restore';base=root/'.artifacts/p05-topic-restore-metadata06-review-round01';out=root/'.docs/implementation/reviews/p05/topic-restore-metadata06-review-round01';actual=root/'.docs/implementation/evidence/p05/engine2-topic-restore-preflight-01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b';snap=p/'producer-checkpoint06';assert sha(snap/'index.json')=='f06af3cae2a689a2eedd6f1d19969ebad397cc0bddbdbd1f7e06edc3d30bf605'
h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v,n;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
idx=read(snap/'index.json')
for r in idx['files']:assert sha(snap/r['path'])==r['sha256']
assert sha(actual/'index.json').startswith('4e65810d');ai=read(actual/'index.json')
for r in ai['files']:assert sha(actual/r['path'])==r['sha256']
child=read(actual/'run/child-phase3.json')['report'];assert child['failure']['code']=='ERR_ASSERTION' and 'http_status_assertion'not in child['failure'];assert any('phases.mjs:48:281'in s for s in child['failure']['frames'])
assert len(read(base/'probes.json')['rows'])==23;author=read(base/'metadata06-results.json');assert len(author['rows'])==38 and all(r['status']=='PASS'for r in author['rows'])
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811;assert source==read(p/'source-metadata06.json')['files'];assert read(p/'BINDING.json')['root_run_ack']is False
modules=['factory.mjs','observations.mjs','replay-observations.mjs','phases.mjs','child.mjs','controller.mjs','run.mjs','status-diagnostics.mjs'];node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
for n in modules:assert subprocess.run([node,'--check',str(p/n)],capture_output=True).returncode==0
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
for n in modules+['HANDOFF.json','BINDING.json']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(snap/'index.json',out/'source'/'author-index.json');shutil.copyfile(actual/'index.json',out/'source'/'old-actual-index.json');shutil.copyfile(actual/'run/child-phase3.json',out/'source'/'old-actual-child-phase3.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'RESTORE06_METADATA_STATIC_PASS_ROOT_RUN_ACK_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'INDEPENDENT_METADATA_ONLY_CORRECTION_NOT_ACTUAL_RESTORE','reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'snapshot_files_verified':len(idx['files']),'old_actual_packet_sha256':sha(actual/'index.json'),'old_actual_files_verified':len(ai['files']),'old_actual_http_status':'UNKNOWN','findings':[],'checks':{'own_safe_projection_and_finite_controls':23,'copied_author_metadata_controls':38,'runtime_syntax':8,'five_other_runtime_modules_identical05':True,'old503_assert_and14cases_unchanged':True,'root_ack_false':True},'failed_attempts':['Own initial copied-author adapter globally changed a finite-diff string alongside imports:37PASS1FAIL. Initial output retained; anchored import-only adapter correction yields38PASS. Producer unchanged.'],'limits':['New diagnostic reports only fixedstep/numericstatus/allowlistedcode/absentflags, with numericAssertion matching lastpending HTTP503 assertion; no raw bodies/headers/error.message or generic actual/expected output.','Finite reverse projection makes old phases/child byteidentical; owned path precheck and bounded4 metadata entries are the only added observations.','Old actual01 childexit1/ERR_ASSERTION at phases48:281 does not reveal HTTP500 or any other actual status; seven reportedPASS remain partial failedrun.','No new functional Docker/restore or product/producer writes. Root new ACK/binding and independent actual evidence remain necessary.','Human450 and fullP05 not accepted.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Restore06 metadata — independent review

**RESTORE06_METADATA_STATIC_PASS_ROOT_RUN_ACK_REQUIRED.** No finding. Twenty-three own safe-projection/finite-diff controls,38 copied author controls and eight runtime syntax checks pass. All author/snapshot/source pins were verified before/after.

The new helper emits only a fixed step, numeric HTTP statuses, allowlisted code or unknown marker, and owned-path absence flags. Generic assertion bodies/values, private response text/headers and exception.message are omitted. Numeric exception fields require the matching last pending HTTP503 strict assertion. Observations are bounded to four; the owned personal-chain path is verified before fault injection.

Finite reverse comparison restores the exact prior phases/child text after removing only declared metadata additions. The503 assertion,14 cases, TTL/roots/receipt/effects and five other runtime modules are unchanged. Candidate BINDING ACK remains false.

The complete old actual packet was hash-verified. Its third child ERR_ASSERTION at phases48:281 contains no actual HTTP status. Child exit1 does not establish500; the status remains UNKNOWN and seven reportedPASS remain a partial failed run. An initial own test adapter caused37PASS1FAIL by altering a literal finite expectation; initial evidence is retained and import-only correction passes38. No producer edit, functional Docker or restore occurred. Root new authorization and actual audit remain separate; full P05/human450 unchanged.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert source==inventory()
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
