"""Review-owned report finalization; writes only new files under this directory."""
from pathlib import Path
import hashlib,json,sys,collections
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4]
sys.path.insert(0,str(ROOT/'tools'));import stage_inventory
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(name,value):
 p=OUT/name;assert not p.exists();p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
matrix=read(OUT/'matrix.json');identity=matrix['source_identity']
assert stage_inventory.identity(stage_inventory.inventory(ROOT))==identity
exit_rows=[
 {'gate':'EXIT-P05-1','accepted':False,'implemented_scope':'Rooms/Games setup, immutable snapshots, three game modes, own controls and versioned topic/advice mechanisms exist. TG02 completes all three modes on synthetic three-member fixture; pure173-suite guard profiles cover2..8/both contexts.','exact_current_evidence':['TG02','TG03','TG06','TG07','TG09','173 current independent host controls'],'remaining':'All10 applicable critical scenarios, relevant CI-R/I/P, complete2..8×three modes×both contexts on a reviewed revised pack, genuine language/content acceptance and new ENGINE2 C2/fairness/inference are not fully accepted. Pending producer runs are known work, not reported source defects.'},
 {'gate':'EXIT-P05-2','accepted':False,'implemented_scope':'Identity-bound snapshots/transport cache, explicit degraded-state UI and recipient safety controls; TLC09 retirement blocks stale restored credentials, TG17 distinct-process boot clears private epochs while retaining history.','exact_current_evidence':['TG10','TG16','TG17','TLC09','TLC14','TLC15','TLC16','OWS07','OWS08','173 current host controls'],'remaining':'Current ordinary3-engine and V2 browser/reconnect/tab/duplicate-name paths need final evidence and independent acceptance. TLC16 is same-process boot barrier; it must not be renamed actual API process restart. Full-file restore14 producer is pending.'},
 {'gate':'EXIT-P05-3','accepted':False,'implemented_scope':'Current actor-only HTTP/ordinary WS, bilateral topic/action consent, chat capability/context/TTL/quota/revoke and final-enqueue checks are implemented and have actual synthetic component reports.','exact_current_evidence':['TG04','TG05','TG15','TG16','OWS01-10','TCP01-12','TLC09-16'],'remaining':'This review inspected actual packets but did not rerun Docker/HTTP/WS. Fresh independent privacy/lifecycle/browser gate acceptance and full restore proof are still required. TG15 uses an explicit WS fixture adapter; actual ordinary WS is the separate OWS packet.'},
 {'gate':'EXIT-P05-4 / PLAN-P05-LOCAL-UI','accepted':False,'implemented_scope':'Current UI controls/cache code and173 selected host units pass; historical full3-engine layout packet30groups/216cells/27native checks exists at46bf278..., not currentef009b....','exact_current_evidence':['independent-host-probes.json','historical-boundaries.json'],'remaining':'Root is running the current ordinary3-engine/base matrix and V2Chromium16. Await complete widths320/375/768/1024/1440/1920, landscape/small height, actual native zoom200%, keyboard/reduced motion/contrast/hidden-scroll/RU-EN-TR records and independent review. CSS zoom is not native browser zoom. Real Safari/devices remain owner-deferred scope, not PASS.'},
 {'gate':'EXIT-P05-5 / PLAN-P05-AGE / ADR005-006-007-019','accepted':False,'implemented_scope':'TLC02/03 and RT03 enforce separate explicit18+ and versioned mock offer; RT03 shows rejected admission creates no rows. Protected room lifecycle and maintenance keep retired credentials blocked and preserve original retirement time.','exact_current_evidence':['TLC02','TLC03','TLC12','RT03','TCP01-12'],'remaining':'Complete source-bound threat/privacy review, retention/backup boundary evidence and applicable lifecycle/restore checks. Parent retains owner450HOLD and no reviewed revised pack. Mock notice is not real legal approval; backup≤7d external-file responsibility must not be asserted beyond observed evidence.'}
]
e2e=[
 {'scenario':1,'status':'CURRENT_BROWSER_PENDING','evidence':'Producer P05-01-CAPACITY-IDENTITY; TLC09/OWS07 provide bounded backend identity retirement only. Historical browser PASS is different bytes.'},
 {'scenario':2,'status':'MUSIC_OWNER_DEFERRED_PARTIAL_ROOM_SCOPE','evidence':'Room in_person and synthetic private verbal capability are covered by TCP02/03; designated music output/8-speaker behavior is Music, DEFERRED_OWNER, not P05 PASS.'},
 {'scenario':3,'status':'CURRENT_BROWSER_AND_LANGUAGE_PENDING','evidence':'Producer P05-03-05-09-10-LOCALIZED-GAME; TG02 covers same bound synthetic projection, not genuine reviewed RU/EN/TR content.'},
 {'scenario':4,'status':'MECHANISM_COMPONENT_PROOFS_NOT_FULL_ACCEPTANCE','evidence':'Engine directed edges/comfort/private projection and OWS02-04; actual final browser/inference acceptance pending.'},
 {'scenario':5,'status':'MECHANISM_COMPONENT_PROOFS_NOT_FULL_ACCEPTANCE','evidence':'Rooms.mutate rejects GAME_SETTINGS_LOCKED; ADR021 neutral reset is explicit abort, not mutable snapshot. Current browser path pending.'},
 {'scenario':6,'status':'MECHANISM_COMPONENT_PROOFS_NOT_FULL_ACCEPTANCE','evidence':'Current host guard tests and producer P05-06-NOT-A-FRIEND-ALL-MODES; reviewed-pack/full current browser pending.'},
 {'scenario':7,'status':'MEDIA_CROSS_MODULE_FUTURE_SCOPE','evidence':'Cinema/Calls later stages and Music owner-deferred. No fabricated current cross-module PASS; user explicitly directs STOP after P05.'},
 {'scenario':8,'status':'OWNER_DEFERRED_REAL_DEVICES_AND_MUSIC','evidence':'Actual iOS/Android autoplay/media unlock not claimed from desktop engine matrix; deferred scope is not PASS.'},
 {'scenario':9,'status':'CURRENT_3ENGINE_MATRIX_PENDING','evidence':'Historical30/216/27 different-byte proof, current host controls173, pending root actual matrix.'},
 {'scenario':10,'status':'CURRENT_BROWSER_PENDING_WITH_BACKEND_COMPONENT_SUPPORT','evidence':'Host UI cache controls and TG16/OWS10 final awaits; pending actual current ordinary/V2 browser degradation cases.'}
]
write('exit-p05.json',{'schema_version':1,'source_identity':identity,'active_plan':'.docs/10_IMPLEMENTATION_PLAN.md','active_scope':'standalone-local-pilot-v2 / ADR019','rows':exit_rows,'critical_e2e_scenarios':e2e,'full_exit_p05':False,'owner_450_hold':True,'reviewed_pack_accepted':False,'genuine_language_acceptance':False,'no_production_or_real_device_claim':True})
counts=dict(collections.Counter(r['implementation_assessment'] for r in matrix['rows']))
table='\n'.join('| '+r['id']+' | '+r['implementation_assessment']+' | '+(', '.join(e['check_id'] for e in r['current_actual_evidence_refs']) or 'No exact current actual card-specific proof')+' |' for r in matrix['rows'])
text='''# P05 · independent requirements coverage, round01

**COVERAGE_AUDIT_COMPLETE; FULL EXIT-P05 NOT ACCEPTED.** Reviewer `/root/p04_gate_preflight`, 2026-10-19 UTC. No new confirmed P1/P2 source defect was found in this requirements/traceability review. This is a bounded coverage judgment, not a universal absence-of-bugs claim or a human approval.

## Exact source and actions

Frozen dirty candidate identity `ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571`,1811 included files; contextual HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70`. I independently verified every current included file against freeze inputs and every unique archive entry. ZIP SHA256 `5a622f20a18c427cde591b0f0f78a61f52b892b7dec3fff5ff14833d532b82af`. It is a recoverable dirty candidate, not clean committed-source acceptance. Included source remained unchanged through review.

I read all44 requirements and the active EXIT-P05/G1, then inspected relevant source/contracts/test names and current Games20/lifecycle16/runtime8/ordinaryWS10/topicchat12 reports. All144 indexed child descriptors across those five packets plus host packet match actual length/SHA. These are author/root actual executions inspected by me; I did not run Docker or send any product request.

I independently executed eight current host test files: **173PASS/0FAIL**, exit0, exact identity unchanged. These include actual pure consent/conversation/planner modules, API context eligibility and actual TSX through explicit hook/API/clock doubles. They are not real-browser, PostgreSQL, network, translation or human-content acceptance. Exact command and raw output are preserved in [independent-host-probes.json](independent-host-probes.json) and [independent-host-probes.txt](independent-host-probes.txt).

## Per-row matrix and interpretation

[matrix.json](matrix.json) preserves all44 original IDs/text/expected values, exact implementation/test refs with raw hashes and line anchors, current actual check IDs/details, independent execution flags and a concrete remaining gap/action for every row. **No whole requirement is marked independently accepted while its required product/content evidence is incomplete.** A mechanism being implemented is distinct from the full row being accepted. Source-only controls remain explicitly bounded/inert.

| Requirement | Current implementation assessment | Exact current actual component IDs inspected |
| --- | --- | --- |
'''+table+'''

## EXIT-P05 and meaningful remaining work

[exit-p05.json](exit-p05.json) maps all five G1 clauses and all10 original critical E2E scenarios. All five remain unaccepted in this audit. Root's ordinary3-engine/base browser matrix, V2Chromium16, restore14 and new ENGINE2 M3/C2/fairness/inference producers are known ongoing work. Their present pending state is not a new source finding and is not duplicated as a new bug. Add their immutable source-bound results and independent acceptance in a later round; do not rewrite this report to claim runs that were not available during inspection.

The original owner450 **HOLD** is unchanged. Production approved registries remain untouched. A real reviewed revised pack and competent genuine RU/EN/TR meaning/role/veto acceptance are absent from these synthetic technical packets. In particular YB1111/YB1148 and the named text-alternative/locale scenarios V05/V06/V07/V14 cannot become accepted from generic consent code, equal locale keys, Unicode tests or an agent's translation judgment.

Two narrower completeness limits are explicit: IDEA_ONLY has composition/proposal/action separation but no dedicated saved-idea domain/entity proof; TASTES has generic refusal/no-penalty handling but no music-specific moderation/taste flow, and Music is owner-deferred. These are retained row obligations/acceptance gaps, not newly reproduced safety defects. WAIT uses explicit Pause as a non-consent alternative; no separate wait command or automatic consent is claimed. Repeated manual per-round skips are supported; an unrequested automatic skip-N feature is not invented.

Active comfort settings are immutable; the supported safety change is ADR021 explicit neutral reset aborting the participant game. V10 must be verified through that policy, without silently modifying an old snapshot. Card-specific new conditions still require both exact current decisions before execution.

The active standalone ADR019 supersedes obsolete external Updater/SFU/production-host blockers. Music and real mobile devices are owner-deferred; Cinema/Calls cross-module scenarios remain later-stage work. They are not called PASS. This task does not resume P06–P11; root retains the user's P05-only/STOP instruction.

## Historical byte boundaries

[historical-boundaries.json](historical-boundaries.json) records raw old/current input comparisons. The targeted planner historical report matches14 inputs but its planner/test bytes changed; the old planner input report matches2 and also changed planner/test bytes. Neither whole historical PASS is inherited by ENGINE2. The pure kernel module still matches its recorded57d33ce... bytes, but export/runtime/lifecycle composition is outside that old pure-module scope. The present173 independent controls are separate current-source evidence.

Historical role-round06, Games round02, lifecycle round01, topic-map round02 and browser46bf278... results retain their original scopes/identities. Earlier browser FAIL at895fb30... is preserved and is not promoted into a newly discovered current-source defect; the replacement current run is already owned by root. Unit pass, actual component pass, scoped independent review, human approval, clean-source acceptance and full-stage PASS remain distinct.

## Review ownership and rollback

Only this review directory and the reviewer's own journal were written. No included source, product/test implementation, approved registry, another journal or FILE_MANIFEST was changed. Root updates any derived manifest/status. The review introduces no application state, so reverting its own reports/journal needs no runtime recovery. Actual P05 rollback still requires the compatible UI/API/engine/pack set and retained external authority; this audit does not claim that recovery drill ran.
'''
p=OUT/'report.md';assert not p.exists();p.write_text(text,encoding='utf-8')
write('review.json',{'schema_version':1,'reviewer_id':'/root/p04_gate_preflight','scope':'P05_44_REQUIREMENTS_AND_ACTIVE_EXIT_P05_COVERAGE_ONLY','status':'COVERAGE_AUDIT_COMPLETE_NOT_STAGE_ACCEPTANCE','source_head_context':'b5436cde02dd09aa049ce0103cab58d9642e8c70','source_identity':identity,'included_files':1811,'dirty_source':True,'independent_tests_pass':173,'independent_tests_fail':0,'actual_docker_rerun_by_reviewer':False,'product_requests_by_reviewer':False,'confirmed_new_p1_p2_findings':[],'requirements_count':44,'full_requirement_acceptances':0,'assessment_counts':counts,'owner450_hold':True,'human_content_approval':False,'full_exit_p05':False,'report_path':p.relative_to(ROOT).as_posix(),'report_sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
index={'schema_version':1,'review_id':'P05-REQUIREMENTS-COVERAGE-ROUND01','source_identity':identity,'source_archive_sha256':matrix['source_archive_sha256'],'full_stage_acceptance':False,'files':[{'path':p.name,'bytes':len(p.read_bytes()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.iterdir()) if p.is_file() and p.name!='index.json']}
write('index.json',index)
assert stage_inventory.identity(stage_inventory.inventory(ROOT))==identity
print(json.dumps({'rows':44,'independent_host_pass':173,'new_source_findings':0,'full_stage_acceptance':False,'output_files':len(index['files']),'source_unchanged':True}))
