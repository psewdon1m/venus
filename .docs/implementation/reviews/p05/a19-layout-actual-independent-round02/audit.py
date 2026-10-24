from pathlib import Path
import json,hashlib,datetime,shutil
R=Path('C:/.projects/venus');O=Path(__file__).parent;S=R/'.artifacts/p05-pilot-bundle-source16';P=S/'.artifacts/p05/venus-v2-layout-01469562c377';C=S/'.artifacts/p05-v2-layout-producer-a19-02'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p)}
r=load(P/'layout-report.json');q=load(P/'runner.json');k=load(P/'keyboard-first-failure.json');before=load(P/'inputs-before.json');assert before==load(P/'inputs-after.json')and before['files']==load(R/'.artifacts/p05-pilot-bundle-source-freeze16.json')['files']and len(before['files'])==1873
assert r['status']==q['status']=='FAIL'and r['cleanup']==q['cleanup']=='PASS'and r['page_errors']==[]and r['cleanup_failures']==[];assert r['records'][0]['status']=='FAIL'and r['records'][0]['roles']==[]and sum(x['status']=='NOT_RUN'for x in r['records'])==50
assert r['failure']=={'name':'AssertionError','code':'KEYBOARD_FOCUS_OUTSIDE','source_module':'probe-policy','source_line':34,'source_column':162}and r['phase']['checkpoint']=='KEYBOARD_FOCUS'
assert k['sample_kind']=='ORIGINAL_FIRST_FOCUS_SAMPLE'and k['control']=='join-invite'and k['first_sample_present']and not k['truncated']and not k['in_viewport']and k['focus_visible']and k['not_occluded']and k['focus_contrast_sufficient']and not k['focus_contrast_unresolved']
assert k['rect']=={'left':33,'top':533.296875,'right':287,'bottom':584.890625,'width':254,'height':51.59375}and k['viewport']=={'width':320,'height':568}and k['scroll']=={'top':1176,'left':0}
captured=load(P/'producer-before.json')
for n,v in captured.items():
 if v['type']=='file':
  assert sha(P/'producer'/n)==v['sha256']
  if n.endswith('.mjs')or n in ['binding.json','DESIGN.md']:assert sha(C/n)==v['sha256']
assert q['producer_runtime_digest']=='276ab8558bc349c086602c77541e83e5ada844305fdb0eec1ca5fb9d24104395'
for name in ['containers','networks','volumes']:assert(P/f'remaining-{name}.txt').stat().st_size==0
prefix=R/'.artifacts/p05-layout-a19-02-webkit-ru';exit=load(Path(str(prefix)+'-run01.exit.json'));pf=load(Path(str(prefix)+'-preflight01.json'));assert exit['exit_code']==1 and pf['bounds']=='PASS';start=datetime.datetime.fromisoformat(exit['started_at'].replace('Z','+00:00'));end=datetime.datetime.fromisoformat(exit['finished_at'].replace('Z','+00:00'));age=(start-datetime.datetime.fromisoformat(pf['observed_at'])).total_seconds();assert 0<=age<=60
assert sha(R/'.docs/implementation/reviews/p05/a19-layout-actual-independent-round01/INDEX.json')=='66f0f1c31ec8e282b74a8667d8ee13082440c2d12f7a5627bf558753d9ba595c';assert sha(R/'.docs/implementation/reviews/p05/a19-layout02-webkit-window-lookup-independent-round01/INDEX.json')=='b1988535e7964376dbe446c2057bac141d508700eaf8ffeadee0d8aabe47978f'
main=(S/'apps/web/src/main.tsx').read_text(encoding='utf8');assert 'data-testid="join-invite" autoComplete="off" value={invite} onChange={e=>setInvite(e.target.value)} required' in main and 'return <main>'in main
safe=['runner.json','layout-report.json','keyboard-first-failure.json','fixture-diff.json','browser-tests.txt','compose-cleanup.txt','remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt'];dest=O/'failed-webkit-ru';dest.mkdir(exist_ok=True)
for n in safe:shutil.copyfile(P/n,dest/n)
for tail in ['-run01.txt','-run01.exit.json','-preflight01.json']:shutil.copyfile(Path(str(prefix)+tail),dest/('root'+tail))
pins={str(P/n):pin(P/n)for n in ['inputs-before.json','inputs-after.json','producer-before.json','producer/ROOT_RUN_ACK.json','harness-original.mjs','harness-derivative.mjs']}
for n in ['apps/web/src/main.tsx','apps/web/src/topic-games-panel.tsx','apps/web/src/room-shell.tsx','apps/web/src/style.css']:pins[str(S/n)]=pin(S/n)
for n in ['measure.mjs','dom-audit.mjs','probe-policy.mjs','x11.mjs']:pins[str(P/'producer'/n)]=pin(P/'producer'/n)
result={'status':'FAIL_PRODUCT_KEYBOARD_VIEWPORT_COMPONENT_ONLY','project':q['project'],'source_identity':q['source_identity'],'image':q['image'],'producer_runtime_digest':q['producer_runtime_digest'],'browser_version':r['browser_version'],'actual_FAIL_row':r['records'][0]['id'],'failure':r['failure'],'first_sample':k,'bottom_outside_viewport_px':k['rect']['bottom']-568,'beyond_original_2px_tolerance_px':k['rect']['bottom']-570,'old_window_lookup_failure_not_repeated_this_actual':True,'exact_UA_caret_scroll_or_settlement_cause':'UNKNOWN_NOT_MEASURED','permanent_clipping_or_unreachable_field':'NOT_PROVED','root_exit_code':1,'root_duration_seconds':(end-start).total_seconds(),'preflight_age_seconds':age,'cleanup':'PASS_OWNED_EMPTY','source_and_executed_producer_unchanged':True,'prior_A19_Chromium51_36typography_remains_qualified_component_only':True,'current_composite_counts':{'PASS':51,'FAIL':1,'NOT_RUN':407,'total':459},'typography_counts':{'PASS':36,'NOT_RUN':288,'total':324},'no_future_APP_revision_actual_acceptance':True,'new_reviewer_native_Docker_APP_source_producer_ACK_Git_actions':0,'pins':pins}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps({k:v for k,v in result.items()if k not in ['pins','first_sample']}))

