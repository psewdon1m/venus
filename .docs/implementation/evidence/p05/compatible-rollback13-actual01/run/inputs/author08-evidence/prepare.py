from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,sys
r=Path(__file__).resolve().parents[2]; w=Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
write=lambda p,v:p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=r/'.artifacts/p05-pilot-bundle-source04'; prior=r/'.artifacts/p05-pilot-prebundle-source01'
freeze=r/'.artifacts/p05-pilot-bundle-source-freeze04.json'; ar=r/'.artifacts/p05-pilot-bundle-image-binding04/receipt.json'; br=r/'.artifacts/p05-pilot-prebundle-image-binding02/receipt.json'
A=read(ar);B=read(br);F=read(freeze)
assert F['identity']=='b2100207d12e90615fb0a62f4b5e410d9a4c8c20fc2db2bc1eae4bc409dca5b6' and len(F['files'])==1846
assert A['source_identity']==F['identity']and len(A['image_files_sha256'])==284
assert h(br)=='a96781cae7ce2e1e458bbde78892405ae216af07cd62656d6346fd0cfe824503'
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
inv=inventory(base);assert identity(inv)==F['identity']and inv==F['files']; before=inventory(prior);assert identity(before)==B['source_identity']
for name,prefix in [('owner-provisional-pilot-independent-round01','0f702d92'),('compatible-rollback-independent-repeat06','948f51f1'),('private-yesbut-condition-independent-round01','3463a581'),('normal-production-continuity-independent-round01','c7bd77a3'),('topic-layout-independent-review-resume-round04','727092bb')]:
 src=r/'.docs/implementation/reviews/p05'/name;assert h(src/'INDEX.json').startswith(prefix),(name,h(src/'INDEX.json'));dest=base/'.docs/implementation/reviews/p05'/name
 for f in src.rglob('*'):
  if f.is_file():
   to=dest/f.relative_to(src);to.parent.mkdir(parents=True,exist_ok=True)
   if to.exists():assert to.read_bytes()==f.read_bytes()
   else:shutil.copyfile(f,to)
# OCI08: original component method23 remains exactly corrected06/07.
old=r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-compatible-rollback-producer07';p=base/'.artifacts/p05-compatible-rollback-producer08';assert not p.exists();shutil.copytree(old,p)
for n in ['INDEX.json','BINDING.json','actual-image-maps.json','PROFILE.json','ROOT_RUN_ACK_TEMPLATE.json','METHOD_CARRY.json','README.md','AUTHOR_CHECKS.json','included-inputs.json','compatibility-comparison.json']:
 shutil.copyfile(old/n,p/'pinned-inputs'/('historical07-'+n+'.bytes'))
for n,f in [('current-A-receipt08.json.bytes',ar),('current-B-receipt08.json.bytes',br),('current-A-freeze08.json.bytes',freeze)]:shutil.copyfile(f,p/'pinned-inputs'/n)
b=read(p/'BINDING.json');keys=list(b['per_image_compiled']['A']);assert len(keys)==64
compiled={k:{n:q['compiled_files'][n]for n in keys}for k,q in [('A',A),('B',B)]}
def anchors(q,k):
 d={**compiled[k],**q['migration_files'],**q['web_dist_files'],**q['pg_dependency_files']};assert len(d)==76;assert all(q['image_files_sha256'][n]==v for n,v in d.items());return dict(sorted(d.items()))
