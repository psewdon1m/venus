from pathlib import Path
import json,hashlib,subprocess,shutil
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-a16-three-bindings-author01'
prepared=json.loads((work/'PREPARED.json').read_text());dest={k:Path(v) for k,v in prepared['destinations'].items()};parent={k:Path(v) for k,v in prepared['sources'].items()}
packet=root/'.docs/implementation/reviews/p05/a16-oci-wire-layout-bindings-author-round01';assert not packet.exists();packet.mkdir(parents=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text())
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
diagReview=root/'.docs/implementation/reviews/p05/layout12-diagnostic-independent-round01/INDEX.json'
assert sha(diagReview.read_bytes())=='7dac437a8613b667e037c94a3be29e0befb3016ba20699a97fc4b34d86e814e9'
op=read(dest['layout']/'OPERATIONAL-A16.json');op['parent_method_independent']='PASS_METHOD_ONLY';op['parent_method_independent_path']=str(diagReview);op['parent_method_independent_sha256']=sha(diagReview.read_bytes());save(dest['layout']/'OPERATIONAL-A16.json',op)
ack=read(dest['layout']/'ROOT_RUN_ACK.json');ack['scope']='A16_LAYOUT13_BINDING_PENDING_FRESH_NONAUTHOR_REVIEW_AND_ROOT_ACK_PARENT12_METHOD_ACCEPTED';save(dest['layout']/'ROOT_RUN_ACK.json',ack)
ociFiles={str(p.relative_to(dest['oci'])).replace('\\','/'):{'type':'regular_file','bytes':len(p.read_bytes()),'sha256':sha(p.read_bytes())} for p in sorted(dest['oci'].rglob('*')) if p.is_file() and p!=dest['oci']/'INDEX.json'}
save(dest['oci']/'INDEX.json',{'status':'AUTHOR_FROZEN_READY_FOR_INDEPENDENT_PRE_RUN_REVIEW','source_identity':op['source_identity'],'files':ociFiles})
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
code="import {captureProducer,runtimeDigest} from './.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume13/runner-policy.mjs';const files=captureProducer('C:/.projects/venus/.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume13');console.log(JSON.stringify({files,producer_runtime_digest:runtimeDigest(files)}));"
lp=json.loads(subprocess.check_output([node,'--input-type=module','-e',code],cwd=root));lp['files'].pop('INDEX.json',None)
lp.update(status='AUTHOR_BINDING13_A16_PENDING_NONAUTHOR_REVIEW_NO_RUN',source_identity=op['source_identity'],image=op['images']['A'],root_run_ack=False)
save(dest['layout']/'INDEX.json',lp)
wirepins=read(dest['wire']/'ROOT-ACK.template.json')['producer_files'];save(dest['wire']/'INDEX.json',{'status':'AUTHOR_BINDING07_A16_PENDING_NONAUTHOR_REVIEW_NO_RUN','source_identity':op['source_identity'],'image':op['images']['A'],'producer_files':wirepins,'root_run_ack':False})
edits={}
for kind in dest:
 names=sorted({str(p.relative_to(dest[kind])).replace('\\','/') for p in dest[kind].rglob('*') if p.is_file()}|{str(p.relative_to(parent[kind])).replace('\\','/') for p in parent[kind].rglob('*') if p.is_file()})
 changes=[]
 for n in names:
  a=parent[kind]/n;b=dest[kind]/n
  if a.exists() and b.exists() and a.read_bytes()==b.read_bytes():continue
  changes.append({'path':n,'parent_sha256':sha(a.read_bytes()) if a.exists() else None,'child_sha256':sha(b.read_bytes()) if b.exists() else None})
 edits[kind]=changes
save(packet/'EXACT-EDITS.json',edits)
save(packet/'WORKING-PINS.json',{'oci_index_path':str(dest['oci']/'INDEX.json'),'oci_index_sha256':sha((dest['oci']/'INDEX.json').read_bytes()),'layout_index_path':str(dest['layout']/'INDEX.json'),'layout_index_sha256':sha((dest['layout']/'INDEX.json').read_bytes()),'layout_runtime_digest':lp['producer_runtime_digest'],'wire_files':wirepins,'all_paths':{k:str(v) for k,v in dest.items()}})
for kind,names in {'oci':['BINDING.json','actual-image-maps.json','ROOT_RUN_ACK_TEMPLATE.json','OPERATIONAL_REVISION20.json'],'wire':['ROOT-ACK.template.json','OPERATIONAL-A16.json'],'layout':['binding.json','ROOT_RUN_ACK.json','OPERATIONAL-A16.json','run.mjs','runner-policy.mjs']}.items():
 (packet/kind).mkdir()
 for n in names:shutil.copyfile(dest[kind]/n,packet/kind/n)
for n in ['PREPARED.json','controls.mjs','CHECKS.json','checks.py','checks-attempt01.py','controls02.stdout.txt','controls02.stderr.txt','lint.stdout.txt','lint.stderr.txt','pending-oci.stderr.txt','pending-oci-attempt01.stderr.txt','pending-wire.stderr.txt','pending-layout.stderr.txt','checks01.stderr.txt','checks02.stdout.txt','checks02.stderr.txt']:
 shutil.copyfile(work/n,packet/n)
