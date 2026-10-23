from pathlib import Path
import json,hashlib,shutil,datetime
r=Path('C:/.projects/venus');w=r/'.artifacts/p05-oci-owned-cleanup-plan02';path=r/'.artifacts/p05-oci-owned-cleanup-plan02.json';plan=json.loads(path.read_bytes());parent=r/'.artifacts/p05-oci-owned-cleanup-plan01.json';sha=lambda b:hashlib.sha256(b).hexdigest();canon=lambda o:json.dumps(o,sort_keys=True,separators=(',',':')).encode()
assert sha(parent.read_bytes())=='5bb9cf550c5a0110a803c292b19644b0c0be41910f2e3fbe72642832e19e27bf';assert plan['status']=='HOLD_NO_CLEANUP_AUTHORITY'and plan['cleanup_execution_authority']is False
basis=[]
for row in plan['projects']:
 for name,pin in row['basis'].items():
  f=r/name;assert f.stat().st_size==pin['bytes']and sha(f.read_bytes())==pin['sha256'];basis.append({'project':row['project'],'path':name,**pin})
 base=(r/next(n for n in row['basis']if n.endswith('/plan.json'))).parent
 if row['producer_version']in[20,22]:
  names=['RAW_INDEX.json','browser-B2-ready.json','browser-terminal.json','evidence/phase-A1-terminal.json','evidence/phase-B2-terminal.json','evidence/phase-A3-terminal.json','source-after-finally.json','producer-after-finally.json']
  row['selected_host_export_presence_not_completeness']={n:(base/n).is_file()for n in names}
  row['export_sufficiency_status']='PENDING_INDEPENDENT_REVIEW; saved export_error:null is not sufficiency approval'
 networks={x['id']:x for x in row['current_observation']['networks']};volnames={v['name']for v in row['current_observation']['volumes']}
 for c in row['current_observation']['containers']:
  assert c['current_identity_matches_saved_plan']and all(n['id']in networks and n['name']==networks[n['id']]['name']for n in c['networks']);assert all(m['name']in volnames for m in c['mounts']if m['type']=='volume');assert sha(canon(c['immutable_identity_projection']))==c['immutable_identity_sha256']
 assert not row['identity_findings']
plan['metadata_attempts']={'attempt01_readonly_commands':3,'attempt01_success':2,'attempt01_failed':1,'attempt01_failure':'Go inspect template .Name absent on a bind mount; no ENV/content projection','completed_reinspection02_commands':90,'total_Docker_readonly_commands_this_task':93,'mutations':0}
path.write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
d=r/'.docs/implementation/reviews/p05/oci-owned-cleanup-plan-author-round02';assert not d.exists();d.mkdir(parents=True)
def save(name,value):
 f=d/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes((json.dumps(value,indent=2)+'\n').encode()if not isinstance(value,str)else value.encode())
def copy(source,name):
 f=d/name;f.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,f)
copy(path,'CLEANUP-PLAN.json')
transcript=[]
for entry in json.loads((w/'reinspection02/COMMANDS.json').read_bytes()):
 a=(w/'reinspection02'/entry['stdout_file']).read_bytes();b=(w/'reinspection02'/entry['stderr_file']).read_bytes();assert sha(a)==entry['stdout_sha256']and sha(b)==entry['stderr_sha256'];assert entry['exit_code']==0;transcript.append({**entry,'stdout_utf8':a.decode(),'stderr_utf8':b.decode()})
