from pathlib import Path
import json,hashlib,datetime,difflib
R=Path.cwd();O=R/'.docs/implementation/evidence/p05/a15-closure-matrix-draft01';O.mkdir(parents=True,exist_ok=False)
A=R/'.artifacts/p05-pilot-bundle-source12';P=R/'.artifacts/p05-pilot-bundle-source10'
def read(p):return json.loads(p.read_text('utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
tri=read(R/'.docs/implementation/reviews/p05/requirements44-current-triage-round02/matrix.json');facts=read(R/'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/requirements44-code-facts.json');fr=read(R/'.artifacts/p05-pilot-bundle-source-freeze12.json');ai=read(R/'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/INPUTS.json');now=datetime.datetime.now(datetime.timezone.utc).isoformat()
assert len(tri['rows'])==len(facts['rows'])==44
for t,f in zip(tri['rows'],facts['rows']):
 for k in ['id','requirement','expected','source_card_ids']:assert t[k]==f[k]
assert sum(t['id'].startswith('P04-UX-') for t in tri['rows'])==19
proofs={}
def proof(id,path,scope,carry):
 p=R/path;v=read(p);proofs[id]={'path':path,'sha256':sha(p),'declared_status':v.get('status',v.get('verdict','SEE_PINNED_REPORT')),'scope':scope,'carry_basis':carry,'fresh_child_reaudit':False};return id
proof('TRIAGE44','.docs/implementation/reviews/p05/requirements44-current-triage-round02/INDEX.json','Original44 IDs/text/expected/card applicability at A3; no current runtime acceptance','Only immutable obligation text/card applicability carried; old WIP statements superseded by explicit current facts.')
proof('CODE44_A13','.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/INDEX.json','Focused A13 code/threat/privacy facts, not full44 actual acceptance','Per-file A13→A15 SHA and translated equal-line anchors in SOURCE_CARRY.json; changed files require scoped deltas, not blanket carry.')
proof('A15_HOST_IMAGE','.docs/implementation/evidence/p05/a15-host-image-round01/INDEX.json','A15 host1083PASS/204platformSKIP/76files; tsc/web-tsc/lint0; test299pins/prod122+metadata','Exact frozen658b/1869 before/after and root image receipts; skipped Linux tests not promoted.')
proof('A15_PREP_INDEPENDENT','.docs/implementation/reviews/p05/a15-image-host-pure-n4-preparation-independent-round01/INDEX.json','Independent source/image/host/pure correspondence and storage carry; not native N4 or whole stage','Pure27 closure files exactA9 plus explicit rooms.revision binding/AST correspondence, not whole rooms equality; storage modules+3tests exactA13.')
proof('A15_N4_ACTUAL','.docs/implementation/reviews/p05/a15-n4-actual-independent-round01/INDEX.json','Fresh one online/questions N4/20rounds PASS;489requests/4WS/no skips/cleanupPASS','Exact A15 source658b/1869 and productiond1eff; original04 600s/rates/assertions; not42/browser/performance SLO.')
proof('A15_SOCKET_DELTA','.docs/implementation/reviews/p05/socket-projection-work-independent-round01/INDEX.json','Independent changed socket/heartbeat unused-work source and focused52+4 controls','Exact reviewed delta in A15; private delivery/auth/source/clock fences retained, no automatic old-backend actual carry.')
proof('A15_WS_LOG_DELTA','.docs/implementation/reviews/p05/ws-safe-failure-logging-independent-round01/INDEX.json','Independent bounded WS diagnostics source64+3 controls, no native cause claim','Exact reviewed delta in A15; source-only observability, no client/protocol/TTL change.')
proof('A14_FRONTEND03','.docs/implementation/reviews/p05/own-exclusion-refresh-independent-round03/INDEX.json','Independent partial-commit own-exclusion UI refresh/draft preservation','A15 complete UI/source frontend exact A14; no final actual16/layout acceptance from source tests.')
proof('STORAGE_INDEPENDENT01','.docs/implementation/reviews/p05/ephemeral-lock-fsync-product-independent-round01/INDEX.json','Other-agent acceptance of authored ephemeral-lock/data durability correction','Exact storage implementation byte hashes carried via A15 independent image/source qualification; author does not reaccept own change.')
proof('STORAGE_INDEPENDENT02','.docs/implementation/reviews/p05/ephemeral-lock-fsync-product-independent-round02/INDEX.json','Other-agent acceptance of test-oracle correction with prod bytes unchanged','Independent source/test-only scope; native219PASS/2platformSKIP component carried by exact modules+tested files, not whole app.')
proof('P04_R4_ACTUAL','.docs/implementation/evidence/p04/final-coverage-docker-20261020-round02/INDEX.json','Legacy P04-C2 r4 coverage profiles actual, not V2 semantic C2/human professional acceptance','Exact r4catalogdfb3/470 metadata remains; ownerU019 localpilot only.')
proof('C2_BASELINE_ACTUAL','.docs/implementation/reviews/p05/owner-pilot-c2-baseline-actual-independent-round01/INDEX.json','A4 native168cases baseline,84static42R20+42R100 with42 R100 expectedprestartrefusals','Not full47040/37072/336; only original assertion scope, corresponding pure module closure per A15_PREP.')
proof('FULL_RANGES_METHOD','.docs/implementation/reviews/p05/pilot-corpus-ranges-independent-round02/INDEX.json','Method/range math accepted, no full corpus result','Exact original counts/seeds/thresholds and pure-model restrictions; native auth/WS not represented.')
proof('FULL_RESUME_CARRY','.docs/implementation/reviews/p05/full-original-resume-independent-round03/INDEX.json','62 completed sealed ranges/52202rawrows carry;2547remaining before authorized resume','Actual original source labels retained; no rerun/reseed, no full section acceptance; A15 pure correspondence applies only pure consumers.')
proof('MATCHED_METHOD','.docs/implementation/reviews/p05/privacy-matched-independent-round01/INDEX.json','Matched84triplets/336models method, NOT_COVERED honest; no actual completed result','Domainmodel only; does not waive original126k/.65AUC; pending fixed actual+replay.')
proof('WIRE_METHOD','.docs/implementation/reviews/p05/public-wire-adjunct-independent-round02/INDEX.json','Wire method only, actual HTTP/WS public parity still pending','Production room/stream revisions distinct modelgame_rev; no inference from old summary-only OWS10.')
proof('LAYOUT_METHOD','.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round08/INDEX.json','Existing459=9x51 layout plus scoped realtext observations method/binding, no actual459 acceptance','Native3engine/RUEN/TR/zoom profile unchanged; final A15 tuple qualification and actual browser prerequisite separate.')
proof('OCI17_METHOD','.docs/implementation/reviews/p05/oci17-a15-binding-independent-round01/INDEX.json','OCI17 A15/B4 binding-only source/image critical81/78, original14 oracles; no actual completion granted','All producerMJS/browserquiescence/resources exact16, fresh5JSON binding; current actual17 pending at cutoff.')
proof('NORMAL_CONTINUITY_HISTORICAL','.docs/implementation/reviews/p05/normal-continuity03-actual-independent-round01/INDEX.json','A7 normal provider A→B4 startup/flagoff persistence actual component','Historical exact source labels retained; changed A15 backend means no automatic full current actual carry.')
for key,v in ai['other_agent_reviews'].items():
 id='PRIOR_'+key
 if id not in proofs:proof(id,v['path'].replace('\\','/'),'Prior independent application delta consumed by A13 audit in declared source scope','Pin only; current-source compatibility must follow SOURCE_CARRY plus subsequent accepted deltas; not reaccepted by this author.')
put('PROOFS.json',proofs)
paths=sorted({s.rsplit(':',1)[0] if s.rsplit(':',1)[-1].isdigit() else s for f in facts['rows'] for s in f['source']}|set(ai['read_source_scope_pins'])|{t['path'] for r in tri['rows'] for t in r.get('test_byte_boundary',[])})
carry={}
for path in paths:
 assert path in fr['files'];assert sha(A/path)==fr['files'][path]
 prev=sha(P/path) if (P/path).is_file() else None
 carry[path]={'A15_sha256':fr['files'][path],'A13_sha256':prev,'byteexact_A13':prev==fr['files'][path],'scope':'EXACT_FILE_COMPONENT_ONLY' if prev==fr['files'][path] else 'CHANGED_FILE_SCOPED_DELTA_REQUIRED_NO_BLANKET_CARRY'}
anchors={}
for f in facts['rows']:
 for s in f['source']:
  if s in anchors:continue
  path,sep,num=s.rpartition(':')
  if not sep or not num.isdigit():anchors[s]={'current_path':s,'A15_sha256':carry[s]['A15_sha256']};continue
  old=(P/path).read_text('utf-8-sig').splitlines();new=(A/path).read_text('utf-8-sig').splitlines();line=int(num)-1;matched=None
  for block in difflib.SequenceMatcher(None,old,new,autojunk=False).get_matching_blocks():
   if block.a<=line<block.a+block.size:matched=block.b+(line-block.a)+1;break
  anchors[s]={'A13_source':s,'A15_path':path,'A15_equal_line':matched,'line_translation':'EXACT_EQUAL_LINE_ANCHOR_NOT_WHOLE_METHOD_PROOF' if matched else 'ANCHOR_CHANGED_OR_REMOVED_SEE_ACCEPTED_DELTA','A15_sha256':carry[path]['A15_sha256']}
put('SOURCE_CARRY.json',{'source':fr['identity'],'included_files':1869,'author_not_independent_code_audit':True,'files':carry,'line_anchors':anchors,'changed_sources_require':['A15_SOCKET_DELTA','A15_WS_LOG_DELTA','A14_FRONTEND03'],'no_whole_backend_or_UI_actual_carry':True})
pending={
'ORDINARY42':{'status':'PENDING','expected':'All42 profiles (N2..8 x3modes x2contexts),840rounds plus2YB negatives; samecard/locale IDs and real470 ordinary server; current cohorts not completed at cutoff','known_component':['A15_N4_ACTUAL'],'current_actual':'root session71127 online/questions in flight at assignment; no outcome inferred'},
'BROWSER16':{'status':'PENDING','expected':'All16 existing browser functional assertions on current exact app, no oldFAIL promotion'},
'LAYOUT459':{'status':'PENDING','expected':'459 nine shards/3engines/3locales plus explicitly presentation-only representative54fields/23cards, native200 and prescribed viewport/accessibility; not all470actualUI from syntheticlongest'},
'OCI14':{'status':'PENDING','expected':'All original14 compatible rollback controls on A15/B4 exact tuple; actual17 root session96511 in flight; no result inferred'},
'FULL_C2_M3':{'status':'PENDING','expected':'Original47040static/37072trajectory/336canary/70000I/84000fairness/1000000GF/126000inference; original thresholds/seeds unchanged;62carry and1600prefix cases not rerun; remaining exact disjoint ranges+fullreducers/replay'},
'MATCHED84':{'status':'PENDING','expected':'84fixedtriplets/336models native replay; E0/E1/E2 exclusions, NOT_COVERED/refusals retained; original inference AUCnorm still mandatory'},
'WIRE':{'status':'PENDING','expected':'Accepted finite actual HTTP/WS projection/parity boundary with real stream/room revision and final private fences'},
'CLEAN_CI':{'status':'PENDING','expected':'Final coherent source stop/cleanGit+manifest+CI/final exact tuple quality; current frozen dirtySHA not cleanGitPASS'},
'FINAL_REVIEW':{'status':'PENDING','expected':'Separate nonauthor final gates/threatprivacy assembly/status reconciliation; no selfacceptance or P06 claim'}}
put('PENDING.json',pending)
rows=[]
for t,f in zip(tri['rows'],facts['rows']):
 group=f['audit_group'];runtime={'withdraw':['BROWSER16','OCI14','WIRE','LAYOUT459'],'consent':['ORDINARY42','BROWSER16','OCI14','WIRE'],'settings':['FULL_C2_M3','MATCHED84','BROWSER16'],'chat':['BROWSER16','OCI14','WIRE'],'advice':['BROWSER16','OCI14'],'content':['ORDINARY42','BROWSER16','LAYOUT459'],'deferred':['BROWSER16']}[group]
 prior=['CODE44_A13','A15_PREP_INDEPENDENT','A15_SOCKET_DELTA','A15_WS_LOG_DELTA','A14_FRONTEND03']
 if group=='settings':prior+=['C2_BASELINE_ACTUAL','FULL_RANGES_METHOD','MATCHED_METHOD']
 if group=='chat':prior+=['OCI17_METHOD','WIRE_METHOD']
 rows.append({'id':t['id'],'requirement':t['requirement'],'expected':t['expected'],'source_card_ids':t['source_card_ids'],'current_card_applicability':t['current_card_applicability'],'audit_group':group,'code':{'fact_from_scoped_A13_audit':f['fact'],'status':'SOURCE_FACT_RECONCILED_NOT_FRESH_INDEPENDENT_ACCEPTANCE','source_anchors':[anchors[s] for s in f['source']],'current_source_refs':[{'path':s.rsplit(':',1)[0] if s.rsplit(':',1)[-1].isdigit() else s,'sha256':carry[s.rsplit(':',1)[0] if s.rsplit(':',1)[-1].isdigit() else s]['A15_sha256']} for s in f['source']]},'current_tests':{'host_proof':'A15_HOST_IMAGE','host_scope':'1083PASS/204SKIP wholehost component, not44row runtime acceptance','test_files':[{'path':v['path'],'A15_sha256':carry[v['path']]['A15_sha256'],'historical_sha256':v['historical_sha256'],'byteexact_to_original_test':carry[v['path']]['A15_sha256']==v['historical_sha256']} for v in t.get('test_byte_boundary',[])]},'prior_accepted_proof_refs':prior,'carry_qualification':'Only listed source/test hashes and accepted intervening deltas, exact card applicability and scoped component assertion. Historical actual labels remain historical. Code/source/tests do not replace pending actuals.','actual_pending':runtime,'owner_scope':'U019/ADR026/029 current470 provisional localpilot content only; no professional language/legal/production approval','full_requirement_acceptance':False,'not_an_application_defect_finding':True,'historical_actual_check_ids':t.get('historical_actual_check_ids',[])})
 if group=='deferred':rows[-1]['accepted_scope_disposition']='Music-specific taste/output is owner-deferred; generic refusal/no-pressure remains applicable and not waived.'
put('REQUIREMENTS44.json',{'schema_version':1,'status':'AUTHOR_FACTS_DRAFT_NOT44_OR_STAGE_ACCEPTANCE','at_utc':now,'source_identity':fr['identity'],'included_files':1869,'rows':rows})
plan=(A/'.docs/10_IMPLEMENTATION_PLAN.md').read_text('utf-8-sig').splitlines();ux=(A/'.docs/04_UI_UX_AND_INTERACTIONS.md').read_text('utf-8-sig').splitlines()
ex=[]
for i,line in enumerate(plan):
 if 186<i+1<193 and line[:2] in ['1.','2.','3.','4.','5.']:
  n=int(line[0]);mp={1:['ORDINARY42','BROWSER16','FULL_C2_M3','CLEAN_CI'],2:['BROWSER16','OCI14'],3:['BROWSER16','OCI14','WIRE','MATCHED84','FULL_C2_M3'],4:['LAYOUT459','BROWSER16'],5:['FULL_C2_M3','MATCHED84','WIRE','FINAL_REVIEW','CLEAN_CI']}[n]
  ex.append({'id':f'EXIT-P05-{n}','text':line[3:],'norm_source':f'.docs/10_IMPLEMENTATION_PLAN.md:{i+1}','status':'PENDING_NOT_STAGE_PASS','code_source_refs':sorted({s['path'] for r in rows for s in r['code']['current_source_refs']}),'component_evidence_refs':{1:['A15_HOST_IMAGE','A15_N4_ACTUAL','C2_BASELINE_ACTUAL'],2:['CODE44_A13','A15_SOCKET_DELTA','NORMAL_CONTINUITY_HISTORICAL'],3:['CODE44_A13','A15_PREP_INDEPENDENT','A14_FRONTEND03'],4:['LAYOUT_METHOD','A14_FRONTEND03'],5:['CODE44_A13','P04_R4_ACTUAL','STORAGE_INDEPENDENT01','STORAGE_INDEPENDENT02','A15_PREP_INDEPENDENT']}[n],'actual_pending':mp,'acceptance':False})
assert len(ex)==5
scope={1:('APPLICABLE_ROOMS_CURRENT_FINAL_PROOF_PENDING',['ORDINARY42','BROWSER16'],['A15_HOST_IMAGE','A15_N4_ACTUAL']),2:('IN_PERSON_ROOM_UI_APPLICABLE_MUSIC_AND_REALPHONES_DEFERRED_OWNER',['ORDINARY42','LAYOUT459'],['A15_N4_ACTUAL']),3:('APPLICABLE_SAMEID_LOCALE_RENDERING',['ORDINARY42','BROWSER16','LAYOUT459'],['A15_N4_ACTUAL','P04_R4_ACTUAL']),4:('APPLICABLE_PRIVATE_RELATION_NO_LEAK',['BROWSER16','WIRE','FULL_C2_M3','MATCHED84'],['CODE44_A13']),5:('APPLICABLE_IMMUTABLE_SESSION_AND_NEXTSESSION_SETTINGS',['BROWSER16','ORDINARY42'],['CODE44_A13']),6:('APPLICABLE_ALLMODES_NOTAFRIEND_AND_NOEXACTID_REPEATS',['ORDINARY42','FULL_C2_M3'],['CODE44_A13','FULL_RANGES_METHOD']),7:('CINEMA_INTEGRATION_P09_DEFERRED_OWNER_GAMES_RECOVERY_STILL_APPLICABLE',['BROWSER16','OCI14'],['NORMAL_CONTINUITY_HISTORICAL']),8:('MUSIC_AUTOPLAY_REAL_IOS_ANDROID_DEFERRED_OWNER_NOT_PASS',[],[]),9:('APPLICABLE_LOCAL_DOCKER_ENGINES_NOT_REALDEVICES',['LAYOUT459','BROWSER16'],['LAYOUT_METHOD']),10:('APPLICABLE_HTTP_WS_DEGRADED_STALE_FENCES',['BROWSER16','WIRE','ORDINARY42'],['CODE44_A13','A15_SOCKET_DELTA'])}
e2e=[]
for i,line in enumerate(ux):
 if 183<=i+1<=193 and '. ' in line and line.split('. ',1)[0].isdigit():
  n=int(line.split('. ',1)[0]);s,p,proofids=scope[n];e2e.append({'id':f'E2E04-08-{n:02d}','text':line.split('. ',1)[1],'norm_source':f'.docs/04_UI_UX_AND_INTERACTIONS.md:{i+1}','scope':s,'status':'DEFERRED_OWNER_NOT_PASS' if n==8 else 'APPLICABLE_SUBSCOPE_PENDING','component_evidence_refs':proofids,'actual_pending':p,'acceptance':False})
assert len(e2e)==10
put('GATES_AND_E2E.json',{'status':'AUTHOR_MAPPING_DRAFT_NO_GATE_ACCEPTANCE','exit_p05':ex,'critical_e2e_04_section8':e2e,'scope_rules':['ADR019 standalone/localpilot, unifiedchatADR025, ownerU019ADR026/029 provisional470PASS supersede older planHOLD wording for localpilot only','Music/mobile/realdevices deferred by owner; Cinema integration remains laterP09; partial defer does not waive Rooms/Games/privacy/accessibility portions','No current42/session16/layout459/OCI14/fullC2M3/wire/matched/cleanCI/final gates are assertedPASS']})
ci=[]
for i,line in enumerate((A/'.docs/05_CI_QUALITY_AND_RELEASES.md').read_text('utf-8-sig').splitlines()):
 if line.startswith('| CI-') and line.split('|')[1].strip().startswith(('CI-R-','CI-I-','CI-P-')):
  z=[x.strip() for x in line.split('|')[1:-1]];ci.append({'id':z[0],'text':z[1],'expected_evidence':z[2],'norm_source':f'.docs/05_CI_QUALITY_AND_RELEASES.md:{i+1}','scope':'Room close/revoke applicable; media publish/RTC laterP09/P10' if z[0]=='CI-R-004' else 'APPLICABLE_LOCAL_ROOMS_GAMES','status':'PENDING_CURRENT_GATED_COMPONENT_ACCEPTANCE','component_proof_refs':['A15_HOST_IMAGE','CODE44_A13','A15_N4_ACTUAL'],'pending_refs':['ORDINARY42','BROWSER16','WIRE','FINAL_REVIEW']})
assert len(ci)==9;put('CI_RIP.json',{'status':'APPLICABILITY_MAPPING_NOT_CI_PASS','rows':ci})
norms=['.docs/10_IMPLEMENTATION_PLAN.md','.docs/04_UI_UX_AND_INTERACTIONS.md','.docs/05_CI_QUALITY_AND_RELEASES.md','.docs/implementation/user-decisions.v4.json','.docs/adr/ADR-019-standalone-local-pilot.md']
for n in ['.docs/adr/ADR-025-p05-unified-private-text-chat.md','.docs/adr/ADR-026-local-pilot-provisional-card-pass.md','.docs/adr/ADR-029-owner-provisional-local-pilot-catalog.md']:
 if (A/n).exists():norms.append(n)
inputs={'source_freeze':{'path':'.artifacts/p05-pilot-bundle-source-freeze12.json','sha256':sha(R/'.artifacts/p05-pilot-bundle-source-freeze12.json'),'identity':fr['identity'],'included_files':1869,'materialized':str(A)},'matrix':{'path':'.docs/implementation/reviews/p05/requirements44-current-triage-round02/matrix.json','sha256':sha(R/'.docs/implementation/reviews/p05/requirements44-current-triage-round02/matrix.json')},'codefacts':{'path':'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/requirements44-code-facts.json','sha256':sha(R/'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/requirements44-code-facts.json')},'norms':{n:{'sha256':sha(A/n),'same_live_bytes':sha(A/n)==sha(R/n)} for n in norms if (A/n).exists()},'no_native_tests_or_APP_changes':True,'old_traceCSV_registry_workmap_unchanged':True}
put('INPUTS.json',inputs)
checks={'44ids_text_expected_sourceCardArrays_exact':True,'19UXrows_preserved':True,'44applicability_dispositions_exact_triage':all(x['current_card_applicability']==y['current_card_applicability'] for x,y in zip(rows,tri['rows'])),'5EXIT_exact_current_norm':len(ex)==5,'10E2E_exact_current_norm':len(e2e)==10,'9CI_RIP_exact_current_norm':len(ci)==9,'mapped_source_and_tests_all_match_frozen_sha':True,'all59_requirement_EXIT_E2E_acceptance_false':all(not x['full_requirement_acceptance'] for x in rows) and all(not x['acceptance'] for x in ex+e2e),'native_runs':0,'APPwrites':0,'sourcefiles_pinned':len(carry),'proof_index_pins':len(proofs)};put('CHECKS.json',checks)
print(json.dumps(checks))
