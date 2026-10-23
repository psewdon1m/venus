from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys,shutil
sys.path.insert(0,'tools');import stage_inventory
r=Path.cwd();p=r/'.artifacts/p05-private-batch-observer03';work=r/'.artifacts/p05-private-batch-observer-review-round02';out=r/'.docs/implementation/reviews/p05/topic-private-batch-observer-review-round02'
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest();read=lambda x:json.loads(x.read_text(encoding='utf-8'))
assert sha(p/'HANDOFF.json')=='a0c8680a4641c9a3a24cc6f65bb2d1ac3260510277ac856d227fe0c74c2313d9'
assert sha(p/'INDEX.json')=='1da1f36dd497ceca0bbe2b5a4d4cd4e2a84826eefa7fbc63f2f91923d482f75a'
h=read(p/'HANDOFF.json');assert len(h['files'])==17
for n,v in h['files'].items():assert sha(p/n)==v
assert sha(p/'private-batch-observer.mjs')=='8913015d820022cca873f0a8f819dcea054ef13e0591492b9d665244bdc59e8a'
inv=stage_inventory.inventory();assert len(inv)==1813 and stage_inventory.identity(inv)==h['source_identity']
image=r/'.docs/implementation/evidence/p05/observer-image-pins-preflight-01';assert sha(image/'index.json')=='68016ab14171d501d58bc9de2a3cf114c2701d1b413d4fd09ed4f082925a5827'
for f in read(image/'index.json')['files']:assert sha(image/f['path'])==f['sha256']
for n,v in read(image/'pins.json').items():assert inv[n]==v
old=r/'.docs/implementation/reviews/p05/topic-private-batch-observer-review-round01';assert sha(old/'index.json')=='ada87fe052adf0d1279f0c2a7f1438c84d9d6ba679cae36b1cdd207464b1143c'
assert sha(p/'private-batch-controls.mjs')==sha(r/'.artifacts/p05-private-batch-observer02/private-batch-controls.mjs')
assert not out.exists();out.mkdir(parents=True)
for f in work.iterdir():
 if f.is_file():shutil.copyfile(f,out/f.name)
