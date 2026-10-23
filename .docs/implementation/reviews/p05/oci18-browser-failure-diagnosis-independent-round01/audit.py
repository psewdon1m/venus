from pathlib import Path
import json,hashlib,datetime
root=Path('C:/.projects/venus'); here=Path(__file__).resolve().parent
base=root/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05/venus-p05-oci-32fe8a4a2dfa'
producer=root/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05-compatible-rollback-producer18'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
b=read(base/'evidence/browser-terminal.json'); r=read(base/'runner.json'); t=read(base/'TERMINAL.json')
assert b['failed_step']=='B2_OBSERVER_PAGE_OPEN' and b['error']=={'name':'Error','code':None,'phase':'B2','source_module':'browser-child','source_line':46,'source_column':428}
line=(producer/'browser-child.mjs').read_text().splitlines()[45]
assert line[427:434]=='newPage' and 'const page=await context.newPage();' in line
assert line.index('context.newPage()')<line.index('page.clock.setFixedTime')<line.index('page.goto')<line.index("getByTestId('room-shell')")
assert b['page_errors']==0 and b['cleanup']=='completed' and b['gate_overflow'] is False
g=b['API_quiescence']; assert len(g)==4
assert all(not x['failure_latched'] and not x['counter_overflow'] for x in g)
assert g[0]['completed_current_GET200']==11 and g[1]['completed_current_GET200']==4 and g[2]['completed_current_GET200']==3 and g[3]['completed_current_GET200']==0
assert read(base/'evidence/phase-B2-ready.json')['status']=='READY_FOR_BROWSER_AND_STOP'
assert not (base/'evidence/browser-B2-ready.json').exists()
assert not (base/'evidence/phase-A3-ready.json').exists()
assert t['status']=='FAIL' and t['cleanup']=='retained_manual_cleanup_required'
assert t['first_error']=={'name':'AssertionError','code':'ERR_ASSERTION','phase':'B2','source_module':'bound-profile','source_line':68,'source_column':388}
assert t['phase_terminals'][0]['terminal']['status']=='PHASE_COMPLETE' and t['phase_terminals'][0]['terminal']['pool_closed']
assert t['phase_terminals'][1]['terminal']['status']=='FAIL' and t['phase_terminals'][1]['terminal']['pool_closed']
windows={x['phase']:x['elapsed_ms'] for x in r['resource']['phase_preflights']}
assert 120000<windows['cleanup']-windows['B2']<121000
assert r['resource']['status']=='PASS_QRB_BOUND_ONLY_PROFILE'
assert sha(base/'source-A1-before.json')==sha(base/'source-B2-before.json')==sha(base/'source-after-finally.json')
assert sha(base/'producer-A1-before.json')==sha(base/'producer-B2-before.json')==sha(base/'producer-after-finally.json')
assert read(base/'source-A1-before.json')['identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de'
for name in ['browser-child.mjs','host-runner.mjs','bound-profile.mjs','resource-lease.mjs']:
    assert (base/'inputs'/name).read_bytes()==(producer/name).read_bytes()
inspection=read(base/'logs/0043.json'); ci=json.loads(inspection['stdout'])[0]
assert ci['State']['Status']=='created' and ci['State']['Pid']==0
limits={k:ci['HostConfig'][k] for k in ['Memory','MemorySwap','PidsLimit','NanoCpus','Tmpfs','ShmSize']}
assert limits['Memory']==1536*1024**2 and limits['PidsLimit']==128 and limits['Tmpfs']=={'/tmp':'size=16m,mode=1777,exec'}
paths=[p for p in base.iterdir() if p.is_file()]+list((base/'evidence').iterdir())+list((base/'logs').iterdir())
paths += [producer/n for n in ['INDEX.json','browser-child.mjs','host-runner.mjs','bound-profile.mjs','resource-lease.mjs','scenarios.mjs']]
paths += [root/'.artifacts/p05-oci18-a15-run01.txt']
pins=[{'path':str(p.relative_to(root)).replace('\\','/'),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(set(paths))]
(here/'INPUT-PINS.json').write_text(json.dumps({'files':pins},indent=2)+'\n',encoding='utf-8')
out={'status':'DIAGNOSIS_OBSERVER_NATIVE_PAGE_CREATION_FAILED_CAUSE_UNRETAINED','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'new_native_actions':0,'actual_native_status':'FAIL','browser_failed_step':b['failed_step'],'browser_error':b['error'],'gate_counters':g,'limits_configured_only':limits,'live_pressure_or_browser_exit_proof':'NOT_RETAINED','B2_phase_until_cleanup_ms':windows['cleanup']-windows['B2'],'source_and_producer_before_after_exact':True,'host_guard_failure':'QRB_PHASE_WALL_LIMIT','application_or_credential_cause':'NOT_PROVEN','prospective_change':'Close completed host context after stop and game-state proof before observer page, dispose its gate, retain A/E contexts and all bounds/oracles.'}
(here/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':out['status'],'pinned_files':len(pins),'new_native_actions':0}))
