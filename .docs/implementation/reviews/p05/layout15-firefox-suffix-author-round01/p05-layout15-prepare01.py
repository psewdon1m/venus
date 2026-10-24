from pathlib import Path
import shutil,json
r=Path('C:/.projects/venus');parent=r/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume14';child=parent.with_name('p05-v2-layout-producer-resume15');assert not child.exists();shutil.copytree(parent,child,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json'))
s=(parent/'x11.mjs').read_bytes().decode()
old="""// Only the exact native suffix measured on this pinned Chromium is allowed.
// Other engines retain the existing exact-title policy, with bounded readiness.
const chromiumWindowSuffix=' - Google Chrome for Testing';"""
new="""// Only exact vendor suffixes measured on these pinned owned browsers are allowed.
// WebKit remains exact-title-only: its native identity/template is unresolved.
const chromiumWindowSuffix=' - Google Chrome for Testing';
const firefoxWindowSuffix=' \\u2014 Nightly';
function vendorWindowSuffix(engine){return engine==='chromium'?chromiumWindowSuffix:engine==='firefox'?firefoxWindowSuffix:'';}"""
assert s.count(old)==1;s=s.replace(old,new)
a="checkWindowNonce(title);return '^'+title+(engine==='chromium'?'('+chromiumWindowSuffix+')?':'')+'$';"
b="checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return '^'+title+(suffix?'('+suffix+')?':'')+'$';"
assert s.count(a)==1;s=s.replace(a,b)
a="checkWindowNonce(title);return typeof value==='string'&&(value===title||(engine==='chromium'&&value===title+chromiumWindowSuffix));"
b="checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||(suffix!==''&&value===title+suffix));"
assert s.count(a)==1;s=s.replace(a,b);(child/'x11.mjs').write_bytes(s.encode())
(child/'run.mjs').write_bytes((parent/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume14',b'p05-v2-layout-producer-resume15'))
ack=json.loads((parent/'ROOT_RUN_ACK.json').read_text());ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path=None,independent_review_index_sha256=None,producer_runtime_digest=None,issued_at=None,scope='PROSPECTIVE_LAYOUT15_MEASURED_FIREFOX_SUFFIX_PENDING_NONAUTHOR_REVIEW_ROOT_ACK');ack.pop('concurrent_workload',None)
(child/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PREPARED_NO_RUN','path':str(child),'APP_writes':False,'ACK':False}))
