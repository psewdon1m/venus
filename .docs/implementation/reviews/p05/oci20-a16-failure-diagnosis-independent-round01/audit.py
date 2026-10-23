from pathlib import Path
import hashlib,json,datetime,collections
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
S=R/'.artifacts/p05-pilot-bundle-source13';N=S/'.artifacts/p05/venus-p05-oci-c17e7f47baae';P=S/'.artifacts/p05-compatible-rollback-producer20';B=R/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05-compatible-rollback-producer19'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(v,label):
 if not v:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,h):
 need(sha(p)==h,'index pin');pin(p);d=load(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**v}for n,v in files.items()]
 for v in files:
  q=p.parent/v['path'];need(sha(q)==v['sha256'],'index child '+v['path'])
  if 'bytes'in v:need(q.stat().st_size==v['bytes'],'child size')
 return len(files)
ackpath=R/'.artifacts/p05-a16-compatible-rollback20-root-ack01.json';need(sha(ackpath)=='ac5c33a63e088e27c9f5b0dc5951c393179033a39e6772b1b08bf7096e4a3aad','ACK');a=load(ackpath);need(a==load(N/'authority-ack.json'),'native authority exact');pin(ackpath)
need(sha(P/'INDEX.json')==a['producer_index_sha256']=='635fc10f721296e48e43b033949d81cefb6933e4bf141bfb1a7670cfa771989b','producer index');pin(P/'INDEX.json')
index(R/'.docs/implementation/reviews/p05/a16-oci-wire-layout-bindings-independent-round01/INDEX.json',a['independent_review_index_sha256'])
index(R/'.docs/implementation/reviews/p05/a16-image-host-linux-n4-independent-round01/INDEX.json',a['application_source_review_index_sha256'])
index(R/'.docs/implementation/reviews/p05/oci19-host-context-independent-round01/INDEX.json','3d3ff370769694fee2477f3541a1a45ff928ecc99a4a279c43d8b5e2a7ce5177')
source=[load(N/n)for n in ['source-A1-before.json','source-B2-before.json','source-after-finally.json']];f=load(R/'.artifacts/p05-pilot-bundle-source-freeze13.json')
need(source[0]==source[1]==source[2]and source[0]['files']==f['files']and len(f['files'])==1870,'source beforeafter1870')
for n,h in f['files'].items():need(sha(S/n)==h,'materialized source '+n)
prod=[load(N/n)for n in ['producer-A1-before.json','producer-B2-before.json','producer-after-finally.json']];need(prod[0]==prod[1]==prod[2]and len(prod[0])==369,'producer beforeafter369')
for n,v in prod[0].items():need(v['type']=='regular_file'and sha(P/n)==sha(N/'inputs'/n)==v['sha256']and(P/n).stat().st_size==v['bytes'],'producer/current/native input '+n)
mods=[p.relative_to(P)for p in P.rglob('*.mjs')];need(len(mods)==40 and all((P/n).read_bytes()==(B/n).read_bytes()for n in mods),'all40methodexact19')
t=load(N/'TERMINAL.json');r=load(N/'runner.json');exit=load(R/'.artifacts/p05-oci20-a16-run01.exit.json')
need(t['status']==r['status']=='FAIL'and exit['exit_code']==1,'nativeFAIL1');need(t['cleanup']==r['cleanup']=='retained_manual_cleanup_required'and t['cleanup_error']is None and t['export_error']is None,'retained successful export')
need(t['first_error']=={'name':'AssertionError','code':'ERR_ASSERTION','phase':'B2','source_module':'bound-profile','source_line':68,'source_column':388},'firsterror site')
line=(P/'bound-profile.mjs').read_text().splitlines()[67];need(line[387:].startswith("assert(performance.now()-this.windows.get(phase)")and"'QRB_PHASE_WALL_LIMIT'"in line,'phasewall exactcolumn')
ph=t['phase_terminals'];need(len(ph)==2 and ph[0]['phase']=='A1'and ph[0]['code']==0 and ph[0]['terminal']['status']=='PHASE_COMPLETE'and ph[0]['terminal']['pool_closed'],'A1complete')
need(ph[1]['phase']=='B2'and ph[1]['code']==1 and ph[1]['terminal']['pool_closed']and ph[1]['terminal']['error']=={'name':'Error','code':None,'phase':'B2','source_module':'api-child','source_line':19,'source_column':393},'B2childfail')
api=(P/'api-child.mjs').read_text();need(api.splitlines()[18][392:].startswith("Error('SCRIPTED_PHASE_DEADLINE')"),'childdeadline exactcolumn')
need(not list(N.rglob('browser-terminal.json'))and not(N/'evidence/browser-B2-ready.json').exists()and not(N/'evidence/phase-A3-ready.json').exists(),'no browserterminal B2ready A3')
narrow=load(N/'evidence/browser-narrowed-ready.json');need(narrow=={'status':'NARROWED_PRIVATE_CLEARED','API_quiescence':[{'held':True,'inflight_HTTP':0,'blocked_HTTP':0,'blocked_WS':0,'completed_current_GET200':6}]},'only retained gate counts')
need(load(N/'evidence/phase-B2-ready.json')=={'status':'READY_FOR_BROWSER_AND_STOP','phase':'B2'},'B2APIready')
host=(P/'host-runner.mjs').read_text();need(host.index('await exportEvidence();')<host.index("for(const[role,name]of [...names])"),'export before role stop');need("sourceAfter=true;report.browser=browserDone"in host and "source_producer_unchanged=sourceAfter===true"in host and r['source_producer_unchanged']is False,'unreached successflag')
need("await waitFile('browser-B2-ready.json');await stopAPI('B2')"in host,'STOP downstream browserready')
rem=t['remaining_owned'];need(rem==r['remaining_owned']==load(N/'owned-after-cleanup.json')and len(rem['containers'])==2 and len(rem['networks'])==1 and len(rem['volumes'])==4,'seven retained objects')
need(r['owner']=='58d4c07c1038a8c1d779c024d742f517'and r['project']=='venus-p05-oci-c17e7f47baae','owner/project')
need(len(r['controls'])==0 and not any(p['phase']=='A3'for p in ph),'no completed14/A3')
profile=r['resource']['profile'];need(profile['RSS_mib']['browser']==1536 and profile['cap_mib']==512 and profile['whole_ms']==900000,'separate budget scopes')
need(r['resource']['status']=='PASS_QRB_BOUND_ONLY_PROFILE'and r['resource']['failure']is None and line.index("'QRB_PHASE_WALL_LIMIT'")<line.index('try{'),'phase assertion outside resource latch')
samples=r['resource']['phase_preflights'];b2=next(v for v in samples if v['phase']=='B2');cl=next(v for v in samples if v['phase']=='cleanup');interval=cl['elapsed_ms']-b2['elapsed_ms'];need(interval>120000 and t['whole_elapsed_ms']<900000,'phase versus whole bound')
browser=(P/'browser-child.mjs').read_text();need("diagnosticStep='B2_HOST_CONTEXT_CLOSE';gates[2].dispose();await host.context().close();diagnosticStep='B2_OBSERVER_PAGE_OPEN'"in browser,'hostclose before observer')
need(browser.index("report.failed_step=diagnosticStep")<browser.index("finally{for(const gate")<browser.index("write('browser-terminal.json',report)"),'diagnostic only after cleanup')
pre=[]
for p in sorted((N/'logs').glob('*.json')):
 d=load(p)
 try:values=json.loads(d.get('stdout',''))
 except:continue
 if isinstance(values,list):
  for v in values:
   if isinstance(v,dict)and v.get('Config',{}).get('Labels',{}).get('com.venus.oci.role')=='browser':
    pre.append({'log':p.name,'state':{k:v.get('State',{}).get(k)for k in ['Running','OOMKilled','ExitCode','StartedAt','FinishedAt']},'memory_bytes':v['HostConfig']['Memory']})
