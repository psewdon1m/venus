from pathlib import Path
import json,hashlib,datetime,shutil,sys
root=Path.cwd();p=root/'.artifacts/p05-topic-restore';out=root/'.docs/implementation/reviews/p05/topic-restore-binding06-review-round01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'BINDING.json')=='07b88bdb0e7bd1c0036182f5ce8fda38ffbd8f8055d6ae9d3f16cb0c08c551d3';assert sha(p/'ROOT_RUN_ACK.json')=='c3db298625d8913c659517498c450768ef97fb9982b688bab33491fd2b8163e3';assert sha(p/'HANDOFF.json')=='a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b'
h=read(p/'HANDOFF.json');old=read(root/'.docs/implementation/reviews/p05/topic-restore-metadata06-review-round01/source/BINDING.json');new=read(p/'BINDING.json');ack=read(p/'ROOT_RUN_ACK.json');assert ack['prior_binding']==old and ack['new_binding']==new;assert{k for k in new if new[k]!=old[k]}=={'status','root_run_ack'};assert new['status']=='ROOT_FROZEN_BINDING_REVIEWED'and new['root_run_ack']is True
assert sha(p/'producer-checkpoint06/ROOT_RUN_ACK-05-preserved.json')==ack['prior_root_ack_sha256']=='aa8622e658330d7430683ecf5c194ba1eab225f57c4d411459639e1341fbcceb'
for n,v in h['pins'].items():
 if n not in['BINDING.json','ROOT_RUN_ACK.json']:assert sha(p/n)==v,n
entries={q.name:('regular_file'if q.is_file()else'historical_directory_contents_excluded')for q in p.iterdir()};assert all(not q.is_symlink()and(q.is_file()or q.is_dir())for q in p.iterdir());assert{n for n,t in entries.items()if t=='regular_file'}==set(h['pins'])|{'HANDOFF.json','ROOT_RUN_ACK.json'}
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==new['source_identity']=='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571';assert len(source)==1811;assert new['image']==h['image']=='sha256:12e6253fee35b1adec1976d9edfb41fddb3fd39eedc3815158aa96c8814f5a5f';assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256']
out.mkdir(parents=True,exist_ok=False)
for n in['BINDING.json','ROOT_RUN_ACK.json','HANDOFF.json']:shutil.copyfile(p/n,out/n)
shutil.copyfile(p/'producer-checkpoint06/ROOT_RUN_ACK-05-preserved.json',out/'prior-ACK05-preserved.json');shutil.copyfile(root/'.artifacts/p05-topic-restore-binding06-review-round01/audit.py',out/'audit.py')
report={'schema_version':1,'status':'RESTORE06_FINAL_BINDING_STATIC_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','scope':'ONLY_ROOT_ACK_METADATA_BINDING_RECHECK_NO_ACTUAL_RESTORE','binding_sha256':sha(p/'BINDING.json'),'root_ack_sha256':sha(p/'ROOT_RUN_ACK.json'),'historical_handoff_sha256':sha(p/'HANDOFF.json'),'source_identity':identity(source),'included_files':len(source),'image':new['image'],'top_level_entries':entries,'all_prior_runtime_and_other_files_unchanged':True,'findings':[],'functional_Docker_RUN':False,'full_stage_pass':False};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');(out/'REPORT.md').write_text('''# Restore06 final binding — independent finite review

**RESTORE06_FINAL_BINDING_STATIC_PASS.** Only BINDING status/ACK and nonexecutable root authority JSON differ from reviewed06. Prior ACK05 is preserved with its exact hash inside the excluded historical directory. HANDOFF and all runtime/other file pins are unchanged.

Fresh top-level declared regular-file names/types, sourceef009/1811, harness and image12e625 match. Root gate now carries the required status/true ACK. No functional Docker/restore or product/producer writes occurred. Actual run/audit and full P05 remain separate.
''',encoding='utf8');assert inventory()==source
files=[{'path':q.name,'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.iterdir())if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
