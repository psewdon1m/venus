from pathlib import Path
import json,hashlib,datetime,shutil,sys
root=Path.cwd();p=root/'.artifacts/p05-storage-availability-candidate01';base=root/'.artifacts/p05-storage-candidate-review-round01';out=root/'.docs/implementation/reviews/p05/topic-storage-candidate-round01';actual=root/'.docs/implementation/evidence/p05/engine2-topic-restore-preflight-02'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='eafdf2f5f9f5c19529a9cc6b3ea25c351630897c7dba18a8ed81c7d6e6ee3ddf';h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['files'].items():assert sha(p/n)==v;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
assert sha(actual/'index.json')==h['trigger_index_sha256']=='618e98ee721a849faf1843c3cb21ae38786d1c75258d7e50ec748930bf71b576';idx=read(actual/'index.json')
for r in idx['files']:assert sha(actual/r['path'])==r['sha256']
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811
checks=read(base/'probes.json')['rows'];assert len(checks)==9 and checks[-1]['status']=='CONFIRMED_CONTRACT_COUNTEREXAMPLE';assert read(base/'finite.json')['entire_class_identical_after_unwrapping'];assert '79 passed'in(base/'vitest-rerun.txt').read_text(encoding='utf8')
out.mkdir(parents=True,exist_ok=False);(out/'candidate').mkdir();(out/'probes').mkdir()
for q in p.iterdir():
 if q.is_file():shutil.copyfile(q,out/'candidate'/q.name)
shutil.copyfile(actual/'index.json',out/'trigger-index.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'CHANGES_REQUESTED_DOMAINERROR_PRECEDENCE','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'INDEPENDENT_ROOT_AUTHORED_PROSPECTIVE_STORAGE_CANDIDATE_NOT_INTEGRATED','reviewer':'/root/p05_topics_ui_review','author':'/root','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'actual_trigger_files_verified':len(idx['files']),'findings':[{'id':'STORAGE-CANDIDATE-R01-DOMAIN_PRECEDENCE','severity':'P2','problem':'topicStorage computes native errno/syscall classification before preserving an existing DomainError. A typed DomainError with errno context is replaced by503, violating the stated preservation contract.','exact_counterexample':{'input':'Object.assign(new DomainError(ENOENT,409), {syscall:open})','expected':'same object/status409','actual':'new TOPIC_STORAGE_UNAVAILABLE/status503'},'impact_scope':'Contract edge; no current production endpoint exploit or regression observed. Ordinary tested DomainErrors401/409 remain correct.','requested_fix':'First catch branch: if(error instanceof DomainError) throw error. Add identity+status regression for DomainError carrying recognized errno/syscall context; keep native storage errors503, unknown errors unchanged. Preserve candidate01 proof and publish revised candidate bytes.'}],'checks':{'independent_Vitest_same_prospective_loader_tests':79,'own_helper_controls':8,'own_confirmed_contract_counterexamples':1,'finite_storage_call_wrappers':7,'entire_existing_class_identical_after_unwrap_and_lineending_normalization':True},'positive_scope':['Seven wrappers only around open/read/narrow/assertLive storage calls, no DB/auth/enqueue/revoke wrapper.','Candidate knownstorageclass/nativeerrors sanitized503; raw SyntaxError/TypeError/nonfilesystem syscall remain original500.','Root79 tests include durable-narrowing SQLrollback/no repeatedoperation/plannerfences, no broadallendpoint/corruptJSONclassification claim.'],'failed_attempts':['Own initial VM probe used separate Error realm and falsely rejected host native Error; injected host Error constructor, preserved note.','Own initial finite exact class text check failed CRLF vsLF; normalized only line endings before unwrapping seven expressions, preserved note.'],'limits':['No included candidate integration, Docker/restore RUN or fullstage acceptance.','Actual503 restore regression still required on fresh source/image after exactcandidate review.','All113 actualtrigger files verified; actualHTTP500 finding stays open until newsourceactualproof.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Scoped storage availability candidate01 — independent review

**CHANGES_REQUESTED_DOMAINERROR_PRECEDENCE.** Candidate01 is narrow and79 prospective tests independently pass, but one stated error-preservation contract is incomplete.

## STORAGE-CANDIDATE-R01-DOMAIN_PRECEDENCE — P2

topicStorage checks native errno/syscall fields before explicitly preserving DomainError. Exact counterexample: Object.assign(new DomainError('ENOENT',409),{syscall:'open'}) becomes a new503 instead of the same409 object. This is a contract edge, not an observed endpoint exploit. Put the DomainError identity guard first and add this regression; do not weaken native-error503 or unknown-error behavior.

Eight other own helper controls pass. Finite source comparison confirms only seven synchronous storage-call wrappers; after unwrapping them and normalizing CRLF/LF, the existing class is unchanged. SQL/auth/enqueue/revoke remain outside classification. Raw SyntaxError, TypeError and nonfilesystem syscalls remain unmapped; no blanket corruption or other-endpoint fix is claimed. All113 actual-trigger hashes and candidate/sourceef009 pins were verified before/after.

The own VM initially had an Error-realm mismatch, and a finite text check initially compared CRLF toLF; both failed attempts and corrections are retained. No product/candidate edits, integration or functional Docker/restore run occurred. Preserve candidate01, repeat review on corrected exact bytes, then new source/build/actual503 restore proof. Full P05/human450 remain separate.
''',encoding='utf8')
for q in inputs:assert sha(root/q['path'])==q['sha256']
assert source==inventory()
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
