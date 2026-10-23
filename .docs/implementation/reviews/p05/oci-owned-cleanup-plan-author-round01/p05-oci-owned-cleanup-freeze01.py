from pathlib import Path
import json,hashlib,shutil
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-oci-owned-cleanup-plan01';path=root/'.artifacts/p05-oci-owned-cleanup-plan01.json';plan=json.loads(path.read_text());commands=json.loads((work/'COMMANDS.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
for project in plan['projects']:
 project['saved_to_current_resolution']={}
 for kind,resources in project['current_observation'].items():
  resolution=[]
  for saved in project['saved_remaining_owned'][kind]:
   matches=[r.get('id',r.get('name')) for r in resources if (r.get('id',r.get('name'))==saved if kind=='volumes' else r['id'].startswith(saved))]
   assert len(matches)<=1
   resolution.append({'saved_identifier':saved,'current_identifier':matches[0] if matches else None,'observed':'PRESENT_METADATA_MATCH' if matches else 'ABSENT_FILTERED_OBSERVATION_NO_DELETE'})
  project['saved_to_current_resolution'][kind]=resolution
  for resource in resources:
   fields=['id','name','image_id','image_reference','labels','created'] if kind=='containers' else ['id','name','labels','created','driver','internal'] if kind=='networks' else ['name','labels','created','driver','scope']
   immutable={k:resource[k] for k in fields};resource['immutable_identity_projection']=immutable;resource['immutable_identity_sha256']=sha(json.dumps(immutable,sort_keys=True,separators=(',',':')).encode())
   identifier=resource.get('id',resource.get('name'))
   matches=[c for c in commands if c['project']==project['project'] and len(c['argv'])>3 and c['argv'][2]=='inspect' and c['argv'][-1]==identifier];assert len(matches)==1
   for proposal in project['proposed_commands_HOLD_NOT_EXECUTED']:
    if proposal.get('id',proposal.get('name'))==identifier:
     proposal['revalidate_command']=matches[0]['argv'];proposal['immutable_identity_projection_sha256_required']=resource['immutable_identity_sha256'];proposal['revalidate_exact_fields']=fields
  if kind=='networks':
   expected={c['id'] for c in project['current_observation']['containers']}
   for network in resources:assert set(network['attached_container_ids'])<=expected
plan['execution_order_after_future_authority']=['Reverify every archival basis/evidence hash and exact plan SHA; exclusive root cleanup window','Freshly enumerate only exact seven project labels and reject unknown extra resources/owners; no discovery broadening','For each fixed full container ID revalidate immutable identity; stop ONLY if still running, then re-inspect same ID and require stopped before non-force rm','Re-inspect fixed network full IDs/ownership, require empty endpoint set, then non-force network rm','Re-inspect exact volume name/created/driver/scope/labels, then non-force volume rm; Docker refusal if any container references it is a fail-closed guard, never force','Fresh exact-project and exact-owner filtered inventories must be empty; preserve all commands/exit codes and historical FAIL reports']
plan['foreign_reference_scope']='Only allowed project metadata was observed. No global foreign-container inspection or absence proof; non-force Docker network/volume removal must refuse unknown attachments/references, and any refusal stops cleanup without force or expanding scope.'
plan['cleanup_execution_authority']=False
save(path,plan)
packet=root/'.docs/implementation/reviews/p05/oci-owned-cleanup-plan-author-round01';assert not packet.exists();packet.mkdir(parents=True)
shutil.copyfile(path,packet/'CLEANUP-PLAN.json')
transcript=[]
for entry in commands:
 stdout=(work/entry['stdout_file']).read_bytes();stderr=(work/entry['stderr_file']).read_bytes();assert sha(stdout)==entry['stdout_sha256'] and sha(stderr)==entry['stderr_sha256']
 transcript.append({**entry,'stdout_utf8':stdout.decode(),'stderr_utf8':stderr.decode()})
save(packet/'READONLY-TRANSCRIPT.json',transcript)
for name in ['p05-oci-owned-cleanup-plan01.py','p05-oci-owned-cleanup-freeze01.py','p05-oci-owned-cleanup-plan01.stdout.txt','p05-oci-owned-cleanup-plan01.stderr.txt']:shutil.copyfile(root/'.artifacts'/name,packet/name)
archive09=root/'.docs/implementation/evidence/p05/compatible-rollback09-actual01';shutil.copyfile(archive09/'INDEX.json',packet/'OCI09-ARCHIVE-INDEX.json')
basis=[]
for row in plan['projects']:
 for name,pin in row['basis'].items():
  actual=root/name;assert sha(actual.read_bytes())==pin['sha256'] and len(actual.read_bytes())==pin['bytes'];basis.append({'project':row['project'],'path':name,**pin})
