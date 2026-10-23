"""Review-owned one-shot matrix writer; no product commands, Docker or mutation."""
from pathlib import Path
import hashlib,json,sys,zipfile
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
import stage_inventory
IDENTITY='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571'
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def sha(b):return hashlib.sha256(b).hexdigest()
files=stage_inventory.inventory(ROOT)
assert len(files)==1811 and stage_inventory.identity(files)==IDENTITY
work=load('.docs/implementation/p05-work-map.json')
assert len(work['requirements'])==44
pins={}
def ref(path,anchor=None):
 p=ROOT/path;b=p.read_bytes();result={'path':path,'bytes':len(b),'sha256':sha(b)}
 if anchor:
  lines=b.decode('utf-8').splitlines();hits=[i+1 for i,line in enumerate(lines) if anchor in line]
  assert hits,(path,anchor)
  result.update(line=hits[0],anchor=anchor)
 pins[path]={k:v for k,v in result.items() if k not in ('line','anchor')}
 return result
ALIASES={
 'G':'apps/api/src/topic-games.ts','P':'apps/web/src/topic-games-panel.tsx',
 'K':'packages/relationship-engine/src/private-conversation.ts','T':'packages/relationship-engine/src/topic-planner.ts',
 'E':'packages/relationship-engine/src/engine.ts','R':'apps/api/src/rooms.ts',
 'C':'apps/web/src/game-copy.ts','S':'apps/web/src/topic-settings.tsx',
 'L':'apps/api/src/private-topic-preferences.ts','F':'apps/api/src/topic-chat-policy.ts'}
UT={
 'kernel':('packages/relationship-engine/src/private-conversation.test.ts','makes decline terminal'),
 'silence':('packages/relationship-engine/src/private-conversation.test.ts','pending invitation expires at exactly 30s'),
 'topic':('packages/relationship-engine/src/private-conversation.test.ts','other question immediately removes prompt'),
 'new':('packages/relationship-engine/src/private-conversation.test.ts','new candidate creates new epoch'),
 'advice':('packages/relationship-engine/src/private-conversation.test.ts','withholds text, preview, hash and length'),
 'edit':('packages/relationship-engine/src/private-conversation.test.ts','editing accepted text revokes old ID'),
 'roles':('packages/relationship-engine/src/private-conversation.test.ts','only exact recipient acceptance exposes'),
 'pair':('packages/relationship-engine/src/public-pair-opt-in.test.ts','withholds the pair before either or both'),
 'condition':('packages/relationship-engine/src/consent.test.ts','bounds action lifetime to the parent'),
 'ui':('apps/web/src/topic-panel.test.ts','shows the full topic union before accept'),
 'uiAdvice':('apps/web/src/topic-panel.test.ts','receiver pending advice has generic opt-in'),
 'uiDisconnect':('apps/web/src/topic-panel.test.ts','disconnect drops private text immediately'),
 'uiCondition':('apps/web/src/topic-panel.test.ts','secondary condition uses the exact V2 shape'),
 'controls':('apps/web/src/topic-controls.test.ts','loses all ordinary conversation permissions on reconnect'),
 'semantic':('packages/relationship-engine/src/topic-planner.test.ts','binds public semantic history across mode and session'),
 'privateSemantic':('packages/relationship-engine/src/topic-planner.test.ts','filters same-pair private semantic history across modes/sessions'),
 'fair':('packages/relationship-engine/src/topic-planner.test.ts','keeps the previous actual pair across public rounds'),
 'guards':('packages/relationship-engine/src/topic-planner.test.ts','runs base guard/cap/progression profiles for2..8'),
 'veto':('packages/relationship-engine/src/topic-planner.test.ts','preserves veto and comfort/context guards'),
 'privacy':('packages/relationship-engine/src/topic-planner.test.ts','keeps full public projections identical across private settings'),
 'context':('apps/api/src/topic-context-fixture.test.ts','needs enabled chat for any online private opportunity'),
 'clock':('apps/web/src/topic-panel.test.ts','UI-R02 expires private/public/advice content'),
 'unicode':('packages/relationship-engine/src/private-conversation.test.ts','accepts exactly 1000 Unicode scalars'),
 'baseGuards':('packages/relationship-engine/src/engine.test.ts','enforces class, every actor comfort, context, stage'),
}
PACKETS={
 'TG':('engine2-topic-games-preflight-01','run/topic-games-report.json','tests/p05-topic-games'),
 'TLC':('engine2-topic-lifecycle-preflight-01','run/topic-lifecycle-report.json','tests/p05-topic-lifecycle'),
 'RT':('engine2-ordinary-runtime-preflight-01','run/report.json','tests/p05-runtime'),
 'OWS':('engine2-ordinary-ws-preflight-01','run/ordinary-ws-report.json',None),
 'TCP':('engine2-topic-chat-policy-preflight-01','run/chat-policy-report.json',None),
}
reports={}
for key,(packet,report,_producer) in PACKETS.items():
 p='.docs/implementation/evidence/p05/'+packet+'/'+report
 d=load(p);assert d['status']=='PASS';reports[key]=(p,d)
 ref('.docs/implementation/evidence/p05/'+packet+'/index.json');ref(p)
