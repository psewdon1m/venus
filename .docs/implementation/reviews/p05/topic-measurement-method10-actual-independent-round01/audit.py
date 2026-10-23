"""Read-only exact-byte audit, no R100 execution or product mutations."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,zipfile,gzip,subprocess,sys,re
ROOT=Path('C:/.projects/venus');E=ROOT/'.docs/implementation/evidence/p05/recovery-method10-actual01';RUN=E/'run';HIST=ROOT/'.artifacts/p05-recovery-source1274-01';OUT=ROOT/'.artifacts/p05-method10-actual-independent01';sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
expected_index='1df4c9fae2f069f0f4d908f108c4ad96cd2975e0dd263a83e9ba9441743457e2'
assert sha(E/'INDEX.json')==expected_index
index=json.loads((E/'INDEX.json').read_bytes());assert len(index['files'])==257
assert len({x['path']for x in index['files']})==257
for row in index['files']:
 p=E/row['path'];assert p.is_file()and p.stat().st_size==row['bytes']and sha(p)==row['sha256'],row['path']
prep=json.loads((RUN/'preparation.json').read_bytes());ack=json.loads((E/'p05-recovery-method10-root-ack01.json').read_bytes());pins=json.loads((RUN/'inputs/input-pins.json').read_bytes())
assert ack['status']=='AUTHORIZED'and ack['attempts']==1 and ack['statistics_RUN']is False
assert ack['preparation_sha256']==sha(RUN/'preparation.json')and prep['input_pin_sha256']==sha(RUN/'inputs/input-pins.json')
assert ack['independent_review_index_sha256']=='bdcf32fe0d96c9c380393274ef4049e5470924a2e5482d9c8eb59766310a29cf'
assert ack['independent_image_review_index_sha256']=='c451ddef9cec3ae0fadf1b9aa3d955c3ce7d5bffa60034cb9b91c9652e44db6c'
for key in ['source_identity','image']:assert prep[key]==ack[key]
assert prep['owner']=='04b359c5c64fd44a12fa5bf02a84e7e9'and prep['id']=='44fbc47d2d5b'
for name,h in prep['metadata_pins'].items():assert sha(RUN/'inputs'/name)==h
assert len(pins['mapping'])==108 and len(pins['producer'])==35
for row in pins['mapping']:
 q=RUN/'inputs'/row['snapshot'];original=Path(row['original']);assert q.stat().st_size==row['bytes']and sha(q)==row['sha256']and sha(original)==row['sha256'],row
for rel,h in pins['producer'].items():assert sha(HIST/rel)==h,rel
# New producer modules must equal the exact independently reviewed method bytes.
author=ROOT/'.docs/implementation/reviews/p05/topic-measurement-method-preparation-round10'
for row in json.loads((author/'INDEX.json').read_bytes())['files']:
 if row['path'].startswith('producer/'):
  name=row['path'][9:];p=RUN/'inputs/next'/name
  if p.exists():assert sha(p)==row['sha256'],name
receipt=json.loads((RUN/'inputs/build-receipt.json').read_bytes());assert len(receipt['host_compiled_files_sha256'])==64
for rel,h in receipt['host_compiled_files_sha256'].items():assert sha(RUN/'inputs/compiled'/rel)==h and sha(HIST/rel)==h
before=json.loads((RUN/'inputs/source-before.json').read_bytes());assert len(before['files'])==1813
for n in ['source-after.json','source-after-finally.json']:assert json.loads((RUN/'control/receipts'/n).read_bytes())==before
sys.path.insert(0,str(HIST/'tools'));from stage_inventory import inventory,identity
current=inventory(HIST);assert current==before['files']and identity(current)==before['identity']==prep['source_identity']
native=json.loads((RUN/'control/receipts/native-inventory.json').read_bytes());export=json.loads((RUN/'control/receipts/export-verification.json').read_bytes());sort=lambda x:sorted(x,key=lambda x:x['path'])
assert len(native['files'])==104 and sort(native['files'])==sort(export['files'])
actual=[]
for p in sorted((RUN/'export').rglob('*')):
 if p.is_file():actual.append({'path':p.relative_to(RUN/'export').as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
assert sort(actual)==sort(native['files'])
assert sum(x['bytes']for x in actual)==native['logical_bytes']
assert int(native['native_available_bytes'])>=10*1024**3+128*1024**2
archive=json.loads((RUN/'control/receipts/archive-verification.json').read_bytes());zp=RUN/'archive/exact-diagnostic.zip'
assert sha(zp)==archive['archive_sha256']and zp.stat().st_size==archive['archive_bytes']
with zipfile.ZipFile(zp)as z:
 zs=z.infolist();assert len({x.filename for x in zs})==len(zs)==len(archive['files'])
 wanted={x['path']:x for x in archive['files']};assert set(wanted)==set(z.namelist())
 for info in zs:
  assert not info.is_dir()and not info.filename.startswith('/')and '..'not in info.filename.split('/')and '\\'not in info.filename and ':'not in info.filename
  b=z.read(info);row=wanted[info.filename];assert len(b)==row['bytes']and hashlib.sha256(b).hexdigest()==row['sha256'];assert sha(RUN/info.filename)==row['sha256']
footprints=[]
for name in ['footprint-before.json','footprint-after-native.json','footprint-after-export.json','footprint-after-archive.json']:
 f=json.loads((RUN/'control/receipts'/name).read_bytes());assert f['cap_bytes']==128*1024**2 and f['total_conservative_bytes']<=f['cap_bytes']
 for key,part in f['parts'].items():
  if key=='control_fully_reserved':assert part['allocated_bytes']==part['logical_bytes']==16*1024**2
  else:
   limit={'inputs':16,'export':20,'archive':20}[key]*1024**2;assert max(part['logical_bytes'],part['allocated_bytes'])<=limit
 footprints.append({'name':name,'total_conservative_bytes':f['total_conservative_bytes']})
worker=json.loads((RUN/'control/receipts/worker-terminal.json').read_bytes());assert worker['code']==0 and worker['signal']is None
summary=json.loads(worker['stdout']);report=json.loads((RUN/'export/report.json').read_bytes());assert summary['status']==report['status']=='NON_GATING_FIXED_R100_DIAGNOSTIC_COMPLETE'
assert summary['rounds']==report['rounds_completed']==report['current_round']==100 and summary['error']is None
assert report['descriptor']=={'size':8,'mode':'truth_or_dare','context':'online','capability':'CHAT_ON','regime':'T6_TARGETED_CHANGES','rounds':100,'comfort':4,'class_profile':'F','seed_literal':'venus:P05-AUTHOR-FULL-CYCLE-CPU-1:N8:online:CHAT_ON:T6:TD:R100'}
assert report['elapsed_wall_ms']==summary['wall_ms']<300000 and report['peak_observed_rss_bytes']<=1536*1024**2
assert report['actual_PG_HTTP_WS']is False and report['statistics_RUN']is False and report['full_matrix_feasibility']is False and report['human450_approved']is False
progress=sorted((RUN/'export/progress').glob('*.json'));assert len(progress)==100
lastwall=lastcpu=0
for n,p in enumerate(progress,1):
 x=json.loads(p.read_bytes());assert x['rounds_completed']==x['current_round']==n
 assert x['wall_ms']>=lastwall and int(x['cgroup_cpu_stat']['usage_usec'])>=lastcpu
 assert int(x['native_available_bytes'])>=10*1024**3+128*1024**2
 lastwall=x['wall_ms'];lastcpu=int(x['cgroup_cpu_stat']['usage_usec'])
# Verify bounded actual gzip streams without outputting synthetic private payloads.
streams={}
for directory in ['public','synthetic-private']:
 count=total=0
 for p in sorted((RUN/'export'/directory).glob('*.gz')):
  with gzip.open(p,'rb')as g:
   data=g.read(20*1024**2+1);assert len(data)<=20*1024**2
  total+=len(data);lines=data.splitlines();count+=len(lines)
  assert all(json.loads(line)is not None for line in lines)
 streams[directory]={'records':count,'uncompressed_bytes':total}
assert streams['public']['records']==report['accounting']['public']['records']
terminal=json.loads((E/'p05-recovery-method10-run01.txt').read_bytes());supervisor=json.loads((RUN/'control/live/watchdog-terminal.json').read_bytes());captured=json.loads(terminal['supervisor_diagnostics']['stdout'])
assert captured=={**supervisor,'terminal_receipt_written':True}
assert captured['io_failure']is None and captured['capacity_fault']is None and captured['phase']=='DONE'and captured['manual_cleanup_required']is False
assert terminal['supervisor_diagnostics']['stderr']==''and all(terminal['supervisor_diagnostics'][k]is False for k in ['stdout_truncated','stderr_truncated'])and terminal['supervisor_diagnostics']['spawn_error']is None
phases=['BOOTSTRAP','PROBE','RUN','STOP','EXPORT','ARCHIVE','CLEANUP','DONE'];events=captured['events'];assert[x['phase']for x in events]==phases
for a,b in zip(events,events[1:]):assert b['elapsed_ms']>=a['elapsed_ms']and b['elapsed_ms']-a['elapsed_ms']<=ack['phase_limits_ms'][a['phase']]
assert terminal['elapsed_ms']==67889.064 and terminal['error']is terminal['capacityFault']is None and terminal['auditFailures']==[]
assert int((E/'p05-recovery-method10-run01-exit.txt').read_text())==0
for n in ['worker-created-inspect.json','worker-terminal-inspect.json']:
 c=json.loads((RUN/'control/receipts'/n).read_bytes());assert c['Image']==prep['image']and c['Name']=='/'+prep['container']and c['Config']['Labels']['com.venus.measurement.owner']==prep['owner'];h=c['HostConfig'];assert h['Memory']==1536*1024**2 and h['NanoCpus']==1000000000 and h['NetworkMode']=='none'and h['ReadonlyRootfs']and not h['PortBindings'];assert all(m['Destination']=='/venus-output'or not m['RW']for m in c['Mounts'])
 if n.startswith('worker-terminal'):assert not c['State']['Running']and c['State']['ExitCode']==0 and c['State']['OOMKilled']is False
cleanup=json.loads((RUN/'control/receipts/owned-after-cleanup.json').read_bytes());assert cleanup['cleanup']=='completed'and cleanup['remaining']=={'containers':[],'volumes':[]}and cleanup['workerStopped']is True and cleanup['artifact_write_calls']==0
# Read-only actual current inventory, scoped to this exact owner only.
docker='C:/Program Files/Docker/Docker/resources/bin/docker.exe';calls=[]
for args in [['ps','-aq','--no-trunc','--filter','label=com.venus.measurement.owner='+prep['owner']],['volume','ls','-q','--filter','label=com.venus.measurement.owner='+prep['owner']]]:
 c=subprocess.run([docker,'--context','desktop-linux',*args],capture_output=True,timeout=15);assert len(c.stdout)+len(c.stderr)<=65536;calls.append({'args':args,'exit_code':c.returncode,'stdout':c.stdout.decode(),'stderr':c.stderr.decode()});assert c.returncode==0 and not c.stdout.strip()
result={'status':'PASS_FIXED_SINGLE_R100_ACTUAL_AUDIT_NOT_FULL_STATISTICS','created_at':datetime.now(timezone.utc).isoformat(),'evidence_index_sha256':expected_index,'verified_evidence_files':257,'prepared_mapping_records':108,'producer_records':35,'compiled_files':64,'included_source_files':1813,'source_identity':prep['source_identity'],'image':prep['image'],'owner':prep['owner'],'native_and_export_files':104,'native_logical_bytes':native['logical_bytes'],'native_allocated_bytes':native['allocated_bytes'],'native_free_bytes':native['native_available_bytes'],'archive_entries':len(archive['files']),'archive_bytes':archive['archive_bytes'],'archive_sha256':archive['archive_sha256'],'footprints':footprints,'worker_wall_ms':report['elapsed_wall_ms'],'parent_wall_ms':terminal['elapsed_ms'],'supervisor_wall_ms':captured['elapsed_monotonic_ms'],'worker_rounds':100,'peak_rss_bytes':report['peak_observed_rss_bytes'],'streams':streams,'actual_current_owner_inventory':calls,'original_attempt_unchanged':True,'full_statistics':False,'full_matrix_feasibility':False,'current_live_stage_acceptance':False,'full_P05_PASS':False,'human450_470':'HOLD_UNCHANGED'}
(OUT/'audit-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps(result))
