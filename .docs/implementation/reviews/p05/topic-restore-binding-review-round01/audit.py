from pathlib import Path
import json,hashlib,datetime,shutil,sys
root=Path.cwd();p=root/'.artifacts/p05-topic-restore';out=root/'.docs/implementation/reviews/p05/topic-restore-binding-review-round01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'BINDING.json')=='106e7ea30580dda65b299b734d7b5f29aad649219b631392dc8089e3049fa844';assert sha(p/'ROOT_RUN_ACK.json')=='aa8622e658330d7430683ecf5c194ba1eab225f57c4d411459639e1341fbcceb';assert sha(p/'HANDOFF.json')=='d1e9f44e1871dd4065133ca02c7a5ab30273a7e6729d113f0a7a65f41e7dddac'
h=read(p/'HANDOFF.json');new=read(p/'BINDING.json');old=read(root/'.docs/implementation/reviews/p05/topic-restore-producer-round02/source/BINDING.json');ack=read(p/'ROOT_RUN_ACK.json');assert ack['prior_binding']==old and ack['new_binding']==new
assert {k for k in new if new[k]!=old[k]}=={'status','root_run_ack'};assert new['status']=='ROOT_FROZEN_BINDING_REVIEWED' and new['root_run_ack']is True
for n,v in h['pins'].items():
 if n!='BINDING.json':assert sha(p/n)==v,n
actual={q.name:('regular_file'if q.is_file()else'historical_directory_contents_excluded')for q in p.iterdir()};assert all(not q.is_symlink()and(q.is_file()or q.is_dir())for q in p.iterdir());assert {n for n,t in actual.items()if t=='regular_file'}==set(h['pins'])|{'HANDOFF.json','ROOT_RUN_ACK.json'}
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==new['source_identity']=='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571';assert len(source)==1811;assert new['image']==h['image']=='sha256:12e6253fee35b1adec1976d9edfb41fddb3fd39eedc3815158aa96c8814f5a5f';assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256']
out.mkdir(parents=True,exist_ok=False)
for n in ['BINDING.json','ROOT_RUN_ACK.json','HANDOFF.json']:shutil.copyfile(p/n,out/n)
shutil.copyfile(root/'.artifacts/p05-topic-restore-binding-review-round01/audit.py',out/'audit.py')
report={'schema_version':1,'status':'FINAL_RESTORE_BINDING_STATIC_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'EXACT_ROOT_ACK_METADATA_DIFF_ONLY_NOT_ACTUAL_RESTORE','reviewer':'/root/p05_topics_ui_review','root_author':'/root','binding_sha256':sha(p/'BINDING.json'),'root_ack_sha256':sha(p/'ROOT_RUN_ACK.json'),'historical_handoff_sha256':sha(p/'HANDOFF.json'),'seven_runtime_and_all_other_old_producerfiles_unchanged':True,'exact_top_level_entry_types':actual,'source_identity':identity(source),'included_files':len(source),'image':new['image'],'findings':[],'limits':['Root final authorization changes only bindingstatus/ACK plus one nonexecutable authority JSON. Historical HANDOFF explicitly pins old preACKbinding bytes.','Accepted05 static gate retained; actual PostgreSQL restore/RUN and independent actual audit still pending.','Image/source binding inherited previously reviewed retained build receipts and read-only inspect; no new Docker execution.'],'no_docker_functional_product_producer_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');(out/'REPORT.md').write_text('''# Final restore binding — independent finite review

**FINAL_RESTORE_BINDING_STATIC_PASS.** Only BINDING status/root_run_ack changed, plus the declared nonexecutable ROOT_RUN_ACK.json. All old producer files and seven runtime modules match accepted05; historical HANDOFF is unchanged and still records preACK binding bytes.

Fresh top-level regular-file names/types match the declared set plus the ACK JSON; no symlink/special entry. Current source ef009/1811, harness and image12e625 binding match the reviewed freeze. Root authorization gate now has the required status/true ACK. No functional Docker/restore or product/producer writes occurred. Actual run and independent evidence audit remain separate; full P05 is unaccepted.
''',encoding='utf8')
assert source==inventory()
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.iterdir())if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