def actual(s):
 key,number=s.split(':');p,d=reports[key];wanted='P05-'+key+'-'+number
 matches=[c for c in d['checks'] if c['id']==wanted];assert len(matches)==1 and matches[0]['status']=='PASS',wanted
 result={'packet_report':ref(p),'check_id':wanted,'observed_status':'PASS','reviewer_executed':False,'scope':'AUTHOR_ACTUAL_SYNTHETIC_COMPONENT_PREFLIGHT_INSPECTED','detail':matches[0].get('detail',{})}
 return result
# Position-keyed manual mapping is checked against every immutable source ID below.
# Row observations are source review judgments, not manufactured human approval.
SPECS=[
 ('P04-UX-SKIP','MECHANISM_IMPLEMENTED','G P K','kernel controls','TG:03 TG:10',
  'Per-round skip/decline and own Pause/Stop exist without a reason field. Repeated manual skips are permitted; no automatic skip-N promise is inferred.',
  'Current ordinary/V2 browser coverage must confirm repeated refusal and button parity; the old SA10/11 proof is byte-bounded.'),
 ('P04-UX-WAIT','MECHANISM_IMPLEMENTED','G P K','silence controls','TG:10',
  'Own Pause is an explicit non-consent alternative. Pending silence expires closed, never as accept; c.wait is copy, not an independently wired wait command.',
  'Verify final UI pause/wait language without deadlines or implied return obligations; do not equate timeout with agreement.'),
 ('P04-UX-NO_REASON','MECHANISM_IMPLEMENTED','G P K','kernel privacy','TG:04 TG:13 OWS:04',
  'Decline/stop wire shapes contain no required motive, and public projection keeps private pair state generic.',
  'Final browser/private-role audit must preserve no motive disclosure; edited card language remains HOLD-bound.'),
 ('P04-UX-NO_PERSONAL_STORY','COPY_AND_REFUSAL_PARTIAL','C P','kernel','TG:10',
  'Consumer safety copy explicitly permits written or fictional answers and refusal; no truth-verification API is present.',
  'No exact reviewed real-story card acceptance is proven by synthetic tests. Verify edited content and actual RU/EN/TR meaning.'),
 ('P04-UX-PER_ACTION','MECHANISM_IMPLEMENTED','G P K','new condition','TG:04 TG:06 TG:07',
  'Room identity, invitation, topic consent and bilateral action consent have separate current scope/revision checks.',
  'Final UI must demonstrate independent actors and fresh next-round decisions on the reviewed pack.'),
 ('P04-UX-DECLINE_PERSISTS','MECHANISM_IMPLEMENTED','G K','kernel condition','TG:07',
  'Decline/stop ends current round; terminal consent cannot be revived by accept or a changed proposal.',
  'The exact alternative-after-decline user path needs final UI corroboration; existing terminal unit controls cover the invariant.'),
 ('P04-UX-SILENCE','MECHANISM_IMPLEMENTED','G K','silence condition','TG:04',
  'One acknowledgement is insufficient. Time expiry closes delivery; it never creates a completed answer or acceptance.',
  'Final browser checks must distinguish timeout/closed from agreed/completed.'),
 ('P04-UX-WITHDRAW','MECHANISM_IMPLEMENTED','G P K L','topic uiDisconnect controls','TG:08 TG:10 OWS:09',
  'Own Stop, round refusal, Other question, explicit topic exclusion and conversation Stop are available without reasons.',
  'Await current browser degradation and restore proofs; historical controls do not cover every new byte automatically.'),
 ('P04-UX-TOPIC_BOUNDARY','MECHANISM_IMPLEMENTED','G P S L','topic ui','TG:08 TLC:04 TLC:05 OWS:09',
  'Own allow/exclude picker, full multi-tag offer and Other question are distinct; external exclusions remain monotonic.',
  'Finish new source-bound UI/lifecycle/restore acceptance; semantic taxonomy and content approval remain separate.'),
 ('P04-UX-IDEA_ONLY','PARTIAL_DOMAIN_COVERAGE','G P K','edit uiAdvice','TG:05 TG:07',
  'Advice composition/editing and proposal conditions do not execute an action. Execution remains behind exact bilateral action consent.',
  'No separate saved-idea domain/entity is implemented or tested. Confirm the intended card workflow and copy; do not claim all idea/save/edit scenarios from consent invariants.'),
 ('P04-UX-READ_NOT_ACCEPT','MECHANISM_IMPLEMENTED','G K','advice roles','TG:05 TG:14 TCP:08',
  'GET/poll/chat receipt is distinct from respond_topic/respond_advice and action acceptance.',
  'No read-receipt UI is claimed. Actual repeated-poll proof is not proof of a separate delivery/read-marker feature.'),
 ('P04-UX-CHANGED_CONDITION','MECHANISM_IMPLEMENTED','G P K','condition uiCondition new','TG:07 TG:13',
  'A changed condition invalidates old topic/action acknowledgements and binds fresh exact offer/proposal revisions.',
  'Use final browser condition/replay flow and real localized reviewed conditions before full row acceptance.'),
 ('P04-UX-SHOW_SCOPE','MECHANISM_IMPLEMENTED','G P','ui uiCondition','TG:07 TG:13',
  'Both actors receive current private condition and permitted topic labels; private prompt precedes separate action acceptance.',
  'A topic-label invitation is not an action agreement. Verify complete actual action wording in final UI/content review.'),
 ('P04-UX-ADVICE_OPT_IN','MECHANISM_IMPLEMENTED','G P K','advice roles edit uiAdvice','TG:05 TG:15',
  'Recipient gets generic pending advice without text/hash/preview/length; exact opt-in reveals text and edit requires new opt-in.',
  'Await current real-browser advice paths; author actual WS adapter is explicitly not the ordinary browser WS route.'),
 ('P04-UX-NEW_INVITATION','MECHANISM_IMPLEMENTED','G P K','new ui','TG:07 TG:08',
  'Replacement topic gets a new epoch/token and zero acknowledgements; previous participation cannot accept it.',
  'Final UI must show renewed choice in both locales/actors; no retained old callbacks may activate a new topic.'),
 ('P04-UX-NO_SOCIAL_PRESSURE','COPY_AND_PRIVACY_PARTIAL','P C K','kernel privacy','TG:04 OWS:02 OWS:04',
  'The room gets generic private state, not refusal actor/motive. Private own acknowledgement feedback is not a room-wide count.',
  'Mechanical checks cannot certify absence of coercion in all edited card/UI wording; genuine language/comfort review remains open.'),
 ('P04-UX-REVIEW_TERMS','MECHANISM_IMPLEMENTED','G P K','condition uiCondition','TG:07 TG:13',
  'Current condition is pair-only and acceptance carries exact offer ID/proposal revision; stale final Finish is rejected.',
  'Final content/UI acceptance must check identical displayed terms, not merely matching wire IDs.'),
 ('P04-UX-NO_AGREEMENT_END','MECHANISM_IMPLEMENTED','G P K','kernel','TG:10',
  'Round decline, conversation Stop and session Stop are terminal exits without a compromise or reason input.',
  'Final UI acceptance should exercise unresolved discussion exit rather than only successful agreement.'),
 ('P04-UX-TASTES','DEFERRED_MEDIA_AND_CONTENT','C P','kernel','',
  'Generic refusal and no-penalty safety copy apply, but no music moderation/taste-specific product flow is implemented in P05.',
  'Owner deferred Music scope; retain this obligation for applicable reviewed cards/media stage. Do not call it implemented from a generic Skip button.'),
 ('P04-GLOBAL-COMFORT','MECHANISM_IMPLEMENTED','E G R','baseGuards guards veto','TLC:08',
  'Each snapshot player has own scalar comfort; eligibility checks every affected player. Active preferences are locked; explicit neutral withdrawal aborts participant game.',
  'Card-specific V01 and changed-comfort UI acceptance must respect immutable-session/neutral-reset policy, not mutate old snapshot.'),
 ('P04-GLOBAL-DIRECTED-RELATIONS','MECHANISM_IMPLEMENTED_STATISTICAL_GATE_PENDING','E T G','privacy pair','TG:04 OWS:04',
  'Directed edges stay per owner; common public support/generic private projection and independent public RNG avoid direct relation exposure.',
  'New ENGINE2 C2/fairness/inference is pending; deterministic noninterference units are not statistical leakage acceptance.'),
 ('P04-GLOBAL-QUIET-PUBLIC-OPT-IN','MECHANISM_IMPLEMENTED','T G P','pair privacy','TG:13',
  'Quiet public pair invitation requires exact bilateral opt-in before public addressed content; observer condition read is denied.',
  'Exact eight-player V03 ordinary-browser acceptance is still needed; historical QUIET-PUBLIC-ACK-REVOKE is scoped to older bytes.'),
 ('P04-GLOBAL-YB-CONFIRMATION','MECHANISM_IMPLEMENTED','G P K','condition uiCondition','TG:07 TG:13',
  'Secondary-owned condition resets both acknowledgements; old action refs and stale Finish cannot execute the changed condition.',
  'Real YB1111 veto meaning/TR competence remains a separate content gate.'),
 ('P04-GLOBAL-PRIVATE-CHANNEL','MECHANISM_IMPLEMENTED','E G F','context guards','TCP:01 TCP:02 TCP:03 TCP:04 TCP:05 TCP:06 TCP:12',
  'Online private eligibility needs immutable/live chat capability and current pair consent; in-person verbal private remains separately eligible without chat.',
  'Production registry is empty and V2 startup is intentionally closed under HOLD. Positive synthetic transport is not release acceptance.'),
 ('P04-GLOBAL-TEXT-ACCESSIBILITY','COPY_AND_CONTENT_PARTIAL','C P E','context','TCP:02 TCP:03',
  'UI says camera/microphone optional and permits written/fictional answers; transport does not require AV.',
  'No exact TD1001/1009/1011/YB1009 reviewed-pack browser execution or competent equivalence acceptance exists in the current synthetic packets.'),
 ('P04-GLOBAL-STAGE-INHERITANCE','MECHANISM_IMPLEMENTED','E T','baseGuards guards','TG:02',
  'eligible rejects only min_stage greater than current stage; private remains stage3+ with bilateral/comfort thresholds.',
  'Synthetic profiles verify the rule; final full sessions on approved revised pack remain blocked.'),
 ('P04-GLOBAL-SEMANTIC-EXCLUSION','MECHANISM_IMPLEMENTED_STATISTICAL_GATE_PENDING','T G','semantic privateSemantic fair','TG:09',
  'Planner binds semantic families to public and same-pair private history across modes/sessions; prior runtime history is retained.',
  'The 21-cluster authoritative map, mixed-family exclusions, reviewed pool viability and new ENGINE2 C2/fairness/inference need their own final acceptance.'),
 ('P04-GLOBAL-PRIVACY-PROMISE','CONTENT_ACCEPTANCE_BLOCKED','C P','advice','',
  'Consumer copy disclaims technical prevention of screenshots/copying/retelling; no prevention mechanism is claimed.',
  'YB1148 exact revised RU/EN/TR text remains quarantined under owner HOLD; code cannot human-approve it.'),
 ('P04-GLOBAL-TEMPLATE-AND-LANGUAGE','CONTENT_ACCEPTANCE_BLOCKED','P C','unicode ui','',
  'Prefix/context handling and explicit consent are represented by UI/contracts; Unicode input controls are mechanical only.',
  'Competent genuine RU/EN/TR edited meaning, Turkish individual veto and new content hashes have no human acceptance in these proofs.'),
 ('V01','MECHANISM_IMPLEMENTED','E G','baseGuards veto','TLC:08',
  'Independent participant comfort is enforced by eligibility/snapshot; lower peer comfort cannot be copied from P1.',
  'Run exact contrasting-comfort reviewed-card UI scenario; current actual suite is synthetic, not card-specific acceptance.'),
 ('V02','MECHANISM_IMPLEMENTED_STATISTICAL_GATE_PENDING','E T G','privacy pair','OWS:04',
  'Private directed relations remain separate and do not appear in shared payload; pair eligibility uses both directions.',
  'New inference and source-bound browser scenario needed; a stronger relationship mismatch can map to an allowed common class without revealing it.'),
 ('V03','MECHANISM_IMPLEMENTED','G P T','pair','TG:13',
  'Bilateral quiet opt-in precedes public addressed pair content; observer cannot read pair conditions.',
  'This exact eight-player case is not asserted by the three-member ordinaryWS packet. Historical eight-member proof stays older-source bounded.'),
 ('V04','MECHANISM_IMPLEMENTED','G P','condition uiCondition','TG:07 TG:13',
  'New condition resets both decisions and one actor cannot execute it by accepting alone.',
  'Final browser evidence for both free choices must be accepted on current bytes.'),
 ('V05','CONTENT_ACCEPTANCE_BLOCKED','G P K','condition kernel','TG:07',
  'Generic individual veto and condition reset exist.',
  'Actual YB1111 individual-veto RU/EN/TR equivalence, especially Turkish, requires competent review of exact new hashes; synthetic tests do not satisfy it.'),
 ('V06','CONTENT_ACCEPTANCE_BLOCKED','C P','advice','',
  'UI explicitly disclaims screenshot/copy/retelling prevention.',
  'YB1148 wording is a voluntary agreement only and remains HOLD-bound; no exact content approval inferred.'),
 ('V07','COPY_AND_CONTENT_PARTIAL','C E P','context','TCP:02 TCP:03',
  'The game transport has no mandatory AV and generic copy allows text alternatives.',
  'Execute actual TD1001/1009/YB1009 revised cards or prove filtering; current synthetic pack cannot establish those exact alternatives.'),
 ('V08','MECHANISM_IMPLEMENTED','E G F','context guards','TCP:02 TCP:03',
  'PV-C/chat-capability cards are filtered without chat; separate in-person verbal synthetic cards carry no chat requirement.',
  'Exact reviewed capability metadata/alternative acceptance remains blocked; a generic verbal card is not silently substituted as the same card.'),
 ('V09','MECHANISM_IMPLEMENTED','E T','baseGuards guards','TG:02',
  'Stage1 is a minimum threshold and inherits into stage2; private does not enter before stage3.',
  'Approve current pool/session coverage through new C2 and reviewed-pack gate.'),
 ('V10','MECHANISM_IMPLEMENTED_WITH_LOCKED_SNAPSHOT_POLICY','R G P','uiDisconnect','TG:10 TLC:08',
  'Ordinary comfort edits are locked in active sessions; explicit neutral reset aborts the participant game and revokes old scope rather than widening/mutating the snapshot.',
  'Final scenario should use the accepted ADR021 withdrawal path. No evidence claims arbitrary active comfort editing or continuation after a lower setting.'),
 ('V11','MECHANISM_IMPLEMENTED','G K P','kernel uiDisconnect','TG:10 OWS:07 OWS:09 TCP:06',
  'Own withdrawal clears private refs/chat/acks and ordinary WS denies retired/expired recipients; group payload stays generic.',
  'Final current browser/restore evidence remains needed; no prior private message may return after rollback/restart.'),
 ('V12','MECHANISM_IMPLEMENTED_STATISTICAL_GATE_PENDING','T G','fair privateSemantic','TG:09',
  'Planner keeps previous actual private pair and avoids it when an effective alternative exists; N2 recurrence is explicitly legitimate.',
  'Await new ENGINE2 fairness/C2 long-session distribution proof; do not promote older TOPIC1 statistical measurements.'),
 ('V13','MECHANISM_IMPLEMENTED_STATISTICAL_GATE_PENDING','T G','semantic privateSemantic','TG:09',
  'Cross-mode semantic-family history is checked rather than token-Jaccard or ID-only dedupe.',
  'Exact named TD/YB cluster mapping, viable approved repertoire and new ENGINE2 statistical gate remain open.'),
 ('V14','CONTENT_ACCEPTANCE_BLOCKED','P C G','unicode ui','TG:02',
  'Locale-dependent projection uses the same bound card identity; no silent locale fallback is intended.',
  'Exact YB1111/YB1054/TD1130/YB1145 role/count/veto meanings need genuine RU/EN/TR competent acceptance, not equal key sets or synthetic strings.'),
 ('V15','MECHANISM_IMPLEMENTED','G P K','kernel controls','TG:10',
  'Outside-card safety controls offer reason-free refusal/Stop; no response reason field is required.',
  'Final browser must prove repeated boundary-card refusal under current bytes and acceptable content; no penalty/pressure may be inferred from silence.'),
]
assert len(SPECS)==44
rows=[]
for req,spec in zip(work['requirements'],SPECS):
 id,status,impl,units,evidence,observation,gap=spec;assert req['id']==id
 ir=[ref(ALIASES[k]) for k in impl.split()]
 tr=[{**ref(*UT[k]),'independently_executed_in_173_suite':UT[k][0] in load(str((OUT/'independent-host-probes.json').relative_to(ROOT)))['selected_test_files']} for k in units.split()]
 er=[actual(s) for s in evidence.split()]
 rows.append({'id':id,'requirement':req['requirement'],'expected':req.get('expected'),'source_card_ids':req.get('source_card_ids',[]),'implementation_assessment':status,'implementation_refs':ir,'observation':observation,'current_test_refs':tr,'current_actual_evidence_refs':er,'independent_accepted':{'full_requirement':False,'scope':'COVERAGE_REVIEW_NOT_PRODUCT_HUMAN_OR_STAGE_ACCEPTANCE','current_mechanism_source_reviewed':True,'exact_current_unit_subset_executed':any(t['independently_executed_in_173_suite'] for t in tr),'actual_runtime_cases_reexecuted_by_this_reviewer':False},'remaining_gap':gap,'required_action':'Complete row-specific gap and reviewed-pack dependency; obtain independent gate acceptance without fabricating owner/language approval.'})
