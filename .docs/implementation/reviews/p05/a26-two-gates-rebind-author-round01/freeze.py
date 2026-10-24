from pathlib import Path
import datetime,hashlib,json,shutil,subprocess,sys
R=Path('C:/.projects/venus');S=R/'.artifacts/p05-pilot-bundle-source23';A=R/'.docs/implementation/reviews/p05/a26-two-gates-rebind-author-round01';L=S/'.artifacts/p05-v2-layout-producer-a26-01';O=S/'.artifacts/p05-compatible-rollback-producer38'
F=R/'.artifacts/p05-pilot-bundle-source-freeze23.json';res=R/'.artifacts/p05-a26-existing-gates-resource-authority12.json';guard=R/'.artifacts/p05-a26-manual-preflight10.py'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
source=read(F)['identity'];assert source=='27f5172a4d550017c801a15531d39f52aed120937f70e556dfbaae063b56a5bf'
code=(R/'.docs/implementation/reviews/p05/a25-two-gates-rebind-author-round01/existing-binding-read.mjs').read_text().replace('source22','source23').replace('producer-a25-01','producer-a26-01').replace('producer37','producer38')
(A/'existing-binding-read.mjs').write_text(code,encoding='utf-8');jobs=[]
def run(name,args):
 p=subprocess.run([node,*args],cwd=S,capture_output=True,timeout=40);(A/(name+'.stdout.txt')).write_bytes(p.stdout);(A/(name+'.stderr.txt')).write_bytes(p.stderr);jobs.append({'name':name,'exit':p.returncode});return p
p=run('binding-read',[str(A/'existing-binding-read.mjs')]);assert p.returncode==0,p.stderr
v=json.loads(p.stdout);assert v['source_identity']==source and v['source_files']==1881
runtime=v['layout']['producer_runtime_digest'];write(A/'LAYOUT-RUNTIME.json',v['layout']);write(A/'OCI-MAP.json',v['OCI_map'])
ack=read(L/'ROOT_RUN_ACK.json');ack.update(producer_runtime_digest=runtime,shared_resource_authority={'path':str(res),'sha256':sha(res),'review_path':None,'review_sha256':None,'prelaunch_path':None,'prelaunch_sha256':None,'statistics_manifest_sha256':None,'qualification':'QUIET_ONLY resource12; independent binding and fresh root admission mandatory. No statistics concurrently under this authority.'});write(L/'ROOT_RUN_ACK.json',ack)
li=read(L/'INDEX.json');li.update(status='AUTHOR_A26_01_METADATA_BINDING_PENDING_INDEPENDENT_NO_NATIVE',source_identity=source,included_files=1881,image=read(L/'binding.json')['image'],producer_runtime_digest=runtime,new_gate_actuals=0,false_root_ACK=True);li['files']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(L.iterdir()) if p.is_file() and p.name!='INDEX.json'};write(L/'INDEX.json',li)
oi=read(O/'INDEX.json');oi.update(status='AUTHOR_OCI38_A26_METADATA_BINDING_PENDING_INDEPENDENT_NO_NATIVE',source_identity=source,included_files=1881,native_runs=0,false_root_ACK=True);oi['files']=v['OCI_map'];write(O/'INDEX.json',oi)
p=run('layout-falseACK',[str(L/'run.mjs')]);assert p.returncode==1 and b'ROOT_RUN_ACK_REQUIRED' in p.stderr
p=run('OCI-falseACK',['--max-old-space-size=192',str(O/'driver.mjs'),'--run','--ack='+str(A/'OCI38-INACTIVE-ACK.json')]);assert p.returncode==1 and json.loads(p.stderr)['status']=='NOT_ACCEPTED_BEFORE_OR_DURING_PLAN'
write(A/'CHECKS.json',{'status':'PASS_EXISTING_COLD_BINDING_AND_INACTIVE_GUARDS_ONLY','jobs':jobs,'expected_false_ACK_exits':[1,1],'new_controls_or_framework':False,'Docker':0,'native_runs':0})
handoff={'status':'FROZEN_A26_ORIGINAL_METHOD_METADATA_PENDING_INDEPENDENT_NO_NATIVE','source_identity':source,'included_files':1881,'core_git':read(F)['git_source_commit'],'layout_runtime':runtime,'layout_INDEX_sha256':sha(L/'INDEX.json'),'OCI_INDEX_sha256':sha(O/'INDEX.json'),'OCI_expanded_map_sha256':sha(O/'actual-image-maps.json'),'layout_false_ACK_sha256':sha(L/'ROOT_RUN_ACK.json'),'OCI_false_template_sha256':sha(O/'ROOT_RUN_ACK_TEMPLATE.json'),'resource12_sha256':sha(res),'guard10_sha256':sha(guard),'all9_same_current_runtime_fresh':True,'fresh_original14_OCI':True,'native_runs':0}
write(A/'HANDOFF.json',handoff)
for dest,root,names in [('layout',L,['INDEX.json','binding.json','DESIGN.md','ROOT_RUN_ACK.json']),('OCI',O,['INDEX.json','BINDING.json','actual-image-maps.json','OPERATIONAL_REVISION38.json','ROOT_RUN_ACK_TEMPLATE.json','FULL299-PROBE24.json'])]:
 (A/dest).mkdir()
 for name in names:shutil.copyfile(root/name,A/dest/name)
