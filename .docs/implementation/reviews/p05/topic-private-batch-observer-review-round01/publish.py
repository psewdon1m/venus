from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys,shutil
sys.path.insert(0,'tools');import stage_inventory
r=Path.cwd();p=r/'.artifacts/p05-private-batch-observer02';work=r/'.artifacts/p05-private-batch-observer-review-round01';out=r/'.docs/implementation/reviews/p05/topic-private-batch-observer-review-round01'
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest();read=lambda x:json.loads(x.read_text(encoding='utf-8'))
assert sha(p/'HANDOFF.json')=='ef0822e232618baec37e5f8e61ab5051e105f9b15c5e83207107c4d1dc757095'
assert sha(p/'INDEX.json')=='a4aef6777f9c59c4e33aea97686e19113a08baf241a1248cc1debfb19b89a99a'
h=read(p/'HANDOFF.json');assert len(h['files'])==8
for n,v in h['files'].items():assert sha(p/n)==v
assert sha(p/'private-batch-observer.mjs')=='182889b0d5b6b8085e3ad4a26f8686b4a98a8319d67b15c7e5d40621e207926c'
inv=stage_inventory.inventory();assert len(inv)==1813 and stage_inventory.identity(inv)==h['source_identity']
image=r/'.docs/implementation/evidence/p05/observer-image-pins-preflight-01';assert sha(image/'index.json')=='68016ab14171d501d58bc9de2a3cf114c2701d1b413d4fd09ed4f082925a5827'
for f in read(image/'index.json')['files']:assert sha(image/f['path'])==f['sha256'] and (image/f['path']).stat().st_size==f['bytes']
pins=read(image/'pins.json');assert len(pins)==4
for n,v in pins.items():assert inv[n]==v
assert not out.exists();out.mkdir(parents=True)
for f in work.iterdir():
 if f.is_file():shutil.copyfile(f,out/f.name)
inputs=out/'inputs';inputs.mkdir()
for n in h['files']:
 # Original README relative references remain bytes, not a new rendered Markdown origin.
 shutil.copyfile(p/n,inputs/(n+'.bytes' if n.endswith('.md') else n))