save(packet/'BASIS-PINS.json',basis)
save(packet/'HANDOFF.json',{'status':'AUTHOR_PLAN_COMPLETE_HOLD_NO_CLEANUP_AUTHORITY','writes':'COMPLETE','plan_path':str(path),'plan_sha256':sha(path.read_bytes()),'projects':[{k:r[k] for k in ['producer_version','project','owner']} for r in plan['projects']],'actual_totals':plan['current_totals'],'readonly_Docker_commands':70,'mutations':0,'active_OCI20_excluded':'venus-p05-oci-c17e7f47baae','archive09_sha256':sha((archive09/'INDEX.json').read_bytes()),'independent_plan_and_archive_sufficiency_review':'PENDING','fullOCI20_and_independent_export_review':'PENDING_NO_AUTO_UNHOLD'})
(packet/'REPORT.md').write_text('''# Exact-owner historical OCI cleanup plan

AUTHOR COMPLETE, HOLD_NO_CLEANUP_AUTHORITY. No resource was stopped, removed, started or modified. No APP, image, private ENV, DB data, cookies, keys or mounted data was read. Active OCI20 project venus-p05-oci-c17e7f47baae was excluded from all queries.

The seven-project allowlist is derived from original plan.json/runner.json/TERMINAL and saved ownership inventories for OCI09,10,11,12,13,17,18. All owner32 identifiers are read from original records and cross-checked, not guessed. Every basis file and exact frozen archive index/raw-file-map is hashed in BASIS-PINS. Saved inventory428a692a is past retention evidence, not proof of current existence.

Seventy read-only Docker commands queried only these seven exact com.venus.oci.project labels and their resulting full IDs/names with explicit inspect field projections. No full Docker ENV inspect, exec, global inventory or foreign resource inspection occurred. Current observation found14 containers,7 networks,28 volumes: exactly one exited DB and one running keeper per project, one network and four volumes. All IDs resolve uniquely from saved prefixes/names; owner/project/role labels, names and image IDs match original plans. Network endpoint IDs are confined to the selected owner containers. These observations are sequential metadata snapshots, not a fresh deletion authorization or a global foreign-reference absence proof.

CLEANUP-PLAN contains exact full container/network IDs and volume names, immutable identity projections and hashes, concrete projected re-inspect commands, and object-specific proposed stop/rm argv arrays marked HOLD_NOT_EXECUTED. Immediately before each future action, root must revalidate exact project/owner/role/fullID/name/image/creation fields and basis hashes. Running keepers need a verified owner-specific graceful stop, then stopped-state check before non-force rm. After containers are removed, networks require no endpoints and volumes use non-force rm only. Docker refusal due to any unknown reference must stop cleanup; never force removal, detach unknown resources, broaden the allowlist, remove images, recurse through host files or globally prune.

Root also authorized closing the missing durable09 archive gap. compatible-rollback09-actual01 now copies12 pre-existing SAFE host metadata reports/pin maps plus an exact selected-file map. Original FAIL/TypeError/unknown cause and retained status remain. This is later archival reconciliation, not a new export, complete private-volume export, successful runner proof or PASS. First_error A1 remains unknown beyond saved typed metadata. Logs/live control/unselected evidence were not copied. The new archive and historical export sufficiency still require independent review before any state destruction; export_error:null alone is not that acceptance.

HOLD may be lifted only by a fresh explicit root cleanup authorization binding this exact plan after full actual OCI20 compatibility14 PASS, successful export/cleanup terminal and independent actual/export review, plus independent review of the seven-project plan and historical SAFE evidence sufficiency. Any missing basis, changed identity, additional resource, unexpected owner, running-state transition or unknown reference remains fail-closed. The plan does not auto-activate if OCI20 later finishes. Historical FAIL and all evidence remain preserved.
''',encoding='utf-8')
index={'status':'AUTHOR_EXACT_OWNER_CLEANUP_PLAN_COMPLETE_HOLD_NO_DELETION','writes':'COMPLETE','plan_sha256':sha(path.read_bytes()),'cleanup_authority':False,'files':{str(p.relative_to(packet)).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(packet.rglob('*')) if p.is_file()}}
save(packet/'INDEX.json',index);print(json.dumps({'index':str(packet/'INDEX.json'),'sha256':sha((packet/'INDEX.json').read_bytes()),'children':len(index['files']),'plan_sha256':sha(path.read_bytes()),'archive09_sha256':sha((archive09/'INDEX.json').read_bytes())}))