images={'A':A['image'],'B':B['image']};maps={'schema_version':1,'status':'ROOT_ACTUAL_A7_B4_RUNTIME76_EACH_COMPONENT14_NOT_RUN','images':images,'maps':{k:{'files':anchors(q,k),'metadata':None,'metadata_absent':True,'compiled64':True}for k,q in [('A',A),('B',B)]},'root_receipts':{k:{'path':str(f),'sha256':h(f),'all_actual_files':len(q['image_files_sha256'])}for k,q,f in [('A',A,ar),('B',B,br)]}}
for q in [A,B]:assert q['build_metadata_absent']and q['probe_exit_code']==0 and q['probe_cleanup']=='AUTO_REMOVED'
write(p/'actual-image-maps.json',maps);extra={k:{n:v for n,v in q['compiled_files'].items()if n not in keys}for k,q in [('A',A),('B',B)]};assert len(extra['A'])==len(extra['B'])==2 and extra['A']==extra['B']
write(p/'pilot-authority-supplement08.json',{'status':'SUPPLEMENTAL_ROOT_ACTUAL_RECEIPTS_NOT_WORKER78','files':extra,'full_maps':{'A':284,'B':278},'normal_production_continuity':'Separate normalcompat02; not component14','application_reviews':['owner-provisional-pilot-independent-round01','private-yesbut-condition-independent-round01']})
b.update(status='AUTHOR_OPERATIONAL08_A7_B4_READY_FOR_INDEPENDENT_REVIEW_NOT_RUN',source_identity=F['identity'],included_files=1846,images=images,per_image_compiled=compiled,expanded_actual_image_UI_migration_maps_sha256=h(p/'actual-image-maps.json'),application_source_review='FinalA7 six-path privateYB3463a581 plus ownerpilot0f702 and prior A6cooldown71beb; external ACK must bind finalA7 source exactly.',application_current_tests='Root944PASS/208SKIP finalcoordinated host; independent111+6YB controls; actualcomponent14/normalcontinuity/layout notrun by author08',previous_A_binding={'source_identity':read(old/'BINDING.json')['source_identity'],'image':read(old/'BINDING.json')['images']['A'],'producer07_index_sha256':h(old/'INDEX.json')})
b['previous_known_issues']=['B4 prebundle has separate private-read freshness limitation, pre-cooldown and first privateYesBut condition defects; not knownGA. Component14 is synthetic and not ordinary470 startup. Operational fallback quiesced/startsOFF remains distinct from flagON functional drill.']
write(p/'BINDING.json',b);write(p/'included-inputs.json',inv);write(p/'previous-B-runtime-pins.json',B)
prof=read(p/'PROFILE.json');prof.update(status='AUTHOR_OPERATIONAL08_A7_B4_COMPONENT14_NOT_RUN',A_source=F['identity'],A_image=A['image'],B_known_issues=b['previous_known_issues']);write(p/'PROFILE.json',prof)
ack=read(p/'ROOT_RUN_ACK_TEMPLATE.json');ack.update(status='NOT_AUTHORIZED',root_run_ack=False,producer_index_sha256=None,source_identity=F['identity'],images=images,application_source_review_source=F['identity'],independent_review_index=None,independent_review_index_sha256=None,application_source_review_index=None,application_source_review_index_sha256=None,expanded_image_map_sha256=b['expanded_actual_image_UI_migration_maps_sha256']);write(p/'ROOT_RUN_ACK_TEMPLATE.json',ack)
write(p/'actual-build-metadata-absence.json',{k:{'image':q['image'],'observed':{'exists':False,'sha256':None,'app_imports':0},'actual_receipt':str(f),'receipt_sha256':h(f),'exit_code':0,'cleanup':'AUTO_REMOVED'}for k,q,f in [('A',A,ar),('B',B,br)]})
delta=[{'path':n,'A7':inv.get(n),'B4':before.get(n)}for n in sorted(set(inv)|set(before))if inv.get(n)!=before.get(n)]
write(p/'compatibility-comparison.json',{'status':'A7_B4_BOUND_COMPONENT14_NOT_RUN','A_source':F['identity'],'B_source':B['source_identity'],'source_delta':delta,'legacy64_compiled_changed':[n for n in keys if compiled['A'][n]!=compiled['B'][n]],'engine3_planner_policy_equal':all(compiled['A'][n]==compiled['B'][n]for n in keys if n.startswith('packages/relationship-engine/')and n not in ['packages/relationship-engine/dist/index.js','packages/relationship-engine/dist/private-conversation.js']),'all_engine_bytes_equal':False,'all7SQL_equal':A['migration_files']==B['migration_files'],'UI_equal':A['web_dist_files']==B['web_dist_files'],'pilot_authority2_equal':extra['A']==extra['B'],'whole_image_equal':False,'runtime_compiled_keyset':64,'runtime_expanded':76,'full_root_maps':{'A':284,'B':278}})
carry=read(p/'METHOD_CARRY.json');carry.update(status='EXACT_CORRECTIVE06_ALL23_METHOD_MJS_CARRY_NO08RUN',operational08_runtime_core_delta=[])
for row in carry['unchanged_MJS_files']:assert h(p/row['path'])==row['sha256']
write(p/'METHOD_CARRY.json',carry)
checks=[]
for row in read(p/'dependency-pins.json'):
 raw=(p/row['copy']).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['sha256'];f=base/row['source']
 if f.exists():assert f.read_bytes()==raw
 checks.append({'source':row['source'],'sha256':row['sha256'],'exact_materialized_source':f.exists(),'excluded_historical_copy_only':not f.exists()})
