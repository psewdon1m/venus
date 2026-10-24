from pathlib import Path
import hashlib,json
from datetime import datetime,timezone
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source10';out=r/'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01';assert not out.exists();out.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
freeze=r/'.artifacts/p05-pilot-bundle-source-freeze10.json';f=json.loads(freeze.read_bytes());assert f['identity']=='5be635651557399fb9ef865ebd17c813fdf0c0eda8fc96f76a3840894cef039a' and len(f['files'])==1863
for n,h in f['files'].items():assert sha(s/n)==h
files=['apps/api/src/topic-games.ts','apps/api/src/topic-game-routes.ts','apps/api/src/topic-game-model.ts','apps/api/src/topic-game-source.ts','apps/api/src/topic-runtime.ts','apps/api/src/topic-history-cache.ts','apps/api/src/topic-snapshot-cache.ts','apps/api/src/topic-chat-policy.ts','apps/api/src/private-topic-preferences.ts','apps/api/src/private-topic-ledger.ts','apps/api/src/topic-room-lifecycle.ts','apps/api/src/topic-room-registry.ts','apps/api/src/topic-room-directories.ts','apps/api/src/rooms.ts','apps/api/src/room-routes.ts','apps/api/src/room-games.ts','apps/api/src/http-delivery.ts','apps/api/src/security.ts','apps/api/src/app.ts','apps/api/src/request-error-diagnostic.ts','apps/api/src/entry-profile.ts','apps/api/src/server.ts','apps/api/src/backup.ts','packages/relationship-engine/src/topic-planner.ts','packages/relationship-engine/src/private-conversation.ts','apps/web/src/main.tsx','apps/web/src/api.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/topic-settings.tsx','apps/web/src/room-shell.tsx','infra/venus/compose.yml']
sourcepins={n:{'bytes':(s/n).stat().st_size,'sha256':sha(s/n)} for n in files}
for sub in ['migrations','game-migrations','private-topic-migrations','chat-migrations']:
 for q in (s/'apps/api'/sub).glob('*.sql'):sourcepins[q.relative_to(s).as_posix()]={'bytes':q.stat().st_size,'sha256':sha(q)}
names=['owner-provisional-pilot-independent-round01','unified-chat-independent-round01','private-yesbut-condition-independent-round01','coherent-round-view-product-independent-repeat02','cache-own-exclusion-app-independent-round01','topic-history-cache-independent-round01','safe-request-failure-independent-round02','ephemeral-lock-fsync-product-independent-round01','ephemeral-lock-fsync-product-independent-round02']
reviews={}
for n in names:
 p=r/'.docs/implementation/reviews/p05'/n/'INDEX.json';v=json.loads(p.read_bytes());rows=v.get('files',{})
 if isinstance(rows,dict):rows=[{'path':k,**(x if isinstance(x,dict) else {'sha256':x})} for k,x in rows.items()]
 for row in rows:
  q=p.parent/row['path'];assert sha(q)==row['sha256']
  if 'bytes' in row:assert q.stat().st_size==row['bytes']
 reviews[n]={'path':str(p.relative_to(r)),'sha256':sha(p),'children_verified':len(rows),'role':'OTHER_AGENT_ACCEPTANCE_CONSUMED_IN_ITS_DECLARED_SOURCE_SCOPE_NOT_REEXECUTED'}
norms=['.docs/10_IMPLEMENTATION_PLAN.md','.docs/adr/ADR-005-retention.md','.docs/adr/ADR-023-p05-room-topic-safety-lifecycle.md','.docs/adr/ADR-025-p05-unified-private-text-chat.md','.docs/adr/ADR-026-local-pilot-provisional-card-pass.md','.docs/adr/ADR-029-owner-provisional-local-pilot-catalog.md','.docs/implementation/user-decisions.v4.json','.docs/implementation/p05-registry.json','.docs/implementation/p05-work-map.json']
normpins={n:{'bytes':(r/n).stat().st_size,'sha256':sha(r/n)} for n in norms}
old=r/'.docs/implementation/reviews/p05/normal-continuity03-actual-independent-round01/requirements44-inventory.json';prior=json.loads(old.read_bytes());registry=json.loads((r/'.docs/implementation/p05-registry.json').read_bytes());assert len(registry['requirements'])==len(prior['rows'])==44
groups={
 'consent':['P04-UX-PER_ACTION','P04-UX-DECLINE_PERSISTS','P04-UX-SILENCE','P04-UX-READ_NOT_ACCEPT','P04-UX-CHANGED_CONDITION','P04-UX-SHOW_SCOPE','P04-UX-NEW_INVITATION','P04-UX-REVIEW_TERMS','P04-GLOBAL-QUIET-PUBLIC-OPT-IN','P04-GLOBAL-YB-CONFIRMATION','V03','V04','V05'],
 'withdraw':['P04-UX-SKIP','P04-UX-WAIT','P04-UX-NO_REASON','P04-UX-WITHDRAW','P04-UX-NO_AGREEMENT_END','V11','V15'],
 'settings':['P04-UX-TOPIC_BOUNDARY','P04-GLOBAL-COMFORT','P04-GLOBAL-DIRECTED-RELATIONS','P04-GLOBAL-STAGE-INHERITANCE','P04-GLOBAL-SEMANTIC-EXCLUSION','V01','V02','V09','V10','V12','V13'],
 'chat':['P04-GLOBAL-PRIVATE-CHANNEL','V08'],
 'advice':['P04-UX-ADVICE_OPT_IN','P04-UX-IDEA_ONLY'],
 'content':['P04-UX-NO_PERSONAL_STORY','P04-UX-NO_SOCIAL_PRESSURE','P04-GLOBAL-TEXT-ACCESSIBILITY','P04-GLOBAL-PRIVACY-PROMISE','P04-GLOBAL-TEMPLATE-AND-LANGUAGE','V06','V07','V14'],
 'deferred':['P04-UX-TASTES']}