shutil.copyfile(res,A/'RESOURCE12.json');shutil.copyfile(guard,A/'manual-guard10.py');shutil.copyfile(Path(__file__),A/'freeze.py')
(A/'REPORT.md').write_text('''A26 existing original methods, metadata only. Source23 27f5172a/1881, clean Git d55ee043, source-only independent c3338514, root actual image24 receipts299/122 bind current exact application. Targeted69/69 and host1107 PASS207 Windows platform SKIP precede this metadata. Clean Linuxquality, native UI, original OCI and uniform full statistics remain pending.

UI parent is A25-02 (not causal diagnostic). Exactly two whole-file inverses: run own dirname and strict source count1879→1881; other25 MJS raw exact. Preserves document.hasFocus prerequisite, original first focus rectangle, zoom/oracles/fixtures/deadlines/actions and51 cells each. All nine fresh same-runtime A26 shards and original aggregate459/324/135 required. Pinned WebKit27.2 native207.36% nominal200 qualification remains; original Chromium/Firefox200 criteria unchanged. No diagnostic tracing/timers/repair added.

OCI38 all40 recursive MJS raw exact37. Runtime A81 current test receipt hashes replaces old A; compiled index.js+topic-planner.js changed (and UI JS/HTML), no blanket backend identity claim. Other compiled modules, SQL7, PG2 exact. B4 add96 runtime78 unchanged. Full299 probe separate from runtime81 map. Fresh original14 with original13 replays/resources/deadlines/oracles required. ADR030 preserves reader header3 compatibility; rollback may again refuse later public-exhaustion planning and does not promise identical future selection.

Existing cold bindingreader exit0; existing inactive root guards exits1/1 as expected before Docker. No new test framework/controls, no Docker/native/model run, no APP/Git/index changes. Resource12/guard10 preserve all numeric caps but admit QUIET ONLY until new uniform06 manifest is independently bound; original05 stopped fail is not active authority. Root independent review plus fresh per-run manual guard mandatory; stop first FAIL. No P05/production/human/P06 PASS. COMPLETE_STOP.
''',encoding='utf-8')
sys.path.insert(0,str(R/'tools'));from stage_inventory import inventory,identity
assert identity(inventory(R))==source and identity(inventory(S))==source
assert sha(R/'.git/index')=='a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093'
ix=dict(status='AUTHOR_A26_TWO_EXISTING_GATES_METADATA_PENDING_INDEPENDENT_NO_NATIVE',writes='COMPLETE_STOP',created_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),source_identity=source,included_files=1881,image=read(L/'binding.json')['image'],production_image=read(R/'.artifacts/p05-pilot-bundle-production-image-binding24/receipt.json')['image'],previous_image=read(O/'BINDING.json')['images']['B'],layout_runtime_digest=runtime,layout_INDEX_sha256=sha(L/'INDEX.json'),OCI_INDEX_sha256=sha(O/'INDEX.json'),OCI_expanded_map_sha256=sha(O/'actual-image-maps.json'),resource12_sha256=sha(res),guard10_sha256=sha(guard),files={p.relative_to(A).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(A.rglob('*')) if p.is_file()})
write(A/'INDEX.json',ix)
with (R/'.history/agents/2026-10-22-p05_a26_gates_rebind.md').open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' Prepare and freeze exit0. Existing coldreader0 and inactiveguards1/1 expected. Samevenv junction target verified root .venv; no install. TwoUI inverses/25otherMJS exact;40OCI exact37; A compiledonlyindex+planner changed, B78 exact. Resource12 quiet-only same numericcaps. Source27f1881/rootindex unchanged. Frozen INDEX '+sha(A/'INDEX.json')+' runtime '+runtime+'. COMPLETE_STOP; independent review and root actual pending.\n')
print(json.dumps({'author_index':str(A/'INDEX.json'),'author_sha256':sha(A/'INDEX.json'),'files':len(ix['files']),**handoff}))
