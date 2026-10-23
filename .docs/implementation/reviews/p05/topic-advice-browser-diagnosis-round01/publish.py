from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,shutil
root=Path.cwd();out=root/'.docs/implementation/reviews/p05/topic-advice-browser-diagnosis-round01'
assert not out.exists(),'immutable report already exists'
out.mkdir(parents=True)
work=root/'.artifacts/p05-advice-browser-diagnosis-round01'
base=root/'.docs/implementation/evidence/p05/renewal-topic-browser-preflight-01'
for name in ('audit.py','audit.json','tsx-probes.mjs','tsx-probes.json','publish.py'):
 shutil.copyfile(work/name,out/name)
inputs=out/'inputs';inputs.mkdir()
sources=['apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts','apps/web/src/topic-test-harness.ts','packages/relationship-engine/src/private-conversation.ts']
pins={}
for name in sources:
 p=root/name;dest=inputs/p.name;dest.write_bytes(p.read_bytes());pins[name]=hashlib.sha256(p.read_bytes()).hexdigest()
(out/'source-pins.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf-8')
report='''# P05 advice browser: independent diagnosis, round01

The saved browser gate remains **FAIL**: cases01–05 PASS, case06 FAIL, cases07–16 NOT_RUN. No new product defect is established by this packet. A confirmed test precondition gap lets the five-second advice content assertion start before the acceptance commits and the recipient receives a coherent private batch. The action-consent expiry hypothesis does not explain this first failure.

Inputs: [actual packet](../../../evidence/p05/renewal-topic-browser-preflight-01/index.json), index `c78abdd790091954765cc9d80166394e585b6b4431e6945e17842dd11caaafd7`; all42 indexed files/lengths/hashes verified. Frozen source `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad`,1813 files; before/after inventories equal the current tree. Seven archived producer pins match. Image `sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4`. Root handle56780 exited1; cleanup PASS and all three remaining-resource reports empty. This review performed no functional Docker/browser run or product/producer writes.

## Observed timeline and limits

Actual failure is recipient TR `advice-text` missing for the original5000ms matcher after first advice acceptance. Last control starts78673.969914ms. Both advice offer and acceptance are HTTP200 in retained request metadata; exact advice receipt/tuple bodies are not retained by this observer, so their correctness is not inferred from status alone.

TR cycle52 has accepted conversation388 at82295.480115ms, R34/revision6/epoch1, active, one received accepted advice. Exact source validators report matching request/response tuple and route. Chat392 completes at83346.309850ms with valid corresponding conversation; this batch is2570.654204ms from fresh self-actions385, below its5s permission. Conversation resource has158545ms remaining at server observation. These are passive HTTP-shape facts, not React cache acceptance instrumentation.

The [TR failure screenshot](../../../evidence/p05/renewal-topic-browser-preflight-01/run/chromium-tr-failure.png), visually inspected, already displays `SYNTHETIC ADVICE ONE` in the accepted advice article. Its precise first paint time is unknown. The matcher start/end is not separately timestamped; last-control start is only an anchor. The accepted batch arrives near five seconds after that anchor, followed by a later visible accepted article. This supports a readiness race and does not prove every internal React/lease event.

Target395 still has pending action deadline `1970-01-01T00:18:09.234Z`; latest self-actions394 server time is `00:18:02.182Z`, leaving7052ms. Target remains active and HTTP200. No observed action-expiry refusal precedes this failure. EN actor-required403 responses are expected spectator denials, not the TR recipient failure. Pending action may become a future long-flow fixture risk, but cannot be assigned as this first failure's cause.

Diagnostics are COMPLETE:395HTTP,254WS, no overflow, pending0, diagnostic errors0. Cache acceptance, internal generation transitions and first React paint are explicitly unobserved. A WS event alone is not used to infer a cache bug.

## Confirmed source gap and controlled reproduction

Archived case06 uses plain `click(receiver,'advice-accept')` followed immediately by `toContainText`. `click` waits DOM visible/enabled and click completion; it does not await exact mutation receipt, committed game revision or recipient private batch. Offer, replacement offer and revoke in that case likewise lack mutation barriers. This is finding **TB-ADVICE-PRECONDITION-001 (P2, producer)**; no product change is justified by this finding.

Own [TSX probe](tsx-probes.mjs) loads the unmodified current panel and production test harness. It clicks the real advice handler, holds POST2100ms, then supplies accepted advice via a fresh private read after3000ms. Text is absent at original click5000ms and visible at5100ms; the new read is within5s, action still has24900ms. No early preview occurs. This controlled HTTP scheduler demonstrates the source gap with valid unexpired authority. It is not an exact replay of actual browser network/paint timestamps. [Probe result](tsx-probes.json) PASS, repeated exit0. [Audit](audit.json) verifies actual evidence plus six independently mutated failure/status/identity/diagnostic negative guards, all rejected; exit0. An initial exploratory command omitted UTF8 and exited1 reading RU failure details; it did not mutate inputs and was corrected with explicit UTF8.

## Concrete prospective correction and acceptance requirements

Before a new actual run, version the functional producer method and independently review its finite diff. For every case06 offer, accept, replacement and revoke, await the exact POST path/method/kind/request_id, schema2 HTTP200 receipt and coherent same session/round with minimum committed game revision. Where an advice resource already exists, bind exact opaque advice id/proposal revision/epoch; do not accept a different advice item's response. New advice offers derive their new tuple from the recipient's own fresh projection. Do not log advice text, raw bodies, cookies or tokens.

After each corresponding commit, use one absolute bounded8s own-recipient UI readiness phase for the intended current advice state. The existing5000ms localized text assertion then remains unchanged. Readiness must establish current scope and revision plus real DOM condition, rather than only server SQL or a remembered DTO. Replacement must first reach fresh received pending advice with no text; old accepted text cannot satisfy the new acceptance. Revoke must establish removal on both actors and no resurrection from held old responses. Keep pre-accept no-preview and repeat it immediately before each recipient acceptance. Preserve spectator privacy, actor restrictions, all16 case identities, TTLs/5s leases, seeds/RNG and other topic-method10 controls.

For a long scenario requiring an action invitation, it is reasonable to explicitly accept required action through both actors' real current UI before entering the extended scenario. This is a separate fixture prerequisite, not a repair for an observed expiry in case06. It must be conditional on real own target/action state, preserve fresh exact refs and receipts, leave already-active actions alone, and adapt later finish controls to current state. No direct SQL authority seeding, disabled consent, enlarged deadlines or hidden grant refresh. Keep the original unaccepted/pending-action positive controls in their existing separate scope.

Required prospective controls: deferred matching receipt prevents premature readiness/content; wrong status/schema/request/kind/scope/tuple/revision fails; fresh edit requires new opt-in and no preview; revocation clears both actors; absolute deadline cannot reset per poll/actor; asynchronous waits are drained on failure; original5000/5s values and unrelated cases/helpers remain exact. A successful future run must use newly pinned producer bytes and preserved original FAIL. This diagnosis grants no RUN authorization and no full P05, clean-source, human450, production or device acceptance.
'''
(out/'REPORT.md').write_text(report,encoding='utf-8')
r=json.loads((work/'audit.json').read_text(encoding='utf-8'))
r.update(review_status='DIAGNOSIS_COMPLETE_PRODUCER_CHANGES_REQUIRED',finding={'id':'TB-ADVICE-PRECONDITION-001','severity':'P2','scope':'functional producer precondition','product_defect_proven':False},tsx_probes=json.loads((work/'tsx-probes.json').read_text(encoding='utf-8')),reviewer='/root/p05_topics_ui_review',created_at=datetime.now(timezone.utc).isoformat())
(out/'report.json').write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
files=[]
for p in sorted(out.rglob('*')):
 if p.is_file():files.append({'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
index={'schema_version':1,'status':r['review_status'],'created_at':datetime.now(timezone.utc).isoformat(),'full_stage_pass':False,'files':files}
(out/'index.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8')
stamp=datetime.now(timezone.utc).isoformat()
with (root/'.history/agents/2026-10-19-p05-topic-browser-delivery-diagnostic.md').open('a',encoding='utf-8') as f:
 f.write(f'\n## {stamp} — Advice1274 diagnosis formalized\nIndependent42file/hash/source1813/sevenproducer audit and6negativeguards PASS; exact unmodified TSX deferredPOST2100+freshread3000 produces missing5000/later5100 text with action24900ms stillvalid. ActualTR388receivedacceptedR34/chat392fresh2570ms and laterfailurePNGacceptedtext; precisepaint/cacheaccept unobserved. Actionexpiry rejected forfirstfailure (7052msremaining). TB-ADVICE-PRECONDITION-001P2 producer plainclick lackscommit/coherentownUI; prospective versioned advice exactreceipt/readiness/nonearly/edit/revoke constraints only, no method/productwrites or functionalRUN. Exploratory UTF8 omission exit1 corrected explicitUTF8; publisher initial guessedAPIpath exit1 preserved publish-attempt01-partial, actualpackagepath corrected before immutable publication. Formalreport {out.relative_to(root).as_posix()}/index.json SHA{hashlib.sha256((out/"index.json").read_bytes()).hexdigest()}, {len(files)}files. Browser stays5PASS/1FAIL/10NOTRUN, nofullstageclaim.\n')
print(json.dumps({'path':out.relative_to(root).as_posix(),'index_sha256':hashlib.sha256((out/'index.json').read_bytes()).hexdigest(),'files':len(files),'status':r['review_status']}))
