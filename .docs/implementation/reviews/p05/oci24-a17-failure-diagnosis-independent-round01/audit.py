from pathlib import Path
import json,hashlib,shutil,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
raw=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-p05-oci-e353fdd389fc';inputs=raw/'inputs';source=R/'.artifacts/p05-pilot-bundle-source14'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
t=read(raw/'TERMINAL.json');runner=read(raw/'runner.json');ack=read(raw/'authority-ack.json');external=R/'.artifacts/p05-a17-compatible-rollback24-root-ack01.json';assert read(external)==ack
assert t['status']==runner['status']=='FAIL' and t['first_error']=={'name':'AssertionError','code':'ERR_ASSERTION','phase':'A3','source_module':'api-child','source_line':34,'source_column':143}
phases={x:read(raw/f'evidence/phase-{x}-terminal.json')for x in ['A1','B2','A3']};a=phases['A3']
assert phases['A1']['status']==phases['B2']['status']=='PHASE_COMPLETE' and a['status']=='FAIL'
assert a['live_before_boot']['live_invitation_action_topic_advice_chat'] and a['raw_revoked']['raw_round_stopped'] and a['raw_revoked']['snapshot_history_unchanged']
assert a['migration_only']['all_user_rows_equal'] and a['migration_only']['all_sequences_equal'] and a['authority_before_after_boot_equal']
assert all(a['preserved'].values()) and len(a['replay'])==13
assert [x['kind']for x in a['replay']].count('read')==3 and [x['kind']for x in a['replay']].count('revoked_round_view')==1 and [x['kind']for x in a['replay']].count('exact_and_new_ID')==9
assert all(x['fresh_status']==409 and x['new_receipts']==0 for x in a['replay']if x['kind']=='exact_and_new_ID')
assert 'final_current'not in a and t['export_error'] is None and t['cleanup_error'] is None
assert t['cleanup']=='retained_manual_cleanup_required' and sum(map(len,t['remaining_owned'].values()))==7
api=(inputs/'api-child.mjs').read_text();line=api.splitlines()[33];assert line.index('assert.equal(stop.status,200)')+1==136 and line[142:147]=='equal'
assert "h.call(E.host,h.base(E)+`/${E.game}/stop`" in line
scenario=(inputs/'scenarios.mjs').read_text();assert 'const selected=f.members.slice(1,3);assert(selected.every(a=>a.id!==f.host.id))' in scenario
assert 'players:selected.map(a=>a.id)'in scenario and 'f.excludedActor=first.id' in scenario
freeze=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');assert ack['source_identity']==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
names=['source-A1-before.json','source-B2-before.json','source-A3-before.json','source-after-finally.json'];snap=[read(raw/n)for n in names];assert all(x==snap[0]for x in snap) and snap[0]['files']==freeze['files'] and len(freeze['files'])==1871
pn=['producer-A1-before.json','producer-B2-before.json','producer-A3-before.json','producer-after-finally.json'];ps=[read(raw/n)for n in pn];assert all(x==ps[0]for x in ps)
assert ack['independent_review_index_sha256']=='82090b5d25f48cebaae3907b2bdd546bb691b2e74b49ebf333d0da30ae4c5feb'
sp={}
for n in ['apps/api/src/topic-games.ts','apps/api/src/topic-game-routes.ts','apps/api/src/security.ts']:
 p=source/n;assert pin(p)['sha256']==freeze['files'][n];sp[n]=pin(p)
host=(inputs/'host-runner.mjs').read_text();assert 'b.replay.length===12&&c.replay.length===12' in host
assert read(R/'.artifacts/p05-oci24-a17-run01.exit.json')['exit_code']==1
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';cold=subprocess.run([node,str(O/'stop-contract-cold.mjs')],cwd=R,capture_output=True,timeout=30)
(O/'cold.stdout.txt').write_bytes(cold.stdout);(O/'cold.stderr.txt').write_bytes(cold.stderr);assert cold.returncode==0,cold.stderr.decode()
dest=O/'raw';dest.mkdir(exist_ok=True)
for n in ['runner.json','TERMINAL.json','owned-after-cleanup.json','authority-ack.json','actual-native-quotas.json','evidence/phase-A1-terminal.json','evidence/phase-B2-terminal.json','evidence/phase-A3-terminal.json']:
 p=dest/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(raw/n,p)
for n in ['p05-oci24-a17-run01.txt','p05-oci24-a17-run01.exit.json']:shutil.copyfile(R/'.artifacts'/n,dest/n)
(O/'INPUT-PINS.json').write_text(json.dumps({'external_ack':{'path':str(external),**pin(external),'semantic_equal_export':True},'source_producer_snapshots':{n:pin(raw/n)for n in names+pn},'source_files':sp,'executed_runtime':{n:pin(inputs/n)for n in ['api-child.mjs','scenarios.mjs','host-runner.mjs','contract.mjs']},'freeze':pin(R/'.artifacts/p05-pilot-bundle-source-freeze14.json')},indent=2)+'\n')
d={'status':'DIAGNOSIS_COMPLETE_OCI24_ACTUAL_FAIL_RETAINED','source_identity':ack['source_identity'],'included_files':1871,'images':ack['images'],'method_review':ack['independent_review_index_sha256'],'owner':read(raw/'plan.json')['owner'],'phase_status':{k:v['status']for k,v in phases.items()},'first_error':t['first_error'],'elapsed_ms':t['whole_elapsed_ms'],'A3_elapsed_ms':a['elapsed_ms'],'actual_stop_status_code':'NOT_EXPORTED','stop_source_finding':'NONSELECTED_HOST_USES_PARTICIPANT_ONLY_STOP','expected_rev':'OPTIONAL_AND_NOT_CHECKED_FOR_SAFETY_STOP','cold_exact_method_controls':4,'cold_exit':cold.returncode,'replay_rows_actual':13,'latent_host_summary_expected':12,'latent_summary_failure_observed':False,'cleanup':t['cleanup'],'retained_owned_objects':7,'export_error':None,'cleanup_error':None,'source_and_producer_snapshots_exact':True,'reported_success_path_source_flag':runner['source_producer_unchanged'],'native_actions':0}
(O/'AUDIT.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps(d))