need(len(pre)==1 and pre[0]['memory_bytes']==1536*1024**2 and pre[0]['state']['StartedAt']=='0001-01-01T00:00:00Z','browser inspect prestart only')
for p in N.rglob('*'):
 if p.is_file()and not p.relative_to(N).as_posix().startswith('inputs/'):pin(p)
for n in ['host-runner.mjs','browser-child.mjs','bound-profile.mjs','api-child.mjs','resource-lease.mjs','OPERATIONAL_REVISION20.json']:pin(P/n)
for n in ['.artifacts/p05-oci20-a16-run01.txt','.artifacts/p05-oci20-a16-run01.exit.json']:pin(R/n)
result={'status':'OBSERVED_OCI20_PHASE_TIMEOUT_BROWSER_SUBSTEP_UNRETAINED_NOT_APP_DEFECT_PROOF','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':a['source_identity'],'included_files':1870,'owner':r['owner'],'project':r['project'],'images':a['images'],'source_maps_exact':True,'producer369_maps_exact':True,'all40_MJS_exact19':True,
 'first_error':'B2_QRB_PHASE_WALL_LIMIT','B2_to_cleanup_ms':interval,'whole_ms':t['whole_elapsed_ms'],'A1':'PHASE_COMPLETE_POOL_CLOSED','B2':'API_READY_THEN_DOWNSTREAM_STOP_DEADLINE','A3':'NOT_RUN',
 'browser_terminal_exported':False,'current_browser_substep':'UNKNOWN_NOT_RETAINED','current_B2_gate_counts':'UNKNOWN_NOT_RETAINED','last_safe_gate_counts':narrow['API_quiescence'],'export_error':None,
 'export_timing':'BEFORE_BROWSER_ROLE_STOP_NO_POSTSTOP_EXPORT','retained_objects':{'containers':2,'networks':1,'volumes':4,'total':7},'browser_RSS_limit_MiB':1536,'artifact_cap_MiB':512,'terminal_OOM_state':'NOT_RETAINED_PRESTART_ONLY',
 'source_producer_unchanged_false':'UNREACHED_SUCCESS_FLAG_NOT_OBSERVED_BYTE_DRIFT','resource_summary_PASS':'DOES_NOT_WAIVE_PHASE_ASSERTION_OUTSIDE_LATCH','native_runs':False,'APP_method_ACK_edits':False,'full14_or_stage_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