shutil.copyfile(p/'HANDOFF.json',inputs/'HANDOFF.json');shutil.copyfile(p/'INDEX.json',inputs/'AUTHOR_INDEX.json')
shutil.copyfile(image/'index.json',inputs/'IMAGE_INDEX.json');shutil.copyfile(image/'pins.json',inputs/'image-pins.json')
text='''# P05 private batch observer02: independent review, round01

**CHANGES_REQUESTED: two P2 observer findings.** Exact code remains frozen and NOT_RUN. No product defect or actual browser result is claimed. Own independent nine controls reproduce both gaps and verify ordered positives, real production validator/model use, wrong-own rejection, privacy of returned snapshots, two headless actors and later same-revision recovery.

Inputs: HANDOFF `ef0822e232618baec37e5f8e61ab5051e105f9b15c5e83207107c4d1dc757095`; author INDEX `a4aef6777f9c59c4e33aea97686e19113a08baf241a1248cc1debfb19b89a99a`/8; module `182889b0d5b6b8085e3ad4a26f8686b4a98a8319d67b15c7e5d40621e207926c`. All eight author files verified. Current source1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad/1813 verified. [Root image proof](../../../evidence/p05/observer-image-pins-preflight-01/index.json) index68016ab14171d501d58bc9de2a3cf114c2701d1b413d4fd09ed4f082925a5827 and its five child hashes verified; four frontend source pins equal host included inventory forff371. This reviewer did not re-extract the image or execute Docker. Author34 controls/syntax/lint are supplied author evidence, not substituted for independent checks.

## OBS-R01 — P2: Node response-body order creates false scope mismatch

At every GET request, `record.ui` snapshots `currentScope(s)`. A self-actions request fixes `b.scope` from that value. However `s.current` updates only after the Node observer's `await response.body()` resolves. The real browser can already have parsed current and started self-actions before that independent observer finishes its body read. This legitimate ordering gives the new batch a null scope on first load or the previous revision on a transition.

`finish` then insists that batch scope and every request-start `ui` equal the now-current scope. Even if actual current/own/target/conversation/chat DTOs all agree exactly, the batch is permanently rejected as SCOPE_MISMATCH. Current-body completion does not reconcile or rebind it. Another full ordinary cycle at the same revision is required. This is a conservative false negative, not unauthorized readiness, but it adds a systematic serial cycle at precisely the post-mutation preparation boundary the producer needs to measure.

Independent counterexamples hold only the Node current-body promise while emitting the next ordinary own request, then release current before target/conversation/chat. All raw DTOs are identical to the ordered positive; all required parts exist and own5s is valid. The first batch rejects on cold load and on a new revision; an ordered subsequent same-revision batch succeeds. Two headless actors reproduce concurrently with no bringToFront. A bounded schedule has first valid full batch at4500ms from phase start1000ms, own elapsed3400ms; the unnecessary second batch reaches readiness9700ms, own elapsed3400ms, beyond the existing phase deadline9000ms. No HTTP/lease was itself too slow. This is an inert ordering schedule, not a claim about actual Playwright timing on a specific saved browser run.

Correction: associate the ordinary own batch with the relevant latest-started current request record, defer scope resolution until that validated current DTO is available, and reconcile after each relevant part completion. Derive scope only after exact current/own/private DTO agreement with actor identity and routes. Do not relabel request-start observed UI as actual React state or use route identifiers as a fallback authority. Require a new independent late-body/transition/stale-current repeat before integration. Preserve generation/WS/phase/lease fences and the original8s budget.

## OBS-R02 — P2: own metadata callback forwards unvalidated nested raw fields

The own-response path invokes `onProjection` before `validSelfActions` runs in `finish`, forwarding `body.session_actions`, `body.round_actions` and `body.conversation_actions` by reference. These nested objects are not projected to allowed boolean keys. An invalid DTO can therefore be rejected for readiness while its unexpected private fields have already crossed the promised metadata-only callback boundary.

Independent canary `own.round_actions.private_text='PRIVATE_PROJECTION_CANARY'` is correctly denied readiness but emitted verbatim in the own projection callback. This establishes boundary exposure, not an actual persistent log leak: the default callback is no-op and the README requires transient caller handling. Returned snapshot privacy remains correct. Nevertheless the module's claim that no raw content is emitted is false for unvalidated input, and integrations may retain the projected objects as failure metadata.

Correction: validate own metadata before publishing a callback, or build fresh exact-key boolean projections without forwarding raw nested objects. Invalid records should expose only safe reason/counts. Preserve intentionally transient opaque scope IDs, never raw DTO/text/token/cookie fields. Test additional properties, wrong nested types and mutation of returned nested projections; neither invalid raw data nor later caller mutation should change model inputs or evidence.

## Scope and other checks

The module otherwise imports inertly, pins/transpiles four production source files, models all advice/resource expiries with source TopicCache, checks corresponding active chat, uses headless focus:false without fabricating visibility and shares the caller absolute deadline across DOM checks. Source phase floors persist through model.clear and WS invalidation. Optional-negative handling and projection classification are source-model predicates; caller must still bind exact protected request/receipt and intended content. The observer does not trace real application cache.accept, auth/transport generation or actual React effect order.

At most16 pending observer body reads are admitted before another body read; one current and latest batch are retained. The1MiB check occurs after response.body has returned. `close` awaits pending bodies; documented integration must close the browser context first, rather than claim independently bounded cancellation from observer.close alone. No additional finding is raised for that explicit caller precondition. Relevant actors/requests, safety exclusions, final diagnostic completeness and cleanup must be checked in the later full integration review.

Own [probes](probes.json):9 PASS, exit0, exact module and production model. An initial assertion expected `complete:true` despite early scope mismatch return; corrected to exact all-part presence, failed attempt retained. An inline correction command had a quoting error before modifying files and was replaced by a saved Python correction. These are reviewer probe errors, not accepted actual failures. Source/author files remain unchanged and pinned. Prepare separate version03, retain02 and obtain repeat independent review before any functional RUN. No full P05, human450, clean-source, production or device acceptance.
'''
(out/'REPORT.md').write_text(text,encoding='utf-8')
report={'schema_version':1,'status':'CHANGES_REQUESTED','reviewer':'/root/p05_topics_ui_review','created_at':datetime.now(timezone.utc).isoformat(),'handoff_sha256':sha(p/'HANDOFF.json'),'author_index_sha256':sha(p/'INDEX.json'),'module_sha256':sha(p/'private-batch-observer.mjs'),'source_identity':h['source_identity'],'source_files':1813,'image_proof_index_sha256':sha(image/'index.json'),'findings':[{'id':'OBS-R01','severity':'P2','title':'Node current-body ordering fixes batch to stale scope'},{'id':'OBS-R02','severity':'P2','title':'Unvalidated own projection forwards raw nested fields'}],'independent_controls':read(work/'probes.json'),'functional_run':False,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
files=[{'path':x.relative_to(out).as_posix(),'bytes':x.stat().st_size,'sha256':sha(x)}for x in sorted(out.rglob('*'))if x.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':report['status'],'full_stage_pass':False,'files':files},indent=2)+'\n',encoding='utf-8')
for n,v in h['files'].items():assert sha(p/n)==v
with(r/'.history/agents/2026-10-20-p05-private-batch-observer-review.md').open('a',encoding='utf-8')as log:log.write('\n## '+datetime.now(timezone.utc).isoformat()+' — Observer02 immutable review completed\nCHANGES_REQUESTED OBS-R01P2 lateNodecurrentbody fixesbatchscopeold/null→fullvalidbatchSCOPEMISMATCH untilnextcycle; 8s schedule falsefailure, twoactors. OBS-R02P2 unvalidated own callback raw nestedcanary emitted beforevalidSelfActions rejection, snapshot safe/noactuallogleakclaimed. Own9controlsPASS/exact8pins+4imagefrontendpins+1274/1813 verified. Initialcompleteflag assertionFAIL/correctionquotingFAIL retained, correctedpartpresence only. No source/author/Dockerwrites. Report '+out.relative_to(r).as_posix()+'/index.json SHA'+sha(out/'index.json')+' ('+str(len(files))+'files).\n')
print(json.dumps({'status':report['status'],'index_sha256':sha(out/'index.json'),'files':len(files),'report':out.relative_to(r).as_posix()}))
