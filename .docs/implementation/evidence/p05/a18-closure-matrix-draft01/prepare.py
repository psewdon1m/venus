from pathlib import Path
import copy,json,hashlib,datetime,difflib
r=Path('C:/.projects/venus');o=Path(__file__).parent;p=r/'.docs/implementation/evidence/p05/a17-closure-matrix-draft01';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());write=lambda n,x:(o/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha(p/'INDEX.json')=='b9357befbb4f69aa02069e297b579867c809effa0625f92c0bb2590fcd1ce6f3';assert not (o/'INDEX.json').exists()
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat();fp=r/'.artifacts/p05-pilot-bundle-source-freeze15.json';f=read(fp);src=r/'.artifacts/p05-pilot-bundle-source15';prior=r/'.artifacts/p05-pilot-bundle-source14';testp=r/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json';prodp=r/'.artifacts/p05-pilot-bundle-production-image-binding15/receipt.json';test=read(testp);prod=read(prodp)
assert f['identity']==test['source_identity']==prod['source_identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
assert f['git_source_commit']=='8f16c23a29ca6637ce6ef359fcf76398709549b2'
def pin(path):
 q=r/path;return {'path':q.relative_to(r).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}
proofs=read(p/'PROOFS.json')
newproofs={
'A18_BINDING':('a18-gate-bindings-independent-round01','6ba12785c55f5cdb547717902a4a397794fee3899f58d1ba909d3afa7a24cd5d','One combined nonauthor method/source-image review; qualified unchanged backend carries only, no fresh UI/OCI actual or whole host suite'),
'A18_PRODUCT_DECLINE':('active-pair-refusal-product-independent-round01','a4fbc5670f172efdc64e48c2b3eea601568c30362b5746d58254ae4f6637517e','Static two-guard product review and three focused real-TSX regressions; not native acceptance'),
'A18_BROWSER24_FAIL':('a18-browser24-failure-diagnosis-independent-round01','44bd3ddc93645dbf8c4fcc7a3d30c88b33a9fc20841ba61b2fd39e2911de93ac','13PASS1FAIL2NOT_RUN cleanupPASS; HTTP429 preparation before case14 hold; exact quota attribution UNKNOWN, no APP loop established'),
'BROWSER25_AUTHOR':('topic-browser-method25-author-round01','ee432ba31828b4ea7c023ed212236f1146f433aaf3034c4f648150bd62f69d0a','AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NOT_NATIVE; narrow helper emission guard, no fresh actual accepted'),
'A18_BINDING_AUTHOR':('a18-final-gate-bindings-author-round01','8f97ad4c373180dbc6e9a4a29bf103d0ff46e039f0f232d812c3446922250c1b','Author browser/layout bindings; superseded for authority by A18_BINDING, no actual acceptance')}
for key,(directory,h,scope) in newproofs.items():
 q=r/'.docs/implementation/reviews/p05'/directory/'INDEX.json';assert sha(q)==h
 proofs[key]={**pin(q.relative_to(r)), 'declared_status':read(q)['status'],'scope':scope,'fresh_child_reaudit':False}
for key,v in proofs.items():assert sha(r/v['path'])==v['sha256'],key
write('PROOFS.json',proofs)
inputs={'at_utc':stamp,'status':'A18_FACTS_DRAFT_NOT_FINAL_ACCEPTANCE','parent_draft':pin((p/'INDEX.json').relative_to(r)),'source_freeze':{**pin(fp.relative_to(r)),'identity':f['identity'],'included_files':1872,'materialized':src.as_posix(),'clean_git_commit':f['git_source_commit'],'qualification':'A18_BINDING independent exact source/Git/image correspondence; not final CI'},'test_receipt':{**pin(testp.relative_to(r)),'image':test['image']},'production_receipt':{**pin(prodp.relative_to(r)),'image':prod['image']},'norms':read(p/'INPUTS.json')['norms'],'facts_cutoff':'Root-authorized task state: OCI28 root PASS independent pending; browser24A18 FAIL; method25 pending independent. Later evidence must be a new additive revision.','no_native_tests_or_APP_changes':True}
for path,v in inputs['norms'].items():assert sha(r/path)==v['sha256']
for n,h in f['files'].items():assert sha(src/n)==h,n
carry17=read(p/'SOURCE_CARRY.json');paths=sorted(set(carry17['files'])|{'apps/web/src/topic-panel.test.ts','.docs/implementation/p05-source-revision-active-pair-refusal-01.json'})
files={n:{'A18_sha256':f['files'][n],'A17_sha256':sha(prior/n) if (prior/n).exists() else None,'byteexact_A17':(prior/n).exists() and sha(prior/n)==f['files'][n],'scope':'FILE_CORRESPONDENCE_NOT_WHOLE_METHOD_OR_EXECUTION_ACCEPTANCE'} for n in paths}
anchors={}
for key,v in carry17['line_anchors'].items():
 name=v['A17_path'];line=v['A17_equal_line'];old=(prior/name).read_text().splitlines();new=(src/name).read_text().splitlines();target=None
 for tag,a,b,c,d in difflib.SequenceMatcher(None,old,new,autojunk=False).get_opcodes():
  if tag=='equal' and line is not None and a<=line-1<b:target=c+(line-1-a)+1;break
 anchors[key]={'parent_A17_anchor':{'path':name,'line':line},'A18_path':name,'A18_sha256':f['files'][name],'A18_equal_line':target,'scope':'EQUAL_LINE_ONLY_NOT_WHOLE_METHOD_PROOF' if target else 'CHANGED_LINE_REQUIRES_PRODUCT_REVIEW_NOT_EQUAL_LINE_CARRY'}
pure=copy.deepcopy(carry17['pure_A9_closure']);pure.update(basis=['A15_PREP_INDEPENDENT','A16_TUPLE_HOST_PURE','A17_BINDING','A18_BINDING'],all28_equal_A17=True,not_A9_native_runs_relabelled_A18=True)
source={'status':'A18_AUTHOR_FACTS_CORRESPONDENCE_NOT_FINAL_ACCEPTANCE','source':f['identity'],'included_files':1872,'parent_A17_source_carry':pin((p/'SOURCE_CARRY.json').relative_to(r)),'files':files,'line_anchors':anchors,'qualified_backend_reuse':{'proof':'A18_BINDING','test_backend_modules':69,'production_backend_modules':67,'SQL':7,'PG':2,'data':'EXACT_A17','scope':'API42/wire/N4/storage/pure components only; old source labels preserved; no current frontend or whole1100-suite carry'},'pure_A9_closure':pure,'decline_change':{'path':'apps/web/src/topic-games-panel.tsx','line':95,'A18_sha256':f['files']['apps/web/src/topic-games-panel.tsx'],'predicate':"(!target?.invitation||conversation?.prompt)&&can('decline_invitation')",'changes':2,'scope':'Outer fallback section plus inner pair-decline; complementary invitation branch82 avoids duplicate ID; respond handler68 unchanged','proof':'A18_PRODUCT_DECLINE'},'regressions':{'path':'apps/web/src/topic-panel.test.ts','line':5,'A18_sha256':f['files']['apps/web/src/topic-panel.test.ts'],'new_cases':3,'cases':['pending retained invitation: one authorized decline','active prompt plus retained invitation: one authorized decline, exact request and immediate clear before held receipt','unauthorized actor/outsider: no control/POST; outsider no private prompt'],'independent_focused':'3PASS17SKIP exit0, deterministic actual TSX harness; not native/server-auth acceptance','author_reviewed_file':'A17 regressions RED19PASS1FAIL then A18GREEN20PASS/webtypecheck/lint; reviewed, not rerun by draft','whole_prior1100_current':False,'proof':'A18_PRODUCT_DECLINE'},'rendered_UI_current_acceptance':False}
write('SOURCE_CARRY.json',source)
rows=[];oldrows=read(p/'REQUIREMENTS44.json')['rows'];invariants=['id','requirement','expected','source_card_ids','current_card_applicability','audit_group','owner_scope']
for old in oldrows:
 row={k:copy.deepcopy(old[k]) for k in invariants};row.update(full_requirement_acceptance=False,parent_A17_row_reference={'path':(p/'REQUIREMENTS44.json').relative_to(r).as_posix(),'id':old['id'],'sha256':sha(p/'REQUIREMENTS44.json')},actual_pending=copy.deepcopy(old['actual_pending']),actual_pending_semantics='Final per-requirement gate assembly; consult PENDING for completed qualified components versus fresh actuals. Not every named component is unexecuted.')
 row['code']={'status':'A18_SOURCE_FACTS_DRAFT_NOT_FRESH_APP_ACCEPTANCE','current_source_refs':[{'path':v['path'],'sha256':f['files'][v['path']],'byteexact_A17':sha(prior/v['path'])==f['files'][v['path']]} for v in old['code']['current_source_refs']],'line_anchor_keys':old['code']['line_anchor_keys'],'source_carry':'SOURCE_CARRY.json','qualification_refs':['A18_BINDING'],'historical_fact_scope':'Original per-row implementation statements remain at exact parent row; current hash correspondence does not promote them to acceptance'}
 row['current_tests']={'status':'SCOPED_COMPONENT_CARRY_NOT_CURRENT_WHOLE_SUITE','test_files':[{'path':v['path'],'A18_sha256':f['files'][v['path']],'byteexact_A17':sha(prior/v['path'])==f['files'][v['path']]} for v in old['current_tests']['test_files']],'qualification':'A18_BINDING backend/storage/model/pure only; frontend/fullsuite current acceptance pending; three focused decline regressions separately SOURCE_CARRY'}
 row['component_fact_refs']=list(dict.fromkeys(old['component_fact_refs']+['A18_BINDING','A18_BROWSER24_FAIL']))
 if any(v['path']=='apps/web/src/topic-games-panel.tsx' for v in row['code']['current_source_refs']):row['component_fact_refs'].append('A18_PRODUCT_DECLINE')
 rows.append(row)
write('REQUIREMENTS44.json',{'schema_version':1,'status':'AUTHOR_A18_FACTS_DRAFT_NOT44_OR_STAGE_ACCEPTANCE','at_utc':stamp,'source_identity':f['identity'],'included_files':1872,'rows':rows})
gates=read(p/'GATES_AND_E2E.json');gates['status']='AUTHOR_A18_FACTS_DRAFT_NO_GATE_ACCEPTANCE'
for group in ['exit_p05','critical_e2e_04_section8']:
 for row in gates[group]:row['acceptance']=False;row['current_component_fact_refs']=list(dict.fromkeys(row.get('current_component_fact_refs',[])+['A18_BINDING','A18_PRODUCT_DECLINE','A18_BROWSER24_FAIL']));row['actual_pending_semantics']='See PENDING.json: qualified API42/wire completed components; OCI root terminal independent pending; fresh browser/layout and final assembly unresolved.'
gates['evidence_state_reference']='PENDING.json';write('GATES_AND_E2E.json',gates)
ci=read(p/'CI_RIP.json');ci['status']='A18_APPLICABILITY_FACTS_NOT_CI_PASS'
for row in ci['rows']:row['acceptance']=False;row['current_component_fact_refs']=list(dict.fromkeys(row.get('current_component_fact_refs',[])+['A18_BINDING']));row['current_scope_qualification']='Existing component refs retain historic source labels; no current whole1100/native/frontend/final remote CI PASS.'
write('CI_RIP.json',ci);(o/'RETIRED_AND_UX.json').write_bytes((p/'RETIRED_AND_UX.json').read_bytes())
pending=read(p/'PENDING.json')
pending['ORDINARY42']['status']='COMPONENTS_COMPLETE_QUALIFIED_A18_BACKEND_CARRY_FINAL_ASSEMBLY_PENDING';pending['ORDINARY42']['A18_qualification']='A18_BINDING exact backend69/67 SQL7 PG2/data; no new A18 API execution or UI/cadence/stage acceptance'
pending['BROWSER16']={'status':'A18_ACTUAL_FAIL_13PASS_1FAIL_2NOTRUN_CLEANUP_PASS','diagnosis':'A18_BROWSER24_FAIL','project':'venus-topic-browser-5de54fa63bc8','failure':'Authenticated current429 in freshPrivate/invite/coherentGame preparation BEFORE case14 holdReads','attribution':'Exact actual bucket occupancy and numerical driver/APP attribution UNKNOWN','next_method':{'proof':'BROWSER25_AUTHOR','status':'AUTHOR_COLD_PASS_INDEPENDENT_PENDING_NO_ACTUAL','runtime_digest':'f1be316048622bdd55c4a5e3a4e0ce381303dc902ea6678c4154f67ab5a7e658'},'expected':'Original16 and strict200/COMPLETEdiagnostics/emptycleanup on exact A18; fresh actual needed','historical_A17_actual':'481c338138c64f4013c05954403e767ed0301515a96c6e7753bebb0b8196e28a remains historical, not current acceptance'}
pending['LAYOUT459'].update(status='PENDING_FRESH_A18_BROWSER16_PREREQUISITE_AND_LAYOUT459',method='A18_BINDING accepted layout21-derived A18 producer/runtimea85898fa, all459 unchanged',expected='Original459/9x51/3engines/RUEN/TR/native200/focus/contrast; resourceprofileLAYOUT21_BROWSER_PID512; no inherited UI acceptance')
pending['OCI14'].update(status='ROOT_REPORTED_ACTUAL_PASS_INDEPENDENT_PENDING',method='A18_BINDING OCI28 exact40MJS inherited27/original14',actual_project='venus-p05-oci-58825426c411',root_exit=0,root_terminal='PASS_BOUNDED_SYNTHETIC_OCI_ROLLBACK cleanupcompleted, empty owned resources, export_errornull',independent_actual_status='PENDING_AT_DRAFT_CUTOFF',scope='Saved terminal is operator evidence, not nonauthor gate acceptance; final14/E/F/replay13/limits/source proof audit pending')
pending['WIRE']['qualification']='A18_BINDING preserves original finite wirecbf1723 unchanged backend/projection/fence, no fresh wire execution/AUC/cadence/browser/TLS proof'
pending['CLEAN_CI'].update(component='A18_BINDING cleanGit1872/source/test/production correspondence only',current_whole_host_suite='PENDING: old1100 historical; three UI regressions added; focused3 not fullsuite',remote_required_CI='PENDING_NO_REMOTE_ACTIONS_CLAIM')
pending['FINAL_REVIEW']['expected']='Remaining fresh actuals, statistics/full quality, final threat/privacy/non-author44/EXIT/E2E/CI assembly and coherent writerSTOP/manifest; draft does not accept P05 or startP06'
write('PENDING.json',pending)
oci=r/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05/venus-p05-oci-58825426c411';actualpins=[r/'.artifacts/p05-oci28-a18-run01.exit.json',r/'.artifacts/p05-oci28-a18-run01.txt',oci/'runner.json',oci/'TERMINAL.json',oci/'RAW_INDEX.json',oci/'owned-after-cleanup.json']
write('ACTUAL_OPERATOR_PINS.json',{'status':'ROOT_TERMINAL_FACTS_NOT_INDEPENDENT_ACCEPTANCE','files':[pin(x.relative_to(r)) for x in actualpins],'whole_stage_acceptance':False,'raw_child_reaudit_performed':False})
write('INPUTS.json',inputs)
# Deterministic reconciliation only; no test/runtime execution.
assert len(rows)==44 and len(set(x['id'] for x in rows))==44
for before,after in zip(oldrows,rows):assert all(before[k]==after[k] for k in invariants) and after['full_requirement_acceptance'] is False
for key in ['exit_p05','critical_e2e_04_section8']:
 before=read(p/'GATES_AND_E2E.json')[key];assert len(before)==len(gates[key])
 for a,b in zip(before,gates[key]):
  for k in ['id','text','norm_source','scope']:
   if k in a:assert a[k]==b[k]
  assert b['acceptance'] is False
for a,b in zip(read(p/'CI_RIP.json')['rows'],ci['rows']):
 for k in ['id','text','expected_evidence','norm_source','scope']:assert a[k]==b[k]
 assert b['acceptance'] is False
ret=read(o/'RETIRED_AND_UX.json');assert ret['UX_count']==len(ret['UX_ids'])==19 and ret['retired_trigger_count']==len(set(ret['retired_trigger_ids']))==72
assert len(gates['exit_p05'])==5 and len(gates['critical_e2e_04_section8'])==10 and len(ci['rows'])==9
assert sha(p/'INDEX.json')==inputs['parent_draft']['sha256']
write('CHECKS.json',{'status':'PASS_DETERMINISTIC_DRAFT_RECONCILIATION_ONLY','original_ordered_requirements':44,'exact_requirement_text_expected_cards_applicability_auditgroup_owner_scope':True,'UX':19,'retired_distinct':72,'EXIT':5,'E2E':10,'CI':9,'normative_ID_text_scope_preserved':True,'all44_15_9_acceptance_false':True,'A18_materialized1872_hashes_verified':True,'source_fact_paths':len(files),'source_line_anchors':len(anchors),'proof_INDEX_pins_verified':len(proofs),'fresh_full_proof_child_reaudits':False,'test_native_Docker_Git_executions':0,'APP_producer_registry_manifest_writes':0,'parent_A17_INDEX_unchanged':True})
write('HANDOFF.json',{'status':'AUTHOR_A18_FACTS_DRAFT_NOT_FINAL_ACCEPTANCE','source_identity':f['identity'],'included_files':1872,'ordered_requirements':44,'EXIT':5,'E2E':10,'CI':9,'UX':19,'retired':72,'stage_acceptance':False,'whole_APP_acceptance':False,'owned_writes':'COMPLETE_STOP_AFTER_INDEX_FREEZE','next':'Root adds later independent actuals/final tests in a new additive revision; no mutation of this draft.'})
print(json.dumps({'status':'DRAFT_RECONCILIATION_PASS_NOT_TEST_OR_STAGE','requirements':44,'EXIT':5,'E2E':10,'CI':9,'UX':19,'retired':72,'source_paths':len(files),'anchors':len(anchors),'proofs':len(proofs)}))