facts={
 'consent':{'source':['apps/api/src/topic-games.ts:154','apps/api/src/topic-games.ts:163','apps/api/src/topic-games.ts:166','packages/relationship-engine/src/private-conversation.ts:332'],'fact':'Actor-only current-round transitions; invitation, topic, action and advice offers remain separate; content edits reset acknowledgements; reads are projections, not accepts.'},
 'withdraw':{'source':['apps/api/src/topic-games.ts:163','apps/api/src/topic-games.ts:169','apps/api/src/topic-games.ts:233','apps/web/src/topic-games-panel.tsx:61'],'fact':'Safety Stop/Pause/skip/decline paths need no private motive; clear conversation/chat/projections and do not require ordinary content readiness.'},
 'settings':{'source':['apps/api/src/private-topic-preferences.ts:106','apps/api/src/topic-games.ts:289','packages/relationship-engine/src/topic-planner.ts:9'],'fact':'Room/member-scoped authenticated safety, immutable baseline and monotonic exclusions; source implements separate public/private history domains. Fairness/inference numerical acceptance remains a separate original measurement obligation.'},
 'chat':{'source':['apps/api/src/topic-games.ts:44','apps/api/src/topic-games.ts:49','apps/api/src/topic-games.ts:282'],'fact':'Both contexts require live operator flag and frozen capability; actor/current source/epoch/consent/TTL and quota apply. ADR025 supersedes old verbal-IP allowance, not historical snapshot expansion.'},
 'advice':{'source':['packages/relationship-engine/src/private-conversation.ts:307','packages/relationship-engine/src/private-conversation.ts:332','apps/web/src/topic-games-panel.tsx:69'],'fact':'Pending advice text stays hidden to recipient; accepted revision/epoch exposes it, withdrawal/change clears it. Draft/editing is not consent. No saved-idea feature is offered.'},
 'content':{'source':['apps/web/src/topic-games-panel.tsx:82','apps/api/src/topic-game-model.ts:50','apps/web/src/main.tsx:68'],'fact':'Application preserves card identity/locale/role rendering and neutral consent/refusal controls. U019470 provisional local-pilot content PASS retained; no new professional semantic/language or all470 actual UI acceptance is asserted.'},
 'deferred':{'source':['.docs/10_IMPLEMENTATION_PLAN.md'],'fact':'Music-specific acceptance deferred by owner; generic refusal/no-pressure rules stay applicable, no new feature required.'}}
rows=[]
for row in registry['requirements']:
 oldrow=next(v for v in prior['rows'] if v['id']==row['id'])
 for k in ['requirement','expected','source_card_ids']:assert oldrow.get(k)==row.get(k),(row['id'],k)
 matches=[k for k,v in groups.items() if row['id'] in v];assert len(matches)==1,row['id'];g=matches[0]
 rows.append({'id':row['id'],'requirement':row.get('requirement'),'expected':row.get('expected'),'source_card_ids':row.get('source_card_ids'),'retired_trigger_disposition':oldrow.get('retired_trigger_disposition'),'audit_group':g,**facts[g],'assessment':'NO_NEW_ACTIONABLE_CODE_FINDING_WITHIN_FOCUSED_A13_REVIEW','full_requirement_or_stage_acceptance':False})
put=lambda n,v:(out/n).write_bytes((json.dumps(v,indent=2,ensure_ascii=True)+'\n').encode())
put('INPUTS.json',{'at_utc':datetime.now(timezone.utc).isoformat(),'frozen_source':str(s),'source_identity':f['identity'],'source_freeze_sha256':sha(freeze),'all1863_source_bytes_verified':True,'read_source_scope_pins':sourcepins,'other_agent_reviews':reviews,'normative_pins':normpins,'prior44_inventory_sha256':sha(old),'own_method_acceptance_excluded':['wire','matched','bindings'],'prior_own_app_delta_acceptance':'CONSUME_OTHER_AGENT_REVIEWS_NOT_SELF_ACCEPTANCE','no_native_or_retests':True})
put('requirements44-code-facts.json',{'status':'SCOPED_CODE_FACTS_NOT_FULL44_ACCEPTANCE','requirements':44,'movedUX':19,'IDs_text_expected_sourceCardTriggers_equal_previous_inventory_and_registry':True,'rows':rows})
print(json.dumps({'status':'INPUTS_PINNED_FOCUSED_CODE_AUDIT_NO_RUN','source1863':True,'source_scope_files':len(sourcepins),'other_reviews':len(reviews),'requirements':len(rows)},indent=2))
