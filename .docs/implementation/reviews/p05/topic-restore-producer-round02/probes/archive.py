from pathlib import Path
import hashlib,json,datetime,shutil,sys,subprocess
root=Path.cwd();p=root/'.artifacts/p05-topic-restore';base=root/'.artifacts/p05-topic-restore-producer-review-round02';out=root/'.docs/implementation/reviews/p05/topic-restore-producer-round02'
def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()
def read(x):return json.loads(x.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='d1e9f44e1871dd4065133ca02c7a5ab30273a7e6729d113f0a7a65f41e7dddac';snap=p/'producer-checkpoint05';assert sha(snap/'index.json')=='8b6c00187e7e2e7c972623d508f8fda00b10adcbea5f4347a7995f492b13dad6'
h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v,n;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
idx=read(snap/'index.json')
for f in idx['files']:assert sha(snap/f['path'])==f['sha256']
runtime=['factory.mjs','observations.mjs','replay-observations.mjs','phases.mjs','child.mjs','controller.mjs','run.mjs'];node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
for n in runtime:assert subprocess.run([node,'--check',str(p/n)],capture_output=True).returncode==0
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811;assert source==read(p/'source-correction05.json')['files']
assert sha(root/'tests/p05-topic-lifecycle/harness.mjs')==h['harness_sha256'];assert h['image']=='sha256:12e6253fee35b1adec1976d9edfb41fddb3fd39eedc3815158aa96c8814f5a5f'
counts={n:len(read(base/n)['rows']) for n in ['author-controls-results.json','runner-controls-results.json','replay-controls-results.json','corrections05-results.json']};assert sorted(counts.values())==[20,34,38,39]
assert all(r['exit']==0 for r in read(base/'rerun-results.json'));assert len(read(base/'probes.json')['rows'])==41
finite=read(base/'finite.json');assert finite['entire_runner_runtime_flow_after_project_declaration_unchanged']
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
for n in runtime+['HANDOFF.json','BINDING.json','DESIGN-round04.md']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(snap/'index.json',out/'source'/'author-index.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'RESTORE05_STATIC_PREFLIGHT_PASS_ROOT_RUN_ACK_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'AUTHOR_DISJOINT_CONCRETE_RESTORE_CORRECTION_REVIEW_NOT_ACTUAL_RESTORE','reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'image':h['image'],'snapshot_files_verified':len(idx['files']),'findings':[],'closed_findings':['RESTORE-PRODUCER-R01-SEQUENCE_STATE','RESTORE-PRODUCER-R02-FILESET'],'checks':{'own_oldnew_sequence_fileset_controls':41,'own_root_binding_guard_controls':5,'copied_author_control_reruns':counts,'syntax_runtime_modules':7,'finite_diff':finite},'accepted_scope':['Full pg_sequences definition/catalog plus direct quoted relation last_value/is_called preserves bigint strings; four old falseaccepts reproduced, changed new state rejected.','Fresh top-level enumeration binds name/type/hash every capture, rejects additions/removals/type/symlink/special changes; historical directory contents deliberately excluded.','Five other runtime modules byte-identical to04; all nonrawDatabase observation functions unchanged and runner body from project construction through finally unchanged. Thus fourteenIDs, boot ordering/fullrestore/roots/noeffect boundaries retained.'],'limits':['BINDING status remains candidate/root_run_ack false: no RUN authorized by this static PASS. Root final binding update and finite recheck if needed precede actual run.','Image12e625 source/build receipt binding inherited previously reviewed; no new Docker inspection or image extraction in this round.','No actual PostgreSQL dump/restore, process restart or browser run; fullP05/human450 unaffected.'],'no_product_producer_or_docker_functional_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Restore05 — independent correction review

**RESTORE05_STATIC_PREFLIGHT_PASS_ROOT_RUN_ACK_REQUIRED.** Both round01 P2 findings are closed for exact paused05 bytes. The old FAIL and five false-accept counterexamples remain immutable.

Forty-one own old/new controls verify exact sequence definition/direct state comparison, quoted identifiers and bigint strings, plus fresh top-level producer name/type/hash enumeration. Four sequence metadata/state changes and one file addition reproduce the old gaps and are rejected after correction. Five root-binding controls pass. Copied39 observer/20 runner/34 receipt/38 correction controls pass; seven runtime syntax checks pass.

Finite comparison confirms five other runtime modules byte-identical, all observation functions except rawDatabase unchanged, and the runner's entire project/runtime/finally flow unchanged. Fourteen controls, full raw tables/sequences restore, protected roots, fresh processes, pre-listen D observer, receipt/no-expansion and narrow accounting/floor effects are retained. All author hashes, sourceef009/1811 maps and harness pins were verified before/after.

Candidate BINDING still has root_run_ack false and intentionally refuses RUN. Root final binding approval, actual restore and independent actual evidence audit remain separate. No Docker/restore/product/producer execution or writes occurred; no full P05 or human450 approval follows.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert source==inventory()
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)} for q in sorted(out.rglob('*')) if q.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