assert len(transcript)==90;save('READONLY-TRANSCRIPT.json',transcript)
for f in w.glob('00*.*.txt'):copy(f,'attempt01/'+f.name)
for name in ['p05-oci-owned-cleanup-plan02.py','p05-oci-owned-cleanup-plan02-attempt01.py','p05-oci-owned-cleanup-plan02.stdout.txt','p05-oci-owned-cleanup-plan02.stderr.txt']:copy(r/'.artifacts'/name,name)
for name in ['reinspection02.stdout.txt','reinspection02.stderr.txt']:copy(w/name,name)
save('BASIS-PINS.json',basis)
save('CHECKS.json',{'status':'AUTHOR_METADATA_PLAN_COMPLETE_HOLD','projects':9,'observed_objects':plan['current_totals'],'identity_findings':0,'final_readonly_commands':90,'initial_readonly_attempt':{'success':2,'failed':1},'old7_owner_id_image_core_identity_unchanged':True,'network_endpoints_only_selected_containers':True,'container_networks_match_selected_network_ids':True,'volume_mount_names_only_selected_volumes':True,'all_basis_hashes_reverified':True,'parent_plan_sha256_unchanged':sha(parent.read_bytes()),'executor_created':False,'cleanup_authority':False,'native_experiments_or_APP_writes':False,'private_contents_read':False,'prospective_nonforce_commands_executed':False})
save('HANDOFF.json',{'status':'AUTHOR_EXACT9_CLEANUP_PLAN_COMPLETE_HOLD_NO_AUTHORITY','writes':'COMPLETE_STOP','plan_path':path.relative_to(r).as_posix(),'plan_sha256':sha(path.read_bytes()),'parent_plan_sha256':sha(parent.read_bytes()),'observed_objects':plan['current_totals'],'projects':[{k:x[k]for k in ['producer_version','project','owner']}for x in plan['projects']],'currentOCI23_full14_PASS_and_independent_export_review':'PENDING_NO_AUTO_UNHOLD','historical_export_sufficiency':'PENDING_INDEPENDENT_FOR_ALL9','cleanup_execution_authority':False})
save('REPORT.md','''# Exact-owner retained OCI cleanup plan02

AUTHOR COMPLETE_STOP, HOLD_NO_CLEANUP_AUTHORITY. This is a read-only metadata plan, not an executor, active ACK, deletion authorization, green cleanup or P05 PASS. No resource was started/stopped/removed, no image/APP changed and no ENV, mounted data, DB, keyring, cookie or private volume contents read. The two active YesBut API cohorts and foreign ra20261020 objects were not queried or touched.

Plan01 remains byte exact5bb9cf55. Its seven historical projects09–13/17/18 retain identical saved owners, full resolved IDs, image references/IDs and core creation/identity fields. Plan02 adds only actual20 owner58d4c07c1038a8c1d779c024d742f517 from original source13 plan and actual22 owner7fac6dd9ae2188b866519184b2f79431 from original source14 plan. All nine tuples are explicit in HANDOFF/CLEANUP-PLAN; no owner is guessed. Each saved FAIL/retained terminal, plan/runner, remaining-owned inventory and PG image record is hashed. Existing historical safe archive references remain linked; the09 curated metadata-only archive3b1a6b66 is unchanged. New20 independent diagnosis1fc545b8 and22 diagnosis5dcf6ca4 are pinned with their safe host export roots and selected report/pin files.

Completed reinspection used90 exact-project-filtered Docker metadata commands, all exit0. It currently observes18 containers (one exited DB and one running keeper/project),9 networks and36 volumes. All saved IDs resolve uniquely; no ownership/image/core-identity finding. Container mount projection includes only type, volume name, destination and RW, never host source/content. Container network projection includes only network name/full ID, never addresses. Every selected container membership matches a selected network and every volume mount name belongs to the selected project. Network endpoints reference only selected owned containers. These are sequential observations, not simultaneous-state, deletion authority or a global foreign-reference absence proof.

Initial attempt issued three read-only commands: two exit0; third inspect exit1 because a bind mount lacks Go-template .Name. Its script/stdout/stderr remain preserved, without ENV or data. The corrected projection uses optional index Name and retained bounded explicit fields. Completed second reinspection is separate. Total task Docker commands93, with92 successful/1 failed, zero mutations. No retry of a functional or native acceptance run occurred.

Every object has a fixed full container/network ID or exact volume name, immutable identity projection/hash, concrete safe reinspection argv and proposed nonforce cleanup argv marked HOLD_NOT_EXECUTED. Container fingerprints include mount/network configuration; state is separately inspected dynamically. Root must reverify exact plan/evidence hashes, enumerate only these nine project labels and reject extra/changed resources, then immediately revalidate full object identity and owner/project/role before every action. Stop only a revalidated running container; reinspect stopped identity before nonforce rm. Only after selected containers are removed may root revalidate endpoint-empty networks and exact volumes for nonforce removal. Any reference refusal/change/unknown endpoint stops cleanup without force, detach, discovery broadening, image removal, global prune or filesystem deletion. No proposed command has been executed.

Evidence qualifications remain explicit. Existing09 is a selected SAFE metadata archival reconciliation, not a complete private-volume export. Existing20/22 failures have safe host exports and independent failure diagnoses, not independent preservation/export-sufficiency acceptance. Selected RAW_INDEX/browser/phase presence is recorded in the plan rather than fabricated; missing success-path files cannot become successful OCI controls. A saved export_error:null alone proves no independent sufficiency. No private-volume backup/export was attempted or asserted. The exact criterion for safely discarding those temporary fixtures must be independently accepted before destruction.

HOLD requires currentOCI23 full14 actualPASS with successful export/cleanup terminal, independent actual/export-sufficiency audit, independent plan02/historical-safe-evidence sufficiency review for all nine, and fresh explicit root cleanup authorization binding this exact plan hash and tuples. A fresh exclusive cleanup/reinspection window is mandatory. OCI23 success alone does not auto-activate this plan. Historical FAIL and all original archives remain untouched.
''')
files={f.relative_to(d).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}for f in sorted(d.rglob('*'))if f.is_file()};save('INDEX.json',{'status':'AUTHOR_EXACT9_CLEANUP_PLAN_COMPLETE_HOLD_NO_AUTHORITY','writes':'COMPLETE_STOP','plan_sha256':sha(path.read_bytes()),'cleanup_authority':False,'files':files})
print(json.dumps({'index':str(d/'INDEX.json'),'sha256':sha((d/'INDEX.json').read_bytes()),'children':len(files),'plan_sha256':sha(path.read_bytes()),'observed':plan['current_totals'],'cleanup_authority':False}))
