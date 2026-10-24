from pathlib import Path
import hashlib,json,datetime,shutil,sys,zipfile
root=Path.cwd();p=root/'.artifacts/p05-topic-restore';base=root/'.artifacts/p05-topic-restore-storage503-binding-review-round01';out=root/'.docs/implementation/reviews/p05/topic-restore-storage503-binding-review-round01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'BINDING.json')=='e1193885cb499659dd758829d58b3c8331c9526b5ed47754a18a81c923fcacd0';assert sha(p/'ROOT_RUN_ACK.json')=='823c3e9dd38af3ad8f28a66f765260dba9a847a3052aa929accb495d42614f20';assert sha(p/'HANDOFF.json')=='a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b'
h=read(p/'HANDOFF.json');ack=read(p/'ROOT_RUN_ACK.json');binding=read(p/'BINDING.json');old=read(p/'producer-checkpoint06/BINDING-06-ef-root-preserved.json');assert ack['prior_binding']==old and ack['new_binding']==binding;assert{k for k in binding if binding[k]!=old[k]}=={'source_identity','included_files','image'};assert binding['status']=='ROOT_FROZEN_BINDING_REVIEWED'and binding['root_run_ack']is True;assert sha(p/'producer-checkpoint06/ROOT_RUN_ACK-06-ef-preserved.json')==ack['prior_root_ack_sha256']=='c3db298625d8913c659517498c450768ef97fb9982b688bab33491fd2b8163e3'
for n,v in h['pins'].items():
 if n not in['BINDING.json','ROOT_RUN_ACK.json']:assert sha(p/n)==v,n
regular={q.name for q in p.iterdir()if q.is_file()};assert regular==set(h['pins'])|{'HANDOFF.json','ROOT_RUN_ACK.json'};assert all(not q.is_symlink()and(q.is_file()or q.is_dir())for q in p.iterdir())
receipt=root/ack['build_receipt'];assert sha(receipt)==ack['build_receipt_sha256']=='db8d3d9c35a26b659dabaebaf641c5fe96a4b27beb535da882d7d7f48b8dc400';r=read(receipt);assert r['observed_build_exit_code']==0 and r['read_only_probe_exit_code']==0;assert sha(root/r['build_log'])==r['build_log_sha256'];assert r['image']==binding['image']==(base/'image-id.txt').read_text(encoding='utf-8-sig').strip()
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==binding['source_identity']=='1d3a2ba1aa0c79ad223c89094e6def087036abcf327fb46ba42956a68ffbc6f0';assert len(source)==binding['included_files']==1813;assert source==read(root/'.artifacts/p05-storage503-freeze-context01.json')['files']
archive=root/ack['source_archive'];assert sha(archive)==ack['source_archive_sha256']==r['source_archive_sha256'];assert sha(archive)=='cec49a61430c8823dd35c3c0e27d0c1d6bf823b92f253e3e7cc2eee9efa81651'
with zipfile.ZipFile(archive)as z:
 assert set(z.namelist())==set(source)
 for n,v in source.items():assert hashlib.sha256(z.read(n)).hexdigest()==v,n
for n,v in r['image_files_sha256'].items():
 if n in source:assert source[n]==v,n
assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256']
out.mkdir(parents=True,exist_ok=False)
for n in['BINDING.json','ROOT_RUN_ACK.json','HANDOFF.json']:shutil.copyfile(p/n,out/n)
shutil.copyfile(receipt,out/'build-image-receipt.json');shutil.copyfile(root/r['build_log'],out/'build-log.txt');shutil.copyfile(p/'producer-checkpoint06/BINDING-06-ef-root-preserved.json',out/'prior-ef-BINDING.json');shutil.copyfile(p/'producer-checkpoint06/ROOT_RUN_ACK-06-ef-preserved.json',out/'prior-ef-ACK.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/q.name)
report={'schema_version':1,'status':'RESTORE_NEW_STORAGE503_BINDING_STATIC_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','scope':'EXACT_SOURCE_IMAGE_BINDING_ONLY_NOT_ACTUAL_RESTORE','binding_sha256':sha(p/'BINDING.json'),'root_ack_sha256':sha(p/'ROOT_RUN_ACK.json'),'source_identity':identity(source),'included_files':len(source),'image':binding['image'],'findings':[],'checks':{'exact_binding_changes':['source_identity','included_files','image'],'runtime_allother_pins_and_topregularfiles_unchanged':True,'readonly_docker_image_Id_confirmed':True,'complete_sourceZIP1813hashes_verified':True,'root_buildlog_receipt_observed5source3compiledpins_retained':True},'limits':['Root receipt read-only file probe records5source+3compiled hashes. Reviewer independently verified source pins/buildlog/receipt hashes/current imageID and sourceZIP; no own image file extraction or functional container run.','Root config-digest preparation failure remains qualified in receipt; actual image is observed.Id a0b416, not guessed config digest.','This allows root RUN decision for unchanged503 producer on newsource. ActualTGHTTPfinding remains open until accepted actual regression.','Historicalefsource/imageproofnotpromoted; human450/fullP05remainseparate.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Restore new storage503 source/image binding — independent review

**RESTORE_NEW_STORAGE503_BINDING_STATIC_PASS.** Only source identity, file count and image change in BINDING; root authority JSON names the accepted storage and producer reviews. Historical ef ACK/binding are preserved; all runtime/other producer pins and top-level regular files remain exact06.

Current1d3a/1813 full inventory and every source ZIP hash match. Read-only Docker image.Id matchesa0b416. The root build receipt/log are hash-verified and retain its observed five source/three compiled file pins; source pins match current bytes. No reviewer image-file extraction or functional test container was executed. The root's earlier config-digest assumption failure remains explicitly qualified.

Root may decide RUN for the unchanged503 gate on the new source. Actual restore evidence and closure of the HTTP500 finding remain separate. No oldef result is promoted; full P05/human450 remain unaccepted.
''',encoding='utf8');assert inventory()==source
files=[{'path':q.name,'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.iterdir())if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
