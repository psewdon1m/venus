"""Read-only source/receipt inspection and derived design packet creation; no Docker."""
from pathlib import Path
import json,hashlib,subprocess,sys,datetime
ROOT=Path.cwd().resolve();OUT=Path(__file__).parent;inputs=OUT/'inputs';inputs.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest()
names={
'AGENTS.md':'AGENTS.md',
'implementation-plan.md':'.docs/10_IMPLEMENTATION_PLAN.md',
'work-map.json':'.docs/implementation/p05-work-map.json',
'current-build-receipt.json':'.docs/implementation/reviews/p05/topic-renewal-regression-audit-round01/inputs/image-build-receipt.json',
'prior-build-receipt.json':'.artifacts/p05-grant-phase-image-build-receipt01.json',
'current-server.ts.bytes':'apps/api/src/server.ts',
'topic-runtime.ts.bytes':'apps/api/src/topic-runtime.ts',
'topic-games.ts.bytes':'apps/api/src/topic-games.ts',
'private-topic-migrations.ts.bytes':'apps/api/src/private-topic-migrations.ts',
'topic-game-routes.ts.bytes':'apps/api/src/topic-game-routes.ts',
'current-app.ts.bytes':'apps/api/src/app.ts',
'local-pilot-proxy.mjs.bytes':'tools/local-pilot-proxy.mjs',
'lifecycle-harness.mjs.bytes':'tests/p05-topic-lifecycle/harness.mjs',
'restore-design01.md':'.artifacts/p05-topic-restore/DESIGN.md',
'restore-design03.md':'.artifacts/p05-topic-restore/DESIGN-round03.md',
'restore-design04.md':'.artifacts/p05-topic-restore/DESIGN-round04.md',
'restore-factory.mjs.bytes':'.artifacts/p05-topic-restore/factory.mjs',
'restore-child.mjs.bytes':'.artifacts/p05-topic-restore/child.mjs',
'restore-phases.mjs.bytes':'.artifacts/p05-topic-restore/phases.mjs',
'restore-runner.mjs.bytes':'.artifacts/p05-topic-restore/run.mjs',
'restore-independent-report.json':'.docs/implementation/reviews/p05/topic-restore-mapindex-actual-round02/report.json',
'restore-independent-REPORT.md':'.docs/implementation/reviews/p05/topic-restore-mapindex-actual-round02/REPORT.md',
'prior-startup-independent-REPORT.md':'.docs/implementation/reviews/p05/topic-grant-phase-regression-audit-round01/REPORT.md',
'renewal-independent-REPORT.md':'.docs/implementation/reviews/p05/topic-renewal-candidate-round01/REPORT.md',
'Dockerfile.bytes':'infra/venus/Dockerfile'}
records=[]
for target,source in names.items():
    b=(ROOT/source).read_bytes()
    if target.endswith('.md'):
        legacy=inputs/target;target=target+'.bytes'
        if legacy.exists():
            assert legacy.parent.resolve()==inputs.resolve() and legacy.read_bytes()==b
            legacy.rename(inputs/target)
    p=inputs/target
    if p.exists():assert p.read_bytes()==b
    else:p.write_bytes(b)
    records.append({'original_path':source,'copy':'inputs/'+target,'bytes':len(b),'sha256':sha(b)})
old=subprocess.run(['git','show','b5436cd:apps/api/src/server.ts'],cwd=ROOT,capture_output=True,check=True).stdout
(inputs/'p04-server.ts.bytes').write_bytes(old)
records.append({'original_path':'git:b5436cde02dd09aa049ce0103cab58d9642e8c70:apps/api/src/server.ts','copy':'inputs/p04-server.ts.bytes','bytes':len(old),'sha256':sha(old)})
current=json.loads((inputs/'current-build-receipt.json').read_bytes());prior=json.loads((inputs/'prior-build-receipt.json').read_bytes())
assert current['image']=='sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4'
assert prior['image']=='sha256:5e30414ad64516422b61f630aa37639fb1920e795e2c7008752131a5c961647e'
assert current['host_compiled_files_sha256']==prior['host_compiled_files_sha256'] and len(current['host_compiled_files_sha256'])==64
sys.path.insert(0,str(ROOT/'tools'));import stage_inventory
inventory=stage_inventory.inventory(ROOT);identity=stage_inventory.identity(inventory)
assert identity=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad' and len(inventory)==1813
for p,h in current['host_compiled_files_sha256'].items():assert sha((ROOT/p).read_bytes())==h
assert b'bootGate' not in old and b'migratePrivateTopics' not in old and b'TopicGames' not in old
work=json.loads((inputs/'work-map.json').read_bytes());assert len(work['requirements'])==44
assets=lambda receipt:{p:h for p,h in receipt['image_files_sha256'].items() if p.startswith('apps/web/dist/')}
audit={'status':'READ_ONLY_DESIGN_INPUTS_VERIFIED_NOT_RUNTIME_PROOF','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':identity,'included_files':len(inventory),'current_image':current['image'],'prior_image':prior['image'],'prior_identity':prior['source_identity'],'current_receipt_sha256':sha((inputs/'current-build-receipt.json').read_bytes()),'prior_receipt_sha256':sha((inputs/'prior-build-receipt.json').read_bytes()),'compiled64_equal_and_host_actual_match':True,'current_receipt_UI_map':assets(current),'prior_receipt_UI_map':assets(prior),'both_actual_runtime_image_maps':'NOT_PROBED_BY_THIS_REVIEW','P04_server_lacks_topic_boot_migration_assembly':True,'workmap_requirements':44,'pinned_inputs':records,'Docker_commands':0,'builds':0,'producer_or_fixture_implementation':False,'runtime_attempts':0,'HOLD':'UNCHANGED'}
(OUT/'input-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in audit.items() if k!='pinned_inputs'}))