matrix={'schema_version':1,'review_id':'P05-REQUIREMENTS-COVERAGE-ROUND01','status':'COVERAGE_AUDIT_COMPLETE_NOT_STAGE_ACCEPTANCE','source_head_context':'b5436cde02dd09aa049ce0103cab58d9642e8c70','source_identity':IDENTITY,'included_files':1811,'dirty_source':True,'source_archive':'.docs/implementation/evidence/p05/engine2-source-freeze-01/included-source.zip','source_archive_sha256':'5a622f20a18c427cde591b0f0f78a61f52b892b7dec3fff5ff14833d532b82af','work_map':ref('.docs/implementation/p05-work-map.json'),'rows':rows,'global_open_inputs':['OWNER450_HOLD_AND_NO_REVIEWED_PACK','GENUINE_COMPETENT_RU_EN_TR_ACCEPTANCE','CURRENT_ENGINE2_BROWSER_AND_M3_AND_RESTORE_ACCEPTANCE_PENDING','CLEAN_SOURCE_FINAL_FREEZE_AND_COMPLETE_G1_GATE_PENDING'],'confirmed_new_source_findings':[],'full_exit_p05':False}
assert not (OUT/'matrix.json').exists()
(OUT/'matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Preserve exact old/current boundaries without inheriting the old review's PASS.
historical=[]
for name,key in [('planner-targeted-round01.json','inputs'),('planner-round-01.inputs.json',None)]:
 p='.docs/implementation/reviews/p05/'+name;d=load(p);inputs=d if key is None else d[key];same=[];changed=[]
 for x in inputs:
  current=files.get(x['path']);(same if current==x['sha256'] else changed).append({'path':x['path'],'reviewed_sha256':x['sha256'],'current_sha256':current})
 historical.append({'review':ref(p),'same_inputs':same,'changed_inputs':changed,'whole_component_pass_inherited':False})
historical.append({'review':ref('.docs/implementation/reviews/p05/kernel-round-02.json'),'kernel_exact_bytes_unchanged':files['packages/relationship-engine/src/private-conversation.ts']=='57d33ce1af14b4a3a69979a004a7c7122e529f2420ce99cb678089361120ccfd','boundary':'Pure kernel only; export/runtime/integration changes are outside the historical acceptance.'})
for p in ['.docs/implementation/reviews/p05/role-round-06.md','.docs/implementation/reviews/p05/topic-games-round02.md','.docs/implementation/reviews/p05/topic-lifecycle-round01.md','.docs/implementation/reviews/p05/topic-map-round-02.md','.docs/implementation/evidence/p05/browser-matrix-preflight-01/index.json','.docs/implementation/evidence/p05/topic-browser-preflight-02/index.json']:
 historical.append({'review':ref(p),'whole_component_pass_inherited':False,'boundary':'Historical identity/bytes stated in original report; not the current whole-source identity and not promoted to current PASS.'})
(OUT/'historical-boundaries.json').write_text(json.dumps(historical,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for p in ['.docs/10_IMPLEMENTATION_PLAN.md','.docs/04_UI_UX_AND_INTERACTIONS.md','.docs/implementation/evidence/p05/engine2-source-freeze-01/index.json','.docs/implementation/evidence/p05/engine2-source-freeze-01/inputs.json','.docs/implementation/p05-source-revisions.json','AGENTS.md']:
 ref(p)
(OUT/'input-pins.json').write_text(json.dumps({'source_identity':IDENTITY,'pins':list(pins.values())},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert stage_inventory.inventory(ROOT)==files
print(json.dumps({'rows':len(rows),'full_requirement_acceptances':0,'input_pins':len(pins),'confirmed_new_source_findings':0,'source_unchanged':True}))
