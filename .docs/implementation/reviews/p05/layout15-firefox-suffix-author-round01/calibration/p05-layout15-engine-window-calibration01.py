from pathlib import Path
import json,subprocess,hashlib,uuid,datetime
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-layout15-engine-window-calibration01';out.mkdir()
image='sha256:b3ff0e81571977b5950cb8dd97d2c9a2bfb2ec70c65da25b5fee914b67ce765f';owner=uuid.uuid4().hex;project='venus-layout-window-'+uuid.uuid4().hex[:12]
script=root/'.artifacts/p05-layout15-engine-window-calibration01.mjs';sha=lambda b:hashlib.sha256(b).hexdigest()
ack={'status':'AUTHORIZED_SINGLE_SYNTHETIC_DIAGNOSTIC_NOT_STAGE_RUN','authority':'ROOT_DIRECT_MESSAGE_2026_10_21','owner':owner,'project':project,'image':image,'script_sha256':sha(script.read_bytes()),'per_engine_bound_ms':20000,'engines':2,'DB_API_private_data':False,'network':'none','readonly':True}
(out/'DIAGNOSTIC-ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf-8')
args=['docker','run','--name',project,'--label','venus.p05.project='+project,'--label','venus.p05.owner='+owner,'--label','venus.p05.role=synthetic-window-diagnosis','--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','3g','--cpus','2','--pids-limit','256','--shm-size','1g','--tmpfs','/tmp:size=1g,mode=1777,exec','--tmpfs','/home/node:size=64m,uid=1000,gid=1000','--mount','type=bind,source='+str(script)+',target=/app/window-diag.mjs,readonly',image,'node','/app/window-diag.mjs']
(out/'COMMAND.json').write_text(json.dumps({'argv':args,'cwd':str(root)},indent=2)+'\n',encoding='utf-8')
result=subprocess.run(args,cwd=root,capture_output=True,timeout=75)
(out/'stdout.json').write_bytes(result.stdout);(out/'stderr.txt').write_bytes(result.stderr);(out/'exit.txt').write_text(str(result.returncode)+'\n')
inspect=subprocess.run(['docker','inspect',project],capture_output=True,timeout=30);assert inspect.returncode==0
rows=json.loads(inspect.stdout);assert len(rows)==1;row=rows[0]
labels=row['Config']['Labels'];assert labels['venus.p05.project']==project and labels['venus.p05.owner']==owner and labels['venus.p05.role']=='synthetic-window-diagnosis';assert row['Image']==image;assert row['State']['Running'] is False
(out/'owned-stopped-inspect.json').write_bytes(inspect.stdout)
remove=subprocess.run(['docker','rm',project],capture_output=True,timeout=30);(out/'cleanup.stdout.txt').write_bytes(remove.stdout);(out/'cleanup.stderr.txt').write_bytes(remove.stderr);assert remove.returncode==0
remaining=subprocess.run(['docker','ps','-aq','--filter','label=venus.p05.owner='+owner],capture_output=True,timeout=30);assert remaining.returncode==0 and remaining.stdout.strip()==b''
summary={'owner':owner,'project':project,'image':image,'worker_exit':result.returncode,'cleanup':'PASS_OWNED_STOPPED_CONTAINER_REMOVED','remaining_owned_containers':[],'authority':'SINGLE_DIAGNOSTIC_ONLY_NO_LAYOUT_ACK','timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(out/'TERMINAL.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps(summary))