write(p/'dependency-checks08.json',checks)
s=(p/'author-rebind-controls.mjs').read_text(encoding='utf-8').replace('historical06-BINDING','historical07-BINDING').replace('current-${key}4-receipt.json.bytes','current-${key}-receipt08.json.bytes').replace('current-A4-receipt.json.bytes','current-A-receipt08.json.bytes').replace('sourcef427','sourceA4').replace('current A4/B4','current A7/B4');(p/'author-rebind-controls.mjs').write_text(s,encoding='utf-8')
# Thin normalcompat02: exact three runtime bytes, only two-image operational ACK input changes.
nold=r/'.artifacts/p05-normal-rollback-probe01';n=base/'.artifacts/p05-normal-rollback-probe02';assert not n.exists();shutil.copytree(nold,n)
normal=read(n/'ROOT-ACK.template.json');prod=r/'.artifacts/p05-pilot-bundle-production-image-binding04/receipt.json';PA=read(prod);assert h(prod)=='4ff52dbc176994106319d35cb442319b51368830fad96ae586d898decafa8ac6';normal['A'].update(source_root=str(base),source_identity=F['identity'],included_files=1846,source_freeze_path=str(freeze),source_freeze_sha256=h(freeze),image_id=PA['image'],image_receipt_path=str(prod),image_receipt_sha256=h(prod),runtime_files={**PA['image_files_sha256'],'build-metadata.json':PA['build_metadata_sha256']});normal.update(status='NOT_AUTHORIZED',method_review_path='PENDING_FINAL_OPERATIONAL_REVIEW',method_review_sha256='PENDING_FINAL_OPERATIONAL_REVIEW');write(n/'ROOT-ACK.template.json',normal)
for name in ['probe.mjs','outer.mjs','DESCRIPTOR.json']:assert(n/name).read_bytes()==(nold/name).read_bytes()
write(n/'OPERATIONAL02.json',{'status':'A7_B4_BINDING_ONLY_NOT_RUN','parent_method_index_sha256':h(r/'.docs/implementation/reviews/p05/normal-production-continuity-independent-round01/INDEX.json'),'runtime_three_exact01':True,'A7normal_image':PA['image'],'B4normal_image':normal['B']['image_id'],'A7source':F['identity'],'sourcefiles':1846,'root_ACK':False,'RUN':False,'historical_prepare_author_py':'Preserved provenance only. Do not run old assembly script; runtime three files are unchanged.'})
# Layout06: exact same workers/helpers/matrix, operational directory/count/status literals only.
lold=r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-v2-layout-producer-resume05';l=base/'.artifacts/p05-v2-layout-producer-resume06';assert not l.exists();shutil.copytree(lold,l)
lb=read(l/'binding.json');lb.update(source_identity=F['identity'],included_files=1846,image=A['image'],root_build_receipt_path=str(ar),root_build_receipt_sha256=h(ar),source_snapshot_path=str(freeze),source_snapshot_sha256=h(freeze),status='FINAL_A7_BOUND_INDEPENDENT_REVIEW_REQUIRED');write(l/'binding.json',lb)
la=read(l/'ROOT_RUN_ACK.json');la.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_index_sha256=None,independent_review_path=None,producer_runtime_digest=None,source_identity=F['identity'],image=A['image'],browser21_actual_PASS_prerequisite='PENDING_ROOT_MUST_VERIFY_ON_FINAL_A7_APP',final_A7_source_image_binding='BOUND_REVIEW_PENDING_NO_RUN');la.pop('final_A4_source_image_binding',None);write(l/'ROOT_RUN_ACK.json',la)
ls=(l/'run.mjs').read_text(encoding='utf-8');assert ls.count('p05-v2-layout-producer-resume05')==1;ls=ls.replace('p05-v2-layout-producer-resume05','p05-v2-layout-producer-resume06').replace('FINAL_A4_BOUND_INDEPENDENT_REVIEW_REQUIRED','FINAL_A7_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace('FINAL_A4_BINDING_REQUIRED','FINAL_A7_BINDING_REQUIRED');(l/'run.mjs').write_text(ls,encoding='utf-8')
ls=(l/'runner-policy.mjs').read_text(encoding='utf-8');assert ls.count('binding.included_files,1842')==1;ls=ls.replace('binding.included_files,1842','binding.included_files,1846');(l/'runner-policy.mjs').write_text(ls,encoding='utf-8')
for f in lold.iterdir():
 if f.is_file()and f.name not in ['binding.json','ROOT_RUN_ACK.json','run.mjs','runner-policy.mjs']:assert(l/f.name).read_bytes()==f.read_bytes()
write(l/'OPERATIONAL06.json',{'status':'A7_ONLY_OPERATIONAL_REBIND_NO_RUN','parent_method_index_sha256':h(r/'.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round04/INDEX.json'),'parent_root05':str(lold),'source_identity':F['identity'],'image':A['image'],'matrix459_same':True,'text54_same':True,'sharedMETHOD21_same':True,'changed_old_files':['binding.json','ROOT_RUN_ACK.json','run.mjs','runner-policy.mjs'],'actual_browser21_prerequisite':'PENDING_FINAL_A7_16PASS_ROOT_VERIFICATION','root_ACK':False})
write(w/'prepare.json',{'at_utc':datetime.now(timezone.utc).isoformat(),'source_identity':F['identity'],'sourcefiles':1846,'OCI08':str(p),'normal02':str(n),'layout06':str(l),'noRUN':True})
with(r/'.history/agents/2026-10-20-p05-a7-operational-rebind-author.md').open('a',encoding='utf-8')as j:j.write(datetime.now(timezone.utc).isoformat()+' UTC — Copied/rebound OCI08(core23exact), normalcompat02(runtime3exact), layout06(worker/matrix/text unchanged; onlydirectory/status/count literals). Exact accepted reviews copied intoA7excluded.docs. FullA7source1846map androotimage284/prod120/B278 checked. NoRUN.\n')
print(json.dumps(read(w/'prepare.json'),indent=2))