inputs=out/'inputs';inputs.mkdir()
for n in ('HANDOFF.json','INDEX.json','private-batch-observer.mjs','change-from02.diff'):shutil.copyfile(p/n,inputs/n)
shutil.copyfile(image/'index.json',inputs/'IMAGE_INDEX.json');shutil.copyfile(image/'pins.json',inputs/'image-pins.json')
text='''# P05 private batch observer03: independent repeat review

**STATIC_OBSERVER_PREFLIGHT_PASS.** OBS-R01 and OBS-R02 close on these exact03 bytes; no new P1/P2 found. This is module/model acceptance for the stated passive observer scope, not a browser run or acceptance of the later complete method12 integration.

HANDOFF `a0c8680a4641c9a3a24cc6f65bb2d1ac3260510277ac856d227fe0c74c2313d9`; INDEX `1da1f36dd497ceca0bbe2b5a4d4cd4e2a84826eefa7fbc63f2f91923d482f75a`/17; module `8913015d820022cca873f0a8f819dcea054ef13e0591492b9d665244bdc59e8a`. All17 author file hashes checked; current1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad/1813 verified. Four frontend source pins still match durableff371 image proof index68016ab14171d501d58bc9de2a3cf114c2701d1b413d4fd09ed4f082925a5827 and its hashed child records. No image re-extraction, Docker or actual browser execution. Previous02/round01 files and original independent review remain immutable.

OBS-R01 closes: each own batch now retains the actual latest-started current request record; scope resolution waits for that record's valid DTO, and completion is retried when current body completes. It requires associated current generation, current scope equality and exact own/target/conversation/chat identities/routes. No route fallback or remembered prior request-start UI is used as a substitute. The same validated fresh raw DTO batch now becomes ready if Node current-body parsing finishes after own start, after private parts or last of all. Wrong scope and private-clear generations still fail. A subsequent unrelated current revision cannot rebind the old batch.

OBS-R02 closes: own projection requires validSelfActions2 and correct own room/member before callback. Nested action groups are reconstructed from exact boolean key lists into new objects. Unexpected nested fields/wrong value types are not emitted; changing callback values cannot mutate the internal validated DTO/model. Intentionally transient scope IDs remain as documented and must not be logged verbatim. Snapshot output remains redacted; no direct app cache.accept/auth-generation claim is introduced.

Independent [nine original controls](probes.json) rerun against03 with corrected fixed expectations, exit0: cold load, new revision, current-body-last, two concurrent actor transport sequences now reach readiness on the first complete valid batch; an initial3400ms own-batch completes inside the existing8s phase rather than requiring the artificial second cycle. Ordered positive/wrong-own denial/snapshot privacy remain. The old invalid-own callback canary is now absent. These scripts retain explicit event/body scheduling doubles and are not actual browser timestamp replays.

Independent [additional controls](extra.json):18 PASS, exit0. They cover caller nested/scalar mutation isolation, all three own nested groups with unknown fields and wrong types, private-clear generation while current completes last, an associated older current vs newer revision, own member/session/round/revision plus target/conversation scope mismatches, active missing chat and wrong chat epoch, shortest advice expiry, final250ms minimum lease and simultaneous focus:false readiness calls for two actors. Neither brings a page to front nor fakes visibility. Every test imports exact03 and its pinned production validators/TopicCache; no copied acceptance implementation replaces the module.

The original34 author control source remains byte-exact02, and supplied21 new author results remain author evidence; independent27 controls are counted separately. Clear/generation and source phase floors, own5s/resource deadlines, private DTO transient limits, safety/control classification and original absolute wait budgets stay in place. The module still uses an independent observer model, not real React effect, authorization generation or cache callback instrumentation. Context must close before observer.close to terminate pending body reads as documented. Full method12 integration still needs exact request/receipt, intent/ticket, phase-budget, normal-vs-safety, cleanup and final binding review. No actual browser/localized case PASS, full P05, human450, production/device or clean-source acceptance is granted.
'''
(out/'REPORT.md').write_text(text,encoding='utf-8')
report={'schema_version':1,'status':'STATIC_OBSERVER_PREFLIGHT_PASS','reviewer':'/root/p05_topics_ui_review','created_at':datetime.now(timezone.utc).isoformat(),'handoff_sha256':sha(p/'HANDOFF.json'),'author_index_sha256':sha(p/'INDEX.json'),'module_sha256':sha(p/'private-batch-observer.mjs'),'source_identity':h['source_identity'],'source_files':1813,'closed_findings':['OBS-R01','OBS-R02'],'new_findings':[],'controls':{'prior9':read(work/'probes.json'),'new18':read(work/'extra.json')},'functional_run':False,'whole_method12_accepted':False,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
files=[{'path':x.relative_to(out).as_posix(),'bytes':x.stat().st_size,'sha256':sha(x)}for x in sorted(out.rglob('*'))if x.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':report['status'],'full_stage_pass':False,'files':files},indent=2)+'\n',encoding='utf-8')
for n,v in h['files'].items():assert sha(p/n)==v
with(r/'.history/agents/2026-10-20-p05-private-batch-observer-review.md').open('a',encoding='utf-8')as log:log.write('\n## '+datetime.now(timezone.utc).isoformat()+' — Observer03 independent repeat PASS\nExact17pins/module8913/source1274/1813/image4pins verified. Prior9counterexamples corrected on03 +18new scope/generation/currentLAST/projectionmutation/alladviceexpiry/lease/twoactorfocusfalse controls PASS. OBS-R01/R02 close, no newP1P2. No source/author/Docker/browserwrites. Wholemethod12notacceptedhere. Immutable report '+out.relative_to(r).as_posix()+'/index.json SHA'+sha(out/'index.json')+' ('+str(len(files))+'files).\n')
print(json.dumps({'status':report['status'],'index_sha256':sha(out/'index.json'),'files':len(files),'report':out.relative_to(r).as_posix()}))
