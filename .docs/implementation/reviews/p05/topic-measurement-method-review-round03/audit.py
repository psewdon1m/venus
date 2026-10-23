from pathlib import Path
import json,hashlib,zipfile,gzip,os,re,collections
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf8'))
def packet(name,expected=None):
 p=ROOT/'.docs/implementation/reviews/p05'/name;index=p/'index.json';raw=index.read_bytes()
 if expected:assert sha(raw)==expected
 data=load(index)
 for row in data['files']:
  b=(p/row['path']).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'],(name,row['path'])
 return p,{'index_sha256':sha(raw),'verified_children':len(data['files'])}
proposal,pi=packet('topic-measurement-method-proposal-round03','3d660d6284b9089da935169754502c08a4571ed9c91a7832caa601d91a1afb2c');design,di=packet('topic-measurement-design-round03');review,ri=packet('topic-measurement-design-review-round03');r100,rr=packet('topic-measurement-r100-diagnostic-round02','54f2f1dc097b1e1f69e9e7f845613061144699791a3e8d9760e9ac77f9bb7f1e')
handoff=load(proposal/'HANDOFF.json')
for r in handoff['primary_contracts']:assert sha((ROOT/r['path']).read_bytes())==r['sha256']
assert load(review/'report.json')['status']=='DESIGN_CORRECTIONS_ACCEPTED_NOT_RUN'
archive=load(r100/'archive.json');assert sha((r100/'exact-run.zip').read_bytes())==archive['sha256']=='3480cee35b0acb18acbc77cb0911173fcebf8e39f0876863168fdcb39d0a4c59'
with zipfile.ZipFile(r100/'exact-run.zip') as z:
 assert len(z.namelist())==len(set(z.namelist()))==270
 for r in archive['raw_map']:
  b=z.read(r['path']);assert len(b)==r['bytes'] and sha(b)==r['sha256']
 pins=json.loads(z.read('input-pins.json'));assert len(pins['mapping'])==96
 for r in pins['mapping']:
  b=z.read(r['snapshot_path']);assert len(b)==r['bytes'] and sha(b)==r['sha256']
 before=json.loads(z.read('source-before.json'));after=json.loads(z.read('source-after.json'));assert before==after and before['identity']=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4'
 progress=[json.loads(z.read('progress/'+str(i).zfill(3)+'.json')) for i in range(1,78)];assert [r['rounds_completed'] for r in progress]==list(range(1,78));last=progress[-1]
 streams={}
 for stream in ['public','synthetic-private']:
  paths=sorted(n for n in z.namelist() if n.startswith('diagnostic/'+stream+'/') and n.endswith('.gz'));count=raw_bytes=gzip_bytes=0;transports=collections.Counter();modeled=collections.Counter()
  for n in paths:
   comp=z.read(n);raw=gzip.decompress(comp);raw_bytes+=len(raw);gzip_bytes+=len(comp)
   for line in raw.decode('utf8').splitlines():
    row=json.loads(line);count+=1
    if stream=='public' and 'raw_serialized_UTF8' in row:
     body=row['raw_serialized_UTF8'].encode();assert sha(body)==row['raw_sha256'] and len(body)==row['byte_length'];transports[str(row.get('transport'))]+=1;modeled[str(row.get('modeled_frame'))]+=1
    elif stream=='public':assert row.get('event_kind')=='CLOCK_TICK' and row['clock']['to']>=row['clock']['from'];modeled['EXPLICIT_CLOCK_TICK_NOT_WIRE_FRAME']+=1
  streams[stream]={'chunks':len(paths),'records':count,'raw_NDJSON_bytes':raw_bytes,'gzip_bytes':gzip_bytes,'transport_labels':dict(transports),'modeled_frame_labels':dict(modeled)}
 assert streams['public']['records']==last['public_records']==2341 and streams['public']['raw_NDJSON_bytes']==last['public_raw_bytes']==4866859
 assert streams['synthetic-private']['records']==last['private_records']==114 and streams['synthetic-private']['raw_NDJSON_bytes']==last['private_raw_bytes']==106782
 assert streams['public']['gzip_bytes']==last['public_gzip_bytes']==278447 and streams['synthetic-private']['gzip_bytes']==last['private_gzip_bytes']==6596
 launcher=json.loads(z.read('launcher.json'));assert launcher['status']=='HARD_WALL_STOPPED_NOT_ACCEPTED' and launcher['terminal_exit']==137 and launcher['cleanup']=='completed'
 designv2=json.loads(z.read('input-snapshot/next/r100-v2-design.json'));descriptor=designv2['descriptor'];assert descriptor['seed_literal']=='venus:P05-AUTHOR-FULL-CYCLE-CPU-1:N8:online:CHAT_ON:T6:TD:R100' and designv2['attempts']==1
 cpu=sum(last['cpu_ms'].values());delta=last['wall_ms']-cpu
 # Current identity uses the documented inventory predicates without importing project code.
 excluded={'.git','node_modules','dist','__pycache__','.venv','.artifacts','coverage'};files={}
 for directory,names,namesfiles in os.walk(ROOT):
  names[:]=[n for n in names if n not in excluded and not(Path(directory)==ROOT/'.history' and n=='example')]
  for name in namesfiles:
   if name.endswith(('.pyc','.tsbuildinfo','.log')) or name=='.env' or(name.startswith('.env.') and name!='.env.example'):continue
   f=Path(directory)/name;r=f.relative_to(ROOT).as_posix()
   if r in {'FILE_MANIFEST.sha256','.docs/implementation/status.md'} or r.startswith(('.history/','.docs/implementation/evidence/','.docs/implementation/reviews/')) or re.fullmatch(r'\.docs/implementation/p\d{2}-registry\.json',r):continue
   files[r]=sha(f.read_bytes())
 identity=sha(json.dumps(files,sort_keys=True,separators=(',',':')).encode());assert identity.startswith('13b24714') and len(files)==1813,(identity,len(files))
 # Exact fixed descriptor arithmetic, not sample/selector execution.
 rounds={'C2_neutral':7*3*2*14*5050,'C2_private':7*3*2*14*2*5*5050,'invariants':7*14*100*5050,'fairness':1176000*20,'social':1764000*505//10,'exclusion':504000*505//10};assert sum(rounds.values())==220207400
result={'scope':'INDEPENDENT_STATIC_METHOD_AND_RETAINED_R100_AUDIT_NO_PRODUCT_IMPORT_OR_RUN','packets':{'proposal':pi,'accepted_design':di,'accepted_review':ri,'R100v2':rr},'primary_contract_pins_verified':6,'r100_zip_unique_members_verified':270,'r100_snapshot_inputs_verified':96,'r100_old_source_before_after_equal':True,'r100_streams':streams,'r100_last_completed':last,'r100_checkpoint_CPU_ms':cpu,'r100_unattributed_wall_minus_process_CPU_ms':delta,'r100_terminal':'HARD_WALL_STOPPED_NOT_ACCEPTED_137','r100_one_fixed_descriptor':descriptor,'current_source_identity':identity,'included_files':len(files),'conditional_requested_round_sum':rounds,'conditional_requested_round_total':sum(rounds.values()),'negative_cases_retained_separately':196,'gf_paired_opportunities':1000000,'runtime_cells':84,'source_or_producer_imports':0,'selector_sessions':0,'statistical_RUN':False,'Docker_actions':0,'source_writes':0}
OUT.joinpath('audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps({'packets':result['packets'],'raw_zip':270,'streams':streams,'current_identity':identity,'conditional_rounds':sum(rounds.values())}))