for n in ['p05-a16-three-bindings-prepare01.py','p05-a16-three-bindings-freeze01.py']:shutil.copyfile(root/'.artifacts'/n,packet/n)
handoff={'status':'AUTHOR_BINDING_COMPLETE_PENDING_NONAUTHOR_REVIEW_NO_NATIVE','writes':'COMPLETE','source_identity':op['source_identity'],'included_files':1870,'image':op['images']['A'],'production_image':'sha256:b2eb45a81156b321a9d21d681c3174e7a286fcda94bebb4a156679fb9b19c0d2','production_source_revision':'b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc','producer_runtime_digest':lp['producer_runtime_digest'],'oci_index_sha256':sha((dest['oci']/'INDEX.json').read_bytes()),'parent_reviews':{'oci19':'3d3ff370769694fee2477f3541a1a45ff928ecc99a4a279c43d8b5e2a7ce5177','wire06':'583a969cb948be3f27ff36f1d9c29ab5d5380a73e943b5fee44b38f609c00c6e','layout12':'7dac437a8613b667e037c94a3be29e0befb3016ba20699a97fc4b34d86e814e9'},'checks':{'finite':12,'syntax':3,'lint_exit':0,'pending_denials':3,'source_hashes_exact':1870,'native':False,'APP_writes':False,'active_ACK':False},'toolchain':'Root provisioned excluded source13/.venv junction to root .venv; unchanged source-proof verifyIncluded actually passed exact c921/1870. No agent-created toolchain or source modification.'}
save(packet/'HANDOFF.json',handoff)
(packet/'REPORT.md').write_text('''# A16 OCI20 / wire07 / layout13: thin prospective bindings

AUTHOR COMPLETE, pending fresh independent binding review and root authority. No APP source, native execution or active ACK was changed.

A16 source13 identity c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13 contains 1870 included files. Test image b3ff0e81 and production image b2eb45a8 are bound through exact root receipts in operational metadata. Production build-metadata.source_revision is the clean 40-character Git commit b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc; it is explicitly separate from the SHA256 source identity. OCI's existing test harness version metadata remains its disclosed external synthetic-fixture version, not production build metadata. No method is changed to reinterpret the production field.

OCI20 preserves all 40 recursive MJS files byte-exact from accepted OCI19. Only current BINDING, expanded image map, included-source map, pending ACK template and new operational metadata/index change. A's 64 compiled plus five additional closure pins and all 81 critical paths come from the actual A16 receipt. B4's 78-path map, image, compiled/additional maps, prior identity, policies, controls, resource limits and genuine-prebundle limitations remain exact. Only private-topic-ledger.js and topic-games.js differ from A15 compiled output; UI, SQL and PG bytes are exact. OCI14 remains synthetic compatibility, with a genuine B4 prebundle carrying known defects; this packet does not call B4 known GA or prove production rollback.

Wire07 preserves all five runtime MJS and DESCRIPTOR byte-exact from accepted wire06, including the same fresh native reconnect trigger within the original 15s bound, all OWS10 fences and 23 public checkpoints. Its template now binds exact A16 source/receipt/all 299 runtime pins; authority is NOT_AUTHORIZED. Inherited historical reports/descriptors retain their original scope and are not fresh actual proof.

Layout13 preserves diagnostic layout12's safeFailure bytes, 25 other MJS bodies, all 459 cells/nine 51-cell shards, real-text fixture, 200% native zoom, keyboard/contrast/reduced-motion oracles and all quotas/timers. The only MJS differences are run.mjs directory/A16 binding-label literals and the runner-policy expected included count 1869 to 1870. Parent diagnostic method12 is independently PASS_METHOD_ONLY at 7dac437a; this additive A16 binding still needs its own nonauthor review. Prior layout11 first-cell failure cause remains UNKNOWN, and improved diagnostics do not prove a remedy.

Twelve finite pin/inverse/source controls PASS. Three syntax checks and explicit root-config lint exit 0. All three pending-authority subprocesses exit 1 before any new project output. Root provisioned the excluded source13 .venv junction after this agent identified the unchanged source-proof toolchain prerequisite; the real read-only source-proof verifyIncluded and separate hash checks confirm exact c921/1870. No APP or authority waiver was needed. An initial checker expected OCI's raw NOT_AUTHORIZED string, but the unchanged driver correctly emits the sanitized NOT_ACCEPTED_BEFORE_OR_DURING_PLAN envelope; the checker expectation was corrected, with original failure/code/log retained. No runtime change accompanied that correction.

EXACT-EDITS.json lists every changed/additive file and parent/child hashes. WORKING-PINS.json gives current producer indices/runtime digest. Historical parents, failures and all accepted proof remain untouched. All new ACKs are false/pending; a fresh independent binding acceptance and external root activation are prerequisites to any actual. This is not a layout/wire/rollback actual PASS or P05 stage acceptance.
''',encoding='utf-8')
index={'status':'AUTHOR_A16_THIN_BINDINGS_COMPLETE_PENDING_NONAUTHOR_REVIEW','writes':'COMPLETE','source_identity':op['source_identity'],'image':op['images']['A'],'producer_runtime_digest':lp['producer_runtime_digest'],'files':{str(p.relative_to(packet)).replace('\\','/'):{'bytes':len(p.read_bytes()),'sha256':sha(p.read_bytes())} for p in sorted(packet.rglob('*')) if p.is_file()}}
save(packet/'INDEX.json',index)
print(json.dumps({'index':str(packet/'INDEX.json'),'sha256':sha((packet/'INDEX.json').read_bytes()),'children':len(index['files']),'layout_runtime_digest':lp['producer_runtime_digest'],'oci_index_sha256':handoff['oci_index_sha256']}))
